import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export default function ContactsList({ entityType, entityId, reloadTrigger, onEdit, onDelete, searchQuery }) {
  const [contacts, setContacts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!entityType || !entityId) return;
    let ignore = false;
    setLoading(true);
    setErr('');
    setContacts(null);
    fetchWithAuth(`${import.meta.env.VITE_API_URL}/contacts/get_by_entity.php?entity_type=${encodeURIComponent(entityType)}&id=${encodeURIComponent(entityId)}`)
      .then(res => res.json())
      .then(data => {
        if (ignore) return;
        if (data?.success) setContacts(data.data?.contacts || []);
        else { setContacts([]); setErr(data?.message || 'Błąd pobierania kontaktów'); }
      })
      .catch(() => { if (!ignore) { setErr('Błąd sieci'); setContacts([]); }})
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [entityType, entityId, reloadTrigger]);

  if (!entityType || !entityId) return null;
  if (loading) return <p>Ładowanie…</p>;
  if (!contacts || contacts.length === 0) return <p>{err || 'Brak kontaktów.'}</p>;

  const q = (searchQuery || '').trim().toLowerCase();
  const shown = q
    ? contacts.filter((c) => Object.values(c || {}).some(v => String(v ?? '').toLowerCase().includes(q)))
    : contacts;

  return (
    <div className="space-y-2">
  {shown.map((c) => (
        <div key={c.id} className="rounded border border-neutral-700 p-3">
          <div className="font-medium">{c.name || '—'}</div>
          <div className="text-sm text-neutral-400">{c.department || '—'} {c.position ? `• ${c.position}` : ''}</div>
          <div className="text-sm mt-1">
            📧 {c.email ? <a className="underline" href={`mailto:${c.email}`}>{c.email}</a> : '—'} {' '}|☎️{' '}
            {c.phone ? <a className="underline" href={`tel:${c.phone}`}>{c.phone}</a> : '—'}
          </div>
          <div className="text-sm text-neutral-400 mt-1">{c.function_notes || '—'}</div>
          <div className="text-sm mt-1">Decyzyjność: {c.decision_level || '—'}</div>
          <div className="flex gap-2 mt-2">
            {onEdit && (
              <button type="button" className="buttonGreenNeg" onClick={() => onEdit(c)}>Edytuj</button>
            )}
            {onDelete && (
              <button type="button" className="buttonRed" onClick={() => onDelete(c)}>Usuń</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
