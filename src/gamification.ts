export interface UserProfile {
  level: number;
  xp: number; // XP поточного рівня (0..xpForNext)
  totalXpEarned: number; // сумарно заробив усього
  totalWorkouts: number;
  lastWorkoutDate?: string;
  workoutDates: string[]; // дати тренувань (YYYY-MM-DD)
  currentStreak: number; // поточний стрік днів підряд
  longestStreak: number; // найдовший стрік за всю історію
}

const STORAGE_KEY = 'fitstart_profile';

const BASE_XP_PER_WORKOUT = 50; // зменшено для поступового прогресу
const XP_PER_MINUTE = 5;
const XP_PER_SET = 3;

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseWorkoutDate(value: string): Date | null {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function workoutDateKey(value: string): string | null {
  const date = parseWorkoutDate(value);
  return date ? localDateKey(date) : null;
}

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
      const profile: UserProfile = {
        level: typeof parsed.level === 'number' ? parsed.level : 1,
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
        totalXpEarned: typeof parsed.totalXpEarned === 'number' ? parsed.totalXpEarned : 0,
        totalWorkouts: typeof parsed.totalWorkouts === 'number' ? parsed.totalWorkouts : 0,
        lastWorkoutDate: parsed.lastWorkoutDate || undefined,
        workoutDates: Array.isArray(parsed.workoutDates) ? parsed.workoutDates : [],
        currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
        longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : 0,
      };

      const lastWorkoutKey = profile.lastWorkoutDate
        ? workoutDateKey(profile.lastWorkoutDate)
        : null;
      let migrated = false;
      if (lastWorkoutKey && profile.lastWorkoutDate !== lastWorkoutKey) {
        profile.lastWorkoutDate = lastWorkoutKey;
        migrated = true;
      }

      if (lastWorkoutKey) {
        const [year, month, day] = lastWorkoutKey.split('-').map(Number);
        const [todayYear, todayMonth, todayDay] = localDateKey(new Date()).split('-').map(Number);
        const lastWorkoutDay = Date.UTC(year, month - 1, day);
        const today = Date.UTC(todayYear, todayMonth - 1, todayDay);
        const daysSinceWorkout = Math.round((today - lastWorkoutDay) / (1000 * 60 * 60 * 24));

        if (daysSinceWorkout >= 0 && daysSinceWorkout <= 1) {
          if (!profile.workoutDates.some((date) => workoutDateKey(date) === lastWorkoutKey)) {
            profile.workoutDates = [...profile.workoutDates, lastWorkoutKey];
            migrated = true;
          }
          if (profile.currentStreak === 0) {
            profile.currentStreak = 1;
            profile.longestStreak = Math.max(profile.longestStreak, 1);
            migrated = true;
          }
        }
      }

      if (migrated) saveProfile(profile);
      return profile;
    }
  } catch {
    // Ігноруємо помилки читання localStorage
  }
  return {
    level: 1,
    xp: 0,
    totalXpEarned: 0,
    totalWorkouts: 0,
    workoutDates: [],
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
 * - Якщо вже тренувались сьогодні — стрік не змінюємо, бонусів немає.
 * - Якщо останнє тренування було вчора — стрік +1.
 * - Якщо пропущений цілий день або більше — стрік скидається на 1 (поточний день).
 * - При досягненні 7 або 30 днів — бонусний XP.
 */
export function updateStreak(
  profile: UserProfile,
): { profile: UserProfile; streakBonusXp: number; streakMilestone: number | null } {
  const today = new Date();
  const todayStr = localDateKey(today);

  // Якщо вже тренувались сьогодні — стрік не змінюємо, бонусів немає
  const lastWorkoutKey = profile.lastWorkoutDate
    ? workoutDateKey(profile.lastWorkoutDate)
    : null;
  if (
    lastWorkoutKey === todayStr ||
    profile.workoutDates.some((date) => workoutDateKey(date) === todayStr)
  ) {
    return { profile, streakBonusXp: 0, streakMilestone: null };
  }

  let newStreak = profile.currentStreak;

  if (lastWorkoutKey) {
    const [year, month, day] = lastWorkoutKey.split('-').map(Number);
    const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
    const lastDateUtc = Date.UTC(year, month - 1, day);
    const todayDateUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
    const diffDays = Math.round((todayDateUtc - lastDateUtc) / (1000 * 60 * 60 * 24));

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
    workoutDates: [...profile.workoutDates, todayStr],
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

/* ==================== ТИЖНЕВІ ЧЕЛЕНІДЖІ ==================== */

export type ChallengeType = 'workouts' | 'xp' | 'exercises';

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number; // кількість тренувань / XP / вправ
  rewardXp: number;
  rewardTitle?: string; // нове звання при завершенні
  weekStart?: string; // ISO дата початку тижня (понеділок)
}

export interface ChallengeProgress {
  challengeId: string;
  progress: number;
  joinedAt: string; // ISO
  completedAt?: string; // ISO
}

export interface LeaderboardEntry {
  name: string;
  xp: number;
  workouts: number;
  date: string; // ISO
}

const CHALLENGES_STORAGE_KEY = 'fitstart_challenges';
const LEADERBOARD_STORAGE_KEY = 'fitstart_leaderboard';

const DEFAULT_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'weekly-workouts-3',
    title: 'Три тренування за тиждень',
    description: 'Заверши 3 тренування до кінця тижня',
    type: 'workouts',
    target: 3,
    rewardXp: 150,
    rewardTitle: 'Систематичність',
  },
  {
    id: 'weekly-xp-500',
    title: 'Здобути 500 XP',
    description: 'Нароби 500 досвіду за тиждень',
    type: 'xp',
    target: 500,
    rewardXp: 200,
    rewardTitle: 'Здобувач',
  },
  {
    id: 'weekly-exercises-10',
    title: '10 вправ за тиждень',
    description: 'Виконай 10 окремих вправ у тренуваннях',
    type: 'exercises',
    target: 10,
    rewardXp: 100,
    rewardTitle: 'Універсал',
  },
];

