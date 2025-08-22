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
  };

  let res = await fetch(url, {
    ...restOptions,
    headers: finalHeaders,
    credentials: 'include',
  });

  if (res.status === 401) {
    const loginPath = import.meta.env.PROD ? '/engo/CRM/login' : '/login';

    // Jeśli nikt nie zarejestrował modala — od razu przenosimy na /login
    if (!onUnauthorizedCallback) {
      window.location.replace(loginPath);
      return res;
    }

    // Otwórz modal tylko raz, reszta żądań ma czekać na wynik
    if (!isReauthInProgress()) {
      try { onUnauthorizedCallback(); } catch {}
    }

    // Czekamy, aż modal zgłosi sukces/anulowanie
    const ok = await beginReauth();

    if (ok) {
      // Po udanym re-logowaniu: jedno ponowienie tego samego żądania
      res = await fetch(url, {
        ...restOptions,
        headers: finalHeaders,
        credentials: 'include',
      });
    } else {
      // Użytkownik anulował modal → przenieś na /login
      window.location.replace(loginPath);
      return res;
    }
  }

  return res;
}
