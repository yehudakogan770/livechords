import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { IconPlay, IconPlus, IconTrash } from '../components/icons';
import { deleteSong, getSettings, getSongs, saveSettings } from '../data/storage';
import type { LibraryGrouping, Song } from '../types';

const UNKNOWN_ARTIST = 'Unknown Artist';
const NO_STYLE = 'No Style';

interface SongGroup {
  key: string;
  songs: Song[];
}

function groupSongs(songs: Song[], grouping: LibraryGrouping): SongGroup[] {
  if (grouping === 'title') return [{ key: '', songs }];

  const fallback = grouping === 'artist' ? UNKNOWN_ARTIST : NO_STYLE;
  const map = new Map<string, Song[]>();
  for (const song of songs) {
    const key = (grouping === 'artist' ? song.artist : song.style).trim() || fallback;
    const list = map.get(key) ?? [];
    list.push(song);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([key, groupSongsList]) => ({ key, songs: groupSongsList }))
    .sort((a, b) => {
      if (a.key === fallback) return 1;
      if (b.key === fallback) return -1;
      return a.key.localeCompare(b.key);
    });
}

const SONG_GRID_CLASS = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';

export default function LibraryPage() {
  const [songs, setSongs] = useState<Song[]>(() => getSongs());
  const [query, setQuery] = useState('');
  const [settings, setSettings] = useState(getSettings);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.style.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [songs, query]);

  const groups = useMemo(() => groupSongs(filtered, settings.libraryGrouping), [filtered, settings.libraryGrouping]);

  function handleDelete(song: Song) {
    if (!window.confirm(`Delete "${song.title}"? This can't be undone.`)) return;
    deleteSong(song.id);
    setSongs(getSongs());
  }

  function handleGroupingChange(grouping: LibraryGrouping) {
    const next = { ...settings, libraryGrouping: grouping };
    saveSettings(next);
    setSettings(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          Song Library <span className="text-stage-muted text-base font-normal">({songs.length})</span>
        </h1>
        <Link
          to="/song/new"
          className="bg-stage-accent text-stage-bg flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold"
        >
          <IconPlus className="h-4 w-4" />
          New Song
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, artist, style, or tag…"
          className="border-stage-edge bg-stage-panel placeholder:text-stage-muted w-full rounded-lg border px-3 py-2 focus:outline-none sm:flex-1"
        />
        <label className="flex shrink-0 items-center gap-2 text-sm">
          <span className="text-stage-muted whitespace-nowrap">Group by</span>
          <select
            value={settings.libraryGrouping}
            onChange={(e) => handleGroupingChange(e.target.value as LibraryGrouping)}
            className="border-stage-edge bg-stage-panel rounded-lg border px-3 py-2 focus:outline-none"
          >
            <option value="title">Title (A–Z)</option>
            <option value="artist">Artist</option>
            <option value="style">Style</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-stage-muted rounded-lg border border-dashed border-stage-edge px-4 py-16 text-center text-sm">
          {songs.length === 0
            ? 'No songs yet. Add your first chart to get started.'
            : `No songs match "${query}".`}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.key || 'flat'}>
              {group.key && (
                <h2 className="text-stage-accent mb-2 text-xs font-semibold tracking-wide uppercase">
                  {group.key} <span className="text-stage-muted font-normal">({group.songs.length})</span>
                </h2>
              )}
              <div className={SONG_GRID_CLASS}>
                {group.songs.map((song) => (
                  <div
                    key={song.id}
                    className="border-stage-edge bg-stage-panel flex items-center gap-2 rounded-lg border px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/song/${song.id}/edit`)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate font-medium">{song.title}</p>
                      <p className="text-stage-muted flex items-center gap-1.5 truncate text-sm">
                        <span className="truncate">
                          {song.artist || 'Unknown artist'}
                          {song.originalKey ? ` · Key ${song.originalKey}` : ''}
                          {song.bpm ? ` · ${song.bpm} BPM` : ''}
                        </span>
                        {song.style && (
                          <span className="border-stage-edge text-stage-accent shrink-0 rounded-full border px-1.5 py-0.5 text-[0.65rem] leading-tight">
                            {song.style}
                          </span>
                        )}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label={`Perform ${song.title}`}
                      onClick={() => navigate(`/stage/${song.id}`)}
                      className="bg-stage-accent text-stage-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    >
                      <IconPlay className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${song.title}`}
                      onClick={() => handleDelete(song)}
                      className="text-stage-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:text-red-400"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
