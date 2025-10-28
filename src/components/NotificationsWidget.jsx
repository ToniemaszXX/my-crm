import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';
import NotificationDetailsModal from './NotificationDetailsModal';

export default function NotificationsWidget() {
  const { items, reload, markRead } = useNotifications();
  const [showAll, setShowAll] = useState(false);
  const [detailsOf, setDetailsOf] = useState(null);

  useEffect(() => { reload({ unread: !showAll }); }, [showAll]);

  // Show all notifications; scroll area sized to ~4 rows

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Powiadomienia</h3>
        <button className="buttonGreen2 text-base" onClick={() => setShowAll(s => !s)}>
          {showAll ? 'Pokaż nieprzeczytane' : 'Pokaż archiwalne'}
        </button>
      </div>
      {items.length === 0 ? (
        <div className="text-base text-neutral-500">Brak powiadomień</div>
      ) : (
  <div className="max-h-[520px] overflow-auto pr-1">
          <ul className="space-y-[7px]">
          {items.map(n => {
            let meta;
            try { meta = n.meta ? JSON.parse(n.meta) : null; } catch { meta = null; }
            const isUnread = !n.read_at;
            const isCreateEvent = typeof n.event_type === 'string' && /\.created$/.test(n.event_type);
            const fieldBadge = (() => {
              const fields = Array.isArray(meta?.fields) ? meta.fields : (meta?.field ? [meta.field] : []);
              // Nie pokazuj listy pól dla zdarzeń tworzenia klienta/instalatora
              if (!fields.length || (isCreateEvent && (n.entity_type === 'client' || meta?.entity === 'client' || n.entity_type === 'installer' || meta?.entity === 'installer'))) return null;
              return (
                <div className="mt-1 text-xs text-neutral-600">
                  Pola: {fields.join(', ')}
                </div>
              );
            })();
            const isClient = n.entity_type === 'client' || meta?.entity === 'client';
            const isInstaller = n.entity_type === 'installer' || meta?.entity === 'installer';
            const isDesigner = n.entity_type === 'designer' || meta?.entity === 'designer';
            const isDeveloper = n.entity_type === 'deweloper' || meta?.entity === 'deweloper';
            const isVisit = (
              n.entity_type === 'visit' ||
              (typeof n.event_type === 'string' && n.event_type.startsWith('visit.')) ||
              (typeof meta?.group_key === 'string' && meta.group_key.startsWith('visit|')) ||
              meta?.entity === 'visit'
            );
            // Resolve installer id regardless of meta shape
            const installerId = (meta?.entity === 'installer' ? meta?.entity_id : meta?.installer_id) || null;
            const eligibleEntity = isClient || isInstaller || isDesigner || isDeveloper;
            const showDetails = eligibleEntity && meta && meta.diff && Object.keys(meta.diff||{}).length > 0;
            return (
              <li
                key={n.user_notification_id}
                className={[
                  'relative p-3 rounded-md shadow-sm bg-white border border-neutral-300',
                ].join(' ')}
              >
                {/* Przycisk Przeczytane w prawym górnym rogu */}
                {!n.read_at && (
                  <button
                    className="absolute top-2 right-2 text-xs px-2 py-0.5 border border-neutral-300 rounded text-neutral-600 hover:bg-neutral-100"
                    onClick={() => markRead(n.user_notification_id)}
                  >
                    Przeczytane
                  </button>
                )}
                <div className="text-base font-medium text-neutral-800 pr-28">{n.title}</div>
                {n.client_name && (
                  <div className="text-sm text-neutral-700">{n.client_name}</div>
                )}
                {n.installer_name && (
                  <div className="text-sm text-neutral-700">{n.installer_name}</div>
                )}
                <div className="text-sm text-neutral-600">{new Date(n.created_at).toLocaleString()}</div>
                {fieldBadge}
                {n.message && (
                  <div className="text-sm text-neutral-700 mt-1">
                    {isVisit ? (n.message.length > 160 ? n.message.slice(0, 160) + '…' : n.message) : (n.message.length > 120 ? n.message.slice(0, 120) + '…' : n.message)}
                  </div>
                )}
                <div className="text-sm text-neutral-500">Autor: {(n.author_name || '')} {(n.author_surname || '')}</div>
                <div className="mt-2">
                  <div className="text-[11px] text-neutral-500 mb-1">Akcje powiadomienia</div>
                  <div className="flex gap-2 flex-wrap">
                    {n.client_id && (
                      <Link className="text-xs px-2 py-1 border border-neutral-300 rounded bg-white hover:bg-neutral-100" to={isVisit ? `/customers/${n.client_id}?section=visits-section` : `/customers/${n.client_id}`}>
                        Klient
                      </Link>
                    )}
                    {installerId && (
                      <Link className="text-xs px-2 py-1 border border-neutral-300 rounded bg-white hover:bg-neutral-100" to={`/installers/${installerId}`}>
                        Instalator
                      </Link>
                    )}
                    {showDetails && (
                      <button className="text-xs px-2 py-1 border border-neutral-300 rounded bg-white hover:bg-neutral-100" onClick={() => setDetailsOf(n)}>
                        Szczegóły edycji
                      </button>
                    )}
                  </div>
                </div>
                {/* old duplicate details button removed */}
              </li>
            );
          })}
          </ul>
        </div>
      )}
      {detailsOf && (
        <NotificationDetailsModal notification={detailsOf} onClose={() => setDetailsOf(null)} />
      )}
    </div>
  );
}
