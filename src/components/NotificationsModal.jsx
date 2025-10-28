import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';
import NotificationDetailsModal from './NotificationDetailsModal';

export default function NotificationsModal({ onClose }) {
  const { items, reload, markRead, markAllRead } = useNotifications();
  const [showArchived, setShowArchived] = useState(false);
  const [detailsOf, setDetailsOf] = useState(null);

  useEffect(() => { reload({ unread: !showArchived }); }, [showArchived]);

  const modal = (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999999]">
      <div className="bg-white w-full max-w-2xl rounded shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Powiadomienia</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">✖</button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button className="px-3 py-1 border rounded" onClick={() => setShowArchived(s => !s)}>
            {showArchived ? 'Pokaż nieprzeczytane' : 'Pokaż archiwalne'}
          </button>
          {!showArchived && (
            <button className="px-3 py-1 border rounded" onClick={markAllRead}>Oznacz wszystkie jako przeczytane</button>
          )}
        </div>

        <ul className="max-h-[60vh] overflow-auto divide-y">
          {items.map(n => {
            let meta;
            try { meta = n.meta ? JSON.parse(n.meta) : null; } catch { meta = null; }
            const fields = Array.isArray(meta?.fields) ? meta.fields : (meta?.field ? [meta.field] : []);
            const isClient = n.entity_type === 'client' || meta?.entity === 'client';
            const isInstaller = n.entity_type === 'installer' || meta?.entity === 'installer';
            const isDesigner = n.entity_type === 'designer' || meta?.entity === 'designer';
            const isDeveloper = n.entity_type === 'deweloper' || meta?.entity === 'deweloper';
            // Resolve common entity ids for links
            const installerId = (meta?.entity === 'installer' ? meta?.entity_id : meta?.installer_id) || null;
            const eligibleEntity = isClient || isInstaller || isDesigner || isDeveloper;
            const showDetails = eligibleEntity && meta && meta.diff && Object.keys(meta.diff || {}).length > 0;
            const isCreateEvent = typeof n.event_type === 'string' && /\.created$/.test(n.event_type);
            const isVisit = (
              n.entity_type === 'visit' ||
              (typeof n.event_type === 'string' && n.event_type.startsWith('visit.')) ||
              (typeof meta?.group_key === 'string' && meta.group_key.startsWith('visit|')) ||
              meta?.entity === 'visit'
            );
            return (
              <li key={n.user_notification_id} className={`py-3 flex items-start gap-3 ${n.read_at ? 'opacity-60' : ''}`}>
                <div className="shrink-0 mt-1">📌</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {n.client_name && (
                    <div className="text-sm font-semibold text-neutral-800 mt-1">{n.client_name}</div>
                  )}
                  {/* Nie pokazuj listy pól dla zdarzeń tworzenia klienta/instalatora */}
                  {fields.length > 0 && !(isCreateEvent && (isClient || isInstaller)) && (
                    <div className="text-xs text-gray-600 mt-1">Pola: {fields.join(', ')}</div>
                  )}
                  {n.designer_name && (
                    <div className="text-sm font-semibold text-neutral-800 mt-1">{n.designer_name}</div>
                  )}
                  {n.installer_name && (
                    <div className="text-sm font-semibold text-neutral-800 mt-1">{n.installer_name}</div>
                  )}
                  {n.deweloper_name && (
                    <div className="text-sm font-semibold text-neutral-800 mt-1">{n.deweloper_name}</div>
                  )}
                  {n.message && (
                    <div className="text-sm text-gray-700 mt-1">
                      {isVisit && n.message.length > 160 ? n.message.slice(0, 160) + '…' : n.message}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Autor: {(n.author_name || '') + ' ' + (n.author_surname || '')}
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Akcje powiadomienia</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {n.client_id && (
                        <Link className="text-xs px-2 py-1 border border-neutral-300 rounded bg-white hover:bg-neutral-100" to={isVisit ? `/customers/${n.client_id}?section=visits-section` : `/customers/${n.client_id}`}>
                          Przejdź do klienta
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
                </div>
                {!n.read_at && (
                  <div>
                    <button className="px-2 py-1 text-xs border rounded" onClick={() => markRead(n.user_notification_id)}>
                      Przeczytane
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          {items.length === 0 && (
            <li className="py-6 text-center text-gray-500">Brak powiadomień</li>
          )}
        </ul>
        {detailsOf && (
          <NotificationDetailsModal notification={detailsOf} onClose={() => setDetailsOf(null)} />
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
