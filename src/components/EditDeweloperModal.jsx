// src/components/EditDeweloperModal.jsx
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
import UserSelect from './UserSelect';
import { isReadOnly, isBok, isAdminManager } from '../utils/roles';
import AutosaveIndicator from './AutosaveIndicator';
import { useDraftAutosave } from '../utils/useDraftAutosave';
import { draftsDiscard } from '../api/drafts';
import { lsDiscardDraft } from '../utils/autosaveStorage';

function EditDeweloperModal({ isOpen, developer, onClose, onDeveloperUpdated }) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(null);
  const { user } = useAuth();
  const contextKeyRef = useRef(developer?.id ? `developer_edit_${developer.id}` : 'developer_edit');
  useEffect(() => {
    if (developer?.id) contextKeyRef.current = `developer_edit_${developer.id}`;
    localStorage.setItem('draft_ctx_developer_edit', contextKeyRef.current);
  }, [developer?.id]);

  useEffect(() => {
    if (developer && isOpen) {
      setFormData({
        id: developer.id,
        market_id: developer.market_id ?? user?.singleMarketId ?? '',
        company_name: developer.company_name || '',
        client_code_erp: developer.client_code_erp || '',
        status: String(developer.status ?? '1'),
        data_veryfication: String(developer.data_veryfication ?? '0'),
        street: developer.street || '',
        city: developer.city || '',
        voivodeship: developer.voivodeship || '',
        country: developer.country || 'Polska',
        postal_code: developer.postal_code || '',
        nip: developer.nip || '',
        class_category: developer.class_category || '-',
  client_category: 'DEWELOPER',
  client_subcategory: 'DEWELOPER',
        fairs: developer.fairs || '',
  engo_team_director: developer.engo_team_director || '',
  engo_team_manager: developer.engo_team_manager || '',
  engo_team_contact: developer.engo_team_contact || '',
  // hydrate ids if backend provides them in the future
  engo_team_director_id: developer.engo_team_director_user_id || undefined,
  engo_team_manager_id: developer.engo_team_manager_user_id || undefined,
  engo_team_contact_id: developer.engo_team_user_id || undefined,
        number_of_sales_reps: developer.number_of_sales_reps || '',
        latitude: developer.latitude || '',
        longitude: developer.longitude || '',
        www: developer.www || '',
        facebook: developer.facebook || '',
        additional_info: developer.additional_info || '',

        seg_multi_family: Number(developer.seg_multi_family) || 0,
        seg_single_family: Number(developer.seg_single_family) || 0,
        seg_commercial: Number(developer.seg_commercial) || 0,
        seg_hotel_leisure: Number(developer.seg_hotel_leisure) || 0,

        char_mainstream: Number(developer.char_mainstream) || 0,
        char_premium: Number(developer.char_premium) || 0,
        char_luxury: Number(developer.char_luxury) || 0,

        scale_band: developer.scale_band || 'le_50',
        smart_home_offer: developer.smart_home_offer || 'standard',

        diff_location: Number(developer.diff_location) || 0,
        diff_arch_design: Number(developer.diff_arch_design) || 0,
        diff_materials_quality: Number(developer.diff_materials_quality) || 0,
        diff_eco_energy: Number(developer.diff_eco_energy) || 0,
        diff_price: Number(developer.diff_price) || 0,
        diff_other: Number(developer.diff_other) || 0,
        diff_other_text: developer.diff_other_text || '',

        chal_competition: Number(developer.chal_competition) || 0,
        chal_rising_costs: Number(developer.chal_rising_costs) || 0,
        chal_long_sales_cycle: Number(developer.chal_long_sales_cycle) || 0,
        chal_customer_needs: Number(developer.chal_customer_needs) || 0,
        chal_energy_compliance: Number(developer.chal_energy_compliance) || 0,

        int_cost_reduction: Number(developer.int_cost_reduction) || 0,
        int_safety_comfort: Number(developer.int_safety_comfort) || 0,
        int_modern_sales_arg: Number(developer.int_modern_sales_arg) || 0,

        gc_company: developer.gc_company || '',
        inst_hvac_company: developer.inst_hvac_company || '',
        inst_electrical_company: developer.inst_electrical_company || '',
        arch_design_company: developer.arch_design_company || '',
        interior_design_company: developer.interior_design_company || '',
        wholesale_plumb_heat: developer.wholesale_plumb_heat || '',
        wholesale_electrical: developer.wholesale_electrical || '',

        implementation_model: developer.implementation_model || 'standard_all',

        sup_marketing: Number(developer.sup_marketing) || 0,
        sup_show_apartment: Number(developer.sup_show_apartment) || 0,
        sup_sales_training: Number(developer.sup_sales_training) || 0,
        sup_solution_packages: Number(developer.sup_solution_packages) || 0,
        sup_full_coordination: Number(developer.sup_full_coordination) || 0,
        sup_terms_distribution: Number(developer.sup_terms_distribution) || 0,
      });
    }
  }, [developer, isOpen, user?.singleMarketId]);

  // If only market 1, ensure country is Poland if empty
  useEffect(() => {
    if (user?.singleMarketId === 1 && formData) {
      setFormData((p) => {
        if (!p) return p;
        const current = p.country;
        if (current && String(current).trim() !== '') return p;
        return { ...p, country: 'Poland' };
      });
    }
  }, [user?.singleMarketId, formData]);

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
    if (!formData) return;
    setIsSaving(true);
    setErrors({});

    if (Array.isArray(user?.marketIds) && user.marketIds.length > 1 && !formData.market_id) {
      setErrors({ market_id: 'Wybierz rynek' });
      setIsSaving(false);
      return;
    }

    if (!formData.company_name.trim()) {
      setErrors({ company_name: 'Nazwa jest wymagana' });
      setIsSaving(false);
      return;
    }

    const isSessionOk = await checkSessionBeforeSubmit();
    if (!isSessionOk) { setIsSaving(false); return; }

    try {
      const idPayload = { ...formData };
      if (formData.engo_team_manager_id) idPayload.engo_team_manager_user_id = Number(formData.engo_team_manager_id);
      if (formData.engo_team_contact_id) idPayload.engo_team_user_id = Number(formData.engo_team_contact_id);
      if (formData.engo_team_director_id) idPayload.engo_team_director_user_id = Number(formData.engo_team_director_id);

      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Developers/edit.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...idPayload, client_category: 'DEWELOPER', client_subcategory: 'DEWELOPER' }),
      });
      let data = {}; try { data = await res.json(); } catch { }
      if (!(res.ok && data?.success)) { alert(data?.message || 'Błąd zapisu dewelopera'); setIsSaving(false); return; }
  onDeveloperUpdated?.(formData.id);
  try { if (draftId) await draftsDiscard(draftId); } catch {}
  try { lsDiscardDraft({ entityType: 'developer', contextKey: contextKeyRef.current }); } catch {}
  localStorage.removeItem('draft_ctx_developer_edit');
  onClose?.();
    } catch (err) { console.error(err); alert(`Błąd: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  const wrapSubmit = usePreventDoubleSubmit();
  const safeSubmit = wrapSubmit(handleSubmit);

  if (!isOpen || !formData) return null;

  const isDirty = !!((formData.company_name||'').trim() || (formData.street||'').trim() || (formData.city||'').trim() || (formData.www||'').trim() || (formData.facebook||'').trim() || (formData.additional_info||'').trim());

  const { status, nextInMs, lastSavedAt, saveNow, draftId, initialRestored } = useDraftAutosave({
    entityType: 'developer',
    entityId: developer?.id,
    contextKey: contextKeyRef.current,
    values: formData,
    isDirty,
    enabled: isOpen,
  });

  useEffect(() => {
    if (initialRestored && isOpen) {
      setFormData((prev) => ({ ...prev, ...initialRestored }));
    }
  }, [initialRestored, isOpen]);

  return (
    <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'>
      <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
        <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
          <h2 className="text-lime-500 text-xl font-extrabold flex items-center gap-3">{t('developerModal.title') || 'Edytuj Dewelopera'} <AutosaveIndicator status={status} nextInMs={nextInMs} lastSavedAt={lastSavedAt} onSaveNow={saveNow} /></h2>
          <button className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={safeSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
          className="text-white flex flex-col gap-3 pl-8 pr-8"
        >
          {Array.isArray(user?.marketIds) && user.marketIds.length > 1 && (
            <Section title={t('addClientModal.market') || 'Rynek'}>
              <Grid>
                <FormField id="market_id" label={t('addClientModal.market') || 'Rynek'}>
                  <select
                    name="market_id"
                    value={formData.market_id}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  >
                    <option value="">{t('addClientModal.chooseMarket') || '— wybierz rynek —'}</option>
                    {user.marketIds.map((mid) => (
                      <option key={mid} value={mid}>{getMarketLabel(mid)}</option>
                    ))}
                  </select>
                  {errors.market_id && <div className="text-red-600 text-sm">{errors.market_id}</div>}
                </FormField>
              </Grid>
            </Section>
          )}

          {isAdminManager(user) && (<Section title={t('common.BOK')}>
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

              <FormField id="client_code_erp" label={t('addClientModal.client_code_erp')}>
                <input
                  type="text"
                  name="client_code_erp"
                  value={formData.client_code_erp}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="nip" label={t('addClientModal.nip')}>
                <input
                  type="text"
                  name="nip"
                  value={formData.nip}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>

              <FormField id="class_category" label={t('common.class')}>
                <select name="class_category" value={formData.class_category || '-'} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400">
                  <option value="-">{t('common.noClass')}</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </FormField>

              {/* Lock both to DEWELOPER */}
              <input type="hidden" name="client_category" value={formData.client_category || 'DEWELOPER'} />
              <input type="hidden" name="client_subcategory" value={formData.client_subcategory || 'DEWELOPER'} />
              <FormField id="client_category" label={t('addClientModal.clientCategory')}>
                <input type="text" name="client_category_readonly" value={formData.client_category || 'DEWELOPER'} readOnly className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-neutral-100 text-neutral-700" />
              </FormField>

              <FormField id="client_subcategory" label={t('fields.clientSubcategory')}>
                <input type="text" name="client_subcategory_readonly" value={formData.client_subcategory || 'DEWELOPER'} readOnly className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-neutral-100 text-neutral-700" />
              </FormField>

              <FormField id="street" label={t('addClientModal.street')}>
                <input type="text" name="street" value={formData.street} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>

              <FormField id="city" label={t('addClientModal.city')}>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>

              <FormField id="voivodeship" label={t('addClientModal.voivodeship')}>
                <input type="text" name="voivodeship" value={formData.voivodeship} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>

              <FormField id="country" label={t('addClientModal.country')}>
                <CountrySelect value={formData.country} onChange={handleChange} name="country" hideLabel={true} className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400" disabled={user?.singleMarketId === 1} />
              </FormField>

              <FormField id="postal_code" label={t('addClientModal.postalCode')}>
                <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
            </Grid>
          </Section>

          <Section title={t('addClientModal.location')}>
            <Grid className="mb-2">
              <FormField id="latitude" label={t('editClientModal.locationPicker.latitude')}>
                <input type="number" step="0.000001" name="latitude" value={formData.latitude} onChange={handleChange} {...numberInputGuards} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="longitude" label={t('editClientModal.locationPicker.longitude')}>
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

          <Section title={t('developer.sections.segmentsAndCharacter')}>
            <Grid>
              {[
                ['seg_multi_family', t('developer.fields.seg.multiFamily')],
                ['seg_single_family', t('developer.fields.seg.singleFamily')],
                ['seg_commercial', t('developer.fields.seg.commercial')],
                ['seg_hotel_leisure', t('developer.fields.seg.hotelLeisure')]
              ].map(([k, label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}

              {[
                ['char_mainstream', t('developer.fields.char.mainstream')],
                ['char_premium', t('developer.fields.char.premium')],
                ['char_luxury', t('developer.fields.char.luxury')]
              ].map(([k, label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}

              <FormField id="scale_band" label={t('developer.fields.scaleBand')}>
                <select name="scale_band" value={formData.scale_band} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400">
                  <option value="le_50">le_50</option>
                  <option value="51_200">51_200</option>
                  <option value="gt_200">gt_200</option>
                </select>
              </FormField>

              <FormField id="smart_home_offer" label={t('developer.fields.smartHomeOffer')}>
                <select name="smart_home_offer" value={formData.smart_home_offer} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400">
                  <option value="standard">standard</option>
                  <option value="optional_package">optional_package</option>
                  <option value="no_but_open">no_but_open</option>
                  <option value="no_not_considered">no_not_considered</option>
                </select>
              </FormField>
            </Grid>
          </Section>

          <Section title={t('developer.sections.differentiators')}>
            <Grid>
              {[
                ['diff_location', t('developer.fields.diff.location')],
                ['diff_arch_design', t('developer.fields.diff.archDesign')],
                ['diff_materials_quality', t('developer.fields.diff.materialsQuality')],
                ['diff_eco_energy', t('developer.fields.diff.ecoEnergy')],
                ['diff_price', t('developer.fields.diff.price')],
                ['diff_other', t('developer.fields.diff.other')]
              ].map(([k, label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
              <FormField id="diff_other_text" label={t('developer.fields.diff.otherText')}>
                <input type="text" name="diff_other_text" value={formData.diff_other_text} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white" />
              </FormField>
            </Grid>
          </Section>

          <Section title={t('developer.sections.challengesInterests')}>
            <Grid>
              {[
                ['chal_competition', t('developer.fields.chal.competition')],
                ['chal_rising_costs', t('developer.fields.chal.risingCosts')],
                ['chal_long_sales_cycle', t('developer.fields.chal.longSalesCycle')],
                ['chal_customer_needs', t('developer.fields.chal.customerNeeds')],
                ['chal_energy_compliance', t('developer.fields.chal.energyCompliance')]
              ].map(([k, label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
              {[
                ['int_cost_reduction', t('developer.fields.int.costReduction')],
                ['int_safety_comfort', t('developer.fields.int.safetyComfort')],
                ['int_modern_sales_arg', t('developer.fields.int.modernSalesArg')]
              ].map(([k, label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
            </Grid>
          </Section>

          <Section title={t('developer.sections.partners')}>
            <Grid>
              {['gc_company', 'inst_hvac_company', 'inst_electrical_company', 'arch_design_company', 'interior_design_company', 'wholesale_plumb_heat', 'wholesale_electrical'].map(k => (
                <FormField key={k} id={k} label={t(`developer.fields.partners.${{
                  gc_company: 'gc',
                  inst_hvac_company: 'hvac',
                  inst_electrical_company: 'electrical',
                  arch_design_company: 'archDesign',
                  interior_design_company: 'interiorDesign',
                  wholesale_plumb_heat: 'wholesalePlumbHeat',
                  wholesale_electrical: 'wholesaleElectrical'
                }[k]
                  }`)}>
                  <input type="text" name={k} value={formData[k]} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
                </FormField>
              ))}
            </Grid>
          </Section>

          <Section title={t('developer.sections.implementationModel')}>
            <Grid>
              <FormField id="implementation_model" label={t('developer.fields.implementationModel')}>
                <select name="implementation_model" value={formData.implementation_model} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400">
                  <option value="standard_all">standard_all</option>
                  <option value="optional_package">optional_package</option>
                  <option value="standard_premium">standard_premium</option>
                </select>
              </FormField>
            </Grid>
          </Section>

          <Section title={t('developer.sections.salesSupport')}>
            <Grid>
              {[
                ['sup_marketing', t('developer.fields.sup.marketing')],
                ['sup_show_apartment', t('developer.fields.sup.showApartment')],
                ['sup_sales_training', t('developer.fields.sup.salesTraining')],
                ['sup_solution_packages', t('developer.fields.sup.solutionPackages')],
                ['sup_full_coordination', t('developer.fields.sup.fullCoordination')],
                ['sup_terms_distribution', t('developer.fields.sup.termsDistribution')]
              ].map(([k, label]) => (
                <PillCheckbox key={k} label={label} checked={!!formData[k]} onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))} />
              ))}
            </Grid>
          </Section>

          <Section title={t('common.onlineInfo')}>
            <Grid>
              <FormField id="www" label="WWW">
                <input type="text" name="www" value={formData.www} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="engo_team_director" label={t('addClientModal.engoTeamDirector')}>
                <UserSelect
                  roleFilter="director"
                  activeOnly={true}
                  marketId={formData.market_id || user?.singleMarketId}
                  name="engo_team_director"
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                  value={formData.engo_team_director || ''}
                  onChange={(val) => setFormData((prev) => ({ ...prev, engo_team_director: val }))}
                  onChangeId={(id) => setFormData((prev) => ({ ...prev, engo_team_director_id: id }))}
                  placeholder={t('addClientModal.chooseMember')}
                  noMarketPlaceholder={t('addClientModal.chooseMarket')}
                  showNoMarketHint={false}
                />
              </FormField>
              <FormField id="engo_team_manager" label={t('addClientModal.engoTeamManager') || 'Manager ENGO'}>
                <UserSelect
                  role="manager"
                  activeOnly={true}
                  marketId={formData.market_id || user?.singleMarketId}
                  name="engo_team_manager"
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                  value={formData.engo_team_manager || ''}
                  onChange={(val) => setFormData((prev) => ({ ...prev, engo_team_manager: val }))}
                  onChangeId={(id) => setFormData((prev) => ({ ...prev, engo_team_manager_id: id }))}
                  placeholder={t('addClientModal.chooseMember')}
                  noMarketPlaceholder={t('addClientModal.chooseMarket')}
                  showNoMarketHint={false}
                />
              </FormField>
              <FormField id="engo_team_contact" label={t('addClientModal.engoTeamContact')}>
                <UserSelect
                  roleByMarket={{ 1: 'koordynator', 2: 'tsr', '1': 'koordynator', '2': 'tsr' }}
                  activeOnly={true}
                  marketId={formData.market_id || user?.singleMarketId}
                  name="engo_team_contact"
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                  value={formData.engo_team_contact || ''}
                  onChange={(val) => setFormData((prev) => ({ ...prev, engo_team_contact: val }))}
                  onChangeId={(id) => setFormData((prev) => ({ ...prev, engo_team_contact_id: id }))}
                  placeholder={t('addClientModal.chooseMember')}
                  noMarketPlaceholder={t('addClientModal.chooseMarket')}
                  showNoMarketHint={false}
                />
              </FormField>
              <FormField id="facebook" label="Facebook">
                <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400" />
              </FormField>
              <FormField id="additional_info" label={t('common.additionalInfo')}>
                <textarea name="additional_info" value={formData.additional_info} onChange={handleChange} className='w-full border border-neutral-300 rounded px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-neutral-400 text-neutral-950'></textarea>
              </FormField>
            </Grid>
          </Section>

          <div className='flex justify-end mt-5'>
            <button className='buttonGreen' type="submit" disabled={isSaving}>
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

export default EditDeweloperModal;
