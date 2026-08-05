import { describe, expect, it } from 'vitest';
import { formatTransposeOffset, transposeChord, transposeContent } from './transpose';

describe('transposeChord', () => {
  it('transposes a plain major chord up', () => {
    expect(transposeChord('G', 2)).toBe('A');
  });

  it('transposes a plain major chord down', () => {
    expect(transposeChord('A', -2)).toBe('G');
  });

  it('wraps upward across B -> C', () => {
    expect(transposeChord('B', 1)).toBe('C');
  });

  it('wraps downward across C -> B', () => {
    expect(transposeChord('C', -1)).toBe('B');
  });

  it('handles the E -> F and F -> E natural half-steps', () => {
    expect(transposeChord('E', 1)).toBe('F');
    expect(transposeChord('F', -1)).toBe('E');
  });

  it('preserves chord quality/extension text', () => {
    expect(transposeChord('Am7', 2)).toBe('Bm7');
    expect(transposeChord('Csus4', 2)).toBe('Dsus4');
    expect(transposeChord('Emaj7', 1)).toBe('Fmaj7');
    expect(transposeChord('F#m7b5', 1)).toBe('Gm7b5');
    expect(transposeChord('Badd9', 1)).toBe('Cadd9');
  });

  it('transposes the bass note of a slash chord along with the root', () => {
    expect(transposeChord('G/B', 2)).toBe('A/C#');
    expect(transposeChord('D/F#', -2)).toBe('C/E');
  });

  it('defaults to sharp spelling for naturals with no accidental hint', () => {
    expect(transposeChord('G', 1)).toBe('G#');
  });

  it('auto preference keeps flat-spelled chords flat after transposing', () => {
    expect(transposeChord('Bb', 2)).toBe('C');
    expect(transposeChord('Eb', 1)).toBe('E');
    expect(transposeChord('Ab', 2)).toBe('Bb');
  });

  it('honors an explicit sharp/flat preference override', () => {
    expect(transposeChord('Bb', 12, 'sharp')).toBe('A#');
    expect(transposeChord('G', 13, 'flat')).toBe('Ab');
  });

  it('is a fixed point under a full octave shift, preserving original spelling', () => {
    for (const chord of ['C', 'F#', 'Db', 'Am7', 'Bb', 'G/B', 'D/F#']) {
      expect(transposeChord(chord, 12)).toBe(chord);
      expect(transposeChord(chord, -12)).toBe(chord);
    }
  });

  it('returns non-chord tokens unchanged', () => {
    expect(transposeChord('N.C.', 2)).toBe('N.C.');
    expect(transposeChord('%', 2)).toBe('%');
  });

  it('leaves an unrecognized slash-bass note unchanged but still transposes the root', () => {
    expect(transposeChord('G/X', 2)).toBe('A/X');
  });

  it('is a no-op (returns the exact original string) when semitones is 0', () => {
    expect(transposeChord('Bb', 0)).toBe('Bb');
  });

  it('is case-insensitive on the root letter', () => {
    expect(transposeChord('g', 2)).toBe('A');
  });
});

describe('transposeContent', () => {
  it('transposes every inline chord token and leaves lyrics/directives untouched', () => {
    const input = '{title: Foo}\n[G]Amazing [C]grace how [G]sweet';
    const expected = '{title: Foo}\n[A]Amazing [D]grace how [A]sweet';
    expect(transposeContent(input, 2)).toBe(expected);
  });

  it('is a no-op when semitones is 0', () => {
    const input = '[G]Amazing [C]grace';
    expect(transposeContent(input, 0)).toBe(input);
  });
});

describe('formatTransposeOffset', () => {
  it('formats zero, positive, and negative offsets', () => {
    expect(formatTransposeOffset(0)).toBe('0');
    expect(formatTransposeOffset(2)).toBe('+2');
    expect(formatTransposeOffset(-3)).toBe('-3');
  });
});
