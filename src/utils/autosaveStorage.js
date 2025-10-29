const KEY = 'autosave_local_drafts_v1';

function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function saveAll(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
}

function makeKey({ entityType, entityId, contextKey }) {
  if (entityId != null) return `${entityType}|id|${entityId}`;
  return `${entityType}|ctx|${contextKey || ''}`;
}

export function lsGetDraft({ entityType, entityId, contextKey }) {
  const map = loadAll();
  const k = makeKey({ entityType, entityId, contextKey });
  return map[k] || null;
}

export function lsSaveDraft({ entityType, entityId, contextKey, payload }) {
  const map = loadAll();
  const k = makeKey({ entityType, entityId, contextKey });
  map[k] = { payload, updated_at: new Date().toISOString() };
  saveAll(map);
  return map[k];
}

export function lsDiscardDraft({ entityType, entityId, contextKey }) {
  const map = loadAll();
  const k = makeKey({ entityType, entityId, contextKey });
  if (map[k]) { delete map[k]; saveAll(map); return true; }
  return false;
}
