import type { ReactNode } from 'react';
import {
  IconChevronLeft,
  IconLock,
  IconMinus,
  IconPause,
  IconPlay,
  IconPlus,
  IconRestart,
  IconSettings,
} from './icons';

interface SetlistPosition {
  index: number;
  total: number;
  name: string;
}

interface StageTopBarProps {
  visible: boolean;
  title: string;
  artist: string;
  displayKey: string | null;
  transposeOffset: number;
  setlistPosition: SetlistPosition | null;
  wakeLockActive: boolean;
  onBack: () => void;
  onSettings: () => void;
}

export function StageTopBar({
  visible,
  title,
  artist,
  displayKey,
  transposeOffset,
  setlistPosition,
  wakeLockActive,
  onBack,
  onSettings,
}: StageTopBarProps) {
  return (
    <div
      className={`bg-stage-panel/90 border-stage-edge fixed inset-x-0 top-0 z-20 flex items-center gap-3 border-b px-3 py-2 backdrop-blur transition-transform duration-300 ${
        visible ? 'translate-y-0 pointer-events-auto' : '-translate-y-full pointer-events-none'
      }`}
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        className="text-stage-text flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/10"
      >
        <IconChevronLeft className="h-6 w-6" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base leading-tight font-semibold">{title}</p>
        <p className="text-stage-muted truncate text-sm leading-tight">
          {artist || 'Unknown artist'}
          {setlistPosition ? ` · ${setlistPosition.name} ${setlistPosition.index + 1}/${setlistPosition.total}` : ''}
        </p>
      </div>

      {displayKey && (
        <div className="text-stage-chord border-stage-edge shrink-0 rounded-full border px-3 py-1 text-sm font-semibold">
          {displayKey}
          {transposeOffset !== 0 && (
            <span className="text-stage-muted ml-1 font-normal">
              ({transposeOffset > 0 ? '+' : ''}
              {transposeOffset})
            </span>
          )}
        </div>
      )}

      {wakeLockActive && (
        <span className="text-stage-accent shrink-0" title="Screen will stay awake">
          <IconLock className="h-4 w-4" />
        </span>
      )}

      <button
        type="button"
        aria-label="Settings"
        onClick={onSettings}
        className="text-stage-text flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/10"
      >
        <IconSettings className="h-5 w-5" />
      </button>
    </div>
  );
}

interface StageBottomBarProps {
  visible: boolean;
  playing: boolean;
  transposeLabel: string;
  scrollSpeed: number;
  fontSizePx: number;
  canSyncTempo: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onFontDown: () => void;
  onFontUp: () => void;
  onTransposeDown: () => void;
  onTransposeUp: () => void;
  onSpeedDown: () => void;
  onSpeedUp: () => void;
  onSyncTempo: () => void;
}

function ControlGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="bg-stage-bg/60 flex items-center gap-1 rounded-full p-1">{children}</div>
      <span className="text-stage-muted text-[0.65rem] tracking-wide uppercase">{label}</span>
    </div>
  );
}

function RoundButton({
  onClick,
  label,
  children,
  emphasize,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  emphasize?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95 ${
        emphasize ? 'bg-stage-accent text-stage-bg' : 'text-stage-text active:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

export function StageBottomBar({
  visible,
  playing,
  transposeLabel,
  scrollSpeed,
  fontSizePx,
  canSyncTempo,
  onTogglePlay,
  onRestart,
  onFontDown,
  onFontUp,
  onTransposeDown,
  onTransposeUp,
  onSpeedDown,
  onSpeedUp,
  onSyncTempo,
}: StageBottomBarProps) {
  return (
    <div
      className={`bg-stage-panel/90 border-stage-edge fixed inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-center gap-x-6 gap-y-3 border-t px-4 pt-3 backdrop-blur transition-transform duration-300 ${
        visible ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
      }`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <ControlGroup label={`Text ${fontSizePx}px`}>
        <RoundButton label="Smaller text" onClick={onFontDown}>
          <IconMinus className="h-5 w-5" />
        </RoundButton>
        <RoundButton label="Bigger text" onClick={onFontUp}>
          <IconPlus className="h-5 w-5" />
        </RoundButton>
      </ControlGroup>

      <ControlGroup label={`Key ${transposeLabel}`}>
        <RoundButton label="Transpose down" onClick={onTransposeDown}>
          <IconMinus className="h-5 w-5" />
        </RoundButton>
        <RoundButton label="Transpose up" onClick={onTransposeUp}>
          <IconPlus className="h-5 w-5" />
        </RoundButton>
      </ControlGroup>

      <ControlGroup label={`Scroll ${scrollSpeed}px/s`}>
        <RoundButton label="Scroll slower" onClick={onSpeedDown}>
          <IconMinus className="h-5 w-5" />
        </RoundButton>
        <RoundButton label={playing ? 'Pause auto-scroll' : 'Play auto-scroll'} onClick={onTogglePlay} emphasize>
          {playing ? <IconPause className="h-5 w-5" /> : <IconPlay className="h-5 w-5" />}
        </RoundButton>
        <RoundButton label="Scroll faster" onClick={onSpeedUp}>
          <IconPlus className="h-5 w-5" />
        </RoundButton>
      </ControlGroup>

      <ControlGroup label="Restart">
        <RoundButton label="Restart from top" onClick={onRestart}>
          <IconRestart className="h-5 w-5" />
        </RoundButton>
        {canSyncTempo && (
          <button
            type="button"
            onClick={onSyncTempo}
            className="text-stage-bg bg-stage-accent h-11 shrink-0 rounded-full px-3 text-xs font-semibold active:scale-95"
          >
            Sync to tempo
          </button>
        )}
      </ControlGroup>
    </div>
  );
}
