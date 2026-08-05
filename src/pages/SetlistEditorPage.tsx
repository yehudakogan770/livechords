import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { IconPlay, IconTrash } from '../components/icons';
import { getSetlist, getSongs, saveSetlist } from '../data/storage';
import type { Setlist, Song } from '../types';

export default function SetlistEditorPage() {
  const { setlistId } = useParams<{ setlistId: string }>();
  const navigate = useNavigate();
  const [setlist, setSetlist] = useState<Setlist | undefined>(() => (setlistId ? getSetlist(setlistId) : undefined));
  const [allSongs] = useState<Song[]>(() => getSongs());
  const [addingId, setAddingId] = useState('');

  useEffect(() => {
    setSetlist(setlistId ? getSetlist(setlistId) : undefined);
  }, [setlistId]);

  function persist(next: Setlist) {
    saveSetlist(next);
    setSetlist(next);
  }

  function moveSong(index: number, dir: -1 | 1) {
    if (!setlist) return;
    const ids = [...setlist.songIds];
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    persist({ ...setlist, songIds: ids });
  }

  function removeSong(id: string) {
    if (!setlist) return;
    persist({ ...setlist, songIds: setlist.songIds.filter((sid) => sid !== id) });
  }

  function addSong(id: string) {
    if (!setlist || !id || setlist.songIds.includes(id)) return;
    persist({ ...setlist, songIds: [...setlist.songIds, id] });
    setAddingId('');
  }

  if (!setlist) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-stage-muted">
          Setlist not found.{' '}
          <Link to="/setlists" className="text-stage-accent">
            Back to setlists
          </Link>
        </p>
      </div>
    );
  }

  const songsInOrder = setlist.songIds
    .map((id) => allSongs.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));
  const availableToAdd = allSongs.filter((s) => !setlist.songIds.includes(s.id));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          value={setlist.name}
          onChange={(e) => persist({ ...setlist, name: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-xl font-semibold focus:outline-none"
        />
        {songsInOrder.length > 0 && (
          <button
            type="button"
            onClick={() => navigate(`/stage/${songsInOrder[0].id}?setlist=${setlist.id}`)}
            className="bg-stage-accent text-stage-bg flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold"
          >
            <IconPlay className="h-4 w-4" />
            Perform
          </button>
        )}
      </div>

      {songsInOrder.length === 0 ? (
        <p className="text-stage-muted mb-6 text-sm">No songs yet — add some below.</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-2">
          {songsInOrder.map((song, i) => (
            <li
              key={song.id}
              className="border-stage-edge bg-stage-panel flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <span className="text-stage-muted w-5 shrink-0 text-right text-sm">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{song.title}</p>
                <p className="text-stage-muted truncate text-sm">{song.artist || 'Unknown artist'}</p>
              </div>
              <button
                type="button"
                aria-label="Move up"
                disabled={i === 0}
                onClick={() => moveSong(i, -1)}
                className="text-stage-muted h-8 w-8 shrink-0 rounded-full disabled:opacity-25"
              >
                ▲
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={i === songsInOrder.length - 1}
                onClick={() => moveSong(i, 1)}
                className="text-stage-muted h-8 w-8 shrink-0 rounded-full disabled:opacity-25"
              >
                ▼
              </button>
              <button
                type="button"
                aria-label={`Remove ${song.title}`}
                onClick={() => removeSong(song.id)}
                className="text-stage-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:text-red-400"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {availableToAdd.length > 0 ? (
        <div className="flex gap-2">
          <select
            value={addingId}
            onChange={(e) => setAddingId(e.target.value)}
            className="border-stage-edge bg-stage-panel w-full rounded-lg border px-3 py-2 focus:outline-none"
          >
            <option value="">Add a song…</option>
            {availableToAdd.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
                {s.artist ? ` — ${s.artist}` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => addSong(addingId)}
            disabled={!addingId}
            className="border-stage-edge bg-stage-panel shrink-0 rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Add
          </button>
        </div>
      ) : (
        allSongs.length === 0 && (
          <p className="text-stage-muted text-sm">
            Your library is empty.{' '}
            <Link to="/song/new" className="text-stage-accent">
              Add a song
            </Link>{' '}
            first.
          </p>
        )
      )}
    </div>
  );
}
