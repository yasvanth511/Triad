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
    <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1d4ed8] mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="3" fill="white" />
              <circle cx="6" cy="14" r="2.5" fill="white" opacity="0.8" />
              <circle cx="18" cy="14" r="2.5" fill="white" opacity="0.8" />
              <path d="M9 11.5C10.5 13 13.5 13 15 11.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#172033] m-0">Triad Admin</h1>
          <p className="mt-1 text-sm text-[#667085] m-0">Sign in to manage your platform</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#d9e0ec] rounded-[18px] p-8 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-username" className="text-sm font-semibold text-[#172033]">
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
                className="rounded-xl border border-[#d9e0ec] bg-[#f8fafc] px-3.5 py-2.5 text-sm text-[#172033] placeholder:text-[#9bacc4] outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-password" className="text-sm font-semibold text-[#172033]">
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
                className="rounded-xl border border-[#d9e0ec] bg-[#f8fafc] px-3.5 py-2.5 text-sm text-[#172033] placeholder:text-[#9bacc4] outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-xl px-3.5 py-2.5 m-0">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#1e40af] active:bg-[#1e3a8a] transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#9bacc4] mt-6">
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

  // Prevent flash of dashboard before token check completes
  if (!checked) return null;

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div
      className="min-h-screen grid"
      style={{ gridTemplateColumns: '260px minmax(0, 1fr)' }}
    >
      <Sidebar />
      <div className="grid" style={{ gridTemplateRows: 'auto 1fr' }}>
        <Header onLogout={handleLogout} />
        <main className="px-8 pb-8 pt-3" aria-live="polite">
          {children}
        </main>
      </div>
    </div>
  );
}
