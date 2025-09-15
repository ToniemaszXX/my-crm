import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { isTsr } from '../utils/roles';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { usePreventDoubleSubmit } from '../utils/preventDoubleSubmit';


function AddVisitModal({ isOpen, onClose, onVisitAdded, clients, fixedClientId, entityType = 'client', entities, fixedEntityId }) {
  const [formData, setFormData] = useState({
  client_id: "", // backward compat for clients
  designer_id: "",
  installer_id: "",
  deweloper_id: "",
  entity_type: undefined,
  entity_id: undefined,
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
  const { user } = useAuth();
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");


  const validateForm = () => {
    const errors = {};
    // Determine selected id based on entityType
    const idField = `${entityType}_id`;
    const selectedId = formData[idField] || formData.client_id; // compat
    if (!selectedId) {
      // show generic error key to display under select
      errors.target = t('addVisitModal.errors.requiredClient');
    }
    if (!formData.visit_date) errors.visit_date = t('addVisitModal.errors.requiredDate');
    if (!formData.contact_person || formData.contact_person.length < 3)
      errors.contact_person = t('addVisitModal.errors.invalidContactPerson');

    return errors;
  };


  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => {
        const next = { ...prev };
        // prefer new generic props
        const idField = `${entityType}_id`;
        if (fixedEntityId) {
          next[idField] = String(fixedEntityId);
          next.entity_type = entityType;
          next.entity_id = String(fixedEntityId);
        } else if (fixedClientId) {
          next.client_id = String(fixedClientId);
          next.entity_type = 'client';
          next.entity_id = String(fixedClientId);
        }
        return next;
      });
    }

    if (!isOpen) {
      setServerError("");
      setFormErrors({});
    }

  }, [isOpen, fixedClientId, fixedEntityId, entityType]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // keep derived entity_type/entity_id in sync when changing the select
      const isAnyEntityField = ['client_id','designer_id','installer_id','deweloper_id'].includes(name);
      if (isAnyEntityField) {
        // figure out which type changed
        const type = name.replace('_id','');
        next.entity_type = type;
        next.entity_id = value || undefined;
        // clear other *_id to satisfy exactly-one constraint
        ['client','designer','installer','deweloper']
          .filter(t => t !== type)
          .forEach(t => { next[`${t}_id`] = ""; });
      }
      return next;
    });
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
      designer_id: "",
      installer_id: "",
      deweloper_id: "",
      entity_type: undefined,
      entity_id: undefined,
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

  const wrapSubmit = usePreventDoubleSubmit(); // <== poprawne
  const safeSubmit = wrapSubmit(handleSubmit);

  const fields = [
    { name: "meeting_purpose", label: t('addVisitModal.meetingPurpose') },
    { name: "post_meeting_summary", label: t('addVisitModal.postMeetingSummary') },
    { name: "marketing_tasks", label: t('addVisitModal.marketingTasks') },
    { name: "action_plan", label: t('addVisitModal.actionPlan') },
    { name: "competition_info", label: t('addVisitModal.competitionInfo') }
  ]

  if (!isTsr(user)) {
    fields.push({ name: "additional_notes", label: t('addVisitModal.additionalNotes') });
  }


  if (!isOpen) return null;

  // Build options according to entityType; fallback to clients prop for backward compat
  const list = entities || clients || [];
  const idFieldName = `${entityType}_id`;
  const selectValue = formData[idFieldName] || (entityType === 'client' ? formData.client_id : "");
  const disabled = !!fixedEntityId || (!!fixedClientId && entityType === 'client');
  const chooseLabel = t('addVisitModal.chooseClient');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20  z-[99]">
      <div className="bg-white text-black p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{t('addVisitModal.addVisit')}</h2>
        <form onSubmit={safeSubmit} className="space-y-3">

          <label className="text-neutral-800">{chooseLabel}
            <select
              name={idFieldName}
              value={selectValue}
              onChange={handleChange}
              className="w-full border p-2"
              disabled={disabled}
            >
              <option value="">{chooseLabel}</option>
              {[...list]
                .sort((a, b) => a.company_name.localeCompare(b.company_name))
                .map((c) => (
                  <option key={c.id || c.client_id} value={c.id || c.client_id}>
                    {c.company_name}
                  </option>
                ))}
            </select>
            {(formErrors.target || formErrors[idFieldName] || formErrors.client_id) && (
              <p className="text-red-600 text-sm mt-1">{formErrors.target || formErrors[idFieldName] || formErrors.client_id}</p>
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

          {fields.map(({ name, label }) => (
            <label key={name} className="text-neutral-800">{label}
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
