import { WorkoutDay, Exercise, AerobicExercise } from '../types/workout';
import {
  filterExercisesForProfile,
  buildExerciseListForPrompt,
  getExerciseNames,
  getSplitForProfile,
  getSplitLabel,
  getMuscleGroupsForSplit,
  rules,
  LocalExercise,
} from '../services/exerciseDatabase';

// ---------- Types ----------

interface AIGenerationParams {
  idade: number;
  peso: number;
  sexo: string;
  nivel: string;
  objetivo: string;
  diasSelecionados: string[];
}

interface AIRawExercise {
  name: string;
  sets: number;
  reps: string;
  technique: string | null;
  notes?: string;
}

interface AIRawAbsExercise {
  name: string;
  sets: number;
  reps?: number;
  duration_seconds?: number;
  per_side?: boolean;
}

interface AIRawCardio {
  type: 'esteira' | 'bicicleta';
  duration_minutes: number;
  intensity: 'leve' | 'moderado' | 'intenso';
}

interface AIRawDay {
  day: string;
  muscles?: string[];
  exercises: AIRawExercise[];
  absExercises?: AIRawAbsExercise[];
  cardio?: AIRawCardio;
}

// ---------- Helpers ----------

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function buildExercise(raw: AIRawExercise): Exercise {
  return {
    id: generateId('ex'),
    name: raw.name || 'Exercício',
    sets: raw.sets || 3,
    targetReps: raw.reps || '10-12',
    restTime: 90,
    hasDropset: raw.technique === 'drop_set',
    restPause: raw.technique === 'rest_pause',
    notes: raw.notes || '',
    completed: false,
    currentSet: 0,
    setData: [],
  };
}

function buildAbsExercise(raw: AIRawAbsExercise): Exercise {
  const isTimeBased = !!raw.duration_seconds;
  return {
    id: generateId('abs'),
    name: raw.name || 'Abdominal',
    sets: raw.sets || 3,
    targetReps: isTimeBased ? undefined : String(raw.reps || 15),
    isTimeBased,
    timePerSet: isTimeBased ? raw.duration_seconds : undefined,
    isBilateral: raw.per_side || false,
    restTime: 30,
    completed: false,
    currentSet: 0,
    setData: [],
  };
}

function buildAerobic(raw: AIRawCardio): AerobicExercise {
  const intensityMap: Record<string, 'leve' | 'moderada' | 'intensa'> = {
    leve: 'leve',
    moderado: 'moderada',
    intenso: 'intensa',
  };
  return {
    type: raw.type === 'bicicleta' ? 'bicicleta' : 'esteira',
    duration: raw.duration_minutes || 20,
    intensity: intensityMap[raw.intensity] || 'moderada',
    timing: 'depois',
    completed: false,
  };
}

function buildWorkoutDay(raw: AIRawDay, index: number): WorkoutDay {
  const exercises = (raw.exercises || []).map(buildExercise);
  const abdominal = (raw.absExercises || []).map(buildAbsExercise);
  const aerobic = raw.cardio ? buildAerobic(raw.cardio) : undefined;
  const muscleLabel = raw.muscles?.join(' / ') || raw.day;

  return {
    id: generateId('custom'),
    name: `Treino ${String.fromCharCode(65 + index)} - ${muscleLabel}`,
    day: raw.day,
    warmup: 'Aquecimento geral: 5 min de mobilidade articular',
    exercises,
    abdominal: abdominal.length > 0 ? abdominal : undefined,
    aerobic,
  };
}

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return match[0];
  throw new Error('Nenhum JSON válido encontrado na resposta da IA.');
}

// ---------- Level mapping ----------

function mapLevel(nivel: string): string {
  const map: Record<string, string> = {
    iniciante: 'beginner',
    intermediario: 'intermediate',
    avancado: 'advanced',
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
  };
  return map[nivel] || 'intermediate';
}

function mapGoal(objetivo: string): string {
  const map: Record<string, string> = {
    hipertrofia: 'hypertrophy',
    emagrecimento: 'fat_loss',
    forca: 'strength',
    hypertrophy: 'hypertrophy',
    fat_loss: 'fat_loss',
    strength: 'strength',
  };
  return map[objetivo] || 'hypertrophy';
}

