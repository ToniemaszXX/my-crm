// src/components/AddClientModal.jsx
import { useState } from 'react';
import useClientForm from '../hooks/useClientForm';
import LocationPicker from './LocationPicker';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import CountrySelect from './CountrySelect';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { usePreventDoubleSubmit } from '../utils/preventDoubleSubmit';
import { clientSchema } from '../validation/clientSchema';
import ContactsSection from './ContactsSection';
import { syncContacts } from '../utils/syncContacts';

const normalizeCategory = cat => (cat ? cat.toString() : '').trim().replace(/\s+/g, '_');

function AddClientModal({ isOpen, onClose, onClientAdded, allClients }) {
  const {
    formData, contacts, setContacts, isSaving, isStructureInvalid,
    setIsSaving, handleChange, handleAddContact, handleRemoveContact,
    handleContactChange, resetForm, setFormData
  } = useClientForm();

  const { t } = useTranslation();
  const [errors, setErrors] = useState({}); // { pole: komunikat }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const isSessionOk = await checkSessionBeforeSubmit();
    if (!isSessionOk) { setIsSaving(false); return; }

    // 1) Walidacja Zod – tak jak było
    const payloadCandidate = { ...formData, contacts };
    const parsed = clientSchema.safeParse(payloadCandidate);

    if (!parsed.success) {
      const map = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!map[key]) map[key] = issue.message;
      }
      setErrors(map);
      const first = Object.keys(map)[0];
      if (first) {
        const el = document.querySelector(`[name="${first.split('.')[0]}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setIsSaving(false);
      return;
    }

    setErrors({});

    // ⛔️ ważne: klient idzie osobno, bez kontaktów
    const { contacts: contactsToCreate, ...clientPayload } = parsed.data;

    try {
      // 2) Najpierw tworzymy klienta
      const resClient = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/add.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientPayload),
      });

      let dataClient = {};
      try { dataClient = await resClient.json(); } catch (_) { }

      if (!(resClient.ok && dataClient?.success)) {
        if (dataClient?.errors && typeof dataClient.errors === 'object') {
          setErrors(dataClient.errors);
          const first = Object.keys(dataClient.errors)[0];
          if (first) {
            const el = document.querySelector(`[name="${first.split('.')[0]}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        alert(dataClient?.message || t('error'));
        setIsSaving(false);
        return;
      }

      // back musi zwrócić id nowego klienta
      const newClientId = dataClient.id || dataClient.client_id || dataClient.newId;
      if (!newClientId) {
        alert('Brak ID nowego klienta w odpowiedzi API. Upewnij się, że customers/add.php zwraca {"success":true,"id":...}');
        setIsSaving(false);
        return;
      }

      // 3) Synchronizacja kontaktów jednym helperem (bez starych pętli)
      const syncRes = await syncContacts({
        clientId: newClientId,
        original: [],     // nowy klient nie ma jeszcze kontaktów w bazie
        current: contacts // to, co masz w formularzu
      });

      if (!syncRes.ok) {
        // pokaż pierwszy błąd użytkownikowi
        const first = syncRes.errors?.[0];
        const msg = first
          ? `Błąd kontaktów: ${first.status} ${first.url}\n` +
          (first.data?.message || first.text || 'nieznany błąd')
          : 'Niepowodzenie bez szczegółów';
        alert(msg);
      }


      alert(t('success'));
      resetForm();
      onClientAdded?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert(`Błąd zapisu: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const wrapSubmit = usePreventDoubleSubmit();
  const safeSubmit = wrapSubmit(handleSubmit);

  // wspólne propsy dla <input type="number"> (kwoty, procenty, lat/lng)
  const numberInputGuards = {
    inputMode: 'decimal',
    onKeyDown: (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); },
    onPaste: (e) => {
      const txt = e.clipboardData.getData('text') || '';
      if (/[eE+\-]/.test(txt)) e.preventDefault();
    },
    onWheel: (e) => e.currentTarget.blur(),
  };

  const onContactFieldChange = (index, field, value) => {
    handleContactChange(index, { target: { name: field, value } });
  };


  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'>
      <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
        <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
          <h2 className="text-lime-500 text-xl font-extrabold">{t('addClientModal.title')}</h2>
          <button className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={safeSubmit} className="text-white flex flex-col gap-3 pl-8 pr-8">
          {/* Podstawowe informacje */}
          <div className="flex-col">
            <h4 className='header2'>{t('addClientModal.companyData')}</h4>
            <div className="grid2col mb-7">
              <div className="flexColumn">
                <label className="text-neutral-800">{t('addClientModal.companyName')}<br />
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} />
                  {errors.company_name && <div className="text-red-600 text-sm">{errors.company_name}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.client_code_erp')}<br />
                  <input type="text" name="client_code_erp" value={formData.client_code_erp} onChange={handleChange} />
                  {errors.client_code_erp && <div className="text-red-600 text-sm">{errors.client_code_erp}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.status')}<br />
                  <select name="status" className='AddSelectClient' value={formData.status} onChange={handleChange}>
                    <option value="1">Nowy</option>
                    <option value="0">Zweryfikowany</option>
                  </select>
                  {errors.status && <div className="text-red-600 text-sm">{errors.status}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.data_veryfication')}<br />
                  <select name="data_veryfication" className='AddSelectClient' value={formData.data_veryfication} onChange={handleChange}>
                    <option value="0">Brak danych</option>
                    <option value="1">Gotowe</option>
                  </select>
                  {errors.data_veryfication && <div className="text-red-600 text-sm">{errors.data_veryfication}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.nip')}<br />
                  <input type="text" name="nip" value={formData.nip} onChange={handleChange} />
                  {errors.nip && <div className="text-red-600 text-sm">{errors.nip}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.clientCategory')}<br />
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
                    <option value="INSTALATOR_FIRMA">{t('addClientModal.categories.INSTALATOR')}</option>
                    <option value="PODHURT">{t('addClientModal.categories.PODHURT')}</option>
                    <option value="PODHURT_ELEKTRYKA">{t('addClientModal.categories.PODHURT_ELEKTRYKA')}</option>
                    <option value="PROJEKTANT">{t('addClientModal.categories.PROJEKTANT')}</option>
                  </select>

                  {formData.client_category === 'DYSTRYBUTOR_ODDZIAŁ' && (
                    <label className="text-neutral-800">Siedziba główna<br />
                      <select
                        name="index_of_parent"
                        value={(formData.index_of_parent || '').trim()}
                        onChange={(e) => setFormData((prev) => ({ ...prev, index_of_parent: e.target.value.trim() }))}
                        className='AddSelectClient'
                      >
                        <option value="">Wybierz centralę</option>
                        {allClients
                          .filter((c) => normalizeCategory(c.client_category) === 'DYSTRYBUTOR_CENTRALA' && (c.client_code_erp && c.client_code_erp.trim() !== ''))
                          .map((parent) => (
                            <option key={parent.id} value={(parent.client_code_erp || '').trim()}>
                              {parent.company_name} ({(parent.client_code_erp || '').trim()})
                            </option>
                          ))}
                      </select>
                      {errors.index_of_parent && <div className="text-red-600 text-sm">{errors.index_of_parent}</div>}
                    </label>
                  )}
                </label>
              </div>

              <div className="flexColumn">
                <label className="text-neutral-800">{t('addClientModal.street')}<br />
                  <input type="text" name="street" value={formData.street} onChange={handleChange} />
                  {errors.street && <div className="text-red-600 text-sm">{errors.street}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.city')}<br />
                  <input type="text" name="city" value={formData.city} onChange={handleChange} />
                  {errors.city && <div className="text-red-600 text-sm">{errors.city}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.voivodeship')}<br />
                  <input type="text" name="voivodeship" value={formData.voivodeship} onChange={handleChange} />
                  {errors.voivodeship && <div className="text-red-600 text-sm">{errors.voivodeship}</div>}
                </label>
                <CountrySelect label={t('addClientModal.country')} value={formData.country} onChange={handleChange} className='AddSelectClient' />
                {errors.country && <div className="text-red-600 text-sm">{errors.country}</div>}
                <label className="text-neutral-800">{t('addClientModal.postalCode')}<br />
                  <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} />
                  {errors.postal_code && <div className="text-red-600 text-sm">{errors.postal_code}</div>}
                </label>
              </div>
            </div>
          </div>

          <div className="flex-col mb-7">
            <h4 className="header2">{t('addClientModal.location')}</h4>
            <div className="grid2col mb-4">
              <label className="text-neutral-800">{t('addClientModal.latitude')}<br />
                <input type="number" step="0.000001" name="latitude" value={formData.latitude} onChange={handleChange} {...numberInputGuards} />
                {errors.latitude && <div className="text-red-600 text-sm">{errors.latitude}</div>}
              </label>
              <label className="text-neutral-800">{t('addClientModal.longitude')}<br />
                <input type="number" step="0.000001" name="longitude" value={formData.longitude} onChange={handleChange} {...numberInputGuards} />
                {errors.longitude && <div className="text-red-600 text-sm">{errors.longitude}</div>}
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
                onCoordsChange={(coords) => setFormData((prev) => ({ ...prev, latitude: coords.lat, longitude: coords.lng }))}
              />

              {/* <LocationPicker
                street={formData.street}
                city={formData.city}
                postal_code={formData.postal_code}
                voivodeship={formData.voivodeship}
                country={formData.country}
                latitude={formData.latitude}
                longitude={formData.longitude}
                onCoordsChange={({ latitude, longitude }) =>
                  setFormData((p) => ({ ...p, latitude, longitude }))
                }
              /> */}
            </div>
          </div>

          <div className="flex-col mb-7">
            <h4 className='header2'>{t('addClientModal.accounts')}</h4>
            <div className='grid2col'>
              <div className="flexColumn">
                <label className="text-neutral-800">{t('addClientModal.engoTeamContact')}<br />
                  <select name="engo_team_contact" value={formData.engo_team_contact} onChange={handleChange} className='AddSelectClient'>
                    <option value="">{t('addClientModal.chooseMember')}</option>
                    <option value="Pawel Kulpa; DOK">Pawel Kulpa, DOK</option>
                    <option value="Bartosz Jamruszkiewicz">Bartosz Jamruszkiewicz</option>
                    <option value="Arna Cizmovic; Bartosz Jamruszkiewicz">Arna Cizmovic, Bartosz Jamruszkiewicz</option>
                    <option value="Bogdan Iacob; Bartosz Jamruszkiewicz">Bogdan Iacob, Bartosz Jamruszkiewicz</option>
                    <option value="Lukasz Apanel">Lukasz Apanel</option>
                    <option value="Damian Krzyzanowski; Lukasz Apanel">Damian Krzyzanowski, Lukasz Apanel</option>
                    <option value="Egidijus Karitonis; Lukasz Apane">Egidijus Karitonis, Lukasz Apanel</option>
                  </select>
                  {errors.engo_team_contact && <div className="text-red-600 text-sm">{errors.engo_team_contact}</div>}
                </label>

                <label className="text-neutral-800">{t('addClientModal.branches')}<br />
                  <input type="number" name="number_of_branches" value={formData.number_of_branches} onChange={handleChange} />
                  {errors.number_of_branches && <div className="text-red-600 text-sm">{errors.number_of_branches}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.salesReps')}<br />
                  <input type="number" name="number_of_sales_reps" value={formData.number_of_sales_reps} onChange={handleChange} />
                  {errors.number_of_sales_reps && <div className="text-red-600 text-sm">{errors.number_of_sales_reps}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.www')}<br />
                  <input type="text" name="www" value={formData.www} onChange={handleChange} />
                  {errors.www && <div className="text-red-600 text-sm">{errors.www}</div>}
                </label>

                <label className="text-neutral-800">{t('addClientModal.possibility_www_baner')}<br />
                  <select name="possibility_www_baner" className='AddSelectClient' value={formData.possibility_www_baner} onChange={handleChange}>
                    <option value="0">{t('addClientModal.no')}</option>
                    <option value="1">{t('addClientModal.yes')}</option>
                  </select>
                </label>

                <label className="text-neutral-800">{t('addClientModal.possibility_add_articles')}<br />
                  <select name="possibility_add_articles" className='AddSelectClient' value={formData.possibility_add_articles} onChange={handleChange}>
                    <option value="0">{t('addClientModal.no')}</option>
                    <option value="1">{t('addClientModal.yes')}</option>
                  </select>
                </label>

                <label className="text-neutral-800">{t('addClientModal.facebook')}<br />
                  <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} />
                  {errors.facebook && <div className="text-red-600 text-sm">{errors.facebook}</div>}
                </label>

                <label className="text-neutral-800">{t('addClientModal.possibility_graphic_and_posts_FB')}<br />
                  <select name="possibility_graphic_and_posts_FB" className='AddSelectClient' value={formData.possibility_graphic_and_posts_FB} onChange={handleChange}>
                    <option value="0">{t('addClientModal.no')}</option>
                    <option value="1">{t('addClientModal.yes')}</option>
                  </select>
                </label>

                <label className="text-neutral-800">{t('addClientModal.auctionService')}<br />
                  <input type="text" name="auction_service" value={formData.auction_service} onChange={handleChange} />
                  {errors.auction_service && <div className="text-red-600 text-sm">{errors.auction_service}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.fairs')}<br />
                  <input type="text" name="fairs" value={formData.fairs} onChange={handleChange} />
                  {errors.fairs && <div className="text-red-600 text-sm">{errors.fairs}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.competition')}<br />
                  <input type="text" name="competition" value={formData.competition} onChange={handleChange} />
                  {errors.competition && <div className="text-red-600 text-sm">{errors.competition}</div>}
                </label>
                <label className="text-neutral-800">
                  <input type="checkbox" name="private_brand" checked={!!formData.private_brand} onChange={handleChange} />{t('addClientModal.privateBrand')}
                </label>
                {formData.private_brand === 1 && (
                  <label className="text-neutral-800">{t('addClientModal.privateBrandDetails')}
                    <input type="text" name="private_brand_details" value={formData.private_brand_details} onChange={handleChange} />
                    {errors.private_brand_details && <div className="text-red-600 text-sm">{errors.private_brand_details}</div>}
                  </label>
                )}
                <label className="text-neutral-800">
                  <input type="checkbox" name="loyalty_program" checked={!!formData.loyalty_program} onChange={handleChange} />{t('addClientModal.loyaltyProgram')}<br />
                </label>
                {formData.loyalty_program === 1 && (
                  <label className="text-neutral-800">{t('addClientModal.loyaltyProgramDetails')}<br />
                    <input type="text" name="loyalty_program_details" value={formData.loyalty_program_details} onChange={handleChange} />
                    {errors.loyalty_program_details && <div className="text-red-600 text-sm">{errors.loyalty_program_details}</div>}
                  </label>
                )}
              </div>

              <div className="flexColumn">
                <label className="text-neutral-800">{t('addClientModal.turnoverPln')}<br />
                  <input type="number" step="0.01" name="turnover_pln" value={formData.turnover_pln} onChange={handleChange} {...numberInputGuards} />
                  {errors.turnover_pln && <div className="text-red-600 text-sm">{errors.turnover_pln}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.turnoverEur')}<br />
                  <input type="number" step="0.01" name="turnover_eur" value={formData.turnover_eur} onChange={handleChange} {...numberInputGuards} />
                  {errors.turnover_eur && <div className="text-red-600 text-sm">{errors.turnover_eur}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.installationSales')}<br />
                  <input type="number" step="0.01" name="installation_sales_share" value={formData.installation_sales_share} onChange={handleChange} {...numberInputGuards} />
                  {errors.installation_sales_share && <div className="text-red-600 text-sm">{errors.installation_sales_share}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.automationSales')}<br />
                  <input type="number" step="0.01" name="automatic_sales_share" value={formData.automatic_sales_share} onChange={handleChange} {...numberInputGuards} />
                  {errors.automatic_sales_share && <div className="text-red-600 text-sm">{errors.automatic_sales_share}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.salesPotential')}<br />
                  <input type="number" step="0.01" name="sales_potential" value={formData.sales_potential} onChange={handleChange} {...numberInputGuards} />
                  {errors.sales_potential && <div className="text-red-600 text-sm">{errors.sales_potential}</div>}
                </label>
                <label className="text-neutral-800">{t('addClientModal.webstore')}<br />
                  <input type="text" name="has_webstore" value={formData.has_webstore} onChange={handleChange} />
                </label>

                <label className="text-neutral-800">{t('addClientModal.has_ENGO_products_in_webstore')}<br />
                  <select name="has_ENGO_products_in_webstore" className='AddSelectClient' value={formData.has_ENGO_products_in_webstore}
                    onChange={handleChange}>
                    <option value="0">{t('addClientModal.no')}</option>
                    <option value="1">{t('addClientModal.yes')}</option>
                  </select>
                </label>

                <label className="text-neutral-800">{t('addClientModal.possibility_add_ENGO_products_to_webstore')}<br />
                  <select name="possibility_add_ENGO_products_to_webstore" className='AddSelectClient' value={formData.possibility_add_ENGO_products_to_webstore}
                    onChange={handleChange}>
                    <option value="0">{t('addClientModal.no')}</option>
                    <option value="1">{t('addClientModal.yes')}</option>
                  </select>
                </label>

                <label className="text-neutral-800">{t('addClientModal.b2b')}<br />
                  <input type="text" name="has_b2b_platform" value={formData.has_b2b_platform} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">{t('addClientModal.b2c')}<br />
                  <input type="text" name="has_b2c_platform" value={formData.has_b2c_platform} onChange={handleChange} />
                </label>
              </div>
            </div>
          </div>

          {/* Sales Structure */}
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
            readOnly={false}
            enableSearch={false}
          />



          {/* Przyciski */}
          <div className='flex justify-end mt-5'>
            <button className='buttonGreen' type="submit" disabled={isSaving || isStructureInvalid}>
              {isSaving ? t('addClientModal.saving') : t('addClientModal.save')}
            </button>
            <button className='buttonRed' type="button" onClick={onClose} style={{ marginLeft: '10px' }}>
              {t('addClientModal.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddClientModal;
