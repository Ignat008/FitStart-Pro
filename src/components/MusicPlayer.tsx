import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  AlertCircle,
  ChevronDown,
  FolderOpen,
  LoaderCircle,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { MUSIC_TRACKS, type MusicTrack } from '@/musicTracks';
import MusicCatalogSearch from '@/components/MusicCatalogSearch';

type RepeatMode = 'off' | 'all' | 'one';
const SAVED_TRACKS_KEY = 'fitstart_music_tracks';
const APPLE_ARTWORK = 'from-sky-500 to-indigo-700';

function isSavedAppleTrack(value: unknown): value is MusicTrack {
  if (typeof value !== 'object' || value === null) return false;
  const track = value as Record<string, unknown>;
  return (
    typeof track.id === 'string' &&
    track.id.startsWith('apple-') &&
    typeof track.title === 'string' &&
    typeof track.artist === 'string' &&
    typeof track.src === 'string' &&
    track.src.startsWith('https://audio-ssl.itunes.apple.com/') &&
    track.artwork === APPLE_ARTWORK &&
    typeof track.sourceUrl === 'string' &&
    track.sourceUrl.startsWith('https://music.apple.com/') &&
    (track.album === undefined || typeof track.album === 'string') &&
    (track.artworkUrl === undefined ||
      (typeof track.artworkUrl === 'string' &&
        track.artworkUrl.startsWith('https://is') &&
        track.artworkUrl.includes('.mzstatic.com/')))
  );
}

