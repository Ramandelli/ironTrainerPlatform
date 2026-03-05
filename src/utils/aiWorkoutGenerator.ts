import { WorkoutDay, Exercise } from '../types/workout';
import { getAllExercisesGrouped, buildExerciseListForPrompt } from './exerciseDB';

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

// ---------- Main ----------

export async function gerarTreinoIA(
  dados: AIGenerationParams
): Promise<WorkoutDay[]> {
  const token = import.meta.env.VITE_GROQ_KEY;
  if (!token) {
    throw new Error('Chave da Groq não configurada. Adicione VITE_GROQ_KEY ao ambiente.');
  }

  // 1. Buscar exercícios da ExerciseDB (com cache)
  const exercisesByBodyPart = await getAllExercisesGrouped();
  const exerciseList = buildExerciseListForPrompt(exercisesByBodyPart);

  // 2. Montar prompts
  const systemPrompt = `Você é um personal trainer com 15 anos de experiência.
Responda APENAS com JSON puro. Nenhum texto, markdown, codeblock ou comentário fora do JSON.

Regras obrigatórias:
- Use SOMENTE exercícios da lista fornecida. NÃO invente exercícios.
- O campo "name" deve ser EXATAMENTE igual ao nome da lista fornecida (em inglês).
- Exercícios compostos (bench press, squat, deadlift, row) devem ser os principais de cada dia.
- Use drop-set APENAS em exercícios de isolamento (ex: curl, extension, fly).
- Use rest-pause na última série quando apropriado para intermediários e avançados.
- Sempre preencha "notes" com instruções de execução em português.
- Para iniciantes: 4-5 exercícios por dia, sem drop-set, sem rest-pause. Evite exercícios complexos.
- Para intermediários: 5-6 exercícios por dia.
- Para avançados: 6-8 exercícios por dia.
- Para idosos (>60 anos): evite exercícios de alto impacto, cargas pesadas e movimentos acima da cabeça.
- Para mulheres: priorize glúteos (upper legs), pernas e core (waist).
- Para homens: distribua equilibradamente entre todos os grupos.
- Não repita o mesmo exercício em dias diferentes.
- Varie os estímulos entre os dias.
- Divida grupos musculares de forma inteligente entre os dias.
- Não coloque grupos musculares sinérgicos juntos em excesso.`;

  const userPrompt = `Crie um plano de treino para: ${dados.diasSelecionados.join(', ')}

Perfil do aluno:
- Sexo: ${dados.sexo}
- Idade: ${dados.idade} anos
- Peso: ${dados.peso} kg
- Nível: ${dados.nivel}
- Objetivo: ${dados.objetivo}

Exercícios disponíveis (use APENAS estes nomes):
${exerciseList}

Responda APENAS com JSON neste formato exato:
{
  "days": [
    {
      "day": "Segunda-feira",
      "muscles": ["Peito", "Tríceps"],
      "exercises": [
        {
          "name": "bench press",
          "sets": 4,
          "reps": "8-10",
          "dropSet": false,
          "restPause": false,
          "notes": "Deitar no banco plano, descer a barra controladamente até o peito e empurrar de volta."
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
        temperature: 0.7,
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

  // 5. Converter para formato interno
  return parsed.days.map((day, i) => buildWorkoutDay(day, i));
}
