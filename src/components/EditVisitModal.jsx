import { useState, useEffect } from "react";

function EditVisitModal({ isOpen, onClose, onVisitUpdated, visit, clients }) {
  const [formData, setFormData] = useState({
    id: "",
    client_id: "",
    visit_date: "",
    contact_person: "",
    meeting_type: "meeting",
    meeting_purpose: "",
    post_meeting_summary: "",
    marketing_tasks: "",
    action_plan: "",
    competition_info: "",
    additional_notes: "",
  });

  useEffect(() => {
    if (isOpen && visit?.visit_id) {
      fetch(`/api/visits/get_visit_by_id.php?id=${visit.visit_id}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const v = data.data;
            setFormData({
              id: v.id,
              client_id: v.client_id,
              visit_date: visit.visit_date?.split(' ')[0] || "",
              contact_person: v.contact_person,
              meeting_type: v.meeting_type,
              meeting_purpose: v.meeting_purpose || "",
              post_meeting_summary: v.post_meeting_summary || "",
              marketing_tasks: v.marketing_tasks || "",
              action_plan: v.action_plan || "",
              competition_info: v.competition_info || "",
              additional_notes: v.additional_notes || "",
            });
          } else {
            alert("Błąd pobierania danych wizyty.");
          }
        })
        .catch((err) => {
          console.error("Błąd pobierania wizyty:", err);
        });
    }
  }, [isOpen, visit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("/api/visits/edit.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data.success) {
        onVisitUpdated();
        onClose();
      } else {
        alert("Błąd: " + data.message);
      }
    } catch (err) {
      console.error("Nieprawidłowa odpowiedź serwera:", text);
      alert("Błąd serwera");
    }
  };

  if (!isOpen || !visit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50">
      <div className="bg-white text-black p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edytuj wizytę</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            name="client_id"
            value={formData.client_id}
            onChange={handleChange}
            className="w-full border p-2"
            required
          >
            <option value="">Wybierz klienta</option>
            {clients.map((c) => (
              <option key={c.id || c.client_id} value={c.id || c.client_id}>
              {c.company_name}
            </option>
            ))}
          </select>

          <input
            type="date"
            name="visit_date"
            value={formData.visit_date}
            onChange={handleChange}
            className="w-full border p-2"
            required
          />

          <input
            type="text"
            name="contact_person"
            placeholder="Z kim odbyła się wizyta"
            value={formData.contact_person}
            onChange={handleChange}
            className="w-full border p-2"
            required
          />

          <select
            name="meeting_type"
            value={formData.meeting_type}
            onChange={handleChange}
            className="w-full border p-2"
          >
            <option value="meeting">Meeting</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="video">Video</option>
          </select>

          {[
            "meeting_purpose",
            "post_meeting_summary",
            "marketing_tasks",
            "action_plan",
            "competition_info",
            "additional_notes",
          ].map((field) => (
            <textarea
              key={field}
              name={field}
              placeholder={field.replace(/_/g, " ")}
              value={formData[field]}
              onChange={handleChange}
              className="w-full border p-2"
            />
          ))}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300">
              Anuluj
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white">
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditVisitModal;
