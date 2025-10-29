import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { usePreventDoubleSubmit } from '../utils/preventDoubleSubmit';
import { useAuth } from '../context/AuthContext';
import { isAdminManager } from '../utils/roles';
import Section from './common/Section';
import Grid from './common/Grid';
import FormField from './common/FormField';
import { X } from 'lucide-react';

function EditVisitModal({ isOpen, onClose, onVisitUpdated, visit, clients, entityType = 'client', entities, fixedEntityId }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    id: "",
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
    marketing_response: "",
    action_plan: "",
    competition_info: "",
    additional_notes: "",
    director_response: "",
  });

  const { t } = useTranslation();
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const validateForm = () => {
    const errors = {};
    const idField = `${entityType}_id`;
    const selectedId = formData[idField] || formData.client_id;
    if (!selectedId) errors.target = t('addVisitModal.errors.requiredClient');
    if (!formData.visit_date) errors.visit_date = t('addVisitModal.errors.requiredDate');
    if (!formData.contact_person || formData.contact_person.length < 3)
      errors.contact_person = t('addVisitModal.errors.invalidContactPerson');
    return errors;
  };

  const [allClients, setAllClients] = useState([]);

  useEffect(() => {
    if (entities && entities.length) {
      setAllClients(entities);
      return;
    }
    // fallback for clients
    if (entityType === 'client') {
      fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/list.php`)
        .then(res => res.json())
        .then(data => { if (data.success) setAllClients(data.clients); })
        .catch(() => {});
    } else {
      setAllClients([]);
    }
  }, [entities, entityType]);


  useEffect(() => {
    if (isOpen && visit?.visit_id) {
      fetchWithAuth(`${import.meta.env.VITE_API_URL}/visits/get_visit_by_id.php?id=${visit.visit_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const v = data.data;
            const detectedType = v.client_id ? 'client' : v.designer_id ? 'designer' : v.installer_id ? 'installer' : v.deweloper_id ? 'deweloper' : entityType;
            const detectedId = v.client_id || v.designer_id || v.installer_id || v.deweloper_id || '';
            setFormData({
              id: v.id,
              client_id: v.client_id || '',
              designer_id: v.designer_id || '',
              installer_id: v.installer_id || '',
              deweloper_id: v.deweloper_id || '',
              entity_type: detectedType,
              entity_id: detectedId ? String(detectedId) : undefined,
              visit_date: (v.visit_date || visit.visit_date || '').toString().split(' ')[0],
              contact_person: v.contact_person || '',
              meeting_type: v.meeting_type || 'meeting',
              meeting_purpose: v.meeting_purpose || "",
              post_meeting_summary: v.post_meeting_summary || "",
              marketing_tasks: v.marketing_tasks || "",
              marketing_response: v.marketing_response || "",
              action_plan: v.action_plan || "",
              competition_info: v.competition_info || "",
              additional_notes: v.additional_notes || "",
              director_response: v.director_response || "",
            });
          } else {
            alert(t('editVisitModal.fetchError'));
          }
        })
        .catch((err) => {
          console.error("Błąd pobierania wizyty:", err);
        });
    }
  }, [isOpen, visit, entityType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      const isAnyEntityField = ['client_id','designer_id','installer_id','deweloper_id'].includes(name);
      if (isAnyEntityField) {
        const type = name.replace('_id','');
        next.entity_type = type;
        next.entity_id = value || undefined;
        ['client','designer','installer','deweloper']
          .filter(t => t !== type)
          .forEach(t => { next[`${t}_id`] = ""; });
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isSessionOk = await checkSessionBeforeSubmit();
    if (!isSessionOk) return;


    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setServerError("");
      return;
    }

    setFormErrors({});
    setServerError("");

    try {
  const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/visits/edit.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await response.text();
      console.log("ID wysyłane do edit.php:", formData.id);
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
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
      setServerError(t('errors.network'));
    }
  };

  const wrapSubmit = usePreventDoubleSubmit(); // <== poprawne
  const safeSubmit = wrapSubmit(handleSubmit);


  if (!isOpen || !visit) return null;

  const list = entities || clients || allClients;
  const idFieldName = `${entityType}_id`;
  const selectValue = formData[idFieldName] || (entityType === 'client' ? formData.client_id : "");
  const disabled = !!fixedEntityId;

  const chooseLabel = entityType === 'designer'
    ? t('addVisitModal.chooseDesigner')
    : entityType === 'installer'
    ? t('addVisitModal.chooseInstaller')
    : entityType === 'deweloper'
    ? t('addVisitModal.chooseDeveloper')
    : t('addVisitModal.chooseClient');

  return (
    <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'>
      <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
        <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
          <h2 className="text-lime-500 text-xl font-extrabold">{t('editVisitModal.editVisit')}</h2>
          <button className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={safeSubmit} className="text-white flex flex-col gap-3 pl-8 pr-8">


          <Section title={t('addVisitModal.target') || chooseLabel}>
            <Grid>
              <FormField id="target" label={chooseLabel} error={formErrors.target || formErrors[idFieldName] || formErrors.client_id}>
                <select
                  name={idFieldName}
                  value={selectValue}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white"
                  required
                  disabled={disabled}
                >
                  <option value="">{chooseLabel}</option>
                  {(list || [])
                    .filter(c => c.id && c.company_name)
                    .sort((a, b) => a.company_name.localeCompare(b.company_name))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                </select>
              </FormField>
            </Grid>
          </Section>

          <Section title={t('addVisitModal.setDate')}>
            <Grid>
              <FormField id="visit_date" label={t('addVisitModal.setDate')} error={formErrors.visit_date}>
                <input
                  type="date"
                  name="visit_date"
                  value={formData.visit_date}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white"
                />
              </FormField>
            </Grid>
          </Section>

          <Section title={t('addVisitModal.contactPerson')}>
            <Grid>
              <FormField id="contact_person" label={t('addVisitModal.contactPerson')} error={formErrors.contact_person}>
                <input
                  type="text"
                  name="contact_person"
                  placeholder={t('addVisitModal.contactPersonPlaceholder')}
                  value={formData.contact_person}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white"
                />
              </FormField>
            </Grid>
          </Section>

          <Section title={t('addVisitModal.kindOfMeeting')}>
            <Grid>
              <FormField id="meeting_type" label={t('addVisitModal.kindOfMeeting')}>
                <select
                  name="meeting_type"
                  value={formData.meeting_type}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white"
                >
                  <option value="meeting">{t('addVisitModal.kindOfMeeting.meeting')}</option>
                  <option value="call">{t('addVisitModal.kindOfMeeting.call')}</option>
                  <option value="email">{t('addVisitModal.kindOfMeeting.email')}</option>
                  <option value="video">{t('addVisitModal.kindOfMeeting.video')}</option>
                </select>
              </FormField>
            </Grid>
          </Section>

          {[ 
            { name: "meeting_purpose", label: t('addVisitModal.meetingPurpose') },
            { name: "post_meeting_summary", label: t('addVisitModal.postMeetingSummary') },
            { name: "marketing_tasks", label: t('addVisitModal.marketingTasks') },
            // Only for Admin/Manager/Zarzad/BOK/MKG
            ...(isAdminManager(user) ? [
              { name: "marketing_response", label: t('addVisitModal.marketingResponse') },
            ] : []),
            { name: "action_plan", label: t('addVisitModal.actionPlan') },
            { name: "competition_info", label: t('addVisitModal.competitionInfo') },
            { name: "additional_notes", label: t('addVisitModal.additionalNotes') },
            ...(isAdminManager(user) ? [
              { name: "director_response", label: t('addVisitModal.directorResponse') },
            ] : []),
          ].map(({ name, label }) => (
            <Section key={name} title={label}>
              <Grid>
                <FormField id={name} label={label}>
                  <textarea
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 min-h-[80px] bg-white text-neutral-950"
                  />
                </FormField>
              </Grid>
            </Section>
          ))}

          <div className='flex justify-end mt-5 gap-2'>
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
