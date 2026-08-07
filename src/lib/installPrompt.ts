interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredEvent: BeforeInstallPromptEvent | null = null;
let dismissedThisSession = false;
let installedFlag = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredEvent = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredEvent = null;
    installedFlag = true;
    notify();
  });
}

export function subscribeInstallState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCanInstall(): boolean {
  return deferredEvent !== null && !dismissedThisSession;
}

export function getIsInstalled(): boolean {
  return installedFlag;
}

export function dismissInstallPrompt(): void {
  dismissedThisSession = true;
  notify();
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredEvent) return 'unavailable';
  const event = deferredEvent;
  await event.prompt();
  const choice = await event.userChoice;
  deferredEvent = null;
  notify();
  return choice.outcome;
}
