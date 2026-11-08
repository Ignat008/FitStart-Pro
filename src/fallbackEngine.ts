import type {
  WorkoutPlan,
  Round,
  Exercise,
  SessionInput,
  MuscleGroup,
  Barrier,
  Level,
  Phase,
  WeightedSelection,
} from './types';
import { formatPrescription } from './types';

const multipliers: Record<Level, { reps: number; sets: number; rest: number }> = {
  beginner: { reps: 0.7, sets: 0.75, rest: 1.4 },
  intermediate: { reps: 1, sets: 1, rest: 1 },
  pro: { reps: 1.35, sets: 1.25, rest: 0.7 },
};

const muscleLib: Record<
  MuscleGroup,
  { prep: Exercise[]; max: Exercise[]; lock: Exercise[]; caloriesPerMin: number }
> = {
  strength: {
    prep: [
      { name: 'Динамічна розминка плечей', reps: '10 обертів', restSec: 20, cue: 'Дихай рівно, не затримуй повітря' },
      { name: 'Віджимання з колін (техніка)', reps: '6 повторень', restSec: 30, cue: 'Ліктя під 45°, кора напружена' },
      { name: 'Негативні підтягування', reps: '3 повільних опускання', restSec: 40, cue: 'Контроль на всьому шляху вниз' },
    ],
    max: [
      { name: 'Віджимання (повний діапазон)', reps: '8-12 повторень', restSec: 45, cue: 'Опускайся 2с, піднімайся 1с' },
      { name: 'Австралійські підтягування', reps: '6-8 повторень', restSec: 50, cue: 'Зводь лопатки в кінці тяги' },
      { name: 'Планка-пліччасті віджимання', reps: '6 повторень', restSec: 40, cue: 'Не провалюй поперек' },
    ],
    lock: [
      { name: 'Ізометричне утримання віджимання', reps: '20с', restSec: 30, cue: 'Дихай ритмічно, не затримуй' },
      { name: 'Суперсет: віджимання + планка', reps: '5 + 30с', restSec: 45, cue: 'Фіксуй корсет протягом усього сету' },
    ],
    caloriesPerMin: 8.5,
  },
  core: {
    prep: [
      { name: 'Дихальна діафрагмальна розминка', reps: '5 циклів', restSec: 20, cue: 'Вдих ніздрями, видих ротом' },
      { name: 'Мертвий жук (контроль)', reps: '6 повторень', restSec: 30, cue: 'Поперек притиснутий до підлоги' },
      { name: 'Ягодичний міст', reps: '8 повторень', restSec: 25, cue: 'Напружуй сідниці в піку' },
    ],
    max: [
      { name: 'Скрутки з утриманням', reps: '12 повторень', restSec: 35, cue: 'Піднімайся за рахунок преса' },
      { name: 'Бокова планка', reps: '25с на бік', restSec: 35, cue: 'Таз не провалюється' },
      { name: 'Альпініст', reps: '20 повторень', restSec: 40, cue: 'Коліна тягни до грудей' },
    ],
    lock: [
      { name: 'Планка з дотиком плечей', reps: '10 повторень', restSec: 35, cue: 'Стабілізуй таз' },
      { name: 'Лєжа ногоріз', reps: '10 повторень', restSec: 35, cue: 'Поперек притиснутий' },
    ],
    caloriesPerMin: 7,
  },
  legs: {
    prep: [
      { name: 'Динамічна розминка кульшопів', reps: '10 обертів', restSec: 20, cue: 'Рух плавний, без ривків' },
      { name: 'Присідання з опорою (техніка)', reps: '6 повторень', restSec: 30, cue: 'Коліна в напрямку носків' },
      { name: 'Випад на місці', reps: '4 на ногу', restSec: 35, cue: 'Переднє коліно над стопою' },
    ],
    max: [
      { name: 'Присідання (повний діапазон)', reps: '12-15 повторень', restSec: 45, cue: 'Вага на п\u2019ятках' },
      { name: 'Стрибкові випади', reps: '8 повторень', restSec: 50, cue: 'Приземлення м\u2019яке, контроль' },
      { name: 'Стінні присідання', reps: '40с', restSec: 45, cue: 'Стегна паралельно підлозі' },
    ],
    lock: [
      { name: 'Одноногий мертвий жук', reps: '6 на ногу', restSec: 40, cue: 'Контроль рівноваги' },
      { name: 'Суперсет: присід + стрибок', reps: '6 повторень', restSec: 50, cue: 'Вибух угорі, м\u2019яке приземлення' },
    ],
    caloriesPerMin: 9.5,
  },
  hiit: {
    prep: [
      { name: 'Суставна гімнастика', reps: '45с', restSec: 15, cue: 'Розігрій суглоби плавно' },
      { name: 'Стрибки на місці', reps: '30с', restSec: 20, cue: 'Дихай рівно, ритм серце' },
      { name: 'Присідання повільні', reps: '8 повторень', restSec: 25, cue: 'Контроль на всьому шляху' },
    ],
    max: [
      { name: 'Берві (Burpees)', reps: '40с робота / 20с відпочинок', restSec: 20, cue: 'Темп рівномірний, не спіш на техніку' },
      { name: 'Альпініст', reps: '40с / 20с', restSec: 20, cue: 'Коліна тягни до грудей' },
      { name: 'Стрибкові випади', reps: '40с / 20с', restSec: 20, cue: 'М\u2019яке приземлення' },
      { name: 'Планка-пліччасті дотики', reps: '40с / 20с', restSec: 20, cue: 'Стабілізуй таз' },
      { name: 'Високі піднімання колін', reps: '40с / 20с', restSec: 20, cue: 'Ритм дихання 2-2' },
    ],
    lock: [
      { name: 'Ізометричний спринт-стійка', reps: '30с', restSec: 25, cue: 'Затримай стан, не здавайся' },
      { name: 'Фініш: 10 берві', reps: '10 повторень', restSec: 30, cue: 'Останній ривок — все до кінця!' },
    ],
    caloriesPerMin: 12.5,
  },
};

