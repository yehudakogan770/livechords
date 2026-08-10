import { IconDownload, IconX } from './icons';
import { useInstallPrompt } from '../lib/useInstallPrompt';

export function InstallBanner() {
  const { canInstall, installed, promptInstall, dismiss } = useInstallPrompt();
  if (!canInstall || installed) return null;

  return (
    <div className="bg-stage-accent/10 border-stage-accent/30 text-stage-text flex items-center gap-3 border-b px-4 py-2 text-sm print:hidden">
      <IconDownload className="text-stage-accent h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1">Install LiveChords for quick, full-screen access — works offline once installed.</p>
      <button
        type="button"
        onClick={() => promptInstall()}
        className="bg-stage-accent text-stage-bg shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
      >
        Install
      </button>
      <button type="button" aria-label="Dismiss install prompt" onClick={dismiss} className="text-stage-muted shrink-0">
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}
