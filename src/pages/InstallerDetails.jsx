// src/pages/InstallerDetails.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useTranslation } from 'react-i18next';
import { autoHttp } from '../utils/react/creatUrlFromLink';
import { Section, Grid, Field, Mapa } from '@/components/common';
import LocationPicker from '@/components/LocationPicker';
import EditInstallerModal from '@/components/EditInstallerModal';
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
      } catch {
        if (!ignore) setNotFound(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  const title = useMemo(() => installer?.company_name || 'Instalator', [installer]);

  if (loading) return <p>Ładowanie…</p>;

  if (notFound) {
    return (
      <div>
        <nav className="mb-4 text-sm">
          <Link to="/customers" className="hover:underline">Klienci</Link>
          <span className="mx-2">/</span>
          <span>Nie znaleziono</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2">Instalator nie został znaleziony (404)</h1>
        <p className="mb-4">Sprawdź adres URL lub wróć do listy.</p>
        <Link to="/customers" className="buttonGreen">← Wróć do listy</Link>
      </div>
    );
  }

  if (!installer) return null;

  const mapsHref = installer.latitude && installer.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${installer.latitude},${installer.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      [installer.street, installer.postal_code, installer.city, installer.voivodeship, installer.country].filter(Boolean).join(', ')
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
          <Field label={t('addClientModal.companyName')} value={installer.company_name} />
          <Field label={t('addClientModal.status')} value={String(installer.status) === '1' ? 'Nowy' : 'Zweryfikowany'} />
          <Field label={t('addClientModal.data_veryfication')} value={String(installer.data_veryfication) === '1' ? 'Gotowe' : 'Brak danych'} />
          <Field label={t('addClientModal.client_code_erp')} value={installer.client_code_erp} />
          <Field label={t('addClientModal.nip')} value={installer.nip} />
          <Field label={t('addClientModal.clientCategory')} value={installer.client_category} />
          <Field label="Podkategoria klienta" value={installer.client_subcategory} />
          <Field label={t('addClientModal.engoTeamDirector')} value={installer.engo_team_director} />
          <Field label={t('addClientModal.engoTeamContact')} value={installer.engo_team_contact} />
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

      <Section title="Online / Info">
        <Grid>
          <Field label={t('addClientModal.facebook')} value={autoHttp(installer.facebook)} />
          <Field label={t('addClientModal.www')} value={autoHttp(installer.www)} />
          <Field label={'Dodatkowe informacje'} value={installer.additional_info} />
        </Grid>
      </Section>

      <Section title="Zakres działalności">
        <Grid>
          <Field label={'Ogrzewanie'} value={String(installer.install_heating) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Klimatyzacja'} value={String(installer.install_AC) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Wentylacja'} value={String(installer.install_ventilation) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Smart Home'} value={String(installer.install_sh) === '1' ? 'Tak' : 'Nie'} />
        </Grid>
      </Section>

      <Section title="KOI / Obszary">
        <Grid>
          <Field label={'Mieszkania'} value={String(installer.koi_flats) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Domy'} value={String(installer.koi_houses) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'OUP'} value={String(installer.koi_OUP) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Hotele'} value={String(installer.koi_hotels) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Obiekty komercyjne'} value={String(installer.koi_comercial) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Inne'} value={installer.koi_others} />
        </Grid>
      </Section>

      <Section title="Podwykonawcy i kwalifikacje">
        <Grid>
          <Field label={'Liczba podwykonawców'} value={installer.numbers_of_subcontractors} />
          <Field label={'Ma elektryka'} value={String(installer.has_electrician) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Pracuje z potrzebami'} value={String(installer.work_with_needs) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Zatwierdzony przez dystrybutora'} value={String(installer.approved_by_distributor) === '1' ? 'Tak' : 'Nie'} />
        </Grid>
      </Section>

      <Section title="Problemy">
        <Grid>
          <Field label={'Zaległości płatnicze'} value={String(installer.problems_arrears) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Czas'} value={String(installer.problem_time) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Klienci z inteligentnym systemem'} value={String(installer.problem_clients_with_inteligent_system) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Drogo'} value={String(installer.problem_expensive) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Niska marża'} value={String(installer.problem_low_margin) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Skomplikowany montaż'} value={String(installer.problem_complicated_installation) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Skomplikowana konfiguracja'} value={String(installer.problem_complicated_configuration) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Aplikacja'} value={String(installer.problem_app) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Wsparcie'} value={String(installer.problem_support) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Reklamacje'} value={String(installer.problem_complaint) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Szkolenia'} value={String(installer.problem_training) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Integracja'} value={String(installer.problem_integration) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Marketing'} value={String(installer.problem_marketing_stuff) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Konkurencja (liczba)'} value={installer.problem_competition} />
          <Field label={'Inne problemy'} value={installer.problem_others} />
        </Grid>
      </Section>

      <Section title={t('visitsPage.allVisits')}>
        <VisitsList
          entityType="installer"
          entityId={installer.id}
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
          entityType="installer"
          entityId={installer.id}
          reloadTrigger={refreshFlag}
          onEdit={(c) => { setSelectedContact({ ...c, installer_id: installer.id, client_id: null, designer_id: null, deweloper_id: null }); setIsEditContactOpen(true); }}
          searchQuery={contactQuery}
        />
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
            setToast('Zapisano zmiany instalatora');
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
