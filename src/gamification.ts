export interface UserProfile {
  level: number;
  xp: number; // XP поточного рівня (0..xpForNext)
  totalXpEarned: number; // сумарно заробив усього
  totalWorkouts: number;
  lastWorkoutDate?: string;
}

const STORAGE_KEY = 'fitstart_profile';

const BASE_XP_PER_WORKOUT = 100;
const XP_PER_MINUTE = 5;
const XP_PER_SET = 3;

/** XP необхідний для переходу з рівня `level` на наступний. */
export function xpForNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/** Розрахунок поточного рівня та прогресу в ньому за загальною кількістю XP. */
export function calculateLevel(totalXp: number): {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  progressPercent: number;
} {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level += 1;
  }
  const next = xpForNextLevel(level);
  return {
    level,
    xpInLevel: remaining,
    xpForNext: next,
    progressPercent: next > 0 ? Math.round((remaining / next) * 100) : 100,
  };
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        level: typeof parsed.level === 'number' ? parsed.level : 1,
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
        totalXpEarned: typeof parsed.totalXpEarned === 'number' ? parsed.totalXpEarned : 0,
        totalWorkouts: typeof parsed.totalWorkouts === 'number' ? parsed.totalWorkouts : 0,
        lastWorkoutDate: parsed.lastWorkoutDate || undefined,
      };
    }
  } catch {
    // Ігноруємо помилки читання localStorage
  }
  return { level: 1, xp: 0, totalXpEarned: 0, totalWorkouts: 0 };
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ігноруємо помилки запису localStorage
  }
}

export function awardXp(
  profile: UserProfile,
  xpEarned: number,
): { profile: UserProfile; leveledUp: boolean; levelsGained: number } {
  const oldLevel = profile.level;
  const newTotalXp = profile.totalXpEarned + xpEarned;
  const { level, xpInLevel } = calculateLevel(newTotalXp);
  const leveledUp = level > oldLevel;
  return {
    profile: {
      ...profile,
      level,
      xp: xpInLevel,
      totalWorkouts: profile.totalWorkouts + 1,
      totalXpEarned: newTotalXp,
      lastWorkoutDate: new Date().toISOString(),
    },
    leveledUp,
    levelsGained: level - oldLevel,
  };
}

/** Розрахунок XP за завершене тренування. */
export function workoutXp(params: {
  durationMin: number;
  completedSets: number;
  totalSets: number;
}): number {
  const { durationMin, completedSets } = params;
  const base = BASE_XP_PER_WORKOUT;
  const durationBonus = durationMin * XP_PER_MINUTE;
  const setBonus = completedSets * XP_PER_SET;
  return base + durationBonus + setBonus;
}

export const LEVEL_TITLES: Record<number, { title: string; color: string }> = {
  1: { title: 'Новачок', color: 'text-cyber-muted' },
  2: { title: 'Адепт', color: 'text-neon-blue' },
  3: { title: 'Боєць', color: 'text-neon-pink' },
  4: { title: 'Силючка', color: 'text-neon-green' },
  5: { title: 'Мастер', color: 'text-neon-amber' },
  10: { title: 'Легенда', color: 'text-neon-pink animate-glow-pink' },
};

export function levelTitle(level: number): { title: string; color: string } {
  // знаходимо найbliжчий за назвою рівень <= поточному
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  for (const k of keys) {
    if (level >= k) return LEVEL_TITLES[k];
  }
  return LEVEL_TITLES[1];
}
