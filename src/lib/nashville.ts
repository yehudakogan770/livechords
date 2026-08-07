import { CHORD_TOKEN_RE, NOTE_RE, NOTE_TO_SEMITONE, normalizeAccidental } from './transpose';

// Scale-degree numerals for each semitone offset from the key's tonic, using the
// spellings most Nashville Number System charts use for the non-diatonic degrees
// (b3/b6/b7 for borrowed chords, #4 for the tritone rather than b5).
const NUMERALS = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];

function keySemitone(key: string): number | null {
  const match = NOTE_RE.exec(key.trim());
  if (!match) return null;
  const root = match[1].toUpperCase();
  const accidental = normalizeAccidental(match[2]);
  return NOTE_TO_SEMITONE[root + accidental] ?? null;
}

/**
 * Converts one chord symbol to its Nashville Number System numeral relative to `key`.
 * The quality suffix (m, 7, sus4, maj7, ...) and any slash-bass note are preserved —
 * only the root letter becomes a scale-degree numeral. Falls back to the chord
 * unchanged if `key` or the chord's root can't be parsed (N.C., %, section marks, typos).
 */
export function toNashvilleNumber(chord: string, key: string): string {
  const tonic = keySemitone(key);
  if (tonic === null) return chord;

  const slashIdx = chord.indexOf('/');
  const main = slashIdx === -1 ? chord : chord.slice(0, slashIdx);
  const bass = slashIdx === -1 ? null : chord.slice(slashIdx + 1);

  const match = NOTE_RE.exec(main);
  if (!match) return chord;

  const root = match[1].toUpperCase();
  const accidental = normalizeAccidental(match[2]);
  const quality = main.slice(match[0].length);
  const rootSemitone = NOTE_TO_SEMITONE[root + accidental];
  if (rootSemitone === undefined) return chord;

  const numeral = NUMERALS[(((rootSemitone - tonic) % 12) + 12) % 12];
  if (bass === null) return numeral + quality;

  return `${numeral}${quality}/${toNashvilleNumber(bass, key)}`;
}

/** Converts every inline [Chord] token in ChordPro-lite source text to Nashville numbers. */
export function toNashvilleContent(content: string, key: string): string {
  return content.replace(CHORD_TOKEN_RE, (_match, chord: string) => `[${toNashvilleNumber(chord, key)}]`);
}
