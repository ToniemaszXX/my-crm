// src/components/EditClientModal.jsx
import useClientForm from '../hooks/useClientForm';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect, useMemo } from 'react';
import LocationPicker from './LocationPicker';
import { useTranslation } from 'react-i18next';
import { isReadOnly, isBok, isAdminManager } from '../utils/roles';
import CountrySelect from './CountrySelect';
import { X } from 'lucide-react';
import ClientVisits from "./ClientVisits";
import AddVisitModal from "./AddVisitModal";
import EditVisitModal from './EditVisitModal';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { canEditVisit } from '../utils/visitUtils';
import { usePreventDoubleSubmit } from '../utils/preventDoubleSubmit';
import { clientSchema } from '../validation/clientSchema';
import ContactsSection from './ContactsSection';
import { syncContacts } from '../utils/syncContacts';
import { getMarketLabel } from '../utils/markets';
import UserSelect from './UserSelect';
// Shared UI components for consistent layout
import Section from './common/Section';
import Grid from './common/Grid';
import FormField from './common/FormField';
import Mapa from './common/Mapa';

const normalizeCategory = cat => (cat ? cat.toString() : '').trim().replace(/\s+/g, '_');

function EditClientModal({ isOpen, client, onClose, onClientUpdated, allClients }) {
  const {
    formData,
    setFormData,
    contacts,
    setContacts,
    isSaving,
    setIsSaving,
    isStructureInvalid,
    handleChange,
    handleAddContact,
    handleRemoveContact,   // oryginalny remover z hooka
    handleContactChange,
    resetForm
  } = useClientForm(client);

  const { t } = useTranslation();
  const { user } = useAuth();
  const readOnly = isReadOnly(user);
  const [selectedDistributors, setSelectedDistributors] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [distOpen, setDistOpen] = useState(false);
  const distRef = useRef(null);

  useEffect(() => {
    // gdy otwierasz modal dla innego klienta, zrób świeżą kopię
    originalContactsRef.current = deepClone(client?.contacts);
  setSelectedDistributors(Array.isArray(client?.distributor_ids) ? client.distributor_ids.map(Number).slice(0,3) : []);
  }, [client?.id, isOpen]); // jeśli masz isOpen w propsach, dodaj; inaczej zostaw samo client?.id


  // Błędy z walidacji Zod / backendu
  const [errors, setErrors] = useState({}); // { "pole" | "contacts.0.email": "komunikat" }

  const deepClone = (v) => JSON.parse(JSON.stringify(v ?? []));
  const originalContactsRef = useRef(deepClone(client?.contacts));

  // Kandydaci dystrybutorów (A–Z, rynek, podkategorie, bez już wybranych, filtr po nazwie)
  const distributorCandidates = useMemo(() => {
    if (!Array.isArray(allClients)) return [];
    const marketId = Number(formData?.market_id || user?.singleMarketId);
    return allClients
      .filter((c) => (
        (c.client_subcategory === 'DYSTRYBUTOR CENTRALA' || c.client_subcategory === 'DYSTRYBUTOR ODDZIAŁ') &&
        (Number(c.market_id) === marketId)
      ))
      .filter((d) => !selectedDistributors.includes(Number(d.id)))
      .filter((d) => !searchTerm || (d.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (a.company_name || '').localeCompare(b.company_name || ''));
  }, [allClients, formData?.market_id, user?.singleMarketId, selectedDistributors, searchTerm]);

  // Number input UX guards
  const numberInputGuards = {
    inputMode: 'decimal',
    onKeyDown: (e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); },
    onPaste: (e) => { const txt = e.clipboardData.getData('text') || ''; if (/[eE+\-]/.test(txt)) e.preventDefault(); },
    onWheel: (e) => e.currentTarget.blur(),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // console.log('[EditClientModal] handleSubmit start', { formData, contacts });

    // 1) Sprawdzenie ważności sesji
    const isSessionOk = await checkSessionBeforeSubmit();
    if (!isSessionOk) {
      setIsSaving(false);
      // console.warn('[EditClientModal] Session not OK – abort');
      return;
    }

    // 2) Walidacja formularza klienta (Zod)
    const candidate = { ...formData, contacts }; // walidujemy całość
    const parsed = clientSchema.safeParse(candidate);

    if (!parsed.success) {
      const map = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.'); // np. "company_name" albo "contacts.0.email"
        if (!map[key]) map[key] = issue.message;
      }
      setErrors(map);
      // console.warn('[EditClientModal] Validation failed', map, parsed.error.issues);

      // przewiń do pierwszego błędnego pola (poza kontaktami, bo to różnie w JSX)
      const first = Object.keys(map)[0];
      if (first) {
        const top = first.split('.')[0];
        const el = document.querySelector(`[name="${top}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      setIsSaving(false);
      return;
    }

    setErrors({});
    // console.log('[EditClientModal] Validation OK');

    // 3) Zapis klienta (bez kontaktów)
  const { contacts: _ignoreContacts, ...clientPayload } = parsed.data;
  clientPayload.distributor_ids = selectedDistributors;
  // Nadpisz tylko ID; usuń stringowe pola z payloadu
  delete clientPayload.engo_team_director;
  delete clientPayload.engo_team_manager;
  delete clientPayload.engo_team_contact;
  // include *_user_id if captured from selects (zero/undefined oznacza null)
  clientPayload.engo_team_manager_user_id = formData.engo_team_manager_id ? Number(formData.engo_team_manager_id) : null;
  clientPayload.engo_team_user_id = formData.engo_team_contact_id ? Number(formData.engo_team_contact_id) : null;
  clientPayload.engo_team_director_user_id = formData.engo_team_director_id ? Number(formData.engo_team_director_id) : null;

    try {
      // console.log('[EditClientModal] Sending customer update', clientPayload);
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/edit.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: client.id, ...clientPayload }),
      });

      // Czytamy tekst, potem bezpiecznie parsujemy JSON,
      // żeby nie wywalić się gdy backend zwróci pusty body
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (_) { }
      // console.log('[EditClientModal] Response edit.php', { status: res.status, text, data });

      if (!(res.ok && data?.success)) {
        if (data?.errors && typeof data.errors === 'object') {
          setErrors(data.errors);
          const first = Object.keys(data.errors)[0];
          if (first) {
            const el = document.querySelector(`[name="${first.split('.')[0]}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        alert(data?.message || res.statusText || 'Błąd zapisu klienta');
        setIsSaving(false);
        // console.warn('[EditClientModal] Customer update failed');
        return;
      }

      // 4) SYNC kontaktów (zamiast starych pętli create/update/delete)
      // console.log('[EditClientModal] Customer updated OK, syncing contacts');
      const syncRes = await syncContacts({
        clientId: client.id,
        original: originalContactsRef.current || [], // stan "sprzed edycji"
        current: contacts,                           // stan "po edycji"
      });
      // console.log('[EditClientModal] syncContacts result', syncRes);

      if (!syncRes.ok) {
        const first = syncRes.errors?.[0];
        const msg = first
          ? `Błąd kontaktów: ${first.status} ${first.url}\n` +
          (first.data?.message || first.text || 'nieznany błąd')
          : 'Niepowodzenie operacji na kontaktach.';
        alert(msg);
        // kontynuujemy — dane klienta zapisane; kontakty mogły się częściowo zapisać
      }

      // aktualizujemy "oryginał", żeby kolejne zapisy miały poprawne porównanie
      originalContactsRef.current = deepClone(contacts);

      onClientUpdated?.();
      onClose();
    } catch (error) {
      // console.error('Error submitting client:', error);
      alert(`Error submitting client: ${error.message}`);
    } finally {
      setIsSaving(false);
      // console.log('[EditClientModal] handleSubmit end');
    }
  };


  const wrapSubmit = usePreventDoubleSubmit();
  const safeSubmit = wrapSubmit(handleSubmit);

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
    setIsBranchModalOpen(true);
  };



  const formatNumberWithSpaces = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  const parseNumber = (value) => value.replace(/\s/g, '');

  // UWAGA: Twój hook ma sygnaturę handleContactChange(index, event)
  const onContactFieldChange = (index, field, value) => {
    handleContactChange(index, { target: { name: field, value } });
  };

  // Mapowanie subkategorii na kategorię główną (ukryte pole)
  const mapSubToCat = (sub) => {
    if (!sub) return '';
    const distributors = ['DYSTRYBUTOR CENTRALA', 'DYSTRYBUTOR MAGAZYN', 'DYSTRYBUTOR ODDZIAŁ', 'PODHURT'];
    const installers = ['INSTALATOR FIRMA', 'INSTALATOR ENGO PLUS'];
    if (distributors.includes(sub)) return 'DYSTRYBUTOR';
    if (installers.includes(sub)) return 'INSTALATOR';
    return sub; // pozostałe 1:1
  };

  // Synchronizuj client_category przy zmianie client_subcategory
  useEffect(() => {
    if (!formData) return;
    setFormData(prev => ({ ...prev, client_category: mapSubToCat(prev.client_subcategory) }));
  }, [formData?.client_subcategory]);

  // UX: structure_* inputs — clear 0 on focus, restore 0 if empty on blur, clamp 0-100
  const handleStructureFocus = (name) => {
    setFormData((prev) => {
      const v = prev?.[name];
      if (v === 0 || v === '0') return { ...prev, [name]: '' };
      return prev;
    });
  };
  const handleStructureBlur = (name) => {
    setFormData((prev) => {
      const raw = prev?.[name];
      if (raw === '' || raw === null || raw === undefined) return { ...prev, [name]: 0 };
      const n = parseInt(raw, 10);
      const clamped = isNaN(n) ? 0 : Math.min(Math.max(n, 0), 100);
      return { ...prev, [name]: clamped };
    });
  };

  // If user is only market 1, ensure country defaults to Poland if empty
  useEffect(() => {
    if (user?.singleMarketId === 1 && formData) {
      setFormData((prev) => {
        if (!prev) return prev;
        const current = prev.country;
        if (current && String(current).trim() !== '') return prev;
        return { ...prev, country: 'Poland' };
      });
    }
  }, [user?.singleMarketId, formData]);

  // Zamknij listę po kliknięciu poza polem
  useEffect(() => {
    const onDocClick = (e) => {
      if (!distRef.current) return;
      if (!distRef.current.contains(e.target)) setDistOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);


  if (!isOpen || !formData) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'>
      <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
        <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
          <h2 className="text-lime-500 text-xl font-extrabold">{t('editClientModal.editLead')}</h2>
          <button
            className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={safeSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
          className="text-white flex flex-col gap-3 mt-2 pl-8 pr-8"
        >
          {/* Rynek */}
          {Array.isArray(user?.marketIds) && user.marketIds.length > 1 ? (
            <Section title={t('addClientModal.market') || 'Rynek'}>
              <Grid>
                <FormField id="market_id" label={t('addClientModal.market') || 'Rynek'} error={errors.market_id}>
                  <select
                    name="market_id"
                    value={formData.market_id ?? ''}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  >
                    <option value="">{t('addClientModal.chooseMarket') || '— wybierz rynek —'}</option>
                    {user.marketIds.map((mid) => (
                      <option key={mid} value={mid}>{getMarketLabel(mid)}</option>
                    ))}
                  </select>
                </FormField>
              </Grid>
            </Section>
          ) : (
            <Section title={t('addClientModal.market') || 'Rynek'}>
              <div className="text-neutral-800">
                {(t('addClientModal.market') || 'Rynek') + ': '}<span className="font-semibold">{getMarketLabel(formData.market_id || user?.singleMarketId)}</span>
              </div>
            </Section>
          )}

          {isAdminManager(user) && ( <Section title={t('common.BOK')}>
                <Grid className="mb-4">
                
                <FormField id="status" label={t('addClientModal.status')} error={errors.status}>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  >
                    <option value="1">{t('filter.new')}</option>
                    <option value="0">{t('filter.verified')}</option>
                  </select>
                </FormField>
              

              <FormField id="data_veryfication" label={t('addClientModal.data_veryfication')} error={errors.data_veryfication}>
                <select
                  name="data_veryfication"
                  value={formData.data_veryfication}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="0">{t('dataStatus.missing')}</option>
                  <option value="1">{t('dataStatus.ready')}</option>
                </select>
              </FormField>
              </Grid>
            </Section>)}

          {/* Dane firmy */}
          <Section title={t('addClientModal.companyData')}>
            <Grid className="mb-4">
              <FormField id="company_name" label={t('addClientModal.companyName')} required error={errors.company_name}>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="client_code_erp" label={t('addClientModal.client_code_erp')} error={errors.client_code_erp}>
                <input
                  type="text"
                  name="client_code_erp"
                  value={formData.client_code_erp}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

             

              <FormField id="nip" label={t('addClientModal.nip')} error={errors.nip}>
                <input
                  type="text"
                  name="nip"
                  value={formData.nip}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="class_category" label={t('common.class')}>
                <select
                  name="class_category"
                  value={formData.class_category || '-'}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="-">{t('common.noClass')}</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </FormField>

              {/* client_category ukryte – mapowane automatycznie */}
              <input type="hidden" name="client_category" value={formData.client_category || ''} />

              <FormField id="client_subcategory" label={t('fields.clientSubcategory')} error={errors.client_subcategory}>
                <select
                  name="client_subcategory"
                  value={formData.client_subcategory || ''}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="">{t('addClientModal.selectSubCategory')}</option>
                  <option value="GRUPA ZAKUPOWA">{t('addClientModal.categories.GRUPA_ZAKUPOWA')}</option>
                  <option value="DEWELOPER">{t('addClientModal.categories.DEWELOPER')}</option>
                  <option value="DYSTRYBUTOR CENTRALA">{t('addClientModal.categories.DYSTRYBUTOR_CENTRALA')}</option>
                  <option value="DYSTRYBUTOR MAGAZYN">{t('addClientModal.categories.DYSTRYBUTOR_MAGAZYN')}</option>
                  <option value="DYSTRYBUTOR ODDZIAŁ">{t('addClientModal.categories.DYSTRYBUTOR_ODDZIAŁ')}</option>
                  <option value="PODHURT">{t('addClientModal.categories.PODHURT')}</option>
                  <option value="INSTALATOR FIRMA">{t('addClientModal.categories.INSTALATOR_FIRMA')}</option>
                  <option value="INSTALATOR ENGO PLUS">{t('addClientModal.categories.ENGO_PLUS')}</option>
                  <option value="PROJEKTANT">{t('addClientModal.categories.PROJEKTANT')}</option>
                  <option value="KLIENT POTENCJALNY">{t('addClientModal.categories.KLIENT_POTENCJALNY')}</option>
                </select>
                {['DYSTRYBUTOR ODDZIAŁ', 'DYSTRYBUTOR MAGAZYN'].includes(formData.client_subcategory) && (
                  <div className="mt-2">
                    <div className="text-neutral-800 mb-1">{t('customer.hqLabel') || 'Siedziba główna'}</div>
                    <select
                      name="index_of_parent"
                      value={(formData.index_of_parent || '').trim()}
                      onChange={(e) => setFormData((prev) => ({ ...prev, index_of_parent: e.target.value.trim() }))}
                      className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    >
                      <option value="">{t('customer.chooseHQ') || 'Wybierz centralę'}</option>
                      {allClients
                        .filter((c) => c.client_subcategory === 'DYSTRYBUTOR CENTRALA' && (c.client_code_erp && c.client_code_erp.trim() !== ''))
                        .map((parent) => (
                          <option key={parent.id} value={(parent.client_code_erp || '').trim()}>
                            {parent.company_name} ({(parent.client_code_erp || '').trim()})
                          </option>
                        ))}
                    </select>
                    {errors.index_of_parent && <div className="text-red-600 text-sm">{errors.index_of_parent}</div>}
                  </div>
                )}
              </FormField>

              
            </Grid>
          </Section>

          {/* Related companies section */}
          {(
            formData.client_subcategory === 'PODHURT' ||
            normalizeCategory(formData.client_category) === 'INSTALATOR'
          ) && (
            <Section title={t('relatedCompanies.title') || 'Firmy powiązane'}>
              {/* <Grid> */}
                <FormField id="distributor_ids" label={t('relatedCompanies.linkedDistributors') || 'Powiązani dystrybutorzy (max 3)'}>
                  {/* Combobox: input + dropdown (A–Z) */}
                  <div className="relative w-full" ref={distRef}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setDistOpen(true); }}
                      onFocus={() => setDistOpen(true)}
                      placeholder={t('relatedCompanies.searchPlaceholder') || 'Szukaj firmy...'}
                      className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white text-neutral-900"
                    />
                    {distOpen && distributorCandidates.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded border border-neutral-300 bg-white shadow">
                        {distributorCandidates.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-neutral-100"
                            onClick={() => {
                              setSelectedDistributors((prev) => prev.includes(Number(d.id)) ? prev : prev.concat(Number(d.id)).slice(0,3));
                              setSearchTerm('');
                              setDistOpen(false);
                            }}
                          >
                            {d.company_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Przycisk Dodaj niepotrzebny — klik w pozycję dodaje od razu */}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedDistributors.map((id) => {
                      const d = allClients.find((c) => Number(c.id) === Number(id));
                      if (!d) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-2 bg-neutral-200 text-neutral-800 px-2 py-1 rounded-full">
                          <span>{d.company_name}</span>
                          <button type="button" className="text-red-600 hover:text-red-700" onClick={() => setSelectedDistributors((prev) => prev.filter((x) => x !== id))}>
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  <div className="text-neutral-600 text-sm mt-1">
                    {t('relatedCompanies.selectUpTo3') || 'Wybierz maksymalnie 3.'}
                  </div>
                </FormField>
              {/* </Grid> */}
            </Section>
          )}

          {normalizeCategory(formData.client_category) === 'DYSTRYBUTOR_CENTRALA' && (
            <Section title={t('customer.sections.hqBranches')}>
              <div className="text-black flex flex-col">
                {allClients
                  .filter((c) =>
                    normalizeCategory(c.client_category) === 'DYSTRYBUTOR_ODDZIAŁ' &&
                    (formData.client_code_erp && c.index_of_parent) &&
                    (c.index_of_parent || '').trim() === (formData.client_code_erp || '').trim()
                  )
                  .map((branch) => (
                    <a
                      key={branch.id}
                      className="cursor-pointer hover:text-lime-500"
                      onClick={() => handleBranchClick(branch)}
                    >
                      {branch.company_name}
                    </a>
                  ))}
              </div>
            </Section>
          )}

          {/* Lokalizacja */}
          <Section title={t('addClientModal.location')}>
            <Grid className="mb-2">
              <FormField id="street" label={t('addClientModal.street')} error={errors.street}>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="city" label={t('addClientModal.city')} error={errors.city}>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="postal_code" label={t('addClientModal.postalCode')} error={errors.postal_code}>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="district" label={t('addClientModal.district')} error={errors.district}>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="voivodeship" label={t('addClientModal.voivodeship')} error={errors.voivodeship}>
                <input
                  type="text"
                  name="voivodeship"
                  value={formData.voivodeship}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="country" label={t('addClientModal.country')} error={errors.country}>
                <CountrySelect
                  value={formData.country}
                  onChange={handleChange}
                  name="country"
                  hideLabel={true}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  disabled={user?.singleMarketId === 1}
                />
              </FormField>
              <FormField id="latitude" label={t('editClientModal.locationPicker.latitude')} error={errors.latitude}>
                <input
                  type="number"
                  step="0.000001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  {...numberInputGuards}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
              <FormField id="longitude" label={t('editClientModal.locationPicker.longitude')} error={errors.longitude}>
                <input
                  type="number"
                  step="0.000001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  {...numberInputGuards}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
            </Grid>
            <Mapa>
              <LocationPicker
                street={formData.street}
                city={formData.city}
                postal_code={formData.postal_code}
                voivodeship={formData.voivodeship}
                country={formData.country}
                latitude={formData.latitude}
                longitude={formData.longitude}
                onCoordsChange={(coords) => setFormData((prev) => ({ ...prev, latitude: coords.lat, longitude: coords.lng }))}
              />
            </Mapa>

            {formData.latitude && formData.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${formData.latitude},${formData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="buttonGreen mt-3 inline-block"
              >
                {t('editClientModal.direct')}
              </a>
            )}
          </Section>

          {/* Konta / Social / Finanse */}
          <Section title={t('addClientModal.accounts')}>
            <Grid>
              <FormField id="engo_team_director" label={t('addClientModal.engoTeamDirector') || 'Dyrektor w zespole ENGO'} error={errors.engo_team_director}>
                <UserSelect
                  roleFilter="director"
                  activeOnly={true}
                  marketId={formData.market_id || user?.singleMarketId}
                  name="engo_team_director"
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                  value={formData.engo_team_director || ''}
                  valueId={formData.engo_team_director_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, engo_team_director: val }))}
                  onChangeId={(id) => setFormData((prev) => ({ ...prev, engo_team_director_id: id }))}
                  placeholder={t('addClientModal.chooseMember')}
                  noMarketHint={t('addClientModal.chooseMarket')}
                />
              </FormField>
              <FormField id="engo_team_manager" label={t('addClientModal.engoTeamManager') || 'Manager ENGO'} error={errors.engo_team_manager}>
                <UserSelect
                  role="manager"
                  activeOnly={true}
                  marketId={formData.market_id || user?.singleMarketId}
                  name="engo_team_manager"
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                  value={formData.engo_team_manager || ''}
                  valueId={formData.engo_team_manager_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, engo_team_manager: val }))}
                  onChangeId={(id) => setFormData((prev) => ({ ...prev, engo_team_manager_id: id }))}
                  placeholder={t('addClientModal.chooseMember')}
                  noMarketHint={t('addClientModal.chooseMarket')}
                />
              </FormField>
              <FormField id="engo_team_contact" label={t('addClientModal.engoTeamContact')} error={errors.engo_team_contact}>
                <UserSelect
                  roleByMarket={{ 1: 'koordynator', 2: 'tsr', '1': 'koordynator', '2': 'tsr' }}
                  activeOnly={true}
                  marketId={formData.market_id || user?.singleMarketId}
                  name="engo_team_contact"
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                  value={formData.engo_team_contact || ''}
                  valueId={formData.engo_team_contact_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, engo_team_contact: val }))}
                  onChangeId={(id) => setFormData((prev) => ({ ...prev, engo_team_contact_id: id }))}
                  placeholder={t('addClientModal.chooseMember')}
                  noMarketPlaceholder={t('addClientModal.chooseMarket')}
                  showNoMarketHint={false}
                />
              </FormField>

              <FormField id="number_of_branches" label={t('addClientModal.branches')} error={errors.number_of_branches}>
                <input
                  type="text"
                  name="number_of_branches"
                  value={formData.number_of_branches}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
              <FormField id="number_of_sales_reps" label={t('addClientModal.salesReps')} error={errors.number_of_sales_reps}>
                <input
                  type="text"
                  name="number_of_sales_reps"
                  value={formData.number_of_sales_reps}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
              <FormField id="www" label={t('addClientModal.www')} error={errors.www}>
                <input
                  type="text"
                  name="www"
                  value={formData.www}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="possibility_www_baner" label={t('addClientModal.possibility_www_baner')} error={errors.possibility_www_baner}>
                <select
                  name="possibility_www_baner"
                  value={formData.possibility_www_baner}
                  onChange={handleChange}
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                >
                  <option value="0">{t('addClientModal.no')}</option>
                  <option value="1">{t('addClientModal.yes')}</option>
                </select>
              </FormField>

              <FormField id="possibility_add_articles" label={t('addClientModal.possibility_add_articles')} error={errors.possibility_add_articles}>
                <select
                  name="possibility_add_articles"
                  value={formData.possibility_add_articles}
                  onChange={handleChange}
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                >
                  <option value="0">{t('addClientModal.no')}</option>
                  <option value="1">{t('addClientModal.yes')}</option>
                </select>
              </FormField>

              <FormField id="facebook" label={t('addClientModal.facebook')} error={errors.facebook}>
                <input
                  type="text"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="possibility_graphic_and_posts_FB" label={t('addClientModal.possibility_graphic_and_posts_FB')} error={errors.possibility_graphic_and_posts_FB}>
                <select
                  name="possibility_graphic_and_posts_FB"
                  value={formData.possibility_graphic_and_posts_FB}
                  onChange={handleChange}
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                >
                  <option value="0">{t('addClientModal.no')}</option>
                  <option value="1">{t('addClientModal.yes')}</option>
                </select>
              </FormField>

              <FormField id="auction_service" label={t('addClientModal.auctionService')} error={errors.auction_service}>
                <input
                  type="text"
                  name="auction_service"
                  value={formData.auction_service}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="fairs" label={t('addClientModal.fairs')} error={errors.fairs}>
                <input
                  type="text"
                  name="fairs"
                  value={formData.fairs}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
              <FormField id="competition" label={t('addClientModal.competition')} error={errors.competition}>
                <input
                  type="text"
                  name="competition"
                  value={formData.competition}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="private_brand" label={t('addClientModal.privateBrand')}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="private_brand" checked={formData.private_brand === 1} onChange={handleChange} />
                  <span className="text-neutral-800">{t('addClientModal.privateBrand')}</span>
                </div>
                {formData.private_brand === 1 && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="private_brand_details"
                      value={formData.private_brand_details}
                      onChange={handleChange}
                      className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                    {errors.private_brand_details && <div className="text-red-600 text-sm">{errors.private_brand_details}</div>}
                  </div>
                )}
              </FormField>

              <FormField id="loyalty_program" label={t('addClientModal.loyaltyProgram')}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="loyalty_program" checked={formData.loyalty_program === 1} onChange={handleChange} />
                  <span className="text-neutral-800">{t('addClientModal.loyaltyProgram')}</span>
                </div>
                {formData.loyalty_program === 1 && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="loyalty_program_details"
                      value={formData.loyalty_program_details}
                      onChange={handleChange}
                      className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                    {errors.loyalty_program_details && <div className="text-red-600 text-sm">{errors.loyalty_program_details}</div>}
                  </div>
                )}
              </FormField>

              <FormField id="turnover_pln" label={t('addClientModal.turnoverPln')} error={errors.turnover_pln}>
                <input
                  type="text"
                  name="turnover_pln"
                  placeholder=""
                  value={formatNumberWithSpaces(formData.turnover_pln)}
                  onChange={(e) => {
                    const numeric = parseNumber(e.target.value);
                    handleChange({ target: { name: 'turnover_pln', value: numeric } });
                  }}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="turnover_eur" label={t('addClientModal.turnoverEur')} error={errors.turnover_eur}>
                <input
                  type="text"
                  name="turnover_eur"
                  placeholder=""
                  value={formatNumberWithSpaces(formData.turnover_eur)}
                  onChange={(e) => {
                    const numeric = parseNumber(e.target.value);
                    handleChange({ target: { name: 'turnover_eur', value: numeric } });
                  }}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="installation_sales_share" label={t('addClientModal.installationSales')} error={errors.installation_sales_share}>
                <input
                  type="text"
                  name="installation_sales_share"
                  value={formData.installation_sales_share}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="automatic_sales_share" label={t('addClientModal.automationSales')} error={errors.automatic_sales_share}>
                <input
                  type="text"
                  name="automatic_sales_share"
                  value={formData.automatic_sales_share}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="sales_potential" label={t('addClientModal.salesPotential')} error={errors.sales_potential}>
                <input
                  type="text"
                  name="sales_potential"
                  value={formData.sales_potential}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="has_webstore" label={t('addClientModal.webstore')} error={errors.has_webstore}>
                <input
                  type="text"
                  name="has_webstore"
                  value={formData.has_webstore}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="has_ENGO_products_in_webstore" label={t('addClientModal.has_ENGO_products_in_webstore')} error={errors.has_ENGO_products_in_webstore}>
                <select
                  name="has_ENGO_products_in_webstore"
                  value={formData.has_ENGO_products_in_webstore}
                  onChange={handleChange}
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                >
                  <option value="0">{t('addClientModal.no')}</option>
                  <option value="1">{t('addClientModal.yes')}</option>
                </select>
              </FormField>

              <FormField id="possibility_add_ENGO_products_to_webstore" label={t('addClientModal.possibility_add_ENGO_products_to_webstore')} error={errors.possibility_add_ENGO_products_to_webstore}>
                <select
                  name="possibility_add_ENGO_products_to_webstore"
                  value={formData.possibility_add_ENGO_products_to_webstore}
                  onChange={handleChange}
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                >
                  <option value="0">{t('addClientModal.no')}</option>
                  <option value="1">{t('addClientModal.yes')}</option>
                </select>
              </FormField>

              <FormField id="has_b2b_platform" label={t('addClientModal.b2b')} error={errors.has_b2b_platform}>
                <input
                  type="text"
                  name="has_b2b_platform"
                  value={formData.has_b2b_platform}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
              <FormField id="has_b2c_platform" label={t('addClientModal.b2c')} error={errors.has_b2c_platform}>
                <input
                  type="text"
                  name="has_b2c_platform"
                  value={formData.has_b2c_platform}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
            </Grid>
          </Section>

          {/* Struktura sprzedaży */}
          <Section title={t('addClientModal.salesStructure')}>
            {(isStructureInvalid || errors['structure_other']) && (
              <div className="text-red-600 font-semibold mb-2">
                {errors['structure_other'] || t('addClientModal.structureSumError')}
              </div>
            )}
            <Grid>
              <FormField id="structure_installer" label={t('addClientModal.structure.installer')}>
                <input type="number" name="structure_installer" value={formData.structure_installer} onChange={handleChange} onFocus={() => handleStructureFocus('structure_installer')} onBlur={() => handleStructureBlur('structure_installer')} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
              </FormField>
              <FormField id="structure_wholesaler" label={t('addClientModal.structure.wholesaler')}>
                <input type="number" name="structure_wholesaler" value={formData.structure_wholesaler} onChange={handleChange} onFocus={() => handleStructureFocus('structure_wholesaler')} onBlur={() => handleStructureBlur('structure_wholesaler')} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
              </FormField>
              <FormField id="structure_ecommerce" label={t('addClientModal.structure.ecommerce')}>
                <input type="number" name="structure_ecommerce" value={formData.structure_ecommerce} onChange={handleChange} onFocus={() => handleStructureFocus('structure_ecommerce')} onBlur={() => handleStructureBlur('structure_ecommerce')} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
              </FormField>
              <FormField id="structure_retail" label={t('addClientModal.structure.retail')}>
                <input type="number" name="structure_retail" value={formData.structure_retail} onChange={handleChange} onFocus={() => handleStructureFocus('structure_retail')} onBlur={() => handleStructureBlur('structure_retail')} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
              </FormField>
              <FormField id="structure_other" label={t('addClientModal.structure.other')} error={errors.structure_other}>
                <input type="number" name="structure_other" value={formData.structure_other} onChange={handleChange} onFocus={() => handleStructureFocus('structure_other')} onBlur={() => handleStructureBlur('structure_other')} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
              </FormField>
            </Grid>
          </Section>

          {/* Kontakty */}
          <Section title={t('common.contacts') || 'Kontakty'}>
            <ContactsSection
              contacts={contacts}
              onAdd={handleAddContact}
              onRemove={handleRemoveContact}
              onChange={onContactFieldChange}
              readOnly={readOnly}
              enableSearch={true}
            />
          </Section>


          {/* Przyciski */}
          <div className='flex justify-end mt-5'>
            <button className='buttonGreen' type="submit" disabled={isSaving || isStructureInvalid}>
              {isSaving ? t('addClientModal.saving') : t('addClientModal.save')}
            </button>
            {!isReadOnly(user) && (
              <button className='buttonRed' type="button" onClick={onClose} style={{ marginLeft: '10px' }}>
                {t('addClientModal.cancel')}
              </button>
            )}
          </div>
        </form>

        {/* Wizyty (bez zmian) */}
        <div className="mt-10 px-8">
          <h4 className="header2">{t('visitsPage.allVisits')}</h4>
          <button className="buttonGreen" onClick={() => setIsAddVisitOpen(true)}>
            {t('visit.addVisit')}
          </button>

          <ClientVisits
            client={client}
            clientId={client?.id}
            key={refreshFlag}
            onEdit={(visit) => {
              if (!canEditVisit(visit, user)) {
                alert(t("visitsPage.editRestricted"));
                return;
              }
              setSelectedVisit(visit);
              setIsEditModalOpen(true);
            }}
          />

          <AddVisitModal
            isOpen={isAddVisitOpen}
            onClose={() => setIsAddVisitOpen(false)}
            onVisitAdded={() => {
              setIsAddVisitOpen(false);
              setRefreshFlag(prev => !prev);
            }}
            clients={[{ id: client.id, company_name: client.company_name }]}
            fixedClientId={client.id}
          />

          {selectedVisit && (
            <EditVisitModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedVisit(null);
              }}
              onVisitUpdated={() => {
                setIsEditModalOpen(false);
                setSelectedVisit(null);
                setRefreshFlag(prev => !prev);
              }}
              visit={selectedVisit}
              clients={[{ id: client.id, company_name: client.company_name }]}
            />
          )}

          {selectedBranch && (
            <EditClientModal
              isOpen={isBranchModalOpen}
              client={selectedBranch}
              onClose={() => {
                setIsBranchModalOpen(false);
                setSelectedBranch(null);
              }}
              onClientUpdated={() => {
                setIsBranchModalOpen(false);
                setSelectedBranch(null);
                onClientUpdated();
              }}
              allClients={allClients}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default EditClientModal;
