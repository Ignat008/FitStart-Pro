import { useEffect, useState } from 'react';
import { Check, ExternalLink, LoaderCircle, Search } from 'lucide-react';
import type { MusicTrack } from '@/musicTracks';

interface AppleSong {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  previewUrl: string;
  artworkUrl100?: string;
  trackViewUrl: string;
  trackTimeMillis?: number;
}

interface Props {
  playlistTrackIds: string[];
  onAddTrack: (track: MusicTrack) => void;
}

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

const APPLE_ARTWORK = 'from-sky-500 to-indigo-700';

function isAppleSong(value: unknown): value is AppleSong {
  if (typeof value !== 'object' || value === null) return false;
  const song = value as Record<string, unknown>;
  return (
    typeof song.trackId === 'number' &&
    Number.isInteger(song.trackId) &&
    song.trackId > 0 &&
    typeof song.trackName === 'string' &&
    song.trackName.length > 0 &&
    typeof song.artistName === 'string' &&
    song.artistName.length > 0 &&
    typeof song.previewUrl === 'string' &&
    song.previewUrl.startsWith('https://audio-ssl.itunes.apple.com/') &&
    typeof song.trackViewUrl === 'string' &&
    song.trackViewUrl.startsWith('https://music.apple.com/') &&
    (song.collectionName === undefined || typeof song.collectionName === 'string') &&
    (song.trackTimeMillis === undefined ||
      (typeof song.trackTimeMillis === 'number' && Number.isFinite(song.trackTimeMillis))) &&
    (song.artworkUrl100 === undefined ||
      (typeof song.artworkUrl100 === 'string' &&
        song.artworkUrl100.startsWith('https://is') &&
        song.artworkUrl100.includes('.mzstatic.com/')))
  );
}

function toMusicTrack(song: AppleSong): MusicTrack {
  return {
    id: `apple-${song.trackId}`,
    title: song.trackName,
    artist: song.artistName,
    album: song.collectionName,
    src: song.previewUrl,
    artwork: APPLE_ARTWORK,
    artworkUrl: song.artworkUrl100,
    sourceUrl: song.trackViewUrl,
    isPreview: true,
  };
}

export default function MusicCatalogSearch({ playlistTrackIds, onAddTrack }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AppleSong[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus('loading');
      setResults([]);
      try {
        const url = new URL('https://itunes.apple.com/search');
        url.searchParams.set('term', term);
        url.searchParams.set('entity', 'song');
        url.searchParams.set('limit', '8');
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Apple Search returned ${response.status}`);
        const payload: unknown = await response.json();
        const rows =
          typeof payload === 'object' && payload !== null && 'results' in payload
            ? payload.results
            : null;
        const songs = Array.isArray(rows) ? rows.filter(isAppleSong) : [];
        setResults(songs);
        setStatus('success');
      } catch {
        if (controller.signal.aborted) return;
        setStatus('error');
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="mb-4 p-3 rounded-xl border border-cyber-border/60 bg-cyber-bg/30">
      <label className="relative block">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Знайти трек, наприклад Till I Collapse"
          className="w-full bg-cyber-surface border border-cyber-border rounded-lg pl-9 pr-3 py-2 text-xs text-cyber-text placeholder:text-cyber-muted/70 focus:border-neon-blue focus:outline-none"
          aria-label="Пошук музики"
        />
      </label>

      <p className="text-[9px] text-cyber-muted leading-relaxed mt-2">
        Пошук через Apple. Відтворюються офіційні прев’ю приблизно 30 секунд; повну версію можна
        відкрити в Apple Music.
      </p>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-[10px] text-cyber-muted mt-3">
          <LoaderCircle size={13} className="animate-spin text-neon-blue" />
          Шукаємо треки...
        </div>
      )}
      {status === 'error' && (
        <p role="status" className="text-[10px] text-neon-red mt-3">
          Не вдалося виконати пошук. Перевір інтернет-з’єднання та спробуй ще раз.
        </p>
      )}
      {status === 'success' && results.length === 0 && (
        <p className="text-[10px] text-cyber-muted mt-3">
          Треків із доступним прев’ю не знайдено.
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-2 mt-3">
          {results.map((song) => {
            const track = toMusicTrack(song);
            const inPlaylist = playlistTrackIds.includes(track.id);
            return (
              <div
                key={song.trackId}
                className="flex items-center gap-2 p-2 rounded-lg border border-cyber-border/50 bg-cyber-surface/50"
              >
                {song.artworkUrl100 ? (
                  <img
                    src={song.artworkUrl100}
                    alt=""
                    className="w-9 h-9 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span className={`w-9 h-9 shrink-0 rounded-md bg-gradient-to-br ${APPLE_ARTWORK}`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-cyber-text truncate">
                    {song.trackName}
                  </p>
                  <p className="text-[9px] text-cyber-muted truncate">
                    {song.artistName}
                    {song.collectionName ? ` · ${song.collectionName}` : ''}
                    {' · офіційне прев’ю'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddTrack(track)}
                  className="shrink-0 px-2 py-1.5 rounded-lg border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/10 text-[9px] font-bold"
                  aria-label={
                    inPlaylist
                      ? `Обрати ${song.trackName} у плеєрі`
                      : `Додати ${song.trackName} до плейлиста`
                  }
                >
                  {inPlaylist ? <Check size={14} /> : 'Додати'}
                </button>
                <a
                  href={song.trackViewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-cyber-muted hover:text-neon-blue"
                  aria-label={`Відкрити ${song.trackName} в Apple Music`}
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
