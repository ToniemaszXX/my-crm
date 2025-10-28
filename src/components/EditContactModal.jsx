// src/components/EditContactModal.jsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { checkSessionBeforeSubmit } from "../utils/checkSessionBeforeSubmit";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { usePreventDoubleSubmit } from "../utils/preventDoubleSubmit";
import { useTranslation } from 'react-i18next';

const emptyContact = {
  id: null,          // wymagane do update
  client_id: null,   // wymagane do update
  designer_id: null,
  installer_id: null,
  deweloper_id: null,
  department: "",
  position: "",
  first_name: "",
  last_name: "",
  name: "", // compat for now
  phone: "",
  email: "",
  function_notes: "",
  decision_level: "-", // tak jak w innych miejscach
};

export default function EditContactModal({
  isOpen,
  onClose,
  contact,        // obiekt kontaktu do edycji {id, client_id, ...}
  onUpdated,      // callback(updatedContact)
}) {
  const [form, setForm] = useState({ ...emptyContact });
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  // Gdy otwierasz modal / zmienia się kontakt → wypełnij formularz
  useEffect(() => {
    if (!isOpen) return;
    const src = contact || {};
    // Prefill: if legacy single `name` exists but first/last are empty, split into first_name and last_name for better UX
    let first = src.first_name ?? "";
    let last = src.last_name ?? "";
    const legacyName = (src.name ?? "").trim();
    if (!first && !last && legacyName) {
      const pos = legacyName.lastIndexOf(" ");
      first = pos > 0 ? legacyName.slice(0, pos).trim() : "";
      last = pos > -1 ? legacyName.slice(pos + 1).trim() : legacyName;
    }
    setForm({
      id: src.id ?? null,
      client_id: src.client_id ?? src.clientId ?? null,
      designer_id: src.designer_id ?? null,
      installer_id: src.installer_id ?? null,
      deweloper_id: src.deweloper_id ?? null,
      department: src.department ?? "",
      position: src.position ?? "",
      first_name: first,
      last_name: last,
      name: src.name ?? "", // compat
      phone: src.phone ?? "",
      email: src.email ?? "",
      function_notes: src.function_notes ?? "",
      decision_level: src.decision_level ?? "-",
    });
  }, [isOpen, contact]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const wrapSubmit = usePreventDoubleSubmit();

  const handleSubmit = wrapSubmit(async (e) => {
    e.preventDefault();

    if (!form?.id) {
      alert(t('editContactModal.errors.missingId'));
      return;
    }

    // detect owner
    const owner = {
      client_id: form.client_id,
      designer_id: form.designer_id,
      installer_id: form.installer_id,
      deweloper_id: form.deweloper_id,
    };
    const ownerEntries = Object.entries(owner).filter(([,v]) => !!v);
    if (ownerEntries.length !== 1) {
      alert(t('editContactModal.errors.invalidOwner'));
      return;
    }

    setIsSaving(true);

    const okSession = await checkSessionBeforeSubmit();
    if (!okSession) { setIsSaving(false); return; }

    try {
      // walidacja: co najmniej jedno z pól imię/nazwisko
      const fnTrim = (form.first_name || '').trim();
      const lnTrim = (form.last_name || '').trim();
      const nameTrim = (form.name || '').trim();
      if (!fnTrim && !lnTrim) {
        if (nameTrim) {
          const pos = nameTrim.lastIndexOf(' ');
          const f = pos > 0 ? nameTrim.slice(0, pos).trim() : '';
          const l = pos > -1 ? nameTrim.slice(pos + 1).trim() : nameTrim;
          if (!f && !l) {
            alert(t('editContactModal.errors.namePartRequired'));
            setIsSaving(false);
            return;
          }
        } else {
          alert(t('editContactModal.errors.namePartRequired'));
          setIsSaving(false);
          return;
        }
      }
      const payload = {
        id: form.id,
        department: form.department || "",
        position: form.position || "",
        first_name: (form.first_name || '').trim() || null,
        last_name:  (form.last_name  || '').trim() || null,
        name: `${(form.first_name||'').trim()} ${(form.last_name||'').trim()}`.trim() || null, // compat for BE
        phone: form.phone || "",
        email: form.email || "",
        function_notes: form.function_notes || "",
        decision_level: form.decision_level ?? "-",
      };
      const [ownerKey, ownerVal] = ownerEntries[0];
      payload[ownerKey] = ownerVal;

      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/contacts/update.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ignore JSON parse errors */ }

      if (!(res.ok && data?.success)) {
        const msg = data?.message || res.statusText || t('editContactModal.errors.saveFailed');
        alert(msg);
        setIsSaving(false);
        return;
      }

      // Sukces – odeślij zaktualizowaną wersję do rodzica
      onUpdated?.({
        ...form,
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert(`${t('editContactModal.errors.saveError')}: ${err.message}`);
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
          <h2 className="text-lime-500 text-xl font-extrabold">{t('editContactModal.title')}</h2>
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
                  onChange={(e) => handleChange("decision_level", e.target.value)}
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
              {isSaving ? t('addClientModal.saving') : t('buttons.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
