import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchNotifications, markAllNotificationsRead, markNotificationsRead } from '../api/notifications';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children, pollMs = 30000 }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Remember last used params so polling/focus respects current view (unread vs archived)
  const lastParamsRef = useRef({ unread: true });

  const unreadCount = useMemo(() => items.filter(n => !n.read_at).length, [items]);

  async function load({ unread = true } = {}) {
    if (!user) return;
    lastParamsRef.current = { unread: !!unread };
    setLoading(true); setError(null);
    try {
      const data = await fetchNotifications({ unread, limit: 50, offset: 0 });
      setItems(data);
    } catch (e) {
      console.error('fetchNotifications failed', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await markNotificationsRead([id]);
      setItems(prev => prev.map(x => x.user_notification_id === id ? { ...x, read_at: new Date().toISOString() } : x));
    } catch (e) { console.error('markRead failed', e); }
  }

  async function markAllRead() {
    try {
      await markAllNotificationsRead();
      setItems(prev => prev.map(x => ({ ...x, read_at: new Date().toISOString() })));
    } catch (e) { console.error('markAllRead failed', e); }
  }

  useEffect(() => {
    let timer;
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        // Respect the last selected filter instead of forcing unread
        load(lastParamsRef.current);
      }
    };
    if (user) {
      // Initial load uses last selected filter (defaults to unread: true)
      load(lastParamsRef.current);
      timer = setInterval(() => load(lastParamsRef.current), pollMs);
      window.addEventListener('focus', onFocusOrVisible);
      document.addEventListener('visibilitychange', onFocusOrVisible);
    } else {
      setItems([]);
    }
    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [user, pollMs]);

  const value = { items, unreadCount, loading, error, reload: load, markRead, markAllRead };
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => useContext(NotificationsContext);
