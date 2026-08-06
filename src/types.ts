export interface Song {
  id: string;
  title: string;
  artist: string;
  /** Genre/category, e.g. "Worship", "Hymn", "Rock". Empty if unset. Drives Library grouping. */
  style: string;
  /** Original key the chart was written in, e.g. "G", "Bb", "F#m". Empty if unknown. */
  originalKey: string;
  /** Beats per minute. 0/undefined means "not set" — auto-scroll falls back to a manual speed. */
  bpm: number;
  /** Capo fret the chart's chord shapes assume. 0 means no capo / not set. Purely informational. */
  capo: number;
  /** ChordPro-lite source text: inline [Chord] tokens, {directive: value} lines, blank-line spacing. */
  content: string;
  tags: string[];
  /** Semitone transpose offset last used for this song, remembered across sessions. */
  transpose: number;
  /** Auto-scroll speed for this song, in pixels/second. Persisted once the performer dials it in. */
  scrollSpeed: number;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export type NewSong = Omit<Song, 'id' | 'createdAt' | 'updatedAt' | 'transpose' | 'scrollSpeed' | 'favorite'> &
  Partial<Pick<Song, 'transpose' | 'scrollSpeed' | 'favorite'>>;

export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
  /** Free-text performance notes per song, keyed by song id (e.g. "capo 2", "key change for vocalist"). */
  notes: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export type PedalAction =
  | 'toggleScroll'
  | 'scrollFaster'
  | 'scrollSlower'
  | 'nextSong'
  | 'prevSong'
  | 'transposeUp'
  | 'transposeDown'
  | 'restart';

export const PEDAL_ACTIONS: { action: PedalAction; label: string }[] = [
  { action: 'toggleScroll', label: 'Play / pause auto-scroll' },
  { action: 'nextSong', label: 'Next song in setlist' },
  { action: 'prevSong', label: 'Previous song in setlist' },
  { action: 'scrollFaster', label: 'Speed up scroll' },
  { action: 'scrollSlower', label: 'Slow down scroll' },
  { action: 'transposeUp', label: 'Transpose up a semitone' },
  { action: 'transposeDown', label: 'Transpose down a semitone' },
  { action: 'restart', label: 'Restart scroll from top' },
];

/** Keyboard key names (KeyboardEvent.key / space alias) mapped to the pedal action they trigger. */
export type PedalKeyMap = Record<string, PedalAction>;

export type AccidentalPreference = 'sharp' | 'flat' | 'auto';

export type LibraryGrouping = 'title' | 'artist' | 'style';

export type Theme = 'dark' | 'light' | 'system';

export interface AppSettings {
  pedalKeyMap: PedalKeyMap;
  defaultFontSizePx: number;
  defaultScrollSpeed: number;
  accidentalPreference: AccidentalPreference;
  keepScreenAwake: boolean;
  autoAdvanceToNextInSetlist: boolean;
  libraryGrouping: LibraryGrouping;
  theme: Theme;
}

/** Common genres for the Style suggestion list; the editor also suggests whatever styles are already in use. */
export const STYLE_PRESETS: string[] = [
  'Worship',
  'Hymn',
  'Gospel',
  'Rock',
  'Pop',
  'Country',
  'Folk',
  'Blues',
  'Jazz',
  'R&B',
  'Christmas',
  'Original',
];
