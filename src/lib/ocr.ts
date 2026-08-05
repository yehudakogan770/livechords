import { createWorker } from 'tesseract.js';
import { reconstructChordChart, type OcrLine } from './ocrReconstruct';

export interface OcrProgress {
  status: string;
  progress: number;
}

interface TesseractWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

interface TesseractPage {
  blocks: Array<{
    paragraphs: Array<{
      lines: Array<{ words: TesseractWord[] }>;
    }>;
  }> | null;
}

function linesFromTesseractPage(page: TesseractPage): OcrLine[] {
  const lines: OcrLine[] = [];
  for (const block of page.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        lines.push({
          words: line.words.map((w) => ({
            text: w.text,
            x0: w.bbox.x0,
            y0: w.bbox.y0,
            x1: w.bbox.x1,
            y1: w.bbox.y1,
          })),
        });
      }
    }
  }
  return lines;
}

/**
 * Runs on-device OCR (via tesseract.js, downloaded from a CDN on first use
 * and cached by the browser afterward) and reconstructs approximate
 * ChordPro-lite text from the recognized chord/lyric line layout.
 */
export async function scanChordChartImage(image: File | Blob, onProgress?: (p: OcrProgress) => void): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: (m) => onProgress?.({ status: m.status, progress: m.progress }),
  });
  try {
    const { data } = await worker.recognize(image, {}, { blocks: true });
    const lines = linesFromTesseractPage(data as unknown as TesseractPage);
    return reconstructChordChart(lines);
  } finally {
    await worker.terminate();
  }
}
