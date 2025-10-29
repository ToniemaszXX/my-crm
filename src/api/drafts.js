import { fetchWithAuth } from '../utils/fetchWithAuth';

const API = import.meta.env.VITE_API_URL;

export async function draftsSave({ entityType, entityId, contextKey, payload, draftId }) {
  const url = `${API}/drafts/save.php`;
  const res = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entity_type: entityType,
      entity_id: entityId ?? undefined,
      context_key: contextKey ?? undefined,
      payload,
      draft_id: draftId ?? undefined,
    })
  });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || 'Draft save failed');
  return data; // { success, draft_id, updated_at, version }
}

export async function draftsFind({ entityType, entityId, contextKey }) {
  const qs = new URLSearchParams({ entity_type: entityType });
  if (entityId != null) qs.set('entity_id', String(entityId));
  if (contextKey) qs.set('context_key', contextKey);
  const url = `${API}/drafts/find.php?${qs.toString()}`;
  const res = await fetchWithAuth(url, { method: 'GET' });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || 'Draft find failed');
  return data; // { success, draft: null | { id, payload, updated_at, version } }
}

export async function draftsDiscard(draftId) {
  const url = `${API}/drafts/discard.php`;
  const res = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft_id: draftId })
  });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || 'Draft discard failed');
  return data; // { success, discarded }
}

export async function draftsCommit(draftId) {
  const url = `${API}/drafts/commit.php`;
  const res = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft_id: draftId })
  });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || 'Draft commit failed');
  return data; // { success, entity_type, id }
}
