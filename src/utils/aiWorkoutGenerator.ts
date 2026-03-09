import { WorkoutDay, Exercise } from '../types/workout';
import {
  filterExercisesForProfile,
  buildExerciseListForPrompt,
  getExerciseNames,
  getSplitForProfile,
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

interface AIRawDay {
  day: string;
  muscles?: string[];
  exercises: AIRawExercise[];
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

function buildWorkoutDay(raw: AIRawDay, index: number): WorkoutDay {
  const exercises = (raw.exercises || []).map(buildExercise);
  const muscleLabel = raw.muscles?.join(' / ') || raw.day;

  return {
    id: generateId('custom'),
    name: `Treino ${String.fromCharCode(65 + index)} - ${muscleLabel}`,
    day: raw.day,
    warmup: 'Aquecimento geral: 5 min de mobilidade articular',
    exercises,
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

// ---------- Main ----------

export async function gerarTreinoIA(
  dados: AIGenerationParams
): Promise<WorkoutDay[]> {
  const token = import.meta.env.VITE_GROQ_KEY;
  if (!token) {
    throw new Error('Chave da Groq não configurada. Adicione VITE_GROQ_KEY ao ambiente.');
  }

  const level = mapLevel(dados.nivel);
  const numDias = dados.diasSelecionados.length;

  // 1. Filter exercises for user profile
  const filteredExercises = filterExercisesForProfile(level, dados.idade, dados.sexo, dados.objetivo);
  const exerciseList = buildExerciseListForPrompt(filteredExercises);
  const validNames = getExerciseNames();

  // 2. Get split and rules
  const split = getSplitForProfile(level, numDias);
  const muscleGroups = getMuscleGroupsForSplit(split.type, numDias);
  const distribution = rules.exerciseDistribution[level] || rules.exerciseDistribution['intermediate'];
  const techniqueRules = rules.techniqueRules[level] || rules.techniqueRules['intermediate'];
  const goalKey = rules.goalMapping[dados.objetivo] || 'hypertrophy';
  const repRanges = rules.repRanges[goalKey] || rules.repRanges['hypertrophy'];

  // 3. Build prompts
  const splitDescription = muscleGroups.map((g, i) => `Dia ${i + 1} (${dados.diasSelecionados[i]}): ${g.label} — músculos: ${g.muscles.join(', ')}`).join('\n');

  const systemPrompt = `Você é um personal trainer com 15 anos de experiência.
Responda APENAS com JSON puro. Nenhum texto, markdown, codeblock ou comentário fora do JSON.

REGRA ABSOLUTA:
- Use SOMENTE exercícios da lista fornecida. NÃO INVENTE exercícios.
- O campo "name" deve conter o nome EXATO do exercício como aparece na lista.
- Se precisar de um exercício que não está na lista, escolha o mais próximo que ESTIVER na lista.

DIVISÃO DE TREINO: ${split.label} (${split.description})
${splitDescription}

DISTRIBUIÇÃO POR DIA:
- Exercícios compostos principais: ${distribution.compound_main}
- Exercícios compostos secundários: ${distribution.compound_secondary}
- Exercícios isoladores: ${distribution.isolation}
- Total: ${distribution.total} exercícios por dia

FAIXAS DE REPETIÇÃO (objetivo: ${goalKey}):
- Compostos principais: ${repRanges.compound_main}
- Compostos secundários: ${repRanges.compound_secondary}
- Isoladores: ${repRanges.isolation}

TÉCNICAS AVANÇADAS:
- rest_pause permitidos por treino: ${techniqueRules.rest_pause}
- drop_set permitidos por treino: ${techniqueRules.drop_set}
- drop_set SOMENTE em exercícios isolation. NUNCA em compound_main.
- Se o nível é beginner, NÃO use técnicas (technique: null para todos).

REGRAS ADICIONAIS:
- Para mulheres: priorize exercícios de glúteos, pernas e core.
- Para idosos (>60 anos): evite exercícios com alta fadiga, prefira máquinas.
- Não repita o mesmo exercício em dias diferentes.
- Compostos principais sempre primeiro no dia.
- Cada exercício na lista inclui [categoria, equipamento, S:stimulus/F:fatigue]. Respeite os limites.`;

  const userPrompt = `Crie um plano de treino para: ${dados.diasSelecionados.join(', ')}

Perfil:
- Sexo: ${dados.sexo}
- Idade: ${dados.idade} anos
- Peso: ${dados.peso} kg
- Nível: ${dados.nivel} (${level})
- Objetivo: ${dados.objetivo} (${goalKey})

Exercícios disponíveis (use APENAS desta lista, nome EXATO):
${exerciseList}

Responda APENAS com JSON neste formato:
{
  "split": "${split.type}",
  "workouts": [
    {
      "day": "${dados.diasSelecionados[0]}",
      "muscles": ["Peito", "Tríceps"],
      "exercises": [
        {
          "name": "Supino reto barra",
          "sets": 4,
          "reps": "6-10",
          "technique": null
        }
      ]
    }
  ]
}`;

  // 4. Call Groq
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

  // 5. Parse JSON
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

  // 6. Validate — remove exercises not in local database
  for (const day of workouts) {
    day.exercises = day.exercises.filter((ex) => {
      const isValid = validNames.has(ex.name.toLowerCase());
      if (!isValid) {
        console.warn(`[AI Generator] Exercício removido (não encontrado no banco local): "${ex.name}"`);
      }
      return isValid;
    });
  }

  // 7. Convert to internal format
  return workouts.map((day, i) => buildWorkoutDay(day, i));
}
