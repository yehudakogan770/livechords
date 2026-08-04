import { useEffect, useRef } from 'react';
import type { PedalAction, PedalKeyMap } from '../types';

interface UsePedalInputOptions {
  keyMap: PedalKeyMap;
  onAction: (action: PedalAction) => void;
  enabled?: boolean;
}

/**
 * Listens for keystrokes from Bluetooth/USB page-turner pedals (AirTurn,
 * PageFlip, iRig BlueTurn, and similar footswitches all enumerate as a
 * plain HID keyboard and emit configurable keys — typically arrows, Page
 * Up/Down, or Space) and routes them through the user's pedal→action
 * mapping. Ignored while focus is in a text field so it never hijacks typing.
 */
export function usePedalInput({ keyMap, onAction, enabled = true }: UsePedalInputOptions): void {
  const keyMapRef = useRef(keyMap);
  const onActionRef = useRef(onAction);
  keyMapRef.current = keyMap;
  onActionRef.current = onAction;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }
      const action = keyMapRef.current[event.key];
      if (!action) return;
      event.preventDefault();
      onActionRef.current(action);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