function scaleExercise(ex: Exercise, level: Level): Exercise {
  const m = multipliers[level];
  const scaleReps = (r: string): string => {
    const match = r.match(/^(\d+)(.*)$/);
    if (!match) return r;
    const base = parseInt(match[1], 10);
    const scaled = Math.round(base * m.reps);
    return `${scaled}${match[2]}`;
  };
  if (ex.reps.includes('/')) {
    const parts = ex.reps.split('/').map((p) => p.trim());
    return { ...ex, reps: `${scaleReps(parts[0])} / ${scaleReps(parts[1])}`, restSec: Math.round(ex.restSec * m.rest) };
  }
  if (ex.reps.includes('-')) {
    const parts = ex.reps.split('-').map((p) => p.trim());
    return {
      ...ex,
      reps: `${scaleReps(parts[0])}-${scaleReps(parts[1])}`,
      restSec: Math.round(ex.restSec * m.rest),
    };
  }
  if (ex.reps.includes('+')) {
    const parts = ex.reps.split('+').map((p) => p.trim());
    return { ...ex, reps: `${scaleReps(parts[0])} + ${scaleReps(parts[1])}`, restSec: Math.round(ex.restSec * m.rest) };
  }
  return { ...ex, reps: scaleReps(ex.reps), restSec: Math.round(ex.restSec * m.rest) };
}

const phaseLabels: Record<Phase, string> = {
  prep: 'Підготовка техніки',
  max: 'Максимальний сет',
  lock: 'Закріплення',
};

const barrierIntros: Record<Barrier, string> = {
  fatigue:
    'Відчуваєш брак сил після навчання — це нормально. Розбиваємо складе завдання на 3 адаптивні сети з відпочинком. Ти не здаєшся — ти розвиваєшся крок за кроком.',
  technique:
    'Страх важких вправ — через відсутність техніки. Сьогодні ми будуємо її з нуля: спочатку контроль, потім сила. Ніякої поспіху, ніякого сорому.',
  challenge:
    'Hardcore Mode Activated. 15 хвилин повної віддачі. Ти готовий — доведіть, що система працює. Увімкнено трекінг кожного сету.',
};

