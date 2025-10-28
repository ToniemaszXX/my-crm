// src/components/AddInstallerModal.jsx
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
import installerSchema from '../validation/installerSchema';
import UserSelect from './UserSelect';
import { isReadOnly, isBok, isAdminManager } from '../utils/roles';

function AddInstallerModal({ isOpen, onClose, onInstallerAdded }) {
    const { t } = useTranslation();

    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const { user } = useAuth();
    const [selectedDistributors, setSelectedDistributors] = useState([]);
    const [distributorOptions, setDistributorOptions] = useState([]);

    // Factory for a fresh, empty form
    const makeInitialForm = () => ({
        market_id: '',
        company_name: '',
        client_code_erp: '',
        status: 1,
        data_veryfication: 0,
        sms_consent: 0,
        marketing_consent: 0,
        source: '',
        street: '',
        city: '',
        voivodeship: '',
        country: 'Poland',
        postal_code: '',
        nip: '',
        client_category: 'INSTALATOR',
        class_category: '-',
        client_subcategory: '',
        fairs: '',
        engo_team_director: '',
        engo_team_manager: '',
        engo_team_contact: '',
        number_of_sales_reps: '',
        latitude: '',
        longitude: '',
        www: '',
        facebook: '',
        additional_info: '',
        install_heating: 0,
        install_AC: 0,
        install_ventilation: 0,
        install_sh: 0,
        koi_flats: 0,
        koi_houses: 0,
        koi_OUP: 0,
        koi_hotels: 0,
        koi_comercial: 0,
        koi_others: '',
        numbers_of_subcontractors: '',
        has_electrician: 0,
        work_with_needs: 0,
        approved_by_distributor: 0,
        problems_arrears: 0,
        problem_time: 0,
        problem_clients_with_inteligent_system: 0,
        problem_expensive: 0,
        problem_low_margin: 0,
        problem_complicated_installation: 0,
        problem_complicated_configuration: 0,
        problem_app: 0,
        problem_support: 0,
        problem_complaint: 0,
        problem_training: 0,
        problem_integration: 0,
        problem_marketing_stuff: 0,
        problem_competition: '',
        problem_others: '',
    });

    const [formData, setFormData] = useState(() => makeInitialForm());

    useEffect(() => {
        if (user?.singleMarketId) {
            setFormData((p) => ({ ...p, market_id: user.singleMarketId }));
        }
    }, [user?.singleMarketId]);

      // If only market 1, default country to Poland (don't overwrite if already set)
      useEffect(() => {
          if (user?.singleMarketId === 1) {
              setFormData((p) => {
                  const current = p?.country;
                  if (current && String(current).trim() !== '') return p;
                  return { ...p, country: 'Poland' };
              });
          }
      }, [user?.singleMarketId]);

    // Fetch distributors list (same market) when market id is known or changes
    useEffect(() => {
        const marketId = formData.market_id || user?.singleMarketId;
        if (!marketId) { setDistributorOptions([]); return; }
        let isCancelled = false;
        (async () => {
            try {
                const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/list.php`);
                const data = await res.json();
                if (!res.ok || !data?.success) throw new Error('List fetch failed');
                const opts = (data.clients || []).filter(c =>
                    c.market_id === marketId && (c.client_subcategory === 'DYSTRYBUTOR CENTRALA' || c.client_subcategory === 'DYSTRYBUTOR ODDZIAŁ')
                );
                if (!isCancelled) setDistributorOptions(opts);
            } catch (e) {
                if (!isCancelled) setDistributorOptions([]);
            }
        })();
        return () => { isCancelled = true; };
    }, [formData.market_id, user?.singleMarketId]);

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
        setIsSaving(true);
        setErrors({});

        // For multi-market users, require market selection on FE
        if (Array.isArray(user?.marketIds) && user.marketIds.length > 1 && !formData.market_id) {
            setErrors({ market_id: t('addClientModal.chooseMarket') });
            setIsSaving(false);
            return;
        }

        // Always enforce category for installers
        if (formData.client_category !== 'INSTALATOR') {
            setFormData((p) => ({ ...p, client_category: 'INSTALATOR' }));
        }

        // Zod validation aligned with BE
    const parse = installerSchema.safeParse({ ...formData, client_category: 'INSTALATOR', distributor_ids: selectedDistributors });
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
            const idPayload = { ...formData };
            // FE sends only *_user_id for ENGO fields
            delete idPayload.engo_team_director;
            delete idPayload.engo_team_manager;
            delete idPayload.engo_team_contact;
            if (formData.engo_team_manager_id) idPayload.engo_team_manager_user_id = Number(formData.engo_team_manager_id);
            if (formData.engo_team_contact_id) idPayload.engo_team_user_id = Number(formData.engo_team_contact_id);
            if (formData.engo_team_director_id) idPayload.engo_team_director_user_id = Number(formData.engo_team_director_id);

            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Installers/add.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...idPayload, client_category: 'INSTALATOR', distributor_ids: selectedDistributors }),
            });
            let data = {};
            try { data = await res.json(); } catch (_) { }
            if (!(res.ok && data?.success)) {
                alert(data?.message || t('addClientModal.error'));
                setIsSaving(false);
                return;
            }
            onInstallerAdded?.(data.id);
            alert(t('addClientModal.success'));
            // reset the form so it’s clean next time
            setFormData(makeInitialForm());
            setSelectedDistributors([]);
            onClose?.();
        } catch (err) {
            console.error(err);
            alert(`${t('errors.saveError')}: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const wrapSubmit = usePreventDoubleSubmit();
    const safeSubmit = wrapSubmit(handleSubmit);

    const handleCancel = () => {
        setFormData(makeInitialForm());
        setErrors({});
        onClose?.();
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'>
            <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
                <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
                    <h2 className="text-lime-500 text-xl font-extrabold">{t('addInstallerModal.title')}</h2>
                    <button className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none" onClick={handleCancel} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                <form
                    onSubmit={safeSubmit}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
                    className="text-white flex flex-col gap-3 pl-8 pr-8"
                >
                    {Array.isArray(user?.marketIds) && user.marketIds.length > 1 && (
                        <Section title={t('addClientModal.market')}>
                            <Grid>
                                <FormField id="market_id" label={t('addClientModal.market')}>
                                    <select
                                        name="market_id"
                                        value={formData.market_id}
                                        onChange={handleChange}
                                        className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                                    >
                                        <option value="">{t('addClientModal.chooseMarket')}</option>
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
                            <FormField id="client_psmobile" label={t('addClientModal.client_psmobile')}>
                                <input
                                    type="text"
                                    name="client_psmobile"
                                    value={formData.client_psmobile}
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

                            
                            <FormField id="source" label={t('fields.source')}>
                                <input
                                    type="text"
                                    name="source"
                                    value={formData.source}
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

                            <FormField id="sms_consent" label={t('fields.smsConsent')}>
                                <PillCheckbox
                                    label={t('fields.smsConsent')}
                                    checked={!!formData.sms_consent}
                                    onChange={(checked) => setFormData((p) => ({ ...p, sms_consent: checked ? 1 : 0 }))}
                                />
                            </FormField>
                            <FormField id="marketing_consent" label={t('fields.marketingConsent')}>
                                <PillCheckbox
                                    label={t('fields.marketingConsent')}
                                    checked={!!formData.marketing_consent}
                                    onChange={(checked) => setFormData((p) => ({ ...p, marketing_consent: checked ? 1 : 0 }))}
                                />
                            </FormField>


                        </Grid>
                    </Section>

                    <Section title={t('addClientModal.location')}>
                        <Grid className="mb-2">

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
                                    className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
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

                            <FormField id="latitude" label={t('addClientModal.latitude')}>
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
                            <FormField id="longitude" label={t('addClientModal.longitude')}>
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

                    <Section title={t('installerModal.categoryAndFairs')}>
                        <Grid>
                            {/* Lock category to INSTALATOR and hide input */}
                            <input type="hidden" name="client_category" value={formData.client_category || 'INSTALATOR'} />
                            <FormField id="client_category" label={t('fields.clientCategory')}>
                                <input
                                    type="text"
                                    name="client_category_readonly"
                                    value={formData.client_category || 'INSTALATOR'}
                                    readOnly
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-neutral-100 text-neutral-700"
                                />
                            </FormField>
                            <FormField id="client_subcategory" label={t('fields.clientSubcategory')}>
                                <select
                                    name="client_subcategory"
                                    value={formData.client_subcategory}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                >
                                    <option value="">{t('addClientModal.selectCategory')}</option>
                                    <option value="INSTALATOR FIRMA">{t('addClientModal.categories.INSTALATOR_FIRMA')}</option>
                                    <option value="INSTALATOR ENGO PLUS">{t('addClientModal.categories.ENGO_PLUS')}</option>
                                </select>
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

                            <FormField id="engo_team_director" label={t('addClientModal.engoTeamDirector')}>
                                <UserSelect
                                    roleFilter="dyrektor"
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
                        </Grid>
                    </Section>

                    <Section title={t('installer.sections.scope')}>
                        <Grid>
                            {[
                                ['install_heating', t('installer.fields.scope.heating')],
                                ['install_AC', t('installer.fields.scope.ac')],
                                ['install_ventilation', t('installer.fields.scope.ventilation')],
                                ['install_sh', t('installer.fields.scope.smartHome')],
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

                    <Section title={t('installer.sections.koi')}>
                        <Grid>
                            {[
                                ['koi_flats', t('installer.fields.koi.flats')],
                                ['koi_houses', t('installer.fields.koi.houses')],
                                ['koi_OUP', t('installer.fields.koi.OUP')],
                                ['koi_hotels', t('installer.fields.koi.hotels')],
                                ['koi_comercial', t('installer.fields.koi.commercial')],
                            ].map(([k, label]) => (
                                <PillCheckbox
                                    key={k}
                                    label={label}
                                    checked={!!formData[k]}
                                    onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))}
                                />
                            ))}
                            <FormField id="koi_others" label={t('installer.fields.koi.other')}>
                                <input
                                    type="text"
                                    name="koi_others"
                                    value={formData.koi_others}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>
                        </Grid>
                    </Section>

                    <Section title={t('installer.sections.subcontractors')}>
                        <Grid>
                            <FormField id="numbers_of_subcontractors" label={t('installer.fields.subcontractors.count')}>
                                <input
                                    type="number"
                                    name="numbers_of_subcontractors"
                                    value={formData.numbers_of_subcontractors}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>
                            {[
                                ['has_electrician', t('installer.fields.subcontractors.hasElectrician')],
                                ['work_with_needs', t('installer.fields.subcontractors.workWithNeeds')],
                                ['approved_by_distributor', t('installer.fields.subcontractors.approvedByDistributor')],
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

                    <Section title={t('installer.sections.problems')}>
                        <Grid>
                            {[
                                ['problems_arrears', t('installer.fields.problems.arrears')],
                                ['problem_time', t('installer.fields.problems.time')],
                                ['problem_clients_with_inteligent_system', t('installer.fields.problems.smartClients')],
                                ['problem_expensive', t('installer.fields.problems.expensive')],
                                ['problem_low_margin', t('installer.fields.problems.lowMargin')],
                                ['problem_complicated_installation', t('installer.fields.problems.complicatedInstallation')],
                                ['problem_complicated_configuration', t('installer.fields.problems.complicatedConfiguration')],
                                ['problem_app', t('installer.fields.problems.app')],
                                ['problem_support', t('installer.fields.problems.support')],
                                ['problem_complaint', t('installer.fields.problems.complaint')],
                                ['problem_training', t('installer.fields.problems.training')],
                                ['problem_integration', t('installer.fields.problems.integration')],
                                ['problem_marketing_stuff', t('installer.fields.problems.marketing')],
                            ].map(([k, label]) => (
                                <PillCheckbox
                                    key={k}
                                    label={label}
                                    checked={!!formData[k]}
                                    onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))}
                                />
                            ))}
                            <FormField id="problem_competition" label={t('installer.fields.problems.competition')}>
                                <input
                                    type="number"
                                    name="problem_competition"
                                    value={formData.problem_competition}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>
                            <FormField id="problem_others" label={t('installer.fields.problems.other')}>
                                <input
                                    type="text"
                                    name="problem_others"
                                    value={formData.problem_others}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>
                        </Grid>
                    </Section>

                    <Section title={t('common.onlineInfo')}>
                        <Grid>
                            <FormField id="www" label={t('addClientModal.www')}>
                                <input
                                    type="text"
                                    name="www"
                                    value={formData.www}
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

                    <div className='flex justify-end mt-5'>
                        <button className='buttonGreen' type="submit" disabled={isSaving}>
                            {isSaving ? t('addClientModal.saving') : t('addClientModal.save')}
                        </button>
                        <button className='buttonRed' type="button" onClick={handleCancel} style={{ marginLeft: '10px' }}>
                            {t('addClientModal.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddInstallerModal;
