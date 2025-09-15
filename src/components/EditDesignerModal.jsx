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
        status: String(designer.status ?? '1'),
        data_veryfication: String(designer.data_veryfication ?? '0'),
        street: designer.street || '',
        city: designer.city || '',
        district: designer.district || '',
        voivodeship: designer.voivodeship || '',
        country: designer.country || 'Polska',
        postal_code: designer.postal_code || '',
        nip: designer.nip || '',
  client_category: designer.client_category || '',
  client_subcategory: designer.client_subcategory || '',
        fairs: designer.fairs || '',
  engo_team_director: designer.engo_team_director || '',
        engo_team_contact: designer.engo_team_contact || '',
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
        crit_aesthetics: designer.crit_aesthetics || '',
        crit_reliability: designer.crit_reliability || '',
        crit_usability: designer.crit_usability || '',
        crit_integration: designer.crit_integration || '',
        crit_support: designer.crit_support || '',
        crit_energy: designer.crit_energy || '',
        crit_price: designer.crit_price || '',
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
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Designers/edit.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      const text = await res.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch {}
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
          <h2 className="text-lime-500 text-xl font-extrabold">Edytuj Projektanta</h2>
          <button className="text-black hover:text-red-500 text-2xl font-bold bg-neutral-300 rounded-lg w-10 h-10 flex items-center justify-center leading-none" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={safeSubmit} className="text-white flex flex-col gap-3 pl-8 pr-8">
          {/* Market selection (only for multi-market users) */}
          {Array.isArray(user?.marketIds) && user.marketIds.length > 1 && (
            <div className="flex-col">
              <h4 className='header2'>Rynek</h4>
              <div className="grid2col mb-4">
                <label className="text-neutral-800">Rynek<br />
                  <select name="market_id" className='AddSelectClient' value={formData.market_id}
                          onChange={handleChange}>
                    <option value="">— wybierz rynek —</option>
                    {user.marketIds.map((mid) => (
                      <option key={mid} value={mid}>{getMarketLabel(mid)}</option>
                    ))}
                  </select>
                  {errors.market_id && <div className="text-red-600 text-sm">{errors.market_id}</div>}
                </label>
              </div>
            </div>
          )}
          {/* Dane firmy */}
          <div className="flex-col">
            <h4 className='header2'>Dane firmy</h4>
            <div className="grid2col mb-7">
              <div className="flexColumn">
                <label className="text-neutral-800">Nazwa firmy<br />
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} />
                  {errors.company_name && <div className="text-red-600 text-sm">{errors.company_name}</div>}
                </label>
                <label className="text-neutral-800">Kod ERP<br />
                  <input type="text" name="client_code_erp" value={formData.client_code_erp} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">Status<br />
                  <select name="status" className='AddSelectClient' value={formData.status} onChange={handleChange}>
                    <option value="1">Nowy</option>
                    <option value="0">Zweryfikowany</option>
                  </select>
                </label>
                <label className="text-neutral-800">Weryfikacja danych<br />
                  <select name="data_veryfication" className='AddSelectClient' value={formData.data_veryfication} onChange={handleChange}>
                    <option value="0">Brak danych</option>
                    <option value="1">Gotowe</option>
                  </select>
                </label>
                <label className="text-neutral-800">NIP<br />
                  <input type="text" name="nip" value={formData.nip} onChange={handleChange} />
                </label>
              </div>

              <div className="flexColumn">
                <label className="text-neutral-800">Ulica<br />
                  <input type="text" name="street" value={formData.street} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">Miasto<br />
                  <input type="text" name="city" value={formData.city} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">Powiat<br />
                  <input type="text" name="district" value={formData.district} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">Województwo<br />
                  <input type="text" name="voivodeship" value={formData.voivodeship} onChange={handleChange} />
                </label>
                <CountrySelect label={'Kraj'} value={formData.country} onChange={handleChange} className='AddSelectClient' />
                <label className="text-neutral-800">Kod pocztowy<br />
                  <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} />
                </label>
              </div>
            </div>
          </div>

          {/* Lokalizacja */}
          <div className="flex-col mb-7">
            <h4 className="header2">Lokalizacja</h4>
            <div className="grid2col mb-4">
              <label className="text-neutral-800">Szerokość geogr.<br />
                <input type="number" step="0.000001" name="latitude" value={formData.latitude} onChange={handleChange} {...numberInputGuards} />
              </label>
              <label className="text-neutral-800">Długość geogr.<br />
                <input type="number" step="0.000001" name="longitude" value={formData.longitude} onChange={handleChange} {...numberInputGuards} />
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
            </div>
          </div>

          {/* Dodatkowe */}
          <div className='flex-col mb-7'>
            <h4 className='header2'>Dodatkowe</h4>
            <div className='grid2col'>
              <div className='flexColumn'>
                <label className="text-neutral-800">Dyrektor w zespole ENGO<br />
                  <input type="text" name="engo_team_director" value={formData.engo_team_director || ''} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">Narzędzia projektowe<br />
                  <input type="text" name="design_tools" value={formData.design_tools} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">Uwzględnianie automatyki<br />
                  <select name="automation_inclusion" className='AddSelectClient' value={formData.automation_inclusion} onChange={handleChange}>
                    <option value="standard">standard</option>
                    <option value="on_request">on_request</option>
                    <option value="rarely">rarely</option>
                  </select>
                </label>
                <label className='text-neutral-800'><input type="checkbox" name="uses_bim" checked={!!formData.uses_bim} onChange={handleChange} /> Używa BIM</label>
                <label className='text-neutral-800'><input type="checkbox" name="spec_influence" checked={!!formData.spec_influence} onChange={handleChange} /> Wpływ na wybór specyfikacji</label>
                <label className="text-neutral-800">Relacje/partnerzy<br />
                  <input type="text" name="relations" value={formData.relations} onChange={handleChange} />
                </label>
              </div>
              <div className='flexColumn'>
                <label className='text-neutral-800'>Kontakt w zespole ENGO<br />
                  <input type="text" name="engo_team_contact" value={formData.engo_team_contact || ''} onChange={handleChange} />
                </label>
                <label className='text-neutral-800'>WWW<br />
                  <input type="text" name="www" value={formData.www} onChange={handleChange} />
                </label>
                <label className='text-neutral-800'>Facebook<br />
                  <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">Kategoria klienta<br />
                  <input type="text" name="client_category" value={formData.client_category} onChange={handleChange} />
                </label>
                <label className="text-neutral-800">Podkategoria klienta<br />
                  <input type="text" name="client_subcategory" value={formData.client_subcategory} onChange={handleChange} />
                </label>
                <label className='text-neutral-800'>Informacje<br />
                  <textarea name="additional_info" value={formData.additional_info} onChange={handleChange} className='min-h-[100px]'></textarea>
                </label>
              </div>
            </div>
          </div>

          {/* Kryteria (1–5) */}
          <div className='flex-col mb-7'>
            <h4 className='header2'>Kryteria (1–5)</h4>
            <div className='grid2col'>
              {['crit_aesthetics','crit_reliability','crit_usability','crit_integration','crit_support','crit_energy','crit_price'].map(k => (
                <label key={k} className='text-neutral-800'>
                  {k}
                  <input type="number" min={1} max={5} name={k} value={formData[k]} onChange={handleChange} />
                </label>
              ))}
            </div>
          </div>

          {/* Obiekcje */}
          <div className='flex-col mb-7'>
            <h4 className='header2'>Obiekcje</h4>
            <div className='grid2col'>
              <label className='text-neutral-800'>Główna obiekcja
                <input type="text" name="primary_objection" value={formData.primary_objection} onChange={handleChange} />
              </label>
              <label className='text-neutral-800'>Notatka o obiekcji
                <input type="text" name="objection_note" value={formData.objection_note} onChange={handleChange} />
              </label>
            </div>
          </div>

          {/* Typy budynków */}
          <div className='flex-col mb-7'>
            <h4 className='header2'>Typy budynków</h4>
            <div className='grid2col'>
              {[
                ['bt_premium_sf','Premium SF'],['bt_office_ab','Biura kl. A/B+'],['bt_hotel','Hotele'],['bt_public','Użyteczność publiczna'],['bt_apartment','Apartamenty'],['bt_other','Inne']
              ].map(([k,label]) => (
                <label key={k} className='text-neutral-800'><input type="checkbox" name={k} checked={!!formData[k]} onChange={handleChange} /> {label}</label>
              ))}
              <label className='text-neutral-800'>Inne — doprecyzowanie
                <input type="text" name="bt_other_text" value={formData.bt_other_text} onChange={handleChange} />
              </label>
            </div>
          </div>

          {/* Zakresy i etapy */}
          <div className='flex-col mb-7'>
            <h4 className='header2'>Zakresy i etapy</h4>
            <div className='grid2col'>
              {[
                ['scope_full_arch','Kompleksowe projekty'],['scope_interiors','Aranżacje wnętrz'],['scope_installations','Instalacje']
              ].map(([k,label]) => (
                <label key={k} className='text-neutral-800'><input type="checkbox" name={k} checked={!!formData[k]} onChange={handleChange} /> {label}</label>
              ))}
              {[
                ['stage_concept','Koncepcja'],['stage_permit','Projekt budowlany'],['stage_execution','Wykonawczy/wnętrza'],['stage_depends','Zależy od projektu']
              ].map(([k,label]) => (
                <label key={k} className='text-neutral-800'><input type="checkbox" name={k} checked={!!formData[k]} onChange={handleChange} /> {label}</label>
              ))}
            </div>
          </div>

          {/* Współprace i bóle */}
          <div className='flex-col mb-7'>
            <h4 className='header2'>Współprace i bóle</h4>
            <div className='grid2col'>
              {[
                ['collab_hvac','Proj. instalacji sanitarnych'],['collab_electrical','Proj. instalacji elektrycznych'],['collab_integrator','Integrator SH'],['collab_contractor','Własni wykonawcy']
              ].map(([k,label]) => (
                <label key={k} className='text-neutral-800'><input type="checkbox" name={k} checked={!!formData[k]} onChange={handleChange} /> {label}</label>
              ))}
              {[
                ['pain_aesthetics','Estetyka'],['pain_single_system','Jeden kompleksowy system'],['pain_no_support','Brak wsparcia'],['pain_limited_knowledge','Ogr. wiedza'],['pain_investor_resistance','Opór inwestorów'],['pain_coordination','Koordynacja'],['pain_lack_materials','Brak materiałów'],['pain_other','Inne']
              ].map(([k,label]) => (
                <label key={k} className='text-neutral-800'><input type="checkbox" name={k} checked={!!formData[k]} onChange={handleChange} /> {label}</label>
              ))}
              <label className='text-neutral-800'>Inne — doprecyzowanie
                <input type="text" name="pain_other_text" value={formData.pain_other_text} onChange={handleChange} />
              </label>
            </div>
          </div>

          {/* Wsparcie */}
          <div className='flex-col mb-7'>
            <h4 className='header2'>Wsparcie</h4>
            <div className='grid2col'>
              {[
                ['support_account_manager','Dedykowany opiekun'],['support_training','Szkolenia'],['support_cad_bim','Biblioteki CAD/BIM'],['support_samples','Wzorniki'],['support_concept_support','Wsparcie w koncepcji'],['support_partner_terms','Warunki programu']
              ].map(([k,label]) => (
                <label key={k} className='text-neutral-800'><input type="checkbox" name={k} checked={!!formData[k]} onChange={handleChange} /> {label}</label>
              ))}
            </div>
          </div>

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

export default EditDesignerModal;
