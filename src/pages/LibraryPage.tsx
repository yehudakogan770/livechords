import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { IconPlay, IconPlus, IconTrash } from '../components/icons';
import { deleteSong, getSongs } from '../data/storage';
import type { Song } from '../types';

export default function LibraryPage() {
  const [songs, setSongs] = useState<Song[]>(() => getSongs());
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [songs, query]);

  function handleDelete(song: Song) {
    if (!window.confirm(`Delete "${song.title}"? This can't be undone.`)) return;
    deleteSong(song.id);
    setSongs(getSongs());
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Song Library</h1>
        <Link
          to="/song/new"
          className="bg-stage-accent text-stage-bg flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold"
        >
          <IconPlus className="h-4 w-4" />
          New Song
        </Link>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search title, artist, or tag…"
        className="border-stage-edge bg-stage-panel placeholder:text-stage-muted mb-4 w-full rounded-lg border px-3 py-2 focus:outline-none"
      />

      {filtered.length === 0 ? (
        <p className="text-stage-muted rounded-lg border border-dashed border-stage-edge px-4 py-10 text-center text-sm">
          {songs.length === 0
            ? 'No songs yet. Add your first chart to get started.'
            : `No songs match "${query}".`}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((song) => (
            <li
              key={song.id}
              className="border-stage-edge bg-stage-panel flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <button
                type="button"
                onClick={() => navigate(`/song/${song.id}/edit`)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-medium">{song.title}</p>
                <p className="text-stage-muted truncate text-sm">
                  {song.artist || 'Unknown artist'}
                  {song.originalKey ? ` · Key ${song.originalKey}` : ''}
                  {song.bpm ? ` · ${song.bpm} BPM` : ''}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
