import { useState } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import NotificationsModal from './NotificationsModal';

export default function NotificationBell({ variant = 'default' }) {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  const BellIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M14 20a2 2 0 1 1-4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  if (variant === 'sidebar') {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Powiadomienia"
          className="group flex items-center gap-2 text-white hover:text-lime-400"
        >
          <span className="relative inline-flex items-center justify-center">
            {BellIcon}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </span>
          <span className="text-sm">Powiadomienia</span>
        </button>
        {open && <NotificationsModal onClose={() => setOpen(false)} />}
      </div>
    );
  }

  // default (circular button)
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Powiadomienia"
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border hover:bg-gray-50"
      >
        {BellIcon}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {open && <NotificationsModal onClose={() => setOpen(false)} />}
    </div>
  );
}
