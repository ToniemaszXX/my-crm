// src/utils/usersCache.js
// Lightweight users cache + resolver by id. Fetches users list per market/role combo and caches in-memory.
import { fetchWithAuth } from './fetchWithAuth';

const store = {
  // key: `${marketId}|${role||'*'}|${activeOnly?1:0}` => Array<{id:number,label:string}>
  lists: new Map(),
  // id -> label (best-effort; last seen)
  labels: new Map(),
};

function key(marketId, role, activeOnly) {
  return `${marketId||''}|${role||'*'}|${activeOnly?1:0}`;
}

export async function fetchUsersList({ marketId, role, activeOnly = true } = {}) {
  const k = key(marketId, role, activeOnly);
  if (store.lists.has(k)) return store.lists.get(k);
  const params = new URLSearchParams();
  if (marketId != null && `${marketId}` !== '') params.set('market_id', String(marketId));
  if (role) params.set('role', String(role));
  if (activeOnly) params.set('active', '1');
  const url = `${import.meta.env.VITE_API_URL}/users/list.php${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetchWithAuth(url);
  const data = await res.json().catch(() => ({}));
  const users = Array.isArray(data.users) ? data.users : [];
  const mapped = users.map(u => {
    const name = (u.name || '').trim();
    const surname = (u.surname || '').trim();
    const full = (name || surname) ? `${name}${name && surname ? ' ' : ''}${surname}`.trim() : (u.username || '').trim();
    return { id: Number(u.id), label: full };
  }).filter(x => x.label);
  store.lists.set(k, mapped);
  for (const u of mapped) store.labels.set(Number(u.id), u.label);
  return mapped;
}

export function getCachedUserLabel(id) {
  return store.labels.get(Number(id));
}

export async function resolveUserLabelById({ id, marketId, role, activeOnly = true } = {}) {
  if (id == null || id === '') return undefined;
  const cached = getCachedUserLabel(id);
  if (cached) return cached;

  // Helper to try a single combination
  const tryCombo = async (opts) => {
    await fetchUsersList(opts).catch(() => undefined);
    return getCachedUserLabel(id);
  };

  // Build resolution plan: prefer activeOnly first, then include inactive
  const plans = [];
  const addPlan = (ao, r, m) => plans.push({ activeOnly: ao, role: r, marketId: m });

  // Pass 1: active users only
  addPlan(true, role, marketId);
  addPlan(true, undefined, marketId);
  if (marketId != null) addPlan(true, undefined, undefined);

  // Pass 2: include inactive (to display historical assignments)
  addPlan(false, role, marketId);
  addPlan(false, undefined, marketId);
  if (marketId != null) addPlan(false, undefined, undefined);

  for (const p of plans) {
    const label = await tryCombo(p);
    if (label) return label;
  }
  return undefined;
}

export default { fetchUsersList, resolveUserLabelById, getCachedUserLabel };
