import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useConfirm } from '../components/ConfirmDialog';
import { IconPlay, IconPlus, IconSearch, IconStar, IconTrash, IconX } from '../components/icons';
import { useToast } from '../components/Toast';
import { deleteSong, getSetlist, getSetlists, getSettings, getSongs, saveSetlist, saveSettings, saveSong } from '../data/storage';
import type { LibraryGrouping, Setlist, Song } from '../types';

const UNKNOWN_ARTIST = 'Unknown Artist';
const NO_STYLE = 'No Style';

type SortBy = 'title' | 'recent' | 'updated';

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

function sortSongs(songs: Song[], sortBy: SortBy): Song[] {
  const copy = [...songs];
  if (sortBy === 'recent') return copy.sort((a, b) => b.createdAt - a.createdAt);
  if (sortBy === 'updated') return copy.sort((a, b) => b.updatedAt - a.updatedAt);
  return copy.sort((a, b) => a.title.localeCompare(b.title));
}

const SONG_GRID_CLASS = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';

export default function LibraryPage() {
  const [songs, setSongs] = useState<Song[]>(() => getSongs());
  const [setlists] = useState<Setlist[]>(() => getSetlists());
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('title');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [settings, setSettings] = useState(getSettings);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStyle, setBulkStyle] = useState('');
  const [bulkSetlistId, setBulkSetlistId] = useState('');
  const navigate = useNavigate();
  const confirm = useConfirm();
  const showToast = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = songs;
    if (favoritesOnly) list = list.filter((s) => s.favorite);
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.style.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return sortSongs(list, sortBy);
  }, [songs, query, favoritesOnly, sortBy]);

  const groups = useMemo(() => groupSongs(filtered, settings.libraryGrouping), [filtered, settings.libraryGrouping]);

  function refresh() {
    setSongs(getSongs());
  }

  async function handleDelete(song: Song) {
    const ok = await confirm(`Delete "${song.title}"? This can't be undone.`, { danger: true, confirmLabel: 'Delete' });
    if (!ok) return;
    deleteSong(song.id);
    refresh();
  }

  function toggleFavorite(song: Song) {
    saveSong({ ...song, favorite: !song.favorite });
    refresh();
  }

  function handleGroupingChange(grouping: LibraryGrouping) {
    const next = { ...settings, libraryGrouping: grouping };
    saveSettings(next);
    setSettings(next);
  }

  function toggleSelectMode() {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    const n = selectedIds.size;
    const ok = await confirm(`Delete ${n} song${n === 1 ? '' : 's'}? This can't be undone.`, {
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    for (const id of selectedIds) deleteSong(id);
    showToast(`Deleted ${n} song${n === 1 ? '' : 's'}`);
    setSelectedIds(new Set());
    refresh();
  }

  function handleBulkStyle() {
    const style = bulkStyle.trim();
    if (!style || selectedIds.size === 0) return;
    for (const id of selectedIds) {
      const song = songs.find((s) => s.id === id);
      if (song) saveSong({ ...song, style });
    }
    showToast(`Set style "${style}" on ${selectedIds.size} song${selectedIds.size === 1 ? '' : 's'}`);
    setBulkStyle('');
    refresh();
  }

  function handleBulkAddToSetlist() {
    if (!bulkSetlistId || selectedIds.size === 0) return;
    const setlist = getSetlist(bulkSetlistId);
    if (!setlist) return;
    const merged = [...new Set([...setlist.songIds, ...selectedIds])];
    saveSetlist({ ...setlist, songIds: merged });
    showToast(`Added ${selectedIds.size} song${selectedIds.size === 1 ? '' : 's'} to "${setlist.name}"`);
    setBulkSetlistId('');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          Song Library <span className="text-stage-muted text-base font-normal">({songs.length})</span>
        </h1>
        <div className="flex items-center gap-2">
          {songs.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectMode}
              className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                selectMode ? 'bg-stage-accent text-stage-bg border-stage-accent' : 'border-stage-edge text-stage-muted'
              }`}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          )}
          <Link
            to="/song/new"
            className="bg-stage-accent text-stage-bg flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold"
          >
            <IconPlus className="h-4 w-4" />
            New Song
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:min-w-[12rem] sm:flex-1">
          <IconSearch className="text-stage-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, artist, style, or tag…"
            className="border-stage-edge bg-stage-panel placeholder:text-stage-muted w-full rounded-lg border py-2 pr-3 pl-9 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="text-stage-muted absolute top-1/2 right-2 -translate-y-1/2"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setFavoritesOnly((v) => !v)}
          aria-pressed={favoritesOnly}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium ${
            favoritesOnly ? 'border-stage-chord text-stage-chord' : 'border-stage-edge text-stage-muted'
          }`}
        >
          <IconStar className="h-4 w-4" filled={favoritesOnly} />
          Favorites
        </button>
        <label className="flex shrink-0 items-center gap-2 text-sm">
          <span className="text-stage-muted whitespace-nowrap">Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="border-stage-edge bg-stage-panel rounded-lg border px-3 py-2 focus:outline-none"
          >
            <option value="title">Title (A–Z)</option>
            <option value="recent">Recently added</option>
            <option value="updated">Recently updated</option>
          </select>
        </label>
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

      {selectMode && (
        <div className="border-stage-edge bg-stage-panel mb-4 flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set(filtered.map((s) => s.id)))}
            className="text-stage-accent text-xs font-medium"
          >
            Select all ({filtered.length})
          </button>
          {selectedIds.size > 0 && (
            <>
              <div className="flex items-center gap-1">
                <input
                  value={bulkStyle}
                  onChange={(e) => setBulkStyle(e.target.value)}
                  placeholder="Set style…"
                  className="border-stage-edge bg-stage-bg w-28 rounded-lg border px-2 py-1.5 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleBulkStyle}
                  disabled={!bulkStyle.trim()}
                  className="border-stage-edge rounded-lg border px-2 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
              {setlists.length > 0 && (
                <div className="flex items-center gap-1">
                  <select
                    value={bulkSetlistId}
                    onChange={(e) => setBulkSetlistId(e.target.value)}
                    className="border-stage-edge bg-stage-bg rounded-lg border px-2 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="">Add to setlist…</option>
                    {setlists.map((sl) => (
                      <option key={sl.id} value={sl.id}>
                        {sl.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleBulkAddToSetlist}
                    disabled={!bulkSetlistId}
                    className="border-stage-edge rounded-lg border px-2 py-1.5 text-xs font-semibold disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={handleBulkDelete}
                className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-400"
              >
                <IconTrash className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border-stage-edge rounded-lg border border-dashed px-4 py-16 text-center">
          {songs.length === 0 ? (
            <>
              <p className="text-stage-text mb-1 font-medium">Your library is empty</p>
              <p className="text-stage-muted mb-4 text-sm">Add your first chart to get started.</p>
              <Link
                to="/song/new"
                className="bg-stage-accent text-stage-bg inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold"
              >
                <IconPlus className="h-4 w-4" />
                New Song
              </Link>
            </>
          ) : (
            <>
              <p className="text-stage-text mb-1 font-medium">No matches</p>
              <p className="text-stage-muted mb-4 text-sm">
                {favoritesOnly && !query
                  ? 'No favorites yet — tap the star on a song to pin it here.'
                  : `Nothing matches "${query}".`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setFavoritesOnly(false);
                }}
                className="border-stage-edge text-stage-muted rounded-full border px-4 py-2 text-sm font-semibold"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
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
                    className={`border-stage-edge bg-stage-panel flex items-center gap-2 rounded-lg border px-3 py-2 ${
                      selectMode && selectedIds.has(song.id) ? 'ring-stage-accent ring-2' : ''
                    }`}
                  >
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(song.id)}
                        onChange={() => toggleSelected(song.id)}
                        aria-label={`Select ${song.title}`}
                        className="h-5 w-5 shrink-0"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => (selectMode ? toggleSelected(song.id) : navigate(`/song/${song.id}/edit`))}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="flex items-center gap-1.5 truncate font-medium">
                        {song.favorite && <IconStar className="text-stage-chord h-3.5 w-3.5 shrink-0" filled />}
                        <span className="truncate">{song.title}</span>
                      </p>
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
                    {!selectMode && (
                      <>
                        <button
                          type="button"
                          aria-label={song.favorite ? `Unfavorite ${song.title}` : `Favorite ${song.title}`}
                          onClick={() => toggleFavorite(song)}
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            song.favorite ? 'text-stage-chord' : 'text-stage-muted hover:text-stage-chord'
                          }`}
                        >
                          <IconStar className="h-4 w-4" filled={song.favorite} />
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
                      </>
                    )}
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
