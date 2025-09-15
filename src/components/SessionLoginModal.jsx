import { useEffect, useRef, useState } from 'react';
import { completeReauth } from '../utils/reauthGate';
import { useAuth } from '../context/AuthContext';

export default function SessionLoginModal({
  open,
  onSuccess,
  onClose,
}) {
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);
  const previouslyFocused = useRef(null);

  const loginPath = `${import.meta.env.VITE_API_URL}/auth/login.php`;
  const mePath = `${import.meta.env.VITE_API_URL}/auth/session_check.php`;

  // Reset formularza po otwarciu
  useEffect(() => {
    if (open) {
      setUsername('');
      setPassword('');
      setSubmitting(false);
      setError('');
    }
  }, [open]);

  // Focus trap + ESC + zapamiętanie poprzedniego focusu
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const focusable = () => {
      if (!dialogRef.current) return [];
      return Array.from(
        dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled'));
    };

    // ustaw focus na pierwszym polu
    setTimeout(() => firstFieldRef.current?.focus(), 0);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
      if (e.key === 'Tab') {
        const nodes = focusable();
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Przywróć focus
      previouslyFocused.current && previouslyFocused.current.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      // 1) Logowanie
      const resp = await fetch(loginPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        throw new Error(data?.message || 'Nieprawidłowy login lub hasło');
      }

      // 2) Opcjonalny check sesji (odświeżenie stanu FE/kontekstu)
      try {
        const meResp = await fetch(mePath, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-store' },
        });
        const meData = await meResp.json().catch(() => ({}));
        if (meData?.success && meData?.user) {
          setUser(meData.user); // aktualizacja kontekstu – przywraca dane w Sidebar
        }
      } catch {}

      // 3) Powiadom „bramkę” o sukcesie — retry ruszy
      completeReauth(true);

      // 4) Zamknij modal
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.message || 'Błąd logowania');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    completeReauth(false); // sygnał: anulowano → fetchWithAuth zrobi redirect na /login
    onClose && onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reauth-title"
      onClick={handleCancel} // klik w tło = anuluj
    >
      {/* Tło z rozmyciem i fade-in */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-[fadeIn_150ms_ease-out]" />

      {/* Okno modala */}
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()} // nie zamykaj przy kliknięciu w zawartość
        className="relative w-[92%] max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl animate-[scaleIn_160ms_ease-out] p-5 text-neutral-200"
      >
        {/* Krzyżyk zamykania */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute right-3 top-3 rounded-md p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Zamknij"
        >
          ✕
        </button>

        <h3 id="reauth-title" className="mb-2 text-lg font-semibold text-neutral-100">
          Sesja wygasła — zaloguj się ponownie
        </h3>
        <p className="mb-4 text-sm text-neutral-400">
          Aby nie utracić wprowadzonych danych, zaloguj się bez przeładowania strony.
        </p>

        {error && (
          <div className="mb-3 rounded-lg border border-red-800 bg-red-900/50 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="reauth-username" className="text-xs text-neutral-400">
              Login
            </label>
            <input
              id="reauth-username"
              ref={firstFieldRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none ring-0 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              placeholder="Wpisz login"
              autoComplete="username"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="reauth-password" className="text-xs text-neutral-400">
              Hasło
            </label>
            <input
              id="reauth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none ring-0 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-900 border-t-transparent" />
              )}
              {submitting ? 'Logowanie…' : 'Zaloguj'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 font-semibold text-neutral-200 transition hover:bg-neutral-800"
            >
              Anuluj
            </button>
          </div>
        </form>

        {/* Mała stopka informacyjna */}
        <div className="mt-3 text-xs text-neutral-500">
          Po zalogowaniu niezapisane żądanie zostanie wznowione automatycznie.
        </div>
      </div>

      {/* Proste keyframes (możesz przenieść do globals.css) */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: translateY(6px) scale(.98) }
                             to   { opacity: 1; transform: translateY(0)   scale(1) } }
      `}</style>
    </div>
  );
}
