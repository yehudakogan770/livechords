import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { ChordSheet } from '../components/ChordSheet';
import { StageBottomBar, StageTopBar } from '../components/StageChrome';
import { getSetlist, getSettings, getSong, saveSong } from '../data/storage';
import { parseSong } from '../lib/chordpro';
import { estimateScrollSpeed, MAX_SCROLL_SPEED, MIN_SCROLL_SPEED, SCROLL_SPEED_STEP } from '../lib/scrollSpeed';
import { formatTransposeOffset, transposeChord, transposeContent } from '../lib/transpose';
import { useAutoScroll } from '../lib/useAutoScroll';
import { usePedalInput } from '../lib/usePedalInput';
import { useWakeLock } from '../lib/useWakeLock';
import type { PedalAction, Song } from '../types';

const CONTROLS_HIDE_DELAY_MS = 4000;
const FONT_STEP_PX = 4;
const MIN_FONT_PX = 18;
const MAX_FONT_PX = 120;

interface NavState {
  autoplay?: boolean;
}

export default function StagePage() {
  const { songId } = useParams<{ songId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [settings] = useState(getSettings);
  const [song, setSong] = useState<Song | undefined>(() => (songId ? getSong(songId) : undefined));
  const [transpose, setTranspose] = useState(song?.transpose ?? 0);
  const [scrollSpeed, setScrollSpeed] = useState(song?.scrollSpeed ?? settings.defaultScrollSpeed);
  const [fontSize, setFontSize] = useState(settings.defaultFontSizePx);
  const [controlsVisible, setControlsVisible] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const setlistId = searchParams.get('setlist');
  const setlist = useMemo(() => (setlistId ? getSetlist(setlistId) : undefined), [setlistId]);
  const setlistIndex = setlist && song ? setlist.songIds.indexOf(song.id) : -1;
  const nextSongId = setlist && setlistIndex >= 0 ? setlist.songIds[setlistIndex + 1] : undefined;
  const prevSongId = setlist && setlistIndex > 0 ? setlist.songIds[setlistIndex - 1] : undefined;

  // Reload whenever the route's songId changes (e.g. hands-free next/prev in a setlist).
  useEffect(() => {
    const loaded = songId ? getSong(songId) : undefined;
    setSong(loaded);
    setTranspose(loaded?.transpose ?? 0);
    setScrollSpeed(loaded?.scrollSpeed ?? settings.defaultScrollSpeed);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [songId, settings.defaultScrollSpeed]);

  const parsed = useMemo(() => {
    if (!song) return null;
    const transposed = transposeContent(song.content, transpose, settings.accidentalPreference);
    return parseSong(transposed);
  }, [song, transpose, settings.accidentalPreference]);

  const goToSong = useCallback(
    (id: string, autoplay: boolean) => {
      const qs = setlistId ? `?setlist=${setlistId}` : '';
      navigate(`/stage/${id}${qs}`, { state: { autoplay } satisfies NavState });
    },
    [navigate, setlistId],
  );

  const handleReachEnd = useCallback(() => {
    if (settings.autoAdvanceToNextInSetlist && nextSongId) {
      goToSong(nextSongId, true);
    }
  }, [settings.autoAdvanceToNextInSetlist, nextSongId, goToSong]);

  const autoScroll = useAutoScroll(scrollRef, scrollSpeed, handleReachEnd);
  const { setPlaying } = autoScroll;

  // Auto-start scrolling when we arrived here via hands-free setlist auto-advance.
  useEffect(() => {
    if ((location.state as NavState | null)?.autoplay) {
      setPlaying(true);
    }
  }, [songId, location.state, setPlaying]);

  const bumpControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    bumpControls();
    return () => clearTimeout(hideTimerRef.current);
  }, [bumpControls, songId]);

  const adjustTranspose = useCallback(
    (delta: number) => {
      setTranspose((prev) => {
        const next = prev + delta;
        if (song) saveSong({ ...song, transpose: next });
        return next;
      });
      bumpControls();
    },
    [song, bumpControls],
  );

  const adjustScrollSpeed = useCallback(
    (delta: number) => {
      setScrollSpeed((prev) => {
        const next = Math.min(MAX_SCROLL_SPEED, Math.max(MIN_SCROLL_SPEED, prev + delta));
        if (song) saveSong({ ...song, scrollSpeed: next });
        return next;
      });
      bumpControls();
    },
    [song, bumpControls],
  );

  const syncSpeedToTempo = useCallback(() => {
    if (!song?.bpm) return;
    const next = estimateScrollSpeed(song.bpm, fontSize);
    setScrollSpeed(next);
    saveSong({ ...song, scrollSpeed: next });
    bumpControls();
  }, [song, fontSize, bumpControls]);

  const adjustFontSize = useCallback(
    (delta: number) => {
      setFontSize((prev) => Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, prev + delta)));
      bumpControls();
    },
    [bumpControls],
  );

  const handlePedalAction = useCallback(
    (action: PedalAction) => {
      switch (action) {
        case 'toggleScroll':
          autoScroll.toggle();
          bumpControls();
          break;
        case 'restart':
          autoScroll.restart();
          bumpControls();
          break;
        case 'scrollFaster':
          adjustScrollSpeed(SCROLL_SPEED_STEP);
          break;
        case 'scrollSlower':
          adjustScrollSpeed(-SCROLL_SPEED_STEP);
          break;
        case 'transposeUp':
          adjustTranspose(1);
          break;
        case 'transposeDown':
          adjustTranspose(-1);
          break;
        case 'nextSong':
          if (nextSongId) goToSong(nextSongId, autoScroll.playing);
          break;
        case 'prevSong':
          if (prevSongId) goToSong(prevSongId, autoScroll.playing);
          break;
      }
    },
    [autoScroll, adjustScrollSpeed, adjustTranspose, nextSongId, prevSongId, goToSong, bumpControls],
  );

  usePedalInput({ keyMap: settings.pedalKeyMap, onAction: handlePedalAction });
  const wakeLockActive = useWakeLock(settings.keepScreenAwake);

  if (!song || !parsed) {
    return (
      <div className="bg-stage-bg text-stage-text flex h-dvh flex-col items-center justify-center gap-4">
        <p>Song not found.</p>
        <button type="button" className="bg-stage-panel rounded-full px-4 py-2" onClick={() => navigate('/')}>
          Back to Library
        </button>
      </div>
    );
  }

  const displayKey = song.originalKey
    ? transposeChord(song.originalKey, transpose, settings.accidentalPreference)
    : null;

  return (
    <div className="bg-stage-bg text-stage-text relative h-dvh overflow-hidden">
      <div
        ref={scrollRef}
        onClick={() => {
          autoScroll.toggle();
          bumpControls();
        }}
        className="h-full overflow-y-auto px-4 pt-20 sm:px-12"
      >
        <ChordSheet song={parsed} fontSizePx={fontSize} />
        {/* Trailing space so the last line can scroll clear of the bottom bar instead of stopping flush against it. */}
        <div style={{ height: '28vh' }} aria-hidden="true" />
      </div>

      {prevSongId && (
        <button
          type="button"
          aria-label="Previous song in setlist"
          onClick={() => goToSong(prevSongId, autoScroll.playing)}
          className={`fixed inset-y-0 left-0 z-10 w-14 border-0 bg-transparent outline-none [touch-action:pan-y] sm:w-20 ${controlsVisible ? 'opacity-40' : 'opacity-0'}`}
        >
          <span className="text-stage-text text-2xl">‹</span>
        </button>
      )}
      {nextSongId && (
        <button
          type="button"
          aria-label="Next song in setlist"
          onClick={() => goToSong(nextSongId, autoScroll.playing)}
          className={`fixed inset-y-0 right-0 z-10 w-14 border-0 bg-transparent outline-none [touch-action:pan-y] sm:w-20 ${controlsVisible ? 'opacity-40' : 'opacity-0'}`}
        >
          <span className="text-stage-text text-2xl">›</span>
        </button>
      )}

      <StageTopBar
        visible={controlsVisible}
        title={song.title}
        artist={song.artist}
        displayKey={displayKey}
        transposeOffset={transpose}
        setlistPosition={setlist && setlistIndex >= 0 ? { index: setlistIndex, total: setlist.songIds.length, name: setlist.name } : null}
        wakeLockActive={wakeLockActive}
        onBack={() => navigate(-1)}
        onSettings={() => navigate('/settings')}
      />

      <StageBottomBar
        visible={controlsVisible}
        playing={autoScroll.playing}
        transposeLabel={displayKey ?? formatTransposeOffset(transpose)}
        scrollSpeed={scrollSpeed}
        fontSizePx={fontSize}
        canSyncTempo={Boolean(song.bpm)}
        onTogglePlay={() => {
          autoScroll.toggle();
          bumpControls();
        }}
        onRestart={() => {
          autoScroll.restart();
          bumpControls();
        }}
        onFontDown={() => adjustFontSize(-FONT_STEP_PX)}
        onFontUp={() => adjustFontSize(FONT_STEP_PX)}
        onTransposeDown={() => adjustTranspose(-1)}
        onTransposeUp={() => adjustTranspose(1)}
        onSpeedDown={() => adjustScrollSpeed(-SCROLL_SPEED_STEP)}
        onSpeedUp={() => adjustScrollSpeed(SCROLL_SPEED_STEP)}
        onSyncTempo={syncSpeedToTempo}
      />
    </div>
  );
}
