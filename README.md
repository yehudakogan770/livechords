# LiveChords

**Live app: https://yehudakogan770.github.io/livechords/** — open it on a
phone or tablet and use the browser menu to "Add to Home Screen" to install it.

A hands-free chord/lyrics display for gigging musicians. Prop up a tablet or
phone, and the chart scrolls itself in sync with the tempo, advances on a
foot-pedal press, and transposes on the fly — no hands needed mid-song.

Built for the duct-tape-a-PDF-to-a-mic-stand crowd: worship teams, cover
bands, and solo gigging musicians.

## Features

### Performance

- **Chords + lyrics display** with chords positioned exactly above the
  syllable they change on, rendered large enough to read from across a stage.
  Auto-scroll reads through a fixed line at the middle of the screen —
  teleprompter-style — so you always look at the same spot instead of
  chasing text from the top down.
- **Auto-scroll synced to tempo** — new songs get a scroll speed estimated
  from their BPM, then you fine-tune it with +/- controls (or a footswitch)
  and it's remembered per song. A "Sync to tempo" button recomputes it
  whenever you change the BPM.
- **Hands-free advance**: most Bluetooth/USB page-turner pedals (AirTurn,
  PageFlip, iRig BlueTurn, and similar) act like a keyboard, so LiveChords
  listens for configurable keystrokes to play/pause the scroll, jump between
  songs in a setlist, restart, or transpose — all pedal-mappable in Settings,
  with a live "Test your pedal" readout to identify an unfamiliar pedal's
  keystrokes before binding them. On a touchscreen, tapping the center of the
  stage view toggles play/pause, and the screen edges jump to the
  previous/next song in a setlist.
- **Live auto-transpose** — shift the key up or down a semitone at a tap;
  chords re-render instantly, including slash chords and extended qualities
  (m7, sus4, maj7, add9, ...). A capo field shows "Capo 2 · sounds in A" next
  to the key so a chart's shapes and its sounding pitch are both clear at a
  glance.
- **Nashville Number System** — an optional toggle in Stage View renders
  chords as scale-degree numbers (1, 4, 5, 6m, ...) relative to the song's
  current key instead of letter names; the numbers stay identical no matter
  what key you transpose into, exactly like a Nashville number chart on paper.
- **Metronome click track** in Stage View for counting a song in, plus
  tap-tempo in the editor to set a BPM by tapping instead of guessing. The
  click auto-stops the moment auto-scroll starts, so it can't keep clicking
  through the speaker mid-performance.
- **Stage-readable type** with adjustable font size (18–120px) and a
  high-contrast dark theme designed for dim stage lighting.
- **Keeps the screen awake** during performance via the Screen Wake Lock API.
- **Setlists** with hands-free auto-advance to the next song when one
  finishes scrolling, drag-and-drop reordering (touch and mouse), and a
  free-text note per song in the set (capo, key change, count-off, ...) shown
  right in the performance chrome.

### Library

- **Organize your library by artist or style**: every song has an optional
  Style field (Worship, Rock, Country, ...) picked from your own previously
  used styles plus a starter preset list, and the library can be grouped by
  title, artist, or style — whichever makes sense for how big your set of
  charts is getting.
- **Search, sort, and favorite** — search by title/artist/style/tag, sort by
  title, recently added, or recently updated, and star songs as favorites
  for a quick filter.
- **Bulk actions** — a Select mode in the Library for bulk delete, bulk style
  assignment, or bulk add-to-setlist across many songs at once.
- **Light or dark theme**, or follow your device's system setting — dark by
  default for stage use, switchable in Settings.
- **Chord diagrams** — the editor's preview shows a fretboard diagram for
  every chord used in a song (open-position shapes plus generated barre
  chords), handy while learning or rehearsing a chart.
- **Duplicate a song** ("Save As") to quickly build a variation of an
  existing chart.

### Sharing & backup

- **Print or save a chart — or a whole setlist — as a PDF** — one-click
  "Print / Save as PDF" buttons in the song editor and the setlist editor use
  the browser's native print pipeline (no extra download, works with any
  printer or "Save as PDF" destination) for a clean black-on-white copy to
  keep as a backup or hand to another musician.
- **Works offline** — installable as a PWA (a custom "Install" banner appears
  when your browser supports it), everything is stored locally, so a flaky
  venue wifi never gets in the way of a gig.
- **Scan a photo of a chart** in the song editor to auto-fill the chords and
  lyrics — free, on-device OCR (no account, no API key, no per-scan cost).
  It reads the chord line and the lyric line and lines them up by position,
  so it's a best-effort first draft, not a guarantee — review chord
  placement before saving, and expect better results from a flat, well-lit,
  printed page than a skewed or handwritten one. The OCR engine itself
  (~10–15MB) downloads from a CDN the first time you use this feature and is
  cached by the browser afterward; everything else in the app stays free and
  fully offline regardless of whether you ever use this feature.

## Chart format

Songs are written in a small ChordPro-compatible format:

```
{title: Amazing Grace}
{artist: Traditional}
{key: G}
{bpm: 70}

{c: Verse 1}
[G]Amazing [G7]grace, how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
```

- `[Chord]` right before a syllable places that chord above it.
- `{c: Section name}` (or `{comment: ...}`) adds a section label.
- A blank line adds space between sections.
- Common ChordPro directives (`{title:}`, `{artist:}`, `{key:}`, `{tempo:}`,
  `{capo:}`, `{start_of_chorus}`/`{soc}`, ...) are recognized, so existing
  ChordPro charts mostly paste in as-is. The editor's "Fill details from
  pasted chart" button pulls title/artist/key/BPM out of pasted text.

## Development

```bash
npm install
npm run dev        # start the dev server
npm test           # run the unit tests (chord parsing, transposition, Nashville numbers, chord shapes,
                    #   scroll speed, tap tempo, OCR reconstruction)
npm run typecheck  # TypeScript project check
npm run build      # production build (dist/) with the PWA service worker
```

Stack: React + TypeScript + Vite, Tailwind CSS v4, `vite-plugin-pwa`, and
`react-router` for the four screens (Library, Song Editor, Setlists, Stage
View) plus Settings. All data (songs, setlists, preferences) lives in the
browser's `localStorage` — there's no backend. Use Settings → Backup to
export/import a JSON snapshot when switching devices.
