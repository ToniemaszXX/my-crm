import { useState, useEffect, useMemo, useRef } from "react";
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
    marketing_response: "",
    action_plan: "",
    competition_info: "",
    additional_notes: "",
    director_response: "",
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
          marketing_response: "",
          action_plan: "",
          competition_info: "",
          additional_notes: "",
          director_response: "",
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
    { name: "competition_info", label: t('addVisitModal.competitionInfo') },
  ];

  if (!isTsr(user)) {
    fields.push({ name: "additional_notes", label: t('addVisitModal.additionalNotes') });
  }


  // Build options according to entityType; fallback to clients prop for backward compat
  const list = entities || clients || [];
  const idFieldName = `${entityType}_id`;
  const selectValue = formData[idFieldName] || (entityType === 'client' ? formData.client_id : "");
  const disabled = !!fixedEntityId || (!!fixedClientId && entityType === 'client');
  const chooseLabel = entityType === 'designer'
    ? t('addVisitModal.chooseDesigner')
    : entityType === 'installer'
    ? t('addVisitModal.chooseInstaller')
    : entityType === 'deweloper'
    ? t('addVisitModal.chooseDeveloper')
    : t('addVisitModal.chooseClient');

  // Searchable dropdown state and helpers
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const pickerRef = useRef(null);

  // Determine selected option to show its label
  const selectedOption = useMemo(() => {
    const selectedId = selectValue || "";
    if (!selectedId) return null;
    const idVal = String(selectedId);
    return list.find((c) => String(c.id || c.client_id) === idVal) || null;
  }, [selectValue, list]);

  const filteredOptions = useMemo(() => {
    const byName = (pickerQuery || "").toLowerCase().trim();
    return [...list]
      .sort((a, b) => a.company_name.localeCompare(b.company_name))
      .filter((c) =>
        !byName || (c.company_name || "").toLowerCase().includes(byName)
      );
  }, [list, pickerQuery]);

  const handlePick = (opt) => {
    const value = String(opt.id || opt.client_id || "");
    // Reuse handleChange contract
    handleChange({ target: { name: idFieldName, value } });
    setPickerQuery("");
    setIsPickerOpen(false);
  };

  // Also close when a value is chosen (selectValue changes)
  useEffect(() => {
    if (isPickerOpen) {
      setIsPickerOpen(false);
      setPickerQuery("");
    }
  }, [selectValue]);

  // Close picker on outside click or Escape

    // ========================= CONTACT PERSON COMBOBOX =========================
    const [contacts, setContacts] = useState([]);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isAddingContact, setIsAddingContact] = useState(false);
    const contactRef = useRef(null);

    // Refetch contacts when entity changes
    useEffect(() => {
      if (!selectValue) {
        setContacts([]);
        return;
      }
      const controller = new AbortController();
      const load = async () => {
        try {
          const url = `${import.meta.env.VITE_API_URL}/contacts/get_by_entity.php?entity_type=${entityType}&id=${selectValue}`;
          const res = await fetchWithAuth(url, { signal: controller.signal });
          const data = await res.json();
          if (data?.success) {
            setContacts(data.data?.contacts || []);
          } else {
            setContacts([]);
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.error('Błąd pobierania kontaktów:', e);
          }
        }
      };
      load();
      return () => controller.abort();
    }, [entityType, selectValue]);

    // Clear contact_person when entity changes
    const prevEntityRef = useRef({ type: entityType, id: selectValue });
    useEffect(() => {
      if (
        prevEntityRef.current.type !== entityType ||
        prevEntityRef.current.id !== selectValue
      ) {
        setFormData((p) => ({ ...p, contact_person: "" }));
        setIsContactOpen(false);
        prevEntityRef.current = { type: entityType, id: selectValue };
      }
    }, [entityType, selectValue]);

    const toFullName = (c = {}) => {
      const full = `${c.first_name || ''} ${c.last_name || ''}`.trim();
      return full || c.name || '';
    };
    const contactQuery = (formData.contact_person || '').trim();
    const filteredContacts = useMemo(() => {
      const q = contactQuery.toLowerCase();
      if (!q) return contacts;
      return contacts.filter(c => toFullName(c).toLowerCase().includes(q));
    }, [contacts, contactQuery]);

    const canAddContact = useMemo(() => {
      const q = contactQuery;
      if (!selectValue) return false; // need entity first
      if (!q || q.length < 3) return false;
      return !contacts.some(c => toFullName(c).toLowerCase() === q.toLowerCase());
    }, [contacts, contactQuery, selectValue]);

    const handleContactPick = (c) => {
      setFormData((p) => ({ ...p, contact_person: toFullName(c) }));
      setIsContactOpen(false);
    };

    const handleAddNewContact = async () => {
      if (!canAddContact || isAddingContact) return;
      setIsAddingContact(true);
      try {
        // Split entered full name into first_name / last_name (last token as last_name)
        const s = contactQuery.trim();
        const pos = s.lastIndexOf(' ');
        const first_name = pos > 0 ? s.slice(0, pos).trim() : '';
        const last_name  = pos > -1 ? s.slice(pos + 1).trim() : s;
        const full = `${first_name} ${last_name}`.trim() || s;
        const payload = { first_name: first_name || null, last_name: last_name || null, name: full };
        // exactly one id according to current entityType
        payload[idFieldName] = Number(selectValue);
        const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/contacts/create.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data?.success) {
          const newContact = { id: data.id, first_name, last_name, name: full };
          setContacts((prev) => [...prev, newContact]);
          setFormData((p) => ({ ...p, contact_person: full }));
          setIsContactOpen(false);
        } else {
          console.error('Nie udało się utworzyć kontaktu');
        }
      } catch (e) {
        console.error('Błąd tworzenia kontaktu:', e);
      } finally {
        setIsAddingContact(false);
      }
    };
    // Close contact dropdown on outside click / Escape
    useEffect(() => {
      if (!isContactOpen) return;
      const onClick = (e) => {
        if (!contactRef.current) return;
        if (!contactRef.current.contains(e.target)) setIsContactOpen(false);
      };
      const onKey = (e) => { if (e.key === 'Escape') setIsContactOpen(false); };
      document.addEventListener('mousedown', onClick);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('mousedown', onClick);
        document.removeEventListener('keydown', onKey);
      };
    }, [isContactOpen]);
  useEffect(() => {
    if (!isPickerOpen) return;
    const onClick = (e) => {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(e.target)) {
        setIsPickerOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setIsPickerOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isPickerOpen]);

  // Return nothing when modal closed, but keep hooks order consistent
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20  z-[99]">
      <div className="bg-white text-black p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{t('addVisitModal.addVisit')}</h2>
        <form onSubmit={safeSubmit} className="space-y-3">

          <label className="text-neutral-800">{chooseLabel}
            {/* Searchable picker */}
            <div className="relative" ref={pickerRef}>
              {disabled ? (
                <input
                  type="text"
                  className="w-full border p-2 bg-gray-100 cursor-not-allowed"
                  value={selectedOption?.company_name || ""}
                  placeholder={chooseLabel}
                  readOnly
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen((o) => !o)}
                    className="w-full border p-2 bg-white text-left rounded"
                  >
                    {selectedOption?.company_name || chooseLabel}
                  </button>
                  {isPickerOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow-lg">
                      <div className="p-2 border-b">
                        <input
                          type="text"
                          autoFocus
                          value={pickerQuery}
                          onChange={(e) => setPickerQuery(e.target.value)}
                          placeholder={t('visitsPage.searchPlaceholder')}
                          className="w-full border p-2 rounded"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                          <div className="p-3 text-gray-500">—</div>
                        ) : (
                          filteredOptions.map((c) => (
                            <button
                              type="button"
                              key={c.id || c.client_id}
                              onMouseDown={(e) => { e.stopPropagation(); handlePick(c); }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100"
                            >
                              {c.company_name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

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
            <div className="relative" ref={contactRef}>
              <input
                type="text"
                name="contact_person"
                placeholder={t('addVisitModal.contactPersonPlaceholder')}
                value={formData.contact_person}
                onChange={(e) => { handleChange(e); setIsContactOpen(true); }}
                onFocus={() => setIsContactOpen(true)}
                className="w-full border p-2"
                autoComplete="off"
              />
              {isContactOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow-lg max-h-64 overflow-y-auto">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleContactPick(c); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      >
                        {toFullName(c)}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">—</div>
                  )}
                  {canAddContact && (
                    <div className="border-t">
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleAddNewContact(); }}
                        disabled={isAddingContact}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-green-700 disabled:opacity-60"
                      >
                        + {t('addClientModal.save')} kontakt: "{formData.contact_person}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
