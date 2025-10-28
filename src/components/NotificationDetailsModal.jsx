import { useEffect, useMemo, useState } from 'react';
import { VISIT_FIELDS } from '../constants/visitFields';
import { CLIENT_FIELDS } from '../constants/clientFields';
import { INSTALLER_FIELDS } from '../constants/installerFields';
import { fetchWithAuth } from '../utils/fetchWithAuth';

const API = import.meta.env.VITE_API_URL;

function humanize(key) {
  if (!key) return '';
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function NotificationDetailsModal({ notification, onClose }) {
  const [labelsMap, setLabelsMap] = useState({});

  // Parse meta and decide base entity to resolve field labels
  const meta = useMemo(() => {
    try { return notification?.meta ? JSON.parse(notification.meta) : null; } catch { return null; }
  }, [notification]);

  const metaEntity = useMemo(() => {
    try { return notification?.meta ? (JSON.parse(notification.meta)?.entity || null) : null; } catch { return null; }
  }, [notification]);
  const baseEntity = (notification?.entity_type || metaEntity || 'client'); // 'visit' | 'client' | 'installer' | 'designer' | 'deweloper'

  useEffect(() => {
    let ignore = false;
    async function load() {
      // For visits, prefer static labels; for others, try to fetch keys and humanize
      if (baseEntity === 'visit') {
        const map = Object.fromEntries(VISIT_FIELDS.map(f => [f.key, f.label || humanize(f.key)]));
        if (!ignore) setLabelsMap(map);
        return;
      }
      if (baseEntity === 'client') {
        const map = Object.fromEntries(CLIENT_FIELDS.map(f => [f.key, f.label || humanize(f.key)]));
        if (!ignore) setLabelsMap(map);
        return;
      }
      if (baseEntity === 'installer') {
        const map = Object.fromEntries(INSTALLER_FIELDS.map(f => [f.key, f.label || humanize(f.key)]));
        if (!ignore) setLabelsMap(map);
        return;
      }
  try {
        const res = await fetchWithAuth(`${API}/admin/notifications_fields.php?entity=${baseEntity}`);
        const data = await res.json();
        const keys = Array.isArray(data?.fields) ? data.fields : [];
        const map = Object.fromEntries(keys.map(k => [k, humanize(k)]));
        if (!ignore) setLabelsMap(map);
      } catch (_) {
        // fallback: empty
        if (!ignore) setLabelsMap({});
      }
    }
    load();
    return () => { ignore = true; };
  }, [baseEntity]);

  const diffs = useMemo(() => {
    // Expect meta.diff: { fieldKey: { before, after }, ... }
    const d = meta?.diff || {};
    const entries = Object.entries(d);
    // Defensive: deduplicate by normalized key (trim + lowercase)
    const seen = new Set();
    const unique = [];
    for (const [key, val] of entries) {
      const norm = String(key).trim().toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      unique.push([key, val]);
    }
    return unique;
  }, [meta]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Szczegóły zmian</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-black">✖</button>
        </div>

        {!diffs.length ? (
          <div className="text-sm text-gray-600">Brak szczegółów zmian.</div>
        ) : (
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2 w-1/4">Pole</th>
                  <th className="py-2 px-2 w-3/8">Było</th>
                  <th className="py-2 px-2 w-3/8">Jest</th>
                </tr>
              </thead>
              <tbody>
                {diffs.map(([key, val]) => (
                  <tr key={key} className="border-b align-top">
                    <td className="py-2 pr-2 font-medium">{labelsMap[key] || humanize(key)}</td>
                    <td className="py-2 px-2 whitespace-pre-wrap break-words">{val?.before ?? '—'}</td>
                    <td className="py-2 px-2 whitespace-pre-wrap break-words">{val?.after ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-right">
          <button className="buttonGreen2" onClick={onClose}>Zamknij</button>
        </div>
      </div>
    </div>
  );
}
