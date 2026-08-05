import { describe, expect, it } from 'vitest';
import { reconstructChordChart, type OcrLine, type OcrWord } from './ocrReconstruct';

function w(text: string, x0: number, x1: number, y0: number, y1: number): OcrWord {
  return { text, x0, x1, y0, y1 };
}

function line(...words: OcrWord[]): OcrLine {
  return { words };
}

describe('reconstructChordChart', () => {
  it('pairs a chord line with the lyric line below it, aligned by x-position', () => {
    const lines = [
      line(w('G', 10, 30, 0, 20), w('C', 150, 170, 0, 20)),
      line(w('Amazing', 10, 90, 25, 45), w('grace', 150, 200, 25, 45)),
    ];
    expect(reconstructChordChart(lines)).toBe('[G]Amazing [C]grace');
  });

  it('handles a chord positioned after the last lyric word (trailing chord)', () => {
    const lines = [
      line(w('G', 10, 30, 0, 20), w('D', 400, 420, 0, 20)),
      line(w('Home', 10, 60, 25, 45)),
    ];
    expect(reconstructChordChart(lines)).toBe('[G]Home [D]');
  });

  it('reconstructs a full verse line matching the classic Amazing Grace phrase', () => {
    const lines = [
      line(w('G', 10, 30, 0, 20), w('G7', 165, 195, 0, 20), w('C', 210, 230, 0, 20), w('G', 310, 330, 0, 20)),
      line(
        w('Amazing', 10, 90, 25, 45),
        w('grace,', 100, 155, 25, 45),
        w('how', 165, 200, 25, 45),
        w('sweet', 210, 260, 25, 45),
        w('the', 270, 300, 25, 45),
        w('sound', 310, 370, 25, 45),
      ),
    ];
    expect(reconstructChordChart(lines)).toBe('[G]Amazing grace, [G7]how [C]sweet the [G]sound');
  });

  it('emits a standalone chord line as an instrumental line when no lyric line follows', () => {
    const lines = [line(w('G', 10, 30, 0, 20), w('C', 150, 170, 0, 20), w('D', 290, 310, 0, 20))];
    expect(reconstructChordChart(lines)).toBe('[G] [C] [D]');
  });

  it('emits two consecutive chord lines as separate instrumental lines', () => {
    const lines = [
      line(w('G', 10, 30, 0, 20), w('C', 150, 170, 0, 20)),
      line(w('Em', 10, 40, 25, 45), w('D', 150, 170, 25, 45)),
    ];
    expect(reconstructChordChart(lines)).toBe('[G] [C]\n[Em] [D]');
  });

  it('passes through a lyric line with no chord line above it', () => {
    const lines = [line(w('Traditional', 10, 100, 0, 20))];
    expect(reconstructChordChart(lines)).toBe('Traditional');
  });

  it('recognizes common section labels as {c: ...} directives', () => {
    const lines = [line(w('Chorus', 10, 80, 0, 20))];
    expect(reconstructChordChart(lines)).toBe('{c: Chorus}');
  });

  it('recognizes a multi-word section label like "Verse 1"', () => {
    const lines = [line(w('Verse', 10, 60, 0, 20), w('1', 70, 80, 0, 20))];
    expect(reconstructChordChart(lines)).toBe('{c: Verse 1}');
  });

  it('does not classify a short two-word lyric line as a chord line', () => {
    const lines = [line(w('I', 10, 20, 0, 20), w('see', 30, 60, 0, 20))];
    expect(reconstructChordChart(lines)).toBe('I see');
  });

  it('tolerates a single OCR misread on a longer chord line (4+ words)', () => {
    // "Arn" is a plausible OCR misread of "Am" but the line is still clearly a chord line.
    const lines = [
      line(
        w('G', 10, 30, 0, 20),
        w('Arn', 150, 180, 0, 20),
        w('C', 290, 310, 0, 20),
        w('D', 400, 420, 0, 20),
      ),
      line(
        w('Test', 10, 60, 25, 45),
        w('one', 150, 190, 25, 45),
        w('two', 290, 330, 25, 45),
        w('three', 400, 460, 25, 45),
      ),
    ];
    expect(reconstructChordChart(lines)).toBe('[G]Test [Arn]one [C]two [D]three');
  });

  it('inserts a blank line where the vertical gap between lines is much larger than the typical line pitch', () => {
    const lines = [
      line(w('G', 10, 30, 0, 20)),
      line(w('Amazing', 10, 90, 25, 45)),
      // Big paragraph gap before the next section (typical pitch here is ~25px, this gap is ~90px).
      line(w('Chorus', 10, 80, 135, 155)),
    ];
    expect(reconstructChordChart(lines)).toBe('[G]Amazing\n\n{c: Chorus}');
  });

  it('filters out empty/whitespace-only words and lines', () => {
    const lines = [line(w('  ', 0, 5, 0, 20)), line(w('G', 10, 30, 25, 45), w('', 40, 40, 25, 45))];
    expect(reconstructChordChart(lines)).toBe('[G]');
  });

  it('returns an empty string for no input lines', () => {
    expect(reconstructChordChart([])).toBe('');
  });

  it('recognizes N.C. (no chord) and % (repeat) as chord-line tokens', () => {
    const lines = [
      line(w('N.C.', 10, 50, 0, 20), w('%', 150, 165, 0, 20)),
      line(w('Stop', 10, 60, 25, 45), w('here', 150, 200, 25, 45)),
    ];
    expect(reconstructChordChart(lines)).toBe('[N.C.]Stop [%]here');
  });

  it('reconstructs a small multi-section song end to end', () => {
    const lines = [
      line(w('Verse', 10, 60, 0, 20), w('1', 70, 80, 0, 20)),
      line(w('G', 10, 30, 30, 50), w('C', 200, 220, 30, 50)),
      line(w('Hello', 10, 70, 55, 75), w('world', 200, 260, 55, 75)),
      // Paragraph gap (~120px vs ~25px typical pitch) before the chorus.
      line(w('Chorus', 10, 80, 195, 215)),
      line(w('Em', 10, 40, 225, 245), w('D', 200, 220, 225, 245)),
      line(w('Sing', 10, 60, 250, 270), w('along', 200, 270, 250, 270)),
    ];
    expect(reconstructChordChart(lines)).toBe(
      '{c: Verse 1}\n[G]Hello [C]world\n\n{c: Chorus}\n[Em]Sing [D]along',
    );
  });
});
