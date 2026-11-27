import { useEffect, useState } from 'react';
import { authErrorMessage, sendPasswordReset, signIn, signInWithGitHub, signOut, signUp, syncNow, takeOAuthError, updatePassword, useSyncStatus } from '../sync';
import Icon from './Icon';

function ago(t: number | null) {
  if (!t) return 'not yet';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
}

/** Sign in / sign up and sync status, shown in Settings. */
export default function AccountCard() {
  const st = useSyncStatus();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(() => {
    const e = takeOAuthError();
    return e ? { text: authErrorMessage(new Error(e)), bad: true } : null;
  });
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 30_000); return () => clearInterval(i); }, []);

  if (!st.configured) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ text: authErrorMessage(e), bad: true }); }
    setBusy(false);
  };

  if (st.recovering) {
    return (
      <section className="section card pad-card">
        <h2>Choose a new password</h2>
        <form onSubmit={(e) => { e.preventDefault(); run(async () => { await updatePassword(password); setPassword(''); setMsg({ text: 'Password updated.' }); }); }}>
          <div className="field">
            <label htmlFor="np">New password</label>
            <input id="np" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn primary" disabled={busy}>Save password</button>
        </form>
        {msg && <p className={msg.bad ? 'error' : 'hint'} role="status">{msg.text}</p>}
      </section>
    );
  }

  if (st.email) {
    return (
      <section className="section card pad-card">
        <h2>Account & sync</h2>
        <p className="muted small-text">Signed in as <b>{st.email}</b>. Your recipes and grocery list are saved to your account and sync between your devices.</p>
        <p className={'sync-line ' + st.state}>
          <span className="dot" aria-hidden="true" />
          {st.state === 'syncing' ? 'Syncing…'
            : st.state === 'offline' ? 'Offline — changes will upload when you reconnect'
            : st.state === 'error' ? 'Sync problem'
            : `Synced ${ago(st.lastSync)}`}
        </p>
        {st.error && <p className="error small-text">{st.error}</p>}
        <div className="row-btns">
          <button className="btn secondary" disabled={st.state === 'syncing'} onClick={() => void syncNow()}><Icon name="repeat" size={18} /> Sync now</button>
          <button className="btn ghost" disabled={busy} onClick={() => {
            if (confirm('Sign out? Your recipes stay safe in your account and come back when you sign in again. They will be removed from this phone.')) run(signOut);
          }}>Sign out</button>
        </div>
        {msg && <p className={msg.bad ? 'error' : 'hint'} role="status">{msg.text}</p>}
      </section>
    );
  }

  const submit = (mode: 'in' | 'up') => run(async () => {
    if (!email.trim() || password.length < 6) throw new Error(password.length < 6 ? 'Password should be at least 6 characters' : 'Enter your email');
    if (mode === 'in') { await signIn(email.trim(), password); setPassword(''); return; }
    const ready = await signUp(email.trim(), password);
    setPassword('');
    setMsg({ text: ready ? 'Account created — syncing now.' : 'Account created! Check your email and tap the confirmation link, then come back and sign in.' });
  });

  return (
    <section className="section card pad-card">
      <h2>Account & sync</h2>
      <p className="muted small-text">Sign in to back up your recipes and grocery list and use them on all your devices. Without an account everything stays on this phone only.</p>
      <button className="btn github block" disabled={busy} onClick={() => run(signInWithGitHub)}>
        <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
        Continue with GitHub
      </button>
      <div className="or"><span>or use email</span></div>
      <form onSubmit={(e) => { e.preventDefault(); submit('in'); }}>
        <div className="field">
          <label htmlFor="em">Email</label>
          <input id="em" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" autoComplete="current-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="row-btns">
          <button className="btn primary" type="submit" disabled={busy}>Sign in</button>
          <button className="btn secondary" type="button" disabled={busy} onClick={() => submit('up')}>Create account</button>
        </div>
      </form>
      <button className="link" disabled={busy} onClick={() => run(async () => {
        if (!email.trim()) throw new Error('Enter your email above first');
        await sendPasswordReset(email.trim());
        setMsg({ text: 'If that email has an account, a reset link is on its way.' });
      })}>Forgot password?</button>
      {msg && <p className={msg.bad ? 'error' : 'hint'} role="status">{msg.text}</p>}
    </section>
  );
}
