// src/pages/DeweloperDetails.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useTranslation } from 'react-i18next';
import { autoHttp } from '../utils/react/creatUrlFromLink';
import { Section, Grid, Field, Mapa } from '@/components/common';
import LocationPicker from '@/components/LocationPicker';
import EditDeweloperModal from '@/components/EditDeweloperModal';
import { resolveUserLabelById } from '@/utils/usersCache';
import AddVisitModal from '@/components/AddVisitModal';
import VisitsList from '@/components/VisitsList';
import EditVisitModal from '@/components/EditVisitModal';
import ContactsList from '@/components/ContactsList';
import AddContactModal from '@/components/AddContactModal';
import EditContactModal from '@/components/EditContactModal';
import { isViewer } from '../utils/roles';
import VisitSummaries from '@/components/VisitSummaries';
import VisitMarketingTasks from '@/components/VisitMarketingTasks';

const numOrUndef = (v) => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };

export default function DeweloperDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactQuery, setContactQuery] = useState('');
  const [engoNames, setEngoNames] = useState({ dir: '', man: '', cnt: '' });
  const [authorName, setAuthorName] = useState('');

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [id]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const detRes = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Developers/get.php?id=${id}`);
        if (!detRes) return;
        if (detRes.status === 404) {
          if (!ignore) { setNotFound(true); setDeveloper(null); }
        } else {
          const detJson = await detRes.json();
          if (detJson?.success && !ignore) setDeveloper(detJson.data || detJson.developer || detJson);
        }
      } catch {
        if (!ignore) setNotFound(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  const location = useLocation();
  // Scroll to visits section when ?section=visits-section (or legacy 'visits') is present, after data is loaded
  useEffect(() => {
    if (loading || !developer) return;
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section === 'visits-section' || section === 'visits') {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById('visits-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      });
    }
  }, [location.search, id, loading, developer]);

  const title = useMemo(() => developer?.company_name || t('developer.titleFallback'), [developer, t]);

  // Resolve ENGO team names by *_user_id
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!developer) return;
      const marketId = developer.market_id;
      const [dir, man, cnt] = await Promise.all([
        resolveUserLabelById({ id: developer.engo_team_director_user_id, marketId, role: 'director' }).catch(() => undefined),
        resolveUserLabelById({ id: developer.engo_team_manager_user_id, marketId, role: 'manager' }).catch(() => undefined),
        resolveUserLabelById({ id: developer.engo_team_user_id, marketId }).catch(() => undefined),
      ]);
      if (!cancelled) setEngoNames({ dir: dir || '', man: man || '', cnt: cnt || '' });
    })();
    return () => { cancelled = true; };
  }, [developer?.id, developer?.market_id, developer?.engo_team_director_user_id, developer?.engo_team_manager_user_id, developer?.engo_team_user_id]);

  // Resolve author name from created_by
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!developer?.created_by) { if (!cancel) setAuthorName(''); return; }
      const label = await resolveUserLabelById({ id: developer.created_by, marketId: developer.market_id }).catch(() => undefined);
      if (!cancel) setAuthorName(label || '');
    })();
    return () => { cancel = true; };
  }, [developer?.created_by, developer?.market_id]);

  if (loading) return <p>{t('loading')}</p>;
  if (notFound) {
    return (
      <div>
        <nav className="mb-4 text-sm">
          <Link to="/customers" className="hover:underline">{t('customersTitle')}</Link>
          <span className="mx-2">/</span>
          <span>{t('common.notFound')}</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2">{t('developer.notFound')}</h1>
        <p className="mb-4">{t('common.checkUrlOrBack')}</p>
        <Link to="/customers" className="buttonGreen">← {t('common.backToList')}</Link>
      </div>
    );
  }
  if (!developer) return null;

  const mapsHref = developer.latitude && developer.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${developer.latitude},${developer.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      [developer.street, developer.postal_code, developer.city, developer.voivodeship, developer.country].filter(Boolean).join(', ')
    )}`;

  return (
    <div>
      <nav className="mb-4 text-sm">
        <Link to="/customers" className="hover:underline">{t('customersTitle')}</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-400">{title}</span>
      </nav>

      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {authorName && (
            <div className="text-sm text-neutral-400 mt-1">Dodany przez: {authorName}</div>
          )}
        </div>
        <div className="flex gap-2">
      <button className="buttonGreen" onClick={() => setIsAddVisitOpen(true)}>{t('visit.addVisit')}</button>
      <button className="buttonGreen" onClick={() => setIsAddContactOpen(true)}>{t('addClientModal.addContact')}</button>
      {!isViewer(user) && (  <button className="buttonGreen" onClick={() => setIsEditOpen(true)}>{t('edit')}</button>)}
      <button className="buttonRed" onClick={() => navigate(-1)}>{t('common.back')}</button>
        </div>
      </div>

  {/* ...existing sections... */}

    <Section title={t('common.mainData')}>
        <Grid>
          <Field label={t('addClientModal.companyName')} value={developer.company_name} />
      <Field label={t('addClientModal.status')} value={String(developer.status) === '1' ? t('filter.new') : t('filter.verified')} />
      <Field label={t('addClientModal.data_veryfication')} value={String(developer.data_veryfication) === '1' ? t('dataStatus.ready') : t('dataStatus.missing')} />
          <Field label={t('addClientModal.client_code_erp')} value={developer.client_code_erp} />
          <Field label={t('addClientModal.nip')} value={developer.nip} />
          <Field label={t('common.class')} value={(developer.class_category && developer.class_category !== '-') ? developer.class_category : t('common.noClass')} />
          <Field label={t('addClientModal.clientCategory')} value={developer.client_category} />
      <Field label={t('fields.clientSubcategory')} value={developer.client_subcategory} />
          <Field label={t('addClientModal.engoTeamDirector')} value={engoNames.dir || '—'} />
          <Field label={t('addClientModal.engoTeamManager') || 'Manager ENGO'} value={engoNames.man || '—'} />
          <Field label={t('addClientModal.engoTeamContact')} value={engoNames.cnt || '—'} />
        </Grid>
      </Section>

      <Section title={t('addClientModal.location')}>
        <Grid>
          <Field label={t('addClientModal.latitude')} value={developer.latitude} />
          <Field label={t('addClientModal.longitude')} value={developer.longitude} />
          <Field label={t('addClientModal.street')} value={developer.street} />
          <Field label={t('addClientModal.postalCode')} value={developer.postal_code} />
          <Field label={t('addClientModal.city')} value={developer.city} />
          <Field label={t('addClientModal.voivodeship')} value={developer.voivodeship} />
          <Field label={t('addClientModal.country')} value={developer.country} />

          <Mapa className='col-span-full z-0'>
            <LocationPicker
              street={developer.street}
              city={developer.city}
              postal_code={developer.postal_code}
              voivodeship={developer.voivodeship}
              country={developer.country}
              latitude={numOrUndef(developer.latitude)}
              longitude={numOrUndef(developer.longitude)}
              onCoordsChange={() => { }}
              showResetButton={false}
              readOnly={true}
              pinLocked={true}
            />
            <a className="buttonGreen inline-block mt-4" href={mapsHref} target="_blank" rel="noopener noreferrer">
              {t('editClientModal.direct')}
            </a>
          </Mapa>
        </Grid>
      </Section>

    <Section title={t('developer.sections.segmentsAndCharacter')}>
        <Grid>
      <Field label={t('developer.fields.seg.multiFamily')} value={String(developer.seg_multi_family) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.seg.singleFamily')} value={String(developer.seg_single_family) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.seg.commercial')} value={String(developer.seg_commercial) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.seg.hotelLeisure')} value={String(developer.seg_hotel_leisure) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.char.mainstream')} value={String(developer.char_mainstream) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.char.premium')} value={String(developer.char_premium) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.char.luxury')} value={String(developer.char_luxury) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.scaleBand')} value={developer.scale_band} />
      <Field label={t('developer.fields.smartHomeOffer')} value={developer.smart_home_offer} />
        </Grid>
      </Section>

    <Section title={t('developer.sections.differentiators')}>
        <Grid>
      <Field label={t('developer.fields.diff.location')} value={String(developer.diff_location) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.diff.archDesign')} value={String(developer.diff_arch_design) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.diff.materialsQuality')} value={String(developer.diff_materials_quality) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.diff.ecoEnergy')} value={String(developer.diff_eco_energy) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.diff.price')} value={String(developer.diff_price) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.diff.other')} value={String(developer.diff_other) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.diff.otherText')} value={developer.diff_other_text} />
        </Grid>
      </Section>

    <Section title={t('developer.sections.challengesInterests')}>
        <Grid>
      <Field label={t('developer.fields.chal.competition')} value={String(developer.chal_competition) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.chal.risingCosts')} value={String(developer.chal_rising_costs) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.chal.longSalesCycle')} value={String(developer.chal_long_sales_cycle) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.chal.customerNeeds')} value={String(developer.chal_customer_needs) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.chal.energyCompliance')} value={String(developer.chal_energy_compliance) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />

      <Field label={t('developer.fields.int.costReduction')} value={String(developer.int_cost_reduction) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.int.safetyComfort')} value={String(developer.int_safety_comfort) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.int.modernSalesArg')} value={String(developer.int_modern_sales_arg) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
        </Grid>
      </Section>

    <Section title={t('developer.sections.partners')}>
        <Grid>
      <Field label={t('developer.fields.partners.gc')} value={developer.gc_company} />
      <Field label={t('developer.fields.partners.hvac')} value={developer.inst_hvac_company} />
      <Field label={t('developer.fields.partners.electrical')} value={developer.inst_electrical_company} />
      <Field label={t('developer.fields.partners.archDesign')} value={developer.arch_design_company} />
      <Field label={t('developer.fields.partners.interiorDesign')} value={developer.interior_design_company} />
      <Field label={t('developer.fields.partners.wholesalePlumbHeat')} value={developer.wholesale_plumb_heat} />
      <Field label={t('developer.fields.partners.wholesaleElectrical')} value={developer.wholesale_electrical} />
        </Grid>
      </Section>

    <Section title={t('developer.sections.implementationModel')}>
        <Grid>
      <Field label={t('developer.fields.implementationModel')} value={developer.implementation_model} />
        </Grid>
      </Section>

    <Section title={t('developer.sections.salesSupport')}>
        <Grid>
      <Field label={t('developer.fields.sup.marketing')} value={String(developer.sup_marketing) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.sup.showApartment')} value={String(developer.sup_show_apartment) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.sup.salesTraining')} value={String(developer.sup_sales_training) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.sup.solutionPackages')} value={String(developer.sup_solution_packages) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.sup.fullCoordination')} value={String(developer.sup_full_coordination) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('developer.fields.sup.termsDistribution')} value={String(developer.sup_terms_distribution) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
        </Grid>
      </Section>

      {/* Grid directly above visits: left column = post-meeting summaries (half width) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title={t('visit.postMeetingSummaries') || 'Podsumowania po spotkaniu'}>
          <VisitSummaries
            entityType="deweloper"
            entityId={developer.id}
            marketId={developer.market_id}
            reloadTrigger={refreshFlag}
          />
        </Section>
        <Section title={t('addVisitModal.marketingTasks') || 'Zadania marketingowe'}>
          <VisitMarketingTasks
            entityType="deweloper"
            entityId={developer.id}
            marketId={developer.market_id}
            reloadTrigger={refreshFlag}
          />
        </Section>
      </div>

  <Section id="visits-section" title={t('visitsPage.allVisits')}>
        <VisitsList
          entityType="deweloper"
          entityId={developer.id}
          reloadTrigger={refreshFlag}
          onEdit={(v) => { setSelectedVisit(v); setIsEditModalOpen(true); }}
        />
      </Section>

    <Section title={t('common.contacts')}>
        <input
          type="text"
      placeholder={t('editClientModal.searchContact')}
          value={contactQuery}
          onChange={(e) => setContactQuery(e.target.value)}
          className="mb-4 p-2 border rounded w-full text-white bg-neutral-900 border-neutral-700"
        />
  <div className="[&>div]:grid [&>div]:grid-cols-1 md:[&>div]:grid-cols-3 [&>div]:gap-3 [&>div]:space-y-0">
          <ContactsList
            entityType="deweloper"
            entityId={developer.id}
            reloadTrigger={refreshFlag}
            onEdit={(c) => { setSelectedContact({ ...c, deweloper_id: developer.id, client_id: null, designer_id: null, installer_id: null }); setIsEditContactOpen(true); }}
            searchQuery={contactQuery}
          />
        </div>
      </Section>

      {isEditOpen && (
        <EditDeweloperModal
          isOpen={isEditOpen}
          developer={developer}
          onClose={() => setIsEditOpen(false)}
          onDeveloperUpdated={async () => {
            const detRes = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Developers/get.php?id=${id}`);
            if (detRes && detRes.ok) {
              const detJson = await detRes.json();
              if (detJson?.success) setDeveloper(detJson.data || detJson.developer);
            }
            setToast(t('toast.developerSaved'));
            setTimeout(() => setToast(null), 2200);
          }}
        />
      )}

      <AddVisitModal
        isOpen={isAddVisitOpen}
        onClose={() => setIsAddVisitOpen(false)}
        onVisitAdded={() => {
          setIsAddVisitOpen(false);
          setRefreshFlag(prev => !prev);
        }}
        entityType="deweloper"
        entities={[{ id: developer.id, company_name: developer.company_name }]}
        fixedEntityId={developer.id}
      />

      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        entityType="deweloper"
        fixedEntityId={developer.id}
        onAdded={() => setRefreshFlag(prev => !prev)}
      />

      {selectedContact && (
        <EditContactModal
          isOpen={isEditContactOpen}
          onClose={() => { setIsEditContactOpen(false); setSelectedContact(null); }}
          contact={selectedContact}
          onUpdated={() => { setIsEditContactOpen(false); setSelectedContact(null); setRefreshFlag(prev => !prev); }}
        />
      )}

      {selectedVisit && (
        <EditVisitModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setSelectedVisit(null); }}
          onVisitUpdated={() => {
            setIsEditModalOpen(false);
            setSelectedVisit(null);
            setRefreshFlag(prev => !prev);
          }}
          visit={selectedVisit}
          entityType="deweloper"
          entities={[{ id: developer.id, company_name: developer.company_name }]}
          fixedEntityId={developer.id}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-neutral-800 text-white px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
