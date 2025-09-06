// src/components/EditClientModal.jsx
import useClientForm from '../hooks/useClientForm';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import LocationPicker from './LocationPicker';
import { useTranslation } from 'react-i18next';
import { isReadOnly, isBok } from '../utils/roles';
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

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    // gdy otwierasz modal dla innego klienta, zrób świeżą kopię
    originalContactsRef.current = deepClone(client?.contacts);
  }, [client?.id, isOpen]); // jeśli masz isOpen w propsach, dodaj; inaczej zostaw samo client?.id


  // NOWE: błędy z walidacji Zod / backendu
  const [errors, setErrors] = useState({}); // { "pole" | "contacts.0.email": "komunikat" }

  // NOWE: lista ID kontaktów usuniętych w UI (do contacts/delete.php)
  const [removedContactIds, setRemovedContactIds] = useState([]);

  const deepClone = (v) => JSON.parse(JSON.stringify(v ?? []));
  const originalContactsRef = useRef(deepClone(client?.contacts));


  // prosty wrapper: zapamiętujemy ID do skasowania i wywołujemy oryginalny remover z hooka
  const removeContactAndTrack = (index) => {
    const c = contacts[index];
    if (c?.id) setRemovedContactIds(prev => [...prev, c.id]);
    handleRemoveContact(index);
  };

  const FieldError = ({ name }) =>
    errors[name] ? <div className="text-red-600 text-sm">{errors[name]}</div> : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // 1) Sprawdzenie ważności sesji
    const isSessionOk = await checkSessionBeforeSubmit();
    if (!isSessionOk) {
      setIsSaving(false);
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

    // 3) Zapis klienta (bez kontaktów)
    const { contacts: _ignoreContacts, ...clientPayload } = parsed.data;

    try {
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
        return;
      }

      // 4) SYNC kontaktów (zamiast starych pętli create/update/delete)
      const syncRes = await syncContacts({
        clientId: client.id,
        original: originalContactsRef.current || [], // stan "sprzed edycji"
        current: contacts,                           // stan "po edycji"
      });

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
      console.error('Error submitting client:', error);
      alert(`Error submitting client: ${error.message}`);
    } finally {
      setIsSaving(false);
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

        <form onSubmit={safeSubmit} className="text-white flex flex-col gap-3 mt-2 pl-8 pr-8">
          {/* Dane podstawowe */}
          <div className="flex-col">
            <h4 className='header2'>{t('addClientModal.companyData')}</h4>

            <div className="grid2col mb-7">
              <div className="flexColumn">
                <label className="text-neutral-800">{t('addClientModal.companyName')}
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} />
                  <FieldError name="company_name" />
                </label>

                <label className="text-neutral-800">{t('addClientModal.client_code_erp')}<br />
                  <input type="text" name="client_code_erp" value={formData.client_code_erp} onChange={handleChange} />
                  <FieldError name="client_code_erp" />
                </label>

                {!isBok(user) && (
                  <label className="text-neutral-800">{t('addClientModal.status')}<br />
                    <select name="status" className='AddSelectClient' value={formData.status} onChange={handleChange} >
                      <option value="1">Nowy</option>
                      <option value="0">Zweryfikowany</option>
                    </select>
                    <FieldError name="status" />
                  </label>
                )}

                <label className="text-neutral-800">{t('addClientModal.data_veryfication')}<br />
                  <select name="data_veryfication" className='AddSelectClient' value={formData.data_veryfication} onChange={handleChange} >
                    <option value="0">Brak danych</option>
                    <option value="1">Gotowe</option>
                  </select>
                  <FieldError name="data_veryfication" />
                </label>

                <label className="text-neutral-800">{t('addClientModal.nip')}
                  <input type="text" name="nip" value={formData.nip} onChange={handleChange} />
                  <FieldError name="nip" />
                </label>

                <label className='text-neutral-800'>
                  {t('addClientModal.clientCategory')}
                  <select name="client_category" value={formData.client_category} onChange={handleChange} className='AddSelectClient'>
                    <option value="">{t('addClientModal.selectCategory')}</option>
                    <option value="KLIENT_POTENCJALNY">{t('addClientModal.categories.KLIENT_POTENCJALNY')}</option>
                    <option value="CENTRALA_SIEĆ">{t('addClientModal.categories.CENTRALA_SIEĆ')}</option>
                    <option value="DEWELOPER">{t('addClientModal.categories.DEWELOPER')}</option>
                    <option value="DYSTRYBUTOR_CENTRALA">{t('addClientModal.categories.DYSTRYBUTOR_CENTRALA')}</option>
                    <option value="DYSTRYBUTOR_MAGAZYN">{t('addClientModal.categories.DYSTRYBUTOR_MAGAZYN')}</option>
                    <option value="DYSTRYBUTOR_ODDZIAŁ">{t('addClientModal.categories.DYSTRYBUTOR_ODDZIAŁ')}</option>
                    <option value="INSTALATOR_ENGO_PLUS">{t('addClientModal.categories.INSTALATOR_ENGO_PLUS')}</option>
                    <option value="INSTALATOR">{t('addClientModal.categories.INSTALATOR')}</option>
                    <option value="INSTALATOR_FIRMA">{t('addClientModal.categories.INSTALATOR_FIRMA')}</option>
                    <option value="PODHURT">{t('addClientModal.categories.PODHURT')}</option>
                    <option value="PODHURT_ELEKTRYKA">{t('addClientModal.categories.PODHURT_ELEKTRYKA')}</option>
                    <option value="PROJEKTANT">{t('addClientModal.categories.PROJEKTANT')}</option>
                  </select>
                  <FieldError name="client_category" />

                  {formData.client_category === 'DYSTRYBUTOR_ODDZIAŁ' && (
                    <label className="text-neutral-800">Siedziba główna<br />
                      <select
                        name="index_of_parent"
                        value={(formData.index_of_parent || '').trim()}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            index_of_parent: e.target.value.trim(),
                          }))
                        }
                        className='AddSelectClient'
                      >
                        <option value="">Wybierz centralę</option>
                        {allClients
                          .filter((c) =>
                            normalizeCategory(c.client_category) === 'DYSTRYBUTOR_CENTRALA' &&
                            (c.client_code_erp && c.client_code_erp.trim() !== '')
                          )
                          .map((parent) => (
                            <option key={parent.id} value={(parent.client_code_erp || '').trim()}>
                              {parent.company_name} ({(parent.client_code_erp || '').trim()})
                            </option>
                          ))}
                      </select>
                      <FieldError name="index_of_parent" />
                    </label>
                  )}
                </label>
              </div>

              <div className='flexColumn'>
                <label className="text-neutral-800">{t('addClientModal.street')}
                  <input type="text" name="street" value={formData.street} onChange={handleChange} />
                  <FieldError name="street" />
                </label>
                <label className="text-neutral-800">{t('addClientModal.city')}
                  <input type="text" name="city" value={formData.city} onChange={handleChange} />
                  <FieldError name="city" />
                </label>
                <label className='text-neutral-800'>
                  {t('addClientModal.postalCode')}
                  <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} />
                  <FieldError name="postal_code" />
                </label>

                <label className='text-neutral-800'>
                  {t('addClientModal.voivodeship')}
                  <input type="text" name="voivodeship" value={formData.voivodeship} onChange={handleChange} />
                  <FieldError name="voivodeship" />
                </label>

                <CountrySelect
                  label={t('addClientModal.country')}
                  value={formData.country}
                  onChange={handleChange}
                  className='AddSelectClient'
                />
                <FieldError name="country" />
              </div>
            </div>

            {normalizeCategory(formData.client_category) === 'DYSTRYBUTOR_CENTRALA' && (
              <div className="mb-6">
                <h4 className="header2">Oddziały przypisane do tej centrali</h4>
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
              </div>
            )}

            {/* Lokalizacja */}
            <div className="flex-col mb-7">
              <h4 className="header2">{t('addClientModal.location')}</h4>

              <div className="grid2col mb-4">
                <label className='text-neutral-800'>Szerokość geograficzna (lat)
                  <input type="text" name="latitude" value={formData.latitude} onChange={handleChange} />
                  <FieldError name="latitude" />
                </label>
                <label className='text-neutral-800'>Długość geograficzna (lng)
                  <input type="text" name="longitude" value={formData.longitude} onChange={handleChange} />
                  <FieldError name="longitude" />
                </label>
              </div>

              <div className='bg-neutral-100 p-8 rounded-lg w-full max-w-[90%] max-h-[90vh] overflow-y-auto'>
                <LocationPicker
                  street={formData.street}
                  city={formData.city}
                  postal_code={formData.postal_code}
                  voivodeship={formData.voivodeship}
                  country={formData.country}
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onCoordsChange={(coords) =>
                    setFormData((prev) => ({ ...prev, latitude: coords.lat, longitude: coords.lng }))
                  }
                />

                {/* <LocationPicker
                  street={formData.street}
                  city={formData.city}
                  postal_code={formData.postal_code}
                  voivodeship={formData.voivodeship}
                  country={formData.country}        // <-- teraz pełna nazwa, np. "United Kingdom"
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onCoordsChange={({ lat, lng }) =>
                    setFormData((p) => ({ ...p, latitude: lat, longitude: lng }))
                  }
                /> */}
              </div>

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
            </div>

            {/* Konta / Social / Finanse */}
            <div className="flex-col mb-7">
              <h4 className='header2'>{t('addClientModal.accounts')}</h4>

              <div className='grid2col'>
                <div className="flexColumn">
                  <label className="text-neutral-800">{t('addClientModal.engoTeamContact')}<br />
                    <select name="engo_team_contact" value={formData.engo_team_contact} onChange={handleChange} className='AddSelectClient'>
                      <option value="">{t('addClientModal.chooseMember')}</option>
                      <option value="Paweł Kulpa; DOK">Paweł Kulpa, DOK</option>
                      <option value="Bartosz Jamruszkiewicz;">Bartosz Jamruszkiewicz</option>
                      <option value="Arna Cizmovic; Bartosz Jamruszkiewicz">Arna Cizmovic, Bartosz Jamruszkiewicz</option>
                      <option value="Bogdan Iacob; Bartosz Jamruszkiewicz">Bogdan Iacob, Bartosz Jamruszkiewicz</option>
                      <option value="Lukasz Apanel;">Łukasz Apanel</option>
                      <option value="Lukasz Apanel; Damian Krzyżanowski">Damian Krzyżanowski, Łukasz Apanel</option>
                      <option value="Lukasz Apanel; Egidijus Karitonis">Egidijus Karitonis, Łukasz Apanel</option>
                    </select>
                    <FieldError name="engo_team_contact" />
                  </label>

                  <label className='text-neutral-800'>{t('addClientModal.branches')}
                    <input type="text" name="number_of_branches" value={formData.number_of_branches} onChange={handleChange} />
                    <FieldError name="number_of_branches" />
                  </label>
                  <label className='text-neutral-800'>{t('addClientModal.salesReps')}
                    <input type="text" name="number_of_sales_reps" value={formData.number_of_sales_reps} onChange={handleChange} />
                    <FieldError name="number_of_sales_reps" />
                  </label>
                  <label className='text-neutral-800'>{t('addClientModal.www')}
                    <input type="text" name="www" value={formData.www} onChange={handleChange} />
                    <FieldError name="www" />
                  </label>

                  <label className="text-neutral-800">{t('addClientModal.possibility_www_baner')}<br />
                    <select name="possibility_www_baner" className='AddSelectClient' value={formData.possibility_www_baner} onChange={handleChange}>
                      <option value="0">{t('addClientModal.no')}</option>
                      <option value="1">{t('addClientModal.yes')}</option>
                    </select>
                    <FieldError name="possibility_www_baner" />
                  </label>

                  <label className="text-neutral-800">{t('addClientModal.possibility_add_articles')}<br />
                    <select name="possibility_add_articles" className='AddSelectClient' value={formData.possibility_add_articles} onChange={handleChange}>
                      <option value="0">{t('addClientModal.no')}</option>
                      <option value="1">{t('addClientModal.yes')}</option>
                    </select>
                    <FieldError name="possibility_add_articles" />
                  </label>

                  <label className='text-neutral-800'>{t('addClientModal.facebook')}
                    <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} />
                    <FieldError name="facebook" />
                  </label>

                  <label className="text-neutral-800">{t('addClientModal.possibility_graphic_and_posts_FB')}<br />
                    <select name="possibility_graphic_and_posts_FB" className='AddSelectClient' value={formData.possibility_graphic_and_posts_FB} onChange={handleChange}>
                      <option value="0">{t('addClientModal.no')}</option>
                      <option value="1">{t('addClientModal.yes')}</option>
                    </select>
                    <FieldError name="possibility_graphic_and_posts_FB" />
                  </label>

                  <label className='text-neutral-800'>{t('addClientModal.auctionService')}
                    <input type="text" name="auction_service" value={formData.auction_service} onChange={handleChange} />
                    <FieldError name="auction_service" />
                  </label>
                  <label className="text-neutral-800">
                    {t('addClientModal.fairs')}<br />
                    <input type="text" name="fairs" value={formData.fairs} onChange={handleChange} />
                    <FieldError name="fairs" />
                  </label>
                  <label className="text-neutral-800">
                    {t('addClientModal.competition')}<br />
                    <input type="text" name="competition" value={formData.competition} onChange={handleChange} />
                    <FieldError name="competition" />
                  </label>

                  <label className='text-neutral-800'>
                    <input type="checkbox" name="private_brand" checked={formData.private_brand === 1} onChange={handleChange} />
                    {t('addClientModal.privateBrand')}
                  </label>
                  {formData.private_brand === 1 && (
                    <>
                      <input type="text" name="private_brand_details" value={formData.private_brand_details} onChange={handleChange} />
                      <FieldError name="private_brand_details" />
                    </>
                  )}

                  <label className='text-neutral-800'>
                    <input type="checkbox" name="loyalty_program" checked={formData.loyalty_program === 1} onChange={handleChange} />
                    {t('addClientModal.loyaltyProgram')}
                  </label>
                  {formData.loyalty_program === 1 && (
                    <>
                      <input type="text" name="loyalty_program_details" value={formData.loyalty_program_details} onChange={handleChange} />
                      <FieldError name="loyalty_program_details" />
                    </>
                  )}
                </div>

                <div className="flexColumn">
                  <label className='text-neutral-800'>{t('addClientModal.turnoverPln')}
                    <input
                      type="text"
                      name="turnover_pln"
                      placeholder=""
                      value={formatNumberWithSpaces(formData.turnover_pln)}
                      onChange={(e) => {
                        const numeric = parseNumber(e.target.value);
                        handleChange({ target: { name: 'turnover_pln', value: numeric } });
                      }}
                    />
                    <FieldError name="turnover_pln" />
                  </label>

                  <label className='text-neutral-800'>{t('addClientModal.turnoverEur')}
                    <input
                      type="text"
                      name="turnover_eur"
                      placeholder=""
                      value={formatNumberWithSpaces(formData.turnover_eur)}
                      onChange={(e) => {
                        const numeric = parseNumber(e.target.value);
                        handleChange({ target: { name: 'turnover_eur', value: numeric } });
                      }}
                    />
                    <FieldError name="turnover_eur" />
                  </label>

                  <label className='text-neutral-800'>{t('addClientModal.installationSales')}
                    <input
                      type="text"
                      name="installation_sales_share"
                      value={formData.installation_sales_share}
                      onChange={handleChange}
                    />
                    <FieldError name="installation_sales_share" />
                  </label>

                  <label className='text-neutral-800'>{t('addClientModal.automationSales')}
                    <input
                      type="text"
                      name="automatic_sales_share"
                      value={formData.automatic_sales_share}
                      onChange={handleChange}
                    />
                    <FieldError name="automatic_sales_share" />
                  </label>

                  <label className='text-neutral-800'>{t('addClientModal.salesPotential')}
                    <input
                      type="text"
                      name="sales_potential"
                      value={formData.sales_potential}
                      onChange={handleChange}
                    />
                    <FieldError name="sales_potential" />
                  </label>

                  <label className='text-neutral-800'>{t('addClientModal.webstore')}
                    <input type="text" name="has_webstore" value={formData.has_webstore} onChange={handleChange} />
                    <FieldError name="has_webstore" />
                  </label>

                  <label className="text-neutral-800">{t('addClientModal.has_ENGO_products_in_webstore')}<br />
                    <select name="has_ENGO_products_in_webstore" className='AddSelectClient' value={formData.has_ENGO_products_in_webstore}
                      onChange={handleChange}>
                      <option value="0">{t('addClientModal.no')}</option>
                      <option value="1">{t('addClientModal.yes')}</option>
                    </select>
                    <FieldError name="has_ENGO_products_in_webstore" />
                  </label>

                  <label className="text-neutral-800">{t('addClientModal.possibility_add_ENGO_products_to_webstore')}<br />
                    <select name="possibility_add_ENGO_products_to_webstore" className='AddSelectClient' value={formData.possibility_add_ENGO_products_to_webstore}
                      onChange={handleChange}>
                      <option value="0">{t('addClientModal.no')}</option>
                      <option value="1">{t('addClientModal.yes')}</option>
                    </select>
                    <FieldError name="possibility_add_ENGO_products_to_webstore" />
                  </label>

                  <label className='text-neutral-800'>{t('addClientModal.b2b')}
                    <input type="text" name="has_b2b_platform" value={formData.has_b2b_platform} onChange={handleChange} />
                    <FieldError name="has_b2b_platform" />
                  </label>
                  <label className='text-neutral-800'>{t('addClientModal.b2c')}
                    <input type="text" name="has_b2c_platform" value={formData.has_b2c_platform} onChange={handleChange} />
                    <FieldError name="has_b2c_platform" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Struktura sprzedaży */}
          <h4 className='header2'>{t('addClientModal.salesStructure')}</h4>
          {(isStructureInvalid || errors['structure_other']) && (
            <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>
              {errors['structure_other'] || t('addClientModal.structureSumError')}
            </div>
          )}
          <div className="flexColumn mb-7">
            <label className='text-neutral-800'>{t('addClientModal.structure.installer')}<br />
              <input type="number" name="structure_installer" value={formData.structure_installer} onChange={handleChange} />
            </label>
            <label className='text-neutral-800'>{t('addClientModal.structure.wholesaler')}<br />
              <input type="number" name="structure_wholesaler" value={formData.structure_wholesaler} onChange={handleChange} />
            </label>
            <label className='text-neutral-800'>{t('addClientModal.structure.ecommerce')}<br />
              <input type="number" name="structure_ecommerce" value={formData.structure_ecommerce} onChange={handleChange} />
            </label>
            <label className='text-neutral-800'>{t('addClientModal.structure.retail')}<br />
              <input type="number" name="structure_retail" value={formData.structure_retail} onChange={handleChange} />
            </label>
            <label className='text-neutral-800'>{t('addClientModal.structure.other')}<br />
              <input type="number" name="structure_other" value={formData.structure_other} onChange={handleChange} />
            </label>
          </div>

          <ContactsSection
            contacts={contacts}
            onAdd={handleAddContact}
            onRemove={handleRemoveContact}
            onChange={onContactFieldChange}
            readOnly={readOnly}        // masz zmienną readOnly z ról – zostaw jak jest
            enableSearch={true}
          />


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
