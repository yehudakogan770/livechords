import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface SettingsPanelValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SettingsPanelContext = createContext<SettingsPanelValue | null>(null);

export function SettingsPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close]);

  return <SettingsPanelContext.Provider value={value}>{children}</SettingsPanelContext.Provider>;
}

export function useSettingsPanel(): SettingsPanelValue {
  const ctx = useContext(SettingsPanelContext);
  if (!ctx) throw new Error('useSettingsPanel must be used within a SettingsPanelProvider');
  return ctx;
}
