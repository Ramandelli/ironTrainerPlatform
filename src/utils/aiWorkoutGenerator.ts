import { WorkoutDay, Exercise } from '../types/workout';
import { getAllExercisesGrouped, buildExerciseListForPrompt, filterExercisesByLevel, translateEquipment, ExerciseDBItem } from './exerciseDB';

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
  dropSet: boolean;
  restPause: boolean;
  notes: string;
  equipment?: string;
}

interface AIRawDay {
  day: string;
  muscles: string[];
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
    hasDropset: raw.dropSet || false,
    restPause: raw.restPause || false,
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

// ---------- Split logic ----------

function getSplitInstruction(nivel: string, numDias: number): string {
  if (nivel === 'iniciante') {
    if (numDias <= 3) {
      return `DIVISÃO OBRIGATÓRIA: Full Body. Cada dia treina todos os grupos musculares principais (peito, costas, ombros, pernas, core). Distribua exercícios compostos em cada sessão.`;
    }
    return `DIVISÃO OBRIGATÓRIA: Upper/Lower (Alternado). Dias alternados entre membros superiores (peito, costas, ombros, braços) e membros inferiores (quadríceps, glúteos, isquiotibiais, panturrilha, core).`;
  }

  if (nivel === 'intermediario') {
    if (numDias <= 3) {
      return `DIVISÃO SUGERIDA: Push/Pull/Legs ou Full Body, conforme melhor se encaixar.`;
    }
    if (numDias === 4) {
      return `DIVISÃO SUGERIDA: Upper/Lower (2x cada) ou Push/Pull/Legs + Full Body.`;
    }
    return `DIVISÃO OBRIGATÓRIA: Divisão muscular clássica. Cada dia foca em 1-2 grupos musculares específicos (ex: Peito/Tríceps, Costas/Bíceps, Pernas, Ombros/Abdômen, etc).`;
  }

  // avançado
  if (numDias <= 3) {
    return `DIVISÃO SUGERIDA: Push/Pull/Legs.`;
  }
  if (numDias === 4) {
    return `DIVISÃO SUGERIDA: Upper/Lower (2x cada).`;
  }
  return `DIVISÃO OBRIGATÓRIA: Divisão muscular clássica avançada. Cada dia foca em 1-2 grupos musculares com alto volume (ex: Peito, Costas, Pernas, Ombros/Trapézio, Braços).`;
}

// ---------- Techniques ----------

function getTechniqueInstruction(nivel: string): string {
  if (nivel === 'iniciante') {
    return `TÉCNICAS: NÃO use drop-set nem rest-pause. Foque em execução correta com carga moderada. Todos os exercícios devem ter dropSet: false e restPause: false.`;
  }

  return `TÉCNICAS OBRIGATÓRIAS:
- Inclua pelo menos 1 exercício com restPause: true por dia de treino (preferencialmente no último exercício composto).
- Inclua 1 ou 2 exercícios com dropSet: true por dia de treino (APENAS em exercícios isoladores como curl, extension, fly, raise, pushdown).
- NÃO aplique drop-set em exercícios compostos (squat, deadlift, bench press, row).`;
}

// ---------- Validation ----------

function buildExerciseNameSet(exercises: Record<string, ExerciseDBItem[]>): Set<string> {
  const names = new Set<string>();
  for (const exList of Object.values(exercises)) {
    for (const ex of exList) {
      names.add(ex.name.toLowerCase());
    }
  }
  return names;
}

// ---------- Main ----------

export async function gerarTreinoIA(
  dados: AIGenerationParams
): Promise<WorkoutDay[]> {
  const token = import.meta.env.VITE_GROQ_KEY;
  if (!token) {
    throw new Error('Chave da Groq não configurada. Adicione VITE_GROQ_KEY ao ambiente.');
  }

  // 1. Buscar exercícios da ExerciseDB (com cache) e filtrar por nível
  const allExercises = await getAllExercisesGrouped();
  const filteredExercises = filterExercisesByLevel(allExercises, dados.nivel);
  const exerciseList = buildExerciseListForPrompt(filteredExercises);
  const validNames = buildExerciseNameSet(filteredExercises);

  const numDias = dados.diasSelecionados.length;
  const splitInstruction = getSplitInstruction(dados.nivel, numDias);
  const techniqueInstruction = getTechniqueInstruction(dados.nivel);

  // 2. Montar prompts
  const systemPrompt = `Você é um personal trainer com 15 anos de experiência.
Responda APENAS com JSON puro. Nenhum texto, markdown, codeblock ou comentário fora do JSON.

REGRA DE SEGURANÇA ABSOLUTA:
- Use SOMENTE exercícios da lista fornecida abaixo. NÃO INVENTE exercícios.
- Se precisar de um exercício que não está na lista, escolha o mais próximo que ESTIVER na lista.
- O campo "name" deve conter o nome ORIGINAL em inglês do exercício (exatamente como aparece na lista).
- O campo "notes" deve conter o nome traduzido para português + instruções de execução.
- Cada exercício na lista inclui o equipamento entre parênteses. Use essa informação para evitar combinações impossíveis.

${splitInstruction}

${techniqueInstruction}

Regras adicionais:
- Exercícios compostos (bench press, squat, deadlift, row) devem ser os principais de cada dia.
- Para iniciantes: 4-5 exercícios por dia.
- Para intermediários: 5-6 exercícios por dia.
- Para avançados: 6-8 exercícios por dia.
- Para idosos (>60 anos): evite exercícios de alto impacto, cargas pesadas e movimentos acima da cabeça.
- Para mulheres: priorize glúteos (upper legs), pernas e core (waist).
- Para homens: distribua equilibradamente entre todos os grupos.
- Não repita o mesmo exercício em dias diferentes.
- Varie os estímulos entre os dias.`;

  const userPrompt = `Crie um plano de treino para: ${dados.diasSelecionados.join(', ')}

Perfil do aluno:
- Sexo: ${dados.sexo}
- Idade: ${dados.idade} anos
- Peso: ${dados.peso} kg
- Nível: ${dados.nivel}
- Objetivo: ${dados.objetivo}

Exercícios disponíveis (use APENAS exercícios desta lista, com o nome EXATO em inglês):
${exerciseList}

Responda APENAS com JSON neste formato exato:
{
  "days": [
    {
      "day": "Segunda-feira",
      "muscles": ["Peito", "Tríceps"],
      "exercises": [
        {
          "name": "barbell bench press",
          "sets": 4,
          "reps": "8-10",
          "dropSet": false,
          "restPause": false,
          "notes": "Supino Reto com Barra — Deitar no banco plano, descer a barra controladamente até o peito e empurrar de volta."
        }
      ]
    }
  ]
}`;

  // 3. Chamar Groq
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

  // 4. Extrair e parsear JSON
  const jsonStr = extractJSON(generatedText);
  let parsed: { days: AIRawDay[] };

  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('A resposta da IA não contém um JSON válido. Tente novamente.');
  }

