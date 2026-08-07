import { describe, expect, it } from 'vitest';
import { toNashvilleContent, toNashvilleNumber } from './nashville';

describe('toNashvilleNumber', () => {
  it('maps the diatonic I-IV-V-vi chords in the key of G', () => {
    expect(toNashvilleNumber('G', 'G')).toBe('1');
    expect(toNashvilleNumber('C', 'G')).toBe('4');
    expect(toNashvilleNumber('D', 'G')).toBe('5');
    expect(toNashvilleNumber('Em', 'G')).toBe('6m');
  });

  it('preserves chord quality suffixes verbatim', () => {
    expect(toNashvilleNumber('G7', 'G')).toBe('17');
    expect(toNashvilleNumber('Cmaj7', 'G')).toBe('4maj7');
    expect(toNashvilleNumber('Dsus4', 'G')).toBe('5sus4');
    expect(toNashvilleNumber('Em7b5', 'G')).toBe('6m7b5');
  });

  it('numbers non-diatonic chords with accidentals', () => {
    expect(toNashvilleNumber('Bb', 'G')).toBe('b3');
    expect(toNashvilleNumber('Eb', 'G')).toBe('b6');
    expect(toNashvilleNumber('F', 'G')).toBe('b7');
    expect(toNashvilleNumber('C#', 'G')).toBe('#4');
  });

  it('transposes the slash-chord bass note too', () => {
    // In G major (G A B C D E F#): F# is degree 7, E is degree 6.
    expect(toNashvilleNumber('D/F#', 'G')).toBe('5/7');
    expect(toNashvilleNumber('C/E', 'G')).toBe('4/6');
  });

  it('is invariant under transposition when the key moves with it', () => {
    // A song transposed up 2 semitones (G -> A, D -> E) should read identically in numbers.
    expect(toNashvilleNumber('D', 'G')).toBe(toNashvilleNumber('E', 'A'));
    expect(toNashvilleNumber('Em7', 'G')).toBe(toNashvilleNumber('F#m7', 'A'));
  });

  it('works from a non-C key', () => {
    expect(toNashvilleNumber('Eb', 'Bb')).toBe('4');
    expect(toNashvilleNumber('F', 'Bb')).toBe('5');
    expect(toNashvilleNumber('Gm', 'Bb')).toBe('6m');
  });

  it('falls back to the original token when it cannot parse a root or key', () => {
    expect(toNashvilleNumber('N.C.', 'G')).toBe('N.C.');
    expect(toNashvilleNumber('%', 'G')).toBe('%');
    expect(toNashvilleNumber('G', '')).toBe('G');
  });
});

describe('toNashvilleContent', () => {
  it('converts every inline chord token and leaves lyrics untouched', () => {
    const content = '[G]Amazing [C]grace, how [D]sweet the [G]sound';
    expect(toNashvilleContent(content, 'G')).toBe('[1]Amazing [4]grace, how [5]sweet the [1]sound');
  });
});
