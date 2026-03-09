import exercisesData from '../data/exercises-pro.json';
import rulesData from '../data/training-rules.json';

// ---------- Types ----------

export interface LocalExercise {
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  category: 'compound_main' | 'compound_secondary' | 'isolation';
  equipment: string;
  stimulus: number;
  fatigue: number;
  priorityFemale: boolean;
  techniquesAllowed: string[];
}

export interface SplitConfig {
  type: string;
  label: string;
  description: string;
}

export interface SplitMuscleGroup {
  muscles: string[];
  label: string;
}

export interface TrainingRules {
  trainingSplits: Record<string, Record<string, SplitConfig>>;
  splitMuscleGroups: Record<string, SplitMuscleGroup[]>;
  exerciseDistribution: Record<string, { compound_main: number; compound_secondary: number; isolation: number; total: number }>;
  stimulusLimits: Record<string, { maxPerWorkout: number; maxPerMuscle: number }>;
  fatigueLimits: Record<string, { maxPerWorkout: number; maxPerMuscle: number }>;
  techniqueRules: Record<string, { rest_pause: number; drop_set: number }>;
  repRanges: Record<string, Record<string, string>>;
  setsPerCategory: Record<string, number>;
  femalePrioritization: { enabled: boolean; priorityMuscles: string[]; boostPriorityExercises: boolean };
  ageAdaptation: Record<string, { avoidHighFatigue: boolean; maxFatigue: number; preferEquipment: string[]; avoidEquipment: string[] }>;
  levelEquipmentFilter: Record<string, { allowed: string[]; excluded: string[] }>;
  goalMapping: Record<string, string>;
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

export function getSplitForProfile(level: string, days: number): SplitConfig {
  const levelSplits = rules.trainingSplits[level] || rules.trainingSplits['intermediate'];
  
  // Try exact match first, then range match
  const key = String(days);
  if (levelSplits[key]) return levelSplits[key];
  
  // Range matching (e.g., "2-3", "5-6")
  for (const [range, config] of Object.entries(levelSplits)) {
    if (range.includes('-')) {
      const [min, max] = range.split('-').map(Number);
      if (days >= min && days <= max) return config;
    }
  }
  
  // Fallback
  const keys = Object.keys(levelSplits);
  return levelSplits[keys[keys.length - 1]];
}

export function getMuscleGroupsForSplit(splitType: string, numDays: number): SplitMuscleGroup[] {
  const groups = rules.splitMuscleGroups[splitType];
  if (!groups) return rules.splitMuscleGroups['full_body'];
  
  // Cycle through groups to fill all days
  const result: SplitMuscleGroup[] = [];
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
  goal: string
): LocalExercise[] {
  let filtered = [...exercises];

  // Level equipment filter
  const equipFilter = rules.levelEquipmentFilter[level];
  if (equipFilter) {
    filtered = filtered.filter(
      (e) => equipFilter.allowed.includes(e.equipment) && !equipFilter.excluded.includes(e.equipment)
    );
  }

  // Age adaptation
  if (age >= 60) {
    const adapt = rules.ageAdaptation['60+'];
    filtered = filtered.filter((e) => e.fatigue <= adapt.maxFatigue && !adapt.avoidEquipment.includes(e.equipment));
  } else if (age >= 40) {
    const adapt = rules.ageAdaptation['40+'];
    filtered = filtered.filter((e) => e.fatigue <= adapt.maxFatigue);
  }

  // Beginner: avoid high fatigue
  if (level === 'beginner' || level === 'iniciante') {
    filtered = filtered.filter((e) => e.fatigue <= 3);
  }

  // Female prioritization: boost but don't exclude
  if ((sex === 'feminino' || sex === 'female') && rules.femalePrioritization.enabled) {
    filtered.sort((a, b) => {
      const aPriority = a.priorityFemale ? 1 : 0;
      const bPriority = b.priorityFemale ? 1 : 0;
      return bPriority - aPriority;
    });
  }

  return filtered;
}
