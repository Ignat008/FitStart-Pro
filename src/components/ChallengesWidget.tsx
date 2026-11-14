import { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Target,
  Trophy,
} from 'lucide-react';
import type {
  WeeklyChallenge,
  ChallengeProgress,
  LeaderboardEntry,
} from '@/gamification';
import {
  getActiveChallenge,
  updateChallengeProgress,
  saveChallenges,
  loadLeaderboard,
  saveLeaderboardEntry,
} from '@/gamification';

interface ChallengesWidgetProps {
  profile: {
    level: number;
    xp: number;
    totalXpEarned: number;
    totalWorkouts: number;
  };
  onChallengeComplete?: (bonusXp: number, rewardTitle?: string) => void;
}

export function ChallengesWidget({
  profile,
  onChallengeComplete,
}: ChallengesWidgetProps) {
  const [data, setData] = useState<{
    challenges: WeeklyChallenge[];
    progress: ChallengeProgress[];
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [active, setActive] = useState<{
    challenge: WeeklyChallenge;
    progress: ChallengeProgress;
  } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('fitstart_challenges');
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        // Ігноруємо помилки читання сховища чєленіджів
      }
    }
    setLeaderboard(loadLeaderboard());
  }, []);

  const { challenge, progress } = getActiveChallenge(
    data?.challenges ?? [],
    data?.progress ?? [],
  );

  useEffect(() => {
    if (challenge && progress) {
      setActive({ challenge, progress });
    }
    if (!data) {
      setData({ challenges: [], progress: [] });
    }
  }, [challenge, progress, data]);

  if (!active) {
    return null;
  }

  const { challenge: activeChallenge, progress: activeProgress } = active;

  const percent = Math.min(
    100,
    Math.round((activeProgress.progress / activeChallenge.target) * 100),
  );

  const handleJoin = () => {
    setData((prev) => {
      if (!prev) return prev;
      const updatedProgress = [
        ...prev.progress.filter((p) => p.challengeId !== activeChallenge.id),
        {
          challengeId: activeChallenge.id,
          progress: 0,
          joinedAt: new Date().toISOString(),
        },
      ];
      const next = { challenges: prev.challenges, progress: updatedProgress };
      saveChallenges(next);
      return next;
    });
    setActive({
      challenge: activeChallenge,
      progress: {
        challengeId: activeChallenge.id,
        progress: 0,
        joinedAt: new Date().toISOString(),
      },
    });
  };

  const handleComplete = () => {
    if (!activeProgress) return;

    const {
      progress: newProgress,
      completed,
      bonusXp,
    } = updateChallengeProgress(
      activeProgress,
      activeChallenge,
      profile.totalWorkouts,
      profile.totalXpEarned,
      profile.totalWorkouts * 2, // приблизна кількість вправ
    );

    setData((prev) => {
      if (!prev) return prev;
      const updated = prev.progress.map((p) =>
        p.challengeId === activeChallenge.id ? newProgress : p,
      );
      const next = { challenges: prev.challenges, progress: updated };
      saveChallenges(next);
      return next;
    });

    setActive((prev) => {
      if (!prev) return prev;
      return { ...prev, progress: newProgress };
    });

    if (completed && bonusXp > 0) {
      saveLeaderboardEntry({
        name: 'Ви',
        xp: profile.totalXpEarned + bonusXp,
        workouts: profile.totalWorkouts,
        date: new Date().toISOString(),
      });
      onChallengeComplete?.(bonusXp, activeChallenge.rewardTitle);
    }
  };

  const isCompleted = activeProgress.completedAt ? true : false;
  const isJoined = activeProgress.joinedAt ? true : false;

  return (
    <div className="cyber-panel p-4 mb-6 border border-cyber-border/60">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-cyber-muted flex items-center gap-2">
          <Target size={14} className="text-neon-blue" />
          Тижневі чєленіджі
        </h3>
        <span className="text-[9px] text-neon-blue font-bold uppercase tracking-wider">
          активний тиждень
        </span>
      </div>

      {isCompleted ? (
        <div className="cyber-panel p-3 rounded-xl border border-neon-green/40 bg-neon-green/5 mb-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-neon-green animate-pulse" />
            <span className="text-xs font-bold text-neon-green uppercase tracking-wider">
              Чєленідж виконано!
            </span>
          </div>
          <p className="text-[10px] text-cyber-text/85 leading-relaxed">
            Отримано бонус{' '}
            <span className="font-mono font-bold text-neon-amber">
              +{activeChallenge.rewardXp} XP
            </span>
            {activeChallenge.rewardTitle ? (
              <span className="text-cyber-text/70">— нове звання: {activeChallenge.rewardTitle}</span>
            ) : null}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <h4 className="text-sm font-bold text-cyber-text mb-1">
              {activeChallenge.title}
            </h4>
            <p className="text-[10px] text-cyber-muted mb-2">
              {activeChallenge.description}
            </p>
            <div className="h-2 rounded-full bg-cyber-border overflow-hidden border border-cyber-border/40 mb-2">
              <div
                className={`h-full bg-gradient-to-r from-neon-blue via-neon-pink to-neon-blue transition-all duration-700 ease-out`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-cyber-muted mb-2">
              <span>Прогрес</span>
              <span className="font-mono font-bold text-neon-blue">
                {activeProgress.progress} / {activeChallenge.target}
              </span>
            </div>
            <div className="flex justify-between text-[9px] text-cyber-muted mb-1">
              <span>Нагорода</span>
              <span className="font-mono font-bold text-neon-yellow">
                +{activeChallenge.rewardXp} XP
              </span>
            </div>
          </div>

          {!isJoined ? (
            <button
              onClick={handleJoin}
              className="w-full py-2 rounded-lg border border-neon-blue/40 bg-neon-blue/5 text-neon-blue text-xs font-bold hover:bg-neon-blue/10 hover:border-neon-blue transition-all flex items-center justify-center gap-1.5"
            >
              <Zap size={12} /> Приєднатися до чєленіджу
            </button>
          ) : percent < 100 ? (
            <button
              onClick={handleComplete}
              className="w-full py-2 rounded-lg border border-neon-amber/40 bg-neon-amber/5 text-neon-amber text-xs font-bold hover:bg-neon-amber/10 hover:border-neon-amber transition-all flex items-center justify-center gap-1.5"
            >
              <Flame size={12} className="animate-pulse" /> Оновити прогрес
            </button>
          ) : null}
        </>
      )}

      <div className="mt-4 pt-3 border-t border-cyber-border/40">
        <h4 className="text-[10px] uppercase tracking-widest text-cyber-muted mb-2 flex items-center gap-2">
          <Trophy size={12} className="text-neon-amber" />
          Лідерборд
        </h4>
        <div className="space-y-1">
          {leaderboard.slice(0, 5).map((entry, i) => (
            <div key={i} className="flex justify-between items-center text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-mono font-bold ${i === 0 ? 'text-neon-amber' : 'text-cyber-muted'}`}>
                  #{i + 1}
                </span>
                <span className="text-xs truncate w-16">{entry.name}</span>
              </div>
              <span className="text-xs font-mono text-neon-blue">
                {entry.xp} XP
              </span>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-[10px] text-cyber-muted text-center py-2">
              Лідерборд порожній. Використайте чєленіджі, щоб потрапити туди!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
