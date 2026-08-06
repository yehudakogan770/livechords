import { useSyncExternalStore } from 'react';
import { dismissInstallPrompt, getCanInstall, getIsInstalled, promptInstall, subscribeInstallState } from './installPrompt';

export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(subscribeInstallState, getCanInstall);
  const installed = useSyncExternalStore(subscribeInstallState, getIsInstalled);
  return { canInstall, installed, promptInstall, dismiss: dismissInstallPrompt };
}
