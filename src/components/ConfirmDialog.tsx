import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  message: string;
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<((message: string, options?: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((message: string, options: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve, ...options });
    });
  }, []);

  function respond(value: boolean) {
    state?.resolve(value);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 print:hidden"
          onClick={() => respond(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="border-stage-edge bg-stage-panel w-full max-w-sm rounded-xl border p-5 shadow-xl"
          >
            {state.title && <h2 className="mb-1 font-semibold">{state.title}</h2>}
            <p className="text-stage-text text-sm">{state.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => respond(false)}
                className="text-stage-muted rounded-full px-4 py-2 text-sm font-semibold"
              >
                {state.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => respond(true)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  state.danger ? 'bg-red-500 text-white' : 'bg-stage-accent text-stage-bg'
                }`}
              >
                {state.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (message: string, options?: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
