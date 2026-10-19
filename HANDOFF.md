# LiveChords — Project Handoff

This document exists because the person running this project is switching to
a new Claude account, and this conversation will not carry over. It is
written so a brand-new Claude session — with zero memory of any of this —
can pick the project up and continue as if it were the same conversation.
**Read this whole file before touching anything.**

If you are that new session: the person is a non-technical-leaning user
(typos, casual phrasing are normal for them — don't read anything into it).
Explain tradeoffs plainly. They've shown they're comfortable with fairly
large, fast-moving batches of work, but also want to be asked before
anything risky, external, or costly happens on their behalf.

---

## What this project is

**LiveChords** — a hands-free chord/lyrics display for gigging musicians.
Prop a phone or tablet on a mic stand; the chart auto-scrolls itself in sync
with the song's tempo, advances on a foot-pedal press, transposes live, and
stays readable from across a stage. Built for worship teams, cover bands,
and solo gigging musicians — the "duct-tape-a-PDF-to-a-mic-stand" crowd.

Live at: **https://yehudakogan770.github.io/livechords/**

It is a 100% client-side Progressive Web App — no backend, no accounts, no
API keys (with one partially-started exception: optional cloud sync, see
below). Everything a user creates lives in their own browser's
`localStorage`. This was a deliberate choice, not a limitation reached by
accident: it means the app works with zero connectivity at a venue, costs
nothing to run, and nobody's data depends on a service staying up.

---

## Current status (most recent state in this conversation)

Six PRs have been opened and merged into `main`, each auto-deploying to the
live site on merge. The working tree is clean, all 101 unit tests pass, the
typecheck is clean, and the production build succeeds. There is exactly
**one unfinished piece of work**: optional cloud sync / multi-device
accounts, blocked on the user creating their own Firebase project (Claude
cannot create external accounts on anyone's behalf — see "What's left"
below for exactly what's needed and the steps already given to the user
twice).

Everything else requested across this project's entire history has been
built, tested in a real browser (not just typechecked), committed, and
deployed.

---

## Everything built, and how it's structured

### Performance (Stage View, the core hands-free screen)
- Chords positioned exactly above the syllable they change on, large,
  high-contrast type for stage lighting (18–120px, adjustable).
- Auto-scroll synced to tempo (estimated from BPM, fine-tunable, remembered
  per song), reading through a **fixed line at the vertical center of the
  screen** — teleprompter-style, not top-to-bottom scrolling — so the
  performer always looks at the same spot.
- Foot-pedal input: any Bluetooth/USB page-turner pedal that emits
  keystrokes (most do) can be mapped in Settings to play/pause, restart,
  next/prev song in a setlist, or transpose. A "Test your pedal" live
  readout helps identify what an unfamiliar pedal actually sends.
  Touchscreen taps work too (center = play/pause, edges = prev/next).
- Live auto-transpose (semitone up/down), with sharp/flat spelling
  preference (auto/always-sharp/always-flat).
- Capo field (purely informational: shows "Capo 2 · sounds in A" next to
  the key; does not transform the chord chart content itself).
- Nashville Number System toggle — chords rendered as scale-degree numbers
  relative to the song's **current** (post-transpose) key, so the numbers
  are transpose-invariant, matching how a real Nashville number chart
  behaves on paper.
- Metronome click track (auto-stops the instant auto-scroll starts, so it
  can never keep clicking through the device speaker mid-performance).
- Screen Wake Lock during performance.
- Setlists with hands-free auto-advance when a song finishes scrolling,
  pointer-based drag-and-drop reordering (works with touch, not just
  mouse), and a free-text note per song-in-the-set (capo, key change,
  count-off, etc.) shown live during that performance.
- **Stage View is customizable.** Play/pause is the only control that's
  never hidden. Everything else (text size, transpose, scroll speed,
  restart, Nashville numbers, metronome) can be shown/hidden per-user in
  **Settings → Customize Stage View**. This exists specifically so the rest
  of the app can keep growing tools without the live performance screen
  ever getting more cluttered — see "Key decisions" below for why this was
  added.

### Library & organizing songs
- Search (title/artist/style/tag), sort (title/recently added/recently
  updated), favorites (star + filter), grouping (by title/artist/style).
- Bulk actions: a Select mode for bulk delete, bulk style assignment, bulk
  add-to-setlist.
- Light/dark/system theme (dark by default, matches stage use).
- Chord diagrams: a fretboard diagram for every chord used in a song, in
  the editor's preview — common open-position shapes plus **generated**
  moveable E-form/A-form barre chords (computed from the CAGED system, not
  hand-authored for every root), so uncommon roots still get a correct
  diagram without an exhaustive hand-built library.
- Duplicate song ("Save As"), Undo button on every delete (song, bulk
  selection, or setlist) shown right in the confirmation toast.
- Keyboard shortcuts in the Library: `/` focuses search, `?` opens a
  shortcuts help panel.

### Sharing, import & backup
- Print or save a single chart **or a whole setlist** as a PDF via the
  browser's native print pipeline (no extra library, no download step).
- Export/import a single song as a plain-text ChordPro file.
- **Scan a photo** of a chart: on-device OCR (Tesseract.js, downloaded from
  a CDN only the first time this feature is used, cached after) reads the
  chord line and lyric line and reconstructs them with chords correctly
  positioned above the right syllable — a best-effort first draft, not a
  guarantee.
- **Import a PDF**: reads a PDF's real, selectable text layer (not OCR —
  actual embedded text) and runs it through the *same* chord/lyric
  reconstruction algorithm the photo scanner uses. Works for digitally
  authored chart PDFs (ChordPro/OnSong exports, CCLI SongSelect, Planning
  Center, "print to PDF"). A scanned/image-only PDF has no text layer to
  read and shows a clear error pointing to "Scan a photo" instead. The PDF
  engine (pdf.js) is bundled locally (not fetched from a CDN, unlike
  Tesseract) so this works fully offline, and it's dynamically
  loaded/excluded from the PWA's install precache so it doesn't add to
  every install's download — only to the first actual PDF import.
