import { useState } from "react";
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { isTsr } from '../utils/roles';

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

  const { t } = useTranslation();
  const { user} = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const response = await fetch(`${import.meta.env.VITE_API_URL}/visits/add.php`, {
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

  const fields = [
    { name: "meeting_purpose", label: t('addVisitModal.meetingPurpose') },
    { name: "post_meeting_summary", label: t('addVisitModal.postMeetingSummary') },
    { name: "marketing_tasks", label: t('addVisitModal.marketingTasks') },
    { name: "action_plan", label: t('addVisitModal.actionPlan') },
    { name: "competition_info", label: t('addVisitModal.competitionInfo') }
  ]

  if(!isTsr(user)){
    fields.push({ name: "additional_notes", label: t('addVisitModal.additionalNotes') });
  }
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20  z-[99]">
      <div className="bg-white text-black p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{t('addVisitModal.addVisit')}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">

        <label class="text-neutral-800">{t('addVisitModal.chooseClient')}
          <select
            name="client_id"
            value={formData.client_id}
            onChange={handleChange}
            className="w-full border p-2"
            required
          >
            <option value="">{t('addVisitModal.chooseClient')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </label>

        <label class="text-neutral-800">{t('addVisitModal.setDate')}
          <input
            type="date"
            name="visit_date"
            value={formData.visit_date}
            onChange={handleChange}
            className="w-full border p-2"
            required
          />
        </label>

        <label class="text-neutral-800">{t('addVisitModal.contactPerson')}
          <input
            type="text"
            name="contact_person"
            placeholder="Z kim odbyła się wizyta"
            value={formData.contact_person}
            onChange={handleChange}
            className="w-full border p-2"
            required
          />
        </label>

        <label class="text-neutral-800">{t('addVisitModal.kindOfMeeting')}
          <select
            name="meeting_type"
            value={formData.meeting_type}
            onChange={handleChange}
            className="w-full border p-2"
          >
            <option value="meeting">{t('addVisitModal.kindOfMeeting.meeting')}</option>
            <option value="call">{t('addVisitModal.kindOfMeeting.call')}</option>
            <option value="email">{t('addVisitModal.kindOfMeeting.email')}</option>
            <option value="video">{t('addVisitModal.kindOfMeeting.video')}</option>
          </select>
          </label> 

          {fields.map(({name, label}) => (
            <label class="text-neutral-800">{label}
            <textarea
              key={name}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="w-full border p-2"
            />
            </label>
          ))}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="buttonRed">
              {t('addClientModal.cancel')}
            </button>
            <button type="submit" className="buttonGreen">
              {t('addClientModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddVisitModal;
