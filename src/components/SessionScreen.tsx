import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Check,
  Flame,
  Zap,
  Trophy,
  Timer as TimerIcon,
  Heart,
  Wind,
  ShieldAlert,
  CheckCircle2,
  Home,
  Activity,
  Dumbbell,
  ChevronRight,
  ArrowRight,
  Weight,
  CircleDot,
} from 'lucide-react';
import type { WorkoutPlan, Round, Exercise } from '@/types';
import { pluralizeUk } from '@/types';
import { formatTime } from '@/useCountdown';
import { EQUIPMENT_LABELS } from '@/weightedLibrary';
import { ExerciseInstruction } from '@/components/ExerciseInstruction';
import { workoutXp } from '@/gamification';
import { UserProfile as UserProfileCard } from '@/components/UserProfile';

interface Props {
  plan: WorkoutPlan;
  source: 'ai' | 'fallback';
  profile: { level: number; xp: number; totalXpEarned: number; totalWorkouts: number };
  onComplete: (xpEarned: number) => void;
  onRestart: () => void;
}

type ActiveTimerKind = 'work' | 'rest' | 'round' | 'none';

export default function SessionScreen({ plan, source, profile, onComplete, onRestart }: Props) {
  const allExercises = useMemo(() => {
    return plan.rounds.flatMap((r, ri) =>
      r.exercises.map((ex, ei) => ({
        roundIndex: ri,
        exIndex: ei,
        exercise: ex,
        round: r,
      })),
    );
  }, [plan]);

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [activeTimer, setActiveTimer] = useState<ActiveTimerKind>('none');
  const [phase, setPhase] = useState<'ready' | 'preview' | 'active' | 'finished'>('ready');

  const totalSets = allExercises.length;
  const doneCount = completed.size;
  const progress = totalSets > 0 ? (doneCount / totalSets) * 100 : 0;

  const liveXp = Math.round((doneCount / Math.max(totalSets, 1)) * plan.estimatedXp);
  const liveCalories = Math.round((doneCount / Math.max(totalSets, 1)) * plan.estimatedCalories);

  const allDone = doneCount === totalSets && totalSets > 0;

  const xpEarned = allDone
    ? workoutXp({
        durationMin: plan.durationMin,
        completedSets: doneCount,
        totalSets,
      })
    : 0;

  const handleFinish = () => {
    setPhase('finished');
    onComplete(xpEarned);
  };

  if (phase === 'finished') {
    return <FinishedView plan={plan} doneCount={doneCount} totalSets={totalSets} liveCalories={liveCalories} xpEarned={xpEarned} onRestart={onRestart} />;
  }

  if (phase === 'ready') {
    return (
      <>
        <div className="relative z-10 mb-4">
          <UserProfileCard profile={profile} compact />
        </div>
        <ReadyView
          plan={plan}
          source={source}
          profile={profile}
          onStart={() => {
            setPhase('preview');
          }}
          onRestart={onRestart}
        />
      </>
    );
  }

  if (phase === 'preview') {
    return (
      <PreviewView
        plan={plan}
        source={source}
        onStart={() => {
          setPhase('active');
        }}
        onBack={() => {
          setPhase('ready');
        }}
      />
    );
  }

  return (
    <ActiveSession
      plan={plan}
      source={source}
      profile={profile}
      xpEarned={xpEarned}
      allExercises={allExercises}
      completed={completed}
      setCompleted={setCompleted}
      currentRoundIndex={currentRoundIndex}
      setCurrentRoundIndex={setCurrentRoundIndex}
      currentExerciseIndex={currentExerciseIndex}
      setCurrentExerciseIndex={setCurrentExerciseIndex}
      activeTimer={activeTimer}
      setActiveTimer={setActiveTimer}
      doneCount={doneCount}
      totalSets={totalSets}
      progress={progress}
      liveXp={liveXp}
      liveCalories={liveCalories}
      allDone={allDone}
      onFinish={handleFinish}
      onRestart={onRestart}
    />
  );
}

