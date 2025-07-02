// utils/fetchWithAuth.js
let onUnauthorizedCallback = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorizedCallback = fn;
}

export async function fetchWithAuth(url, options = {}) {

  const { bearerToken, headers = {}, ...restOptions } = options;

   const finalHeaders = {
    ...headers,
    ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
  };

  const res = await fetch(url, {
    ...options,
    headers: finalHeaders,
    credentials: 'include',
  });

  if (res.status === 401 && onUnauthorizedCallback) {
    onUnauthorizedCallback(); // 🔔 np. pokaż modal logowania
  }

  return res;
}
