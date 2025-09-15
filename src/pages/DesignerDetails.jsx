// src/pages/DesignerDetails.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useTranslation } from 'react-i18next';
import { autoHttp } from '../utils/react/creatUrlFromLink';
import { Section, Grid, Field, Mapa } from '@/components/common';
import LocationPicker from '@/components/LocationPicker';
import EditDesignerModal from '@/components/EditDesignerModal';
import AddVisitModal from '@/components/AddVisitModal';
import VisitsList from '@/components/VisitsList';
import EditVisitModal from '@/components/EditVisitModal';
import ContactsList from '@/components/ContactsList';
import AddContactModal from '@/components/AddContactModal';
import EditContactModal from '@/components/EditContactModal';

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

  const title = useMemo(() => designer?.company_name || 'Projektant', [designer]);

  if (loading) return <p>Ładowanie…</p>;

  if (notFound) {
    return (
      <div>
        <nav className="mb-4 text-sm">
          <Link to="/customers" className="hover:underline">Lista</Link>
          <span className="mx-2">/</span>
          <span>Nie znaleziono</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2">Projektant nie został znaleziony (404)</h1>
        <p className="mb-4">Sprawdź adres URL lub wróć do listy.</p>
        <Link to="/customers" className="buttonGreen">← Wróć do listy</Link>
      </div>
    );
  }

  if (!designer) return null;

  const mapsHref = designer.latitude && designer.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${designer.latitude},${designer.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      [designer.street, designer.postal_code, designer.city, designer.voivodeship, designer.country].filter(Boolean).join(', ')
    )}`;

  return (
    <div>
      <nav className="mb-4 text-sm">
        <Link to="/customers" className="hover:underline">Lista</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-400">{title}</span>
      </nav>

      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <button className="buttonGreen" onClick={() => setIsAddVisitOpen(true)}>Dodaj wizytę</button>
          <button className="buttonGreen" onClick={() => setIsAddContactOpen(true)}>Dodaj kontakt</button>
          <button className="buttonGreen" onClick={() => setIsEditOpen(true)}>Edytuj</button>
          <button className="buttonRed" onClick={() => navigate(-1)}>Wróć</button>
        </div>
      </div>

      <Section title="Dane główne">
        <Grid>
          <Field label={t('addClientModal.companyName')} value={designer.company_name} />
          <Field label={t('addClientModal.status')} value={String(designer.status) === '1' ? 'Nowy' : 'Zweryfikowany'} />
          <Field label={t('addClientModal.data_veryfication')} value={String(designer.data_veryfication) === '1' ? 'Gotowe' : 'Brak danych'} />
          <Field label={t('addClientModal.client_code_erp')} value={designer.client_code_erp} />
          <Field label={t('addClientModal.nip')} value={designer.nip} />
          <Field label={t('addClientModal.clientCategory')} value={designer.client_category} />
          <Field label="Podkategoria klienta" value={designer.client_subcategory} />
          <Field label={t('addClientModal.engoTeamDirector')} value={designer.engo_team_director} />
          <Field label={t('addClientModal.engoTeamContact')} value={designer.engo_team_contact} />
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

      <Section title="Online / Info">
        <Grid>
          <Field label={t('addClientModal.facebook')} value={autoHttp(designer.facebook)} />
          <Field label={t('addClientModal.www')} value={autoHttp(designer.www)} />
          <Field label={'Dodatkowe informacje'} value={designer.additional_info} />
        </Grid>
      </Section>

      <Section title="Kryteria (1–5)">
        <Grid>
          {['crit_aesthetics','crit_reliability','crit_usability','crit_integration','crit_support','crit_energy','crit_price'].map(k => (
            <Field key={k} label={k} value={designer[k]} />
          ))}
        </Grid>
      </Section>

      <Section title="Obiekcje">
        <Grid>
          <Field label={'Główna obiekcja'} value={designer.primary_objection} />
          <Field label={'Notatka o obiekcji'} value={designer.objection_note} />
        </Grid>
      </Section>

      <Section title="Typy budynków">
        <Grid>
          <Field label={'Premium SF'} value={String(designer.bt_premium_sf) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Biura kl. A/B+'} value={String(designer.bt_office_ab) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Hotele'} value={String(designer.bt_hotel) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Użyteczność publiczna'} value={String(designer.bt_public) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Apartamenty'} value={String(designer.bt_apartment) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Inne'} value={String(designer.bt_other) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Inne — doprecyzowanie'} value={designer.bt_other_text} />
        </Grid>
      </Section>

      <Section title="Zakresy i etapy">
        <Grid>
          <Field label={'Kompleksowe projekty'} value={String(designer.scope_full_arch) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Aranżacje wnętrz'} value={String(designer.scope_interiors) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Instalacje'} value={String(designer.scope_installations) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Koncepcja'} value={String(designer.stage_concept) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Projekt budowlany'} value={String(designer.stage_permit) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Wykonawczy/wnętrza'} value={String(designer.stage_execution) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Zależy od projektu'} value={String(designer.stage_depends) === '1' ? 'Tak' : 'Nie'} />
        </Grid>
      </Section>

      <Section title="Współprace i bóle">
        <Grid>
          <Field label={'Proj. instalacji sanitarnych'} value={String(designer.collab_hvac) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Proj. instalacji elektrycznych'} value={String(designer.collab_electrical) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Integrator SH'} value={String(designer.collab_integrator) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Własni wykonawcy'} value={String(designer.collab_contractor) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Estetyka'} value={String(designer.pain_aesthetics) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Jeden kompleksowy system'} value={String(designer.pain_single_system) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Brak wsparcia'} value={String(designer.pain_no_support) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Ogr. wiedza'} value={String(designer.pain_limited_knowledge) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Opór inwestorów'} value={String(designer.pain_investor_resistance) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Koordynacja'} value={String(designer.pain_coordination) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Brak materiałów'} value={String(designer.pain_lack_materials) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Inne'} value={String(designer.pain_other) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Inne — doprecyzowanie'} value={designer.pain_other_text} />
        </Grid>
      </Section>

      <Section title="Wsparcie">
        <Grid>
          <Field label={'Dedykowany opiekun'} value={String(designer.support_account_manager) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Szkolenia'} value={String(designer.support_training) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Biblioteki CAD/BIM'} value={String(designer.support_cad_bim) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Wzorniki'} value={String(designer.support_samples) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Wsparcie w koncepcji'} value={String(designer.support_concept_support) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Warunki programu'} value={String(designer.support_partner_terms) === '1' ? 'Tak' : 'Nie'} />
        </Grid>
      </Section>

      <Section title={t('visitsPage.allVisits')}>
        <VisitsList
          entityType="designer"
          entityId={designer.id}
          reloadTrigger={refreshFlag}
          onEdit={(v) => { setSelectedVisit(v); setIsEditModalOpen(true); }}
        />
      </Section>

      <Section title="Kontakty">
        <input
          type="text"
          placeholder="Szukaj w kontaktach…"
          value={contactQuery}
          onChange={(e) => setContactQuery(e.target.value)}
          className="mb-4 p-2 border rounded w-full text-white bg-neutral-900 border-neutral-700"
        />
        <ContactsList
          entityType="designer"
          entityId={designer.id}
          reloadTrigger={refreshFlag}
          onEdit={(c) => { setSelectedContact({ ...c, designer_id: designer.id, client_id: null, installer_id: null, deweloper_id: null }); setIsEditContactOpen(true); }}
          searchQuery={contactQuery}
        />
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
            setToast('Zapisano zmiany projektanta');
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
