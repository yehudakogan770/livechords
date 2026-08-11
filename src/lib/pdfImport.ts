import type { OcrLine, OcrWord } from './ocrReconstruct';
import { reconstructChordChart } from './ocrReconstruct';

export interface PdfImportProgress {
  status: string;
  progress: number;
}

/** Thrown when a PDF has no extractable text layer at all — i.e. it's a scanned image, not a digitally-authored chart. */
export class PdfNoTextLayerError extends Error {
  constructor() {
    super('This PDF has no selectable text — it looks like a scanned image rather than a digitally-created chart.');
    this.name = 'PdfNoTextLayerError';
  }
}

// Below this many characters on a page, treat it as having no real text layer
// (a handful of stray characters can come from a scanned page's metadata/artifacts).
const MIN_CHARS_FOR_TEXT_LAYER = 20;

export interface RawTextItem {
  text: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  hasEOL: boolean;
}

/**
 * Splits one PDF text run into word-level boxes, allocating its bounding box
 * proportionally by character position — pdf.js reports whole runs (often a
 * full line, or a run bounded by a font/color change), not individual words,
 * but reconstructChordChart operates word-by-word.
 */
export function distributeWords(item: RawTextItem): OcrWord[] {
  const totalChars = item.text.length || 1;
  const widthPerChar = (item.x1 - item.x0) / totalChars;
  const words: OcrWord[] = [];
  for (const match of item.text.matchAll(/\S+/g)) {
    const word = match[0];
    const start = match.index ?? 0;
    words.push({
      text: word,
      x0: item.x0 + start * widthPerChar,
      x1: item.x0 + (start + word.length) * widthPerChar,
      y0: item.y0,
      y1: item.y1,
    });
  }
  return words;
}

/** Groups text items into lines using pdf.js's own end-of-line signal, rather than re-inferring line breaks from position. */
export function groupItemsIntoLines(items: RawTextItem[]): OcrLine[] {
  const lines: OcrLine[] = [];
  let current: OcrWord[] = [];
  for (const item of items) {
    current.push(...distributeWords(item));
    if (item.hasEOL) {
      if (current.length > 0) lines.push({ words: current });
      current = [];
    }
  }
  if (current.length > 0) lines.push({ words: current });
  return lines;
}

/**
 * Extracts ChordPro-lite text from a PDF's embedded text layer (not OCR —
 * this reads the PDF's real, selectable text), reusing the same chord/lyric
 * line-pairing heuristic as the photo scanner. Works well for digitally
 * generated chart PDFs (ChordPro/OnSong/Planning Center/CCLI exports,
 * "print to PDF" charts); a scanned image PDF has no text layer to read and
 * throws PdfNoTextLayerError — use "Scan a photo" on a screenshot of it instead.
 */
export async function extractPdfChart(file: File | Blob, onProgress?: (p: PdfImportProgress) => void): Promise<string> {
  onProgress?.({ status: 'loading PDF', progress: 0 });
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  let anyWordsFound = false;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.({ status: `reading page ${pageNum} of ${pdf.numPages}`, progress: pageNum / pdf.numPages });
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const rawItems: RawTextItem[] = [];
    let totalChars = 0;
    for (const raw of textContent.items) {
      if (!('str' in raw)) continue;
      // An item can be an empty string yet still carry hasEOL:true — pdf.js sometimes
      // represents a line/paragraph boundary (e.g. after a block element) as a hollow
      // item like this. Keep it (distributeWords naturally yields zero words for empty
      // text) so groupItemsIntoLines still sees the line break instead of losing it.
      if (!raw.str.trim() && !raw.hasEOL) continue;
      totalChars += raw.str.length;
      const x0 = raw.transform[4];
      const x1 = x0 + (raw.width || 0);
      const yBaselinePdf = raw.transform[5];
      const height = raw.height || 10;
      // pdf.js coordinates have their origin at the bottom-left with Y increasing
      // upward; flip to top-left/Y-down to match what reconstructChordChart expects.
      rawItems.push({
        text: raw.str,
        x0,
        x1,
        y0: viewport.height - (yBaselinePdf + height),
        y1: viewport.height - yBaselinePdf,
        hasEOL: raw.hasEOL,
      });
    }

    if (totalChars < MIN_CHARS_FOR_TEXT_LAYER) continue;

    const lines = groupItemsIntoLines(rawItems);
    if (lines.length === 0) continue;
    anyWordsFound = true;

    const pageText = reconstructChordChart(lines);
    if (pageText.trim()) pageTexts.push(pageText);
  }

  if (!anyWordsFound) {
    throw new PdfNoTextLayerError();
  }

  return pageTexts.join('\n\n');
}