function ReadyView({
  plan,
  source,
  profile,
  onStart,
  onRestart,
}: {
  plan: WorkoutPlan;
  source: 'ai' | 'fallback';
  profile: { level: number; xp: number; totalXpEarned: number; totalWorkouts: number };
  onStart: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="min-h-screen grid-bg relative overflow-hidden flex items-center justify-center p-4">
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-neon-pink/10 blur-3xl" />
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-neon-blue/10 blur-3xl" />
      <div className="relative z-10 max-w-lg w-full text-center animate-slide-up">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full bg-neon-pink/30 blur-xl animate-pulse-slow" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-neon-pink to-neon-blue flex items-center justify-center animate-glow-pink">
            <Activity size={40} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-glow-pink text-neon-pink">
          Ви готові розпочати тренування?
        </h1>
        <p className="text-cyber-muted mb-2">{plan.title}</p>
        <p className="text-xs uppercase tracking-widest text-cyber-muted mb-8">
          {plan.mode === 'hardcore' ? 'Hardcore Mode Activated' : 'Adaptive Mode'} · {source === 'ai' ? 'AI-генерація' : 'Fallback-алгоритм'} · {plan.durationMin} хв
        </p>

        <div className="cyber-panel p-5 text-left mb-6">
          <p className="text-sm leading-relaxed text-cyber-text/90">{plan.intro}</p>
        </div>

        <div className="mb-6">
          <UserProfileCard profile={profile} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <ResultStat icon={TimerIcon} value={`${plan.durationMin} хв`} label="Тривалість" color="blue" />
          <ResultStat icon={Flame} value={plan.estimatedCalories} label="Ккал" color="orange" />
          <ResultStat icon={Zap} value={plan.estimatedXp} label="XP" color="yellow" />
        </div>

        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-green to-neon-blue text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform animate-glow-green"
        >
          <Play size={20} />
          Почати тренування
        </button>
        <button
          onClick={onRestart}
          className="w-full py-2.5 rounded-xl border border-cyber-border text-cyber-muted hover:text-cyber-text text-sm flex items-center justify-center gap-2 transition-colors mt-3"
        >
          <Home size={15} />
          Назад до налаштувань
        </button>
      </div>
    </div>
  );
}

