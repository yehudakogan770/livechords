import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { IconTrash } from '../components/icons';
import { createSetlist, deleteSetlist, getSetlists } from '../data/storage';
import type { Setlist } from '../types';

export default function SetlistsPage() {
  const [setlists, setSetlists] = useState<Setlist[]>(() => getSetlists());
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const setlist = createSetlist(name);
    setNewName('');
    navigate(`/setlists/${setlist.id}`);
  }

  function handleDelete(setlist: Setlist) {
    if (!window.confirm(`Delete setlist "${setlist.name}"?`)) return;
    deleteSetlist(setlist.id);
    setSetlists(getSetlists());
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Setlists</h1>

      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New setlist name…"
          className="border-stage-edge bg-stage-panel placeholder:text-stage-muted w-full rounded-lg border px-3 py-2 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-stage-accent text-stage-bg shrink-0 rounded-full px-4 py-2 text-sm font-semibold"
        >
          Create
        </button>
      </form>

      {setlists.length === 0 ? (
        <p className="text-stage-muted rounded-lg border border-dashed border-stage-edge px-4 py-10 text-center text-sm">
          No setlists yet. Group songs into a setlist to flow hands-free from one to the next on stage.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {setlists.map((setlist) => (
            <li
              key={setlist.id}
              className="border-stage-edge bg-stage-panel flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <button
                type="button"
                onClick={() => navigate(`/setlists/${setlist.id}`)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-medium">{setlist.name}</p>
                <p className="text-stage-muted text-sm">
                  {setlist.songIds.length} song{setlist.songIds.length === 1 ? '' : 's'}
                </p>
              </button>
              <button
                type="button"
                aria-label={`Delete ${setlist.name}`}
                onClick={() => handleDelete(setlist)}
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