export function generateFallbackWorkout(input: SessionInput): WorkoutPlan {
  const lib = muscleLib[input.muscle];
  const m = multipliers[input.level];
  const isChallenge = input.barrier === 'challenge';

  const prepEx = lib.prep.map((e) => scaleExercise(e, input.level));
  const maxEx = lib.max.map((e) => scaleExercise(e, input.level));
  const lockEx = lib.lock.map((e) => scaleExercise(e, input.level));

  if (isChallenge) {
    // Hardcore: 15 min full complex, expanded max
    const maxExpanded = [...maxEx, ...maxEx.slice(0, Math.ceil(maxEx.length * 0.5))];
    const rounds: Round[] = [
      { phase: 'prep', label: 'РАУНД 1 — Підготовка', goal: 'Розігрів + активaція', exercises: prepEx, restBetweenRoundsSec: 30 },
      { phase: 'max', label: 'РАУНД 2 — Максимальний сет', goal: 'Висока інтенсивність, 4 цикли', exercises: maxExpanded, restBetweenRoundsSec: 25 },
      { phase: 'lock', label: 'РАУНД 3 — Фініш-закріплення', goal: 'Ізометрія + вибух', exercises: lockEx, restBetweenRoundsSec: 0 },
    ];
    appendWeightedRound(rounds, input.weightedExercises);
    const durationMin = 15 + (input.weightedExercises?.length ? 5 : 0);
    return {
      title: `${hardcoreTitle(input.muscle)} — Hardcore Sprint`,
      mode: 'hardcore',
      durationMin,
      estimatedCalories: Math.round(durationMin * lib.caloriesPerMin * m.reps),
      estimatedXp: Math.round(durationMin * 12 * m.reps),
      intro: barrierIntros.challenge,
      rounds,
      closingTip: 'Ти зробив те, що більшість не наважується. Зафіксуй результат і відпочивай 24-48 годин перед наступним спринтом.',
    };
  }

  // Adaptive (fatigue/technique): 3 adaptive sets
  const rounds: Round[] = [
    { phase: 'prep', label: `РАУНД 1 — ${phaseLabels.prep}`, goal: 'Техніка та контроль', exercises: prepEx, restBetweenRoundsSec: 45 },
    { phase: 'max', label: `РАУНД 2 — ${phaseLabels.max}`, goal: 'Максимальний в межах комфорту', exercises: maxEx, restBetweenRoundsSec: 60 },
    { phase: 'lock', label: `РАУНД 3 — ${phaseLabels.lock}`, goal: 'Закріпити правильний рух', exercises: lockEx, restBetweenRoundsSec: 0 },
  ];
  appendWeightedRound(rounds, input.weightedExercises);
  const durationMin = Math.round(
    (prepEx.length + maxEx.length + lockEx.length) * 0.8 +
      rounds.reduce((acc, r) => acc + r.restBetweenRoundsSec, 0) / 60 +
      (input.weightedExercises?.length ? 5 : 0),
  );
  return {
    title: adaptiveTitle(input.muscle, input.barrier),
    mode: 'adaptive',
    durationMin: Math.max(durationMin, 8),
    estimatedCalories: Math.round(durationMin * lib.caloriesPerMin * 0.85),
    estimatedXp: Math.round(durationMin * 8 * m.reps),
    intro: barrierIntros[input.barrier],
    rounds,
    closingTip:
      input.barrier === 'fatigue'
        ? 'Ти навчився тренуватись через втому, не перевантажуючи організм. Повторюй 3x на тиждень.'
        : 'Техніка — це твоя фундамент. Наступного разу збільшуй навантаження на 5-10%.',
  };
}

function hardcoreTitle(m: MuscleGroup): string {
  return { strength: 'Iron Pulse', core: 'Core Crucible', legs: 'Leg Inferno', hiit: 'HIIT Overdrive' }[m];
}
function adaptiveTitle(m: MuscleGroup, b: Barrier): string {
  const base = { strength: 'Strength Builder', core: 'Core Foundation', legs: 'Leg Endurance', hiit: 'HIIT Starter' }[m];
  const tag = b === 'fatigue' ? 'Anti-Fatigue' : 'Tech-First';
  return `${base} — ${tag}`;
}

const equipmentLabels: Record<string, string> = {
  kettlebell: 'гиря',
  dumbbell: 'гантелі',
  barbell: 'штанга',
};

function appendWeightedRound(rounds: Round[], weighted?: WeightedSelection[]): void {
  if (!weighted || weighted.length === 0) return;

  const exercises: Exercise[] = weighted.map((w) => ({
    name: w.name,
    reps: formatPrescription(w.sets, w.reps, w.repsUnit),
    restSec: w.restSec,
    cue: w.cue,
    equipment: w.equipment,
    weightKg: w.weightKg,
    sets: w.sets,
  }));

  rounds.push({
    phase: 'max',
    label: `РАУНД ${rounds.length + 1} — Власні вправи з інвентарем`,
    goal: `Підходи з обраним обладнанням (${weighted.map((w) => equipmentLabels[w.equipment] ?? w.equipment).join(', ')})`,
    exercises,
    restBetweenRoundsSec: 60,
  });
}
