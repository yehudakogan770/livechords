/**
 * Reconstructs ChordPro-lite text from OCR word positions. Chord charts have
 * a 2D structure plain OCR text output loses — a chord line sitting directly
 * above the lyric line it applies to — so we classify each recognized line
 * as a chord line, a section label, or lyric text, then re-pair a chord line
 * with the lyric line beneath it by matching each chord's horizontal
 * position to the nearest word below it. This is a heuristic, not a
 * guarantee: skewed photos, unusual fonts, or dense multi-chord lines can
 * throw off the x-position matching, so results need a human review pass.
 */

export interface OcrWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrLine {
  words: OcrWord[];
}

// Chord roots are always capitalized on a printed/handwritten chart, which
// conveniently disambiguates real chords from short lowercase English words
// ("am", "a", "in") that would otherwise false-positive as chord tokens.
const CHORD_WORD_RE = /^([A-G][#b]?(maj|min|dim|aug|sus|add|m)?[0-9]*(\/[A-G][#b]?)?|N\.?C\.?|%)$/;

const SECTION_WORD_COUNT_LIMIT = 4;
const SECTION_RE =
  /^(intro|verse|chorus|pre-?chorus|bridge|outro|interlude|refrain|tag|ending|coda|instrumental)\b/i;

const BLANK_LINE_GAP_RATIO = 1.6;

type LineKind = 'chord' | 'section' | 'text';

interface LineBounds {
  y0: number;
  y1: number;
  yCenter: number;
}

function lineBounds(line: OcrLine): LineBounds {
  const y0 = Math.min(...line.words.map((w) => w.y0));
  const y1 = Math.max(...line.words.map((w) => w.y1));
  return { y0, y1, yCenter: (y0 + y1) / 2 };
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function classifyLine(words: OcrWord[]): LineKind {
  const joined = words.map((w) => w.text).join(' ');
  if (words.length <= SECTION_WORD_COUNT_LIMIT && SECTION_RE.test(joined)) {
    return 'section';
  }
  const chordLike = words.filter((w) => CHORD_WORD_RE.test(w.text)).length;
  const nonChord = words.length - chordLike;
  // Tolerate one OCR misread on longer chord lines; short lines must match fully
  // so an ordinary short lyric line doesn't get misread as an instrumental line.
  const isChordLine = words.length >= 4 ? nonChord <= 1 : nonChord === 0;
  return isChordLine ? 'chord' : 'text';
}

/** Places each chord immediately before the lyric word closest to its horizontal position. */
function mergeChordAndLyricLine(chordWords: OcrWord[], textWords: OcrWord[]): string {
  const sortedChords = [...chordWords].sort((a, b) => a.x0 - b.x0);
  const sortedText = [...textWords].sort((a, b) => a.x0 - b.x0);

  const chordsBeforeIndex = new Map<number, string[]>();
  const trailingChords: string[] = [];

  for (const chord of sortedChords) {
    const insertIndex = sortedText.findIndex((w) => w.x0 >= chord.x0);
    if (insertIndex === -1) {
      trailingChords.push(chord.text);
    } else {
      const list = chordsBeforeIndex.get(insertIndex) ?? [];
      list.push(chord.text);
      chordsBeforeIndex.set(insertIndex, list);
    }
  }

  let result = '';
  sortedText.forEach((word, idx) => {
    if (idx > 0) result += ' ';
    const chordsHere = chordsBeforeIndex.get(idx);
    if (chordsHere) result += chordsHere.map((c) => `[${c}]`).join('');
    result += word.text;
  });
  if (trailingChords.length > 0) {
    result += ' ' + trailingChords.map((c) => `[${c}]`).join(' ');
  }

  return result;
}

export function reconstructChordChart(ocrLines: OcrLine[]): string {
  const lines = ocrLines
    .map((l) => ({ words: l.words.filter((w) => w.text.trim() !== '') }))
    .filter((l) => l.words.length > 0);

  if (lines.length === 0) return '';

  const bounds = lines.map(lineBounds);
  const pitches: number[] = [];
  for (let i = 1; i < bounds.length; i++) {
    pitches.push(bounds[i].yCenter - bounds[i - 1].yCenter);
  }
  const medianPitch = median(pitches) || 1;

  const kinds = lines.map((l) => classifyLine(l.words));
  const outputLines: string[] = [];

  let i = 0;
  while (i < lines.length) {
    if (i > 0) {
      const gap = bounds[i].yCenter - bounds[i - 1].yCenter;
      if (gap > medianPitch * BLANK_LINE_GAP_RATIO) outputLines.push('');
    }

    if (kinds[i] === 'section') {
      outputLines.push(`{c: ${lines[i].words.map((w) => w.text).join(' ')}}`);
      i += 1;
      continue;
    }

    if (kinds[i] === 'chord' && i + 1 < lines.length && kinds[i + 1] === 'text') {
      outputLines.push(mergeChordAndLyricLine(lines[i].words, lines[i + 1].words));
      i += 2;
      continue;
    }

    if (kinds[i] === 'chord') {
      outputLines.push(lines[i].words.map((w) => `[${w.text}]`).join(' '));
      i += 1;
      continue;
    }

    outputLines.push(lines[i].words.map((w) => w.text).join(' '));
    i += 1;
  }

  return outputLines.join('\n');
}
