import type { SessionInput, WorkoutPlan, Round, Exercise, Phase, WeightedSelection } from './types';
import { formatPrescription } from './types';
import { generateFallbackWorkout } from './fallbackEngine';

const DEFAULT_MODEL = 'nvidia/nemotron-3.5-super-vl:free';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export interface ModelOption {
  id: string;
  label: string;
  description: string;
  free: boolean;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'nvidia/nemotron-3.5-super-vl:free', label: 'Nemotron 3.5 Super VL', description: 'NVIDIA · мультимодальна, рекомендована', free: true },
  { id: 'dots-studio/dots-3-note-preview:free', label: 'Dots3-Note Preview', description: 'Dots Studio · нотатковий превʼю', free: true },
  { id: 'nvidia/nemotron-3.5-lightning:free', label: 'Nemotron 3.5 Lightning', description: 'NVIDIA · швидкий легкий варіант', free: true },
  { id: 'nvidia/nemotron-3.5-content-safety:free', label: 'Nemotron 3.5 Content Safety', description: 'NVIDIA · контроль безпеки контенту', free: true },
];

export function getModel(): string {
  try {
    return localStorage.getItem('openrouter_model') ?? DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function saveModel(model: string) {
  localStorage.setItem('openrouter_model', model);
}

export function getApiKey(): string {
  try {
    return localStorage.getItem('openrouter_api_key') ?? '';
  } catch {
    return '';
  }
}

export function saveApiKey(key: string) {
  localStorage.setItem('openrouter_api_key', key.trim());
}

export function clearApiKey() {
  localStorage.removeItem('openrouter_api_key');
}

function buildPrompt(input: SessionInput): string {
  const barrierText =
    input.barrier === 'fatigue'
      ? 'Страх перевтоми / брак сил після навчання (психологічний+фізичний бар`єр)'
      : input.barrier === 'technique'
        ? 'Страх робити важкі вправи через відсутність техніки'
        : 'Готовий до максимального челенджу (Hardcore Mode)';

  const isHardcore = input.barrier === 'challenge';

  const weightedSection = input.weightedExercises?.length
    ? `\n  - Користувач обрав вправи з вільними вагами (додай їх окремим раундом "Власні вправи з інвентарем"):\n${input.weightedExercises.map((w) => `    · ${w.name} — ${formatPrescription(w.sets, w.reps, w.repsUnit)}, ${w.weightKg} кг (${w.equipment})`).join('\n')}\n`
    : '';

  return `Ти — професійний спортивний тренер-мотиватор для підлітків, який створює безпечні, але потужні тренування.
Створи тренування СТРОГО у форматі JSON (без жодного тексту поза JSON).

ПАРАМЕТРИ:
- Група м'язів/напрямок: ${input.muscle}
- Бар'єр: ${barrierText}
- Рівень підготовки: ${input.level}
- Мова плану: українська${weightedSection}

ВИМОГИ:
${isHardcore
  ? `- Hardcore Mode: 15-хвилинний повноцінний комплекс високої інтенсивності з трекінгом кожного сету.
  - Мінімум 3 раунди, у РАУНД 2 — 4-6 вправ.`
  : `- Адаптивний режим (бар'єр): 3 раунди — РАУНД 1 підготовка техніки, РАУНД 2 максимальний сет, РАУНД 3 закріплення.
  - Розбиваємо складне на крокові сети з відпочинком. Тон — підтримка, без токсичної критики.`}
- Кожна вправа має reps, restSec (відпочинок у секундах), cue (коротка підказка щодо дихання/безпеки).
- Прогресія навантаження від раунду до раунду має бути реалістичною для рівня "${input.level}".
- estimatedCalories та estimatedXp — реалістичні для тривалості та інтенсивності.

JSON СХЕМА:
{
  "title": string,
  "mode": "${isHardcore ? 'hardcore' : 'adaptive'}",
  "durationMin": number,
  "estimatedCalories": number,
  "estimatedXp": number,
  "intro": string,
  "rounds": [
    {
      "phase": "prep" | "max" | "lock",
      "label": string,
      "goal": string,
      "restBetweenRoundsSec": number,
      "exercises": [
        { "name": string, "reps": string, "restSec": number, "cue": string }
      ]
    }
  ],
  "closingTip": string
}

Видай ТІЛЬКИ валідний JSON. Без markdown, без коментарів.`;
}

function isPlanObject(raw: unknown): raw is Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return false;
  const p = raw as Record<string, unknown>;
  if (typeof p.title !== 'string' || !Array.isArray(p.rounds)) return false;
  for (const r of p.rounds as Record<string, unknown>[]) {
    if (!Array.isArray(r.exercises)) return false;
    for (const e of r.exercises as Record<string, unknown>[]) {
      if (typeof e.name !== 'string' || typeof e.reps !== 'string') return false;
    }
  }
  return true;
}

function coercePlan(raw: Record<string, unknown>): WorkoutPlan {
  const rounds = (raw.rounds as Array<Record<string, unknown>>).map((r) => {
    const phase = (r.phase as Phase) ?? 'max';
    return {
      phase,
      label: String(r.label ?? phase),
      goal: String(r.goal ?? ''),
      restBetweenRoundsSec: Number(r.restBetweenRoundsSec ?? 30) || 30,
      exercises: (r.exercises as Array<Record<string, unknown>>).map((e) => ({
        name: String(e.name ?? 'Вправа'),
        reps: String(e.reps ?? '8-10'),
        restSec: Number(e.restSec ?? 30) || 30,
        cue: String(e.cue ?? 'Дихай рівно'),
        ...(e.equipment ? { equipment: e.equipment as Exercise['equipment'] } : {}),
        ...(e.weightKg != null ? { weightKg: Number(e.weightKg) } : {}),
        ...(e.sets != null ? { sets: Number(e.sets) } : {}),
      })),
    } as Round;
  });

  return {
    title: String(raw.title ?? 'AI Workout'),
    mode: (raw.mode as 'adaptive' | 'hardcore') ?? 'adaptive',
    durationMin: Number(raw.durationMin ?? 15) || 15,
    estimatedCalories: Number(raw.estimatedCalories ?? 120) || 120,
    estimatedXp: Number(raw.estimatedXp ?? 80) || 80,
    intro: String(raw.intro ?? ''),
    rounds,
    closingTip: String(raw.closingTip ?? 'Вітаю з завершенням!'),
  };
}

function extractJson(text: string): string {
  // strip code fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  // find first { ... last }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

export async function generateWorkout(input: SessionInput): Promise<{ plan: WorkoutPlan; source: 'ai' | 'fallback' }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { plan: generateFallbackWorkout(input), source: 'fallback' };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FitStart Pro',
      },
      body: JSON.stringify({
        model: getModel(),
        messages: [
          { role: 'system', content: 'Ти спортивний AI-тренер. Завжди відповідаєш валідним JSON.' },
          { role: 'user', content: buildPrompt(input) },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('OpenRouter error', res.status, errText);
      return { plan: generateFallbackWorkout(input), source: 'fallback' };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content as string | undefined;
    if (!content) throw new Error('Порожня відповідь');

    const jsonStr = extractJson(content);
    const parsed = JSON.parse(jsonStr);
    if (!isPlanObject(parsed)) throw new Error('Невалідна схема');
    const plan = coercePlan(parsed);
    if (input.weightedExercises?.length && !plan.rounds.some((r) => r.exercises.some((e) => e.equipment))) {
      appendWeightedToPlan(plan, input.weightedExercises);
    }
    return { plan, source: 'ai' };
  } catch (err) {
    console.warn('AI generation failed, using fallback', err);
    return { plan: generateFallbackWorkout(input), source: 'fallback' };
  }
}

export interface TestResult {
  ok: boolean;
  message: string;
  modelLabel?: string;
}

export async function testConnection(apiKey: string, model: string): Promise<TestResult> {
  if (!apiKey.trim()) {
    return { ok: false, message: 'Введіть API ключ' };
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FitStart Pro',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: 'Відповідь одним словом: OK' },
        ],
        max_tokens: 10,
      }),
    });

    if (res.ok) {
      await res.json().catch(() => null);
      const label = MODEL_OPTIONS.find((m) => m.id === model)?.label ?? model;
      return { ok: true, message: `Підключення успішне · ${label}`, modelLabel: label };
    }

    if (res.status === 401) return { ok: false, message: 'Невірний API ключ' };
    if (res.status === 402) return { ok: false, message: 'Недостатньо кредитів на OpenRouter' };
    if (res.status === 404) return { ok: false, message: 'Модель не знайдена. Оберіть іншу' };
    if (res.status === 429) return { ok: false, message: 'Забагато запитів. Спробуйте пізніше' };
    return { ok: false, message: `Помилка ${res.status}. Перевірте ключ та модель` };
  } catch {
    return { ok: false, message: 'Не вдалося з\u2019єднатися. Перевірте інтернет' };
  }
}

export type { Exercise, Round, WorkoutPlan };

const equipmentLabels: Record<string, string> = {
  kettlebell: 'гиря',
  dumbbell: 'гантелі',
  barbell: 'штанга',
};

function appendWeightedToPlan(plan: WorkoutPlan, weighted: WeightedSelection[]): void {
  const exercises: Exercise[] = weighted.map((w) => ({
    name: w.name,
    reps: formatPrescription(w.sets, w.reps, w.repsUnit),
    restSec: w.restSec,
    cue: w.cue,
    equipment: w.equipment,
    weightKg: w.weightKg,
    sets: w.sets,
  }));

  plan.rounds.push({
    phase: 'max',
    label: `РАУНД ${plan.rounds.length + 1} — Власні вправи з інвентарем`,
    goal: `Підходи з обраним обладнанням (${weighted.map((w) => equipmentLabels[w.equipment] ?? w.equipment).join(', ')})`,
    exercises,
    restBetweenRoundsSec: 60,
  });
}
