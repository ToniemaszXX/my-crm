// src/components/EditInstallerModal.jsx
import { useEffect, useState } from 'react';
import LocationPicker from './LocationPicker';
import CountrySelect from './CountrySelect';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { usePreventDoubleSubmit } from '../utils/preventDoubleSubmit';
import { useAuth } from '../context/AuthContext';
import { getMarketLabel } from '../utils/markets';
import Section from './common/Section';
import Grid from './common/Grid';
import Mapa from './common/Mapa';
import FormField from './common/FormField';
import PillCheckbox from './common/PillCheckbox';

function EditInstallerModal({ isOpen, installer, onClose, onInstallerUpdated }) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (installer && isOpen) {
      // Prefill from provided installer object
      setFormData({
        id: installer.id,
        market_id: installer.market_id ?? user?.singleMarketId ?? '',
        company_name: installer.company_name || '',
        client_code_erp: installer.client_code_erp || '',
        status: String(installer.status ?? '1'),
        data_veryfication: String(installer.data_veryfication ?? '0'),
        street: installer.street || '',
        city: installer.city || '',
        voivodeship: installer.voivodeship || '',
        country: installer.country || 'Polska',
        postal_code: installer.postal_code || '',
        nip: installer.nip || '',
  client_category: installer.client_category || '',
  client_subcategory: installer.client_subcategory || '',
        fairs: installer.fairs || '',
  engo_team_director: installer.engo_team_director || '',
        engo_team_contact: installer.engo_team_contact || '',
        number_of_sales_reps: installer.number_of_sales_reps || '',
        latitude: installer.latitude || '',
        longitude: installer.longitude || '',
        www: installer.www || '',
        facebook: installer.facebook || '',
        additional_info: installer.additional_info || '',
        install_heating: Number(installer.install_heating) || 0,
        install_AC: Number(installer.install_AC) || 0,
        install_ventilation: Number(installer.install_ventilation) || 0,
        install_sh: Number(installer.install_sh) || 0,
        koi_flats: Number(installer.koi_flats) || 0,
        koi_houses: Number(installer.koi_houses) || 0,
        koi_OUP: Number(installer.koi_OUP) || 0,
        koi_hotels: Number(installer.koi_hotels) || 0,
        koi_comercial: Number(installer.koi_comercial) || 0,
        koi_others: installer.koi_others || '',
        numbers_of_subcontractors: installer.numbers_of_subcontractors || '',
        has_electrician: Number(installer.has_electrician) || 0,
        work_with_needs: Number(installer.work_with_needs) || 0,
        approved_by_distributor: Number(installer.approved_by_distributor) || 0,
        problems_arrears: Number(installer.problems_arrears) || 0,
        problem_time: Number(installer.problem_time) || 0,
        problem_clients_with_inteligent_system: Number(installer.problem_clients_with_inteligent_system) || 0,
        problem_expensive: Number(installer.problem_expensive) || 0,
        problem_low_margin: Number(installer.problem_low_margin) || 0,
        problem_complicated_installation: Number(installer.problem_complicated_installation) || 0,
        problem_complicated_configuration: Number(installer.problem_complicated_configuration) || 0,
        problem_app: Number(installer.problem_app) || 0,
        problem_support: Number(installer.problem_support) || 0,
        problem_complaint: Number(installer.problem_complaint) || 0,
        problem_training: Number(installer.problem_training) || 0,
        problem_integration: Number(installer.problem_integration) || 0,
        problem_marketing_stuff: Number(installer.problem_marketing_stuff) || 0,
        problem_competition: installer.problem_competition || '',
        problem_others: installer.problem_others || '',
      });
    }
  }, [installer, isOpen]);

  const handleChange = (e) => {
    const { name, type } = e.target;
    let value = e.target.value;
    if (type === 'checkbox') value = e.target.checked ? 1 : 0;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const numberInputGuards = {
    inputMode: 'decimal',
    onKeyDown: (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); },
    onPaste: (e) => {
      const txt = e.clipboardData.getData('text') || '';
      if (/[eE+\-]/.test(txt)) e.preventDefault();
    },
    onWheel: (e) => e.currentTarget.blur(),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;
    setIsSaving(true);
    setErrors({});

    if (!formData.company_name.trim()) {
      setErrors({ company_name: 'Nazwa jest wymagana' });
      setIsSaving(false);
      return;
    }

    const isSessionOk = await checkSessionBeforeSubmit();
    if (!isSessionOk) { setIsSaving(false); return; }

    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Installers/edit.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (_) { }
      if (!(res.ok && data?.success)) {
        alert(data?.message || 'Błąd zapisu instalatora');
        setIsSaving(false);
        return;
      }
      onInstallerUpdated?.(formData.id);
      onClose?.();
    } catch (err) {
      console.error(err);
      alert(`Błąd zapisu: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const wrapSubmit = usePreventDoubleSubmit();
  const safeSubmit = wrapSubmit(handleSubmit);

  if (!isOpen || !formData) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'>
      <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
        <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
          <h2 className="text-lime-500 text-xl font-extrabold">Edytuj Instalatora</h2>
          <button className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={safeSubmit} className="text-white flex flex-col gap-3 pl-8 pr-8">
          {Array.isArray(user?.marketIds) && user.marketIds.length > 1 && (
            <Section title="Rynek">
              <Grid>
                <FormField id="market_id" label="Rynek">
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
                  {errors.market_id && <div className="text-red-600 text-sm">{errors.market_id}</div>}
                </FormField>
              </Grid>
            </Section>
          )}

          <Section title="Dane firmy">
            <Grid className="mb-4">
              <FormField id="company_name" label="Nazwa firmy" required error={errors.company_name}>
                <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="client_code_erp" label="Kod ERP">
                <input type="text" name="client_code_erp" value={formData.client_code_erp} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="status" label="Status">
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400">
                  <option value="1">Nowy</option>
                  <option value="0">Zweryfikowany</option>
                </select>
              </FormField>
              <FormField id="data_veryfication" label="Weryfikacja danych">
                <select name="data_veryfication" value={formData.data_veryfication} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400">
                  <option value="0">Brak danych</option>
                  <option value="1">Gotowe</option>
                </select>
              </FormField>
              <FormField id="nip" label="NIP">
                <input type="text" name="nip" value={formData.nip} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="street" label="Ulica">
                <input type="text" name="street" value={formData.street} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="city" label="Miasto">
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="voivodeship" label="Województwo">
                <input type="text" name="voivodeship" value={formData.voivodeship} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="country" label="Kraj">
                <CountrySelect value={formData.country} onChange={handleChange} name="country" hideLabel={true} className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="postal_code" label="Kod pocztowy">
                <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
            </Grid>
          </Section>

          <Section title="Lokalizacja">
            <Grid className="mb-2">
              <FormField id="latitude" label="Szerokość geogr.">
                <input type="number" step="0.000001" name="latitude" value={formData.latitude} onChange={handleChange} {...numberInputGuards} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="longitude" label="Długość geogr.">
                <input type="number" step="0.000001" name="longitude" value={formData.longitude} onChange={handleChange} {...numberInputGuards} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
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

          <Section title="Kategoria i targi">
            <Grid>
              <FormField id="client_category" label="Kategoria klienta">
                <input type="text" name="client_category" value={formData.client_category} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
              <FormField id="client_subcategory" label="Podkategoria klienta">
                <input type="text" name="client_subcategory" value={formData.client_subcategory} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
              <FormField id="fairs" label="Targi / wydarzenia">
                <input type="text" name="fairs" value={formData.fairs} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
              <FormField id="engo_team_director" label="Dyrektor w zespole ENGO">
                <input type="text" name="engo_team_director" value={formData.engo_team_director || ''} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
              <FormField id="engo_team_contact" label="Kontakt w zespole ENGO">
                <input type="text" name="engo_team_contact" value={formData.engo_team_contact} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
              <FormField id="number_of_sales_reps" label="Liczba handlowców">
                <input type="text" name="number_of_sales_reps" value={formData.number_of_sales_reps} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
            </Grid>
          </Section>

          <Section title="Zakres działalności">
            <Grid>
              {[
                ['install_heating', 'Ogrzewanie'], ['install_AC', 'Klimatyzacja'], ['install_ventilation', 'Wentylacja'], ['install_sh', 'Smart Home'],
              ].map(([k, label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
            </Grid>
          </Section>

          <Section title="KOI – typy obiektów">
            <Grid>
              {[
                ['koi_flats', 'Mieszkania'], ['koi_houses', 'Domy'], ['koi_OUP', 'OUP'], ['koi_hotels', 'Hotele'], ['koi_comercial', 'Obiekty komercyjne'],
              ].map(([k, label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
              <FormField id="koi_others" label="Inne KOI">
                <input type="text" name="koi_others" value={formData.koi_others} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
            </Grid>
          </Section>

          <Section title="Podwykonawcy i kwalifikacje">
            <Grid>
              <FormField id="numbers_of_subcontractors" label="Liczba podwykonawców">
                <input type="number" name="numbers_of_subcontractors" value={formData.numbers_of_subcontractors} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
              {[
                ['has_electrician', 'Ma elektryka'], ['work_with_needs', 'Pracuje z potrzebami'], ['approved_by_distributor', 'Zatwierdzony przez dystrybutora'],
              ].map(([k, label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
            </Grid>
          </Section>

          <Section title="Problemy">
            <Grid>
              {[
                ['problems_arrears', 'Zaległości płatnicze'], ['problem_time', 'Czas'], ['problem_clients_with_inteligent_system', 'Klienci z inteligentnym systemem'], ['problem_expensive', 'Drogo'], ['problem_low_margin', 'Niska marża'], ['problem_complicated_installation', 'Skomplikowany montaż'],
                ['problem_complicated_configuration', 'Skomplikowana konfiguracja'], ['problem_app', 'Aplikacja'], ['problem_support', 'Wsparcie'], ['problem_complaint', 'Reklamacje'], ['problem_training', 'Szkolenia'], ['problem_integration', 'Integracja'], ['problem_marketing_stuff', 'Marketing'],
              ].map(([k, label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
              <FormField id="problem_competition" label="Konkurencja (liczba)">
                <input type="number" name="problem_competition" value={formData.problem_competition} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
              <FormField id="problem_others" label="Inne problemy">
                <input type="text" name="problem_others" value={formData.problem_others} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
            </Grid>
          </Section>

          <Section title="Online">
            <Grid>
              <FormField id="www" label="WWW">
                <input type="text" name="www" value={formData.www} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="facebook" label="Facebook">
                <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="additional_info" label="Dodatkowe informacje">
                <textarea name="additional_info" value={formData.additional_info} onChange={handleChange} className='w-full border border-neutral-300 rounded px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-neutral-400 text-neutral-950'></textarea>
              </FormField>
            </Grid>
          </Section>

          <div className='flex justify-end mt-5'>
            <button className='buttonGreen' type="submit" disabled={isSaving}>
              {isSaving ? t('addClientModal.saving') : 'Zapisz'}
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

export default EditInstallerModal;
