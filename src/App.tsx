import { Navigate, Outlet, Route, Routes } from 'react-router';
import { NavBar } from './components/NavBar';
import LibraryPage from './pages/LibraryPage';
import SetlistEditorPage from './pages/SetlistEditorPage';
import SetlistsPage from './pages/SetlistsPage';
import SettingsPage from './pages/SettingsPage';
import SongEditorPage from './pages/SongEditorPage';
import StagePage from './pages/StagePage';

function AppLayout() {
  return (
    <div className="bg-stage-bg text-stage-text min-h-dvh">
      <NavBar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
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
  );
}

export default App;
