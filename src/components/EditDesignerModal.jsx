// src/components/EditDesignerModal.jsx
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
import UserSelect from './UserSelect';
import { isReadOnly, isBok, isAdminManager } from '../utils/roles';
import Section from './common/Section';
import Grid from './common/Grid';
import Mapa from './common/Mapa';
import FormField from './common/FormField';
import PillCheckbox from './common/PillCheckbox';
import Rating5 from './common/Rating5';

function EditDesignerModal({ isOpen, designer, onClose, onDesignerUpdated }) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (designer && isOpen) {
      setFormData({
        id: designer.id,
        market_id: designer.market_id ?? user?.singleMarketId ?? '',
        company_name: designer.company_name || '',
        client_code_erp: designer.client_code_erp || '',
        status: designer.status != null ? Number(designer.status) : 1,
        data_veryfication: designer.data_veryfication != null ? Number(designer.data_veryfication) : 0,
        street: designer.street || '',
        city: designer.city || '',
        district: designer.district || '',
        voivodeship: designer.voivodeship || '',
        country: designer.country || 'Polska',
        postal_code: designer.postal_code || '',
        nip: designer.nip || '',
        class_category: designer.class_category || '-',
  client_category: 'PROJEKTANT',
  client_subcategory: 'PROJEKTANT',
  fairs: designer.fairs || '',
  // FE ignores legacy text labels; display will resolve from id
  engo_team_director: '',
  engo_team_manager: '',
  engo_team_contact: '',
  // Prefill ids from *_user_id
  engo_team_director_id: designer.engo_team_director_user_id || undefined,
  engo_team_manager_id: designer.engo_team_manager_user_id || undefined,
  engo_team_contact_id: designer.engo_team_user_id || undefined,
        number_of_sales_reps: designer.number_of_sales_reps || '',
        latitude: designer.latitude || '',
        longitude: designer.longitude || '',
        www: designer.www || '',
        facebook: designer.facebook || '',
        additional_info: designer.additional_info || '',
        automation_inclusion: designer.automation_inclusion || 'standard',
        spec_influence: Number(designer.spec_influence) || 0,
        design_tools: designer.design_tools || '',
        uses_bim: Number(designer.uses_bim) || 0,
        relations: designer.relations || '',
        crit_aesthetics: designer.crit_aesthetics != null ? Number(designer.crit_aesthetics) : null,
        crit_reliability: designer.crit_reliability != null ? Number(designer.crit_reliability) : null,
        crit_usability: designer.crit_usability != null ? Number(designer.crit_usability) : null,
        crit_integration: designer.crit_integration != null ? Number(designer.crit_integration) : null,
        crit_support: designer.crit_support != null ? Number(designer.crit_support) : null,
        crit_energy: designer.crit_energy != null ? Number(designer.crit_energy) : null,
        crit_price: designer.crit_price != null ? Number(designer.crit_price) : null,
        primary_objection: designer.primary_objection || '',
        objection_note: designer.objection_note || '',
        bt_premium_sf: Number(designer.bt_premium_sf) || 0,
        bt_office_ab: Number(designer.bt_office_ab) || 0,
        bt_hotel: Number(designer.bt_hotel) || 0,
        bt_public: Number(designer.bt_public) || 0,
        bt_apartment: Number(designer.bt_apartment) || 0,
        bt_other: Number(designer.bt_other) || 0,
        bt_other_text: designer.bt_other_text || '',
        scope_full_arch: Number(designer.scope_full_arch) || 0,
        scope_interiors: Number(designer.scope_interiors) || 0,
        scope_installations: Number(designer.scope_installations) || 0,
        stage_concept: Number(designer.stage_concept) || 0,
        stage_permit: Number(designer.stage_permit) || 0,
        stage_execution: Number(designer.stage_execution) || 0,
        stage_depends: Number(designer.stage_depends) || 0,
        collab_hvac: Number(designer.collab_hvac) || 0,
        collab_electrical: Number(designer.collab_electrical) || 0,
        collab_integrator: Number(designer.collab_integrator) || 0,
        collab_contractor: Number(designer.collab_contractor) || 0,
        pain_aesthetics: Number(designer.pain_aesthetics) || 0,
        pain_single_system: Number(designer.pain_single_system) || 0,
        pain_no_support: Number(designer.pain_no_support) || 0,
        pain_limited_knowledge: Number(designer.pain_limited_knowledge) || 0,
        pain_investor_resistance: Number(designer.pain_investor_resistance) || 0,
        pain_coordination: Number(designer.pain_coordination) || 0,
        pain_lack_materials: Number(designer.pain_lack_materials) || 0,
        pain_other: Number(designer.pain_other) || 0,
        pain_other_text: designer.pain_other_text || '',
        support_account_manager: Number(designer.support_account_manager) || 0,
        support_training: Number(designer.support_training) || 0,
        support_cad_bim: Number(designer.support_cad_bim) || 0,
        support_samples: Number(designer.support_samples) || 0,
        support_concept_support: Number(designer.support_concept_support) || 0,
        support_partner_terms: Number(designer.support_partner_terms) || 0,
      });
    }
  }, [designer, isOpen]);

  // If only market 1, ensure country is Poland when empty
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

    if (!formData.company_name.trim()) {
      setErrors({ company_name: 'Nazwa jest wymagana' });
      setIsSaving(false);
      return;
    }

    const isSessionOk = await checkSessionBeforeSubmit();
    if (!isSessionOk) { setIsSaving(false); return; }

    try {
  const idPayload = { ...formData };
  // Drop legacy string fields; send only *_user_id
  delete idPayload.engo_team_director;
  delete idPayload.engo_team_manager;
  delete idPayload.engo_team_contact;
  if (formData.engo_team_manager_id) idPayload.engo_team_manager_user_id = Number(formData.engo_team_manager_id);
  if (formData.engo_team_contact_id) idPayload.engo_team_user_id = Number(formData.engo_team_contact_id);
  if (formData.engo_team_director_id) idPayload.engo_team_director_user_id = Number(formData.engo_team_director_id);

  const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Designers/edit.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...idPayload, client_category: 'PROJEKTANT', client_subcategory: 'PROJEKTANT' }),
      });
      const text = await res.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch { }
      if (!(res.ok && data?.success)) { alert(data?.message || 'Błąd zapisu projektanta'); setIsSaving(false); return; }
      onDesignerUpdated?.(formData.id);
      onClose?.();
    } catch (err) { console.error(err); alert(`Błąd: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  const wrapSubmit = usePreventDoubleSubmit();
  const safeSubmit = wrapSubmit(handleSubmit);

  if (!isOpen || !formData) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'>
      <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
        <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
          <h2 className="text-lime-500 text-xl font-extrabold">{t('designerModal.title') || 'Edytuj Projektanta'}</h2>
          <button className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={safeSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
          className="text-white flex flex-col gap-3 pl-8 pr-8"
        >
          {/* Market selection (only for multi-market users) */}
          {Array.isArray(user?.marketIds) && user.marketIds.length > 1 && (
            <Section title={t('addClientModal.market') || 'Rynek'}>
              <Grid className="mb-4">
                <FormField id="market_id" label={t('addClientModal.market') || 'Rynek'} error={errors.market_id}>
                  <select
                    name="market_id"
                    className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                    value={formData.market_id}
                    onChange={handleChange}
                  >
                    <option value="">{t('addClientModal.chooseMarket') || '— wybierz rynek —'}</option>
                    {user.marketIds.map((mid) => (
                      <option key={mid} value={mid}>{getMarketLabel(mid)}</option>
                    ))}
                  </select>
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
                  onChange={(e) => setFormData((p) => ({ ...p, status: Number(e.target.value) }))}
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
                  onChange={(e) => setFormData((p) => ({ ...p, data_veryfication: Number(e.target.value) }))}
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
            <Grid className="mb-7">
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

              <FormField id="street" label={t('addClientModal.street')}>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
              <FormField id="city" label={t('addClientModal.city')}>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
              <FormField id="district" label={t('addClientModal.district')}>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
              <FormField id="voivodeship" label={t('addClientModal.voivodeship')}>
                <input
                  type="text"
                  name="voivodeship"
                  value={formData.voivodeship}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </FormField>
              <FormField id="country" label={t('addClientModal.country')}>
                <CountrySelect
                  value={formData.country}
                  onChange={handleChange}
                  name="country"
                  hideLabel={true}
                  className='w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400'
                  disabled={user?.singleMarketId === 1}
                />
              </FormField>
              <FormField id="postal_code" label={t('addClientModal.postalCode')}>
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
            <Grid className="mb-4">
              <FormField id="latitude" label={t('editClientModal.locationPicker.latitude')}>
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
              <FormField id="longitude" label={t('editClientModal.locationPicker.longitude')}>
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

          {/* Dodatkowe */}
          <Section title={t('common.additionalInfo')}>
            <Grid>
              <FormField id="engo_team_director" label={t('addClientModal.engoTeamDirector')}>
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
                  valueId={formData.engo_team_manager_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, engo_team_manager: val }))}
                  onChangeId={(id) => setFormData((prev) => ({ ...prev, engo_team_manager_id: id }))}
                  placeholder={t('addClientModal.chooseMember')}
                  noMarketPlaceholder={t('addClientModal.chooseMarket')}
                  showNoMarketHint={false}
                />
              </FormField>
              <FormField id="engo_team_contact" label={t('fields.engoTeamContact')}>
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
            </Grid>
          </Section>

          <Section title={t('designer.sections.buildingTypes')} className="text-gray-600">
            <Grid>
              {[
                ['bt_premium_sf', t('designer.fields.bt.premiumSF')],
                ['bt_office_ab', t('designer.fields.bt.officeAB')],
                ['bt_hotel', t('designer.fields.bt.hotel')],
                ['bt_public', t('designer.fields.bt.public')],
                ['bt_apartment', t('designer.fields.bt.apartment')],
                ['bt_other', t('designer.fields.bt.other')]
              ].map(([k, label]) => (
                <PillCheckbox
                  key={k}
                  label={label}
                  checked={!!formData[k]}
                  onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))}
                />
              ))}
              <FormField id="bt_other_text" label={t('designer.fields.bt.otherText')}>
                <input
                  type="text"
                  name="bt_other_text"
                  value={formData.bt_other_text}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                />
              </FormField>
            </Grid>
          </Section>

          <Section title={t('designer.sections.scopesStages')}>
            <Grid>
              {[
                ['scope_full_arch', t('designer.fields.scope.fullArch')],
                ['scope_interiors', t('designer.fields.scope.interiors')],
                ['scope_installations', t('designer.fields.scope.installations')],
              ].map(([k, label]) => (
                <PillCheckbox
                  key={k}
                  label={label}
                  checked={!!formData[k]}
                  onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))}
                />
              ))}

            </Grid>
          </Section>

          <Section title={t('designer.sections.scopesStages')}>
            <Grid>
              <FormField id="automation_inclusion" label={t('designerModal.automationInclusion')}>
                <select
                  name="automation_inclusion"
                  value={formData.automation_inclusion}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="standard">{t('designer.automationInclusion.standard')}</option>
                  <option value="na życzenie inwestora">{t('designer.automationInclusion.on_request')}</option>
                  <option value="rzadko">{t('designer.automationInclusion.rarely')}</option>
                </select>
              </FormField>

              <PillCheckbox
                label={t('designerModal.specInfluence')}
                checked={!!formData.spec_influence}
                onChange={(checked) => setFormData((p) => ({ ...p, spec_influence: checked ? 1 : 0 }))}
              />
            </Grid>
          </Section>

          <Section title={t('designer.sections.scopesStages')}>
            <Grid>
              {[
                ['stage_concept', t('designer.fields.stage.concept')],
                ['stage_permit', t('designer.fields.stage.permit')],
                ['stage_execution', t('designer.fields.stage.execution')],
                ['stage_depends', t('designer.fields.stage.depends')]
              ].map(([k, label]) => (
                <PillCheckbox
                  key={k}
                  label={label}
                  checked={!!formData[k]}
                  onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))}
                />
              ))}
            </Grid>
          </Section>

          <Section title={t('designerModal.designTools')}>
            <Grid>
              <FormField id="design_tools" label={t('designerModal.designTools')}>
                <input
                  type="text"
                  name="design_tools"
                  value={formData.design_tools}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                />
              </FormField>

              <PillCheckbox
                label={t('designerModal.usesBim')}
                checked={!!formData.uses_bim}
                onChange={(checked) => setFormData((p) => ({ ...p, uses_bim: checked ? 1 : 0 }))}
                className='mt-4 mb-4'
              />

            </Grid>
          </Section>

          <Section title={t('designer.sections.collabsPains')}>
            <Grid>
              {[
                ['collab_hvac', t('designer.fields.collab.hvac')],
                ['collab_electrical', t('designer.fields.collab.electrical')],
                ['collab_integrator', t('designer.fields.collab.integrator')],
                ['collab_contractor', t('designer.fields.collab.contractor')]
              ].map(([k, label]) => (
                <PillCheckbox
                  key={k}
                  label={label}
                  checked={!!formData[k]}
                  onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))}
                />
              ))}
            </Grid>
          </Section>

          <Section title={t('designer.sections.criteria15')}>
            <Grid>
              {[
                ['crit_aesthetics', t('designer.fields.criteria.crit_aesthetics')],
                ['crit_reliability', t('designer.fields.criteria.crit_reliability')],
                ['crit_usability', t('designer.fields.criteria.crit_usability')],
                ['crit_integration', t('designer.fields.criteria.crit_integration')],
                ['crit_support', t('designer.fields.criteria.crit_support')],
                ['crit_energy', t('designer.fields.criteria.crit_energy')],
                ['crit_price', t('designer.fields.criteria.crit_price')],
              ].map(([k, label]) => (
                <FormField key={k} id={k} label={label}>
                  <Rating5
                    value={formData[k]}
                    onChange={(val) => setFormData((p) => ({ ...p, [k]: val }))}
                  />
                </FormField>
              ))}
            </Grid>
          </Section>

          <Section title={t('designer.sections.collabsPains')}>
            <Grid>
              {[
                ['pain_aesthetics', t('designer.fields.pain.aesthetics')],
                ['pain_single_system', t('designer.fields.pain.singleSystem')],
                ['pain_no_support', t('designer.fields.pain.noSupport')],
                ['pain_limited_knowledge', t('designer.fields.pain.limitedKnowledge')],
                ['pain_investor_resistance', t('designer.fields.pain.investorResistance')],
                ['pain_coordination', t('designer.fields.pain.coordination')],
                ['pain_lack_materials', t('designer.fields.pain.lackMaterials')]
              ].map(([k, label]) => (
                <PillCheckbox
                  key={k}
                  label={label}
                  checked={!!formData[k]}
                  onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))}
                />
              ))}
              <FormField id="pain_other_text" label={t('designer.fields.pain.otherText')}>
                <input
                  type="text"
                  name="pain_other_text"
                  value={formData.pain_other_text}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                />
              </FormField>
            </Grid>
          </Section>

          <Section title={t('designer.sections.support') || 'Support'}>
            <Grid>
              {[
                ['support_account_manager', t('designerSupport.accountManager')],
                ['support_training', t('designerSupport.training')],
                ['support_cad_bim', t('designerSupport.cadBim')],
                ['support_samples', t('designerSupport.samples')],
                ['support_concept_support', t('designerSupport.conceptSupport')],
                ['support_partner_terms', t('designerSupport.partnerTerms')]
              ].map(([k, label]) => (
                <PillCheckbox
                  key={k}
                  label={label}
                  checked={!!formData[k]}
                  onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))}
                />
              ))}
            </Grid>
          </Section>

          <Section title={t('common.onlineInfo')}>
            <Grid>
              <FormField id="www" label={t('addClientModal.www')}>
                <input
                  type="text"
                  name="www"
                  value={formData.www || ''}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                />
              </FormField>

              {/* Lock both to PROJEKTANT */}
              <input type="hidden" name="client_category" value={formData.client_category || 'PROJEKTANT'} />
              <input type="hidden" name="client_subcategory" value={formData.client_subcategory || 'PROJEKTANT'} />
              <FormField id="client_category" label={t('fields.clientCategory')}>
                <input
                  type="text"
                  name="client_category_readonly"
                  value={formData.client_category || 'PROJEKTANT'}
                  readOnly
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-neutral-100 text-neutral-700"
                />
              </FormField>

              <FormField id="client_subcategory" label={t('fields.clientSubcategory')}>
                <input
                  type="text"
                  name="client_subcategory_readonly"
                  value={formData.client_subcategory || 'PROJEKTANT'}
                  readOnly
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-neutral-100 text-neutral-700"
                />
              </FormField>

              <FormField id="fairs" label={t('installerModal.fairs')}>
                <input
                  type="text"
                  name="fairs"
                  value={formData.fairs}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                />
              </FormField>

              <FormField id="number_of_sales_reps" label={t('fields.numberOfSalesReps')}>
                <input
                  type="text"
                  name="number_of_sales_reps"
                  value={formData.number_of_sales_reps}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                />
              </FormField>

              <FormField id="relations" label={t('designerModal.relations')}>
                <input
                  type="text"
                  name="relations"
                  value={formData.relations}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                />
              </FormField>

              <FormField id="facebook" label={t('addClientModal.facebook')}>
                <input
                  type="text"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                />
              </FormField>

              <FormField id="additional_info" label={t('fields.additionalInfo')}>
                <textarea
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleChange}
                  className='w-full border border-neutral-300 rounded px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-neutral-400 text-neutral-950'
                />
              </FormField>
            </Grid>
          </Section>

          <Section title={t('designer.sections.objections')}>
            <Grid>
              <FormField id="primary_objection" label={t('designer.fields.objections.primary')}>
                <select
                  name="primary_objection"
                  value={formData.primary_objection || ''}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="">—</option>
                  <option value="trusted_brand">{t('designer.fields.objections.options.trusted_brand')}</option>
                  <option value="too_technical">{t('designer.fields.objections.options.too_technical')}</option>
                  <option value="clients_price">{t('designer.fields.objections.options.clients_price')}</option>
                  <option value="none">{t('designer.fields.objections.options.none')}</option>
                </select>
              </FormField>
              <FormField id="objection_note" label={t('designer.fields.objections.note')}>
                <input
                  type="text"
                  name="objection_note"
                  value={formData.objection_note}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                />
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

export default EditDesignerModal;
