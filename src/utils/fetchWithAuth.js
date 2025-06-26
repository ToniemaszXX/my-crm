// utils/fetchWithAuth.js
let onUnauthorizedCallback = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorizedCallback = fn;
}

export async function fetchWithAuth(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (res.status === 401 && onUnauthorizedCallback) {
    onUnauthorizedCallback(); // 🔔 np. pokaż modal logowania
  }

  return res;
}
