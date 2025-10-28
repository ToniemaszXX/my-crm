// src/pages/DesignerDetails.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useTranslation } from 'react-i18next';
import { autoHttp } from '../utils/react/creatUrlFromLink';
import { Section, Grid, Field, Mapa } from '@/components/common';
import LocationPicker from '@/components/LocationPicker';
import EditDesignerModal from '@/components/EditDesignerModal';
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

const numOrUndef = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export default function DesignerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [designer, setDesigner] = useState(null);
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
        const detRes = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Designers/get.php?id=${id}`);
        if (!detRes) return;
        if (detRes.status === 404) {
          if (!ignore) { setNotFound(true); setDesigner(null); }
        } else {
          const detJson = await detRes.json();
          if (detJson?.success && !ignore) setDesigner(detJson.data || detJson.designer || detJson);
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
    if (loading || !designer) return;
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
  }, [location.search, id, loading, designer]);

  const title = useMemo(() => designer?.company_name || t('designer.titleFallback'), [designer, t]);
  const automationMap = {
    standard: t('designer.fields.automationInclusion.standard'),
    'na życzenie inwestora': t('designer.fields.automationInclusion.on_request'),
    rzadko: t('designer.fields.automationInclusion.rarely'),
  };

  if (loading) return <p>{t('loading')}</p>;

  if (notFound) {
    return (
      <div>
        <nav className="mb-4 text-sm">
          <Link to="/customers" className="hover:underline">{t('customersTitle')}</Link>
          <span className="mx-2">/</span>
          <span>{t('common.notFound')}</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2">{t('designer.notFound')}</h1>
        <p className="mb-4">{t('common.checkUrlOrBack')}</p>
        <Link to="/customers" className="buttonGreen">← {t('common.backToList')}</Link>
      </div>
    );
  }

  if (!designer) return null;
  
  // Resolve author label
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!designer?.created_by) { if (!cancel) setAuthorName(''); return; }
      const label = await resolveUserLabelById({ id: designer.created_by, marketId: designer.market_id }).catch(() => undefined);
      if (!cancel) setAuthorName(label || '');
    })();
    return () => { cancel = true; };
  }, [designer?.created_by, designer?.market_id]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!designer) return;
      const marketId = designer.market_id;
      const [dir, man, cnt] = await Promise.all([
        resolveUserLabelById({ id: designer.engo_team_director_user_id, marketId, role: 'director' }).catch(() => undefined),
        resolveUserLabelById({ id: designer.engo_team_manager_user_id, marketId, role: 'manager' }).catch(() => undefined),
        resolveUserLabelById({ id: designer.engo_team_user_id, marketId }).catch(() => undefined),
      ]);
      if (!cancelled) setEngoNames({ dir: dir || '', man: man || '', cnt: cnt || '' });
    })();
    return () => { cancelled = true; };
  }, [designer?.id, designer?.market_id, designer?.engo_team_director_user_id, designer?.engo_team_manager_user_id, designer?.engo_team_user_id]);


  const mapsHref = designer.latitude && designer.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${designer.latitude},${designer.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      [designer.street, designer.postal_code, designer.city, designer.voivodeship, designer.country].filter(Boolean).join(', ')
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
          <Field label={t('addClientModal.companyName')} value={designer.company_name} />
      <Field label={t('addClientModal.status')} value={String(designer.status) === '1' ? t('filter.new') : t('filter.verified')} />
      <Field label={t('addClientModal.data_veryfication')} value={String(designer.data_veryfication) === '1' ? t('dataStatus.ready') : t('dataStatus.missing')} />
          <Field label={t('addClientModal.market')} value={designer.market_id} />
          <Field label={t('addClientModal.client_code_erp')} value={designer.client_code_erp} />
          <Field label={t('addClientModal.nip')} value={designer.nip} />
          <Field label={t('common.class')} value={(designer.class_category && designer.class_category !== '-') ? designer.class_category : t('common.noClass')} />
          <Field label={t('addClientModal.clientCategory')} value={designer.client_category} />
      <Field label={t('fields.clientSubcategory')} value={designer.client_subcategory} />
          <Field label={t('addClientModal.engoTeamDirector')} value={engoNames.dir || '—'} />
          <Field label={t('addClientModal.engoTeamManager') || 'Manager ENGO'} value={engoNames.man || '—'} />
          <Field label={t('addClientModal.engoTeamContact')} value={engoNames.cnt || '—'} />
        </Grid>
      </Section>

      <Section title={t('addClientModal.location')}>
        <Grid>
          <Field label={t('addClientModal.latitude')} value={designer.latitude} />
          <Field label={t('addClientModal.longitude')} value={designer.longitude} />
          <Field label={t('addClientModal.street')} value={designer.street} />
          <Field label={t('addClientModal.postalCode')} value={designer.postal_code} />
          <Field label={t('addClientModal.district')} value={designer.district} />
          <Field label={t('addClientModal.city')} value={designer.city} />
          <Field label={t('addClientModal.voivodeship')} value={designer.voivodeship} />
          <Field label={t('addClientModal.country')} value={designer.country} />

          <Mapa className='col-span-full z-0'>
            <LocationPicker
              street={designer.street}
              city={designer.city}
              postal_code={designer.postal_code}
              voivodeship={designer.voivodeship}
              country={designer.country}
              latitude={numOrUndef(designer.latitude)}
              longitude={numOrUndef(designer.longitude)}
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

    <Section title={t('common.onlineInfo')}>
        <Grid>
          <Field label={t('addClientModal.facebook')} value={autoHttp(designer.facebook)} />
          <Field label={t('addClientModal.www')} value={autoHttp(designer.www)} />
      <Field label={t('common.additionalInfo')} value={designer.additional_info} />
          <Field label={t('installerModal.fairs')} value={designer.fairs} />
          <Field label={t('fields.numberOfSalesReps')} value={designer.number_of_sales_reps} />
          <Field label={t('designerModal.relations')} value={designer.relations} />
        </Grid>
      </Section>

    <Section title={t('designer.sections.criteria15')}>
        <Grid>
      {['crit_aesthetics','crit_reliability','crit_usability','crit_integration','crit_support','crit_energy','crit_price'].map(k => (
      <Field key={k} label={t(`designer.fields.criteria.${k}`)} value={designer[k]} />
          ))}
        </Grid>
      </Section>

    <Section title={t('designer.sections.objections')}>
        <Grid>
      <Field label={t('designer.fields.objections.primary')} value={designer.primary_objection} />
      <Field label={t('designer.fields.objections.note')} value={designer.objection_note} />
        </Grid>
      </Section>

    <Section title={t('designer.sections.buildingTypes')}>
        <Grid>
      <Field label={t('designer.fields.bt.premiumSF')} value={String(designer.bt_premium_sf) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.bt.officeAB')} value={String(designer.bt_office_ab) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.bt.hotel')} value={String(designer.bt_hotel) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.bt.public')} value={String(designer.bt_public) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.bt.apartment')} value={String(designer.bt_apartment) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.bt.other')} value={String(designer.bt_other) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.bt.otherText')} value={designer.bt_other_text} />
        </Grid>
      </Section>

    <Section title={t('designer.sections.scopesStages')}>
        <Grid>
      <Field label={t('designer.fields.scope.fullArch')} value={String(designer.scope_full_arch) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.scope.interiors')} value={String(designer.scope_interiors) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.scope.installations')} value={String(designer.scope_installations) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designerModal.automationInclusion')} value={automationMap[designer.automation_inclusion] || designer.automation_inclusion || ''} />
      <Field label={t('designerModal.specInfluence')} value={String(designer.spec_influence) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.stage.concept')} value={String(designer.stage_concept) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.stage.permit')} value={String(designer.stage_permit) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.stage.execution')} value={String(designer.stage_execution) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.stage.depends')} value={String(designer.stage_depends) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
        </Grid>
      </Section>

      <Section title={t('designerModal.designTools')}>
        <Grid>
          <Field label={t('designerModal.designTools')} value={designer.design_tools} />
          <Field label={t('designerModal.usesBim')} value={String(designer.uses_bim) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
        </Grid>
      </Section>

    <Section title={t('designer.sections.collabsPains')}>
        <Grid>
      <Field label={t('designer.fields.collab.hvac')} value={String(designer.collab_hvac) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.collab.electrical')} value={String(designer.collab_electrical) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.collab.integrator')} value={String(designer.collab_integrator) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.collab.contractor')} value={String(designer.collab_contractor) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.pain.aesthetics')} value={String(designer.pain_aesthetics) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.pain.singleSystem')} value={String(designer.pain_single_system) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.pain.noSupport')} value={String(designer.pain_no_support) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.pain.limitedKnowledge')} value={String(designer.pain_limited_knowledge) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.pain.investorResistance')} value={String(designer.pain_investor_resistance) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.pain.coordination')} value={String(designer.pain_coordination) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.pain.lackMaterials')} value={String(designer.pain_lack_materials) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
      <Field label={t('designer.fields.pain.otherText')} value={designer.pain_other_text} />
        </Grid>
      </Section>

      <Section title={t('designer.sections.support') || 'Support'}>
        <Grid>
          <Field label={t('designerSupport.accountManager')} value={String(designer.support_account_manager) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
          <Field label={t('designerSupport.training')} value={String(designer.support_training) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
          <Field label={t('designerSupport.cadBim')} value={String(designer.support_cad_bim) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
          <Field label={t('designerSupport.samples')} value={String(designer.support_samples) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
          <Field label={t('designerSupport.conceptSupport')} value={String(designer.support_concept_support) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
          <Field label={t('designerSupport.partnerTerms')} value={String(designer.support_partner_terms) === '1' ? t('addClientModal.yes') : t('addClientModal.no')} />
        </Grid>
      </Section>

      {/* Grid directly above visits: left column = post-meeting summaries (half width) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title={t('visit.postMeetingSummaries') || 'Podsumowania po spotkaniu'}>
          <VisitSummaries
            entityType="designer"
            entityId={designer.id}
            marketId={designer.market_id}
            reloadTrigger={refreshFlag}
          />
        </Section>
        <Section title={t('addVisitModal.marketingTasks') || 'Zadania marketingowe'}>
          <VisitMarketingTasks
            entityType="designer"
            entityId={designer.id}
            marketId={designer.market_id}
            reloadTrigger={refreshFlag}
          />
        </Section>
      </div>

  <Section id="visits-section" title={t('visitsPage.allVisits')}>
        <VisitsList
          entityType="designer"
          entityId={designer.id}
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
            entityType="designer"
            entityId={designer.id}
            reloadTrigger={refreshFlag}
            onEdit={(c) => { setSelectedContact({ ...c, designer_id: designer.id, client_id: null, installer_id: null, deweloper_id: null }); setIsEditContactOpen(true); }}
            searchQuery={contactQuery}
          />
        </div>
      </Section>

      {isEditOpen && (
        <EditDesignerModal
          isOpen={isEditOpen}
          designer={designer}
          onClose={() => setIsEditOpen(false)}
          onDesignerUpdated={async () => {
            const detRes = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Designers/get.php?id=${id}`);
            if (detRes && detRes.ok) {
              const detJson = await detRes.json();
              if (detJson?.success) setDesigner(detJson.data || detJson.designer);
            }
            setToast(t('toast.designerSaved'));
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
        entityType="designer"
        entities={[{ id: designer.id, company_name: designer.company_name }]}
        fixedEntityId={designer.id}
      />

      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        entityType="designer"
        fixedEntityId={designer.id}
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
          entityType="designer"
          entities={[{ id: designer.id, company_name: designer.company_name }]}
          fixedEntityId={designer.id}
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