function PreviewView({
  plan,
  source,
  onStart,
  onBack,
}: {
  plan: WorkoutPlan;
  source: 'ai' | 'fallback';
  onStart: () => void;
  onBack: () => void;
}) {
  const totalExercises = plan.rounds.reduce((sum, r) => sum + r.exercises.length, 0);
  const totalSets = plan.rounds.reduce(
    (sum, r) => sum + r.exercises.reduce((s, ex) => s + (ex.sets ?? 1), 0),
    0,
  );

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-neon-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-neon-pink/10 blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-8 pb-32">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-blue/30 bg-neon-blue/5 text-xs text-neon-blue mb-4">
            <Dumbbell size={12} />
            <span className="tracking-widest uppercase">План тренування</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            {plan.title}
          </h1>
          <p className="text-cyber-muted mt-2 text-sm">
            Ознайомтеся з усіма вправами перед стартом
          </p>
          <p className="text-[11px] uppercase tracking-widest text-cyber-muted mt-2">
            {plan.mode === 'hardcore' ? 'Hardcore Mode' : 'Adaptive Mode'} ·{' '}
            {source === 'ai' ? 'AI-генерація' : 'Fallback-алгоритм'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <ResultStat icon={TimerIcon} value={`${plan.durationMin} хв`} label="Тривалість" color="blue" />
          <ResultStat icon={Dumbbell} value={totalExercises} label="Вправ" color="pink" />
          <ResultStat icon={CheckCircle2} value={totalSets} label="Сетів" color="green" />
        </div>

        <div className="space-y-4">
          {plan.rounds.map((round, ri) => {
            const roundSets = round.exercises.reduce((s, ex) => s + (ex.sets ?? 1), 0);
            return (
              <section
                key={`${round.phase}-${ri}`}
                className="cyber-panel p-4 animate-slide-up"
                style={{ animationDelay: `${0.08 + ri * 0.03}s` }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold tracking-tight">{round.label}</h2>
                    <p className="text-xs text-cyber-muted mt-0.5">{round.goal}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-neon-blue bg-neon-blue/10 border border-neon-blue/25 rounded-full px-2 py-0.5">
                    {roundSets} {pluralizeUk(roundSets, 'сет', 'сети', 'сетів')}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {round.exercises.map((ex, ei) => {
                    const showsSetsSeparately = ex.sets != null && !/підход/i.test(ex.reps);
                    return (
                      <div
                        key={`${ri}-${ei}`}
                        className="flex items-start gap-3 p-3 rounded-xl border border-cyber-border bg-cyber-bg/40"
                      >
                        <span className="shrink-0 w-7 h-7 rounded-lg border border-cyber-border text-cyber-muted flex items-center justify-center text-xs font-mono font-bold">
                          {ei + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-snug">{ex.name}</h3>
                          <div className="flex items-center gap-2.5 mt-1 text-[11px] text-cyber-muted flex-wrap">
                            <span className="flex items-center gap-1">
                              <Dumbbell size={11} />
                              {showsSetsSeparately
                                ? `${ex.sets} ${pluralizeUk(ex.sets!, 'підхід', 'підходи', 'підходів')} × ${ex.reps}`
                                : ex.reps}
                            </span>
                            {ex.weightKg != null && ex.weightKg > 0 && (
                              <span className="flex items-center gap-1 text-neon-amber font-semibold">
                                <Weight size={11} /> {ex.weightKg} кг
                              </span>
                            )}
                            {ex.equipment && (
                              <span className="flex items-center gap-1 text-neon-blue">
                                <CircleDot size={10} /> {EQUIPMENT_LABELS[ex.equipment]?.title ?? ex.equipment}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <TimerIcon size={11} /> {ex.restSec}с
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-cyber-muted text-center">
            {totalExercises} {pluralizeUk(totalExercises, 'вправа', 'вправи', 'вправ')} ·{' '}
            {totalSets} {pluralizeUk(totalSets, 'сет', 'сети', 'сетів')} · {plan.durationMin} хв
          </p>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 border-t border-cyber-border/60 bg-cyber-bg/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="shrink-0 px-4 py-3 rounded-xl border border-cyber-border text-cyber-muted hover:text-cyber-text text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Home size={16} />
            <span className="hidden sm:inline">Назад</span>
          </button>
          <button
            onClick={onStart}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-neon-green to-neon-blue text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform animate-glow-green"
          >
            <Play size={20} />
            Розпочати тренування
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActiveSessionProps {
  plan: WorkoutPlan;
  source: 'ai' | 'fallback';
  profile: { level: number; xp: number; totalXpEarned: number; totalWorkouts: number };
  xpEarned: number;
  allExercises: { roundIndex: number; exIndex: number; exercise: Exercise; round: Round }[];
  completed: Set<string>;
  setCompleted: React.Dispatch<React.SetStateAction<Set<string>>>;
  currentRoundIndex: number;
  setCurrentRoundIndex: React.Dispatch<React.SetStateAction<number>>;
  currentExerciseIndex: number;
  setCurrentExerciseIndex: React.Dispatch<React.SetStateAction<number>>;
  activeTimer: ActiveTimerKind;
  setActiveTimer: React.Dispatch<React.SetStateAction<ActiveTimerKind>>;
  doneCount: number;
  totalSets: number;
  progress: number;
  liveXp: number;
  liveCalories: number;
  allDone: boolean;
  onFinish: (xpEarned: number) => void;
  onRestart: () => void;
}

function ActiveSession({
  plan,
  source,
  profile,
  xpEarned,
  allExercises,
  completed,
  setCompleted,
  currentRoundIndex,
  setCurrentRoundIndex,
  currentExerciseIndex,
  setCurrentExerciseIndex,
  activeTimer,
  setActiveTimer,
  doneCount,
  totalSets,
  progress,
  liveXp,
  liveCalories,
  allDone,
  onFinish,
  onRestart,
}: ActiveSessionProps) {
  const [remaining, setRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const startedRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  // Single source of truth for the ticking interval.
  // Runs only when there is an active timer that is not paused.
  useEffect(() => {
    if (activeTimer === 'none' || isPaused || remaining <= 0) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTimer, isPaused, remaining]);

  // When remaining hits 0 while a timer is active, fire the done handler.
  // Kept separate from the ticking effect so the interval teardown is clean.
  useEffect(() => {
    if (activeTimer === 'none' || remaining > 0) return;
    handleTimerDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, activeTimer]);

  // The timer-done handler. Reads latest state via refs so the callback
  // never goes stale between renders.
  const stateRef = useRef({ activeTimer, currentRoundIndex, currentExerciseIndex });
  stateRef.current = { activeTimer, currentRoundIndex, currentExerciseIndex };

  const handleTimerDone = useCallback(() => {
    const { activeTimer: at, currentRoundIndex: ri, currentExerciseIndex: ei } = stateRef.current;
    const round = plan.rounds[ri];
    const ex = round?.exercises[ei];

    if (at === 'work') {
      markExerciseComplete(ri, ei);
      const restSec = ex?.restSec ?? 0;
      if (restSec > 0) {
        beginPhase('rest', restSec);
      } else {
        advanceFrom(ri, ei);
      }
    } else if (at === 'rest') {
      advanceFrom(ri, ei);
    } else if (at === 'round') {
      beginWork(ri, 0);
    }
  }, [plan.rounds]);

  function markExerciseComplete(ri: number, ei: number) {
    const key = exKey(ri, ei);
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  function beginPhase(kind: ActiveTimerKind, sec: number) {
    setIsPaused(false);
    setRemaining(sec);
    setActiveTimer(kind);
  }

  function beginWork(ri: number, ei: number) {
    const ex = plan.rounds[ri]?.exercises[ei];
    if (!ex) {
      setActiveTimer('none');
      return;
    }
    const sec = workSecondsFromReps(ex);
    setCurrentRoundIndex(ri);
    setCurrentExerciseIndex(ei);
    beginPhase('work', sec);
  }

  function advanceFrom(ri: number, ei: number) {
    const round = plan.rounds[ri];
    const nextEi = ei + 1;

    if (nextEi < round.exercises.length) {
      beginWork(ri, nextEi);
      return;
    }

    const nextRi = ri + 1;
    if (nextRi < plan.rounds.length) {
      setCurrentRoundIndex(nextRi);
      setCurrentExerciseIndex(0);
      if (round.restBetweenRoundsSec > 0) {
        beginPhase('round', round.restBetweenRoundsSec);
      } else {
        beginWork(nextRi, 0);
      }
      return;
    }

    setActiveTimer('none');
  }

  // Auto-start the first work timer when the session mounts.
  useEffect(() => {
    if (startedRef.current) return;
    if (plan.rounds[0]?.exercises.length) {
      startedRef.current = true;
      beginWork(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleExercise = (key: string) => {
    const ex = allExercises.find((e) => exKey(e.roundIndex, e.exIndex) === key);
    if (!ex) return;
    const wasDone = completed.has(key);
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (!wasDone && ex.exercise.restSec > 0) {
      beginPhase('rest', ex.exercise.restSec);
    }
  };

  const handleSkipTimer = () => {
    setRemaining(0);
  };

  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  };

  const handleStartRoundBreak = () => {
    const round = plan.rounds[currentRoundIndex];
    if (round.restBetweenRoundsSec > 0) {
      beginPhase('round', round.restBetweenRoundsSec);
    }
  };

  const handleJumpRound = (i: number) => {
    beginWork(i, 0);
  };

  const currentRound = plan.rounds[currentRoundIndex];
  const roundColor =
    currentRound.phase === 'prep'
      ? 'blue'
      : currentRound.phase === 'max'
        ? 'pink'
        : 'green';

  const currentExercise = currentRound?.exercises[currentExerciseIndex];
  const currentExerciseKey = currentExercise ? exKey(currentRoundIndex, currentExerciseIndex) : '';

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-neon-pink/10 blur-3xl" />
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-neon-blue/10 blur-3xl" />

      <header className="relative z-10 border-b border-cyber-border/60 bg-cyber-surface/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-neon-pink/15 border border-neon-pink/40 flex items-center justify-center shrink-0">
              <Activity size={16} className="text-neon-pink" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">{plan.title}</h1>
              <p className="text-[10px] text-cyber-muted uppercase tracking-widest">
                {plan.mode === 'hardcore' ? 'Hardcore Mode Activated' : 'Adaptive Mode'} · {source === 'ai' ? 'AI-генерація' : 'Fallback-алгоритм'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <StatChip icon={Flame} value={liveCalories} label="ккал" color="orange" />
            <StatChip icon={Zap} value={liveXp} label="XP" color="yellow" />
            <StatChip icon={CheckCircle2} value={`${doneCount}/${totalSets}`} label="сетів" color="blue" />
          </div>
          <div className="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-4">
            <UserProfileCard profile={profile} compact />
          </div>
        </div>
        <div className="h-1 bg-cyber-border">
          <div
            className="h-full bg-gradient-to-r from-neon-blue via-neon-pink to-neon-green transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-6 grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <div className="cyber-panel p-4 border-neon-blue/30 animate-fade-in">
            <p className="text-sm leading-relaxed text-cyber-text/90">
              {plan.mode === 'adaptive' && (
                <span className="block text-neon-blue font-semibold mb-1 text-glow-blue">
                  Розбиваємо складе завдання на 3 адаптивні сети з відпочинком
                </span>
              )}
              {plan.intro}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {plan.rounds.map((r, i) => {
              const isActive = i === currentRoundIndex;
              const activeClass =
                r.phase === 'prep'
                  ? 'bg-neon-blue/15 border-neon-blue/50 text-neon-blue'
                  : r.phase === 'max'
                    ? 'bg-neon-pink/15 border-neon-pink/50 text-neon-pink'
                    : 'bg-neon-green/15 border-neon-green/50 text-neon-green';
              return (
                <button
                  key={i}
                  onClick={() => handleJumpRound(i)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isActive
                      ? activeClass
                      : 'bg-cyber-surface border-cyber-border text-cyber-muted hover:text-cyber-text'
                  }`}
                >
                  {r.label.split('—')[0].trim()}
                </button>
              );
            })}
          </div>

          <RoundView
            key={currentRoundIndex}
            round={currentRound}
            roundIndex={currentRoundIndex}
            color={roundColor}
            completed={completed}
            onToggle={handleToggleExercise}
            onStartRoundBreak={handleStartRoundBreak}
            hasNextRound={currentRoundIndex < plan.rounds.length - 1}
            currentExerciseKey={currentExerciseKey}
          />
        </div>

        <aside className="space-y-4">
          <div className="cyber-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-widest text-cyber-muted flex items-center gap-2">
                <TimerIcon size={14} />{' '}
                {activeTimer === 'work'
                  ? 'Виконання вправи'
                  : activeTimer === 'round'
                    ? 'Перерва між раундами'
                    : activeTimer === 'rest'
                      ? 'Відпочинок між підходами'
                      : 'Таймер'}
              </h3>
              {activeTimer !== 'none' && (
                <span className="text-[10px] text-neon-green font-mono uppercase">
                  {isPaused ? 'пауза' : 'запущено'}
                </span>
              )}
            </div>

            {activeTimer === 'work' && currentExercise && (
              <div className="mb-3 text-center">
                <p className="text-sm font-bold text-cyber-text truncate">{currentExercise.name}</p>
                <p className="text-xs text-cyber-muted mt-0.5">{currentExercise.reps}</p>
              </div>
            )}

            {currentExercise?.instructions && currentExercise.instructions.length > 0 && (
              <ExerciseInstruction
                instructions={currentExercise.instructions}
                className="mb-3"
              />
            )}

            <div className="relative">
              <div
                className={`mx-auto w-40 h-40 rounded-full flex items-center justify-center border-4 transition-colors ${
                  activeTimer === 'none'
                    ? 'border-cyber-border text-cyber-muted'
                    : remaining <= 5
                      ? 'border-neon-red text-neon-red animate-glow-pink'
                      : activeTimer === 'work'
                        ? 'border-neon-pink text-neon-pink animate-glow-pink'
                        : activeTimer === 'round'
                          ? 'border-neon-blue text-neon-blue animate-glow-blue'
                          : 'border-neon-green text-neon-green animate-glow-green'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold tabular-nums">
                    {formatTime(activeTimer === 'none' ? 0 : remaining)}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest mt-1">
                    {activeTimer === 'none' ? 'Готовий?' : activeTimer === 'work' ? 'виконання' : 'сек'}
                  </div>
                </div>
              </div>
            </div>

            {activeTimer !== 'none' && (
              <div className="mt-4 space-y-3 animate-fade-in">
                <BreathingCue remaining={remaining} />
                <div className="flex gap-2">
                  <button
                    onClick={handleTogglePause}
                    className="flex-1 py-2 rounded-xl border border-cyber-border hover:border-neon-blue/50 text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    {isPaused ? 'Продовжити' : 'Пауза'}
                  </button>
                  <button
                    onClick={handleSkipTimer}
                    className="flex-1 py-2 rounded-xl border border-cyber-border hover:border-neon-pink/50 text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <SkipForward size={14} />
                    Пропустити
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="cyber-panel p-4">
            <h3 className="text-xs uppercase tracking-widest text-cyber-muted mb-3">Аналітика сесії</h3>
            <div className="space-y-2">
              <RowStat label="Тривалість плану" value={`${plan.durationMin} хв`} icon={TimerIcon} color="blue" />
              <RowStat label="Виконано сетів" value={`${doneCount}/${totalSets}`} icon={CheckCircle2} color="green" />
              <RowStat label="Калорії (live)" value={`${liveCalories}`} icon={Flame} color="orange" />
              <RowStat label="Очки XP" value={`${liveXp}`} icon={Zap} color="yellow" />
            </div>
            <div className="neon-divider my-4" />
            <div className="h-2 rounded-full bg-cyber-border overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-blue to-neon-pink transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-cyber-muted mt-2 text-center">{Math.round(progress)}% завершено</p>
          </div>

          <button
            onClick={() => onFinish(xpEarned)}
            disabled={!allDone}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
              allDone
                ? 'bg-gradient-to-r from-neon-green to-neon-blue text-white animate-glow-green hover:scale-[1.02]'
                : 'border border-cyber-border text-cyber-muted cursor-not-allowed'
            }`}
          >
            <Trophy size={20} />
            {allDone ? 'Спринт завершено!' : `Залишилось ${totalSets - doneCount} сетів`}
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl border border-cyber-border text-cyber-muted hover:text-cyber-text text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Home size={15} />
            Скинути сесію
          </button>
        </aside>
      </div>
    </div>
  );
}

function RoundView({
  round,
  roundIndex,
  color,
  completed,
  onToggle,
  onStartRoundBreak,
  hasNextRound,
  currentExerciseKey,
}: {
  round: Round;
  roundIndex: number;
  color: string;
  completed: Set<string>;
  onToggle: (key: string) => void;
  onStartRoundBreak: () => void;
  hasNextRound: boolean;
  currentExerciseKey: string;
}) {
  const colorText =
    color === 'blue' ? 'text-neon-blue' : color === 'pink' ? 'text-neon-pink' : 'text-neon-green';
  const colorBorder =
    color === 'blue' ? 'border-neon-blue/40' : color === 'pink' ? 'border-neon-pink/40' : 'border-neon-green/40';
  const colorBg =
    color === 'blue' ? 'bg-neon-blue/10' : color === 'pink' ? 'bg-neon-pink/10' : 'bg-neon-green/10';
  const allRoundDone = round.exercises.every((_, ei) => completed.has(exKey(roundIndex, ei)));

  return (
    <div className={`cyber-panel p-5 ${colorBorder} animate-slide-up`}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-bold ${colorText}`}>
            {round.label}
          </span>
          <p className="text-cyber-muted text-xs mt-0.5">{round.goal}</p>
        </div>
        <div className={`text-xs font-mono px-2 py-1 rounded-lg ${colorBg} ${colorText}`}>
          {round.exercises.filter((_, ei) => completed.has(exKey(roundIndex, ei))).length}/{round.exercises.length}
        </div>
      </div>

      <div className="space-y-2 mt-4">
        {round.exercises.map((ex, ei) => {
          const key = exKey(roundIndex, ei);
          const done = completed.has(key);
          const isCurrent = key === currentExerciseKey;
          return (
            <div
              key={key}
              className={`group rounded-xl border p-3 transition-all ${
                done
                  ? 'border-neon-green/40 bg-neon-green/5'
                  : isCurrent
                    ? 'border-neon-pink/50 bg-neon-pink/5 animate-glow-pink'
                    : 'border-cyber-border bg-cyber-bg/40 hover:border-cyber-muted/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggle(key)}
                  className={`shrink-0 w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${
                    done
                      ? 'border-neon-green bg-neon-green/20 text-neon-green'
                      : isCurrent
                        ? 'border-neon-pink text-neon-pink'
                        : 'border-cyber-border text-cyber-muted hover:border-neon-blue/50 hover:text-neon-blue'
                  }`}
                  aria-label={done ? 'Позначити невиконаним' : 'Позначити виконаним'}
                >
                  {done ? <Check size={18} strokeWidth={3} /> : <span className="text-xs font-mono">{ei + 1}</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm ${done ? 'line-through text-cyber-muted' : ''}`}>
                    {ex.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-cyber-muted flex-wrap">
                    <span className="flex items-center gap-1">
                      <Dumbbell size={11} /> {ex.reps}
                    </span>
                    {ex.weightKg != null && ex.weightKg > 0 && (
                      <span className="flex items-center gap-1 text-neon-amber font-semibold">
                        <Weight size={11} /> {ex.weightKg} кг
                      </span>
                    )}
                    {ex.equipment && (
                      <span className="flex items-center gap-1 text-neon-blue">
                        <CircleDot size={10} /> {EQUIPMENT_LABELS[ex.equipment]?.title ?? ex.equipment}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <TimerIcon size={11} /> {ex.restSec}с відпочинок
                    </span>
                  </div>
                </div>
                {isCurrent && !done && (
                  <ArrowRight size={16} className="text-neon-pink shrink-0 animate-pulse" />
                )}
              </div>
              <div className="mt-2 ml-12 flex items-start gap-1.5 text-[11px] text-neon-blue/70">
                <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{ex.cue}</span>
              </div>
            </div>
          );
        })}
      </div>

      {allRoundDone && hasNextRound && (
        <button
          onClick={onStartRoundBreak}
          className="mt-4 w-full py-3 rounded-xl border border-neon-blue/40 bg-neon-blue/5 hover:bg-neon-blue/15 text-neon-blue text-sm font-semibold flex items-center justify-center gap-2 transition-all animate-fade-in"
        >
          <ChevronRight size={16} />
          Перейти до наступного раунду · перерва {round.restBetweenRoundsSec}с
        </button>
      )}
    </div>
  );
}

function FinishedView({
  plan,
  doneCount,
  totalSets,
  liveCalories,
  xpEarned,
  onRestart,
}: {
  plan: WorkoutPlan;
  doneCount: number;
  totalSets: number;
  liveCalories: number;
  xpEarned: number;
  onRestart: () => void;
}) {
  return (
    <div className="min-h-screen grid-bg relative overflow-hidden flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-neon-green/5" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-neon-green/10 blur-3xl" />
      <div className="relative z-10 max-w-lg w-full text-center animate-slide-up">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full bg-neon-green/30 blur-xl animate-pulse-slow" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center animate-glow-green">
            <Trophy size={40} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-glow-green text-neon-green">Спринт завершено!</h1>
        <p className="text-cyber-muted mb-6">Ти розбив свій бар'єр. Система зафіксувала твій прогрес.</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <ResultStat icon={CheckCircle2} value={`${doneCount}/${totalSets}`} label="Сетів" color="blue" />
          <ResultStat icon={Flame} value={liveCalories} label="Ккал" color="orange" />
          <ResultStat icon={Zap} value={xpEarned} label="+XP" color="yellow" />
        </div>

        <div className="cyber-panel p-5 text-left mb-6">
          <h3 className="text-xs uppercase tracking-widest text-cyber-muted mb-2 flex items-center gap-2">
            <Heart size={14} className="text-neon-pink" /> AI-аналіз прогресу
          </h3>
          <p className="text-sm leading-relaxed text-cyber-text/90">{plan.closingTip}</p>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-blue to-neon-pink text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
        >
          <RotateCcw size={20} />
          Новий спринт
        </button>
      </div>
    </div>
  );
}

function StatChip({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Flame;
  value: number | string;
  label: string;
  color: 'orange' | 'yellow' | 'blue' | 'green';
}) {
  const map = {
    orange: 'text-neon-amber border-neon-amber/30 bg-neon-amber/5',
    yellow: 'text-neon-amber border-neon-amber/30 bg-neon-amber/5',
    blue: 'text-neon-blue border-neon-blue/30 bg-neon-blue/5',
    green: 'text-neon-green border-neon-green/30 bg-neon-green/5',
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs sm:text-sm font-mono ${map[color]}`}>
      <Icon size={13} />
      <span className="font-bold tabular-nums">{value}</span>
      <span className="hidden sm:inline text-cyber-muted normal-case font-normal">{label}</span>
    </div>
  );
}

function RowStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Flame;
  color: 'blue' | 'green' | 'orange' | 'yellow';
}) {
  const map = {
    blue: 'text-neon-blue',
    green: 'text-neon-green',
    orange: 'text-neon-amber',
    yellow: 'text-neon-amber',
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-cyber-muted">
        <Icon size={14} className={map[color]} />
        {label}
      </span>
      <span className="font-mono font-bold tabular-nums">{value}</span>
    </div>
  );
}

function ResultStat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Flame;
  value: number | string;
  label: string;
  color: 'blue' | 'orange' | 'yellow' | 'pink' | 'green';
}) {
  const map = {
    blue: 'text-neon-blue border-neon-blue/40 bg-neon-blue/5',
    orange: 'text-neon-amber border-neon-amber/40 bg-neon-amber/5',
    yellow: 'text-neon-amber border-neon-amber/40 bg-neon-amber/5',
    pink: 'text-neon-pink border-neon-pink/40 bg-neon-pink/5',
    green: 'text-neon-green border-neon-green/40 bg-neon-green/5',
  };
  return (
    <div className={`cyber-panel p-4 ${map[color]}`}>
      <Icon size={20} className="mx-auto mb-1" />
      <div className="text-2xl font-bold font-mono">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-cyber-muted mt-0.5">{label}</div>
    </div>
  );
}

function BreathingCue({ remaining }: { remaining: number }) {
  const phase = remaining > 0 ? (Math.floor(remaining / 4) % 2 === 0 ? 'Вдих' : 'Видих') : '';
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-neon-green">
      <Wind size={14} className={remaining > 0 ? 'animate-pulse' : ''} />
      <span className="font-semibold">{phase}</span>
      <span className="text-cyber-muted">· рівне дихання · безпека насамперед</span>
    </div>
  );
}

function exKey(roundIndex: number, exIndex: number): string {
  return `${roundIndex}-${exIndex}`;
}

function workSecondsFromReps(ex: Exercise): number {
  const reps = ex.reps;
  const timeMatch = reps.match(/(\d+)\s*с/i);
  if (timeMatch) return Math.max(parseInt(timeMatch[1], 10), 10);
  const workSplit = reps.match(/(\d+)\s*с\s*робота/i);
  if (workSplit) return Math.max(parseInt(workSplit[1], 10), 10);
  const numMatch = reps.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    return Math.min(Math.max(n * 3, 20), 60);
  }
  return 30;
}
