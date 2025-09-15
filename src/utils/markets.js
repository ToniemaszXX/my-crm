// src/utils/markets.js
// Simple local mapping of markets (from DB: 1 = PL, 2 = EXP)
export const MARKET_LABELS = {
  1: 'PL',
  2: 'EXP',
};

export function getMarketLabel(id) {
  const n = Number(id);
  return MARKET_LABELS[n] || String(id ?? '');
}

export function formatMarket(id) {
  const label = getMarketLabel(id);
  return label || '-';
}
