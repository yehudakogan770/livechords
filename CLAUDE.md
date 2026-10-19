# LiveChords

Hands-free chord/lyrics display for gigging musicians. Prop a phone/tablet
on a mic stand; the chart auto-scrolls in sync with tempo, advances on a
foot-pedal press, transposes live, and stays readable from across a stage.

**Read `HANDOFF.md` first** — it has the full project history, every
significant decision and why it was made, current status, what's left, and
exactly where everything lives (repo, hosting, services, env vars).

## Stack

React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + `vite-plugin-pwa` +
`react-router` v8 (**not** `react-router-dom` — see HANDOFF.md for why).
100% client-side: no backend, no accounts, no API keys, no environment
variables anywhere in this project. All data lives in the browser's
`localStorage`. `HashRouter`, not `BrowserRouter` (GitHub Pages can't do
server-side rewrites).

## Commands

```bash
npm install
npm run dev         # dev server
npm test            # vitest
npm run typecheck   # tsc -b --noEmit
npm run build        # tsc -b && vite build -> dist/
npm run preview       # serve the production build locally
```

Run all three (`test`, `typecheck`, `build`) before considering any change
done — and then actually verify the behavior in a real browser. Several
real bugs in this project's history (documented in HANDOFF.md) passed a
typecheck and looked correct on read but were only caught by driving an
actual browser against the actual change.

## How this user likes things done

- **Verify in a real browser, not just by reading the code or trusting
  types/tests.** This has caught real bugs repeatedly in this project —
  see HANDOFF.md's "Key decisions" section for specifics (an auto-scroll
  sub-pixel bug, a responsive breakpoint that never activated, a dark-theme
  leak into print output, a modal z-index bug only visible at a mobile
  viewport width, a pitch-detection algorithm bug only visible against a
  real signal, a PDF-parsing bug only visible against a real generated
  PDF). Prefer testing the real thing over reasoning about whether it
  should work.
- **Keep Stage View lean.** It's the one screen used hands-free, mid-
  performance. New features default to living elsewhere (their own page,
  or an opt-in toggle in Settings → Customize Stage View) rather than
  becoming a new always-on Stage View control. This was explicit, pointed
  feedback from the user earlier in this project — see HANDOFF.md.
- **No backend, no external accounts, without being asked first.** This
  project is deliberately 100% static/client-side. Don't introduce a
  dependency on Firebase, Supabase, Render, or any other hosted service —
  including reviving the cloud-sync plan — without the user explicitly
  providing their own account/credentials for it. Claude cannot create
  external accounts on the user's behalf; see HANDOFF.md's cloud-sync
  section for the full history and exactly what's still needed from the
  user to finish that one feature.
- **Prefer free, on-device, open-source approaches** over paid APIs/
  services: OCR uses Tesseract.js (not a paid vision API), PDF import reads
  the PDF's own embedded text layer via pdfjs-dist (not a paid API), the
  tuner uses the Web Audio API directly. When there's a paid/free choice to
  make, offer it explicitly rather than assuming.
- **Commit and push incrementally** — one coherent batch of work per
  commit, message explains *why* not *what*. Work on a feature branch, open
  a PR against `main`, merge only when explicitly told to (the user has, a
  few times, given one-off standing authorization like "launch everything"
  — treat that as applying to that moment, not as a permanent rule).
- **After a PR merges into `main`, restart the feature branch from the new
  `main`** before further work, rather than stacking new commits on
  already-merged history:
  ```bash
  git fetch origin main
  git checkout -B claude/hands-free-chord-lyrics-7zt5s5 origin/main
  ```
- **Pushing to `main` triggers an automatic production deploy** (GitHub
  Pages). Don't merge to `main` casually.
- User is non-technical; explain tradeoffs in plain language, skip jargon,
  don't assume familiarity with hosting/deployment concepts. Their typos
  and casual phrasing aren't meaningful — read intent, not spelling.
- "Add everything useful" has come up more than once in this project. The
  user wants genuine breadth and has engaged well with large batches of
  work, but has also explicitly asked to be told when something would just
  be padding. When a request is this open-ended, a short recommendation
  (and, if it's a real fork like "should this need an external account,"
  a direct question) beats silently building everything imaginable.

## Never

- Never commit secrets/API keys. There are currently none in this project
  at all — keep it that way unless a future feature (e.g. finished cloud
  sync) genuinely needs one, and even then, Firebase's client-side web
  config is meant to be public (see HANDOFF.md).
- Never create an external account (Firebase, Render, etc.) on the user's
  behalf. They do that step themselves; Claude only ever consumes
  credentials they provide.
- Never merge a PR to `main` without being asked for that specific merge.
- Never add a feature that reduces Stage View's hands-free reliability
  for the sake of convenience elsewhere.

## Structure

See HANDOFF.md's "Everything built, and how it's structured" section for
the full file-by-file map and what each piece does. Quick orientation:

- `src/pages/` — routed screens (Library, Song Editor, Setlists + Setlist
  Editor, Stage View, Tuner)
- `src/components/` — shared UI (chord sheet renderer, Settings popup,
  Stage View chrome, toast/confirm dialog systems, icons)
- `src/lib/` — pure logic + hooks, most with a sibling `*.test.ts`
  (Vitest). Notably: `ocrReconstruct.ts` is the shared chord/lyric
  line-pairing algorithm fed by *both* `ocr.ts` (photo scan) and
  `pdfImport.ts` (PDF text layer) — don't duplicate that logic if you touch
  either importer.
- `src/data/storage.ts` — the one place all `localStorage` reads/writes
  happen; route any new persisted field through here, following the
  existing backward-compatible-defaulting pattern for fields added after
  users may already have data saved.
