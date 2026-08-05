export interface Song {
  id: string;
  title: string;
  artist: string;
  /** Original key the chart was written in, e.g. "G", "Bb", "F#m". Empty if unknown. */
  originalKey: string;
  /** Beats per minute. 0/undefined means "not set" — auto-scroll falls back to a manual speed. */
  bpm: number;
  /** ChordPro-lite source text: inline [Chord] tokens, {directive: value} lines, blank-line spacing. */
  content: string;
  tags: string[];
  /** Semitone transpose offset last used for this song, remembered across sessions. */
  transpose: number;
  /** Auto-scroll speed for this song, in pixels/second. Persisted once the performer dials it in. */
  scrollSpeed: number;
  createdAt: number;
  updatedAt: number;
}

export type NewSong = Omit<Song, 'id' | 'createdAt' | 'updatedAt' | 'transpose' | 'scrollSpeed'> &
  Partial<Pick<Song, 'transpose' | 'scrollSpeed'>>;

export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
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

export interface AppSettings {
  pedalKeyMap: PedalKeyMap;
  defaultFontSizePx: number;
  defaultScrollSpeed: number;
  accidentalPreference: AccidentalPreference;
  keepScreenAwake: boolean;
  autoAdvanceToNextInSetlist: boolean;
}