function loadSavedAppleTracks(): { tracks: MusicTrack[]; error: string } {
  try {
    const raw = localStorage.getItem(SAVED_TRACKS_KEY);
    if (!raw) return { tracks: [], error: '' };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { tracks: [], error: 'Збережений плейлист пошкоджений і не був завантажений.' };
    }
    return { tracks: parsed.filter(isSavedAppleTrack), error: '' };
  } catch {
    return { tracks: [], error: 'Не вдалося прочитати збережений плейлист браузера.' };
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playAfterLoadRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localTrackUrlsRef = useRef<string[]>([]);
  const [savedTrackState] = useState(loadSavedAppleTracks);
  const [savedAppleTracks, setSavedAppleTracks] = useState(savedTrackState.tracks);
  const [localTracks, setLocalTracks] = useState<MusicTrack[]>([]);
  const [trackId, setTrackId] = useState(MUSIC_TRACKS[0].id);
  const tracks = useMemo(
    () => [...MUSIC_TRACKS, ...savedAppleTracks, ...localTracks],
    [localTracks, savedAppleTracks],
  );
  const trackIndex = Math.max(0, tracks.findIndex((item) => item.id === trackId));
  const track = tracks[trackIndex] ?? MUSIC_TRACKS[0];
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(savedTrackState.error);
  const [expanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [playlistQuery, setPlaylistQuery] = useState('');
  const visibleTracks = tracks.filter((item) =>
    `${item.title} ${item.artist} ${item.album ?? ''}`
      .toLocaleLowerCase()
      .includes(playlistQuery.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    return () => {
      localTrackUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

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
  }, [track.src]);

  const selectTrack = useCallback((id: string, autoPlay = false) => {
    const audio = audioRef.current;
    playAfterLoadRef.current = autoPlay || Boolean(audio && !audio.paused);
    setTrackId(id);
    setError('');
    setIsLoading(true);
  }, []);

  const playNext = useCallback(
    (autoPlay = false) => {
      if (shuffle && tracks.length > 1) {
        const choices = tracks.filter(
          (item) => item.id !== track.id,
        );
        selectTrack(choices[Math.floor(Math.random() * choices.length)].id, autoPlay);
        return;
      }

      if (trackIndex < tracks.length - 1) {
        selectTrack(tracks[trackIndex + 1].id, autoPlay);
      } else if (repeatMode === 'all') {
        selectTrack(tracks[0].id, autoPlay);
      } else {
        setIsPlaying(false);
      }
    },
    [repeatMode, selectTrack, shuffle, track, trackIndex, tracks],
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
          ? tracks.length - 1
          : 0;
    selectTrack(tracks[previousIndex].id, !audio.paused);
  };

  const playbackErrorMessage = () =>
    track.isPreview
      ? 'Не вдалося відтворити прев’ю. Перевір підтримку формату браузером або відкрий трек в Apple Music.'
      : track.isLocal
        ? 'Не вдалося відтворити цей аудіофайл. Перевір його формат.'
        : 'Не вдалося відтворити демо-аудіо.';

  const addAppleTrack = (trackToAdd: MusicTrack) => {
    const nextTracks = savedAppleTracks.some((item) => item.id === trackToAdd.id)
      ? savedAppleTracks
      : [...savedAppleTracks, trackToAdd];
    if (nextTracks !== savedAppleTracks) {
      setSavedAppleTracks(nextTracks);
      try {
        localStorage.setItem(SAVED_TRACKS_KEY, JSON.stringify(nextTracks));
      } catch {
        setError('Не вдалося зберегти трек у плейлисті браузера.');
      }
    }
    selectTrack(trackToAdd.id);
  };

  const addLocalFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    const audioFiles = files.filter(
      (file) =>
        file.type.startsWith('audio/') ||
        /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name),
    );
    if (audioFiles.length === 0) {
      setError('Обери аудіофайл у форматі MP3, WAV, M4A, AAC, OGG або FLAC.');
      event.currentTarget.value = '';
      return;
    }

    const additions = audioFiles.map((file, index) => {
      const src = URL.createObjectURL(file);
      localTrackUrlsRef.current.push(src);
      return {
        id: `local-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
        title: file.name.replace(/\.[^.]+$/, ''),
        artist: 'Локальний файл',
        src,
        artwork: 'from-violet-500 to-fuchsia-700',
        isLocal: true,
      };
    });
    setLocalTracks((current) => [...current, ...additions]);
    event.currentTarget.value = '';
  };

  const removeTrack = (id: string) => {
    if (id === track.id) {
      audioRef.current?.pause();
      playAfterLoadRef.current = false;
      setTrackId(MUSIC_TRACKS[0].id);
    }

    const localTrack = localTracks.find((item) => item.id === id);
    if (localTrack) {
      URL.revokeObjectURL(localTrack.src);
      localTrackUrlsRef.current = localTrackUrlsRef.current.filter(
        (url) => url !== localTrack.src,
      );
      setLocalTracks((current) => current.filter((item) => item.id !== id));
      return;
    }

    const nextTracks = savedAppleTracks.filter((item) => item.id !== id);
    if (nextTracks.length !== savedAppleTracks.length) {
      setSavedAppleTracks(nextTracks);
      try {
        localStorage.setItem(SAVED_TRACKS_KEY, JSON.stringify(nextTracks));
      } catch {
        setError('Не вдалося оновити плейлист у браузері.');
      }
    }
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (audio.error) {
      playAfterLoadRef.current = false;
      setIsLoading(false);
      setError(playbackErrorMessage());
      return;
    }
    if (isLoading || audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      playAfterLoadRef.current = true;
      setIsLoading(true);
      return;
    }
    setError('');
    void audio.play().catch(() => {
      setIsPlaying(false);
      setError(playbackErrorMessage());
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
    <div
      className={`fixed bottom-3 right-3 z-[60] max-w-2xl ${
        expanded ? 'left-3 w-auto' : 'w-fit'
      } sm:left-3 sm:right-3 sm:mx-auto sm:w-auto`}
    >
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
              setError(playbackErrorMessage());
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
          playAfterLoadRef.current = false;
          setError(playbackErrorMessage());
        }}
        onEnded={handleEnded}
        className="hidden"
      />

      <section className="cyber-panel border-cyber-border/80 shadow-2xl">
        {expanded && (
          <div className="p-4 sm:p-5 border-b border-cyber-border/70 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain">
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
              {track.artworkUrl ? (
                <img
                  src={track.artworkUrl}
                  alt=""
                  className="w-14 h-14 shrink-0 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div
                  className={`w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br ${track.artwork} flex items-center justify-center shadow-lg`}
                >
                  <Music2 size={24} className="text-white" />
                </div>
              )}
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
              <div className="space-y-1">
                <MusicCatalogSearch
                  playlistTrackIds={tracks.map((item) => item.id)}
                  onAddTrack={addAppleTrack}
                />
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-[10px] uppercase tracking-widest text-cyber-muted">
                    Плейлист
                  </h3>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-cyber-border text-[9px] text-cyber-muted hover:text-neon-blue hover:border-neon-blue/40"
                  >
                    <FolderOpen size={12} />
                    Додати файл
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                    multiple
                    onChange={addLocalFiles}
                    className="hidden"
                    aria-label="Додати власні аудіофайли"
                  />
                </div>
                <input
                  type="search"
                  value={playlistQuery}
                  onChange={(event) => setPlaylistQuery(event.target.value)}
                  placeholder="Пошук у плейлисті"
                  className="w-full bg-cyber-surface border border-cyber-border rounded-lg px-3 py-2 mb-2 text-[10px] text-cyber-text placeholder:text-cyber-muted/70 focus:border-neon-blue focus:outline-none"
                  aria-label="Пошук у плейлисті"
                />
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {visibleTracks.map((item) => {
                    const active = item.id === track.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-1 rounded-lg ${
                          active ? 'bg-neon-blue/10' : 'hover:bg-cyber-surface'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => selectTrack(item.id)}
                          className={`min-w-0 flex-1 flex items-center gap-2 p-2 rounded-lg text-left ${
                            active ? 'text-neon-blue' : 'text-cyber-text'
                          }`}
                        >
                          {item.artworkUrl ? (
                            <img
                              src={item.artworkUrl}
                              alt=""
                              className="w-7 h-7 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <span className={`w-7 h-7 shrink-0 rounded-md bg-gradient-to-br ${item.artwork} flex items-center justify-center`}>
                              <Music2 size={13} className="text-white" />
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold truncate">{item.title}</span>
                            <span className="block text-[10px] text-cyber-muted truncate">
                              {item.artist}
                              {item.isPreview ? ' · прев’ю' : ''}
                              {item.isLocal ? ' · локальний файл' : ''}
                            </span>
                          </span>
                          {active && isPlaying && (
                            <span className="text-[9px] uppercase tracking-wider">грає</span>
                          )}
                        </button>
                        {(item.isLocal || item.isPreview) && (
                          <button
                            type="button"
                            onClick={() => removeTrack(item.id)}
                            className="p-2 text-cyber-muted hover:text-neon-red"
                            aria-label={`Видалити ${item.title} з плейлиста`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {visibleTracks.length === 0 && (
                    <p className="text-[10px] text-cyber-muted text-center py-3">
                      У плейлисті немає відповідних треків.
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-cyber-muted mt-2">
                Локальні файли доступні до закриття вкладки. Онлайн-прев’ю зберігаються у плейлисті браузера.
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex sm:hidden w-12 h-12 items-center justify-center rounded-full bg-neon-blue text-white shadow-lg"
          aria-label="Відкрити музичний плеєр"
          aria-expanded={expanded}
        >
          <Music2 size={20} />
        </button>

        <div className={`${expanded ? 'flex' : 'hidden'} sm:flex items-center gap-2 p-2.5 sm:p-3`}>
          {track.artworkUrl ? (
            <img src={track.artworkUrl} alt="" className="w-10 h-10 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className={`w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br ${track.artwork} flex items-center justify-center`}>
              <Music2 size={18} className="text-white" />
            </div>
          )}
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
