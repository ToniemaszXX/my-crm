// Plik zawiera funkcje do konwersji lub zmiany danych.
// To jest spacje między 0 w liczbach,
// zamiana boolen na Tak lub Nie, zamiana linków na URL.


import i18n from '../languages/i18n';

export function yesNo(v) {
  if (v === null || v === undefined || v === '') return '—';
  const val = typeof v === 'string' ? v.trim().toLowerCase() : v;

  if (val === 1 || val === '1' || val === true || val === 'true') return i18n.t('addClientModal.yes', { defaultValue: 'Tak' });
  if (val === 0 || val === '0' || val === false || val === 'false') return i18n.t('addClientModal.no', { defaultValue: 'Nie' });

  // gdy przyjdzie coś innego (np. "N/A") – pokaż to bez psucia UI
  return String(v);
}

// rozdzielanie zer w liczbach
export function fmtMoney(v) {
  if (!v && v !== 0) return '—';
  const s = String(v).replace(/\s/g, '');
  const num = Number(s);
  if (Number.isNaN(num)) return String(v);
  return num.toLocaleString('pl-PL', { maximumFractionDigits: 2 });
}