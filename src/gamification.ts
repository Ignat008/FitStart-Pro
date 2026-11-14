export interface UserProfile {
  level: number;
  xp: number; // XP поточного рівня (0..xpForNext)
  totalXpEarned: number; // сумарно заробив усього
  totalWorkouts: number;
  lastWorkoutDate?: string;
  currentStreak: number; // поточний стрік днів підряд
  longestStreak: number; // найдовший стрік за всю історію
}

const STORAGE_KEY = 'fitstart_profile';

const BASE_XP_PER_WORKOUT = 50; // зменшено для поступового прогресу
const XP_PER_MINUTE = 5;
const XP_PER_SET = 3;

export const STREAK_BONUSES: Record<number, number> = {
  7: 100,
  30: 300,
};

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
        currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
        longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : 0,
      };
    }
  } catch {
    // Ігноруємо помилки читання localStorage
  }
  return {
    level: 1,
    xp: 0,
    totalXpEarned: 0,
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
  };
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ігноруємо помилки запису localStorage
  }
}

/**
 * Оновлює стрік днів підряд.
 * Повертає новий профіль та бонусний XP (0 якщо немає бонусу).
 * Правила:
 * - Якщо останнє тренування було вчора або сьогодні — стрік +1.
 * - Якщо пропущений цілий день — стрік скидається на 0.
 * - При досягненні 7 або 30 днів — бонусний XP.
 */
export function updateStreak(
  profile: UserProfile,
): { profile: UserProfile; streakBonusXp: number; streakMilestone: number | null } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // Якщо вже тренувались сьогодні — стрік не змінюємо, бонусів немає
  if (profile.lastWorkoutDate === todayStr) {
    return { profile, streakBonusXp: 0, streakMilestone: null };
  }

  let newStreak = profile.currentStreak;

  if (profile.lastWorkoutDate) {
    const lastDate = new Date(profile.lastWorkoutDate);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak += 1; // тренувались вчора — продовжуємо стрік
    } else if (diffDays > 1) {
      newStreak = 1; // пропустили день або більше — починаємо новий стрік
    }
  } else {
    newStreak = 1; // перше тренування
  }

  const newLongestStreak = Math.max(profile.longestStreak, newStreak);

  // Бонусний XP за досягнення серій (тільки якщо тільки що досягли цієї межі)
  let streakBonusXp = 0;
  let streakMilestone: number | null = null;

  if (newStreak >= 30 && profile.currentStreak < 30) {
    streakBonusXp += 300;
    streakMilestone = 30;
  } else if (newStreak >= 7 && profile.currentStreak < 7) {
    streakBonusXp += 100;
    streakMilestone = 7;
  }

  const updatedProfile: UserProfile = {
    ...profile,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastWorkoutDate: todayStr,
  };

  return {
    profile: updatedProfile,
    streakBonusXp,
    streakMilestone,
  };
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

/** Розрахунок XP за тренування.
 * Якщо тренування завершено повністю — нараховується базова нагорода +
 * бонус за тривалість та за всі сеты.
 * Якщо тренування не завершено — нараховується лише XP за фактично виконані сеты,
 * без базової нагороди і бонусу за тривалість.
 */
export function workoutXp(params: {
  durationMin: number;
  completedSets: number;
  totalSets: number;
  completed: boolean; // чи завершено тренування до кінця
}): number {
  const { durationMin, completedSets, totalSets, completed } = params;

  if (completed) {
    const base = BASE_XP_PER_WORKOUT;
    const durationBonus = durationMin * XP_PER_MINUTE;
    const setBonus = totalSets * XP_PER_SET;
    return base + durationBonus + setBonus;
  }

  // Незавершене тренування: лише за фактично закриті сеты
  return completedSets * XP_PER_SET;
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

/** Форматує дату для заголовка календаря (перший день тижня = понеділок). */
export function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // понеділок = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Date[] = [];

  // дні попереднього місяця для заповнення першого тижня
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  // дні поточного місяця
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }
  // дні наступного місяця для заповнення останнього тижня
  const totalCells = Math.ceil(days.length / 7) * 7;
  for (let d = daysInMonth + 1; days.length < totalCells; d++) {
    days.push(new Date(year, month + 1, d - daysInMonth));
  }
  return days;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
