import type { AppSettings, NewSong, Setlist, Song } from '../types';
import { estimateScrollSpeed } from '../lib/scrollSpeed';
import { sampleSongs } from './sampleSongs';

const KEYS = {
  songs: 'livechords:songs',
  setlists: 'livechords:setlists',
  settings: 'livechords:settings',
  seeded: 'livechords:seeded',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  pedalKeyMap: {
    ' ': 'toggleScroll',
    ArrowDown: 'toggleScroll',
    ArrowUp: 'restart',
    ArrowRight: 'nextSong',
    ArrowLeft: 'prevSong',
    PageDown: 'nextSong',
    PageUp: 'prevSong',
  },
  defaultFontSizePx: 32,
  defaultScrollSpeed: 28,
  accidentalPreference: 'auto',
  keepScreenAwake: true,
  autoAdvanceToNextInSetlist: true,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureSeeded(): void {
  if (readJson(KEYS.seeded, false)) return;
  const existing = readJson<Song[]>(KEYS.songs, []);
  if (existing.length === 0) {
    writeJson(KEYS.songs, sampleSongs());
  }
  writeJson(KEYS.seeded, true);
}

export function getSongs(): Song[] {
  ensureSeeded();
  return readJson<Song[]>(KEYS.songs, []).sort((a, b) => a.title.localeCompare(b.title));
}

export function getSong(id: string): Song | undefined {
  return getSongs().find((s) => s.id === id);
}

export function createSong(input: NewSong): Song {
  const now = Date.now();
  const settings = getSettings();
  const scrollSpeed =
    input.scrollSpeed ??
    (input.bpm > 0 ? estimateScrollSpeed(input.bpm, settings.defaultFontSizePx) : settings.defaultScrollSpeed);
  const song: Song = {
    id: newId(),
    title: input.title,
    artist: input.artist,
    originalKey: input.originalKey,
    bpm: input.bpm,
    content: input.content,
    tags: input.tags,
    transpose: input.transpose ?? 0,
    scrollSpeed,
    createdAt: now,
    updatedAt: now,
  };
  const songs = readJson<Song[]>(KEYS.songs, []);
  songs.push(song);
  writeJson(KEYS.songs, songs);
  return song;
}

export function saveSong(song: Song): void {
  const songs = readJson<Song[]>(KEYS.songs, []);
  const idx = songs.findIndex((s) => s.id === song.id);
  const updated = { ...song, updatedAt: Date.now() };
  if (idx === -1) {
    songs.push(updated);
  } else {
    songs[idx] = updated;
  }
  writeJson(KEYS.songs, songs);
}

export function deleteSong(id: string): void {
  const songs = readJson<Song[]>(KEYS.songs, []).filter((s) => s.id !== id);
  writeJson(KEYS.songs, songs);
  const setlists = readJson<Setlist[]>(KEYS.setlists, []).map((sl) => ({
    ...sl,
    songIds: sl.songIds.filter((sid) => sid !== id),
  }));
  writeJson(KEYS.setlists, setlists);
}

export function getSetlists(): Setlist[] {
  return readJson<Setlist[]>(KEYS.setlists, []).sort((a, b) => a.name.localeCompare(b.name));
}

export function getSetlist(id: string): Setlist | undefined {
  return getSetlists().find((s) => s.id === id);
}

export function createSetlist(name: string): Setlist {
  const now = Date.now();
  const setlist: Setlist = { id: newId(), name, songIds: [], createdAt: now, updatedAt: now };
  const setlists = readJson<Setlist[]>(KEYS.setlists, []);
  setlists.push(setlist);
  writeJson(KEYS.setlists, setlists);
  return setlist;
}

export function saveSetlist(setlist: Setlist): void {
  const setlists = readJson<Setlist[]>(KEYS.setlists, []);
  const idx = setlists.findIndex((s) => s.id === setlist.id);
  const updated = { ...setlist, updatedAt: Date.now() };
  if (idx === -1) {
    setlists.push(updated);
  } else {
    setlists[idx] = updated;
  }
  writeJson(KEYS.setlists, setlists);
}

export function deleteSetlist(id: string): void {
  const setlists = readJson<Setlist[]>(KEYS.setlists, []).filter((s) => s.id !== id);
  writeJson(KEYS.setlists, setlists);
}

export function getSettings(): AppSettings {
  const stored = readJson<Partial<AppSettings>>(KEYS.settings, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    pedalKeyMap: { ...DEFAULT_SETTINGS.pedalKeyMap, ...stored.pedalKeyMap },
  };
}

export function saveSettings(settings: AppSettings): void {
  writeJson(KEYS.settings, settings);
}

export interface BackupBundle {
  version: 1;
  exportedAt: number;
  songs: Song[];
  setlists: Setlist[];
  settings: AppSettings;
}

export function exportBackup(): BackupBundle {
  return {
    version: 1,
    exportedAt: Date.now(),
    songs: getSongs(),
    setlists: getSetlists(),
    settings: getSettings(),
  };
}

export function importBackup(bundle: BackupBundle): void {
  if (!bundle || bundle.version !== 1) {
    throw new Error('Unrecognized backup file.');
  }
  writeJson(KEYS.songs, bundle.songs);
  writeJson(KEYS.setlists, bundle.setlists);
  writeJson(KEYS.settings, bundle.settings);
  writeJson(KEYS.seeded, true);
}
