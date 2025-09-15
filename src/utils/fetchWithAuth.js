// Globalny wrapper na fetch.
// 1) Dołącza cookies (credentials: 'include').
// 2) Na 401 otwiera modal (jeśli zarejestrowany), czeka na re-login i robi retry.
// 3) Jeśli modal zostanie anulowany — przekierowuje na /login.

import { beginReauth, isReauthInProgress } from './reauthGate';

let onUnauthorizedCallback = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorizedCallback = fn; // np. fn===() => setShowReauth(true)
}

export async function fetchWithAuth(url, options = {}) {
  const { bearerToken, headers = {}, ...restOptions } = options;

  const finalHeaders = {
    ...headers,
    ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
  // In development, ask backend to include detailed error info
  ...(import.meta.env?.DEV ? { 'X-Debug-Errors': '1' } : {}),
  Accept: 'application/json',
  };

  console.log('[fetchWithAuth] Request', { url, options: { ...restOptions, headers: finalHeaders } });
  let res = await fetch(url, {
    ...restOptions,
    headers: finalHeaders,
    credentials: 'include',
  });

  if (res.status === 401) {
    console.warn('[fetchWithAuth] 401 received', { url });
    const loginPath = import.meta.env.PROD ? '/engo/CRM/login' : '/login';

    // Jeśli nikt nie zarejestrował modala — od razu przenosimy na /login
    if (!onUnauthorizedCallback) {
      console.warn('[fetchWithAuth] No unauthorized handler registered — redirecting to login');
      window.location.replace(loginPath);
      return res;
    }

    // Otwórz modal tylko raz, reszta żądań ma czekać na wynik
    if (!isReauthInProgress()) {
      console.log('[fetchWithAuth] Starting reauth flow');
      try { onUnauthorizedCallback(); } catch {}
    }

    // Czekamy, aż modal zgłosi sukces/anulowanie
    const ok = await beginReauth();
    console.log('[fetchWithAuth] Reauth result', { ok });

    if (ok) {
      // Po udanym re-logowaniu: jedno ponowienie tego samego żądania
      console.log('[fetchWithAuth] Retrying original request');
      res = await fetch(url, {
        ...restOptions,
        headers: finalHeaders,
        credentials: 'include',
      });
    } else {
      // Użytkownik anulował modal → przenieś na /login
      console.warn('[fetchWithAuth] Reauth canceled — redirecting to login');
      window.location.replace(loginPath);
      return res;
    }
  }

  console.log('[fetchWithAuth] Response', { url, status: res.status, ok: res.ok });
  return res;
}