// ---------- Cardio instruction ----------

function buildCardioInstruction(goalKey: string, level: string, peso: number, idade: number, numDias: number): string {
  if (goalKey === 'fat_loss') {
    let durationHint: string;
    if (level === 'beginner') {
      durationHint = '15-20 minutos, intensidade moderada';
      if (peso > 100 || idade > 50) durationHint = '10-15 minutos, intensidade leve';
    } else if (level === 'intermediate') {
      durationHint = '20-30 minutos, intensidade moderada';
    } else {
      durationHint = '30-40 minutos, intensidade moderada a intensa';
    }
    return `CARDIO OBRIGATÓRIO (objetivo: emagrecimento):
- TODOS os dias de treino DEVEM conter a seção "cardio".
- Tipo: "esteira" ou "bicicleta" — ALTERNE entre os dias (não repita o mesmo tipo em dias consecutivos).
- Sugestão para este perfil: ${durationHint}.
- Considere peso (${peso}kg) e idade (${idade} anos) ao definir duração e intensidade.`;
  }

  const maxCardioDays = Math.min(3, Math.max(2, Math.floor(numDias / 2)));
  return `CARDIO OPCIONAL (objetivo: ${goalKey}):
- Inclua cardio em NO MÁXIMO ${maxCardioDays} dos ${numDias} dias de treino (não todos os dias).
- Duração curta: 10-15 minutos.
- Se incluir em mais de 1 dia, ALTERNE entre "esteira" e "bicicleta".
- Não é obrigatório, mas recomendado.`;
}

// ---------- Abs instruction ----------

function buildAbsInstruction(coreExercises: LocalExercise[]): string {
  const names = coreExercises.map((e) => e.name).join(', ');
  return `SEÇÃO DE ABDOMINAIS (absExercises):
- Exercícios de core/abdominal NUNCA devem aparecer em "exercises" (musculação principal).
- Coloque-os APENAS na seção "absExercises" de cada dia.
- Escolha entre 1 e 2 exercícios de core por dia (NUNCA mais que 2).
- Cada exercício abdominal deve ter exatamente 3 séries.
- Exercícios disponíveis: ${names}
- Formato:
  a) Por repetição: { "name": "...", "sets": 3, "reps": 15 }
  b) Por tempo: { "name": "Prancha", "sets": 3, "duration_seconds": 30 }
- Se o exercício for unilateral, adicione "per_side": true.
- Exercícios de tempo sugeridos: Prancha.
- Demais exercícios de core: usar repetição.
- Varie os exercícios de core entre os dias.`;
}

// ---------- Main ----------

