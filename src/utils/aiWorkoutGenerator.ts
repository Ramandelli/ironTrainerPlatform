import { WorkoutDay, Exercise, AerobicExercise } from '../types/workout';

// ---------- Types ----------

interface AIGenerationParams {
  idade: number;
  peso: number;
  sexo: string;
  nivel: string;
  objetivo: string;
  diasSelecionados: string[];
}

interface AIRawCardio {
  enabled: boolean;
  type?: string;
  intensity?: string;
  durationMinutes?: number;
  moment?: string;
}

interface AIRawMainExercise {
  stimulus: string;
  sets: number;
  targetReps: string;
  restSeconds: number;
  hasDropSet?: boolean;
}

interface AIRawAbs {
  enabled: boolean;
  nameSuggestion?: string;
  sets?: number;
  repetitions?: number | null;
  isTimeBased?: boolean;
  secondsPerSet?: number;
  isBilateral?: boolean;
  restSeconds?: number;
}

interface AIRawDay {
  day: string;
  cardio?: AIRawCardio;
  mainExercises: AIRawMainExercise[];
  abs?: AIRawAbs;
}

// ---------- Constants ----------

const VALID_CARDIO_TYPES: Record<string, AerobicExercise['type']> = {
  'esteira': 'esteira',
  'treadmill': 'esteira',
  'transport': 'transport',
  'elíptico': 'transport',
  'eliptico': 'transport',
  'rowing': 'rowing',
  'remo': 'rowing',
};

const VALID_INTENSITIES: AerobicExercise['intensity'][] = ['leve', 'moderada', 'intensa'];
const VALID_TIMINGS: AerobicExercise['timing'][] = ['antes', 'depois'];

// ---------- Helpers ----------

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeCardioType(raw?: string): AerobicExercise['type'] {
  if (!raw) return 'esteira';
  const key = raw.toLowerCase().trim();
  // Block bicicleta
  if (key.includes('bicicleta') || key.includes('bike') || key.includes('cycling')) {
    return 'esteira';
  }
  return VALID_CARDIO_TYPES[key] || 'esteira';
}

function sanitizeIntensity(raw?: string): AerobicExercise['intensity'] {
  if (!raw) return 'moderada';
  const lower = raw.toLowerCase().trim();
  if (VALID_INTENSITIES.includes(lower as AerobicExercise['intensity'])) {
    return lower as AerobicExercise['intensity'];
  }
  return 'moderada';
}

function sanitizeTiming(raw?: string): AerobicExercise['timing'] {
  if (!raw) return 'antes';
  const lower = raw.toLowerCase().trim();
  if (VALID_TIMINGS.includes(lower as AerobicExercise['timing'])) {
    return lower as AerobicExercise['timing'];
  }
  return 'antes';
}

// ---------- Builders ----------

function buildExerciseFromStimulus(raw: AIRawMainExercise): Exercise {
  return {
    id: generateId('ex'),
    name: raw.stimulus || 'Exercício',
    sets: raw.sets || 3,
    targetReps: raw.targetReps || '10-12',
    restTime: raw.restSeconds || 90,
    hasDropset: raw.hasDropSet || false,
    notes: '',
    completed: false,
    currentSet: 0,
    setData: [],
  };
}

function buildAbdominal(raw: AIRawAbs): Exercise | null {
  if (!raw.enabled) return null;

  const isTime = raw.isTimeBased === true;

  return {
    id: generateId('ab'),
    name: raw.nameSuggestion || 'Abdominal',
    sets: raw.sets || 3,
    targetReps: isTime
      ? `${raw.secondsPerSet || 30}s`
      : `${raw.repetitions || 15}`,
    restTime: raw.restSeconds || 60,
    isTimeBased: isTime,
    timePerSet: isTime ? (raw.secondsPerSet || 30) : undefined,
    isBilateral: raw.isBilateral || false,
    notes: '',
    completed: false,
    currentSet: 0,
    setData: [],
  };
}

