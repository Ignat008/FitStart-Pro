import { ArrowLeft, Check, Palette, Sparkles } from 'lucide-react';
import {
  APPEARANCE_THEMES,
  BACKGROUND_STYLES,
  type AppearanceSettings,
} from '@/appearance';

interface Props {
  appearance: AppearanceSettings;
  onChange: (appearance: AppearanceSettings) => void;
  onBack: () => void;
}

export default function AppearanceScreen({ appearance, onChange, onBack }: Props) {
  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      <header className="relative z-10 flex items-center justify-between gap-4 px-4 sm:px-8 py-4 border-b border-cyber-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-blue/15 border border-neon-blue/40 flex items-center justify-center">
            <Palette size={20} className="text-neon-blue" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Вигляд інтерфейсу</h1>
            <p className="text-xs text-cyber-muted">Налаштуй кольори та фон FitStart Pro</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-cyber-border hover:border-neon-blue/50 bg-cyber-surface/60 text-xs sm:text-sm transition-all"
        >
          <ArrowLeft size={15} />
          <span>До тренувань</span>
        </button>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <section className="cyber-panel p-5 sm:p-7 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-neon-pink" />
            <h2 className="text-base font-bold">Тема інтерфейсу</h2>
          </div>
          <p className="text-sm text-cyber-muted mb-5">
            Зміни кольори кнопок, акцентів і панелей у застосунку.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {APPEARANCE_THEMES.map((theme) => {
              const selected = appearance.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onChange({ ...appearance, theme: theme.id })}
                  aria-pressed={selected}
                  className={`flex items-center justify-between gap-4 p-4 rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-neon-blue bg-neon-blue/10'
                      : 'border-cyber-border bg-cyber-bg/40 hover:border-cyber-muted/50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-full border border-white/20 shadow-lg"
                      style={{ backgroundColor: theme.color, boxShadow: `0 0 18px ${theme.color}66` }}
                    />
                    <span>
                      <span className="block text-sm font-semibold">{theme.label}</span>
                      <span className="block text-xs text-cyber-muted">Темна тема з яскравими акцентами</span>
                    </span>
                  </span>
                  {selected && <Check size={18} className="shrink-0 text-neon-blue" />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="cyber-panel p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={16} className="text-neon-green" />
            <h2 className="text-base font-bold">Фон</h2>
          </div>
          <p className="text-sm text-cyber-muted mb-5">
            Обери оформлення фону для сторінок тренування.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BACKGROUND_STYLES.map((background) => {
              const selected = appearance.background === background.id;
              return (
                <button
                  key={background.id}
                  onClick={() => onChange({ ...appearance, background: background.id })}
                  aria-pressed={selected}
                  className={`overflow-hidden rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-neon-blue ring-1 ring-neon-blue/50'
                      : 'border-cyber-border hover:border-cyber-muted/50'
                  }`}
                >
                  <span
                    className="block h-24 bg-cyber-bg"
                    data-background-preview={background.preview}
                  />
                  <span className="flex items-center justify-between gap-2 p-3 bg-cyber-surface/80">
                    <span className="text-sm font-semibold">{background.label}</span>
                    {selected && <Check size={16} className="text-neon-blue" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
