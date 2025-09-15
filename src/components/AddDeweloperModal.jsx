// src/components/AddDeweloperModal.jsx
import { useEffect, useState } from 'react';
import LocationPicker from './LocationPicker';
import CountrySelect from './CountrySelect';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { usePreventDoubleSubmit } from '../utils/preventDoubleSubmit';
import { getMarketLabel } from '../utils/markets';
import { useAuth } from '../context/AuthContext';
import Section from './common/Section';
import Grid from './common/Grid';
import Mapa from './common/Mapa';
import FormField from './common/FormField';
import PillCheckbox from './common/PillCheckbox';
import developerSchema from '../validation/developerSchema';

function AddDeweloperModal({ isOpen, onClose, onDeveloperAdded }) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { user } = useAuth();
  const initialFormData = {
    market_id: '',
    company_name: '',
    client_code_erp: '',
    status: 1,
    data_veryfication: 0,
    street: '',
    city: '',
    voivodeship: '',
    country: 'Polska',
    postal_code: '',
    nip: '',
    client_category: '',
    client_subcategory: '',
    fairs: '',
  engo_team_director: '',
    engo_team_contact: '',
    number_of_sales_reps: '',
    latitude: '',
    longitude: '',
    www: '',
    facebook: '',
    additional_info: '',

    seg_multi_family: 0,
    seg_single_family: 0,
    seg_commercial: 0,
    seg_hotel_leisure: 0,
    char_mainstream: 0,
    char_premium: 0,
    char_luxury: 0,
    scale_band: 'le_50',
    smart_home_offer: 'standard',

    diff_location: 0,
    diff_arch_design: 0,
    diff_materials_quality: 0,
    diff_eco_energy: 0,
    diff_price: 0,
    diff_other: 0,
    diff_other_text: '',

    chal_competition: 0,
    chal_rising_costs: 0,
    chal_long_sales_cycle: 0,
    chal_customer_needs: 0,
    chal_energy_compliance: 0,
    int_cost_reduction: 0,
    int_safety_comfort: 0,
    int_modern_sales_arg: 0,

    gc_company: '',
    inst_hvac_company: '',
    inst_electrical_company: '',
    arch_design_company: '',
    interior_design_company: '',
    wholesale_plumb_heat: '',
    wholesale_electrical: '',

    implementation_model: 'standard_all',

    sup_marketing: 0,
    sup_show_apartment: 0,
    sup_sales_training: 0,
    sup_solution_packages: 0,
    sup_full_coordination: 0,
    sup_terms_distribution: 0,
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (user?.singleMarketId) {
      setFormData((p) => ({ ...p, market_id: user.singleMarketId }));
    }
  }, [user?.singleMarketId]);

  const handleChange = (e) => {
    const { name, type } = e.target;
    let value = e.target.value;
    if (type === 'checkbox') value = e.target.checked ? 1 : 0;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const numberInputGuards = {
    inputMode: 'decimal',
    onKeyDown: (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); },
    onPaste: (e) => { const txt = e.clipboardData.getData('text') || ''; if (/[eE+\-]/.test(txt)) e.preventDefault(); },
    onWheel: (e) => e.currentTarget.blur(),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});

    // For multi-market users, require market selection on FE
    if (Array.isArray(user?.marketIds) && user.marketIds.length > 1 && !formData.market_id) {
      setErrors({ market_id: 'Wybierz rynek' });
      setIsSaving(false);
      return;
    }

    // Zod validation
    const parse = developerSchema.safeParse(formData);
    if (!parse.success) {
      const fieldErrors = {};
      for (const issue of parse.error.issues) {
        const key = issue.path.join('.') || 'form';
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSaving(false);
      return;
    }

    const isSessionOk = await checkSessionBeforeSubmit();
    if (!isSessionOk) { setIsSaving(false); return; }

    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Developers/add.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      let data = {}; try { data = await res.json(); } catch { }
      if (!(res.ok && data?.success)) { alert(data?.message || t('error')); setIsSaving(false); return; }
      onDeveloperAdded?.(data.id);
      alert(t('success'));
  // reset the form so it’s clean next time
  setFormData({ ...initialFormData });
  onClose?.();
    } catch (err) { console.error(err); alert(`Błąd zapisu: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  const wrapSubmit = usePreventDoubleSubmit();
  const safeSubmit = wrapSubmit(handleSubmit);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'>
      <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
        <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
          <h2 className="text-lime-500 text-xl font-extrabold">Dodaj Dewelopera</h2>
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
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="client_code_erp" label="Kod ERP">
                <input
                  type="text"
                  name="client_code_erp"
                  value={formData.client_code_erp}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="status" label="Status">
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

              <FormField id="data_veryfication" label="Weryfikacja danych">
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

              <FormField id="nip" label="NIP">
                <input
                  type="text"
                  name="nip"
                  value={formData.nip}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="client_category" label="Kategoria klienta">
                <input
                  type="text"
                  name="client_category"
                  value={formData.client_category}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="client_subcategory" label="Podkategoria klienta">
                <input
                  type="text"
                  name="client_subcategory"
                  value={formData.client_subcategory}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="street" label="Ulica">
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="city" label="Miasto">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="voivodeship" label="Województwo">
                <input
                  type="text"
                  name="voivodeship"
                  value={formData.voivodeship}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="country" label="Kraj">
                <CountrySelect
                  value={formData.country}
                  onChange={handleChange}
                  name="country"
                  hideLabel={true}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="postal_code" label="Kod pocztowy">
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

          <Section title="Lokalizacja">
            <Grid className="mb-2">
              <FormField id="latitude" label="Szerokość geogr.">
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
              <FormField id="longitude" label="Długość geogr.">
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

          <Section title="Segmenty i charakter">
            <Grid>
              {[
                ['seg_multi_family','Wielo-rodzinne'],['seg_single_family','Jedno-rodzinne'],['seg_commercial','Komercyjne'],['seg_hotel_leisure','Hotele/rekreacja']
              ].map(([k,label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}

              {[
                ['char_mainstream','Mainstream'],['char_premium','Premium'],['char_luxury','Luksus']
              ].map(([k,label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}

              <FormField id="scale_band" label="Skala inwestycji">
                <select
                  name="scale_band"
                  value={formData.scale_band}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="le_50">le_50</option>
                  <option value="51_200">51_200</option>
                  <option value="gt_200">gt_200</option>
                </select>
              </FormField>

              <FormField id="smart_home_offer" label="Oferta SMART HOME">
                <select
                  name="smart_home_offer"
                  value={formData.smart_home_offer}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="standard">standard</option>
                  <option value="optional_package">optional_package</option>
                  <option value="no_but_open">no_but_open</option>
                  <option value="no_not_considered">no_not_considered</option>
                </select>
              </FormField>
            </Grid>
          </Section>

          <Section title="Wyróżniki">
            <Grid>
              {[
                ['diff_location','Lokalizacja'],['diff_arch_design','Architektura/Design'],['diff_materials_quality','Jakość materiałów'],['diff_eco_energy','Eko/energia'],['diff_price','Cena'],['diff_other','Inne']
              ].map(([k,label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
              <FormField id="diff_other_text" label="Inne — doprecyzowanie">
                <input
                  type="text"
                  name="diff_other_text"
                  value={formData.diff_other_text}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                />
              </FormField>
            </Grid>
          </Section>

          <Section title="Wyzwania i zainteresowania">
            <Grid>
              {[
                ['chal_competition','Duża konkurencja'],['chal_rising_costs','Rosnące koszty'],['chal_long_sales_cycle','Długi cykl sprzedaży'],['chal_customer_needs','Rosnące wymagania klientów'],['chal_energy_compliance','Zgodność z normami']
              ].map(([k,label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
              {[
                ['int_cost_reduction','Obniżenie rachunków'],['int_safety_comfort','Bezpieczeństwo i komfort'],['int_modern_sales_arg','Nowoczesny argument']
              ].map(([k,label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
            </Grid>
          </Section>

          <Section title="Partnerzy">
            <Grid>
              {['gc_company','inst_hvac_company','inst_electrical_company','arch_design_company','interior_design_company','wholesale_plumb_heat','wholesale_electrical'].map(k => (
                <FormField key={k} id={k} label={k}>
                  <input
                    type="text"
                    name={k}
                    value={formData[k]}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  />
                </FormField>
              ))}
            </Grid>
          </Section>

          <Section title="Model wdrożenia">
            <Grid>
              <FormField id="implementation_model" label="Model">
                <select
                  name="implementation_model"
                  value={formData.implementation_model}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="standard_all">standard_all</option>
                  <option value="optional_package">optional_package</option>
                  <option value="standard_premium">standard_premium</option>
                </select>
              </FormField>
            </Grid>
          </Section>

          <Section title="Wsparcie dla sprzedaży">
            <Grid>
              {[
                ['sup_marketing','Marketing'],['sup_show_apartment','Mieszkanie pokazowe'],['sup_sales_training','Szkolenia sprzedaży'],['sup_solution_packages','Pakiety rozwiązań'],['sup_full_coordination','Pełna koordynacja'],['sup_terms_distribution','Warunki przez dystrybucję']
              ].map(([k,label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
            </Grid>
          </Section>

          <Section title="Online">
            <Grid>
              <FormField id="www" label="WWW">
                <input type="text" name="www" value={formData.www} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="engo_team_director" label="Dyrektor w zespole ENGO">
                <input type="text" name="engo_team_director" value={formData.engo_team_director || ''} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="engo_team_contact" label="Kontakt w zespole ENGO">
                <input type="text" name="engo_team_contact" value={formData.engo_team_contact || ''} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
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

export default AddDeweloperModal;
