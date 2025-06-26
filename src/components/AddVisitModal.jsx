import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { isTsr } from '../utils/roles';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import { fetchWithAuth } from '../utils/fetchWithAuth';


function AddVisitModal({ isOpen, onClose, onVisitAdded, clients, fixedClientId }) {
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
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const validateForm = () => {
  const errors = {};
  
  if (!formData.client_id) errors.client_id = t('addVisitModal.errors.requiredClient');
  if (!formData.visit_date) errors.visit_date = t('addVisitModal.errors.requiredDate');
  if (!formData.contact_person || formData.contact_person.length < 3)
    errors.contact_person = t('addVisitModal.errors.invalidContactPerson');
  
  return errors;
};


  useEffect(() => {
  if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        client_id: fixedClientId || prev.client_id || "",
      }));
    }

    if (!isOpen) {
    setServerError("");
    setFormErrors({});
  }

  }, [isOpen, fixedClientId]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setServerError("");
      return;
    }

    setFormErrors({});
    setServerError("");

    // 🔐 Dodaj to!
    const isSessionValid = await checkSessionBeforeSubmit();
    if (!isSessionValid) return;

    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/visits/add.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Nieprawidłowa odpowiedź JSON:", text);
      setServerError("Błąd serwera – nieprawidłowa odpowiedź.");
      return;
    }

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
      setFormErrors({});
      setServerError("");
    } else {
      if (data.errors) {
        setFormErrors(data.errors);
      } else {
        setServerError(data.message || "Wystąpił błąd serwera.");
      }
    }
  } catch (err) {
    console.error("Błąd połączenia:", err);
    setServerError("Błąd połączenia z serwerem. Spróbuj ponownie.");
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

        <label className="text-neutral-800">{t('addVisitModal.chooseClient')}
          <select
            name="client_id"
            value={formData.client_id}
            onChange={handleChange}
            className="w-full border p-2"
            disabled={!!fixedClientId}
          >
            <option value="">{t('addVisitModal.chooseClient')}</option>
            {[...clients]
              .sort((a, b) => a.company_name.localeCompare(b.company_name))
              .map((c) => (
                <option key={c.id || c.client_id} value={c.id || c.client_id}>
                  {c.company_name}
                </option>
            ))}
          </select>
          {formErrors.client_id && (
              <p className="text-red-600 text-sm mt-1">{formErrors.client_id}</p>
          )}
        </label>


        <label className="text-neutral-800">{t('addVisitModal.setDate')}
          <input
            type="date"
            name="visit_date"
            value={formData.visit_date}
            onChange={handleChange}
            className="w-full border p-2"
          />
          {formErrors.visit_date && (
              <p className="text-red-600 text-sm mt-1">{formErrors.visit_date}</p>
          )}
        </label>

        <label className="text-neutral-800">{t('addVisitModal.contactPerson')}
          <input
            type="text"
            name="contact_person"
            placeholder="Z kim odbyła się wizyta"
            value={formData.contact_person}
            onChange={handleChange}
            className="w-full border p-2"
          />
            {formErrors.contact_person && (
              <p className="text-red-600 text-sm mt-1">{formErrors.contact_person}</p>
            )}
        </label>

        <label className="text-neutral-800">{t('addVisitModal.kindOfMeeting')}
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
            <label className="text-neutral-800">{label}
            <textarea
              key={name}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="w-full border p-2"
            />
            </label>
          ))}

          {serverError && (
            <div className="text-red-600 font-semibold p-2 border border-red-400 bg-red-100 rounded">
              {serverError}
            </div>
          )}

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
