import { useEffect, useRef, useState } from 'react';
import { exportBackup, importBackup } from '../db';
import { getVoices, loadVoiceSettings, saveVoiceSettings, speak, speechSupported } from '../speech';

export default function Settings() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState(loadVoiceSettings);
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getVoices().then((v) => {
      const lang = navigator.language.slice(0, 2);
      // Put voices in the phone's language first.
      setVoices([...v].sort((a, b) => Number(b.lang.startsWith(lang)) - Number(a.lang.startsWith(lang)) || a.name.localeCompare(b.name)));
    });
  }, []);

  const update = (s: typeof settings) => { setSettings(s); saveVoiceSettings(s); };

  const doExport = async () => {
    const data = await exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const name = `recipes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const f = new File([blob], name, { type: 'application/json' });
    // On iPhone the share sheet lets you save to Files, AirDrop or email it.
    if (navigator.canShare?.({ files: [f] })) {
      try { await navigator.share({ files: [f], title: 'Recipe backup' }); return; } catch { /* cancelled */ return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    URL.revokeObjectURL(a.href);
  };

  const doImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await importBackup(JSON.parse(await f.text()));
      setMsg(`Imported ${res.recipes} recipes and ${res.grocery} grocery items.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not read that file.');
    }
    e.target.value = '';
  };

  return (
    <>
      <header className="topbar"><h1>Settings</h1></header>

      <section className="section card pad-card">
        <h2>Voice</h2>
        {!speechSupported ? <p className="error">Read-aloud isn't available in this browser.</p> : (
          <>
            <div className="field">
              <label htmlFor="voice">Reading voice</label>
              <select id="voice" value={settings.voiceURI ?? ''} onChange={(e) => update({ ...settings, voiceURI: e.target.value || null })}>
                <option value="">Default</option>
                {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
              </select>
              <p className="hint">Better voices: iPhone Settings → Accessibility → Spoken Content → Voices → download an "Enhanced" voice.</p>
            </div>
            <div className="field">
              <label htmlFor="rate">Speed: {settings.rate.toFixed(1)}×</label>
              <input id="rate" type="range" min={0.6} max={1.6} step={0.1} value={settings.rate}
                onChange={(e) => update({ ...settings, rate: Number(e.target.value) })} />
            </div>
            <button className="btn secondary" onClick={() => speak('Step 1. Preheat the oven to 180 degrees.')}>Test voice</button>
          </>
        )}
      </section>

      <section className="section card pad-card">
        <h2>Backup</h2>
        <p className="muted">Recipes are saved only on this phone. Export a backup now and then so you don't lose them.</p>
        <div className="row-btns">
          <button className="btn secondary" onClick={doExport}>Export backup</button>
          <button className="btn secondary" onClick={() => file.current?.click()}>Import backup</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={doImport} />
        </div>
        {msg && <p className="hint" role="status">{msg}</p>}
      </section>

      <section className="section card pad-card">
        <h2>Install on iPhone</h2>
        <p className="muted">In Safari tap <b>Share</b> → <b>Add to Home Screen</b>. It then opens full screen, works offline, and keeps your saved recipes.</p>
      </section>
    </>
  );
}
