import { NOTE_RE, NOTE_TO_SEMITONE, normalizeAccidental } from './transpose';

export interface ChordShape {
  /** The fret shown at the top row of the diagram (1 = starts at the nut). */
  baseFret: number;
  /** One entry per string, low E to high e. null = muted (×), 0 = open, N = fretted at absolute fret N. */
  frets: (number | null)[];
  barre?: { fret: number; fromString: number; toString: number };
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Common open-position shapes, keyed by "<SharpRoot><quality>". Deliberately not
// exhaustive: covers the chords guitarists actually play open, in the most common
// gig keys (G/C/D/A/E and their relative minors/dominant-7s).
const OPEN_SHAPES: Record<string, ChordShape> = {
  E: { baseFret: 1, frets: [0, 2, 2, 1, 0, 0] },
  E7: { baseFret: 1, frets: [0, 2, 0, 1, 0, 0] },
  Em: { baseFret: 1, frets: [0, 2, 2, 0, 0, 0] },
  Em7: { baseFret: 1, frets: [0, 2, 0, 0, 0, 0] },
  Emaj7: { baseFret: 1, frets: [0, 2, 1, 1, 0, 0] },
  Esus4: { baseFret: 1, frets: [0, 2, 2, 2, 0, 0] },
  A: { baseFret: 1, frets: [null, 0, 2, 2, 2, 0] },
  A7: { baseFret: 1, frets: [null, 0, 2, 0, 2, 0] },
  Am: { baseFret: 1, frets: [null, 0, 2, 2, 1, 0] },
  Am7: { baseFret: 1, frets: [null, 0, 2, 0, 1, 0] },
  Amaj7: { baseFret: 1, frets: [null, 0, 2, 1, 2, 0] },
  Asus2: { baseFret: 1, frets: [null, 0, 2, 2, 0, 0] },
  Asus4: { baseFret: 1, frets: [null, 0, 2, 2, 3, 0] },
  D: { baseFret: 1, frets: [null, null, 0, 2, 3, 2] },
  D7: { baseFret: 1, frets: [null, null, 0, 2, 1, 2] },
  Dm: { baseFret: 1, frets: [null, null, 0, 2, 3, 1] },
  Dm7: { baseFret: 1, frets: [null, null, 0, 2, 1, 1] },
  Dmaj7: { baseFret: 1, frets: [null, null, 0, 2, 2, 2] },
  Dsus2: { baseFret: 1, frets: [null, null, 0, 2, 3, 0] },
  Dsus4: { baseFret: 1, frets: [null, null, 0, 2, 3, 3] },
  G: { baseFret: 1, frets: [3, 2, 0, 0, 0, 3] },
  G7: { baseFret: 1, frets: [3, 2, 0, 0, 0, 1] },
  Gmaj7: { baseFret: 1, frets: [3, 2, 0, 0, 0, 2] },
  Gsus4: { baseFret: 1, frets: [3, 3, 0, 0, 1, 3] },
  C: { baseFret: 1, frets: [null, 3, 2, 0, 1, 0] },
  C7: { baseFret: 1, frets: [null, 3, 2, 3, 1, 0] },
  Cmaj7: { baseFret: 1, frets: [null, 3, 2, 0, 0, 0] },
  Csus4: { baseFret: 1, frets: [null, 3, 3, 0, 1, 0] },
};

function barreShape(rootSemitone: number, quality: 'maj' | 'm' | '7'): ChordShape {
  const eFret = (rootSemitone - NOTE_TO_SEMITONE.E + 12) % 12;
  const aFret = (rootSemitone - NOTE_TO_SEMITONE.A + 12) % 12;
  const useE = eFret <= aFret;
  const f = useE ? eFret : aFret;

  if (useE) {
    if (quality === 'maj') return { baseFret: f, frets: [f, f + 2, f + 2, f + 1, f, f], barre: { fret: f, fromString: 0, toString: 5 } };
    if (quality === 'm') return { baseFret: f, frets: [f, f + 2, f + 2, f, f, f], barre: { fret: f, fromString: 0, toString: 5 } };
    return { baseFret: f, frets: [f, f + 2, f, f + 1, f, f], barre: { fret: f, fromString: 0, toString: 5 } };
  }
  if (quality === 'maj') return { baseFret: f, frets: [null, f, f + 2, f + 2, f + 2, f], barre: { fret: f, fromString: 1, toString: 5 } };
  if (quality === 'm') return { baseFret: f, frets: [null, f, f + 2, f + 2, f + 1, f], barre: { fret: f, fromString: 1, toString: 5 } };
  return { baseFret: f, frets: [null, f, f + 2, f, f + 2, f], barre: { fret: f, fromString: 1, toString: 5 } };
}

/**
 * Looks up (or, for plain major/minor/dominant-7 chords, generates a moveable
 * E-form/A-form barre-chord for) a guitar fingering diagram for a chord symbol.
 * Returns null when no confident shape is available — an unusual quality
 * (add9, dim, m7b5, ...) on a root with no open shape — rather than guess.
 */
export function getChordShape(chord: string): ChordShape | null {
  const slashIdx = chord.indexOf('/');
  const main = slashIdx === -1 ? chord : chord.slice(0, slashIdx);
  const match = NOTE_RE.exec(main);
  if (!match) return null;

  const root = match[1].toUpperCase();
  const accidental = normalizeAccidental(match[2]);
  const rootSemitone = NOTE_TO_SEMITONE[root + accidental];
  if (rootSemitone === undefined) return null;
  const quality = main.slice(match[0].length);

  const openKey = SHARP_NAMES[rootSemitone] + quality;
  if (OPEN_SHAPES[openKey]) return OPEN_SHAPES[openKey];

  if (quality === '') return barreShape(rootSemitone, 'maj');
  if (quality === 'm') return barreShape(rootSemitone, 'm');
  if (quality === '7') return barreShape(rootSemitone, '7');
  return null;
}