- Settings → Backup: export/import a full JSON snapshot of everything
  (songs, setlists, settings) — today, this is the *only* way data moves
  between two devices (see "Cloud sync" below).
- Installable as a PWA (custom "Install" banner using
  `beforeinstallprompt`, works offline once installed).

### Extras
- A guitar tuner — its own page (`/tuner`, in the nav bar), **deliberately
  not part of Stage View** (tuning happens between songs, not during a
  performance; also avoids mic-permission complexity mid-set). On-device
  pitch detection via the Web Audio API and autocorrelation — no server, no
  upload. Shows note + cents + an in-tune meter + nearest-standard-string
  reference.
- A hidden Konami-code easter egg (confetti + a toast), deliberately wired
  up only outside Stage View so it can never interfere with pedal input
  during a performance.
- Settings is a **popup**, not a page: pressing the Settings icon opens an
  overlay; pressing it again (or Escape, or the backdrop, or a close
  button) closes it — no navigation, no losing your place. Works the same
  from the main nav or from Stage View's own top bar.

### Source layout
```
src/
  main.tsx, App.tsx          — entry point, routing, top-level providers
  types.ts                   — all shared TypeScript types/constants
  pages/                     — routed screens
    LibraryPage.tsx, SongEditorPage.tsx, SetlistsPage.tsx,
    SetlistEditorPage.tsx, StagePage.tsx, TunerPage.tsx
  components/                — shared UI
    ChordSheet.tsx (the chord+lyric renderer), ChordDiagram.tsx,
    StageChrome.tsx (Stage View's top/bottom bars), NavBar.tsx,
    SettingsPanel.tsx (the popup), ConfirmDialog.tsx, Toast.tsx,
    InstallBanner.tsx, Confetti.tsx, icons.tsx, formStyles.ts
  lib/                       — pure logic + hooks (most have a sibling
                                *.test.ts — Vitest)
    chordpro.ts               ChordPro-lite parser
    transpose.ts               chord transposition engine
    nashville.ts                Nashville Number System conversion
    chordShapes.ts              guitar chord-shape/diagram data + generator
    scrollSpeed.ts               BPM -> px/s estimation
    useAutoScroll.ts             the Stage View scroll engine
    usePedalInput.ts, useWakeLock.ts, useInstallPrompt.ts,
    installPrompt.ts, useKonamiCode.ts, useMetronome.ts, tapTempo.ts,
    ThemeContext.tsx, SettingsPanelContext.tsx
    ocrReconstruct.ts            chord/lyric line-pairing algorithm —
                                  SHARED by both OCR and PDF import
    ocr.ts                       Tesseract.js wrapper (feeds ocrReconstruct)
    pdfImport.ts                 pdf.js wrapper (also feeds ocrReconstruct)
    pitchDetect.ts                autocorrelation pitch detection (tuner)
    useTuner.ts                   tuner's mic/Web Audio hook
  data/
    storage.ts                   localStorage persistence layer, all
                                  reads/writes to songs/setlists/settings
                                  go through here
    sampleSongs.ts                3 seed songs for a fresh install
.github/workflows/deploy.yml   — build+test+deploy to GitHub Pages on push
                                  to main
```

