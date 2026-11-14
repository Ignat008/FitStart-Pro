import { useState } from 'react';
import { Flame, ChevronDown, Zap, AlertCircle } from 'lucide-react';
import type { UserProfile } from '@/gamification';
import {
  getCalendarDays,
  isSameDay,
  parseWorkoutDate,
  STREAK_BONUSES,
} from '@/gamification';

interface StreakBadgeProps {
  profile: UserProfile;
  activeDays: string[]; // ISO дати днів, коли було тренування
  compact?: boolean;
}

export function StreakBadge({
  profile,
  activeDays,
  compact = false,
}: StreakBadgeProps) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = getCalendarDays(year, month);

  const isActive = (d: Date) =>
    activeDays.some((iso) => {
      const date = parseWorkoutDate(iso);
      return date !== null && isSameDay(d, date);
    });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const milestoneReached =
    profile.currentStreak >= 7 || profile.longestStreak >= 7;

  const toggle = () => setOpen((prev) => !prev);

  return (
    <div className="relative inline-block">
      {/* Bage */}
      <button
        onClick={toggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all border ${
          compact
            ? 'border-cyber-border bg-cyber-surface/50 text-cyber-text hover:border-neon-amber/40 hover:bg-neon-amber/5'
            : 'border-neon-amber/40 bg-neon-amber/5 text-neon-amber hover:border-neon-amber hover:bg-neon-amber/10'
        }`}
        aria-label="Стрік днів"
      >
        <Flame size={14} className="text-neon-amber" />
        <span>{profile.currentStreak}</span>
        <span className="text-[9px] uppercase tracking-wider opacity-75">днів</span>
        <ChevronDown size={12} className="text-cyber-muted" />
      </button>

      {/* Popover calendar */}
      {open && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl border border-cyber-border bg-cyber-bg/95 backdrop-blur-md shadow-lg animate-fade-in z-50"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] uppercase tracking-widest text-cyber-muted">
              Календар активності
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-[9px] text-cyber-muted hover:text-cyber-text"
            >
              Закрити
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day) => (
              <div
                key={day}
                className="text-[9px] text-center text-cyber-muted font-semibold uppercase"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d) => {
              const active = isActive(d);
              const isCurrentMonth = d.getMonth() === month;
              return (
                <div
                  key={d.toISOString()}
                  className={`aspect-square rounded flex items-center justify-center text-[9px] transition-colors ${
                    active
                      ? 'bg-neon-amber/20 border border-neon-amber/40 text-neon-amber font-bold'
                      : isCurrentMonth
                        ? 'bg-cyber-bg/40 border border-cyber-border/40 text-cyber-muted/60'
                        : 'bg-transparent text-cyber-muted/30'
                  }`}
                  title={`${d.getDate()} ${active ? 'тренування проведено' : 'без тренування'}`}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
          {milestoneReached && (
            <div className="mt-2 py-1.5 rounded-lg border border-neon-amber/40 bg-neon-amber/5">
              <div className="flex items-center gap-1 mb-0.5">
                <Zap size={12} className="text-neon-amber" />
                <span className="text-[9px] uppercase tracking-wider text-neon-amber font-bold">
                  Бонусний XP
                </span>
              </div>
              <div className="text-[9px] text-cyber-text/80 leading-relaxed">
                {Object.entries(STREAK_BONUSES).map(([days, xp]) => (
                  <div key={days} className="flex justify-between mb-0.5">
                    <span>{days} днів підряд</span>
                    <span className="font-mono font-bold text-neon-amber">
                      +{xp} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!milestoneReached && (
            <div className="mt-2 py-1.5 rounded-lg border border-cyber-border/40 bg-cyber-bg/30">
              <div className="flex items-center gap-1 mb-0.5">
                <AlertCircle size={12} className="text-cyber-muted" />
                <span className="text-[9px] uppercase tracking-wider text-cyber-muted font-bold">
                  Розпочніть стрік
                </span>
              </div>
              <div className="text-[9px] text-cyber-text/70 leading-relaxed">
                Завершуйте тренування щодня, щоб будувати стрік і отримувати бонусний XP.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
