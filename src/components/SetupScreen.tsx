import { useState } from 'react';
import {
  Dumbbell,
  Hexagon,
  Footprints,
  Zap,
  Settings,
  Flame,
  Activity,
  Timer,
  AlertTriangle,
  Rocket,
  ChevronRight,
  CircleDot,
  Plus,
  X,
  Check,
  Weight,
  Trash2,
  Filter,
} from 'lucide-react';
import type { MuscleGroup, Barrier, Level, SessionInput, WeightedSelection, Equipment } from '@/types';
import { MUSCLE_LABELS, BARRIER_LABELS, LEVEL_LABELS } from '@/types';
import {
  EQUIPMENT_LABELS,
  WEIGHTED_LIBRARY,
  filterByEquipment,
  type WeightedExercise,
} from '@/weightedLibrary';

interface Props {
  onGenerate: (input: SessionInput) => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  loading: boolean;
}

const muscleIcons: Record<MuscleGroup, typeof Dumbbell> = {
  strength: Dumbbell,
  core: Hexagon,
  legs: Footprints,
  hiit: Zap,
};

const barriers: { id: Barrier; emoji: string }[] = [
  { id: 'fatigue', emoji: '🔴' },
  { id: 'technique', emoji: '🟡' },
  { id: 'challenge', emoji: '🟢' },
];

const levels: Level[] = ['beginner', 'intermediate', 'pro'];

const equipmentIcons: Record<Equipment, typeof Dumbbell> = {
  kettlebell: CircleDot,
  dumbbell: Dumbbell,
  barbell: Weight,
};

interface SelectedExercise {
  baseId: string;
  name: string;
  equipment: Equipment;
  reps: string;
  sets: number;
  weightKg: number;
  restSec: number;
  cue: string;
}

