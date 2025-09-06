// src/utils/syncContacts.js
import { fetchWithAuth } from '../utils/fetchWithAuth';
const API = import.meta.env.VITE_API_URL;

const norm = (c = {}) => ({
  department: c.department || '',
  position: c.position || '',
  name: c.name || '',
  phone: c.phone || '',
  email: c.email || '',
  function_notes: c.function_notes || '',
  decision_level: c.decision_level ?? '-',
});

// mały helper, który ZAWSZE zwróci status + treść (json/tekst)
async function postJson(url, body) {
  try {
    const res = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // fetchWithAuth zwykle ma credentials: 'include'; jeśli nie, dopisz tam
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}

    const ok = res.ok && data && data.success !== false;
    const info = { ok, status: res.status, url, body, data, text };

    if (!ok) {
      console.error('syncContacts: request failed', info);
    }
    return info;
  } catch (err) {
    const info = { ok: false, status: 0, url, body, data: null, text: String(err) };
    console.error('syncContacts: fetch error', info);
    return info;
  }
}

export async function syncContacts({ clientId, original = [], current = [] }) {
  const origById = new Map((original || []).filter(c => c?.id).map(c => [String(c.id), norm(c)]));
  const currById = new Map((current || []).filter(c => c?.id).map(c => [String(c.id), norm(c)]));

  const toCreate = (current || []).filter(c => !c?.id).map(norm);

  const toUpdate = [];
  for (const [id, after] of currById.entries()) {
    const before = origById.get(id);
    if (!before || JSON.stringify(before) !== JSON.stringify(after)) {
      toUpdate.push({ id: Number(id), ...after });
    }
  }

  const toDeleteIds = [...origById.keys()]
    .filter(id => !currById.has(id))
    .map(id => Number(id));

  const reqs = [];

  for (const c of toCreate) {
    reqs.push(postJson(`${API}/contacts/create.php`, { client_id: clientId, ...c }));
  }

  for (const c of toUpdate) {
    reqs.push(postJson(`${API}/contacts/update.php`, { client_id: clientId, ...c }));
  }

  for (const id of toDeleteIds) {
    reqs.push(postJson(`${API}/contacts/delete.php`, { id, client_id: clientId }));
  }

  const results = await Promise.all(reqs);
  const errors = results.filter(r => !r.ok);

  // pokaż komplet w konsoli, żeby od razu było widać co padło i dlaczego
  console.log('syncContacts summary', {
    created: toCreate.length,
    updated: toUpdate.length,
    deleted: toDeleteIds.length,
    results,
    errors,
  });

  return {
    ok: errors.length === 0,
    counts: { created: toCreate.length, updated: toUpdate.length, deleted: toDeleteIds.length },
    results,
    errors,
  };
}
