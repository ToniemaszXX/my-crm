import React from 'react';

/**
 * PillCheckbox
 * A compact pill-like toggle for boolean flags.
 *
 * Props:
 * - label: string | ReactNode
 * - checked: boolean
 * - onChange: (checked: boolean) => void
 * - className?: string
 */
export default function PillCheckbox({ label, checked, onChange, className = '' }) {
  const base = 'inline-flex items-center justify-center px-3 py-1 rounded-full border text-sm cursor-pointer select-none transition-colors';
  const active = 'bg-lime-100 border-lime-500 text-lime-700 hover:bg-lime-200';
  const inactive = 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50';

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`${base} ${checked ? active : inactive} ${className}`}
      aria-pressed={checked}
    >
      {label}
    </button>
  );
}
