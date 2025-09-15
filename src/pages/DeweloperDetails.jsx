// src/pages/DeweloperDetails.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useTranslation } from 'react-i18next';
import { autoHttp } from '../utils/react/creatUrlFromLink';
import { Section, Grid, Field, Mapa } from '@/components/common';
import LocationPicker from '@/components/LocationPicker';
import EditDeweloperModal from '@/components/EditDeweloperModal';
import AddVisitModal from '@/components/AddVisitModal';
import VisitsList from '@/components/VisitsList';
import EditVisitModal from '@/components/EditVisitModal';
import ContactsList from '@/components/ContactsList';
import AddContactModal from '@/components/AddContactModal';
import EditContactModal from '@/components/EditContactModal';

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

  const title = useMemo(() => developer?.company_name || 'Deweloper', [developer]);

  if (loading) return <p>Ładowanie…</p>;
  if (notFound) {
    return (
      <div>
        <nav className="mb-4 text-sm">
          <Link to="/customers" className="hover:underline">Lista</Link>
          <span className="mx-2">/</span>
          <span>Nie znaleziono</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2">Deweloper nie został znaleziony (404)</h1>
        <p className="mb-4">Sprawdź adres URL lub wróć do listy.</p>
        <Link to="/customers" className="buttonGreen">← Wróć do listy</Link>
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
          <Field label={t('addClientModal.companyName')} value={developer.company_name} />
          <Field label={t('addClientModal.status')} value={String(developer.status) === '1' ? 'Nowy' : 'Zweryfikowany'} />
          <Field label={t('addClientModal.data_veryfication')} value={String(developer.data_veryfication) === '1' ? 'Gotowe' : 'Brak danych'} />
          <Field label={t('addClientModal.client_code_erp')} value={developer.client_code_erp} />
          <Field label={t('addClientModal.nip')} value={developer.nip} />
          <Field label={t('addClientModal.clientCategory')} value={developer.client_category} />
          <Field label="Podkategoria klienta" value={developer.client_subcategory} />
          <Field label={t('addClientModal.engoTeamContact')} value={developer.engo_team_contact} />
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

      <Section title="Segmenty i charakter">
        <Grid>
          <Field label={'Wielo-rodzinne'} value={String(developer.seg_multi_family) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Jedno-rodzinne'} value={String(developer.seg_single_family) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Komercyjne'} value={String(developer.seg_commercial) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Hotele/rekreacja'} value={String(developer.seg_hotel_leisure) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Mainstream'} value={String(developer.char_mainstream) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Premium'} value={String(developer.char_premium) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Luksus'} value={String(developer.char_luxury) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Skala inwestycji'} value={developer.scale_band} />
          <Field label={'Oferta SMART HOME'} value={developer.smart_home_offer} />
        </Grid>
      </Section>

      <Section title="Wyróżniki">
        <Grid>
          <Field label={'Lokalizacja'} value={String(developer.diff_location) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Architektura/Design'} value={String(developer.diff_arch_design) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Jakość materiałów'} value={String(developer.diff_materials_quality) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Eko/energia'} value={String(developer.diff_eco_energy) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Cena'} value={String(developer.diff_price) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Inne'} value={String(developer.diff_other) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Inne — doprecyzowanie'} value={developer.diff_other_text} />
        </Grid>
      </Section>

      <Section title="Wyzwania i zainteresowania">
        <Grid>
          <Field label={'Duża konkurencja'} value={String(developer.chal_competition) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Rosnące koszty'} value={String(developer.chal_rising_costs) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Długi cykl sprzedaży'} value={String(developer.chal_long_sales_cycle) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Rosnące wymagania klientów'} value={String(developer.chal_customer_needs) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Zgodność z normami'} value={String(developer.chal_energy_compliance) === '1' ? 'Tak' : 'Nie'} />

          <Field label={'Obniżenie rachunków'} value={String(developer.int_cost_reduction) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Bezpieczeństwo i komfort'} value={String(developer.int_safety_comfort) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Nowoczesny argument'} value={String(developer.int_modern_sales_arg) === '1' ? 'Tak' : 'Nie'} />
        </Grid>
      </Section>

      <Section title="Partnerzy">
        <Grid>
          <Field label={'Generalny Wykonawca'} value={developer.gc_company} />
          <Field label={'Instalacje HVAC – wykonawca'} value={developer.inst_hvac_company} />
          <Field label={'Instalacje elektryczne – wykonawca'} value={developer.inst_electrical_company} />
          <Field label={'Projekt architektoniczny – pracownia/biuro'} value={developer.arch_design_company} />
          <Field label={'Projekt wnętrz – pracownia (jeśli dotyczy)'} value={developer.interior_design_company} />
          <Field label={'Główna hurtownia sanitarno-grzewcza'} value={developer.wholesale_plumb_heat} />
          <Field label={'Główna hurtownia elektryczna'} value={developer.wholesale_electrical} />
        </Grid>
      </Section>

      <Section title="Model wdrożenia">
        <Grid>
          <Field label={'Model wdrożenia'} value={developer.implementation_model} />
        </Grid>
      </Section>

      <Section title="Wsparcie dla sprzedaży">
        <Grid>
          <Field label={'Marketing'} value={String(developer.sup_marketing) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Mieszkanie pokazowe'} value={String(developer.sup_show_apartment) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Szkolenia sprzedaży'} value={String(developer.sup_sales_training) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Pakiety rozwiązań'} value={String(developer.sup_solution_packages) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Pełna koordynacja'} value={String(developer.sup_full_coordination) === '1' ? 'Tak' : 'Nie'} />
          <Field label={'Warunki przez dystrybucję'} value={String(developer.sup_terms_distribution) === '1' ? 'Tak' : 'Nie'} />
        </Grid>
      </Section>

      <Section title={t('visitsPage.allVisits')}>
        <VisitsList
          entityType="deweloper"
          entityId={developer.id}
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
          entityType="deweloper"
          entityId={developer.id}
          reloadTrigger={refreshFlag}
          onEdit={(c) => { setSelectedContact({ ...c, deweloper_id: developer.id, client_id: null, designer_id: null, installer_id: null }); setIsEditContactOpen(true); }}
          searchQuery={contactQuery}
        />
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
            setToast('Zapisano zmiany dewelopera');
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
