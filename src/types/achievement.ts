export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: AchievementCheckData) => boolean;
  unlockedAt?: string;
}

export interface AchievementCheckData {
  totalWorkouts: number;
  totalVolume: number;
  totalTimeSeconds: number;
  consecutiveDays: number;
  history: any[];
}

export interface UnlockedAchievement extends Achievement {
  unlockedAt: string;
}
