import { describe, expect, it } from 'vitest';
import { parseSong, extractChords } from '../lib/chordpro';
import { sampleSongs } from './sampleSongs';

describe('sampleSongs', () => {
  it('produces at least one demo song', () => {
    expect(sampleSongs().length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = sampleSongs().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const song of sampleSongs()) {
    it(`"${song.title}" parses with no leftover bracket characters and at least one chord`, () => {
      const { lines } = parseSong(song.content);
      const lyricLines = lines.filter((l) => l.type === 'lyric');
      expect(lyricLines.length).toBeGreaterThan(0);
      for (const line of lyricLines) {
        for (const token of line.tokens) {
          expect(token.text).not.toContain('[');
          expect(token.text).not.toContain(']');
        }
      }
      expect(extractChords(song.content).length).toBeGreaterThan(0);
    });
  }
});
