import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';

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

  const { t } = useTranslation();
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

const [allClients, setAllClients] = useState([]);

useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/customers/list.php`, {
    credentials: "include",
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setAllClients(data.clients);
      }
    })
    .catch(err => {
      console.error("Błąd pobierania klientów:", err);
    });
}, []);


  useEffect(() => {
    if (isOpen && visit?.visit_id) {
      fetch(`${import.meta.env.VITE_API_URL}/visits/get_visit_by_id.php?id=${visit.visit_id}`, {
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

  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    setServerError("");
    return;
  }

  setFormErrors({});
  setServerError("");

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/visits/edit.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
      onVisitUpdated();
      onClose();
    } else {
      if (data.errors) {
        setFormErrors(data.errors);
      } else {
        setServerError(data.message || "Wystąpił błąd serwera.");
      }
    }
  } catch (err) {
    console.error("Błąd połączenia:", err);
    setServerError("Błąd połączenia z serwerem.");
  }
};


  if (!isOpen || !visit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20  z-[99]">
      <div className="bg-white text-black p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{t('editVisitModal.editVisit')}</h2>
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
            {allClients
                .filter(c => c.id && c.company_name)
                .sort((a, b) => a.company_name.localeCompare(b.company_name))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
              ))}
          </select>

          {formErrors.client_id && (
            <p className="text-red-600 text-sm mt-1">{formErrors.client_id}</p>
          )}
          </label>

          <label class="text-neutral-800">{t('addVisitModal.setDate')} 
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

          <label class="text-neutral-800">{t('addVisitModal.contactPerson')}
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

          {[
            { name: "meeting_purpose", label: t('addVisitModal.meetingPurpose') },
            { name: "post_meeting_summary", label: t('addVisitModal.postMeetingSummary') },
            { name: "marketing_tasks", label: t('addVisitModal.marketingTasks') },
            { name: "action_plan", label: t('addVisitModal.actionPlan') },
            { name: "competition_info", label: t('addVisitModal.competitionInfo') },
            { name: "additional_notes", label: t('addVisitModal.additionalNotes') },
          ].map(({name, label}) => (
            <label key={name} className="text-neutral-800">{label}
              <textarea
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

export default EditVisitModal;
