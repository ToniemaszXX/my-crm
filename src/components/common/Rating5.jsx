import React from 'react';

/**
 * Rating5
 * Discrete 1–5 rating selector with a clearable "—" state.
 *
 * Props:
 * - value: number | null | string ("" treated as null)
 * - onChange: (newValue: number | null) => void
 * - className?: string
 * - allowClear?: boolean (clicking the active value toggles to null)
 */
export default function Rating5({ value, onChange, className = '', allowClear = true }) {
  const v = value === '' || value == null ? null : Number(value);
  const items = [1, 2, 3, 4, 5];

  const baseBtn = 'w-9 h-9 rounded-full border text-sm font-medium transition-colors';

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Dash (null) option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`${baseBtn} ${
          v == null
            ? 'bg-neutral-100 border-neutral-400 text-neutral-700 hover:bg-neutral-200'
            : 'bg-white border-neutral-300 text-neutral-500 hover:bg-neutral-50'
        }`}
        aria-pressed={v == null}
        aria-label="Brak oceny"
        title="Brak oceny"
      >
        —
      </button>

      {items.map((n) => {
        const isActive = v === n;
        const handleClick = () => {
          if (allowClear && isActive) onChange(null);
          else onChange(n);
        };
        return (
          <button
            key={n}
            type="button"
            onClick={handleClick}
            className={`${baseBtn} ${
              isActive
                ? 'bg-lime-100 border-lime-500 text-lime-700 hover:bg-lime-200'
                : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50'
            }`}
            aria-pressed={isActive}
            aria-label={`Ocena ${n}`}
            title={`Ocena ${n}`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
