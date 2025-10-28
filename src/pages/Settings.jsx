import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { VISIT_FIELDS } from '../constants/visitFields';

const API = import.meta.env.VITE_API_URL;

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entityType, setEntityType] = useState('visit'); // visit | client | installer
  const [availableFields, setAvailableFields] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [visitGroups, setVisitGroups] = useState([]);
  const [clientGroups, setClientGroups] = useState([]);
  const [installerGroups, setInstallerGroups] = useState([]);
  const [markets, setMarkets] = useState([]);

  // Kreator reguł grupowych (modal)
  const [groupWizardOpen, setGroupWizardOpen] = useState(false);
  const [groupStep, setGroupStep] = useState(0);
  const [groupEditIndex, setGroupEditIndex] = useState(null); // null = nowa, number = edycja
  const [groupPhase, setGroupPhase] = useState('update'); // 'create' | 'update'
  const [groupDraft, setGroupDraft] = useState({
    fields: [],
    match: 'any',
    include_empty: false,
    markets: [],
    on_create: { title: '', dedup_window_minutes: 30, targets: { roles: [], user_ids: [], by_market: true } },
    on_update: { title: '', dedup_window_minutes: 30, targets: { roles: [], user_ids: [], by_market: true } },
  });

  const canManage = user?.role === 'admin';

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [r1, r2, r3, r4, r5] = await Promise.all([
          fetchWithAuth(`${API}/admin/notifications_config_get.php`),
          fetchWithAuth(`${API}/auth/roles.php`),
          fetchWithAuth(`${API}/users/list.php?active=1`),
          fetchWithAuth(`${API}/admin/notifications_fields.php?entity=visit`),
          fetchWithAuth(`${API}/admin/markets_list.php`),
        ]);
        const [d1, d2, d3, d4, d5] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json(), r5.json()]);
        if (!ignore) {
          if (d1?.success) {
            const cfg = d1.config ?? {};
            // group rules
            setVisitGroups(Array.isArray(cfg.visit_group_rules) ? cfg.visit_group_rules : []);
            setClientGroups(Array.isArray(cfg.client_group_rules) ? cfg.client_group_rules : []);
            setInstallerGroups(Array.isArray(cfg.installer_group_rules) ? cfg.installer_group_rules : []);
            // expose dynamic config path for transparency/debug
            // Removed legacy single-field rules handling
            // Removed config path handling

            // If current tab has no rules but another does, auto-focus the first non-empty entity
            const vg = Array.isArray(cfg.visit_group_rules) ? cfg.visit_group_rules : [];
            const cg = Array.isArray(cfg.client_group_rules) ? cfg.client_group_rules : [];
            const ig = Array.isArray(cfg.installer_group_rules) ? cfg.installer_group_rules : [];
            const firstNonEmpty = vg.length ? 'visit' : (cg.length ? 'client' : (ig.length ? 'installer' : 'visit'));
            if (firstNonEmpty !== 'visit') {
              setEntityType(firstNonEmpty);
            }
          }
          if (d2?.success) setRoles(d2.roles || []);
          if (d3?.success) setUsers(d3.users || []);
          if (d4?.success) setAvailableFields((d4.fields || []).map(k => ({ key: k, label: k })));
          if (d5?.success) setMarkets(d5.markets || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const groupRules = useMemo(() => {
    return entityType === 'visit' ? visitGroups : entityType === 'client' ? clientGroups : installerGroups;
  }, [entityType, visitGroups, clientGroups, installerGroups]);

  const onChangeEntity = async (next) => {
    setEntityType(next);
    try {
      const res = await fetchWithAuth(`${API}/admin/notifications_fields.php?entity=${next}`);
      const data = await res.json();
      if (data?.success) {
        setAvailableFields((data.fields || []).map(k => ({ key: k, label: k })));
      } else {
        setAvailableFields(next === 'visit' ? VISIT_FIELDS : []);
      }
    } catch (e) {
      setAvailableFields(next === 'visit' ? VISIT_FIELDS : []);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const normalizeRules = (arr) => (arr||[])
        .map(r => {
          const out = { ...r };
          // Ensure fields are valid for current entity
          const validFields = Array.isArray(out.fields) ? out.fields.filter(Boolean).map(String) : [];
          out.fields = Array.from(new Set(validFields));
          // Remove empty phases
          ['on_create','on_update'].forEach(k => {
            const ph = out[k];
            if (!ph) { delete out[k]; return; }
            const hasTargets = !!(ph.targets && ((ph.targets.roles||[]).length || (ph.targets.user_ids||[]).length));
            const hasEvent = !!ph.event;
            const hasTitle = !!ph.title;
            if (!hasTargets && !hasEvent && !hasTitle) delete out[k];
          });
          return out;
        })
        .filter(out => Array.isArray(out.fields) && out.fields.length > 0 && (out.on_create || out.on_update));

      const res = await fetchWithAuth(`${API}/admin/notifications_config_set.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Preserve legacy single-field rules (read-only in UI)
          visit_group_rules: normalizeRules(visitGroups),
          client_group_rules: normalizeRules(clientGroups),
          installer_group_rules: normalizeRules(installerGroups),
        }),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || 'Błąd zapisu');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Helpers: event string (use short, stable keys; fields są wyświetlane osobno)
  const computeGroupEvent = (flds, ent, phase) => {
    const safeEnt = ['visit','client','installer'].includes(ent) ? ent : 'client';
    const safePhase = phase === 'created' ? 'created' : 'updated';
    return `${safeEnt}.group.${safePhase}`;
  };

  // Group wizard handlers
  const openGroupWizard = (editIndex = null) => {
    setGroupStep(0);
    setGroupEditIndex(editIndex);
    if (typeof editIndex === 'number') {
      const src = groupRules[editIndex];
      // Preselect phase based simply on presence of on_update key; fallback to create
      const hasUpdate = src && typeof src.on_update === 'object' && src.on_update !== null;
      setGroupPhase(hasUpdate ? 'update' : 'create');
      // Prune fields that are not present for this entity
      const allowedKeys = (availableFields.length ? availableFields : (entityType==='visit'?VISIT_FIELDS:[])).map(f=>f.key);
      const prunedFields = (src.fields||[]).filter(k => allowedKeys.includes(k));
      setGroupDraft({
        fields: prunedFields,
        match: src.match || 'any',
        include_empty: !!src.include_empty,
        markets: src.markets || [],
        on_create: {
          title: src.on_create?.title || '',
          dedup_window_minutes: src.on_create?.dedup_window_minutes ?? 30,
          targets: {
            roles: src.on_create?.targets?.roles || [],
            user_ids: src.on_create?.targets?.user_ids || [],
            by_market: !!src.on_create?.targets?.by_market,
          },
        },
        on_update: {
          title: src.on_update?.title || '',
          dedup_window_minutes: src.on_update?.dedup_window_minutes ?? 30,
          targets: {
            roles: src.on_update?.targets?.roles || [],
            user_ids: src.on_update?.targets?.user_ids || [],
            by_market: !!src.on_update?.targets?.by_market,
          },
        },
      });
    } else {
      setGroupPhase('update');
      setGroupDraft({
        fields: [],
        match: 'any',
        include_empty: false,
        markets: [],
        on_create: { title: '', dedup_window_minutes: 30, targets: { roles: [], user_ids: [], by_market: true } },
        on_update: { title: '', dedup_window_minutes: 30, targets: { roles: [], user_ids: [], by_market: true } },
      });
    }
    setGroupWizardOpen(true);
  };

  const closeGroupWizard = () => setGroupWizardOpen(false);
  const toggleDraftField = (key) => setGroupDraft(prev => {
    const cur = new Set(prev.fields || []);
    if (cur.has(key)) cur.delete(key); else cur.add(key);
    return { ...prev, fields: Array.from(cur) };
  });
  const toggleDraftMarket = (id) => setGroupDraft(prev => {
    const cur = new Set(prev.markets || []);
    if (cur.has(id)) cur.delete(id); else cur.add(id);
    return { ...prev, markets: Array.from(cur) };
  });
  const toggleDraftRole = (phase, role) => setGroupDraft(prev => {
    const tgt = phase === 'create' ? (prev.on_create?.targets || {}) : (prev.on_update?.targets || {});
    const cur = new Set(tgt.roles || []);
    if (cur.has(role)) cur.delete(role); else cur.add(role);
    const patchTargets = { ...tgt, roles: Array.from(cur) };
    return phase === 'create'
      ? { ...prev, on_create: { ...(prev.on_create||{}), targets: patchTargets } }
      : { ...prev, on_update: { ...(prev.on_update||{}), targets: patchTargets } };
  });
  const toggleDraftUser = (phase, id) => setGroupDraft(prev => {
    const tgt = phase === 'create' ? (prev.on_create?.targets || {}) : (prev.on_update?.targets || {});
    const cur = new Set(tgt.user_ids || []);
    if (cur.has(id)) cur.delete(id); else cur.add(id);
    const patchTargets = { ...tgt, user_ids: Array.from(cur) };
    return phase === 'create'
      ? { ...prev, on_create: { ...(prev.on_create||{}), targets: patchTargets } }
      : { ...prev, on_update: { ...(prev.on_update||{}), targets: patchTargets } };
  });

  // Toggle all helpers
  const toggleAllRoles = (phase) => setGroupDraft(prev => {
    const all = roles;
    const tgt = phase === 'create' ? (prev.on_create?.targets || {}) : (prev.on_update?.targets || {});
    const cur = new Set(tgt.roles || []);
    const isAll = all.length > 0 && all.every(r => cur.has(r));
    const patchTargets = { ...tgt, roles: isAll ? [] : all.slice() };
    return phase === 'create'
      ? { ...prev, on_create: { ...(prev.on_create||{}), targets: patchTargets } }
      : { ...prev, on_update: { ...(prev.on_update||{}), targets: patchTargets } };
  });

  const toggleAllUsers = (phase) => setGroupDraft(prev => {
    const all = users.map(u => u.id);
    const tgt = phase === 'create' ? (prev.on_create?.targets || {}) : (prev.on_update?.targets || {});
    const cur = new Set(tgt.user_ids || []);
    const isAll = all.length > 0 && all.every(id => cur.has(id));
    const patchTargets = { ...tgt, user_ids: isAll ? [] : all.slice() };
    return phase === 'create'
      ? { ...prev, on_create: { ...(prev.on_create||{}), targets: patchTargets } }
      : { ...prev, on_update: { ...(prev.on_update||{}), targets: patchTargets } };
  });

  const groupCanNext = () => {
    if (groupStep === 0) return Array.isArray(groupDraft.fields) && groupDraft.fields.length > 0 && ['any','all'].includes(groupDraft.match || 'any');
    return true;
  };

  const applyGroupWizard = () => {
    const payload = {
      ...groupDraft,
      on_create: { ...(groupDraft.on_create||{}), event: computeGroupEvent(groupDraft.fields||[], entityType, 'created') },
      on_update: { ...(groupDraft.on_update||{}), event: computeGroupEvent(groupDraft.fields||[], entityType, 'updated') },
    };
  // Only keep the selected phase to reflect user's intent
  if (groupPhase === 'create') { delete payload.on_update; }
  else if (groupPhase === 'update') { delete payload.on_create; }

    if (entityType === 'visit') {
      if (typeof groupEditIndex === 'number') setVisitGroups(prev => prev.map((g,i)=> i===groupEditIndex ? payload : g));
      else setVisitGroups(prev => [...prev, payload]);
    } else if (entityType === 'client') {
      if (typeof groupEditIndex === 'number') setClientGroups(prev => prev.map((g,i)=> i===groupEditIndex ? payload : g));
      else setClientGroups(prev => [...prev, payload]);
    } else {
      if (typeof groupEditIndex === 'number') setInstallerGroups(prev => prev.map((g,i)=> i===groupEditIndex ? payload : g));
      else setInstallerGroups(prev => [...prev, payload]);
    }
    setGroupWizardOpen(false);
  };

  const removeGroupAt = (idx) => {
    if (entityType === 'visit') setVisitGroups(prev => prev.filter((_,i)=>i!==idx));
    else if (entityType === 'client') setClientGroups(prev => prev.filter((_,i)=>i!==idx));
    else setInstallerGroups(prev => prev.filter((_,i)=>i!==idx));
  };

  // Removed legacy single-field rule deletion logic

  if (!canManage) return <div>Brak uprawnień</div>;
  if (loading) return <div>Ładowanie…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Ustawienia powiadomień</h1>

      <div className="flex flex-wrap gap-2 mb-3">
        <label className="flex items-center gap-2">
          <input type="radio" name="entityType" value="visit" checked={entityType==='visit'} onChange={()=>onChangeEntity('visit')} /> Wizyta
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="entityType" value="client" checked={entityType==='client'} onChange={()=>onChangeEntity('client')} /> Klient
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="entityType" value="installer" checked={entityType==='installer'} onChange={()=>onChangeEntity('installer')} /> Instalator
        </label>
      </div>

      <div className="flex gap-2 mb-4">
        <button className="buttonGreen" onClick={()=>openGroupWizard()}>Dodaj regułę (kreator)</button>
        <button className="buttonGreen2" onClick={save} disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz'}</button>
      </div>

      {(!groupRules || groupRules.length === 0) ? (
        <div className="text-sm text-gray-500">Brak reguł grupowych. Dodaj pierwszą powyżej.</div>
      ) : (
        <div className="space-y-2">
          {groupRules.map((gr, idx) => {
            const rolesCreate = (gr.on_create?.targets?.roles || []).join(', ');
            const rolesUpdate = (gr.on_update?.targets?.roles || []).join(', ');
            const usersCreate = (gr.on_create?.targets?.user_ids || []).map(id => {
              const u = users.find(x=>x.id===id); return u ? (u.name || u.username) + (u.role?` (${u.role})`: '') : `User#${id}`;
            }).join(', ');
            const usersUpdate = (gr.on_update?.targets?.user_ids || []).map(id => {
              const u = users.find(x=>x.id===id); return u ? (u.name || u.username) + (u.role?` (${u.role})`: '') : `User#${id}`;
            }).join(', ');
            const titleCreate = gr.on_create ? (gr.on_create.title || '(on_create)') : null;
            const titleUpdate = gr.on_update ? (gr.on_update.title || '(on_update)') : null;
            const fieldsStr = (gr.fields || []).join(', ');
            const matchStr = (gr.match === 'all') ? 'wszystkie' : 'którekolwiek';
            return (
              <div key={idx} className="border rounded p-3 bg-white flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {titleCreate && <span className="mr-2 inline-flex items-center gap-1"><span className="px-1.5 py-0.5 text-[10px] bg-sky-100 text-sky-700 rounded">on_create</span> {titleCreate}</span>}
                    {titleUpdate && <span className="inline-flex items-center gap-1"><span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded">on_update</span> {titleUpdate}</span>}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Pola: {fieldsStr || '—'}; tryb: {matchStr}</div>
                  {titleCreate && (
                    <div className="text-xs text-gray-600">on_create → role: {rolesCreate || '—'}; użytkownicy: {usersCreate || '—'}</div>
                  )}
                  {titleUpdate && (
                    <div className="text-xs text-gray-600">on_update → role: {rolesUpdate || '—'}; użytkownicy: {usersUpdate || '—'}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="buttonGreen2" onClick={()=>openGroupWizard(idx)}>Edytuj</button>
                  <button className="buttonRedNeg2" onClick={()=>removeGroupAt(idx)}>Usuń</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {groupWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeGroupWizard} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Kreator reguły grupowej</h3>
              <button className="buttonRedNeg2" onClick={closeGroupWizard}>Zamknij</button>
            </div>

            <div className="mb-4 text-sm text-gray-600">Krok {groupStep + 1} z 4</div>
            {/* Phase selector */}
            <div className="mb-3 text-sm flex items-center gap-4">
              <span className="text-gray-700">Faza:</span>
              <label className="flex items-center gap-1">
                <input type="radio" name="groupPhase" value="create" checked={groupPhase==='create'} onChange={()=>setGroupPhase('create')} /> on_create
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="groupPhase" value="update" checked={groupPhase==='update'} onChange={()=>setGroupPhase('update')} /> on_update
              </label>
            </div>
            {entityType==='client' && groupPhase==='create' && (
              <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                Uwaga: edycja klienta wyzwala tylko fazę <b>on_update</b>. Jeśli chcesz powiadomienia przy edycji, wybierz on_update.
              </div>
            )}

            {groupStep === 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div>Wybierz pola (encja: <span className="font-medium">{entityType}</span>) oraz tryb</div>
                  <button
                    type="button"
                    className="buttonGreen2"
                    onClick={() => {
                      const avail = (availableFields.length ? availableFields : (entityType==='visit'?VISIT_FIELDS:[]));
                      const allKeys = avail.map(f => f.key);
                      const selected = new Set(groupDraft.fields || []);
                      const isAll = allKeys.length > 0 && allKeys.every(k => selected.has(k));
                      setGroupDraft(prev => ({ ...prev, fields: isAll ? [] : allKeys }));
                    }}
                  >
                    {(() => {
                      const avail = (availableFields.length ? availableFields : (entityType==='visit'?VISIT_FIELDS:[]));
                      const allKeys = avail.map(f => f.key);
                      const selected = new Set(groupDraft.fields || []);
                      const isAll = allKeys.length > 0 && allKeys.every(k => selected.has(k));
                      return isAll ? 'Odznacz wszystkie' : 'Zaznacz wszystkie';
                    })()}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded">
                  {(availableFields.length ? availableFields : (entityType==='visit'?VISIT_FIELDS:[])).map(f => (
                    <label key={f.key} className="flex items-center gap-2">
                      <input type="checkbox" checked={new Set(groupDraft.fields||[]).has(f.key)} onChange={()=>toggleDraftField(f.key)} />
                      <span>{f.label || f.key}</span>
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-2">
                    Tryb
                    <select className="border rounded p-1" value={groupDraft.match||'any'} onChange={e=>setGroupDraft(prev=>({...prev, match: e.target.value}))}>
                      <option value="any">którekolwiek</option>
                      <option value="all">wszystkie</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={!!groupDraft.include_empty} onChange={e=>setGroupDraft(prev=>({...prev, include_empty: e.target.checked}))} />
                    on_update: uwzględnij zmiany do pustej wartości
                  </label>
                </div>
              </div>
            )}

            {groupStep === 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>Rynki (pozostaw puste = wszystkie)</div>
                  <button
                    type="button"
                    className="buttonGreen2"
                    onClick={() => {
                      const allIds = (markets||[]).map(m => m.id);
                      const sel = new Set(groupDraft.markets || []);
                      const isAll = allIds.length > 0 && allIds.every(id => sel.has(id));
                      setGroupDraft(prev => ({ ...prev, markets: isAll ? [] : allIds }));
                    }}
                  >
                    {(() => {
                      const allIds = (markets||[]).map(m => m.id);
                      const sel = new Set(groupDraft.markets || []);
                      const isAll = allIds.length > 0 && allIds.every(id => sel.has(id));
                      return isAll ? 'Odznacz wszystkie' : 'Zaznacz wszystkie';
                    })()}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded">
                  {(markets||[]).map(m => (
                    <label key={m.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={new Set(groupDraft.markets||[]).has(m.id)} onChange={()=>toggleDraftMarket(m.id)} />
                      <span>{m.name} (ID: {m.id})</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {groupPhase==='create' ? (
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" checked={!!groupDraft.on_create?.targets?.by_market} onChange={e=>setGroupDraft(prev=>({
                        ...prev,
                        on_create: { ...(prev.on_create||{}), targets: { ...(prev.on_create?.targets||{}), by_market: e.target.checked } }
                      }))} />
                      on_create: filtruj odbiorców po rynku (by_market)
                    </label>
                  ) : (
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" checked={!!groupDraft.on_update?.targets?.by_market} onChange={e=>setGroupDraft(prev=>({
                        ...prev,
                        on_update: { ...(prev.on_update||{}), targets: { ...(prev.on_update?.targets||{}), by_market: e.target.checked } }
                      }))} />
                      on_update: filtruj odbiorców po rynku (by_market)
                    </label>
                  )}
                </div>
              </div>
            )}

            {groupStep === 2 && (
              <div className="space-y-2">
                <div className="text-sm">Odbiorcy</div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="border rounded p-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{groupPhase==='create' ? 'on_create' : 'on_update'}</div>
                      <div className="flex gap-2">
                        <button type="button" className="buttonGreen2" onClick={() => toggleAllRoles(groupPhase)}>
                          {(() => {
                            const all = roles; const sel = new Set((groupPhase==='create' ? groupDraft.on_create?.targets?.roles : groupDraft.on_update?.targets?.roles) || []);
                            const isAll = all.length > 0 && all.every(r => sel.has(r));
                            return isAll ? 'Odznacz role' : 'Zaznacz role';
                          })()}
                        </button>
                        <button type="button" className="buttonGreen2" onClick={() => toggleAllUsers(groupPhase)}>
                          {(() => {
                            const all = users.map(u => u.id); const sel = new Set((groupPhase==='create' ? groupDraft.on_create?.targets?.user_ids : groupDraft.on_update?.targets?.user_ids) || []);
                            const isAll = all.length > 0 && all.every(id => sel.has(id));
                            return isAll ? 'Odznacz użytkowników' : 'Zaznacz użytkowników';
                          })()}
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Role</div>
                    <div className="mt-1 w-full border rounded p-2 max-h-28 overflow-auto">
                      {roles.map(r => (
                        <label key={r} className="flex items-center gap-2 py-0.5">
                          <input type="checkbox" checked={new Set((groupPhase==='create' ? groupDraft.on_create?.targets?.roles : groupDraft.on_update?.targets?.roles)||[]).has(r)} onChange={()=>toggleDraftRole(groupPhase==='create'?'create':'update', r)} />
                          <span>{r}</span>
                        </label>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Użytkownicy</div>
                    <div className="mt-1 w-full border rounded p-2 max-h-28 overflow-auto">
                      {users.map(u => (
                        <label key={u.id} className="flex items-center gap-2 py-0.5">
                          <input type="checkbox" checked={new Set((groupPhase==='create' ? groupDraft.on_create?.targets?.user_ids : groupDraft.on_update?.targets?.user_ids)||[]).has(u.id)} onChange={()=>toggleDraftUser(groupPhase==='create'?'create':'update', u.id)} />
                          <span>{u.name || u.username} {u.surname?u.surname:''} {u.role?`(${u.role})`:''}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {groupStep === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  {groupPhase==='create' ? (
                    <div className="border rounded p-2">
                      <div className="font-medium">on_create</div>
                      <label className="block mt-2"><span className="text-sm">Tytuł</span>
                        <input className="mt-1 w-full border rounded p-2" value={groupDraft.on_create?.title||''} onChange={e=>setGroupDraft(prev=>({ ...prev, on_create: { ...(prev.on_create||{}), title: e.target.value } }))} />
                      </label>
                      <label className="block mt-2"><span className="text-sm">Dedup (min)</span>
                        <input type="number" className="mt-1 w-full border rounded p-2" value={groupDraft.on_create?.dedup_window_minutes ?? 30} onChange={e=>setGroupDraft(prev=>({ ...prev, on_create: { ...(prev.on_create||{}), dedup_window_minutes: parseInt(e.target.value,10)||0 } }))} />
                      </label>
                      <div className="text-xs text-gray-500 mt-2">Event: <span className="font-mono">{computeGroupEvent(groupDraft.fields||[], entityType, 'created')}</span></div>
                    </div>
                  ) : (
                    <div className="border rounded p-2">
                      <div className="font-medium">on_update</div>
                      <label className="block mt-2"><span className="text-sm">Tytuł</span>
                        <input className="mt-1 w-full border rounded p-2" value={groupDraft.on_update?.title||''} onChange={e=>setGroupDraft(prev=>({ ...prev, on_update: { ...(prev.on_update||{}), title: e.target.value } }))} />
                      </label>
                      <label className="block mt-2"><span className="text-sm">Dedup (min)</span>
                        <input type="number" className="mt-1 w-full border rounded p-2" value={groupDraft.on_update?.dedup_window_minutes ?? 30} onChange={e=>setGroupDraft(prev=>({ ...prev, on_update: { ...(prev.on_update||{}), dedup_window_minutes: parseInt(e.target.value,10)||0 } }))} />
                      </label>
                      <div className="text-xs text-gray-500 mt-2">Event: <span className="font-mono">{computeGroupEvent(groupDraft.fields||[], entityType, 'updated')}</span></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-between">
              <button className="buttonRedNeg2" onClick={closeGroupWizard}>Anuluj</button>
              <div className="flex gap-2">
                <button className="buttonGreen2" onClick={()=>setGroupStep(s=>Math.max(0, s-1))} disabled={groupStep===0}>Wstecz</button>
                {groupStep < 3 ? (
                  <button className="buttonGreen" onClick={()=>groupCanNext() && setGroupStep(s=>Math.min(3, s+1))} disabled={!groupCanNext()}>Dalej</button>
                ) : (
                  <button className="buttonGreen" onClick={applyGroupWizard}>Zakończ i {typeof groupEditIndex === 'number' ? 'zapisz' : 'dodaj'}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
