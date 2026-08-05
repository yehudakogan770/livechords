import type { AccidentalPreference } from '../types';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

// A note token: root letter + optional accidental, e.g. "G", "F#", "Bb".
const NOTE_RE = /^([A-Ga-g])([#b♯♭]?)/;

function normalizeAccidental(raw: string): '' | '#' | 'b' {
  if (raw === '#' || raw === '♯') return '#';
  if (raw === 'b' || raw === '♭') return 'b';
  return '';
}

function respell(semitoneIdx: number, useFlat: boolean): string {
  const idx = ((semitoneIdx % 12) + 12) % 12;
  return useFlat ? FLAT_NAMES[idx] : SHARP_NAMES[idx];
}

/** Transposes a single note token (e.g. the bass note of a slash chord, or a bare key name). */
function transposeNote(note: string, semitones: number, useFlat: boolean): string | null {
  const match = NOTE_RE.exec(note);
  if (!match || match[0].length !== note.length) return null;
  const root = match[1].toUpperCase();
  const accidental = normalizeAccidental(match[2]);
  const semitoneIdx = NOTE_TO_SEMITONE[root + accidental];
  if (semitoneIdx === undefined) return null;
  return respell(semitoneIdx + semitones, useFlat);
}

/**
 * Transposes one chord symbol, preserving its quality/extension text verbatim
 * (m, 7, maj7, sus4, add9, m7b5, ...) and transposing a slash-chord bass note too.
 * Anything that doesn't start with a recognizable note letter (N.C., %, section
 * marks, typos) is returned unchanged.
 */
export function transposeChord(chord: string, semitones: number, pref: AccidentalPreference = 'auto'): string {
  if (semitones === 0) return chord;

  const slashIdx = chord.indexOf('/');
  const main = slashIdx === -1 ? chord : chord.slice(0, slashIdx);
  const bass = slashIdx === -1 ? null : chord.slice(slashIdx + 1);

  const match = NOTE_RE.exec(main);
  if (!match) return chord;

  const root = match[1].toUpperCase();
  const accidental = normalizeAccidental(match[2]);
  const quality = main.slice(match[0].length);
  const semitoneIdx = NOTE_TO_SEMITONE[root + accidental];
  if (semitoneIdx === undefined) return chord;

  const useFlat = pref === 'auto' ? accidental === 'b' : pref === 'flat';
  const newRoot = respell(semitoneIdx + semitones, useFlat);

  if (bass === null) return newRoot + quality;

  const newBass = transposeNote(bass, semitones, useFlat);
  return `${newRoot}${quality}/${newBass ?? bass}`;
}

const CHORD_TOKEN_RE = /\[([^\]\n]+)\]/g;

/** Transposes every inline [Chord] token in ChordPro-lite source text, leaving lyrics untouched. */
export function transposeContent(content: string, semitones: number, pref: AccidentalPreference = 'auto'): string {
  if (semitones === 0) return content;
  return content.replace(CHORD_TOKEN_RE, (_match, chord: string) => `[${transposeChord(chord, semitones, pref)}]`);
}

/** Human-readable "+N"/"-N" semitone label for a transpose offset, e.g. for a Stage View badge. */
export function formatTransposeOffset(semitones: number): string {
  if (semitones === 0) return '0';
  return semitones > 0 ? `+${semitones}` : `${semitones}`;
}
