import { NavLink } from 'react-router';
import { IconListMusic, IconMic, IconSettings } from './icons';

const linkBase = 'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors';
const linkActive = 'bg-stage-accent text-stage-bg';
const linkInactive = 'text-stage-muted hover:text-stage-text';

export function NavBar() {
  return (
    <header className="border-stage-edge bg-stage-panel/80 sticky top-0 z-20 border-b backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <NavLink to="/" end className="text-stage-text mr-1 flex items-center gap-1.5 text-base font-bold">
          <IconMic className="text-stage-accent h-5 w-5" />
          LiveChords
        </NavLink>
        <nav className="flex flex-1 items-center gap-1.5">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            Songs
          </NavLink>
          <NavLink to="/setlists" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <IconListMusic className="h-4 w-4" />
            Setlists
          </NavLink>
        </nav>
        <NavLink
          to="/settings"
          aria-label="Settings"
          className={({ isActive }) =>
            `flex h-9 w-9 items-center justify-center rounded-full ${isActive ? 'bg-stage-accent text-stage-bg' : 'text-stage-muted hover:text-stage-text'}`
          }
        >
          <IconSettings className="h-5 w-5" />
        </NavLink>
      </div>
    </header>
  );
}
