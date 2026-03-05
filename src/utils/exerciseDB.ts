// ---------- ExerciseDB API (RapidAPI) with localStorage cache ----------

export interface ExerciseDBItem {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
}

const BASE_URL = 'https://exercisedb.p.rapidapi.com';
const CACHE_KEY = 'irontrainer_exercisedb_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias

const BODY_PARTS = [
  'chest',
  'back',
  'shoulders',
  'upper arms',
  'upper legs',
  'lower legs',
  'waist',
];

// ---------- Cache ----------

interface CachedData {
  timestamp: number;
  exercises: Record<string, ExerciseDBItem[]>;
}

function getCachedExercises(): Record<string, ExerciseDBItem[]> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.exercises;
  } catch {
    return null;
  }
}

function setCachedExercises(exercises: Record<string, ExerciseDBItem[]>) {
  const data: CachedData = { timestamp: Date.now(), exercises };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full — ignore
  }
}

// ---------- API ----------

async function fetchBodyPart(
  bodyPart: string,
  apiKey: string
): Promise<ExerciseDBItem[]> {
  const res = await fetch(
    `${BASE_URL}/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=50`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      },
    }
  );

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Limite de requisições da ExerciseDB atingido. Tente novamente mais tarde.');
    }
    throw new Error(`Erro ao buscar exercícios (${res.status}).`);
  }

  return res.json();
}

/**
 * Busca exercícios de todos os grupos musculares principais.
 * Utiliza cache no localStorage (7 dias) para evitar chamadas desnecessárias.
 */
export async function getAllExercisesGrouped(): Promise<
  Record<string, ExerciseDBItem[]>
> {
  const cached = getCachedExercises();
  if (cached) return cached;

  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error(
      'Chave da RapidAPI não configurada. Adicione VITE_RAPIDAPI_KEY ao ambiente.'
    );
  }

  const results: Record<string, ExerciseDBItem[]> = {};

  await Promise.all(
    BODY_PARTS.map(async (bp) => {
      results[bp] = await fetchBodyPart(bp, apiKey);
    })
  );

  setCachedExercises(results);
  return results;
}

/**
 * Monta uma lista compacta de exercícios agrupados por bodyPart
 * para incluir no prompt da IA.
 */
export function buildExerciseListForPrompt(
  exercises: Record<string, ExerciseDBItem[]>
): string {
  return Object.entries(exercises)
    .map(([bodyPart, exList]) => {
      const names = exList
        .slice(0, 20)
        .map((e) => e.name)
        .join(', ');
      return `- ${bodyPart}: ${names}`;
    })
    .join('\n');
}