---

## Key decisions, and why (read this before changing any of them)

- **100% client-side, no backend.** Chosen for reliability at a gig with no
  wifi, and to keep the app free forever with nothing to maintain. Don't
  casually introduce a server dependency for a feature that doesn't need
  one.
- **`HashRouter`, not `BrowserRouter`.** GitHub Pages is a static host with
  no server-side rewrite rules, so a direct link or reload to e.g.
  `/song/123/edit` would 404 under `BrowserRouter`. Hash routing
  (`#/song/123/edit`) needs no server config at all.
- **`react-router`, not `react-router-dom`.** At the time this was built,
  `react-router-dom` had no patched release for a security advisory that
  required React 19, so the app uses the `react-router` package directly
  (its main export already includes `HashRouter` etc.).
- **ChordPro-lite parser ignores what it doesn't understand** rather than
  rejecting it, so pasting a real-world ChordPro/OnSong chart mostly "just
  works" even without full-spec support.
- **Auto-scroll tracks position as a float, writes only the rounded result
  to `scrollTop`.** A real bug: writing fractional increments straight to
  `scrollTop` silently lost all sub-pixel movement every frame at
  BPM-typical (slow) speeds, because `scrollTop` rounds on read — the
  auto-scroll simply never moved. Found via Playwright, not by reading the
  code.
- **Teleprompter-style center scroll** uses matching 50vh spacers before
  and after the chart, so every line (first to last) passes through a
  fixed marker at screen center — explicit user request, verified by
  measuring actual element geometry in a real browser, not just reasoning
  about the CSS.
- **OCR uses on-device Tesseract.js, not a paid vision API** — the user
  explicitly chose the free option when offered both.
- **Capo is informational only**, not a chord-transforming feature: the
  chart content is assumed to already be written as the shapes to play;
  capo just shows what key that sounds in. Avoids a confusing dual-mode
  "which key is this chart actually in" UI.
- **Nashville numbers are relative to the current (post-transpose) key**,
  computed fresh each time — this is what makes the numbers stay identical
  no matter what key you transpose into, which is the entire point of the
  Nashville Number System.
- **Chord diagrams generate barre shapes from the CAGED system** rather
  than being hand-authored per root/quality — bounded, correct, and avoids
  silently showing a wrong fingering for an uncommon chord. Returns
  "no diagram" rather than guessing when a quality is too unusual.
- **Metronome auto-stops the instant auto-scroll starts** — a deliberate
  safety behavior so it can never be left clicking through the speaker
  during an actual song.
- **Stage View became customizable (Settings → Customize Stage View)
  specifically in response to user feedback**: *"have it with a ton of
  tools and then when you press live it only gives you what you need and
  it should be customizeble."* This reframed the whole approach — new
  tools go elsewhere by default (their own page, or an opt-in toggle), not
  straight onto the live performance screen. Nashville numbers and the
  metronome default **off** (the newest "extra tools" at the time); text
  size/transpose/scroll speed/restart default **on** (already-existing
  behavior, no regression for anyone).
