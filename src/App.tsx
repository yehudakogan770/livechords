import { Navigate, Outlet, Route, Routes } from 'react-router';
import { ConfirmProvider } from './components/ConfirmDialog';
import { InstallBanner } from './components/InstallBanner';
import { NavBar } from './components/NavBar';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './lib/ThemeContext';
import LibraryPage from './pages/LibraryPage';
import SetlistEditorPage from './pages/SetlistEditorPage';
import SetlistsPage from './pages/SetlistsPage';
import SettingsPage from './pages/SettingsPage';
import SongEditorPage from './pages/SongEditorPage';
import StagePage from './pages/StagePage';

function AppLayout() {
  return (
    <div className="bg-stage-bg text-stage-text min-h-dvh print:bg-white print:text-black">
      <NavBar />
      <InstallBanner />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            {/* Stage View owns the full screen with its own chrome — no library nav bar. */}
            <Route path="/stage/:songId" element={<StagePage />} />

            <Route element={<AppLayout />}>
              <Route path="/" element={<LibraryPage />} />
              <Route path="/song/new" element={<SongEditorPage />} />
              <Route path="/song/:songId/edit" element={<SongEditorPage />} />
              <Route path="/setlists" element={<SetlistsPage />} />
              <Route path="/setlists/:setlistId" element={<SetlistEditorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
