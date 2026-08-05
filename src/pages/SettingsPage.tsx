import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { inputClass, labelClass, sectionClass } from '../components/formStyles';
import { DEFAULT_SETTINGS, exportBackup, getSettings, importBackup, saveSettings, type BackupBundle } from '../data/storage';
import { PEDAL_ACTIONS } from '../types';
import type { AccidentalPreference, AppSettings, PedalAction } from '../types';

function formatKeyName(key: string): string {
  return key === ' ' ? 'Space' : key;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [listeningFor, setListeningFor] = useState<PedalAction | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update(patch: Partial<AppSettings> | ((prev: AppSettings) => Partial<AppSettings>)) {
    setSettings((prev) => {
      const patchObj = typeof patch === 'function' ? patch(prev) : patch;
      const next = { ...prev, ...patchObj };
      saveSettings(next);
      return next;
    });
  }

  useEffect(() => {
    if (!listeningFor) return;
    const action = listeningFor;
    function handleKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      update((prev) => ({ pedalKeyMap: { ...prev.pedalKeyMap, [e.key]: action } }));
      setListeningFor(null);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listeningFor]);

  function removeBinding(key: string) {
    update((prev) => {
      const nextMap = { ...prev.pedalKeyMap };
      delete nextMap[key];
      return { pedalKeyMap: nextMap };
    });
  }

  function resetBindings() {
    if (!window.confirm('Reset pedal key bindings to the defaults?')) return;
    update({ pedalKeyMap: { ...DEFAULT_SETTINGS.pedalKeyMap } });
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livechords-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm('Import this backup? It will replace all current songs, setlists, and settings.')) return;
    try {
      const bundle = JSON.parse(await file.text()) as BackupBundle;
      importBackup(bundle);
      setImportMessage('Backup imported. Reloading…');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setImportMessage('That file could not be read as a LiveChords backup.');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>

      <div className="flex flex-col gap-6">
        <section className={sectionClass}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Foot pedal &amp; keyboard shortcuts</h2>
            <button type="button" onClick={resetBindings} className="text-stage-accent text-xs font-medium">
              Reset to defaults
            </button>
          </div>
          <p className="text-stage-muted mb-3 text-sm">
            Most Bluetooth/USB page-turner pedals act like a keyboard. Plug in or pair your pedal, click "Add key" next
            to an action, then press the pedal.
          </p>
          <ul className="flex flex-col gap-2">
            {PEDAL_ACTIONS.map(({ action, label }) => {
              const keys = Object.entries(settings.pedalKeyMap)
                .filter(([, a]) => a === action)
                .map(([key]) => key);
              return (
                <li key={action} className="flex flex-wrap items-center gap-2">
                  <span className="w-40 shrink-0 text-sm">{label}</span>
                  {keys.map((key) => (
                    <span
                      key={key}
                      className="border-stage-edge bg-stage-bg flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                    >
                      {formatKeyName(key)}
                      <button
                        type="button"
                        aria-label={`Remove ${formatKeyName(key)} binding`}
                        onClick={() => removeBinding(key)}
                        className="text-stage-muted hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setListeningFor(action)}
                    className={`rounded-full border px-2 py-1 text-xs font-medium ${
                      listeningFor === action
                        ? 'border-stage-accent text-stage-accent animate-pulse'
                        : 'border-stage-edge text-stage-muted'
                    }`}
                  >
                    {listeningFor === action ? 'Press a key…' : '+ Add key'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="mb-3 font-semibold">Display defaults</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="default-font">
                Default text size (px)
              </label>
              <input
                id="default-font"
                type="number"
                min={18}
                max={120}
                className={inputClass}
                value={settings.defaultFontSizePx}
                onChange={(e) => update({ defaultFontSizePx: Number(e.target.value) || DEFAULT_SETTINGS.defaultFontSizePx })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="default-speed">
                Default scroll speed (px/s)
              </label>
              <input
                id="default-speed"
                type="number"
                min={4}
                max={200}
                className={inputClass}
                value={settings.defaultScrollSpeed}
                onChange={(e) =>
                  update({ defaultScrollSpeed: Number(e.target.value) || DEFAULT_SETTINGS.defaultScrollSpeed })
                }
              />
            </div>
          </div>
          <p className="text-stage-muted mt-1 text-xs">Used for new songs that don't have a BPM set yet.</p>

          <div className="mt-4">
            <label className={labelClass} htmlFor="accidental-pref">
              Sharp / flat spelling when transposing
            </label>
            <select
              id="accidental-pref"
              className={inputClass}
              value={settings.accidentalPreference}
              onChange={(e) => update({ accidentalPreference: e.target.value as AccidentalPreference })}
            >
              <option value="auto">Auto (match the original chord's spelling)</option>
              <option value="sharp">Always sharps (F#, C#…)</option>
              <option value="flat">Always flats (Gb, Db…)</option>
            </select>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="mb-3 font-semibold">Stage behavior</h2>
          <label className="flex items-center justify-between gap-3 py-1.5 text-sm">
            Keep screen awake during performance
            <input
              type="checkbox"
              checked={settings.keepScreenAwake}
              onChange={(e) => update({ keepScreenAwake: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between gap-3 py-1.5 text-sm">
            Auto-advance to the next song when a setlist song finishes scrolling
            <input
              type="checkbox"
              checked={settings.autoAdvanceToNextInSetlist}
              onChange={(e) => update({ autoAdvanceToNextInSetlist: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
        </section>

        <section className={sectionClass}>
          <h2 className="mb-3 font-semibold">Backup</h2>
          <p className="text-stage-muted mb-3 text-sm">
            Everything is stored on this device only. Export a backup before switching devices or clearing browser
            data.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="bg-stage-panel border-stage-edge rounded-full border px-4 py-2 text-sm font-semibold"
            >
              Export backup
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-stage-panel border-stage-edge rounded-full border px-4 py-2 text-sm font-semibold"
            >
              Import backup
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </div>
          {importMessage && <p className="text-stage-muted mt-2 text-sm">{importMessage}</p>}
        </section>
      </div>
    </div>
  );
}
