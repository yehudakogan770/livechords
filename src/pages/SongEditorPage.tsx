import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChordSheet } from '../components/ChordSheet';
import { inputClass, labelClass } from '../components/formStyles';
import { IconCamera, IconTrash } from '../components/icons';
import { createSong, deleteSong, getSong, saveSong } from '../data/storage';
import { parseSong } from '../lib/chordpro';
import type { OcrProgress } from '../lib/ocr';
import type { NewSong, Song } from '../types';

const STARTER_CONTENT = `{c: Verse 1}
[G]Type your lyrics [C]with chords [D]placed right before the [G]syllable they change on

{c: Chorus}
[Em]Blank lines add [D]space between [G]sections`;

export default function SongEditorPage() {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const existing = useMemo(() => (songId ? getSong(songId) : undefined), [songId]);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [originalKey, setOriginalKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState(STARTER_CONTENT);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<OcrProgress | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(existing?.title ?? '');
    setArtist(existing?.artist ?? '');
    setOriginalKey(existing?.originalKey ?? '');
    setBpm(existing?.bpm ? String(existing.bpm) : '');
    setTags(existing?.tags.join(', ') ?? '');
    setContent(existing?.content ?? STARTER_CONTENT);
    setError(null);
  }, [existing]);

  const parsedPreview = useMemo(() => parseSong(content), [content]);

  function fillFromContent() {
    const { meta } = parseSong(content);
    if (meta.title && !title.trim()) setTitle(meta.title);
    if (meta.artist && !artist.trim()) setArtist(meta.artist);
    if (meta.key && !originalKey.trim()) setOriginalKey(meta.key);
    if (meta.bpm && !bpm.trim()) setBpm(String(meta.bpm));
  }

  async function handlePhotoSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setScanError(null);
    setScanProgress({ status: 'starting', progress: 0 });
    try {
      // Tesseract.js is sizeable and rarely used, so it's loaded on demand
      // instead of bloating every page (including the perf-sensitive Stage View).
      const { scanChordChartImage } = await import('../lib/ocr');
      const scanned = await scanChordChartImage(file, setScanProgress);
      if (!scanned.trim()) {
        setScanError('No text could be recognized in that photo. Try a clearer, well-lit, straight-on shot.');
        return;
      }
      const isBlankSlate = content.trim() === '' || content.trim() === STARTER_CONTENT.trim();
      setContent(isBlankSlate ? scanned : `${content}\n\n${scanned}`);
    } catch {
      setScanError('Scan failed — check your connection (the first scan downloads a small OCR language pack).');
    } finally {
      setScanProgress(null);
    }
  }

  function buildInput(): NewSong {
    return {
      title: title.trim() || 'Untitled Song',
      artist: artist.trim(),
      originalKey: originalKey.trim(),
      bpm: Number.parseInt(bpm, 10) || 0,
      content,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }

  function handleSave(andPerform: boolean) {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const input = buildInput();
    const song: Song = existing ? { ...existing, ...input } : createSong(input);
    if (existing) saveSong(song);
    navigate(andPerform ? `/stage/${song.id}` : '/');
  }

  function handleDelete() {
    if (!existing) return;
    if (!window.confirm(`Delete "${existing.title}"? This can't be undone.`)) return;
    deleteSong(existing.id);
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{existing ? 'Edit Song' : 'New Song'}</h1>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-stage-muted flex items-center gap-1 rounded-full px-3 py-1.5 text-sm hover:text-red-400"
          >
            <IconTrash className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass} htmlFor="song-title">
              Title
            </label>
            <input
              id="song-title"
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Amazing Grace"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="song-artist">
              Artist
            </label>
            <input
              id="song-artist"
              className={inputClass}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Traditional"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="song-key">
                Key
              </label>
              <input
                id="song-key"
                className={inputClass}
                value={originalKey}
                onChange={(e) => setOriginalKey(e.target.value)}
                placeholder="G"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="song-bpm">
                BPM
              </label>
              <input
                id="song-bpm"
                type="number"
                inputMode="numeric"
                min={0}
                className={inputClass}
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="70"
              />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="song-tags">
              Tags
            </label>
            <input
              id="song-tags"
              className={inputClass}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="worship, up-tempo"
            />
          </div>

          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <label className={labelClass + ' mb-0'} htmlFor="song-content">
                Chords &amp; Lyrics
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={scanProgress !== null}
                  className="text-stage-accent flex items-center gap-1 text-xs font-medium disabled:opacity-50"
                >
                  <IconCamera className="h-3.5 w-3.5" />
                  {scanProgress ? 'Scanning…' : 'Scan a photo'}
                </button>
                <button type="button" onClick={fillFromContent} className="text-stage-accent text-xs font-medium">
                  Fill details from pasted chart
                </button>
              </div>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelected}
            />
            {scanProgress && (
              <div className="border-stage-edge bg-stage-panel mb-2 rounded-lg border px-3 py-2 text-xs">
                <div className="bg-stage-bg h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-stage-accent h-full transition-all"
                    style={{ width: `${Math.round(scanProgress.progress * 100)}%` }}
                  />
                </div>
                <p className="text-stage-muted mt-1 capitalize">
                  {scanProgress.status.replace(/_/g, ' ')} — first scan also downloads a small OCR language pack
                </p>
              </div>
            )}
            {scanError && <p className="mb-2 text-xs text-red-400">{scanError}</p>}
            <textarea
              id="song-content"
              className={inputClass + ' h-72 font-mono text-sm leading-relaxed'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
            />
            <details className="text-stage-muted mt-2 text-xs">
              <summary className="cursor-pointer select-none">Formatting help</summary>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>
                  Put a chord in brackets right before the syllable it changes on: <code>[G]Amazing [C]grace</code>
                </li>
                <li>
                  Label a section with <code>{'{c: Verse 1}'}</code>
                </li>
                <li>Leave a blank line to add space between sections</li>
                <li>
                  Pasted ChordPro directives like <code>{'{title:}'}</code>, <code>{'{artist:}'}</code>,{' '}
                  <code>{'{key:}'}</code>, <code>{'{tempo:}'}</code> are recognized by "Fill details from pasted chart"
                </li>
                <li>
                  "Scan a photo" reads chords and lyrics off a printed page automatically — it's a best-effort
                  reading, so check chord placement before saving
                </li>
              </ul>
            </details>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="bg-stage-panel border-stage-edge rounded-full border px-4 py-2 text-sm font-semibold"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="bg-stage-accent text-stage-bg rounded-full px-4 py-2 text-sm font-semibold"
            >
              Save &amp; Perform
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-stage-muted rounded-full px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="border-stage-edge bg-stage-panel/40 rounded-lg border p-4">
          <p className={labelClass}>Live Preview</p>
          <div className="overflow-x-auto">
            <ChordSheet song={parsedPreview} fontSizePx={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