- **The guitar tuner is deliberately its own page, not part of Stage
  View**, for the same reason — tuning happens between songs, not during
  one, and keeping it separate avoids any mic-permission interaction with
  the hands-free performance flow.
- **Settings is a popup, not a route**, per explicit user request
  ("...when i press the setings tab it should open and when i press it
  agein it should close and it should be a pop up tab not its own page").
  Toggled from both the main nav and Stage View's own top bar (shared React
  context, `SettingsPanelContext`), so you can check a setting without
  losing your place mid-performance. **Real bug found while verifying
  this**: on a narrow/mobile viewport the popup was top-aligned, which let
  its own header sit directly over Stage View's fixed top bar — so a
  second tap on the Settings icon could land on dead space inside the
  popup instead of the backdrop that actually closes it. Fixed by always
  centering the popup regardless of viewport width. Caught by Playwright's
  actionability check (an "element intercepts pointer events" error),
  which is exactly the kind of thing that passes a typecheck and a glance
  at the code but fails for a real user.
- **PDF import reuses the exact same `reconstructChordChart` algorithm as
  the OCR photo scanner**, just fed from a different source: pdf.js's
  positioned text-layer words instead of Tesseract's OCR word positions.
  This was a deliberate architecture choice to avoid building (and
  maintaining) a second chord/lyric line-pairing heuristic. pdf.js's
  `hasEOL` flag on each text item is used to group words into lines (far
  more reliable than re-inferring line breaks from Y-position alone, which
  is what OCR has to do since Tesseract doesn't give that signal). **Real
  bug found via a Playwright test against a genuinely generated PDF** (not
  synthetic data — Playwright generated the PDF itself from HTML crafted
  to mimic real chord-chart typesetting): pdf.js can carry the line-boundary
  signal on an *empty* text item (e.g. after a layout/block element), and
  discarding empty items before checking `hasEOL` silently merged two
  separate lines together. Fixed by keeping empty items around for their
  boundary signal while still contributing zero words to the output.
- **Cloud sync / multi-device accounts — see the dedicated section right
  below.** This is the one feature discussed at length that never actually
  got built, and it's worth understanding the full back-and-forth before
  bringing it up again.

### Cloud sync: the full story (read this before re-raising it)

The user asked more than once for real multi-device access ("make it have
accounts so i can use mutpul devices"). The honest technical answer, given
at length in this conversation and worth repeating to a new session rather
than re-deriving: **real sync between two devices that aren't physically
connected always requires a server somewhere, and that server needs an
account with *someone* — there is no version of "real accounts, zero
external services" that actually works.** This isn't a LiveChords
limitation; it's true for every app with real accounts, including the big
ones — they just have that account with their own company instead of the
user's.

The back-and-forth, in order:
1. Claude asked (via a structured choice) whether to add accounts/cloud
   sync at all. User said yes.
2. Claude explained what's needed: the user has to create their own
   Firebase project (Claude cannot create external accounts on anyone's
   behalf — doing so would also trap the user's own data behind
   credentials only Claude could access, which would be worse, not
   better). Gave exact steps. **User never sent the config.**
3. Much later, the user pushed back: *"it should be like in my other app i
   did not have to use any extornal sites"* — referencing a different,
   unrelated app of theirs called "stagecue," hosted at
   `https://stagecue-9yp2.onrender.com/` (Render.com — this sandbox's
   network egress blocked fetching it, so it was never actually inspected,
   only reasoned about from the hosting platform's name). Render.com runs
   real backend servers, unlike GitHub Pages, which only serves static
   files — so "stagecue" almost certainly has its own hand-written backend
   and database, not a third-party auth service.
4. Claude explained Render.com is *also* an external account/service, just
   possibly one that felt more seamless to set up before, and offered to
   replicate that pattern (a custom backend deployed to Render) as an
   alternative to Firebase.
5. User explicitly rejected Render too: *"i dont whant to use render."*
6. Claude laid out the complete, honest set of options — there are only
   three categories, full stop:
   - A server somewhere (Firebase, Render, anything) — needs an account
     with someone, no way around it.
   - **Direct device-to-device sync (WebRTC peer-to-peer)** — genuinely
     zero accounts, zero servers, but only works when both devices are
     open to the app *at the same time*, near each other, for a manual
     "sync now" handoff. **Not built** — this was presented as an option
     but never chosen or implemented.
   - Manual export/import (Settings → Backup) — already built, works
     today, zero setup, but fully manual.
7. User, having seen the real tradeoffs of the zero-account options, chose
   to reconsider and accept one external account (Firebase) after all.
8. Claude re-sent the same Firebase setup steps (below). **As of this
   handoff, the user still has not created the project or sent back a
   config.** This is the single most important unfinished thing — see
   "What's left" for the exact next step.

If a new session is asked to revisit this topic, **do not re-litigate the
whole debate from scratch** — the decision is made (Firebase, one external
account, user-owned), the steps are known, the only blocker is the user
actually doing the signup. Just ask for the config, or check whether
they've already created it.

---

## How to run, test, and deploy

```bash
npm install
npm run dev          # start the dev server
npm test             # vitest — 101 tests as of this handoff
npm run typecheck    # tsc -b --noEmit
npm run build         # tsc -b && vite build -> dist/
npm run preview       # serve the production build locally
```

Before considering any change "done": run all three of `npm test`,
`npm run typecheck`, and `npm run build`, **and then actually verify the
behavior in a real browser** (this project's history includes several real
bugs — listed above — that a typecheck and a glance at the code would not
have caught). Playwright/Chromium verification was used throughout this
project's development; see below for how this sandbox had it set up.

**Deploying**: pushing to `main` automatically deploys to the live site via
`.github/workflows/deploy.yml` (GitHub Actions → GitHub Pages). There is no
separate manual deploy step and no deploy secrets to manage. Do not push to
`main` casually — confirm with the user first, the same way this
conversation always did, unless they've given explicit standing
authorization for a specific round of work (e.g. "launch everything").

**Development workflow used throughout this project**: work on the branch
`claude/hands-free-chord-lyrics-7zt5s5`, commit incrementally, push, open a
PR against `main`, and merge only when the user says to. After a PR merges,
restart the branch from the new `main` before further work:
```bash
git fetch origin main
git checkout -B claude/hands-free-chord-lyrics-7zt5s5 origin/main
```
(If there happen to be not-yet-merged commits on the branch at that point,
rebase them onto the new base instead of discarding them.)

**Browser verification in this kind of sandboxed environment**: Chromium is
typically pre-installed in these environments; `vite preview` plus a
Playwright script driving that pre-installed Chromium was the pattern used
throughout. (Exact paths vary by environment — check for an existing
Playwright/Chromium install before assuming you need to fetch one; this
project's network egress was restricted to package registries and a few
other allowed hosts, not arbitrary CDNs, which is also why pdf.js is
bundled locally instead of loaded from a CDN.)

---

## WHERE EVERYTHING LIVES

### GitHub repository
- **Owner/repo**: `yehudakogan770/livechords`
- **Production branch**: `main` — pushing here auto-deploys the live site.
- **Active development branch**: `claude/hands-free-chord-lyrics-7zt5s5` —
  all work happens here; opened as a PR against `main`; restarted from
  `main` after each merge (see above). No other branches are in active
  use.
- No other GitHub repositories are part of this project.

### Hosting / live site
- **Platform**: GitHub Pages (a project site, not a custom domain).
- **Live URL**: https://yehudakogan770.github.io/livechords/
- **Admin page**: https://github.com/yehudakogan770/livechords/settings/pages
- **Deploy mechanism**: `.github/workflows/deploy.yml`, triggers on every
  push to `main` (also manually runnable via `workflow_dispatch`). Build
  job: checkout → Node 22 → `npm ci` → `npm test` → `npm run build` →
  upload `dist/` as a Pages artifact. Deploy job:
  `actions/deploy-pages`. No manually configured secrets — GitHub Pages
  deployment authenticates via the automatic `GITHUB_TOKEN` (OIDC,
  `id-token: write` permission in the workflow), nothing was ever added to
  the repo's Settings → Secrets.
- Enabling Pages itself (Settings → Pages → Source = "GitHub Actions") was
  a one-time manual step the repo owner did themselves early in this
  project (Claude has no API access to that specific setting) — already
  done, should not need redoing.

### Domain
- No custom domain anywhere. Only the default
  `yehudakogan770.github.io` GitHub Pages subdomain. Nothing is registered
  with any domain registrar for this project.

### Databases / storage
- **None exist.** All app data (songs, setlists, settings) lives only in
  each user's own browser `localStorage` — no server-side database, no
  Firebase project, no Supabase project, nothing. Deliberate, not an
  oversight (see "Key decisions" above). Settings → Backup is the only
  current way data moves between devices (manual JSON export/import).

### External services / accounts in use today
- **GitHub** (`yehudakogan770` account) — hosts the repo, serves the live
  site via Pages. The only external account this project actually
  depends on right now.
- npm's public registry — dependency installation only, no account needed.
- Tesseract.js's language-data CDN — downloads automatically the first
  time a user uses "Scan a photo"; no account, no key, just a public CDN
  fetch cached by the browser afterward.

### External services discussed but NOT in use
- **Firebase** — UNCONFIRMED / not yet set up. The agreed-upon path for
  cloud sync (see the dedicated section above), but no project has been
  created and no config has been provided. If a new session finds a
  `firebaseConfig` object anywhere in a future message, confirm which
  project it's for before trusting it; otherwise the next step is still
  asking the user to create one (exact steps in "What's left" below).
- **Render.com** — explicitly considered and explicitly rejected by the
  user *for this project*. They have a separate, unrelated app called
  "stagecue" hosted there (`https://stagecue-9yp2.onrender.com/` — this
  sandbox's network egress blocked fetching it, so it was never actually
  inspected). Not part of LiveChords; nothing from it was reused here.

### Environment variables / secrets
- **None exist anywhere in this project** — not in the repo, not in GitHub
  Actions secrets, not in any `.env` file (none exists; verified no
  `.env`/secret-named files are present before this handoff). This is
  intentional: the app is fully static and client-side. If Firebase cloud
  sync is completed later, note that Firebase's web config values
  (apiKey, authDomain, projectId, etc.) are *meant* to be public/client-
  exposed by design — Firebase's real security boundary is server-side
  Firestore security rules, not secrecy of those values — so even
  finishing that feature would not introduce a traditional secret to
  protect, though it would be the project's first real external
  credential of any kind.

### Files outside the repo
- **None.** No files were uploaded into this conversation by the user, and
  nothing was generated that lives outside the repository — every
  deliverable from this project's entire history is already committed
  inside `yehudakogan770/livechords`. See "Files in handoff-files/" below.

### Anything UNCONFIRMED
- Whether the user has other GitHub repositories relevant to this project.
  Early in this conversation they asked a one-off question about whether
  "all my projects" (i.e. all their GitHub repos) could be made public;
  that question was answered in isolation and nothing beyond this repo was
  ever touched or referenced again.
- Whether "stagecue" (the Render-hosted app mentioned once) has anything
  worth reusing here — never explored, since the user chose not to go the
  Render route for LiveChords.

---

## What's finished / what's left / what was skipped (and why)

**Finished**: everything in "Everything built, and how it's structured"
above — the entire feature set requested across this project's whole
history, tested in a real browser, committed, and live.

**Left (the one real gap)**: Cloud sync / multi-device accounts via
Firebase. Concretely, the next session needs the user to:
1. Go to https://console.firebase.google.com, sign in with any Google
   account, click "Add project," name it (e.g. "livechords"), create it
   (Analytics can stay off).
2. Build → Authentication → Get started → enable "Email/Password".
3. Build → Firestore Database → Create database → production mode → pick a
   region.
4. Project settings (gear icon) → General → Your apps → the `</>` web icon
   → register an app called "LiveChords" → it shows a `firebaseConfig`
   object (apiKey, authDomain, projectId, storageBucket,
   messagingSenderId, appId) — the user pastes that back to Claude (safe
   to share directly in chat, see "Environment variables" above for why).

Once that config exists, the remaining build work (not yet started, no
code written) is:
- Add the Firebase SDK, build sign-in/sign-up UI (email/password) and an
  auth-state provider.
- Build a Firestore sync layer mirroring the existing `storage.ts`
  interface (songs/setlists/settings), keeping `localStorage` as an
  offline-first cache the way Firestore's own SDK supports natively.
- On first sign-in, migrate a user's existing local data into Firestore
  rather than discarding it.
- Write Firestore security rules scoping each user to their own data only,
  and verify the whole flow end-to-end in a real browser before calling it
  done (same standard as everything else in this project).

**Skipped, and why**:
- A handful of `npm audit` findings (2 moderate, 4 high) in dev/build
  tooling (vitest's mocker, brace-expansion, fast-uri, nanoid,
  source-map-js) — all transitive dev dependencies, none shipped in the
  production bundle. `npm audit fix` was attempted and hit an unrelated
  npm tooling bug (a null-pointer crash in npm's own dependency-graph
  resolution, not a project issue); not worth chasing further given these
  don't affect the deployed app. Worth revisiting with a clean npm
  install/newer npm at some point, but not urgent.
- An onboarding/tips panel for an empty Library was once offered as an
  optional idea early in this project and the user never asked for it —
  not built, not currently planned.

---

## Files in `handoff-files/`

Nothing. No files were ever uploaded into this conversation, and nothing
was generated that lives outside this repository — every deliverable is
already committed here. The folder contains only a short note saying so
(so git can track the folder's existence).

---

## Full conversation summary, start to finish

1. **Original request** (GitHub-issue-style): build "Hands-free chord/lyrics
   display with auto-scroll" from scratch. Built the whole initial app:
   React 19 + TypeScript + Vite + Tailwind v4 PWA, ChordPro-lite parser,
   transpose engine, `requestAnimationFrame`-based auto-scroll (found and
   fixed the sub-pixel `scrollTop` rounding bug here), foot-pedal/touch
   input, Stage View, Library, Setlists, Settings, PWA manifest/offline
   caching. Deployed to GitHub Pages (PR #1) — the user manually flipped
   Settings → Pages → Source to "GitHub Actions" themselves (Claude has no
   API access to that setting) and fixed one additional Pages-environment
   snag themselves after Claude diagnosed it.
2. User confirmed the site was live, asked about making repos public, and
   asked for a security audit of this specific repo before making it
   public (Claude searched the whole git history for secrets/PII — none
   found).
3. "Beautiful! Anything else we should add" → user asked for photo-to-chart
   OCR. Given a choice between a paid vision API and free on-device OCR,
   user chose free (Tesseract.js). Built the OCR reconstruction algorithm
   (chord/lyric line-pairing via word positions) and wired it into the
   editor (PR #2).
4. User asked for songs organized by artist/style (added a Style field +
   Library grouping), explicit responsive-design requirements for
   phone/tablet (caught and fixed a real breakpoint bug — `xl:` never
   activates at real tablet widths, switched to `lg:`), teleprompter-style
   center-screen auto-scroll (explicit request), and print/PDF export for
   chord sheets (found and fixed a real bug — the dark theme leaked through
   into print output; fixed with `print:` variants) (PR #3, #4).
5. **"make it pro profetional add everything that someone would want"** —
   Claude asked clarifying questions (which feature batches; whether to
   include cloud sync) rather than guessing. User said "all" batches and
   "add accounts + cloud sync." Claude explained cloud sync needs the
   user's own Firebase project (gave setup steps) and built everything else
   immediately: Polish/UX batch (theme, favorites, Library search/sort,
   bulk actions, in-app confirm/toast replacing browser popups, PWA install
   banner, better empty states), Musician-tools batch (capo display,
   Nashville numbers, chord diagrams, metronome + tap-tempo, pedal-detect
   helper), Library/setlist-tools batch (drag-and-drop setlist reorder,
   per-song setlist notes, print-whole-setlist-as-PDF, duplicate song) —
   all as PR #5.
6. **"add every thing that could be usefull plus more even usless stuff but
   not to much"** — added Undo on every delete, `/`/`?` keyboard shortcuts,
   single-song import/export as plain text, and one small Konami-code
   easter egg (deliberately kept out of Stage View) — folded into PR #5
   before merge.
7. **"lounch everything"** — merged PR #5, verified the redeploy succeeded.
8. **"add everything that might ever be usefull"** — Claude pushed back
   with an honest recommendation rather than continuing to guess at more
   features (real risk of over-stuffing a tool meant to stay simple on
   stage), via a structured choice: stop here / add a guitar tuner / small
   polish only. User chose the guitar tuner.
9. Mid-build of the tuner, **user gave pivotal architectural feedback**:
   *"have it with a ton of tools and then when you press live it only
   gives you what you need and it should be customizeble."* Claude built
   the Stage View customization system first (Settings → Customize Stage
   View — play/pause always shown, everything else opt-in), since it
   reframed how the tuner and all future tools should fit in, then finished
   the tuner: on-device Web Audio autocorrelation pitch detection, its own
   page, deliberately not part of Stage View. Two real algorithmic bugs
   were found and fixed via synthetic-signal unit tests before this ever
   reached a browser: (1) unnormalized autocorrelation biased toward short
   lags, (2) picking the single strongest correlation peak could lock onto
   a subharmonic (e.g. 1/5th the true frequency) instead of the true
   fundamental. All part of PR #6.
10. User asked for a Transpose field in the Song Editor (previously only
    adjustable live in Stage View) — added, with a "plays in X" key
    preview (PR #6).
11. **"make it have accounts so i can use mutpul devices"** — the long
    cloud-sync back-and-forth documented in full in "Key decisions" above:
    Firebase agreed to → config never sent → user pushed for zero external
    sites, citing a different Render-hosted app of theirs ("stagecue") →
    Claude explained Render is also an external account → user explicitly
    rejected Render too → Claude laid out the complete honest option set
    (external-account server / peer-to-peer device sync, not built / manual
    export-import, already built) → user ultimately chose to accept one
    external account (Firebase) after all → Claude re-sent the same setup
    steps → **still not completed as of this handoff**, the one open item.
12. **"and when i press the setings tab it should open and when i press it
    agein it should close and it should be a pop up tab not its own page"**
    — converted Settings from a route to a popup/modal (shared React
    context so it works from both the main nav and Stage View's own top
    bar). Found and fixed a real cross-viewport bug via Playwright testing
    at a mobile viewport width (see "Key decisions" above for detail) (PR
    #6).
13. **"it should be able to read PDFs"** — built PDF chart import reading a
    PDF's real embedded text layer via pdf.js, reusing the exact same
    chord/lyric reconstruction algorithm the OCR photo scanner uses.
    Bundled pdf.js locally (not a CDN) and excluded it from the PWA
    precache. Verified against a real PDF generated by Playwright itself
    from HTML crafted to mimic genuine chord-chart typesetting, which
    caught a real bug (an empty text item carrying pdf.js's line-boundary
    signal was being discarded before that signal was read, silently
    merging two lines) (PR #6).
14. User said "Yes" (merge PR #6) → merged, redeploy verified successful,
    branch restarted from the new `main`.
15. A background tool interruption briefly left one commit unpushed
    mid-conversation (resolved immediately once noticed — nothing was ever
    actually lost). User then re-asked for the Settings toggle behavior,
    suspecting it wasn't working; Claude re-verified the code was already
    correct (confirmed by re-reading the exact files) and explained the
    near-certain cause: a PWA/browser still running the previously-loaded
    JavaScript until fully closed and reopened, not a real bug. Gave a
    concrete fix (fully close and reopen the app, or hard-refresh). Also
    explicitly declined to keep adding more speculative features when
    invited to ("add whatever else you want"), given how much had already
    been built, and suggested real gig usage as the better source of what
    to build next.
16. **This handoff** — the user is moving to a new Claude account and this
    chat will not transfer. Asked for: saving everything (already clean,
    nothing was uncommitted), finishing anything in progress (nothing was,
    beyond the already-understood cloud-sync blocker), mapping where
    everything lives, collecting any external files (none existed),
    writing `CLAUDE.md` and this `HANDOFF.md`, and a final report with a
    checklist of what the new account will need access to.
