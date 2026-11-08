export type MuscleGroup =
  | 'strength' // Сила: віджимання/підтягування
  | 'core' // Кора/Прес
  | 'legs' // Ноги/Витривалість
  | 'hiit'; // Інтенсивне HIIT

export type Barrier = 'fatigue' | 'technique' | 'challenge';

export type Level = 'beginner' | 'intermediate' | 'pro';

export type Phase =
  | 'prep' // РАУНД 1 — підготовка техніки
  | 'max' // РАУНД 2 — максимальний сет
  | 'lock'; // РАУНД 3 — закріплення

export type Equipment = 'kettlebell' | 'dumbbell' | 'barbell';

export type InstructionType = 'setup' | 'movement' | 'breathing' | 'safety';

export interface Instruction {
  type: InstructionType;
  text: string;
}

export interface Exercise {
  name: string;
  reps: string; // "8-10" або "30с"
  restSec: number;
  cue: string; // підказка щодо дихання/безпеки
  equipment?: Equipment; // тип інвентарю для вправ з вагами
  weightKg?: number; // робоча вага у кілограмах
  sets?: number; // кількість підходів
  instructions?: Instruction[]; // покрокова техніка виконання
}

export interface Round {
  phase: Phase;
  label: string; // "РАУНД 1 — Підготовка техніки"
  goal: string;
  exercises: Exercise[];
  restBetweenRoundsSec: number;
}

export interface WorkoutPlan {
  title: string;
  mode: 'adaptive' | 'hardcore';
  durationMin: number;
  estimatedCalories: number;
  estimatedXp: number;
  intro: string;
  rounds: Round[];
  closingTip: string;
}

export interface WeightedSelection {
  id: string;
  name: string;
  equipment: Equipment;
  reps: number;
  repsUnit?: 'reps' | 'sec';
  sets: number;
  weightKg: number;
  restSec: number;
  cue: string;
  instructions?: Instruction[];
}

/** Відмінювання числівників в українській мові: 1 підхід, 2 підходи, 5 підходів. */
export function pluralizeUk(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** "3 підходи × 10 повторень" або "3 підходи × 30с" — для виводу у плані тренування. */
export function formatPrescription(sets: number, reps: number, unit: 'reps' | 'sec' = 'reps'): string {
  const setsLabel = pluralizeUk(sets, 'підхід', 'підходи', 'підходів');
  if (unit === 'sec') {
    return `${sets} ${setsLabel} × ${reps}с`;
  }
  const repsLabel = pluralizeUk(reps, 'повторення', 'повторення', 'повторень');
  return `${sets} ${setsLabel} × ${reps} ${repsLabel}`;
}

export interface SessionInput {
  muscle: MuscleGroup;
  barrier: Barrier;
  level: Level;
  weightedExercises?: WeightedSelection[];
}

export const MUSCLE_LABELS: Record<MuscleGroup, { title: string; sub: string; icon: string }> = {
  strength: { title: 'Сила', sub: 'Віджимання / Підтягування', icon: 'Dumbbell' },
  core: { title: 'Кора / Прес', sub: 'Стабілізація корсета', icon: 'Hexagon' },
  legs: { title: 'Ноги / Витривалість', sub: 'Квадрицепси, випади, біг', icon: 'Footprints' },
  hiit: { title: 'Інтенсивне HIIT', sub: 'Висока інтенсивність', icon: 'Zap' },
};

export const BARRIER_LABELS: Record<Barrier, { title: string; sub: string; color: string }> = {
  fatigue: {
    title: 'Страх перевтоми',
    sub: 'Брак сил після навчання',
    color: 'red',
  },
  technique: {
    title: 'Страх важких вправ',
    sub: 'Відсутність техніки',
    color: 'amber',
  },
  challenge: {
    title: 'Готовий до максимального челенджу',
    sub: 'Hardcore Mode',
    color: 'green',
  },
};

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Початковий просунутий',
  intermediate: 'Середній',
  pro: 'Профі',
};
