import { useEffect, useState } from 'react';
import { completeReauth } from '../utils/reauthGate';

export default function SessionLoginModal({
  open,
  onSuccess, // opcjonalnie: wywołaj po udanym logowaniu (np. odśwież me)
  onClose,   // wywołaj przy zamknięciu/anulowaniu
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Wyczyść formularz za każdym razem, gdy modal się otwiera
  useEffect(() => {
    if (open) {
      setUsername('');
      setPassword('');
      setSubmitting(false);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const loginPath = `${import.meta.env.VITE_API_URL}/auth/login.php`;
  const mePath = `${import.meta.env.VITE_API_URL}/auth/session_check.php`;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      // 1) Spróbuj zalogować
      const resp = await fetch(loginPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data.success) {
        throw new Error(data?.message || 'Nieprawidłowy login lub hasło');
      }

      // 2) Opcjonalnie sprawdź sesję (żeby uzupełnić stan FE, jeśli potrzebujesz)
      try {
        await fetch(mePath, { credentials: 'include', headers: { 'Cache-Control': 'no-store' } });
      } catch {}

      // 3) Powiedz fetchWithAuth, że re-logowanie się udało → żądania 401 wznowią się
      completeReauth(true);

      // 4) Zamknij modal i przekaż sterowanie do aplikacji
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.message || 'Błąd logowania');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    // Użytkownik zrezygnował → zgłoś porażkę i zamknij modal
    completeReauth(false);
    onClose && onClose();
  }

  // Prosty modal bez zależności (overlay + "okienko")
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleCancel} // klik w tło = anuluj
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()} // blokuj zamknięcie przy kliknięciu w zawartość
        style={{
          width: 360, background: '#1f2937', color: '#e5e7eb',
          borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          padding: 20
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>
          Sesja wygasła — zaloguj się ponownie
        </h3>

        {error && (
          <div style={{
            background: '#7f1d1d', color: '#fecaca',
            padding: '8px 10px', borderRadius: 8, marginBottom: 10, fontSize: 14
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          <input
            autoFocus
            type="text"
            placeholder="Login"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: 10, borderRadius: 8, border: '1px solid #374151',
              background: '#111827', color: '#e5e7eb'
            }}
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: 10, borderRadius: 8, border: '1px solid #374151',
              background: '#111827', color: '#e5e7eb'
            }}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none',
                background: submitting ? '#065f46' : '#10b981', color: '#062a24',
                fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Logowanie…' : 'Zaloguj'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #374151',
                background: '#111827', color: '#e5e7eb', cursor: 'pointer'
              }}
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
