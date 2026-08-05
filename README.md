# LiveChords

**Live app: https://yehudakogan770.github.io/livechords/** — open it on a
phone or tablet and use the browser menu to "Add to Home Screen" to install it.

A hands-free chord/lyrics display for gigging musicians. Prop up a tablet or
phone, and the chart scrolls itself in sync with the tempo, advances on a
foot-pedal press, and transposes on the fly — no hands needed mid-song.

Built for the duct-tape-a-PDF-to-a-mic-stand crowd: worship teams, cover
bands, and solo gigging musicians.

## Features

- **Chords + lyrics display** with chords positioned exactly above the
  syllable they change on, rendered large enough to read from across a stage.
- **Auto-scroll synced to tempo** — new songs get a scroll speed estimated
  from their BPM, then you fine-tune it with +/- controls (or a footswitch)
  and it's remembered per song. A "Sync to tempo" button recomputes it
  whenever you change the BPM.
- **Hands-free advance**: most Bluetooth/USB page-turner pedals (AirTurn,
  PageFlip, iRig BlueTurn, and similar) act like a keyboard, so LiveChords
  listens for configurable keystrokes to play/pause the scroll, jump between
  songs in a setlist, restart, or transpose — all pedal-mappable in Settings.
  On a touchscreen, tapping the center of the stage view toggles play/pause,
  and the screen edges jump to the previous/next song in a setlist.
- **Live auto-transpose** — shift the key up or down a semitone at a tap;
  chords re-render instantly, including slash chords and extended qualities
  (m7, sus4, maj7, add9, ...).
- **Stage-readable type** with adjustable font size (18–120px) and a
  high-contrast dark theme designed for dim stage lighting.
- **Keeps the screen awake** during performance via the Screen Wake Lock API.
- **Setlists** with hands-free auto-advance to the next song when one
  finishes scrolling.
- **Works offline** — installable as a PWA, everything is stored locally, so
  a flaky venue wifi never gets in the way of a gig.

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
npm test           # run the unit tests (chord parsing, transposition, scroll speed)
npm run typecheck  # TypeScript project check
npm run build      # production build (dist/) with the PWA service worker
```

Stack: React + TypeScript + Vite, Tailwind CSS v4, `vite-plugin-pwa`, and
`react-router` for the four screens (Library, Song Editor, Setlists, Stage
View) plus Settings. All data (songs, setlists, preferences) lives in the
browser's `localStorage` — there's no backend. Use Settings → Backup to
export/import a JSON snapshot when switching devices.
