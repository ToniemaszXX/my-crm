import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useAutosave
 * - intervalMs: co ile autozapis (domyślnie 120000)
 * - debounceMs: opóźnienie po edycji zanim licznik ruszy (domyślnie 1500)
 * - enabled: włącznik
 * saveFn(values) -> Promise<{ ok?: boolean } | any>
 */
export function useAutosave({
  values,
  isDirty,
  saveFn,
  intervalMs = 120000,
  debounceMs = 1500,
  enabled = true,
}) {
  const [status, setStatus] = useState('idle'); // idle | countdown | saving | saved | error | offline
  const [nextInMs, setNextInMs] = useState(intervalMs);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const timerRef = useRef(null);
  const lastHashRef = useRef('');
  const lastSavePromise = useRef(null);
  const doSaveRef = useRef(null);

  const computeHash = (obj) => {
    try { return JSON.stringify(obj); } catch { return String(obj); }
  };

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const startCountdown = useCallback(() => {
    clearTimer();
    setStatus(navigator.onLine ? 'countdown' : 'offline');
    setNextInMs(intervalMs);
    timerRef.current = setInterval(() => {
      setNextInMs((ms) => {
        if (ms <= 1000) {
          clearTimer();
          const fn = doSaveRef.current;
          if (typeof fn === 'function') {
            void fn();
          }
          return intervalMs;
        }
        return ms - 1000;
      });
    }, 1000);
  }, [intervalMs]);

  const doSave = useCallback(async () => {
    if (!enabled) return;
    if (!isDirty) return; // nic się nie zmieniło wg form lib
    if (!navigator.onLine) { setStatus('offline'); return; }
    if (lastSavePromise.current) return; // anty-paralelizm

    setStatus('saving');
    const payloadHash = computeHash(values);
    if (payloadHash === lastHashRef.current) {
      setStatus('saved');
      setLastSavedAt(new Date());
      startCountdown();
      return;
    }
    try {
      const p = saveFn(values);
      lastSavePromise.current = p;
      await p;
      lastHashRef.current = payloadHash;
      setStatus('saved');
      setLastSavedAt(new Date());
      startCountdown();
    } catch (e) {
      console.error('[useAutosave] save error', e);
      setStatus('error');
    } finally {
      lastSavePromise.current = null;
    }
  }, [enabled, isDirty, saveFn, startCountdown, values]);

  // Keep latest doSave in a ref so interval always calls fresh logic/values
  useEffect(() => {
    doSaveRef.current = doSave;
  }, [doSave]);

  // Restart licznika po zmianie values (debounce)
  useEffect(() => {
    if (!enabled) { clearTimer(); setStatus('idle'); return; }
    if (!isDirty) { clearTimer(); setStatus('idle'); return; }

    setStatus(navigator.onLine ? 'countdown' : 'offline');
    clearTimer();
    const t = setTimeout(() => startCountdown(), debounceMs);
    return () => clearTimeout(t);
  }, [values, isDirty, enabled, debounceMs, startCountdown]);

  // Online/offline handling
  useEffect(() => {
    const handleOnline = () => { if (enabled && isDirty) { startCountdown(); } };
    const handleOffline = () => { setStatus('offline'); clearTimer(); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, isDirty, startCountdown]);

  // Before unload: spróbuj zapisać raz
  useEffect(() => {
    const handler = () => { if (enabled && isDirty) { void doSave(); } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled, isDirty, doSave]);

  const saveNow = useCallback(() => { void doSave(); }, [doSave]);

  return { status, nextInMs, lastSavedAt, saveNow };
}