/** Повертає початок поточного тижня (понеділок) у форматі ISO дати. */
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = неділя
  const mondayOffset = day === 0 ? -6 : 1 - day; // понеділок = 1
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/** Завантажує прогрес чєленіджів з localStorage. */
export function loadChallenges(): {
  challenges: WeeklyChallenge[];
  progress: ChallengeProgress[];
} {
  try {
    const raw = localStorage.getItem(CHALLENGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        challenges: Array.isArray(parsed.challenges) ? parsed.challenges : DEFAULT_CHALLENGES,
        progress: Array.isArray(parsed.progress) ? parsed.progress : [],
      };
    }
  } catch {
    // Ігноруємо помилки читання чєленіджів
  }
  return { challenges: DEFAULT_CHALLENGES, progress: [] };
}

/** Зберігає прогрес чєленіджів у localStorage. */
export function saveChallenges(data: {
  challenges: WeeklyChallenge[];
  progress: ChallengeProgress[];
}): void {
  try {
    localStorage.setItem(CHALLENGES_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ігноруємо помилки запису чєленіджів
  }
}

/** Завантажує таблицю лідерів. */
export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // Ігноруємо помилки читання лідерборду
  }
  return [];
}

/** Зберігає запис у таблицю лідерів. */
export function saveLeaderboardEntry(entry: LeaderboardEntry): void {
  try {
    const current = loadLeaderboard();
    current.push(entry);
    current.sort((a, b) => b.xp - a.xp || b.workouts - a.workouts);
    const top = current.slice(0, 10);
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(top));
  } catch {
    // Ігноруємо помилки запису лідерборду
  }
}

/** Повертає активний чєленідж на поточний тиждень (створює, якщо ще немає). */
export function getActiveChallenge(
  challenges: WeeklyChallenge[],
  progress: ChallengeProgress[],
): { challenge: WeeklyChallenge; progress: ChallengeProgress | null } {
  const weekStart = getWeekStart();
  const challengeIdPrefix = `${weekStart}-`;
  const existing = progress.find((item) => item.challengeId.startsWith(challengeIdPrefix));

  if (existing) {
    const storedChallenge = challenges.find((item) => item.id === existing.challengeId);
    const defaultChallengeId = existing.challengeId.slice(challengeIdPrefix.length);
    const challengeDefinition =
      storedChallenge ?? DEFAULT_CHALLENGES.find((item) => item.id === defaultChallengeId);

    if (challengeDefinition) {
      return {
        challenge: { ...challengeDefinition, id: existing.challengeId, weekStart },
        progress: existing,
      };
    }
  }

  const weekNumber = Math.floor(
    Date.parse(`${weekStart}T00:00:00Z`) / (7 * 24 * 60 * 60 * 1000),
  );
  const challengeIndex =
    ((weekNumber % DEFAULT_CHALLENGES.length) + DEFAULT_CHALLENGES.length) %
    DEFAULT_CHALLENGES.length;
  const challengeDefinition = DEFAULT_CHALLENGES[challengeIndex];
  const challenge = {
    ...challengeDefinition,
    id: `${weekStart}-${challengeDefinition.id}`,
    weekStart,
  };
  return { challenge, progress: null };
}

/** Оновлює прогрес чєленіджу після тренування або нарахування XP. */
export function updateChallengeProgress(
  progress: ChallengeProgress,
  challenge: WeeklyChallenge,
  workoutCount: number,
  xpEarned: number,
  exercisesCount: number,
): { progress: ChallengeProgress; completed: boolean; bonusXp: number } {
  let newProgress = progress.progress;
  let completed = false;
  let bonusXp = 0;

  if (progress.completedAt) return { progress, completed: true, bonusXp: 0 };

  switch (challenge.type) {
    case 'workouts':
      newProgress = Math.min(workoutCount, challenge.target);
      break;
    case 'xp':
      newProgress = Math.min(xpEarned, challenge.target);
      break;
    case 'exercises':
      newProgress = Math.min(exercisesCount, challenge.target);
      break;
  }

  if (newProgress >= challenge.target) {
    completed = true;
    bonusXp = challenge.rewardXp;
  }

  return {
    progress: {
      ...progress,
      progress: newProgress,
      completedAt: completed ? new Date().toISOString() : progress.completedAt,
    },
    completed,
    bonusXp,
  };
}
