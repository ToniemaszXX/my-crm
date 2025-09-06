// src/components/ContactsSection.jsx
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ContactsSection({
  contacts,
  onAdd,
  onRemove,
  onChange,         // (index, field, value) => void
  readOnly = false,
  enableSearch = false,
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!enableSearch || !q.trim()) return contacts || [];
    const s = q.toLowerCase();
    return (contacts || []).filter(c =>
      Object.values(c || {}).some(v => String(v ?? "").toLowerCase().includes(s))
    );
  }, [contacts, q, enableSearch]);

  return (
    <div className="mt-2">
      <h4 className="header2">{t('addClientModal.contact')}</h4>

      {enableSearch && (
        <input
          type="text"
          placeholder={t('editClientModal.searchContact')}
          className="mb-4 p-2 border rounded w-full text-black"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      )}

      {filtered.map((c, i) => (
        <div key={i} className="contactBlock">
          <label className="text-neutral-800">
            <select
              name="department"
              value={c.department || ""}
              onChange={(e) => onChange(i, 'department', e.target.value)}
              className="contactSelect mb-4"
              disabled={readOnly}
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
              {t('addClientModal.position')}
              <input
                type="text"
                className="contactInput"
                value={c.position || ""}
                onChange={(e) => onChange(i, 'position', e.target.value)}
                disabled={readOnly}
              />
            </label>

            <label className="text-neutral-800">
              {t('addClientModal.name')}
              <input
                type="text"
                className="contactInput"
                value={c.name || ""}
                onChange={(e) => onChange(i, 'name', e.target.value)}
                disabled={readOnly}
              />
            </label>

            <label className="text-neutral-800">
              {t('addClientModal.phone')}
              <input
                type="text"
                className="contactInput"
                value={c.phone || ""}
                onChange={(e) => onChange(i, 'phone', e.target.value)}
                disabled={readOnly}
              />
            </label>

            <label className="text-neutral-800">
              {t('addClientModal.email')}
              <input
                type="email"
                className="contactInput"
                value={c.email || ""}
                onChange={(e) => onChange(i, 'email', e.target.value)}
                disabled={readOnly}
              />
            </label>

            <label className="text-neutral-800">
              {t('addClientModal.functionNotes')}
              <input
                type="text"
                className="contactInput"
                value={c.function_notes || ""}
                onChange={(e) => onChange(i, 'function_notes', e.target.value)}
                disabled={readOnly}
              />
            </label>

            <label className="text-neutral-800">
              {t('addClientModal.decisionLevel')}
              <select
                className="contactSelect text-neutral-800"
                value={c.decision_level ?? '-'}
                onChange={(e) => onChange(i, 'decision_level', e.target.value)}
                disabled={readOnly}
              >
                <option value="-">{t('addClientModal.decisionLevel')}</option>
                <option value="wysoka">{t('addClientModal.decision.high')}</option>
                <option value="średnia">{t('addClientModal.decision.medium')}</option>
                <option value="brak">{t('addClientModal.decision.none')}</option>
              </select>
            </label>

            {!readOnly && (
              <button type="button" className="buttonRed" onClick={() => onRemove(i)}>
                {t('addClientModal.remove')}
              </button>
            )}
          </div>
        </div>
      ))}

      {!readOnly && (
        <button type="button" className="buttonGreenNeg" onClick={onAdd} style={{ marginTop: 10 }}>
          {t('addClientModal.addContact')}
        </button>
      )}
    </div>
  );
}
