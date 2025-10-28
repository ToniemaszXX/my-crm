import { useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { resolveUserLabelById } from '../utils/usersCache';

/**
 * Generic user picker.
 * Props:
 * - role?: string (e.g., 'manager')
 * - roleByMarket?: Record<number|string, string> // map marketId -> role
 * - resolveRole?: (marketId) => string | undefined
 * - activeOnly?: boolean (default true)
 * - marketId?: number|string|null (1=PL,2=EXP)
 * - value: string | ''  // Full name value to persist: "name surname"
 * - valueId?: number    // Optional selected user id to preselect
 * - onChange: (value: string) => void
 * - onChangeId?: (id: number|undefined) => void
 * - placeholder?: string
 * - noMarketPlaceholder?: string
 * - disabled?: boolean
 * - name?: string
 * - className?: string
 * - showNoMarketHint?: boolean
 */
export default function UserSelect({
  role,
  roleByMarket,
  resolveRole,
  activeOnly = true,
  marketId,
  value,
  valueId,
  onChange,
  onChangeId,
  placeholder = '--',
  noMarketHint = 'Najpierw wybierz rynek, aby wyświetlić listę użytkowników.',
  noMarketPlaceholder = 'Najpierw wybierz rynek',
  disabled = false,
  name,
  className = 'w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400',
  showNoMarketHint = true,
  roleFilter,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // local label to render when ID is known but item list doesn't include it (role filter mismatch)
  const [selectedLabel, setSelectedLabel] = useState('');

  const effectiveRole = useMemo(() => {
    if (roleFilter) return roleFilter; // explicit override wins
    if (typeof resolveRole === 'function') {
      const r = resolveRole(marketId);
      if (r) return r;
    }
    if (roleByMarket && marketId !== undefined && marketId !== null && `${marketId}` !== '') {
      const key = String(marketId);
      if (roleByMarket[key] !== undefined) return roleByMarket[key];
      if (roleByMarket[Number(key)] !== undefined) return roleByMarket[Number(key)];
    }
    return role;
  }, [roleFilter, resolveRole, roleByMarket, marketId, role]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (effectiveRole) params.set('role', effectiveRole);
    if (activeOnly) params.set('active', '1');
    if (marketId !== undefined && marketId !== null && `${marketId}` !== '') {
      params.set('market_id', String(marketId));
    }
    return params.toString();
  }, [effectiveRole, activeOnly, marketId]);

  const isMarketMissing = (marketId === undefined || marketId === null || `${marketId}` === '');

  useEffect(() => {
    // When market not selected yet, clear and do not fetch
    if (isMarketMissing) {
      setItems([]);
  setSelectedLabel('');
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const url = `${import.meta.env.VITE_API_URL}/users/list.php${query ? `?${query}` : ''}`;
        const res = await fetchWithAuth(url, { method: 'GET' });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        const users = Array.isArray(data.users) ? data.users : [];
        // map to label/value where value is "name surname" and label same
        const mapped = users.map(u => {
          const name = (u.name || '').trim();
          const surname = (u.surname || '').trim();
          const full = (name || surname) ? `${name}${name && surname ? ' ' : ''}${surname}`.trim() : (u.username || '').trim();
          return { id: u.id, label: full, value: full };
        }).filter(x => x.label);
        if (!cancelled) setItems(mapped);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [query, isMarketMissing]);

  // If valueId is provided and value (label) is empty or mismatched, preselect by ID when items are loaded.
  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;
    if (valueId === undefined || valueId === null || valueId === '') return;
    const target = items.find(i => Number(i.id) === Number(valueId));
    if (!target) return;
    if (value !== target.value) {
      if (typeof onChange === 'function') onChange(target.value);
      if (typeof onChangeId === 'function') onChangeId(Number(target.id));
      setSelectedLabel(target.value);
    }
  }, [items, valueId, value, onChange, onChangeId]);

  // If items do not include current valueId, keep showing a synthetic option so UI still reflects selection
  const hasCurrentInItems = useMemo(() => items.some(i => Number(i.id) === Number(valueId)), [items, valueId]);
  useEffect(() => {
    if (!value && selectedLabel && hasCurrentInItems) {
      // clear synthetic label once it's in list
      setSelectedLabel('');
    }
  }, [hasCurrentInItems, value, selectedLabel]);

  // Resolve label by ID if not present in items (e.g., different role or inactive user)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (valueId == null || valueId === '' || hasCurrentInItems) return;
      const label = await resolveUserLabelById({ id: valueId, marketId, role: effectiveRole }).catch(() => undefined);
      if (cancelled) return;
      if (label && label !== value) {
        setSelectedLabel(label);
        if (typeof onChange === 'function') onChange(label);
        if (typeof onChangeId === 'function') onChangeId(Number(valueId));
      }
    })();
    return () => { cancelled = true; };
  }, [valueId, marketId, effectiveRole, hasCurrentInItems]);

  return (
    <div>
      <select
        name={name}
        value={value || selectedLabel || ''}
        onChange={(e) => {
          const val = e.target.value;
          const sel = e.target.selectedOptions && e.target.selectedOptions[0];
          const idAttr = sel ? sel.getAttribute('data-id') : null;
          if (typeof onChange === 'function') onChange(val);
          if (typeof onChangeId === 'function') onChangeId(idAttr ? Number(idAttr) : undefined);
          setSelectedLabel('');
        }}
        disabled={disabled || loading || isMarketMissing}
        className={className}
      >
        <option value="">{isMarketMissing ? noMarketPlaceholder : (loading ? 'Loading…' : (error ? 'Error' : placeholder))}</option>
        {!hasCurrentInItems && valueId != null && valueId !== '' && (value || selectedLabel) && (
          <option value={value || selectedLabel} data-id={valueId}>{value || selectedLabel}</option>
        )}
        {items.map(opt => (
          <option key={opt.id} value={opt.value} data-id={opt.id}>{opt.label}</option>
        ))}
      </select>
      {isMarketMissing && showNoMarketHint && (
        <div className="text-neutral-600 text-sm mt-1">{noMarketHint}</div>
      )}
      {error && !isMarketMissing && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </div>
  );
}
