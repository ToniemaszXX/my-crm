import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useTranslation } from 'react-i18next';

export default function ContactsList({ entityType, entityId, reloadTrigger, onEdit, onDelete, searchQuery }) {
  const [contacts, setContacts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { t } = useTranslation();

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
        else { setContacts([]); setErr(data?.message || t('errors.contactsFetch')); }
      })
      .catch(() => { if (!ignore) { setErr(t('errors.network')); setContacts([]); }})
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [entityType, entityId, reloadTrigger]);

  if (!entityType || !entityId) return null;
  if (loading) return <p>{t('loading')}</p>;
  if (!contacts || contacts.length === 0) return <p>{err || t('addClientModal.contacts.empty')}</p>;

  const q = (searchQuery || '').trim().toLowerCase();
  const shown = q
    ? contacts.filter((c) => Object.values(c || {}).some(v => String(v ?? '').toLowerCase().includes(q)))
    : contacts;

  const splitList = (val) => String(val || '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2">
      {shown.map((c) => {
        const emails = splitList(c.email);
        const phones = splitList(c.phone);
        return (
          <div key={c.id} className="rounded border border-neutral-700 p-3">
            <div className="font-medium">{c.name || '—'}</div>
            <div className="text-sm text-neutral-400">{c.department || '—'} {c.position ? `• ${c.position}` : ''}</div>
            <div className="text-sm mt-1 space-y-0.5">
              <div>
                📧 {emails.length > 0 ? (
                  <div className="inline-flex flex-col gap-0.5 align-top">
                    {emails.map((e, i) => (
                      <a key={i} className="underline" href={`mailto:${e}`}>{e}</a>
                    ))}
                  </div>
                ) : '—'}
              </div>
              <div>
                ☎️ {phones.length > 0 ? (
                  <div className="inline-flex flex-col gap-0.5 align-top">
                    {phones.map((p, i) => (
                      <a key={i} className="underline" href={`tel:${p}`}>{p}</a>
                    ))}
                  </div>
                ) : '—'}
              </div>
            </div>
            <div className="text-sm text-neutral-400 mt-1">{c.function_notes || '—'}</div>
            <div className="text-sm mt-1">{t('addClientModal.decisionLevel')}: {c.decision_level || '—'}</div>
            <div className="flex gap-2 mt-2">
              {onEdit && (
                <button type="button" className="buttonGreenNeg" onClick={() => onEdit(c)}>{t('edit')}</button>
              )}
              {onDelete && (
                <button type="button" className="buttonRed" onClick={() => onDelete(c)}>{t('buttons.remove')}</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
