import { fetchWithAuth } from '../utils/fetchWithAuth';

const API = import.meta.env.VITE_API_URL;

export async function fetchNotifications({ unread = true, limit = 20, offset = 0 } = {}) {
  const url = `${API}/notifications/list.php?unread=${unread ? '1' : '0'}&limit=${limit}&offset=${offset}`;
  const res = await fetchWithAuth(url, { method: 'GET' });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || 'Failed to load notifications');
  return data.items || [];
}

export async function markNotificationsRead(ids) {
  const url = `${API}/notifications/mark_read.php`;
  const res = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || 'Failed to mark as read');
  return data.updated || 0;
}

export async function markAllNotificationsRead() {
  const url = `${API}/notifications/mark_all_read.php`;
  const res = await fetchWithAuth(url, { method: 'POST' });
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || 'Failed to mark all as read');
  return data.updated || 0;
}
