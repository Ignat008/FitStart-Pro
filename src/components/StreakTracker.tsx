import {
  Flame,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import type { UserProfile } from '@/gamification';
import {
  getCalendarDays,
  isSameDay,
  STREAK_BONUSES,
  levelTitle,
  xpForNextLevel,
} from '@/gamification';

interface StreakTrackerProps {
  profile: UserProfile;
  activeDays: string[]; // ISO дати днів, коли було тренування
}

export function StreakTracker({
  profile,
  activeDays,
}: StreakTrackerProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = getCalendarDays(year, month);
  const { title, color } = levelTitle(profile.level);
  const nextXp = xpForNextLevel(profile.level);
  const percent = nextXp > 0 ? Math.round((profile.xp / nextXp) * 100) : 100;

  const isActive = (d: Date) =>
    activeDays.some((iso) => {
      const date = new Date(iso);
      return isSameDay(d, date);
    });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="cyber-panel p-4 sm:p-6 mb-6 border border-cyber-border/60">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-neon-amber" />
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-cyber-text">
            Стрік днів
          </h2>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-mono font-bold text-neon-amber">
            {profile.currentStreak}
          </span>
          <span className="text-[10px] text-cyber-muted uppercase tracking-wider">
            днів підряд
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="cyber-panel p-3 rounded-xl text-center border border-cyber-border/40 bg-cyber-bg/30">
          <div className="text-[10px] uppercase tracking-widest text-cyber-muted mb-1">
            Найдовший стрік
          </div>
          <div className="text-xl font-mono font-bold text-neon-blue">
            {profile.longestStreak}
          </div>
        </div>
        <div className="cyber-panel p-3 rounded-xl text-center border border-cyber-border/40 bg-cyber-bg/30">
          <div className="text-[10px] uppercase tracking-widest text-cyber-muted mb-1">
            Звання
          </div>
          <div className={`text-sm font-bold ${color}`}>{title}</div>
        </div>
        <div className="cyber-panel p-3 rounded-xl text-center border border-cyber-border/40 bg-cyber-bg/30">
          <div className="text-[10px] uppercase tracking-widest text-cyber-muted mb-1">
            Прогрес рівня
          </div>
          <div className="text-sm font-mono font-bold text-neon-pink">
            {profile.xp} / {nextXp} XP
          </div>
        </div>
      </div>

      <div className="h-2 rounded-full bg-cyber-border overflow-hidden border border-cyber-border/40 mb-3">
        <div
          className="h-full bg-gradient-to-r from-neon-amber via-neon-pink to-neon-blue transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mb-4">
        <h3 className="text-[10px] uppercase tracking-widest text-cyber-muted mb-3">
          Календар активності — {now.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="grid grid-cols-7 gap-1">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day) => (
            <div key={day} className="text-[10px] text-center text-cyber-muted font-semibold uppercase">
              {day}
            </div>
          ))}
          {days.map((d) => {
            const active = isActive(d);
            const isToday = isSameDay(d, today);
            const isCurrentMonth = d.getMonth() === month;
            return (
              <div
                key={d.toISOString()}
                className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono transition-all ${
                  active
                    ? 'bg-neon-amber/20 border border-neon-amber/40 text-neon-amber font-bold'
                    : isCurrentMonth
                      ? 'bg-cyber-bg/30 border border-cyber-border/30 text-cyber-muted/60'
                      : 'bg-transparent text-cyber-muted/30'
                } ${isToday ? 'ring-1 ring-neon-blue' : ''}`}
                title={`${d.getDate()} ${active ? 'тренування проведено' : 'без тренування'}`}
              >
                {d.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      {profile.currentStreak >= 7 || profile.longestStreak >= 7 ? (
        <div className="cyber-panel p-3 rounded-xl border border-neon-blue/40 bg-neon-blue/10 mt-3">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-neon-blue" />
            <span className="text-xs font-bold text-neon-blue uppercase tracking-wider">
              Досягнення серії
            </span>
          </div>
          <div className="text-xs text-cyber-text/90 leading-relaxed">
            {Object.entries(STREAK_BONUSES).map(([days, xp]) => (
              <div key={days} className="flex justify-between text-[10px] mb-0.5">
                <span className="text-cyber-muted">
                  {days} днів підряд
                </span>
                <span className="text-neon-amber font-semibold">+{xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="cyber-panel p-3 rounded-xl border border-cyber-border/40 bg-cyber-bg/30 mt-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-cyber-muted" />
            <span className="text-xs font-bold text-cyber-muted uppercase tracking-wider">
              Розпочніть стрік
            </span>
          </div>
          <div className="text-xs text-cyber-text/80 leading-relaxed">
            Завершуйте тренування щодня, щоб будувати стрік і отримувати бонусний XP.
          </div>
        </div>
      )}
    </div>
  );
}
