import { useCallback, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { Confetti } from './components/Confetti';
import { ConfirmProvider } from './components/ConfirmDialog';
import { InstallBanner } from './components/InstallBanner';
import { NavBar } from './components/NavBar';
import { SettingsPanel } from './components/SettingsPanel';
import { ToastProvider, useToast } from './components/Toast';
import { SettingsPanelProvider } from './lib/SettingsPanelContext';
import { ThemeProvider } from './lib/ThemeContext';
import { useKonamiCode } from './lib/useKonamiCode';
import LibraryPage from './pages/LibraryPage';
import SetlistEditorPage from './pages/SetlistEditorPage';
import SetlistsPage from './pages/SetlistsPage';
import SongEditorPage from './pages/SongEditorPage';
import StagePage from './pages/StagePage';
import TunerPage from './pages/TunerPage';

function AppLayout() {
  const showToast = useToast();
  const [confettiActive, setConfettiActive] = useState(false);

  const triggerEasterEgg = useCallback(() => {
    setConfettiActive(true);
    showToast('🎸 Rock on! You found the secret.');
  }, [showToast]);
  useKonamiCode(triggerEasterEgg);

  return (
    <div className="bg-stage-bg text-stage-text min-h-dvh print:bg-white print:text-black">
      <NavBar />
      <InstallBanner />
      <main>
        <Outlet />
      </main>
      {confettiActive && <Confetti onDone={() => setConfettiActive(false)} />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <SettingsPanelProvider>
            <Routes>
              {/* Stage View owns the full screen with its own chrome — no library nav bar. */}
              <Route path="/stage/:songId" element={<StagePage />} />

              <Route element={<AppLayout />}>
                <Route path="/" element={<LibraryPage />} />
                <Route path="/song/new" element={<SongEditorPage />} />
                <Route path="/song/:songId/edit" element={<SongEditorPage />} />
                <Route path="/setlists" element={<SetlistsPage />} />
                <Route path="/setlists/:setlistId" element={<SetlistEditorPage />} />
                <Route path="/tuner" element={<TunerPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            {/* Rendered outside the route tree so it overlays Stage View too, not just AppLayout pages. */}
            <SettingsPanel />
          </SettingsPanelProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
