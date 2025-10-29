// src/components/AddContactModal.jsx
import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { checkSessionBeforeSubmit } from "../utils/checkSessionBeforeSubmit";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { usePreventDoubleSubmit } from "../utils/preventDoubleSubmit";
import { useTranslation } from 'react-i18next';
import AutosaveIndicator from './AutosaveIndicator';
import { useDraftAutosave } from '../utils/useDraftAutosave';
import { draftsDiscard } from '../api/drafts';
import { lsDiscardDraft } from '../utils/autosaveStorage';
import Section from './common/Section';
import Grid from './common/Grid';
import FormField from './common/FormField';

const emptyContact = {
  department: "",
  position: "",
  first_name: "",
  last_name: "",
  name: "", // compat
  phone: "",
  email: "",
  function_notes: "",
  decision_level: "-", // taki sam default jak w edytorze
};

// pomocniczo: nie pozwalamy wysłać „totalnie pustego” kontaktu
const isEmptyContact = (c) => {
  const cc = c || {};
  return (
    !cc.department &&
    !cc.position &&
    !cc.first_name &&
    !cc.last_name &&
    !cc.name &&
    !cc.phone &&
    !cc.email &&
    !cc.function_notes &&
    (!cc.decision_level || cc.decision_level === "-")
  );
};

