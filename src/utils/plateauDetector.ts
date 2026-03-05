import { WorkoutSession, Exercise } from '../types/workout';
import { storage } from './storage';

export interface PlateauResult {
  plateauDetected: boolean;
  sessionsAnalyzed: number;
  suggestions: PlateauSuggestion[];
}

export interface PlateauSuggestion {
  type: 'swap-exercise' | 'change-reps' | 'add-technique';
  title: string;
  description: string;
}

interface ExercisePerformance {
  date: string;
  maxWeight: number;
  maxReps: number;
  totalVolume: number;
}

/**
 * Extrai as últimas N performances de um exercício pelo nome.
 */
function extractPerformanceHistory(
  exerciseName: string,
  history: WorkoutSession[],
  count = 4
): ExercisePerformance[] {
  const performances: ExercisePerformance[] = [];

  // Ordenar do mais recente ao mais antigo
  const sorted = [...history]
    .filter((s) => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const session of sorted) {
    if (performances.length >= count) break;

    const allExercises: Exercise[] = [
      ...session.exercises,
      ...(session.abdominal || []),
    ];

    for (const ex of allExercises) {
      if (ex.name.toLowerCase() !== exerciseName.toLowerCase()) continue;
      if (!ex.completed) continue;

      const completedSets = ex.setData.filter((s) => s.completed && s.reps && s.reps > 0);
      if (completedSets.length === 0) continue;

      const maxWeight = Math.max(...completedSets.map((s) => s.weight || 0));
      const maxReps = Math.max(...completedSets.map((s) => s.reps || 0));
      const totalVolume = completedSets.reduce(
        (acc, s) => acc + (s.weight || 0) * (s.reps || 0),
        0
      );

      performances.push({ date: session.date, maxWeight, maxReps, totalVolume });
      break; // uma performance por sessão
    }
  }

  return performances;
}

/**
 * Detecta estagnação (plateau) para um exercício.
 *
 * Regras:
 * - Precisa de pelo menos 4 sessões registradas.
 * - Peso NÃO aumentou nas últimas 4 sessões E reps NÃO aumentaram → plateau
 * - OU peso diminuiu em relação à sessão mais antiga → plateau
 */
export function analyzePlateau(
  exerciseName: string,
  history: WorkoutSession[]
): PlateauResult {
  const performances = extractPerformanceHistory(exerciseName, history, 4);

  if (performances.length < 4) {
    return { plateauDetected: false, sessionsAnalyzed: performances.length, suggestions: [] };
  }

  // performances[0] = mais recente, performances[3] = mais antiga
  const weights = performances.map((p) => p.maxWeight);
  const reps = performances.map((p) => p.maxReps);

  const latestWeight = weights[0];
  const oldestWeight = weights[weights.length - 1];

  // Verificar se peso aumentou em alguma sessão
  const weightIncreased = weights.some((w, i) => i > 0 && weights[i - 1] > w);
  // Verificar se reps aumentou em alguma sessão
  const repsIncreased = reps.some((r, i) => i > 0 && reps[i - 1] > r);

  // Peso diminuiu?
  const weightDecreased = latestWeight < oldestWeight;

  const plateauDetected =
    (!weightIncreased && !repsIncreased) || weightDecreased;

  const suggestions: PlateauSuggestion[] = [];

  if (plateauDetected) {
    suggestions.push({
      type: 'swap-exercise',
      title: 'Trocar exercício',
      description:
        'Substituir por outro exercício do mesmo grupo muscular para estimular novas fibras.',
    });

    suggestions.push({
      type: 'change-reps',
      title: 'Alterar faixa de repetições',
      description:
        'Mude de 3×10 para 4×8 ou 5×5 para variar o estímulo e forçar adaptação.',
    });

    suggestions.push({
      type: 'add-technique',
      title: 'Técnica intensificadora',
      description:
        'Adicione rest-pause ou drop-set na última série para aumentar a intensidade.',
    });
  }

  return { plateauDetected, sessionsAnalyzed: performances.length, suggestions };
}

/**
 * Função principal reutilizável.
 * Carrega histórico automaticamente e retorna resultado.
 */
export async function detectPlateau(exerciseName: string): Promise<PlateauResult> {
  const history = await storage.loadWorkoutHistory();
  return analyzePlateau(exerciseName, history);
}
