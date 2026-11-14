import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  LoaderCircle,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { MUSIC_TRACKS } from '@/musicTracks';

type RepeatMode = 'off' | 'all' | 'one';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playAfterLoadRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const track = MUSIC_TRACKS[trackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    setError('');
    setIsPlaying(false);
    setIsLoading(true);
    audio.load();
  }, [track.src]);

  const selectTrack = useCallback((index: number, autoPlay = false) => {
    const audio = audioRef.current;
    playAfterLoadRef.current = autoPlay || Boolean(audio && !audio.paused);
    setTrackIndex(index);
    setError('');
    setIsLoading(true);
  }, []);

  const playNext = useCallback(
    (autoPlay = false) => {
      if (shuffle && MUSIC_TRACKS.length > 1) {
        const choices = MUSIC_TRACKS.map((_, index) => index).filter(
          (index) => index !== trackIndex,
        );
        selectTrack(choices[Math.floor(Math.random() * choices.length)], autoPlay);
        return;
      }

      if (trackIndex < MUSIC_TRACKS.length - 1) {
        selectTrack(trackIndex + 1, autoPlay);
      } else if (repeatMode === 'all') {
        selectTrack(0, autoPlay);
      } else {
        setIsPlaying(false);
      }
    },
    [repeatMode, selectTrack, shuffle, trackIndex],
  );

  const playPrevious = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const previousIndex =
      trackIndex > 0
        ? trackIndex - 1
        : repeatMode === 'all'
          ? MUSIC_TRACKS.length - 1
          : 0;
    selectTrack(previousIndex, !audio.paused);
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setError('');
    void audio.play().catch(() => {
      setIsPlaying(false);
      setError('Не вдалося відтворити аудіо. Перевір наявність файлу.');
    });
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      void audio.play().catch(() => {
        setIsPlaying(false);
        setError('Не вдалося повторно відтворити трек.');
      });
      return;
    }
    playNext(true);
  };

  const cycleRepeatMode = () => {
    setRepeatMode((current) =>
      current === 'off' ? 'all' : current === 'all' ? 'one' : 'off',
    );
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl">
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        onLoadStart={() => setIsLoading(true)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onCanPlay={() => {
          setIsLoading(false);
          if (playAfterLoadRef.current) {
            playAfterLoadRef.current = false;
            void audioRef.current?.play().catch(() => {
              setIsPlaying(false);
              setError('Не вдалося відтворити аудіо. Перевір наявність файлу.');
            });
          }
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
          setError('Не вдалося завантажити трек. Перевір файл у public/audio.');
        }}
        onEnded={handleEnded}
        className="hidden"
      />

      <section className="cyber-panel border-cyber-border/80 shadow-2xl">
        {expanded && (
          <div className="p-4 sm:p-5 border-b border-cyber-border/70">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Music2 size={15} className="text-neon-blue" />
                  Музичний плеєр
                </h2>
                <p className="text-[10px] text-cyber-muted mt-0.5">
                  Фоновий звук для тренування
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="p-2 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface transition-colors"
                aria-label="Згорнути плеєр"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br ${track.artwork} flex items-center justify-center shadow-lg`}
              >
                <Music2 size={24} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{track.title}</p>
                <p className="text-xs text-cyber-muted truncate">{track.artist}</p>
              </div>
              {isLoading && <LoaderCircle size={17} className="ml-auto shrink-0 text-neon-blue animate-spin" />}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-2.5 mb-3 rounded-lg border border-neon-red/40 bg-neon-red/5 text-neon-red text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="ml-auto"
                  aria-label="Закрити повідомлення"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              disabled={!duration}
              onChange={(event) => {
                const nextTime = Number(event.target.value);
                if (audioRef.current) audioRef.current.currentTime = nextTime;
                setCurrentTime(nextTime);
              }}
              className="w-full accent-neon-blue disabled:opacity-40"
              aria-label="Позиція відтворення"
            />
            <div className="flex justify-between text-[10px] font-mono text-cyber-muted -mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMuted((value) => !value)}
                  className="p-2 rounded-lg text-cyber-muted hover:text-cyber-text transition-colors"
                  aria-label={muted ? 'Увімкнути звук' : 'Вимкнути звук'}
                  aria-pressed={muted}
                >
                  {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="w-20 sm:w-28 accent-neon-blue"
                  aria-label="Гучність"
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShuffle((value) => !value)}
                  className={`p-2 rounded-lg transition-colors ${shuffle ? 'text-neon-blue bg-neon-blue/10' : 'text-cyber-muted hover:text-cyber-text'}`}
                  aria-label="Випадкове відтворення"
                  aria-pressed={shuffle}
                >
                  <Shuffle size={16} />
                </button>
                <button
                  type="button"
                  onClick={cycleRepeatMode}
                  className={`p-2 rounded-lg transition-colors ${repeatMode !== 'off' ? 'text-neon-blue bg-neon-blue/10' : 'text-cyber-muted hover:text-cyber-text'}`}
                  aria-label={`Повтор: ${repeatMode === 'off' ? 'вимкнено' : repeatMode === 'all' ? 'плейлист' : 'трек'}`}
                  aria-pressed={repeatMode !== 'off'}
                >
                  {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-[10px] uppercase tracking-widest text-cyber-muted mb-2">
                Плейлист
              </h3>
              <div className="space-y-1">
                {MUSIC_TRACKS.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => selectTrack(index)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                      index === trackIndex
                        ? 'bg-neon-blue/10 text-neon-blue'
                        : 'hover:bg-cyber-surface text-cyber-text'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-md bg-gradient-to-br ${item.artwork} flex items-center justify-center`}>
                      <Music2 size={13} className="text-white" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold truncate">{item.title}</span>
                      <span className="block text-[10px] text-cyber-muted">{item.artist}</span>
                    </span>
                    {index === trackIndex && isPlaying && (
                      <span className="text-[9px] uppercase tracking-wider">грає</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-cyber-muted mt-2">
                Демо-треки можна замінити власними файлами в public/audio та списку src/musicTracks.ts.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-2.5 sm:p-3">
          <div className={`w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br ${track.artwork} flex items-center justify-center`}>
            <Music2 size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate">{track.title}</p>
            <p className="text-[10px] text-cyber-muted truncate">{track.artist}</p>
            {error && !expanded && (
              <p className="text-[9px] text-neon-red truncate">{error}</p>
            )}
          </div>
          {isLoading && <LoaderCircle size={15} className="shrink-0 text-neon-blue animate-spin" />}
          <button
            type="button"
            onClick={playPrevious}
            className="p-2 rounded-lg text-cyber-muted hover:text-cyber-text transition-colors"
            aria-label="Попередній трек"
          >
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            onClick={togglePlayback}
            className="w-9 h-9 shrink-0 rounded-full bg-neon-blue text-white flex items-center justify-center hover:brightness-110 transition-all"
            aria-label={isPlaying ? 'Пауза' : 'Відтворити'}
          >
            {isLoading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => playNext(false)}
            className="p-2 rounded-lg text-cyber-muted hover:text-cyber-text transition-colors"
            aria-label="Наступний трек"
          >
            <SkipForward size={16} />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="p-2 rounded-lg text-cyber-muted hover:text-cyber-text transition-colors"
            aria-label={expanded ? 'Згорнути плеєр' : 'Розгорнути плеєр'}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronDown size={17} /> : <Music2 size={17} />}
          </button>
        </div>
      </section>
    </div>
  );
}
