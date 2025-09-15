// src/components/AddContactModal.jsx
import { useState } from "react";
import { X } from "lucide-react";
import { checkSessionBeforeSubmit } from "../utils/checkSessionBeforeSubmit";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { usePreventDoubleSubmit } from "../utils/preventDoubleSubmit";

const emptyContact = {
  department: "",
  position: "",
  name: "",
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

  const wrapSubmit = usePreventDoubleSubmit();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => setForm({ ...emptyContact });

  const handleSubmit = wrapSubmit(async (e) => {
    e.preventDefault();
  const ownerId = fixedEntityId || (entityType === 'client' ? clientId : null);
  if (!ownerId) { alert("Brak kontekstu encji – nie mogę dodać kontaktu."); return; }
    if (isEmptyContact(form)) {
      alert("Uzupełnij przynajmniej jedno pole kontaktu.");
      return;
    }

    setIsSaving(true);

    const okSession = await checkSessionBeforeSubmit();
    if (!okSession) {
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        department: form.department || "",
        position: form.position || "",
        name: form.name || "",
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
      } catch (_) {}

      if (!(res.ok && data?.success)) {
        const msg =
          data?.message ||
          res.statusText ||
          "Nie udało się dodać kontaktu (API).";
        alert(msg);
        setIsSaving(false);
        return;
      }

      // sukces — dołóż nowy kontakt do listy w detalu klienta
  const newContact = { id: data.id, ...form };
  if (entityType === 'client') newContact.client_id = ownerId;
  if (entityType === 'designer') newContact.designer_id = ownerId;
  if (entityType === 'installer') newContact.installer_id = ownerId;
  if (entityType === 'deweloper') newContact.deweloper_id = ownerId;
      onAdded?.(newContact);
      reset();
      onClose();
    } catch (err) {
      console.error(err);
      alert(`Błąd dodawania kontaktu: ${err.message}`);
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
          <h2 className="text-lime-500 text-xl font-extrabold">Dodaj kontakt</h2>
          <button
            className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none"
            onClick={onClose}
            aria-label="Zamknij"
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
                <option value="">Wybierz dział</option>
                <option value="Zarząd">Zarząd / Właściciel</option>
                <option value="Sprzedaż">Sprzedaż</option>
                <option value="Zakupy">Zakupy</option>
                <option value="Marketing">Marketing</option>
                <option value="Inwestycje">Inwestycje</option>
                <option value="Finanse">Finanse</option>
                <option value="Logistyka">Logistyka</option>
                <option value="Administracja">Administracja</option>
                <option value="Obsługi klienta">Obsługa klienta</option>
              </select>
            </label>

            <div className="flex gap-2">
              <label className="text-neutral-800">
                Stanowisko
                <input
                  type="text"
                  className="contactInput"
                  value={form.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                Imię i nazwisko
                <input
                  type="text"
                  className="contactInput"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                Telefon
                <input
                  type="text"
                  className="contactInput"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                Email
                <input
                  type="email"
                  className="contactInput"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                Funkcja / Uwagi
                <input
                  type="text"
                  className="contactInput"
                  value={form.function_notes}
                  onChange={(e) => handleChange("function_notes", e.target.value)}
                />
              </label>

              <label className="text-neutral-800">
                Decyzyjność
                <select
                  className="contactSelect text-neutral-800"
                  value={form.decision_level}
                  onChange={(e) =>
                    handleChange("decision_level", e.target.value)
                  }
                >
                  <option value="-">Decyzyjność</option>
                  <option value="wysoka">Wysoka</option>
                  <option value="średnia">Średnia</option>
                  <option value="brak">Brak</option>
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
              Anuluj
            </button>
            <button className="buttonGreen" type="submit" disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : "Dodaj kontakt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