export default function AddContactModal({
  isOpen,
  onClose,
  clientId,          // backward compat for client
  onAdded,           // (optional) callback(newContact) po sukcesie
  entityType = 'client',
  fixedEntityId,     // if provided, lock select and send this id
}) {
  const [form, setForm] = useState({ ...emptyContact });
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  // Persisted context per owner
  const ownerId = fixedEntityId || (entityType === 'client' ? clientId : null) || 'none';
  const ctxStorageKey = useMemo(() => `draft_ctx_contact_${entityType}_${ownerId}`, [entityType, ownerId]);
  const contextKeyRef = useRef(null);
  if (contextKeyRef.current === null) {
    let existing = null;
    try { existing = localStorage.getItem(ctxStorageKey); } catch {}
    if (!existing) {
      const gen = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? `contact-new-${entityType}-${ownerId}-${crypto.randomUUID()}`
        : `contact-new-${entityType}-${ownerId}-${Date.now()}-${Math.floor(Math.random()*1e6)}`;
      existing = gen;
      try { localStorage.setItem(ctxStorageKey, existing); } catch {}
    }
    contextKeyRef.current = existing;
  }

  const wrapSubmit = usePreventDoubleSubmit();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => setForm({ ...emptyContact });

  // AUTOSAVE
  const autosaveValues = form;
  const computedIsDirty = useMemo(() => {
    const f = autosaveValues || {};
    return !!(
      (f.first_name || '').trim() ||
      (f.last_name || '').trim() ||
      (f.name || '').trim() ||
      (f.phone || '').trim() ||
      (f.email || '').trim() ||
      (f.position || '').trim() ||
      (f.department || '').trim() ||
      (f.function_notes || '').trim()
    );
  }, [autosaveValues]);
  const { status: autosaveStatus, nextInMs, lastSavedAt, saveNow, draftId } = useDraftAutosave({
    entityType: 'contact',
    contextKey: contextKeyRef.current,
    values: autosaveValues,
    isDirty: computedIsDirty,
    enabled: isOpen,
  });

  const handleSubmit = wrapSubmit(async (e) => {
    e.preventDefault();
    const ownerId = fixedEntityId || (entityType === 'client' ? clientId : null);
    if (!ownerId) { alert(t('addContactModal.errors.missingContext')); return; }
    if (isEmptyContact(form)) {
      alert(t('addContactModal.errors.emptyContact'));
      return;
    }
    // walidacja: wymagaj co najmniej imienia lub nazwiska
    const firstNameTrim = (form.first_name || '').trim();
    const lastNameTrim = (form.last_name || '').trim();
    const nameTrim = (form.name || '').trim();
    // jeśli brak first/last, ale ktoś podał pełne name, przynajmniej jedno musi być po rozbiciu
    if (!firstNameTrim && !lastNameTrim) {
      if (nameTrim) {
        const pos = nameTrim.lastIndexOf(' ');
        const f = pos > 0 ? nameTrim.slice(0, pos).trim() : '';
        const l = pos > -1 ? nameTrim.slice(pos + 1).trim() : nameTrim;
        if (!f && !l) {
          alert(t('addContactModal.errors.namePartRequired'));
          return;
        }
      } else {
        alert(t('addContactModal.errors.namePartRequired'));
        return;
      }
    }

    setIsSaving(true);

    const okSession = await checkSessionBeforeSubmit();
    if (!okSession) {
      setIsSaving(false);
      return;
    }

    try {
      // Split name if only name is provided, else use first_name/last_name
      let first_name = (form.first_name || '').trim();
      let last_name = (form.last_name || '').trim();
      let name = (form.name || '').trim();
      if (!first_name && !last_name && name) {
        const pos = name.lastIndexOf(' ');
        first_name = pos > 0 ? name.slice(0, pos).trim() : '';
        last_name  = pos > -1 ? name.slice(pos + 1).trim() : name;
      }
      if (!name) name = `${first_name} ${last_name}`.trim();
      const payload = {
        department: form.department || "",
        position: form.position || "",
        first_name,
        last_name,
        name,
        phone: form.phone || "",
        email: form.email || "",
        function_notes: form.function_notes || "",
        decision_level: form.decision_level ?? "-",
      };
      // set correct owner id
      if (entityType === 'client') payload.client_id = ownerId;
      if (entityType === 'designer') payload.designer_id = ownerId;
      if (entityType === 'installer') payload.installer_id = ownerId;
      if (entityType === 'deweloper') payload.deweloper_id = ownerId;

  const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/contacts/create.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch { /* ignore JSON parse errors */ }

      if (!(res.ok && data?.success)) {
        const msg =
          data?.message ||
          res.statusText ||
          t('addContactModal.errors.apiFailed');
        alert(msg);
        setIsSaving(false);
        return;
      }

      // sukces — dołóż nowy kontakt do listy w detalu klienta
  const newContact = { id: data.id, ...form, first_name, last_name, name };
  if (entityType === 'client') newContact.client_id = ownerId;
  if (entityType === 'designer') newContact.designer_id = ownerId;
  if (entityType === 'installer') newContact.installer_id = ownerId;
  if (entityType === 'deweloper') newContact.deweloper_id = ownerId;
  onAdded?.(newContact);
  // Discard draft after success
  try { if (draftId) await draftsDiscard(draftId); } catch {}
  try { lsDiscardDraft({ entityType: 'contact', contextKey: contextKeyRef.current }); } catch {}
  try { localStorage.removeItem(ctxStorageKey); } catch {}
  reset();
  onClose();
    } catch (err) {
      console.error(err);
      alert(`${t('addContactModal.errors.saveError')}: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  });

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[110]'>
      <div className='bg-neutral-100 pb-8 rounded-lg w-[900px] max-h-[85vh] overflow-y-auto'>
        <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
          <h2 className="text-lime-500 text-xl font-extrabold">{t('addContactModal.title')}</h2>
          <div className="flex items-center gap-3">
            <AutosaveIndicator status={autosaveStatus} nextInMs={nextInMs} lastSavedAt={lastSavedAt} onSaveNow={saveNow} />
            <button
              className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none"
              onClick={onClose}
              aria-label={t('buttons.close')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="text-white flex flex-col gap-3 pl-8 pr-8 pt-4">
          <Section title={t('addContactModal.contactDetails')}>
            <Grid>
              <FormField id="department" label={t('fields.department')}>
                <select
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white"
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                >
                  <option value="">{t('addClientModal.selectDepartment')}</option>
                  <option value="Zarząd">{t('addClientModal.departments.management')}</option>
                  <option value="Sprzedaż">{t('addClientModal.departments.sales')}</option>
                  <option value="Zakupy">{t('addClientModal.departments.purchasing')}</option>
                  <option value="Marketing">{t('addClientModal.departments.marketing')}</option>
                  <option value="Inwestycje">{t('addClientModal.departments.investments')}</option>
                  <option value="Finanse">{t('addClientModal.departments.finance')}</option>
                  <option value="Logistyka">{t('addClientModal.departments.logistics')}</option>
                  <option value="Administracja">{t('addClientModal.departments.admin')}</option>
                  <option value="Obsługi klienta">{t('addClientModal.departments.customerService')}</option>
                </select>
              </FormField>

              <FormField id="position" label={t('fields.position')}>
                <input type="text" className="w-full border border-neutral-300 rounded px-3 py-2 bg-white" value={form.position} onChange={(e) => handleChange("position", e.target.value)} />
              </FormField>

              <FormField id="first_name" label={t('fields.firstName')}>
                <input type="text" className="w-full border border-neutral-300 rounded px-3 py-2 bg-white" value={form.first_name} onChange={(e) => handleChange("first_name", e.target.value)} />
              </FormField>

              <FormField id="last_name" label={t('fields.lastName')}>
                <input type="text" className="w-full border border-neutral-300 rounded px-3 py-2 bg-white" value={form.last_name} onChange={(e) => handleChange("last_name", e.target.value)} />
              </FormField>

              <FormField id="phone" label={t('fields.phone')}>
                <input type="text" className="w-full border border-neutral-300 rounded px-3 py-2 bg-white" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
              </FormField>

              <FormField id="email" label={t('fields.email')}>
                <input type="email" className="w-full border border-neutral-300 rounded px-3 py-2 bg-white" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </FormField>

              <FormField id="function_notes" label={t('fields.functionNotes')}>
                <input type="text" className="w-full border border-neutral-300 rounded px-3 py-2 bg-white" value={form.function_notes} onChange={(e) => handleChange("function_notes", e.target.value)} />
              </FormField>

              <FormField id="decision_level" label={t('addClientModal.decisionLevel')}>
                <select
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white"
                  value={form.decision_level}
                  onChange={(e) => handleChange("decision_level", e.target.value)}
                >
                  <option value="-">{t('addClientModal.decisionLevel')}</option>
                  <option value="wysoka">{t('addClientModal.decision.high')}</option>
                  <option value="średnia">{t('addClientModal.decision.medium')}</option>
                  <option value="brak">{t('addClientModal.decision.none')}</option>
                </select>
              </FormField>
            </Grid>
          </Section>

          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="buttonRed" onClick={onClose} disabled={isSaving}>
              {t('buttons.cancel')}
            </button>
            <button className="buttonGreen" type="submit" disabled={isSaving}>
              {isSaving ? t('addClientModal.saving') : t('addContactModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
