export type Equipment = 'kettlebell' | 'dumbbell' | 'barbell';

export interface WeightedExercise {
  id: string;
  name: string;
  equipment: Equipment;
  muscleGroup: 'strength' | 'core' | 'legs' | 'hiit';
  defaultReps: string;
  defaultSets: number;
  defaultWeightKg: number;
  restSec: number;
  cue: string;
}

export const EQUIPMENT_LABELS: Record<Equipment, { title: string; sub: string; icon: string }> = {
  kettlebell: { title: 'Гиря', sub: 'Комплексні рухи, вибух', icon: 'CircleDot' },
  dumbbell: { title: 'Гантелі', sub: 'Універсальні ізоляція + база', icon: 'Dumbbell' },
  barbell: { title: 'Штанга', sub: 'Важкі базові вправи', icon: 'Weight' },
};

export const WEIGHTED_LIBRARY: WeightedExercise[] = [
  // KETTLEBELL
  {
    id: 'kb-swing',
    name: 'Гирьовий мах (Kettlebell Swing)',
    equipment: 'kettlebell',
    muscleGroup: 'legs',
    defaultReps: '15 повторень',
    defaultSets: 3,
    defaultWeightKg: 16,
    restSec: 40,
    cue: 'Вибух у тазу, не руками. Спина пряма',
  },
  {
    id: 'kb-goblet',
    name: 'Гоблет-присід (Goblet Squat)',
    equipment: 'kettlebell',
    muscleGroup: 'legs',
    defaultReps: '10 повторень',
    defaultSets: 3,
    defaultWeightKg: 20,
    restSec: 45,
    cue: 'Гирю тримай біля грудей, лікті всередину',
  },
  {
    id: 'kb-press',
    name: 'Жим гирі стоячи (Military Press)',
    equipment: 'kettlebell',
    muscleGroup: 'strength',
    defaultReps: '8 повторень',
    defaultSets: 3,
    defaultWeightKg: 16,
    restSec: 50,
    cue: 'Жим по прямій лінії, кора напружена',
  },
  {
    id: 'kb-turkish',
    name: 'Турецький підйом (Turkish Get-Up)',
    equipment: 'kettlebell',
    muscleGroup: 'core',
    defaultReps: '3 на бік',
    defaultSets: 2,
    defaultWeightKg: 12,
    restSec: 60,
    cue: 'Повільно, контроль на кожному етапі',
  },
  {
    id: 'kb-clean',
    name: 'Гирьовий клін (Clean)',
    equipment: 'kettlebell',
    muscleGroup: 'strength',
    defaultReps: '8 повторень',
    defaultSets: 3,
    defaultWeightKg: 16,
    restSec: 45,
    cue: 'Прийом у rack-позицію м’яко, без удару',
  },
  // DUMBBELL
  {
    id: 'db-bench',
    name: 'Жим гантелей лежачи (Dumbbell Press)',
    equipment: 'dumbbell',
    muscleGroup: 'strength',
    defaultReps: '10 повторень',
    defaultSets: 3,
    defaultWeightKg: 12,
    restSec: 50,
    cue: 'Лікті під 45°, контрольне опускання',
  },
  {
    id: 'db-row',
    name: 'Тяга гантелі в нахилі (One-Arm Row)',
    equipment: 'dumbbell',
    muscleGroup: 'strength',
    defaultReps: '10 на руку',
    defaultSets: 3,
    defaultWeightKg: 14,
    restSec: 45,
    cue: 'Зводь лопатку, тягни до поясу',
  },
  {
    id: 'db-shoulder',
    name: 'Арнольд-прес (Arnold Press)',
    equipment: 'dumbbell',
    muscleGroup: 'strength',
    defaultReps: '10 повторень',
    defaultSets: 3,
    defaultWeightKg: 10,
    restSec: 45,
    cue: 'Оберт долонь у верхній точці',
  },
  {
    id: 'db-goblet',
    name: 'Болгарські випади з гантелями',
    equipment: 'dumbbell',
    muscleGroup: 'legs',
    defaultReps: '8 на ногу',
    defaultSets: 3,
    defaultWeightKg: 10,
    restSec: 50,
    cue: 'Переднє коліно над стопою, вертикально',
  },
  {
    id: 'db-curl',
    name: 'Згинання рук з гантелями (Bicep Curl)',
    equipment: 'dumbbell',
    muscleGroup: 'strength',
    defaultReps: '12 повторень',
    defaultSets: 3,
    defaultWeightKg: 8,
    restSec: 40,
    cue: 'Лікті прижаті, без розгойдування',
  },
  {
    id: 'db-russian',
    name: 'Російське скручування з гантеллю',
    equipment: 'dumbbell',
    muscleGroup: 'core',
    defaultReps: '16 повторень',
    defaultSets: 3,
    defaultWeightKg: 6,
    restSec: 35,
    cue: 'Спина пряма, оберт від пояса',
  },
  // BARBELL
  {
    id: 'bb-squat',
    name: 'Присідання зі штангою (Back Squat)',
    equipment: 'barbell',
    muscleGroup: 'legs',
    defaultReps: '8 повторень',
    defaultSets: 4,
    defaultWeightKg: 40,
    restSec: 60,
    cue: 'Гриф на трапеціях, вага на п’ятках',
  },
  {
    id: 'bb-deadlift',
    name: 'Станова тяга (Deadlift)',
    equipment: 'barbell',
    muscleGroup: 'legs',
    defaultReps: '5 повторень',
    defaultSets: 3,
    defaultWeightKg: 60,
    restSec: 90,
    cue: 'Пряма спина, таз не випереджає плечі',
  },
  {
    id: 'bb-bench',
    name: 'Жим штанги лежачи (Bench Press)',
    equipment: 'barbell',
    muscleGroup: 'strength',
    defaultReps: '8 повторень',
    defaultSets: 4,
    defaultWeightKg: 40,
    restSec: 60,
    cue: 'Гриф до нижньої частини грудей, стопи впритиснуті',
  },
  {
    id: 'bb-row',
    name: 'Тяга штанги в нахилі (Bent-Over Row)',
    equipment: 'barbell',
    muscleGroup: 'strength',
    defaultReps: '10 повторень',
    defaultSets: 3,
    defaultWeightKg: 35,
    restSec: 55,
    cue: 'Нахил 45°, тягни до пупка',
  },
  {
    id: 'bb-ohp',
    name: 'Армейський жим (Overhead Press)',
    equipment: 'barbell',
    muscleGroup: 'strength',
    defaultReps: '6 повторень',
    defaultSets: 3,
    defaultWeightKg: 25,
    restSec: 60,
    cue: 'Жим строго вгору, прохід підборіддя швидко',
  },
  {
    id: 'bb-rdl',
    name: 'Румунська тяга (Romanian Deadlift)',
    equipment: 'barbell',
    muscleGroup: 'legs',
    defaultReps: '10 повторень',
    defaultSets: 3,
    defaultWeightKg: 40,
    restSec: 55,
    cue: 'Відхід тазом назад, розтяг задньої поверхні',
  },
];

export function filterByEquipment(equipment: Equipment): WeightedExercise[] {
  return WEIGHTED_LIBRARY.filter((e) => e.equipment === equipment);
}

export function filterByMuscle(muscle: string): WeightedExercise[] {
  return WEIGHTED_LIBRARY.filter((e) => e.muscleGroup === muscle);
}
