import { describe, expect, it } from 'vitest';
import { getChordShape } from './chordShapes';

describe('getChordShape', () => {
  it('returns the standard open shapes for common chords', () => {
    expect(getChordShape('G')).toEqual({ baseFret: 1, frets: [3, 2, 0, 0, 0, 3] });
    expect(getChordShape('C')).toEqual({ baseFret: 1, frets: [null, 3, 2, 0, 1, 0] });
    expect(getChordShape('Em')).toEqual({ baseFret: 1, frets: [0, 2, 2, 0, 0, 0] });
    expect(getChordShape('D7')).toEqual({ baseFret: 1, frets: [null, null, 0, 2, 1, 2] });
  });

  it('generates the standard E-form barre shape for F major (fret 1)', () => {
    expect(getChordShape('F')).toEqual({
      baseFret: 1,
      frets: [1, 3, 3, 2, 1, 1],
      barre: { fret: 1, fromString: 0, toString: 5 },
    });
  });

  it('generates the standard A-form barre shape for Bm (fret 2)', () => {
    expect(getChordShape('Bm')).toEqual({
      baseFret: 2,
      frets: [null, 2, 4, 4, 3, 2],
      barre: { fret: 2, fromString: 1, toString: 5 },
    });
  });

  it('picks whichever of the E-form/A-form barre is lower on the neck', () => {
    // G minor: E-form at fret 3 is lower than A-form at fret 10.
    const gm = getChordShape('Gm');
    expect(gm?.baseFret).toBe(3);
    expect(gm?.barre?.fromString).toBe(0);

    // C minor: A-form at fret 3 is lower than E-form at fret 8.
    const cm = getChordShape('Cm');
    expect(cm?.baseFret).toBe(3);
    expect(cm?.barre?.fromString).toBe(1);
  });

  it('respells flat roots to the equivalent sharp before generating a barre shape', () => {
    expect(getChordShape('Bb')).toEqual(getChordShape('A#'));
  });

  it('returns null for an unusual quality on a root with no open shape', () => {
    expect(getChordShape('Fadd9')).toBeNull();
    expect(getChordShape('F#dim')).toBeNull();
  });

  it('returns null when the chord has no parseable root', () => {
    expect(getChordShape('N.C.')).toBeNull();
    expect(getChordShape('%')).toBeNull();
  });

  it('ignores a slash-chord bass note and shapes the main chord', () => {
    expect(getChordShape('G/B')).toEqual(getChordShape('G'));
  });
});
