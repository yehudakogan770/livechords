import { describe, expect, it } from 'vitest';
import { distributeWords, groupItemsIntoLines, type RawTextItem } from './pdfImport';

function item(text: string, x0: number, x1: number, y0 = 0, y1 = 10, hasEOL = false): RawTextItem {
  return { text, x0, x1, y0, y1, hasEOL };
}

describe('distributeWords', () => {
  it('splits a multi-word item into individually positioned words', () => {
    const words = distributeWords(item('Amazing grace', 0, 130));
    expect(words.map((w) => w.text)).toEqual(['Amazing', 'grace']);
  });

  it('orders word x-ranges left to right within the item bounds', () => {
    const words = distributeWords(item('foo bar baz', 100, 210));
    expect(words[0].x0).toBe(100);
    expect(words[words.length - 1].x1).toBeLessThanOrEqual(210);
    for (let i = 1; i < words.length; i++) {
      expect(words[i].x0).toBeGreaterThan(words[i - 1].x0);
    }
  });

  it('carries the item y-range through to every word', () => {
    const words = distributeWords(item('G Am F', 0, 60, 5, 15));
    for (const w of words) {
      expect(w.y0).toBe(5);
      expect(w.y1).toBe(15);
    }
  });

  it('returns one word for a single-word item', () => {
    const words = distributeWords(item('G7', 0, 20));
    expect(words).toHaveLength(1);
    expect(words[0]).toMatchObject({ text: 'G7', x0: 0, x1: 20 });
  });

  it('ignores extra whitespace between words', () => {
    const words = distributeWords(item('G    Am', 0, 70));
    expect(words.map((w) => w.text)).toEqual(['G', 'Am']);
  });
});

describe('groupItemsIntoLines', () => {
  it('groups consecutive items into one line until hasEOL', () => {
    const items = [item('G', 0, 20, 0, 10, false), item('Amazing grace', 25, 150, 0, 10, true)];
    const lines = groupItemsIntoLines(items);
    expect(lines).toHaveLength(1);
    expect(lines[0].words.map((w) => w.text)).toEqual(['G', 'Amazing', 'grace']);
  });

  it('starts a new line after each hasEOL item', () => {
    const items = [
      item('G   C', 0, 100, 0, 10, true),
      item('Amazing grace', 0, 130, 12, 22, true),
    ];
    const lines = groupItemsIntoLines(items);
    expect(lines).toHaveLength(2);
    expect(lines[0].words.map((w) => w.text)).toEqual(['G', 'C']);
    expect(lines[1].words.map((w) => w.text)).toEqual(['Amazing', 'grace']);
  });

  it('includes a trailing line with no explicit hasEOL at the end of the page', () => {
    const items = [item('Verse 1', 0, 60, 0, 10, false)];
    const lines = groupItemsIntoLines(items);
    expect(lines).toHaveLength(1);
    expect(lines[0].words.map((w) => w.text)).toEqual(['Verse', '1']);
  });

  it('returns no lines for an empty item list', () => {
    expect(groupItemsIntoLines([])).toEqual([]);
  });
});
