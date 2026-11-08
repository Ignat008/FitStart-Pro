import { useState, useEffect } from 'react';
import {
  Trophy,
  ArrowRight,
  Star,
} from 'lucide-react';
import type { UserProfile } from '@/gamification';
import { xpForNextLevel, levelTitle } from '@/gamification';

interface LevelUpModalProps {
  open: boolean;
  onClose: () => void;
  oldLevel: number;
  newLevel: number;
  profile: UserProfile;
  xpEarned: number;
}

export function LevelUpModal({
  open,
  onClose,
  oldLevel,
  newLevel,
  profile,
  xpEarned,
}: LevelUpModalProps) {
  const [confetti, setConfetti] = useState<number[]>([]);
  const { title, color } = levelTitle(newLevel);
  const next = xpForNextLevel(profile.level);
  const percent = next > 0 ? Math.round((profile.xp / next) * 100) : 100;

  useEffect(() => {
    if (!open) return;
    // generate confetti positions
    const particles = Array.from({ length: 60 }, (_, i) => i);
    setConfetti(particles);
    const t = window.setTimeout(() => setConfetti([]), 1200);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="cyber-panel w-full max-w-md p-6 animate-slide-up relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-px neon-divider" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyber-muted hover:text-cyber-text transition-colors"
          aria-label="Закрити"
        >
          <ArrowRight size={20} />
        </button>

        {/* Confetti */}
        <div className="absolute top-0 left-0 w-full h-16 pointer-events-none overflow-hidden z-0">
          {confetti.map((i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${(i % 10) * 10}%`,
                top: `-${Math.floor(Math.random() * 40)}px`,
                backgroundColor:
                  i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#ec4899' : '#10b981',
                animationDuration: `${1 + Math.random() * 1.5}s`,
                animationDelay: `${Math.random() * 0.8}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center">
          <div className="relative mx-auto w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full bg-neon-pink/30 blur-2xl animate-pulse-slow" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-neon-pink to-neon-blue flex items-center justify-center animate-glow-pink shadow-[0_0_40px_rgba(236,72,153,0.6)]">
              <Trophy size={32} className="text-white" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-glow-pink text-neon-pink">
            Рівень підвищено!
          </h2>
          <p className="text-cyber-muted mb-6">
            Ти достиг нового рівня майстерності.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="cyber-panel p-3 text-center border-neon-blue/40 bg-neon-blue/10">
              <div className="text-[10px] uppercase tracking-widest text-neon-blue font-semibold mb-1">
                Старий рівень
              </div>
              <div className="text-xl font-mono font-bold text-cyber-text">{oldLevel}</div>
            </div>
            <div className="cyber-panel p-3 text-center border-neon-pink/40 bg-neon-pink/10">
              <div className="text-[10px] uppercase tracking-widest text-neon-pink font-semibold mb-1">
                Новий рівень
              </div>
              <div className={`text-xl font-mono font-bold ${color}`}>
                {newLevel}
              </div>
            </div>
            <div className="cyber-panel p-3 text-center border-neon-amber/40 bg-neon-amber/10">
              <div className="text-[10px] uppercase tracking-widest text-neon-amber font-semibold mb-1">
                Зароблено XP
              </div>
              <div className="text-xl font-mono font-bold text-neon-amber">+{xpEarned}</div>
            </div>
          </div>

          <div className="cyber-panel p-4 mb-6 border-neon-blue/40 bg-neon-blue/5">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider">
                Звання
              </span>
              <span className={`text-sm font-bold ${color}`}>{title}</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider">
                Прогрес рівня
              </span>
              <span className="text-xs font-mono font-bold text-neon-amber">
                {profile.xp} / {next}
              </span>
            </div>
            <div className="h-2 rounded-full bg-cyber-border overflow-hidden border border-cyber-border/40 mt-2">
              <div
                className="h-full bg-gradient-to-r from-neon-pink to-neon-blue transition-all duration-1000"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-green to-neon-blue text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform animate-glow-green"
          >
            <Star size={20} className="animate-pulse" />
            Продовжити тренуватись
          </button>
        </div>
      </div>
    </div>
  );
}
