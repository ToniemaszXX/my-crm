import { isValidElement } from 'react';

// Zamiana stringów w linki i tworzenie elementu a
export function autoHttp(
  value,
  { className = "underline hover:text-lime-400", newTab = true } = {}
) {
  // 1) puste → "—"
  if (value === null || value === undefined || value === '') return '—';

  // 2) jeśli ktoś poda już gotowy element (<a/> itp.) → zostaw
  if (isValidElement(value)) return value;

  // 3) z obiektu spróbuj wyciągnąć sensowny string
  let s = value;
  if (typeof s === 'object') s = s?.href ?? s?.url ?? s?.toString?.() ?? '';
  s = String(s).trim();

  // 4) nie renderujemy linków ze spacjami
  if (!s || /\s/.test(s)) return s;

  // 5) heurystyka: czy to wygląda na URL?
  const looksLikeUrl =
    /^(https?:\/\/)/i.test(s) ||              // http:// albo https://
    /^www\./i.test(s) ||                      // zaczyna się od www.
    /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(s);    // domena.tld (co najmniej 1 kropka)

  if (!looksLikeUrl) return s;

  // 6) dopełnij protokół jeśli brak
  const href = /^(https?:)?\/\//i.test(s) ? s : `https://${s}`;

  // 7) zbuduj <a>
  const props = newTab
    ? { href, target: "_blank", rel: "noreferrer", className }
    : { href, className };

  return <a {...props}>{s}</a>;
}





