import { Trophy } from 'lucide-react';
import type { UserProfile } from '@/gamification';
import { xpForNextLevel, levelTitle } from '@/gamification';
import { StreakBadge } from '@/components/StreakBadge';

interface UserProfileProps {
  profile: UserProfile;
  activeDays: string[];
  compact?: boolean;
}

export function UserProfile({
  profile,
  activeDays,
  compact = false,
}: UserProfileProps) {
  const { title, color } = levelTitle(profile.level);
  const next = xpForNextLevel(profile.level);
  const percent = next > 0 ? Math.round((profile.xp / next) * 100) : 100;

  return (
    <div
      className={`cyber-panel p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 border border-cyber-border/60 ${compact ? 'max-w-sm' : 'w-full'}`}
    >
      <div className="flex items-center gap-3 sm:flex-1">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-pink flex items-center justify-center shadow-lg animate-glow-blue">
          <Trophy size={20} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-bold font-mono text-lg sm:text-xl ${color}`}>
              Lvl {profile.level}
            </span>
            <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${color}`}>
              {title}
            </span>
            <StreakBadge profile={profile} activeDays={activeDays} compact />
          </div>
          <p className="text-[10px] sm:text-xs text-cyber-muted mt-0.5">
            {profile.totalXpEarned} XP загалом · {profile.totalWorkouts} {profile.totalWorkouts === 1 ? 'тренування' : 'тренувань'}
          </p>
        </div>
      </div>

      <div className="w-full sm:w-auto max-w-xs sm:max-w-md">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[10px] sm:text-xs text-cyber-muted uppercase tracking-wider">
            Прогрес до наступного рівня
          </span>
          <span className="text-[10px] sm:text-xs font-mono font-bold text-neon-amber">
            {profile.xp} / {next}
          </span>
        </div>
        <div className="h-2 sm:h-2.5 rounded-full bg-cyber-border overflow-hidden border border-cyber-border/40">
          <div
            className="h-full bg-gradient-to-r from-neon-blue via-neon-pink to-neon-blue transition-all duration-700 ease-out"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-cyber-muted">0 XP</span>
          <span className="text-[9px] text-cyber-muted">{next} XP</span>
        </div>
      </div>
    </div>
  );
}
