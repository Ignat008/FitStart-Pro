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

export interface Exercise {
  name: string;
  reps: string; // "8-10" або "30с"
  restSec: number;
  cue: string; // підказка щодо дихання/безпеки
  equipment?: Equipment; // тип інвентарю для вправ з вагами
  weightKg?: number; // робоча вага у кілограмах
  sets?: number; // кількість підходів
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
  reps: string;
  sets: number;
  weightKg: number;
  restSec: number;
  cue: string;
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
