import exercisesData from '../data/exercises-pro.json';
import rulesData from '../data/training-rules.json';

// ---------- Types ----------

export interface LocalExercise {
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  category: 'compound_main' | 'compound_secondary' | 'isolation' | 'core';
  equipment: string;
  stimulus: number;
  fatigue: number;
  priorityFemale?: boolean;
  techniquesAllowed: string[];
}

export interface TrainingRules {
  rules: {
    exerciseSelection: {
      compoundMainPerWorkout: number;
      compoundSecondaryPerWorkout: number;
      isolationPerWorkout: number;
      maxExercisesPerWorkout: number;
      minExercisesPerWorkout: number;
      avoidRepeatingSameExerciseInWeek: boolean;
      avoidSameMovementPatternSequential: boolean;
    };
    stimulusControl: {
      maxTotalStimulusPerWorkout: number;
      maxTotalFatiguePerWorkout: number;
      avoidMultipleFatigue5Exercises: boolean;
    };
    techniques: Record<string, { allow?: boolean; restPause?: number; dropSetIsolation?: number }>;
    trainingSplit: Record<string, Record<string, string>>;
    setsReps: Record<string, Record<string, { sets: number; reps: string }>>;
    femaleBias: Record<string, { prioritizeMuscles: string[]; deprioritizeMuscles: string[] }>;
    ageAdaptation: Record<string, Record<string, unknown>>;
    weightAdaptation: Record<string, Record<string, unknown>>;
    muscleBalance: { pushPullBalance: boolean; upperLowerBalance: boolean; maxExercisesPerMusclePerWorkout: number };
    exerciseRestrictions: Record<string, Record<string, unknown>>;
  };
}

// ---------- Exports ----------

export const exercises: LocalExercise[] = exercisesData as LocalExercise[];
export const rules: TrainingRules = rulesData as TrainingRules;

// ---------- Helpers ----------

export function getExercisesByMuscle(muscle: string): LocalExercise[] {
  return exercises.filter(
    (e) => e.primaryMuscle === muscle || e.secondaryMuscles.includes(muscle)
  );
}

export function getExercisesByCategory(category: string): LocalExercise[] {
  return exercises.filter((e) => e.category === category);
}

export function getExerciseNames(): Set<string> {
  return new Set(exercises.map((e) => e.name.toLowerCase()));
}

export function getSplitForProfile(level: string, days: number): string {
  const splitRules = rules.rules.trainingSplit[level] || rules.rules.trainingSplit['intermediate'];

  // Try exact match
  const exactKey = `${days}_days`;
  if (splitRules[exactKey]) return splitRules[exactKey];

  // Range match (e.g. "1-3_days")
  for (const [key, value] of Object.entries(splitRules)) {
    const rangeMatch = key.match(/^(\d+)-(\d+)_days$/);
    if (rangeMatch) {
      const [, min, max] = rangeMatch;
      if (days >= Number(min) && days <= Number(max)) return value;
    }
  }

  // Fallback: last entry
  const values = Object.values(splitRules);
  return values[values.length - 1];
}

export function getSplitLabel(splitType: string): string {
  const labels: Record<string, string> = {
    full_body: 'Full Body',
    upper_lower: 'Upper / Lower',
    classic_bodybuilding: 'Divisão Clássica (A/B/C/D/E)',
    push_pull_legs: 'Push / Pull / Legs',
  };
  return labels[splitType] || splitType;
}

export function getMuscleGroupsForSplit(splitType: string, numDays: number): { muscles: string[]; label: string }[] {
  const splits: Record<string, { muscles: string[]; label: string }[]> = {
    full_body: [
      { muscles: ['peito', 'costas', 'quadriceps', 'ombro', 'biceps', 'triceps', 'core'], label: 'Full Body' },
    ],
    upper_lower: [
      { muscles: ['peito', 'costas', 'ombro', 'biceps', 'triceps'], label: 'Upper' },
      { muscles: ['quadriceps', 'gluteos', 'posterior', 'panturrilha', 'core'], label: 'Lower' },
    ],
    classic_bodybuilding: [
      { muscles: ['peito', 'triceps'], label: 'Peito / Tríceps' },
      { muscles: ['costas', 'biceps'], label: 'Costas / Bíceps' },
      { muscles: ['quadriceps', 'gluteos', 'posterior', 'panturrilha'], label: 'Pernas' },
      { muscles: ['ombro', 'core'], label: 'Ombros / Core' },
      { muscles: ['peito', 'costas'], label: 'Peito / Costas' },
    ],
    push_pull_legs: [
      { muscles: ['peito', 'ombro', 'triceps'], label: 'Push' },
      { muscles: ['costas', 'biceps'], label: 'Pull' },
      { muscles: ['quadriceps', 'gluteos', 'posterior', 'panturrilha', 'core'], label: 'Legs' },
    ],
  };

  const groups = splits[splitType] || splits['full_body'];
  const result: { muscles: string[]; label: string }[] = [];
  for (let i = 0; i < numDays; i++) {
    result.push(groups[i % groups.length]);
  }
  return result;
}

export function buildExerciseListForPrompt(filteredExercises: LocalExercise[]): string {
  const grouped: Record<string, LocalExercise[]> = {};
  for (const ex of filteredExercises) {
    if (!grouped[ex.primaryMuscle]) grouped[ex.primaryMuscle] = [];
    grouped[ex.primaryMuscle].push(ex);
  }

  return Object.entries(grouped)
    .map(([muscle, exList]) => {
      const names = exList.map((e) => `${e.name} [${e.category}, ${e.equipment}, S:${e.stimulus}/F:${e.fatigue}]`).join(', ');
      return `- ${muscle}: ${names}`;
    })
    .join('\n');
}

export function filterExercisesForProfile(
  level: string,
  age: number,
  sex: string,
  _goal: string
): LocalExercise[] {
  let filtered = [...exercises];

  // Beginner: avoid fatigue 5 exercises
  if (level === 'beginner' || level === 'iniciante') {
    filtered = filtered.filter((e) => e.fatigue < 5);
  }

  // Age 40+: avoid fatigue 5, prefer machines
  if (age >= 40) {
    filtered = filtered.filter((e) => e.fatigue < 5);
  }

  // Age under 18: limit fatigue
  if (age < 18) {
    filtered = filtered.filter((e) => e.fatigue <= 3);
  }

  // Female prioritization: boost but don't exclude
  if (sex === 'feminino' || sex === 'female') {
    filtered.sort((a, b) => {
      const aPriority = a.priorityFemale ? 1 : 0;
      const bPriority = b.priorityFemale ? 1 : 0;
      return bPriority - aPriority;
    });
  }

  return filtered;
}