export async function gerarTreinoIA(
  dados: AIGenerationParams
): Promise<WorkoutDay[]> {
  const token = import.meta.env.VITE_GROQ_KEY;
  if (!token) {
    throw new Error('Chave da Groq não configurada. Adicione VITE_GROQ_KEY ao ambiente.');
  }

  const level = mapLevel(dados.nivel);
  const goalKey = mapGoal(dados.objetivo);
  const numDias = dados.diasSelecionados.length;

  // 1. Filter exercises — separate core from main
  const allFiltered = filterExercisesForProfile(level, dados.idade, dados.sexo, dados.objetivo);
  const mainExercises = allFiltered.filter((e) => e.primaryMuscle !== 'core' && e.category !== 'core');
  const coreExercises = allFiltered.filter((e) => e.primaryMuscle === 'core' || e.category === 'core');

  const exerciseList = buildExerciseListForPrompt(mainExercises);
  const validNames = getExerciseNames();

  // 2. Get split and rules
  const splitType = getSplitForProfile(level, numDias);
  const splitLabel = getSplitLabel(splitType);
  const muscleGroups = getMuscleGroupsForSplit(splitType, numDias);

  const r = rules.rules;
  const sel = r.exerciseSelection;
  const techs = r.techniques[level] || r.techniques['intermediate'];
  const setsReps = r.setsReps[goalKey] || r.setsReps['hypertrophy'];

  // 3. Build technique instruction
  let techniqueInstruction: string;
  if (techs.allow === false) {
    techniqueInstruction = 'NÃO use técnicas avançadas (technique: null para todos).';
  } else {
    techniqueInstruction = `Inclua exatamente:
- ${techs.restPause || 0} exercício(s) com "technique": "rest_pause" (em compound_secondary ou compound_main)
- ${techs.dropSetIsolation || 0} exercício(s) com "technique": "drop_set" (SOMENTE em isolation)
- drop_set NUNCA em compound_main.`;
  }

  // 4. Build split description
  const splitDescription = muscleGroups.map((g, i) =>
    `Dia ${i + 1} (${dados.diasSelecionados[i]}): ${g.label} — músculos: ${g.muscles.join(', ')}`
  ).join('\n');

  // 5. Cardio & abs instructions
  const cardioInstruction = buildCardioInstruction(goalKey, level, dados.peso, dados.idade, numDias);
  const absInstruction = buildAbsInstruction(coreExercises);

  const systemPrompt = `Você é um personal trainer com 15 anos de experiência.
Responda APENAS com JSON puro. Nenhum texto, markdown, codeblock ou comentário fora do JSON.

REGRA ABSOLUTA:
- Use SOMENTE exercícios da lista fornecida. NÃO INVENTE exercícios.
- O campo "name" deve conter o nome EXATO do exercício como aparece na lista.
- Se precisar de um exercício que não está na lista, escolha o mais próximo que ESTIVER na lista.

REGRA DE SEPARAÇÃO CORE vs MUSCULAÇÃO:
- Exercícios de core/abdominal (primaryMuscle = "core") NUNCA devem aparecer em "exercises".
- Eles devem aparecer APENAS em "absExercises".
- A seção "exercises" deve conter SOMENTE exercícios de musculação (peito, costas, pernas, ombro, biceps, triceps, etc).

DIVISÃO DE TREINO: ${splitLabel} (${splitType})
${splitDescription}

DISTRIBUIÇÃO POR DIA (seção "exercises" — apenas musculação):
- Exercícios compostos principais: ${sel.compoundMainPerWorkout}
- Exercícios compostos secundários: ${sel.compoundSecondaryPerWorkout}
- Exercícios isoladores: ${sel.isolationPerWorkout}
- Total: ${sel.minExercisesPerWorkout}-${sel.maxExercisesPerWorkout} exercícios por dia
- Máximo 2 exercícios para o mesmo músculo por treino.
- NÃO inclua exercícios de core na contagem acima.

LIMITES:
- Estímulo total máximo por treino: ${r.stimulusControl.maxTotalStimulusPerWorkout}
- Fadiga total máxima por treino: ${r.stimulusControl.maxTotalFatiguePerWorkout}
- Evitar múltiplos exercícios com fadiga 5 no mesmo treino.

FAIXAS DE REPETIÇÃO (objetivo: ${goalKey}):
- Compostos principais: ${setsReps.compoundMain.sets} séries x ${setsReps.compoundMain.reps} reps
- Compostos secundários: ${setsReps.compoundSecondary.sets} séries x ${setsReps.compoundSecondary.reps} reps
- Isoladores: ${setsReps.isolation.sets} séries x ${setsReps.isolation.reps} reps

TÉCNICAS AVANÇADAS:
${techniqueInstruction}

${cardioInstruction}

${absInstruction}

REGRAS ADICIONAIS:
- Para mulheres: priorize exercícios de glúteos, pernas e core.
- Para idosos (>40 anos): evite exercícios com fadiga 5, prefira máquinas.
- Não repita o mesmo exercício em dias diferentes.
- Compostos principais sempre primeiro no dia.`;

  const userPrompt = `Crie um plano de treino para: ${dados.diasSelecionados.join(', ')}

Perfil:
- Sexo: ${dados.sexo}
- Idade: ${dados.idade} anos
- Peso: ${dados.peso} kg
- Nível: ${dados.nivel} (${level})
- Objetivo: ${dados.objetivo} (${goalKey})

Exercícios de MUSCULAÇÃO disponíveis (use APENAS desta lista, nome EXATO — NÃO inclua core aqui):
${exerciseList}

Exercícios de CORE/ABDOMINAL disponíveis (use APENAS na seção absExercises):
${coreExercises.map((e) => e.name).join(', ')}

Responda APENAS com JSON neste formato EXATO:
{
  "split": "${splitType}",
  "workouts": [
    {
      "day": "${dados.diasSelecionados[0]}",
      "muscles": ["Peito", "Tríceps"],
      "exercises": [
        {
          "name": "Supino reto com barra",
          "sets": 4,
          "reps": "6-10",
          "technique": null
        }
      ],
      "absExercises": [
        { "name": "Abdominal crunch", "sets": 3, "reps": 15 },
        { "name": "Prancha", "sets": 3, "duration_seconds": 30 }
      ],
      "cardio": {
        "type": "esteira",
        "duration_minutes": 20,
        "intensity": "moderado"
      }
    }
  ]
}

IMPORTANTE:
- "exercises" = SOMENTE musculação. NENHUM exercício de core aqui.
- "absExercises" = SOMENTE exercícios de core/abdominal.
- "cardio" = seção separada de cardio.${goalKey === 'fat_loss' ? ' OBRIGATÓRIO para emagrecimento.' : ''}`;

  // 6. Call Groq
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', response.status, errorText);
    if (response.status === 429) {
      throw new Error('Limite de requisições atingido. Tente novamente em alguns segundos.');
    }
    throw new Error(`Erro na API da IA (${response.status}). Tente novamente.`);
  }

  const data = await response.json();
  const generatedText = data?.choices?.[0]?.message?.content;

  if (!generatedText) {
    throw new Error('A IA não retornou uma resposta válida. Tente novamente.');
  }

  // 7. Parse JSON
  const jsonStr = extractJSON(generatedText);
  let parsed: { split?: string; workouts?: AIRawDay[]; days?: AIRawDay[] };

  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('A resposta da IA não contém um JSON válido. Tente novamente.');
  }

  const workouts = parsed.workouts || parsed.days;
  if (!workouts || !Array.isArray(workouts)) {
    throw new Error('Formato de resposta inválido. Tente novamente.');
  }

  // 8. Validate — remove exercises not in local database & enforce core separation
  const coreNames = new Set(coreExercises.map((e) => e.name.toLowerCase()));

  for (const day of workouts) {
    // Remove invalid exercises and any core exercises that leaked into main
    day.exercises = day.exercises.filter((ex) => {
      const nameLower = ex.name.toLowerCase();
      if (coreNames.has(nameLower)) {
        console.warn(`[AI Generator] Core exercise moved out of main: "${ex.name}"`);
        // Move to absExercises if not already there
        if (!day.absExercises) day.absExercises = [];
        day.absExercises.push({ name: ex.name, sets: ex.sets, reps: parseInt(ex.reps) || 15 });
        return false;
      }
      const isValid = validNames.has(nameLower);
      if (!isValid) {
        console.warn(`[AI Generator] Exercício removido (não encontrado no banco local): "${ex.name}"`);
      }
      return isValid;
    });

    // Validate abs exercises — max 2 per day, 3 sets each
    if (day.absExercises) {
      day.absExercises = day.absExercises.filter((ex) => {
        const isValid = validNames.has(ex.name.toLowerCase());
        if (!isValid) {
          console.warn(`[AI Generator] Abdominal removido (não encontrado): "${ex.name}"`);
        }
        return isValid;
      });
      // Enforce max 2 abs exercises per day
      if (day.absExercises.length > 2) {
        day.absExercises = day.absExercises.slice(0, 2);
      }
      // Enforce 3 sets each
      day.absExercises.forEach((ex) => { ex.sets = 3; });
    }
  }

  // 9. Convert to internal format
  return workouts.map((day, i) => buildWorkoutDay(day, i));
}
