import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { resolveUserLabelById } from '@/utils/usersCache';

/**
 * VisitSummaries
 * Props:
 * - entityType: 'client' | 'designer' | 'installer' | 'deweloper'
 * - entityId: number|string
 * - marketId?: number|string (optional, improves author resolution)
 * - reloadTrigger?: any (changes force reload)
 */
export default function VisitSummaries({ entityType, entityId, marketId, reloadTrigger }) {
  const { t } = useTranslation();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLabels, setUserLabels] = useState({});

  // Fetch visits for the entity
  useEffect(() => {
    if (!entityType || !entityId) return;
    let ignore = false;
    setLoading(true);
    setError('');
    setVisits([]);
    (async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/visits/get_by_entity.php?entity_type=${encodeURIComponent(entityType)}&id=${encodeURIComponent(entityId)}`;
        const res = await fetchWithAuth(url);
        const json = await res.json().catch(() => null);
        if (ignore) return;
        if (json?.success) {
          const arr = Array.isArray(json.data?.visits) ? json.data.visits : [];
          setVisits(arr);
        } else {
          setError(json?.message || '');
          setVisits([]);
        }
      } catch (e) {
        if (!ignore) { setError(''); setVisits([]); }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [entityType, entityId, reloadTrigger]);

  // Compute only summaries and sort newest -> oldest by visit_date
  const summaries = useMemo(() => {
    const only = (Array.isArray(visits) ? visits : [])
      .filter(v => {
        const txt = (v?.post_meeting_summary ?? '').trim();
        return txt.length > 0; // skip empty
      })
      .slice();
    // Sort descending by visit_date (newest first)
    only.sort((a, b) => {
      const da = new Date(a?.visit_date || 0).getTime() || 0;
      const db = new Date(b?.visit_date || 0).getTime() || 0;
      return db - da;
    });
    return only;
  }, [visits]);

  // Resolve authors (user_id -> label)
  useEffect(() => {
    let cancelled = false;
    const ids = Array.from(new Set((summaries || []).map(v => v?.user_id).filter(id => id != null)));
    if (!ids.length) { setUserLabels({}); return; }
    (async () => {
      const entries = await Promise.all(ids.map(async (id) => {
        try {
          const label = await resolveUserLabelById({ id, marketId }).catch(() => undefined);
          return [String(id), label || '—'];
        } catch {
          return [String(id), '—'];
        }
      }));
      if (!cancelled) setUserLabels(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [summaries, marketId]);

  return (
    <div>
      <div className="bg-white text-black rounded mt-2">
        <div className="h-[500px] overflow-y-auto p-4">
          {loading ? (
            <p>{t('loading')}</p>
          ) : summaries.length === 0 ? (
            <p>{t('visit.noSummaries') || 'Brak podsumowań.'}</p>
          ) : (
            <ul className="space-y-2">
              {summaries.map((v) => {
                const dateStr = v?.visit_date || '—';
                const author = userLabels[String(v?.user_id)] || '—';
                const text = (v?.post_meeting_summary ?? '').trim();
                return (
                  <li key={v.visit_id || `${v.user_id}-${dateStr}-${Math.random()}`} className="border p-2 rounded">
                    <div className="text-sm text-neutral-700 flex flex-wrap gap-2">
                      <span><strong>{t('visit.date') || 'Data'}:</strong> {dateStr}</span>
                      <span>•</span>
                      <span><strong>{t('visit.author') || 'Autor'}:</strong> {author}</span>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap break-words">{text}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
