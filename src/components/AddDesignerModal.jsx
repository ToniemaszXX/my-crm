// src/components/AddDesignerModal.jsx
import { useEffect, useState } from 'react';
import LocationPicker from './LocationPicker';
import CountrySelect from './CountrySelect';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { usePreventDoubleSubmit } from '../utils/preventDoubleSubmit';
import Section from './common/Section';
import Grid from './common/Grid';
import Mapa from './common/Mapa';
import FormField from './common/FormField';
import PillCheckbox from './common/PillCheckbox';
import Rating5 from './common/Rating5';
import designerSchema from '../validation/designerSchema';
import { getMarketLabel } from '../utils/markets';
import { useAuth } from '../context/AuthContext';

function AddDesignerModal({ isOpen, onClose, onDesignerAdded }) {
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const { user } = useAuth();

    // Factory for a fresh, empty form
    const makeInitialForm = () => ({
    market_id: '',
        company_name: '', client_code_erp: '', status: 1, data_veryfication: 0,
        street: '', city: '', district: '', voivodeship: '', country: 'Polska', postal_code: '', nip: '',
    client_category: '', client_subcategory: '', fairs: '', engo_team_director: '', engo_team_contact: '', number_of_sales_reps: '',
        latitude: '', longitude: '', www: '', facebook: '', additional_info: '',
        automation_inclusion: 'standard', spec_influence: 0, design_tools: '', uses_bim: 0, relations: '',
        crit_aesthetics: null, crit_reliability: null, crit_usability: null, crit_integration: null, crit_support: null, crit_energy: null, crit_price: null,
        primary_objection: '', objection_note: '',
        bt_premium_sf: 0, bt_office_ab: 0, bt_hotel: 0, bt_public: 0, bt_apartment: 0, bt_other: 0, bt_other_text: '',
        scope_full_arch: 0, scope_interiors: 0, scope_installations: 0,
        stage_concept: 0, stage_permit: 0, stage_execution: 0, stage_depends: 0,
        collab_hvac: 0, collab_electrical: 0, collab_integrator: 0, collab_contractor: 0,
        pain_aesthetics: 0, pain_single_system: 0, pain_no_support: 0, pain_limited_knowledge: 0, pain_investor_resistance: 0, pain_coordination: 0, pain_lack_materials: 0, pain_other: 0, pain_other_text: '',
        support_account_manager: 0, support_training: 0, support_cad_bim: 0, support_samples: 0, support_concept_support: 0, support_partner_terms: 0,
    });

    const [formData, setFormData] = useState(() => makeInitialForm());

    useEffect(() => {
        if (user?.singleMarketId) {
            setFormData((p) => ({ ...p, market_id: user.singleMarketId }));
        }
    }, [user?.singleMarketId]);

    // For multi-market users, preselect the first market if none chosen yet
    useEffect(() => {
        if (Array.isArray(user?.marketIds) && user.marketIds.length > 1 && !formData.market_id) {
            setFormData((p) => ({ ...p, market_id: user.marketIds[0] }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.marketIds]);

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
        console.log('[AddDesignerModal] Submit start', { formDataSnapshot: formData, user });
        setIsSaving(true);
        setErrors({});

        // For multi-market users, require market selection on FE
        if (Array.isArray(user?.marketIds) && user.marketIds.length > 1 && !formData.market_id) {
            console.warn('[AddDesignerModal] market_id missing for multi-market user');
            setErrors({ market_id: 'Wybierz rynek' });
            setIsSaving(false);
            return;
        }

        // Zod validation aligned with BE
        const parse = designerSchema.safeParse(formData);
        if (!parse.success) {
            console.warn('[AddDesignerModal] Zod validation failed', parse.error.issues);
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
        if (!isSessionOk) {
            console.warn('[AddDesignerModal] Session invalid before submit');
            setIsSaving(false);
            return;
        }

        try {
            const url = `${import.meta.env.VITE_API_URL}/Designers/add.php`;
            const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) };
            console.log('[AddDesignerModal] POST', { url, options });

            const res = await fetchWithAuth(url, options);
            const status = res.status;
            const ok = res.ok;
            let raw = '';
            try { raw = await res.text(); } catch (e) { console.warn('[AddDesignerModal] Failed reading response text', e); }
            let data = null;
            try { data = raw ? JSON.parse(raw) : null; } catch (e) { console.warn('[AddDesignerModal] Response JSON parse failed', e, { raw }); }
            console.log('[AddDesignerModal] Response', { status, ok, data, rawSample: raw?.slice(0, 500) });

            if (!(ok && data?.success)) {
                console.warn('[AddDesignerModal] Backend reported failure', { status, data });
                alert(data?.message || t('error'));
                setIsSaving(false);
                return;
            }
            onDesignerAdded?.(data.id);
            alert(t('success'));
            // Reset the form so it’s clean next time
            setFormData(makeInitialForm());
            onClose?.();
        } catch (err) {
            console.error('[AddDesignerModal] Submit error', err);
            alert(`Błąd zapisu: ${err.message}`);
        } finally {
            console.log('[AddDesignerModal] Submit end');
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(makeInitialForm());
        setErrors({});
        onClose?.();
    };

    const wrapSubmit = usePreventDoubleSubmit();
    const safeSubmit = wrapSubmit(handleSubmit);

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-[99]'>
            <div className='bg-neutral-100 pb-8 rounded-lg w-[1100px] max-h-[90vh] overflow-y-auto'>
                <div className="bg-neutral-100 flex justify-between items-center sticky top-0 z-50 p-4 border-b border-neutral-300">
                    <h2 className="text-lime-500 text-xl font-extrabold">Dodaj Projektanta</h2>
                    <button className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none" onClick={handleCancel} aria-label="Close modal">
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

                            <FormField id="district" label="Powiat">
                                <input
                                    type="text"
                                    name="district"
                                    value={formData.district}
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

                    <Section title="W jakich typach obiektów się specjalizuje" className="text-gray-600">
                        <Grid>
                            {[
                                ['bt_premium_sf', 'Domy jednorodzinne premium / nowoczesne rezydencje'], ['bt_office_ab', 'Budynki biurowe kl. A/B+'], ['bt_hotel', 'Hotele i obiekty noclegowe'], ['bt_public', 'Obiekty użyteczności publicznej'], ['bt_apartment', 'Apartamentowce i inwestycje deweloperskie'], ['bt_other', 'Inne']
                            ].map(([k, label]) => (
                                <PillCheckbox
                                    key={k}
                                    label={label}
                                    checked={!!formData[k]}
                                    onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))}
                                />
                            ))}
                            <FormField id="bt_other_text" label="Inne — doprecyzowanie">
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

                    <Section title="Zakres usług projektowych">
                        <Grid>
                            {[
                                ['scope_full_arch', 'Kompleksowe projekty architektoniczne'], ['scope_interiors', 'Projekty i aranżacje wnętrz'], ['scope_installations', 'Instalacje wod-kan ,elektryczne, ogrzewania, HVAC'],
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

                    <Section title="Etap kiedy uwzględniają automatyke i Smart Home w projektach">
                        <Grid>
                <FormField id="automation_inclusion" label="W jakim Stopniu uwzględnia automatyke i Smart Home w projektach?">
                                <select
                                    name="automation_inclusion"
                                    value={formData.automation_inclusion}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                                >
                    <option value="standard">Standard</option>
                    <option value="on_request">Na życzenie inwestora</option>
                    <option value="rarely">Rzadko</option>
                                </select>
                            </FormField>

                            <PillCheckbox
                                label="Wpływ na wybór specyfikacji"
                                checked={!!formData.spec_influence}
                                onChange={(checked) => setFormData((p) => ({ ...p, spec_influence: checked ? 1 : 0 }))}
                            />
                        </Grid>
                    </Section>
                    
                    <Section title="Etap kiedy zapadają decyzje o systemach sterowania i automatyki">
                        <Grid>
                            {[
                                ['stage_concept', 'Koncepcja'], ['stage_permit', 'Projekt budowlany'], ['stage_execution', 'Wykonawczy/wnętrza'], ['stage_depends', 'Zależy od projektu']
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

                    <Section title="Narzędzia">
                        <Grid>
                            <FormField id="design_tools" label="Z jakich narzędzi projektowych korzysta(Archicad, Revit, SketchUp, inne)?">
                                <input
                                    type="text"
                                    name="design_tools"
                                    value={formData.design_tools}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>

                            <PillCheckbox
                                label="Korzystają z modeli BIM"
                                checked={!!formData.uses_bim}
                                onChange={(checked) => setFormData((p) => ({ ...p, uses_bim: checked ? 1 : 0 }))}
                                className='mt-4 mb-4'
                            />

                        </Grid>
                    </Section>

                    <Section title="Z kim ma najczęściej współprace przy projektowaniu instalacji?">
                        <Grid>
                            {[
                                ['collab_hvac', 'Proj. instalacji sanitarnych HVAC'], ['collab_electrical', 'Proj. instalacji elektrycznych'], ['collab_integrator', 'Integrator systemów SH'], ['collab_contractor', 'Właśni zaufani wykonawcy']
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



                    <Section title="Najważniejsze kryteria przy wyborze systemów(5-najważniejsze, 1-najmniej ważne)">
                        <Grid>
                            {[['crit_aesthetics', 'Estetyka i design'], ['crit_reliability', 'Niezawodność i renoma marki'], ['crit_usability', 'Intuicyjność i prostota obsługi dla klienta'], ['crit_integration', 'Możliwość integracji z innymi systemami'], ['crit_support', 'Wsparcie techniczne producenta przy projekcie'], ['crit_energy', 'Efektywność energetyczna i ekologia'], ['crit_price', 'Cena / dopasowanie do budżetu inwestora']].map(([k, label]) => (
                                <FormField key={k} id={k} label={label}>
                                    <Rating5
                                        value={formData[k]}
                                        onChange={(val) => setFormData((p) => ({ ...p, [k]: val }))}
                                    />
                                </FormField>
                            ))}
                        </Grid>
                    </Section>

                    <Section title="Bóle i wyzwania przy implementacji systemów HVAC i Smart Home">
                        <Grid>
                            {[
                                ['pain_aesthetics', 'Brak spójnych wizualnie i estetycznych elementów'], ['pain_single_system', 'Trudność w znalezieniu jednego, kompleksowego systemu do różnych funkcji'], ['pain_no_support', 'Brak wsparcia technicznego i doradztwa na etapie koncepcji'], ['pain_limited_knowledge', 'Ograniczona wiedza na temat możliwości i nowości'], ['pain_investor_resistance', 'Opór inwestorów przed nowymi technologiami'], ['pain_coordination', 'Problemy w koordynacji międzybranżowej(architekt-instalator-elektryk)'], ['pain_lack_materials', 'Brak łatwych materiałów dla projektantów(modele CAD/BIN, specyfikacje)']
                            ].map(([k, label]) => (
                                <PillCheckbox
                                    key={k}
                                    label={label}
                                    checked={!!formData[k]}
                                    onChange={(checked) => setFormData((p) => ({ ...p, [k]: checked ? 1 : 0 }))}
                                />
                            ))}
                            <FormField id="pain_other_text" label="Inne - jakie?">
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

                    <Section title="Forma wsparcia z naszej strony">
                        <Grid>
                            {[
                                ['support_account_manager', 'Dedykowany opiekun'],
                                ['support_training', 'Szkolenia produktowe i technologiczne dla architektów'],
                                ['support_cad_bim', 'Dostęp do biblioteki CAD/BIM'],
                                ['support_samples', 'Wzorniki produktów i materiały do prezentacji klientom'],
                                ['support_concept_support', 'Wsparcie w przygotowaniu koncepcji i specyfikacji dla inwestora'],
                                ['support_partner_terms', 'Korzystne warunki w programie partnerskim']
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

                    <Section title="Dodatkowe">
                        <Grid>
                            <FormField id="www" label="Strona WWW">
                                <input
                                    type="text"
                                    name="www"
                                    value={formData.www || ''}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>

                            <FormField id="client_category" label="Kategoria klienta">
                                <input
                                    type="text"
                                    name="client_category"
                                    value={formData.client_category}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>

                            <FormField id="client_subcategory" label="Podkategoria klienta">
                                <input
                                    type="text"
                                    name="client_subcategory"
                                    value={formData.client_subcategory}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>

                            <FormField id="fairs" label="Targi / wydarzenia">
                                <input
                                    type="text"
                                    name="fairs"
                                    value={formData.fairs}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>

                            <FormField id="engo_team_director" label="Dyrektor w zespole ENGO">
                                <input
                                    type="text"
                                    name="engo_team_director"
                                    value={formData.engo_team_director || ''}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>

                            <FormField id="engo_team_contact" label="Kontakt w zespole ENGO">
                                <input
                                    type="text"
                                    name="engo_team_contact"
                                    value={formData.engo_team_contact}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>

                            <FormField id="number_of_sales_reps" label="Liczba handlowców">
                                <input
                                    type="text"
                                    name="number_of_sales_reps"
                                    value={formData.number_of_sales_reps}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>

                            <FormField id="relations" label="Relacje/partnerzy">
                                <input
                                    type="text"
                                    name="relations"
                                    value={formData.relations}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>

                            <FormField id="facebook" label="Facebook">
                                <input
                                    type="text"
                                    name="facebook"
                                    value={formData.facebook}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
                                />
                            </FormField>

                            <FormField id="additional_info" label="Informacje">
                                <textarea
                                    name="additional_info"
                                    value={formData.additional_info}
                                    onChange={handleChange}
                                    className='w-full border border-neutral-300 rounded px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-neutral-400 text-neutral-950'
                                />
                            </FormField>
                        </Grid>
                    </Section>



                    <Section title="Obiekcje">
                        <Grid>
                            <FormField id="primary_objection" label="Główna obiekcja">
                                <select
                                    name="primary_objection"
                                    value={formData.primary_objection || ''}
                                    onChange={handleChange}
                                    className="w-full border border-neutral-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                                >
                                    <option value="">—</option>
                                    <option value="trusted_brand">Zaufana marka</option>
                                    <option value="too_technical">Zbyt techniczne</option>
                                    <option value="clients_price">Cena dla klienta</option>
                                    <option value="none">Brak</option>
                                </select>
                            </FormField>
                            <FormField id="objection_note" label="Notatka o obiekcji">
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
                            {isSaving ? t('addClientModal.saving') : 'Zapisz'}
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

export default AddDesignerModal;
