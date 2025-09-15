// src/components/AddClientModal.jsx
import { useState, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { getMarketLabel } from '../utils/markets';
// Shared UI components for consistent layout
import Section from './common/Section';
import Grid from './common/Grid';
import FormField from './common/FormField';
import Mapa from './common/Mapa';

const normalizeCategory = cat => (cat ? cat.toString() : '').trim().replace(/\s+/g, '_');

function AddClientModal({ isOpen, onClose, onClientAdded, allClients }) {
  const {
    formData, contacts, setContacts, isSaving, isStructureInvalid,
    setIsSaving, handleChange, handleAddContact, handleRemoveContact,
    handleContactChange, resetForm, setFormData
  } = useClientForm();

  const { t } = useTranslation();
  const [errors, setErrors] = useState({}); // { pole: komunikat }
  const { user } = useAuth();

  // Auto-assign market_id if user has a single market; leave empty if multiple for manual selection
  useEffect(() => {
    if (user?.singleMarketId) {
      setFormData((prev) => ({ ...prev, market_id: user.singleMarketId }));
    }
  }, [user?.singleMarketId]);

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

  // Display formatting for large numbers (match EditClientModal)
  const formatNumberWithSpaces = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  const parseNumber = (value) => String(value || '').replace(/\s/g, '');

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
          {/* Rynek */}
          {Array.isArray(user?.marketIds) && user.marketIds.length > 1 ? (
            <Section title={t('addClientModal.market') || 'Rynek'}>
              <Grid>
                <FormField id="market_id" label={t('addClientModal.market') || 'Rynek'} error={errors.market_id}>
                  <select
                    name="market_id"
                    value={formData.market_id}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  >
                    <option value="">— wybierz rynek —</option>
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
                Rynek: <span className="font-semibold">{getMarketLabel(formData.market_id || user?.singleMarketId)}</span>
              </div>
            </Section>
          )}

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

              <FormField id="status" label={t('addClientModal.status')} error={errors.status}>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="1">Nowy</option>
                  <option value="0">Zweryfikowany</option>
                </select>
              </FormField>

              <FormField id="data_veryfication" label={t('addClientModal.data_veryfication')} error={errors.data_veryfication}>
                <select
                  name="data_veryfication"
                  value={formData.data_veryfication}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="0">Brak danych</option>
                  <option value="1">Gotowe</option>
                </select>
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

              <FormField id="client_category" label={t('addClientModal.clientCategory')} error={errors.client_category}>
                <select
                  name="client_category"
                  value={formData.client_category}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
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

                {formData.client_category === 'DYSTRYBUTOR_ODDZIAŁ' && (
                  <div className="mt-2">
                    <div className="text-neutral-800 mb-1">Siedziba główna</div>
                    <select
                      name="index_of_parent"
                      value={(formData.index_of_parent || '').trim()}
                      onChange={(e) => setFormData((prev) => ({ ...prev, index_of_parent: e.target.value.trim() }))}
                      className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
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
                  </div>
                )}
              </FormField>

              <FormField id="client_subcategory" label="Podkategoria klienta" error={errors.client_subcategory}>
                <input
                  type="text"
                  name="client_subcategory"
                  value={formData.client_subcategory}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

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
            </Grid>
          </Section>

          {/* Lokalizacja */}
          <Section title={t('addClientModal.location')}>
            <Grid className="mb-2">
              <FormField id="latitude" label={t('addClientModal.latitude')} error={errors.latitude}>
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
              <FormField id="longitude" label={t('addClientModal.longitude')} error={errors.longitude}>
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
          </Section>

          {/* Konta / Social / Finanse */}
          <Section title={t('addClientModal.accounts')}>
            <Grid>
              <FormField id="engo_team_director" label={t('addClientModal.engoTeamDirector') || 'Dyrektor w zespole ENGO'} error={errors.engo_team_director}>
                <input
                  type="text"
                  name="engo_team_director"
                  value={formData.engo_team_director || ''}
                  onChange={handleChange}
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                />
              </FormField>
              <FormField id="engo_team_contact" label={t('addClientModal.engoTeamContact')} error={errors.engo_team_contact}>
                <select
                  name="engo_team_contact"
                  value={formData.engo_team_contact}
                  onChange={handleChange}
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                >
                  <option value="">{t('addClientModal.chooseMember')}</option>
                  <option value="Paweł Kulpa; DOK">Paweł Kulpa, DOK</option>
                  <option value="Bartosz Jamruszkiewicz;">Bartosz Jamruszkiewicz</option>
                  <option value="Arna Cizmovic; Bartosz Jamruszkiewicz">Arna Cizmovic, Bartosz Jamruszkiewicz</option>
                  <option value="Bogdan Iacob; Bartosz Jamruszkiewicz">Bogdan Iacob, Bartosz Jamruszkiewicz</option>
                  <option value="Lukasz Apanel;">Łukasz Apanel</option>
                  <option value="Lukasz Apanel; Damian Krzyżanowski">Damian Krzyżanowski, Łukasz Apanel</option>
                  <option value="Lukasz Apanel; Egidijus Karitonis">Egidijus Karitonis, Łukasz Apanel</option>
                </select>
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
                  <input type="checkbox" name="private_brand" checked={!!formData.private_brand} onChange={handleChange} />
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
                  <input type="checkbox" name="loyalty_program" checked={!!formData.loyalty_program} onChange={handleChange} />
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
                <input type="number" name="structure_installer" value={formData.structure_installer} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
              </FormField>
              <FormField id="structure_wholesaler" label={t('addClientModal.structure.wholesaler')}>
                <input type="number" name="structure_wholesaler" value={formData.structure_wholesaler} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
              </FormField>
              <FormField id="structure_ecommerce" label={t('addClientModal.structure.ecommerce')}>
                <input type="number" name="structure_ecommerce" value={formData.structure_ecommerce} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
              </FormField>
              <FormField id="structure_retail" label={t('addClientModal.structure.retail')}>
                <input type="number" name="structure_retail" value={formData.structure_retail} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
              </FormField>
              <FormField id="structure_other" label={t('addClientModal.structure.other')} error={errors.structure_other}>
                <input type="number" name="structure_other" value={formData.structure_other} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none" />
              </FormField>
            </Grid>
          </Section>

          {/* Kontakty */}
          <Section title={t('addClientModal.contacts') || 'Kontakty'}>
            <ContactsSection
              contacts={contacts}
              onAdd={handleAddContact}
              onRemove={handleRemoveContact}
              onChange={onContactFieldChange}
              readOnly={false}
              enableSearch={false}
            />
          </Section>



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