function buildAerobic(raw: AIRawCardio): AerobicExercise | null {
  if (!raw.enabled) return null;

  return {
    type: sanitizeCardioType(raw.type),
    duration: raw.durationMinutes || 15,
    intensity: sanitizeIntensity(raw.intensity),
    timing: sanitizeTiming(raw.moment),
    completed: false,
  };
}

function buildWorkoutDay(raw: AIRawDay, index: number): WorkoutDay {
  const exercises = (raw.mainExercises || []).map(buildExerciseFromStimulus);
  const abExercise = raw.abs ? buildAbdominal(raw.abs) : null;
  const aerobic = raw.cardio ? buildAerobic(raw.cardio) : undefined;

  return {
    id: generateId('custom'),
    name: `Treino ${String.fromCharCode(65 + index)} - ${raw.day}`,
    day: raw.day,
    warmup: 'Aquecimento geral: 5 min de mobilidade articular',
    exercises,
    abdominal: abExercise ? [abExercise] : undefined,
    aerobic: aerobic || undefined,
  };
}

// ---------- JSON Extraction ----------

function extractJSON(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  throw new Error('Nenhum JSON válido encontrado na resposta da IA.');
}

// ---------- Main ----------

export async function gerarTreinoIA(dados: AIGenerationParams): Promise<WorkoutDay[]> {
  const token = import.meta.env.VITE_GROQ_KEY;
  if (!token) {
    throw new Error('Chave da Groq não configurada. Adicione VITE_GROQ_KEY ao ambiente.');
  }

  const systemPrompt = `Você é um personal trainer com 15 anos de experiência.
Você DEVE responder APENAS com um JSON válido. Nenhum texto, explicação ou comentário é permitido fora do JSON.
Regras absolutas:
- Responda SOMENTE JSON puro.
- Não use markdown, não use codeblocks, não adicione texto antes ou depois.
- Os únicos tipos de cardio permitidos são: "Esteira", "Transport", "Remo". NÃO use "Bicicleta" ou "Bicicleta ergométrica".
- intensity deve ser: "leve", "moderada" ou "intensa".
- moment deve ser: "antes" ou "depois".
- Se isTimeBased for true, repetitions deve ser null e secondsPerSet deve ter valor.
- Se isTimeBased for false, secondsPerSet deve ser null e repetitions deve ter valor.
- Não repita o mesmo padrão de movimento (stimulus) no mesmo dia.
- Varie os estímulos entre os dias.
- Adapte volume e intensidade ao nível e sexo do aluno.`;

  const userPrompt = `Crie um plano de treino para os seguintes dias: ${dados.diasSelecionados.join(', ')}

Dados do aluno:
- Sexo: ${dados.sexo}
- Idade: ${dados.idade} anos
- Peso: ${dados.peso} kg
- Nível: ${dados.nivel}
- Objetivo: ${dados.objetivo}

Regras:
1. Gere treinos APENAS para os dias listados.
2. Divida grupos musculares de forma inteligente.
3. Não repita o mesmo grupo muscular em dias consecutivos.
4. Inclua abdominal em pelo menos 2 dias.
5. Inclua cardio em pelo menos 2 dias.
6. Para iniciantes: 3-4 exercícios por dia, séries menores.
7. Para avançados: 5-7 exercícios por dia, séries maiores.
8. Para mulheres: maior foco em glúteos, pernas e core.

Responda APENAS com JSON neste formato exato:
{
  "days": [
    {
      "day": "Segunda-feira",
      "cardio": {
        "enabled": true,
        "type": "Esteira",
        "intensity": "moderada",
        "durationMinutes": 20,
        "moment": "antes"
      },
      "mainExercises": [
        {
          "stimulus": "Supino reto com barra",
          "sets": 4,
          "targetReps": "8-12",
          "restSeconds": 90,
          "hasDropSet": false
        }
      ],
      "abs": {
        "enabled": true,
        "nameSuggestion": "Prancha",
        "sets": 3,
        "repetitions": null,
        "isTimeBased": true,
        "secondsPerSet": 40,
        "isBilateral": false,
        "restSeconds": 45
      }
    }
  ]
}`;

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

  return parsed.days.map((day, i) => buildWorkoutDay(day, i));
}
