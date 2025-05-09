import { useState } from "react";

function AddVisitModal({ isOpen, onClose, onVisitAdded, clients }) {
  const [formData, setFormData] = useState({
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const response = await fetch("/api/visits/add.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
  
    const text = await response.text();
  
    try {
      const data = JSON.parse(text);
  
      if (data.success) {
        onVisitAdded();
        onClose();
        setFormData({
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
      } else {
        alert("Błąd: " + data.message);
      }
    } catch (err) {
      console.error("Nieprawidłowa odpowiedź serwera:", text);
      alert("Błąd serwera: " + response.status);
    }
  };
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50">
      <div className="bg-white text-black p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Dodaj wizytę</h2>
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
              <option key={c.id} value={c.id}>
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
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddVisitModal;
