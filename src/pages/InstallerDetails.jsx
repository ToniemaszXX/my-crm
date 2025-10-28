// src/pages/InstallerDetails.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useTranslation } from 'react-i18next';
import { autoHttp } from '../utils/react/creatUrlFromLink';
import { resolveUserLabelById } from '@/utils/usersCache';
import { Section, Grid, Field, Mapa } from '@/components/common';
import LocationPicker from '@/components/LocationPicker';
import EditInstallerModal from '@/components/EditInstallerModal';
import AddVisitModal from '@/components/AddVisitModal';
import VisitsList from '@/components/VisitsList';
import EditVisitModal from '@/components/EditVisitModal';
import ContactsList from '@/components/ContactsList';
import AddContactModal from '@/components/AddContactModal';
import EditContactModal from '@/components/EditContactModal';
import { isViewer } from '../utils/roles';
import VisitSummaries from '@/components/VisitSummaries';
import VisitMarketingTasks from '@/components/VisitMarketingTasks';

const numOrUndef = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export default function InstallerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [installer, setInstaller] = useState(null);
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
  const [clientsList, setClientsList] = useState([]);
  const [engoNames, setEngoNames] = useState({ dir: '', man: '', cnt: '' });
  const [authorName, setAuthorName] = useState('');

  // Scroll top on id change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [id]);

  // Fetch installer details
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const detRes = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Installers/get.php?id=${id}`);
        if (!detRes) return;
        if (detRes.status === 404) {
          if (!ignore) { setNotFound(true); setInstaller(null); }
        } else {
          const detJson = await detRes.json();
          if (detJson?.success && !ignore) setInstaller(detJson.installer);
        }
        // Also fetch clients list once to resolve distributor names
        const listRes = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/list.php`);
        if (listRes) {
          const listJson = await listRes.json();
          if (listJson?.success && !ignore) setClientsList(listJson.clients || []);
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
    if (loading || !installer) return;
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
  }, [location.search, id, loading, installer]);

  const title = useMemo(() => installer?.company_name || t('installer.titleFallback'), [installer, t]);

  // Resolve ENGO team names by *_user_id
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!installer) return;
      const marketId = installer.market_id;
      const [dir, man, cnt] = await Promise.all([
        resolveUserLabelById({ id: installer.engo_team_director_user_id, marketId, role: 'director' }).catch(() => undefined),
        resolveUserLabelById({ id: installer.engo_team_manager_user_id, marketId, role: 'manager' }).catch(() => undefined),
        resolveUserLabelById({ id: installer.engo_team_user_id, marketId }).catch(() => undefined),
      ]);
      if (!cancelled) setEngoNames({ dir: dir || '', man: man || '', cnt: cnt || '' });
    })();
    return () => { cancelled = true; };
  }, [installer?.id, installer?.market_id, installer?.engo_team_director_user_id, installer?.engo_team_manager_user_id, installer?.engo_team_user_id]);

  // Resolve author name from created_by
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!installer?.created_by) { if (!cancel) setAuthorName(''); return; }
      const label = await resolveUserLabelById({ id: installer.created_by, marketId: installer.market_id }).catch(() => undefined);
      if (!cancel) setAuthorName(label || '');
    })();
    return () => { cancel = true; };
  }, [installer?.created_by, installer?.market_id]);

  if (loading) return <p>{t('loading')}</p>;

  if (notFound) {
    return (
      <div>
        <nav className="mb-4 text-sm">
          <Link to="/customers" className="hover:underline">{t('customersTitle')}</Link>
          <span className="mx-2">/</span>
          <span>{t('common.notFound')}</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2">{t('installer.notFound')}</h1>
        <p className="mb-4">{t('common.checkUrlOrBack')}</p>
        <Link to="/customers" className="buttonGreen">← {t('common.backToList')}</Link>
      </div>
    );
  }

  if (!installer) return null;

  const mapsHref = installer.latitude && installer.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${installer.latitude},${installer.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      [installer.street, installer.postal_code, installer.city, installer.voivodeship, installer.country].filter(Boolean).join(', ')
    )}`;

  const linkedDistributorObjs = Array.isArray(installer.distributor_ids) && clientsList?.length
    ? clientsList.filter(c => installer.distributor_ids.map(Number).includes(Number(c.id)))
    : [];

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
       {!isViewer(user) && ( <button className="buttonGreen" onClick={() => setIsEditOpen(true)}>{t('edit')}</button>)}
      <button className="buttonRed" onClick={() => navigate(-1)}>{t('common.back')}</button>
        </div>
  </div>

      
            {/* ...existing sections... */}

    <Section title={t('common.mainData')}>
        <Grid>
          <Field label={t('addClientModal.companyName')} value={installer.company_name} />
      <Field label={t('addClientModal.status')} value={String(installer.status) === '1' ? t('filter.new') : t('filter.verified')} />
      <Field label={t('addClientModal.data_veryfication')} value={String(installer.data_veryfication) === '1' ? t('dataStatus.ready') : t('dataStatus.missing')} />
      <Field label={t('fields.smsConsent')} value={String(installer.sms_consent) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('fields.marketingConsent')} value={String(installer.marketing_consent) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('fields.source')} value={installer.source} />
      {installer.created_at && <Field label={t('common.createdAt')} value={new Date(installer.created_at).toLocaleString()} />}
          <Field label={t('addClientModal.client_code_erp')} value={installer.client_code_erp} />
          <Field label={t('addClientModal.nip')} value={installer.nip} />
          <Field label={t('common.class')} value={(installer.class_category && installer.class_category !== '-') ? installer.class_category : t('common.noClass')} />
          <Field label={t('addClientModal.clientCategory')} value={installer.client_category} />
      <Field label={t('fields.clientSubcategory')} value={installer.client_subcategory} />
          <Field label={t('addClientModal.engoTeamDirector')} value={engoNames.dir || '—'} />
          <Field label={t('addClientModal.engoTeamManager') || 'Manager ENGO'} value={engoNames.man || '—'} />
          <Field label={t('addClientModal.engoTeamContact')} value={engoNames.cnt || '—'} />
      <Field label={t('addClientModal.salesReps')} value={installer.number_of_sales_reps} />
        </Grid>
      </Section>

      <Section title={t('addClientModal.location')}>
        <Grid>
          <Field label={t('addClientModal.latitude')} value={installer.latitude} />
          <Field label={t('addClientModal.longitude')} value={installer.longitude} />
          <Field label={t('addClientModal.street')} value={installer.street} />
          <Field label={t('addClientModal.postalCode')} value={installer.postal_code} />
          <Field label={t('addClientModal.city')} value={installer.city} />
          <Field label={t('addClientModal.voivodeship')} value={installer.voivodeship} />
          <Field label={t('addClientModal.country')} value={installer.country} />

          <Mapa className='col-span-full z-0'>
            <LocationPicker
              street={installer.street}
              city={installer.city}
              postal_code={installer.postal_code}
              voivodeship={installer.voivodeship}
              country={installer.country}
              latitude={numOrUndef(installer.latitude)}
              longitude={numOrUndef(installer.longitude)}
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

      <Section title={t('relatedCompanies.title') || 'Firmy powiązane'}>
        {linkedDistributorObjs.length > 0 ? (
          <ul className="list-disc pl-6">
            {linkedDistributorObjs.map(d => (
              <li key={d.id}><Link to={`/customers/${d.id}`} className="hover:text-lime-500">{d.company_name}</Link></li>
            ))}
          </ul>
        ) : (
          <p>{t('relatedCompanies.empty') || 'Brak powiązanych firm.'}</p>
        )}
      </Section>


    <Section title={t('common.onlineInfo')}>
        <Grid>
          <Field label={t('addClientModal.facebook')} value={autoHttp(installer.facebook)} />
          <Field label={t('addClientModal.www')} value={autoHttp(installer.www)} />
      <Field label={t('common.additionalInfo')} value={installer.additional_info} />
        </Grid>
      </Section>

    <Section title={t('installer.sections.scope')}>
        <Grid>
      <Field label={t('installer.fields.scope.heating')} value={String(installer.install_heating) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.scope.ac')} value={String(installer.install_AC) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.scope.ventilation')} value={String(installer.install_ventilation) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.scope.smartHome')} value={String(installer.install_sh) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
        </Grid>
      </Section>

    <Section title={t('installer.sections.koi')}>
        <Grid>
      <Field label={t('installer.fields.koi.flats')} value={String(installer.koi_flats) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.koi.houses')} value={String(installer.koi_houses) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.koi.OUP')} value={String(installer.koi_OUP) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.koi.hotels')} value={String(installer.koi_hotels) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.koi.commercial')} value={String(installer.koi_comercial) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.koi.other')} value={installer.koi_others} />
        </Grid>
      </Section>

    <Section title={t('installer.sections.subcontractors')}>
        <Grid>
      <Field label={t('installer.fields.subcontractors.count')} value={installer.numbers_of_subcontractors} />
      <Field label={t('installer.fields.subcontractors.hasElectrician')} value={String(installer.has_electrician) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.subcontractors.workWithNeeds')} value={String(installer.work_with_needs) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.subcontractors.approvedByDistributor')} value={String(installer.approved_by_distributor) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
        </Grid>
      </Section>

    <Section title={t('installer.sections.problems')}>
        <Grid>
      <Field label={t('installer.fields.problems.arrears')} value={String(installer.problems_arrears) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.time')} value={String(installer.problem_time) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.smartClients')} value={String(installer.problem_clients_with_inteligent_system) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.expensive')} value={String(installer.problem_expensive) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.lowMargin')} value={String(installer.problem_low_margin) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.complicatedInstallation')} value={String(installer.problem_complicated_installation) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.complicatedConfiguration')} value={String(installer.problem_complicated_configuration) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.app')} value={String(installer.problem_app) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.support')} value={String(installer.problem_support) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.complaint')} value={String(installer.problem_complaint) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.training')} value={String(installer.problem_training) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.integration')} value={String(installer.problem_integration) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.marketing')} value={String(installer.problem_marketing_stuff) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('installer.fields.problems.competition')} value={installer.problem_competition} />
      <Field label={t('installer.fields.problems.other')} value={installer.problem_others} />
        </Grid>
      </Section>

            {/* Grid directly above visits: left column = post-meeting summaries (half width) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title={t('visit.postMeetingSummaries') || 'Podsumowania po spotkaniu'}>
                <VisitSummaries
                  entityType="installer"
                  entityId={installer.id}
                  marketId={installer.market_id}
                  reloadTrigger={refreshFlag}
                />
              </Section>
              <Section title={t('addVisitModal.marketingTasks') || 'Zadania marketingowe'}>
                <VisitMarketingTasks
                  entityType="installer"
                  entityId={installer.id}
                  marketId={installer.market_id}
                  reloadTrigger={refreshFlag}
                />
              </Section>
            </div>

  <Section id="visits-section" title={t('visitsPage.allVisits')}>
        <VisitsList
          entityType="installer"
          entityId={installer.id}
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
  {/* Force 3-per-row layout */}
  <div className="[&>div]:grid [&>div]:grid-cols-1 md:[&>div]:grid-cols-3 [&>div]:gap-3 [&>div]:space-y-0">
          <ContactsList
            entityType="installer"
            entityId={installer.id}
            reloadTrigger={refreshFlag}
            onEdit={(c) => { setSelectedContact({ ...c, installer_id: installer.id, client_id: null, designer_id: null, deweloper_id: null }); setIsEditContactOpen(true); }}
            searchQuery={contactQuery}
          />
        </div>
      </Section>

      {isEditOpen && (
        <EditInstallerModal
          isOpen={isEditOpen}
          installer={installer}
          onClose={() => setIsEditOpen(false)}
          onInstallerUpdated={async () => {
            const detRes = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Installers/get.php?id=${id}`);
            if (detRes && detRes.ok) {
              const detJson = await detRes.json();
              if (detJson?.success) setInstaller(detJson.installer);
            }
            setToast(t('toast.installerSaved'));
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
        entityType="installer"
        entities={[{ id: installer.id, company_name: installer.company_name }]}
        fixedEntityId={installer.id}
      />

      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        entityType="installer"
        fixedEntityId={installer.id}
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
          entityType="installer"
          entities={[{ id: installer.id, company_name: installer.company_name }]}
          fixedEntityId={installer.id}
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
