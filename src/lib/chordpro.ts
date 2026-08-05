/**
 * A pragmatic subset of the ChordPro format: inline `[Chord]` tokens over lyric
 * lines, `{directive: value}` metadata, and `{comment:}`/`{start_of_chorus}`-style
 * section markers. Anything we don't recognize is ignored rather than rejected,
 * so pasting real-world ChordPro/OnSong charts "just works" even if we don't
 * support every directive.
 */

export interface ChordToken {
  chord: string | null;
  text: string;
}

export type SongLine =
  | { type: 'section'; label: string }
  | { type: 'blank' }
  | { type: 'lyric'; tokens: ChordToken[] };

export interface SongMeta {
  title?: string;
  artist?: string;
  key?: string;
  bpm?: number;
  capo?: number;
}

export interface ParsedSong {
  lines: SongLine[];
  meta: SongMeta;
}

const META_DIRECTIVES: Record<string, keyof SongMeta> = {
  title: 'title',
  t: 'title',
  artist: 'artist',
  subtitle: 'artist',
  st: 'artist',
  key: 'key',
  tempo: 'bpm',
  bpm: 'bpm',
  capo: 'capo',
};

const SECTION_START_LABELS: Record<string, string> = {
  start_of_chorus: 'Chorus',
  soc: 'Chorus',
  start_of_verse: 'Verse',
  sov: 'Verse',
  start_of_bridge: 'Bridge',
  sob: 'Bridge',
  start_of_tab: 'Tab',
  sot: 'Tab',
};

const SECTION_END_DIRECTIVES = new Set([
  'end_of_chorus',
  'eoc',
  'end_of_verse',
  'eov',
  'end_of_bridge',
  'eob',
  'end_of_tab',
  'eot',
]);

const COMMENT_DIRECTIVES = new Set(['comment', 'c', 'comment_italic', 'ci', 'comment_box', 'cb']);

const DIRECTIVE_RE = /^\{\s*([a-zA-Z_]+)\s*(?::\s*(.*?)\s*)?\}\s*$/;
const CHORD_SPLIT_RE = /(\[[^\]\n]*\])/;

function parseDirective(name: string, value: string | undefined): SongLine | null {
  const key = name.toLowerCase();

  if (COMMENT_DIRECTIVES.has(key)) {
    return { type: 'section', label: value ?? '' };
  }
  if (key in SECTION_START_LABELS) {
    return { type: 'section', label: value || SECTION_START_LABELS[key] };
  }
  if (SECTION_END_DIRECTIVES.has(key)) {
    return null;
  }
  // Meta directives (title/artist/key/tempo/capo) carry no visible line of
  // their own — they're surfaced via ParsedSong.meta instead.
  return null;
}

function parseLyricLine(line: string): SongLine {
  if (!line.includes('[')) {
    return { type: 'lyric', tokens: [{ chord: null, text: line }] };
  }

  const parts = line.split(CHORD_SPLIT_RE).filter((part) => part !== '');
  const tokens: ChordToken[] = [];

  for (const part of parts) {
    if (part.startsWith('[') && part.endsWith(']')) {
      tokens.push({ chord: part.slice(1, -1).trim(), text: '' });
    } else if (tokens.length === 0) {
      tokens.push({ chord: null, text: part });
    } else {
      tokens[tokens.length - 1].text += part;
    }
  }

  return { type: 'lyric', tokens };
}

export function parseSong(content: string): ParsedSong {
  const meta: SongMeta = {};
  const lines: SongLine[] = [];

  for (const rawLine of content.split(/\r\n|\r|\n/)) {
    const line = rawLine.trimEnd();

    if (line.trim() === '') {
      lines.push({ type: 'blank' });
      continue;
    }

    const directiveMatch = DIRECTIVE_RE.exec(line.trim());
    if (directiveMatch) {
      const [, name, value] = directiveMatch;
      const metaKey = META_DIRECTIVES[name.toLowerCase()];
      if (metaKey) {
        if (metaKey === 'bpm' || metaKey === 'capo') {
          const parsed = Number.parseInt(value ?? '', 10);
          if (!Number.isNaN(parsed)) meta[metaKey] = parsed;
        } else if (value !== undefined) {
          meta[metaKey] = value;
        }
        continue;
      }
      const sectionLine = parseDirective(name, value);
      if (sectionLine) lines.push(sectionLine);
      continue;
    }

    lines.push(parseLyricLine(line));
  }

  return { lines, meta };
}

/** Unique chord names used in a song, in first-appearance order — handy for a "chords used" chip strip. */
export function extractChords(content: string): string[] {
  const { lines } = parseSong(content);
  const seen = new Set<string>();
  for (const line of lines) {
    if (line.type !== 'lyric') continue;
    for (const token of line.tokens) {
      if (token.chord) seen.add(token.chord);
    }
  }
  return [...seen];
}
