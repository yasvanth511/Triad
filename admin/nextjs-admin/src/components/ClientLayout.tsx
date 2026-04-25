'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { adminLogin, clearAdminToken, getAdminToken, saveAdminToken } from '@/lib/api';

function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = await adminLogin(username, password);
      saveAdminToken(token);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] shadow-[0_18px_35px_rgba(119,86,223,0.28)] mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="3" fill="white" />
              <circle cx="6" cy="14" r="2.5" fill="white" opacity="0.85" />
              <circle cx="18" cy="14" r="2.5" fill="white" opacity="0.85" />
              <path d="M9 11.5C10.5 13 13.5 13 15 11.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="page-title m-0 text-[var(--color-ink)]">Triad Admin</h1>
          <p className="mt-2 text-sm text-[var(--color-muted-ink)] m-0">
            Sign in to manage your platform
          </p>
        </div>

        <div className="glass-panel rounded-[28px] p-7">
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-username" className="text-sm font-semibold text-[var(--color-ink)]">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="triadadmin"
                className="rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted-ink)] outline-none transition focus:border-[var(--color-accent)] focus:bg-white/80 focus:ring-2 focus:ring-[rgba(124,77,255,0.18)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-password" className="text-sm font-semibold text-[var(--color-ink)]">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted-ink)] outline-none transition focus:border-[var(--color-accent)] focus:bg-white/80 focus:ring-2 focus:ring-[rgba(124,77,255,0.18)]"
              />
            </div>

            {error && (
              <p className="m-0 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(119,86,223,0.28)] transition hover:opacity-95 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--color-muted-ink)] mt-6">
          Triad Admin — restricted access
        </p>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getAdminToken());
    setChecked(true);
  }, []);

  function handleLogout() {
    clearAdminToken();
    setAuthed(false);
  }

  if (!checked) return null;

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen">
      <div className="screen-wrap grid gap-6 py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-8">
        <Sidebar />
        <div className="min-w-0 space-y-5">
          <Header onLogout={handleLogout} />
          <main className="space-y-5" aria-live="polite">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
