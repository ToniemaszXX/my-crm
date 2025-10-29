import React from 'react';

function mmss(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function AutosaveIndicator({ status, nextInMs, lastSavedAt, onSaveNow }) {
  let label = '';
  if (status === 'saving') label = 'Zapisuję…';
  else if (status === 'saved') label = `Zapisano${lastSavedAt ? ' ' + new Date(lastSavedAt).toLocaleTimeString() : ''}`;
  else if (status === 'error') label = 'Błąd zapisu';
  else if (status === 'offline') label = 'Offline — zapis wstrzymany';
  else if (status === 'countdown') label = `Autozapis za ${mmss(nextInMs)}`;
  else label = '';

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>{label}</span>
      <button
        type="button"
        onClick={onSaveNow}
        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
      >Zapisz teraz</button>
    </div>
  );
}
