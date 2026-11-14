import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import type { LeaderboardEntry, WeeklyChallenge } from '@/gamification';
import {
  getActiveChallenge,
  getActiveDailyChallenges,
  loadChallenges,
  loadLeaderboard,
} from '@/gamification';

function ChallengeProgressBar({ value, target }: { value: number; target: number }) {
  const percent = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="h-2 rounded-full bg-cyber-border overflow-hidden border border-cyber-border/40">
      <div
        className="h-full bg-gradient-to-r from-neon-blue via-neon-pink to-neon-blue transition-all duration-700 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function ChallengeCard({
  challenge,
  progress,
}: {
  challenge: WeeklyChallenge;
  progress: number;
}) {
  const completed = progress >= challenge.target;
  return (
    <div
      className={`p-3 rounded-xl border ${
        completed
          ? 'border-neon-green/40 bg-neon-green/5'
          : 'border-cyber-border/60 bg-cyber-bg/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2 min-w-0">
          {completed ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-neon-green" />
          ) : (
            <Target size={16} className="shrink-0 mt-0.5 text-neon-blue" />
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-cyber-text">{challenge.title}</h4>
            <p className="text-[10px] text-cyber-muted mt-0.5">{challenge.description}</p>
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-mono font-bold text-neon-amber">
          +{challenge.rewardXp} XP
        </span>
      </div>
      <ChallengeProgressBar value={progress} target={challenge.target} />
      <div className="flex justify-between mt-1.5 text-[9px] text-cyber-muted">
        <span>{completed ? 'Виконано' : 'Прогрес'}</span>
        <span className="font-mono font-bold text-neon-blue">
          {Math.min(progress, challenge.target)} / {challenge.target}
        </span>
      </div>
    </div>
  );
}

export function ChallengesWidget() {
  const [data] = useState(loadChallenges);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    setLeaderboard(loadLeaderboard());
  }, []);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeout = window.setTimeout(
      () => setToday(new Date()),
      Math.max(0, nextMidnight.getTime() - now.getTime() + 50),
    );
    return () => window.clearTimeout(timeout);
  }, [today]);

  const dailyChallenges = getActiveDailyChallenges(data.challenges, data.progress, today);
  const { challenge: weeklyChallenge, progress: weeklyProgress } = getActiveChallenge(
    data.challenges,
    data.progress,
    today,
  );
  const weeklyChallengeProgress = weeklyProgress?.progress ?? 0;
  const weeklyCompleted = Boolean(weeklyProgress?.completedAt);

  return (
    <div className="cyber-panel p-4 mb-6 border border-cyber-border/60">
      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyber-muted flex items-center gap-2">
            <Zap size={14} className="text-neon-amber" />
            Щоденні завдання
          </h3>
          <span className="text-[9px] text-neon-blue font-bold uppercase tracking-wider">
            {today.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
          </span>
        </div>
        <div className="space-y-2">
          {dailyChallenges.map(({ challenge, progress }) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              progress={progress?.progress ?? 0}
            />
          ))}
        </div>
        <p className="flex items-center gap-1 text-[9px] text-cyber-muted mt-2">
          <Clock3 size={11} />
          Завдання оновляться опівночі
        </p>
      </section>

      <section className="mt-4 pt-4 border-t border-cyber-border/40">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyber-muted flex items-center gap-2">
            <Target size={14} className="text-neon-blue" />
            Тижневий челендж
          </h3>
          <span className="text-[9px] text-neon-blue font-bold uppercase tracking-wider">
            оновлення щопонеділка
          </span>
        </div>
        {weeklyCompleted ? (
          <div className="p-3 rounded-xl border border-neon-green/40 bg-neon-green/5 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-neon-green" />
              <span className="text-xs font-bold text-neon-green uppercase tracking-wider">
                Челендж виконано!
              </span>
            </div>
            <p className="text-[10px] text-cyber-text/85">
              {weeklyChallenge.title} · отримано{' '}
              <span className="font-mono font-bold text-neon-amber">
                +{weeklyChallenge.rewardXp} XP
              </span>
            </p>
          </div>
        ) : (
          <>
            <ChallengeCard
              challenge={weeklyChallenge}
              progress={weeklyChallengeProgress}
            />
            <p className="text-[10px] text-center text-cyber-muted mt-2">
              Прогрес зараховується автоматично після завершення тренування
            </p>
          </>
        )}
      </section>

      <section className="mt-4 pt-3 border-t border-cyber-border/40">
        <h4 className="text-[10px] uppercase tracking-widest text-cyber-muted mb-2 flex items-center gap-2">
          <Trophy size={12} className="text-neon-amber" />
          Лідерборд
        </h4>
        <div className="space-y-1">
          {leaderboard.slice(0, 5).map((entry, index) => (
            <div key={`${entry.name}-${entry.date}-${index}`} className="flex justify-between items-center text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-mono font-bold ${index === 0 ? 'text-neon-amber' : 'text-cyber-muted'}`}>
                  #{index + 1}
                </span>
                <span className="text-xs truncate w-16">{entry.name}</span>
              </div>
              <span className="text-xs font-mono text-neon-blue">{entry.xp} XP</span>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-[10px] text-cyber-muted text-center py-2">
              Лідерборд порожній. Виконай челендж, щоб потрапити туди!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
