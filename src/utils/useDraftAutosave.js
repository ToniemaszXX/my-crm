import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAutosave } from '../hooks/useAutosave';
import { draftsFind, draftsSave } from '../api/drafts';
import { lsGetDraft, lsSaveDraft } from './autosaveStorage';

/**
 * High-level adapter: łączy useAutosave z backend drafts.
 * - Przy mount próbuje przywrócić draft z BE; fallback do localStorage.
 * - saveFn zapisuje do BE (jeśli online) i mirror do localStorage.
 */
export function useDraftAutosave({ entityType, entityId, contextKey, values, isDirty, enabled = true }) {
  const [draftId, setDraftId] = useState(null);
  const [initialRestored, setInitialRestored] = useState(null); // payload lub null
  const scope = useMemo(() => ({ entityType, entityId, contextKey }), [entityType, entityId, contextKey]);

  // Initial restore
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const be = await draftsFind(scope);
        if (alive && be?.draft) {
          setDraftId(be.draft.id);
          setInitialRestored(be.draft.payload);
          return;
        }
      } catch {}
      // fallback localStorage
      const ls = lsGetDraft(scope);
      if (alive && ls) setInitialRestored(ls.payload);
    })();
    return () => { alive = false; };
  }, [scope]);

  const saveFn = useCallback(async (vals) => {
    // save to backend (if possible)
    try {
      const res = await draftsSave({
        entityType,
        entityId,
        contextKey,
        payload: vals,
        draftId: draftId ?? undefined,
      });
      if (res?.draft_id) setDraftId(res.draft_id);
    } catch (e) {
      // ignore, rely on localStorage mirror when offline
    }
    // mirror to localStorage
    lsSaveDraft({ entityType, entityId, contextKey, payload: vals });
    return { ok: true };
  }, [contextKey, draftId, entityId, entityType]);

  const autosave = useAutosave({ values, isDirty, saveFn, enabled });
  return { ...autosave, draftId, initialRestored };
}
