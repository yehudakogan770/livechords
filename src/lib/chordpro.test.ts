import { describe, expect, it } from 'vitest';
import { extractChords, parseSong } from './chordpro';

describe('parseSong', () => {
  it('splits an inline-chord lyric line into chord/text tokens', () => {
    const { lines } = parseSong('[G]Amazing [C]grace how [G]sweet the sound');
    expect(lines).toEqual([
      {
        type: 'lyric',
        tokens: [
          { chord: 'G', text: 'Amazing ' },
          { chord: 'C', text: 'grace how ' },
          { chord: 'G', text: 'sweet the sound' },
        ],
      },
    ]);
  });

  it('keeps a leading lyric segment before the first chord', () => {
    const { lines } = parseSong('And [C]grace my fears relieved');
    expect(lines).toEqual([
      {
        type: 'lyric',
        tokens: [
          { chord: null, text: 'And ' },
          { chord: 'C', text: 'grace my fears relieved' },
        ],
      },
    ]);
  });

  it('passes through a plain lyric line with no chords', () => {
    const { lines } = parseSong('How sweet the sound');
    expect(lines).toEqual([{ type: 'lyric', tokens: [{ chord: null, text: 'How sweet the sound' }] }]);
  });

  it('handles a chord-only instrumental line', () => {
    const { lines } = parseSong('[G] [C] [D] [G]');
    expect(lines).toEqual([
      {
        type: 'lyric',
        tokens: [
          { chord: 'G', text: ' ' },
          { chord: 'C', text: ' ' },
          { chord: 'D', text: ' ' },
          { chord: 'G', text: '' },
        ],
      },
    ]);
  });

  it('trims whitespace inside chord brackets', () => {
    const { lines } = parseSong('[ Am7 ]Hello');
    expect(lines).toEqual([{ type: 'lyric', tokens: [{ chord: 'Am7', text: 'Hello' }] }]);
  });

  it('emits a blank line as a spacer', () => {
    const { lines } = parseSong('[G]Line one\n\n[C]Line two');
    expect(lines).toEqual([
      { type: 'lyric', tokens: [{ chord: 'G', text: 'Line one' }] },
      { type: 'blank' },
      { type: 'lyric', tokens: [{ chord: 'C', text: 'Line two' }] },
    ]);
  });

  it('extracts title/artist/key/tempo/capo meta directives and their aliases', () => {
    const { meta } = parseSong(
      ['{title: Amazing Grace}', '{artist: Traditional}', '{key: G}', '{tempo: 72}', '{capo: 2}'].join('\n'),
    );
    expect(meta).toEqual({ title: 'Amazing Grace', artist: 'Traditional', key: 'G', bpm: 72, capo: 2 });
  });

  it('supports the {t:}/{st:}/{bpm:} short aliases', () => {
    const { meta } = parseSong(['{t: Foo}', '{st: Bar}', '{bpm: 100}'].join('\n'));
    expect(meta).toEqual({ title: 'Foo', artist: 'Bar', bpm: 100 });
  });

  it('turns {comment:}/{c:} into a section label line', () => {
    const { lines } = parseSong('{c: Verse 1}\n[G]Test');
    expect(lines[0]).toEqual({ type: 'section', label: 'Verse 1' });
  });

  it('turns {start_of_chorus}/{soc} into a "Chorus" section, and drops the matching end marker', () => {
    const { lines } = parseSong('{start_of_chorus}\n[G]Praise\n{eoc}\n[C]Next');
    expect(lines).toEqual([
      { type: 'section', label: 'Chorus' },
      { type: 'lyric', tokens: [{ chord: 'G', text: 'Praise' }] },
      { type: 'lyric', tokens: [{ chord: 'C', text: 'Next' }] },
    ]);
  });

  it('lets a custom label override the default section name', () => {
    const { lines } = parseSong('{sov: Verse 2}\n[G]Test');
    expect(lines[0]).toEqual({ type: 'section', label: 'Verse 2' });
  });

  it('silently ignores unrecognized directives instead of rendering or throwing', () => {
    const { lines, meta } = parseSong('{random_directive: whatever}\n[G]Test');
    expect(lines).toEqual([{ type: 'lyric', tokens: [{ chord: 'G', text: 'Test' }] }]);
    expect(meta).toEqual({});
  });

  it('does not choke on malformed brackets', () => {
    expect(() => parseSong('[G Amazing grace')).not.toThrow();
  });
});

describe('extractChords', () => {
  it('returns unique chords in first-appearance order', () => {
    expect(extractChords('[G]Amazing [C]grace [G]how [D]sweet [C]the sound')).toEqual(['G', 'C', 'D']);
  });

  it('returns an empty array for a chordless lyric', () => {
    expect(extractChords('just words')).toEqual([]);
  });
});