  if (!parsed.days || !Array.isArray(parsed.days)) {
    throw new Error('Formato de resposta inválido. Tente novamente.');
  }

  // 5. Validar e traduzir exercícios — remover inventados, traduzir nomes
  const allExercisesFlat = Object.values(filteredExercises).flat();

  for (const day of parsed.days) {
    day.exercises = day.exercises.filter((ex) => {
      const isValid = validNames.has(ex.name.toLowerCase());
      if (!isValid) {
        console.warn(`[AI Generator] Exercício removido (não encontrado na ExerciseDB): "${ex.name}"`);
      }
      return isValid;
    });

    // Traduzir nomes para português
    for (const ex of day.exercises) {
      const dbMatch = allExercisesFlat.find(
        (db) => db.name.toLowerCase() === ex.name.toLowerCase()
      );
      if (dbMatch) {
        const equipPt = translateEquipment(dbMatch.equipment);
        // Usar o nome traduzido do notes se disponível, senão capitalizar o original
        const notesMatch = ex.notes?.match(/^([^—–\-]+)/);
        const translatedName = notesMatch?.[1]?.trim() || capitalizeWords(ex.name);
        ex.name = `${translatedName} (${equipPt})`;
      }
    }
  }

  // 6. Converter para formato interno
  return parsed.days.map((day, i) => buildWorkoutDay(day, i));
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
