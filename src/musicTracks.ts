export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
  artwork: string;
  album?: string;
  artworkUrl?: string;
  sourceUrl?: string;
  isLocal?: boolean;
  isPreview?: boolean;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'pulse-sprint',
    title: 'Pulse Sprint',
    artist: 'FitStart Studio',
    src: `${import.meta.env.BASE_URL}audio/pulse-sprint.wav`,
    artwork: 'from-cyan-500 to-blue-700',
  },
  {
    id: 'neon-momentum',
    title: 'Neon Momentum',
    artist: 'FitStart Studio',
    src: `${import.meta.env.BASE_URL}audio/neon-momentum.wav`,
    artwork: 'from-fuchsia-500 to-violet-700',
  },
  {
    id: 'recovery-flow',
    title: 'Recovery Flow',
    artist: 'FitStart Studio',
    src: `${import.meta.env.BASE_URL}audio/recovery-flow.wav`,
    artwork: 'from-emerald-400 to-teal-700',
  },
];
