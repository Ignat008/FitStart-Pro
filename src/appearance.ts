export const APPEARANCE_THEMES = [
  { id: 'cyber', label: 'Cyber Blue', color: '#3b82f6' },
  { id: 'ocean', label: 'Ocean', color: '#22d3ee' },
  { id: 'violet', label: 'Violet', color: '#a78bfa' },
  { id: 'forest', label: 'Forest', color: '#4ade80' },
] as const;

export const BACKGROUND_STYLES = [
  { id: 'grid', label: 'Кібер-сітка', preview: 'grid' },
  { id: 'aurora', label: 'Північне сяйво', preview: 'aurora' },
  { id: 'plain', label: 'Мінімалістичний', preview: 'plain' },
] as const;

export type AppearanceTheme = (typeof APPEARANCE_THEMES)[number]['id'];
export type BackgroundStyle = (typeof BACKGROUND_STYLES)[number]['id'];

export interface AppearanceSettings {
  theme: AppearanceTheme;
  background: BackgroundStyle;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: 'cyber',
  background: 'grid',
};

const STORAGE_KEY = 'fitstart_appearance';

export function loadAppearance(): AppearanceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;

    const parsed = JSON.parse(raw);
    return {
      theme: APPEARANCE_THEMES.some((item) => item.id === parsed.theme)
        ? parsed.theme
        : DEFAULT_APPEARANCE.theme,
      background: BACKGROUND_STYLES.some((item) => item.id === parsed.background)
        ? parsed.background
        : DEFAULT_APPEARANCE.background,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(appearance: AppearanceSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    // Appearance remains active for this session if storage is unavailable.
  }
}

export function applyAppearance(appearance: AppearanceSettings): void {
  document.documentElement.dataset.theme = appearance.theme;
  document.documentElement.dataset.background = appearance.background;
}
