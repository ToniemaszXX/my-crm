// Prosta "bramka" reautoryzacji, żeby wiele równoległych 401
// nie otwierało wielu modali i żeby wszystkie żądania czekały
// na jeden wynik logowania.

let reauthPromise = null;
let resolver = null;

export function isReauthInProgress() {
  return !!reauthPromise;
}

export function beginReauth() {
  if (!reauthPromise) {
    reauthPromise = new Promise((resolve) => {
      resolver = resolve;
    });
  }
  return reauthPromise; // zwraca obietnicę, która spełni się na true/false
}

export function completeReauth(ok) {
  if (resolver) {
    try { resolver(!!ok); } catch {}
  }
  resolver = null;
  reauthPromise = null;
}