export default function SetupScreen({ onGenerate, onOpenSettings, hasApiKey, loading }: Props) {
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [barrier, setBarrier] = useState<Barrier | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [showError, setShowError] = useState(false);

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [muscleFilter, setMuscleFilter] = useState<string | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWeight, setCustomWeight] = useState('10');
  const [customReps, setCustomReps] = useState('10');
  const [customSets, setCustomSets] = useState('3');
  const [customEquip, setCustomEquip] = useState<Equipment>('dumbbell');

  const filteredLibrary: WeightedExercise[] = selectedEquipment
    ? filterByEquipment(selectedEquipment).filter(
        (ex) => muscleFilter === 'all' || ex.muscleGroup === muscleFilter,
      )
    : [];

  const handleAddFromLibrary = (ex: WeightedExercise) => {
    const id = `lib-${ex.id}-${selectedExercises.length}`;
    setSelectedExercises((prev) => [
      ...prev,
      {
        baseId: id,
        name: ex.name,
        equipment: ex.equipment,
        reps: ex.defaultReps,
        sets: ex.defaultSets,
        weightKg: ex.defaultWeightKg,
        restSec: ex.restSec,
        cue: ex.cue,
      },
    ]);
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const id = `custom-${Date.now()}`;
    setSelectedExercises((prev) => [
      ...prev,
      {
        baseId: id,
        name: customName.trim(),
        equipment: customEquip,
        reps: `${customReps || '10'} повторень`,
        sets: parseInt(customSets) || 3,
        weightKg: parseFloat(customWeight) || 0,
        restSec: 45,
        cue: 'Контроль техніки, рівне дихання',
      },
    ]);
    setCustomName('');
    setCustomWeight('10');
    setCustomReps('10');
    setCustomSets('3');
    setShowAddForm(false);
  };

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises((prev) => prev.filter((e) => e.baseId !== id));
  };

  const handleUpdateWeight = (id: string, delta: number) => {
    setSelectedExercises((prev) =>
      prev.map((e) => (e.baseId === id ? { ...e, weightKg: Math.max(0, +(e.weightKg + delta).toFixed(1)) } : e)),
    );
  };

  const handleUpdateSets = (id: string, delta: number) => {
    setSelectedExercises((prev) =>
      prev.map((e) => (e.baseId === id ? { ...e, sets: Math.max(1, Math.min(10, e.sets + delta)) } : e)),
    );
  };

  const handleGenerate = () => {
    if (!muscle || !level) {
      setShowError(true);
      return;
    }
    setShowError(false);
    const weighted: WeightedSelection[] | undefined =
      selectedExercises.length > 0
        ? selectedExercises.map((e) => ({
            id: e.baseId,
            name: e.name,
            equipment: e.equipment,
            reps: e.reps,
            sets: e.sets,
            weightKg: e.weightKg,
            restSec: e.restSec,
            cue: e.cue,
          }))
        : undefined;
    onGenerate({ muscle: muscle!, level: level!, barrier: barrier ?? 'challenge', weightedExercises: weighted });
  };

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-neon-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 right-0 w-96 h-96 rounded-full bg-neon-pink/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-neon-green/5 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-cyber-border/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-blue to-neon-pink flex items-center justify-center shadow-lg">
              <Activity size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 rounded-xl bg-neon-blue/30 blur-md -z-10" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight leading-none">
              FitStart <span className="text-neon-blue text-glow-blue">Pro</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-cyber-muted tracking-widest uppercase">
              Habit &amp; Workout Engine
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-cyber-border hover:border-neon-blue/50 bg-cyber-surface/60 text-xs sm:text-sm transition-all group"
        >
          <Settings size={15} className="text-neon-blue group-hover:rotate-45 transition-transform duration-300" />
          <span className="font-medium">API / Налаштування</span>
          <span
            className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-neon-green animate-pulse' : 'bg-cyber-muted'}`}
            title={hasApiKey ? 'Ключ активний' : 'Fallback-режим'}
          />
        </button>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-blue/30 bg-neon-blue/5 text-xs text-neon-blue mb-4">
            <Flame size={12} />
            <span className="tracking-widest uppercase">Електронний дашборд</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight max-w-2xl mx-auto">
            Обери цільові м'язи та подолай свій{' '}
            <span className="text-neon-pink text-glow-pink">головний бар'єр</span> перед важким тренуванням
          </h2>
          <p className="text-cyber-muted mt-3 text-sm sm:text-base max-w-xl mx-auto">
            Від мікро-кроків до системних навантажень. Без токсичної критики — лише дисципліна та прогрес.
          </p>
        </div>

        <section className="mb-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell size={16} className="text-neon-blue" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-cyber-muted">
              Цільова група м'язів / Напрямок
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map((id) => {
              const Icon = muscleIcons[id];
              const meta = MUSCLE_LABELS[id];
              const active = muscle === id;
              return (
                <button
                  key={id}
                  onClick={() => setMuscle(id)}
                  className={`group relative cyber-panel p-4 text-left transition-all hover:border-neon-blue/50 ${
                    active ? 'border-neon-blue bg-neon-blue/10 animate-glow-blue' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        active ? 'bg-neon-blue/20 text-neon-blue' : 'bg-cyber-bg text-cyber-muted'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    {active && (
                      <span className="text-[10px] text-neon-blue font-mono uppercase tracking-wider">Обрано</span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm sm:text-base">{meta.title}</h4>
                  <p className="text-xs text-cyber-muted mt-0.5">{meta.sub}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-neon-pink" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-cyber-muted">
              Оцінка поточного бар'єру
            </h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {barriers.map(({ id, emoji }) => {
              const meta = BARRIER_LABELS[id];
              const active = barrier === id;
              const ringColor =
                meta.color === 'red'
                  ? 'border-neon-red animate-glow-pink'
                  : meta.color === 'amber'
                    ? 'border-neon-amber'
                    : 'border-neon-green animate-glow-green';
              return (
                <button
                  key={id}
                  onClick={() => setBarrier(id)}
                  className={`group relative cyber-panel p-4 text-left transition-all hover:border-neon-pink/40 ${
                    active ? `bg-cyber-surface2 ${ringColor}` : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <h4 className="font-bold text-sm">{meta.title}</h4>
                      <p className="text-xs text-cyber-muted mt-0.5">{meta.sub}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-10 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Timer size={16} className="text-neon-green" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-cyber-muted">
              Рівень підготовки
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {levels.map((id, i) => {
              const active = level === id;
              const bars = i + 1;
              return (
                <button
                  key={id}
                  onClick={() => setLevel(id)}
                  className={`group relative cyber-panel p-4 text-center transition-all hover:border-neon-green/50 ${
                    active ? 'border-neon-green bg-neon-green/10 animate-glow-green' : ''
                  }`}
                >
                  <div className="flex items-end justify-center gap-1 h-6 mb-2">
                    {[1, 2, 3].map((b) => (
                      <div
                        key={b}
                        className={`w-2 rounded-sm transition-colors ${
                          b <= bars ? (active ? 'bg-neon-green' : 'bg-cyber-muted/60') : 'bg-cyber-border'
                        }`}
                        style={{ height: `${b * 8 + 8}px` }}
                      />
                    ))}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm">{LEVEL_LABELS[id]}</h4>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-10 animate-slide-up" style={{ animationDelay: '0.18s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Weight size={16} className="text-neon-amber" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-cyber-muted">
              Інвентар з вільними вагами (опціонально)
            </h3>
          </div>
          <p className="text-xs text-cyber-muted mb-4">
            Обери тип обладнання, переглянь каталог вправ і додай потрібні у свій план з вказанням ваги та підходів.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((eq) => {
              const Icon = equipmentIcons[eq];
              const meta = EQUIPMENT_LABELS[eq];
              const active = selectedEquipment === eq;
              return (
                <button
                  key={eq}
                  onClick={() => setSelectedEquipment(active ? null : eq)}
                  className={`group relative cyber-panel p-4 text-left transition-all hover:border-neon-amber/50 ${
                    active ? 'border-neon-amber bg-neon-amber/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        active ? 'bg-neon-amber/20 text-neon-amber' : 'bg-cyber-bg text-cyber-muted'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    {active && <Check size={16} className="text-neon-amber" />}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm">{meta.title}</h4>
                  <p className="text-[11px] text-cyber-muted mt-0.5">{meta.sub}</p>
                </button>
              );
            })}
          </div>

          {selectedEquipment && (
            <div className="cyber-panel p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-cyber-muted" />
                  <span className="text-xs text-cyber-muted uppercase tracking-widest">Фільтр:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setMuscleFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        muscleFilter === 'all'
                          ? 'bg-neon-amber/15 text-neon-amber border border-neon-amber/40'
                          : 'text-cyber-muted hover:text-cyber-text'
                      }`}
                    >
                      Усі
                    </button>
                    {(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map((mg) => (
                      <button
                        key={mg}
                        onClick={() => setMuscleFilter(mg)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          muscleFilter === mg
                            ? 'bg-neon-amber/15 text-neon-amber border border-neon-amber/40'
                            : 'text-cyber-muted hover:text-cyber-text'
                        }`}
                      >
                        {MUSCLE_LABELS[mg].title}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neon-blue/40 bg-neon-blue/5 hover:bg-neon-blue/15 text-neon-blue text-xs font-semibold transition-all"
                >
                  <Plus size={14} />
                  Власна вправа
                </button>
              </div>

              {showAddForm && (
                <div className="mb-4 p-4 rounded-xl border border-neon-blue/30 bg-neon-blue/5 animate-fade-in space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-cyber-muted block mb-1">
                        Назва вправи
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="напр. Тяга гантелі в нахилі"
                        className="w-full px-3 py-2 rounded-lg bg-cyber-bg border border-cyber-border text-sm focus:border-neon-blue/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-cyber-muted block mb-1">
                        Інвентар
                      </label>
                      <div className="flex gap-1.5">
                        {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((eq) => (
                          <button
                            key={eq}
                            onClick={() => setCustomEquip(eq)}
                            className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                              customEquip === eq
                                ? 'bg-neon-amber/15 text-neon-amber border border-neon-amber/40'
                                : 'text-cyber-muted border border-cyber-border hover:text-cyber-text'
                            }`}
                          >
                            {EQUIPMENT_LABELS[eq].title}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-cyber-muted block mb-1">
                          Вага (кг)
                        </label>
                        <input
                          type="number"
                          value={customWeight}
                          onChange={(e) => setCustomWeight(e.target.value)}
                          className="w-full px-2 py-2 rounded-lg bg-cyber-bg border border-cyber-border text-sm text-center focus:border-neon-blue/50 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-cyber-muted block mb-1">
                          Повт.
                        </label>
                        <input
                          type="number"
                          value={customReps}
                          onChange={(e) => setCustomReps(e.target.value)}
                          className="w-full px-2 py-2 rounded-lg bg-cyber-bg border border-cyber-border text-sm text-center focus:border-neon-blue/50 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-cyber-muted block mb-1">
                          Сети
                        </label>
                        <input
                          type="number"
                          value={customSets}
                          onChange={(e) => setCustomSets(e.target.value)}
                          className="w-full px-2 py-2 rounded-lg bg-cyber-bg border border-cyber-border text-sm text-center focus:border-neon-blue/50 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCustom}
                      disabled={!customName.trim()}
                      className="flex-1 py-2 rounded-lg bg-neon-blue/15 border border-neon-blue/40 text-neon-blue text-sm font-semibold hover:bg-neon-blue/25 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} /> Додати
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 rounded-lg border border-cyber-border text-cyber-muted text-sm hover:text-cyber-text transition-colors"
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredLibrary.length === 0 ? (
                  <p className="text-xs text-cyber-muted text-center py-6">
                    Немає вправ для цього фільтру
                  </p>
                ) : (
                  filteredLibrary.map((ex) => {
                    const alreadyAdded = selectedExercises.some((s) => s.baseId === `lib-${ex.id}-${selectedExercises.length}` && s.name === ex.name);
                    return (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-cyber-border bg-cyber-bg/40 hover:border-neon-amber/30 transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm truncate">{ex.name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-cyber-muted flex-wrap">
                            <span className="text-neon-amber">{ex.defaultWeightKg} кг</span>
                            <span>·</span>
                            <span>{ex.defaultSets}×{ex.defaultReps}</span>
                            <span>·</span>
                            <span>{MUSCLE_LABELS[ex.muscleGroup].title}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddFromLibrary(ex)}
                          className="shrink-0 w-8 h-8 rounded-lg border border-neon-amber/40 bg-neon-amber/5 text-neon-amber hover:bg-neon-amber/20 flex items-center justify-center transition-all"
                          aria-label="Додати вправу"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {selectedExercises.length > 0 && (
            <div className="mt-4 cyber-panel p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-neon-amber flex items-center gap-2">
                  <Weight size={14} />
                  Обрані вправи ({selectedExercises.length})
                </h4>
              </div>
              <div className="space-y-2">
                {selectedExercises.map((ex) => {
                  const Icon = equipmentIcons[ex.equipment];
                  return (
                    <div
                      key={ex.baseId}
                      className="flex items-center gap-3 p-3 rounded-xl border border-neon-amber/20 bg-neon-amber/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-neon-amber/15 text-neon-amber flex items-center justify-center shrink-0">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-sm truncate">{ex.name}</h5>
                        <p className="text-[11px] text-cyber-muted">{EQUIPMENT_LABELS[ex.equipment].title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-cyber-muted uppercase">кг</span>
                          <button
                            onClick={() => handleUpdateWeight(ex.baseId, -2.5)}
                            className="w-6 h-6 rounded-md border border-cyber-border text-cyber-muted hover:text-neon-amber hover:border-neon-amber/40 flex items-center justify-center transition-all text-xs"
                          >
                            -
                          </button>
                          <span className="text-sm font-mono font-bold text-neon-amber tabular-nums w-10 text-center">
                            {ex.weightKg}
                          </span>
                          <button
                            onClick={() => handleUpdateWeight(ex.baseId, 2.5)}
                            className="w-6 h-6 rounded-md border border-cyber-border text-cyber-muted hover:text-neon-amber hover:border-neon-amber/40 flex items-center justify-center transition-all text-xs"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-cyber-muted uppercase">сети</span>
                          <button
                            onClick={() => handleUpdateSets(ex.baseId, -1)}
                            className="w-6 h-6 rounded-md border border-cyber-border text-cyber-muted hover:text-neon-amber hover:border-neon-amber/40 flex items-center justify-center transition-all text-xs"
                          >
                            -
                          </button>
                          <span className="text-sm font-mono font-bold tabular-nums w-6 text-center">{ex.sets}</span>
                          <button
                            onClick={() => handleUpdateSets(ex.baseId, 1)}
                            className="w-6 h-6 rounded-md border border-cyber-border text-cyber-muted hover:text-neon-amber hover:border-neon-amber/40 flex items-center justify-center transition-all text-xs"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveExercise(ex.baseId)}
                          className="w-7 h-7 rounded-lg border border-neon-red/30 text-neon-red/70 hover:bg-neon-red/10 hover:text-neon-red flex items-center justify-center transition-all shrink-0"
                          aria-label="Видалити вправу"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {showError && (
          <div className="mb-6 cyber-panel border-neon-red/40 p-4 flex items-start gap-3 animate-fade-in bg-neon-red/5">
            <AlertTriangle size={20} className="text-neon-red shrink-0 mt-0.5" />
            <p className="text-sm text-neon-red leading-relaxed">
              Будь ласка, вкажіть цільову групу м'язів та рівень підготовки для безпечного розрахунку навантаження.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="group relative w-full sm:w-auto px-8 sm:px-12 py-5 rounded-2xl bg-gradient-to-r from-neon-blue via-neon-pink to-neon-blue bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-neon-blue to-neon-pink blur-lg opacity-50 -z-10 group-hover:opacity-70 transition-opacity" />
            <span className="flex items-center justify-center gap-3 text-white font-bold text-base sm:text-lg">
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Генеруємо...
                </>
              ) : (
                <>
                  <Rocket size={22} />
                  Згенерувати хардкор-спринт та розбити бар'єри
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>
          {!hasApiKey && (
            <p className="text-xs text-cyber-muted">
              Працює у <span className="text-neon-green font-semibold">Fallback-режимі</span> — алгоритмічні плани без
              API ключа
            </p>
          )}
          {selectedExercises.length > 0 && (
            <p className="text-xs text-neon-amber font-semibold">
              {selectedExercises.length} вправ з інвентарем додано у план
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
