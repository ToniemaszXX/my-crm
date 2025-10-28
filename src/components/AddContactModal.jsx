// src/components/AddContactModal.jsx
import { useState } from "react";
import { X } from "lucide-react";
import { checkSessionBeforeSubmit } from "../utils/checkSessionBeforeSubmit";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { usePreventDoubleSubmit } from "../utils/preventDoubleSubmit";
import { useTranslation } from 'react-i18next';

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

  const wrapSubmit = usePreventDoubleSubmit();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => setForm({ ...emptyContact });

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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[110]">
      <div className="bg-neutral-100 pb-6 rounded-lg w-[900px] max-h-[85vh] overflow-y-auto">
        {/* HEADER */}
        <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
          <h2 className="text-lime-500 text-xl font-extrabold">{t('addContactModal.title')}</h2>
          <button
            className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none"
            onClick={onClose}
            aria-label={t('buttons.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="px-6 pt-4">
          <div className="contactBlock">
            <label className="text-neutral-800">
              <select
                className="contactSelect mb-4"
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
            </label>

            <div className="flex gap-2">
              <label className="text-neutral-800">
                {t('fields.position')}
                <input
                  type="text"
                  className="contactInput"
                  value={form.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                {t('fields.firstName')}
                <input
                  type="text"
                  className="contactInput"
                  value={form.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                {t('fields.lastName')}
                <input
                  type="text"
                  className="contactInput"
                  value={form.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                {t('fields.phone')}
                <input
                  type="text"
                  className="contactInput"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                {t('fields.email')}
                <input
                  type="email"
                  className="contactInput"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                {t('fields.functionNotes')}
                <input
                  type="text"
                  className="contactInput"
                  value={form.function_notes}
                  onChange={(e) => handleChange("function_notes", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                {t('addClientModal.decisionLevel')}
                <select
                  className="contactSelect text-neutral-800"
                  value={form.decision_level}
                  onChange={(e) =>
                    handleChange("decision_level", e.target.value)
                  }
                >
                  <option value="-">{t('addClientModal.decisionLevel')}</option>
                  <option value="wysoka">{t('addClientModal.decision.high')}</option>
                  <option value="średnia">{t('addClientModal.decision.medium')}</option>
                  <option value="brak">{t('addClientModal.decision.none')}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              className="buttonRed"
              onClick={onClose}
              disabled={isSaving}
            >
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
