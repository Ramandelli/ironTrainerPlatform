import { WorkoutDay, Exercise, AerobicExercise } from '../types/workout';

interface AIGenerationParams {
  idade: number;
  peso: number;
  objetivo: string;
  diasSelecionados: string[];
}

interface AIRawExercise {
  name: string;
  sets: number;
  targetReps: string;
  restTime: number;
  hasDropset?: boolean;
  notes?: string;
}

interface AIRawAbdominal {
  name: string;
  sets: number;
  targetReps: string;
  restTime: number;
  isTimeBased?: boolean;
  isBilateral?: boolean;
  notes?: string;
}

interface AIRawAerobic {
  type: 'esteira' | 'bicicleta' | 'transport' | 'rowing';
  duration: number;
  intensity: 'leve' | 'moderada' | 'intensa';
  timing: 'antes' | 'depois';
}

interface AIRawWorkout {
  name: string;
  day: string;
  warmup?: string;
  exercises: AIRawExercise[];
  abdominal?: AIRawAbdominal[];
  aerobic?: AIRawAerobic;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function buildExercise(raw: AIRawExercise): Exercise {
  return {
    id: generateId('ex'),
    name: raw.name,
    sets: raw.sets || 3,
    targetReps: raw.targetReps || '10-12',
    restTime: raw.restTime || 90,
    hasDropset: raw.hasDropset || false,
    notes: raw.notes || '',
    completed: false,
    currentSet: 0,
    setData: [],
  };
}

function buildAbdominal(raw: AIRawAbdominal): Exercise {
  return {
    id: generateId('ab'),
    name: raw.name,
    sets: raw.sets || 3,
    targetReps: raw.targetReps || '15',
    restTime: raw.restTime || 60,
    isTimeBased: raw.isTimeBased || false,
    isBilateral: raw.isBilateral || false,
    notes: raw.notes || '',
    completed: false,
    currentSet: 0,
    setData: [],
  };
}

function buildAerobic(raw: AIRawAerobic): AerobicExercise {
  return {
    type: raw.type || 'esteira',
    duration: raw.duration || 15,
    intensity: raw.intensity || 'leve',
    timing: raw.timing || 'antes',
    completed: false,
  };
}

function buildWorkoutDay(raw: AIRawWorkout): WorkoutDay {
  return {
    id: generateId('custom'),
    name: raw.name,
    day: raw.day,
    warmup: raw.warmup,
    exercises: (raw.exercises || []).map(buildExercise),
    abdominal: raw.abdominal?.map(buildAbdominal),
    aerobic: raw.aerobic ? buildAerobic(raw.aerobic) : undefined,
  };
}

function extractJSON(text: string): string {
  // Try to find JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  throw new Error('Nenhum JSON válido encontrado na resposta da IA.');
}

export async function gerarTreinoIA(dados: AIGenerationParams): Promise<WorkoutDay[]> {
  const token = import.meta.env.VITE_HF_TOKEN;
  if (!token) {
    throw new Error('Token da Hugging Face não configurado. Adicione VITE_HF_TOKEN ao ambiente.');
  }

  const prompt = `Você é um personal trainer profissional especializado em divisão inteligente de grupos musculares e hipertrofia.

Crie um plano de treino APENAS para os seguintes dias:
${dados.diasSelecionados.join(", ")}

Regras obrigatórias:

Gere treinos somente para esses dias.
Divida os grupos musculares de forma inteligente.
Não repita o mesmo grupo muscular em dias consecutivos.
Inclua pelo menos 1 exercício abdominal em pelo menos 2 dias.
Inclua cardio leve ou moderado pelo menos 2 vezes na semana.
Respeite o objetivo informado.
Monte treinos realistas para um homem de ${dados.idade} anos e ${dados.peso}kg.

Dados do aluno:
Idade: ${dados.idade}
Peso: ${dados.peso}
Objetivo: ${dados.objetivo}

Responda APENAS em JSON válido no seguinte formato:

{
"treinos": [
{
"name": "Nome do treino",
"day": "Segunda-feira",
"warmup": "Descrição breve do aquecimento",
"exercises": [
{
"name": "Supino reto",
"sets": 4,
"targetReps": "8-12",
"restTime": 90,
"hasDropset": false,
"notes": ""
}
],
"abdominal": [
{
"name": "Prancha",
"sets": 3,
"targetReps": "30s",
"restTime": 60,
"isTimeBased": true,
"isBilateral": false,
"notes": ""
}
],
"aerobic": {
"type": "esteira",
"duration": 15,
"intensity": "leve",
"timing": "antes"
}
}
]
}

Não escreva nada antes ou depois do JSON.`;

  const response = await fetch(
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 4096,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('HuggingFace API error:', response.status, errorText);
    if (response.status === 503) {
      throw new Error('O modelo está carregando. Tente novamente em alguns segundos.');
    }
    throw new Error(`Erro na API da IA (${response.status}). Tente novamente.`);
  }

  const data = await response.json();
  const generatedText = data?.[0]?.generated_text;

  if (!generatedText) {
    throw new Error('A IA não retornou uma resposta válida. Tente novamente.');
  }

  const jsonStr = extractJSON(generatedText);
  let parsed: { treinos: AIRawWorkout[] };

  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('A resposta da IA não contém um JSON válido. Tente novamente.');
  }

  if (!parsed.treinos || !Array.isArray(parsed.treinos)) {
    throw new Error('Formato de resposta inválido. Tente novamente.');
  }

  return parsed.treinos.map(buildWorkoutDay);
}
