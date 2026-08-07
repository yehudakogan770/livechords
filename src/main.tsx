import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import App from './App.tsx';
import './index.css';
// Side-effect import: registers the beforeinstallprompt/appinstalled listeners as
// early as possible, before React mounts, so an early-firing event isn't missed.
import './lib/installPrompt';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
