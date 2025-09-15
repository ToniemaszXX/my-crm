// src/pages/CustomerDetails.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EditClientModal from '../components/EditClientModal';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useTranslation } from 'react-i18next';
import { yesNo, fmtMoney } from '../utils/conversionForData';
import { autoHttp } from '../utils/react/creatUrlFromLink';
import { Section, Grid, Field, Mapa } from '@/components/common';
import LocationPicker from '@/components/LocationPicker';
import ClientVisits from '../components/ClientVisits';
import AddVisitModal from '../components/AddVisitModal';
import EditVisitModal from '../components/EditVisitModal';
import { canEditVisit } from '../utils/visitUtils';
import AddContactModal from '../components/AddContactModal';
import EditContactModal from '../components/EditContactModal';




const normalizeCategory = (cat) => (cat ? String(cat).trim().replace(/\s+/g, '_') : '');
const numOrUndef = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { user } = useAuth();

  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const [client, setClient] = useState(null);
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [contactQuery, setContactQuery] = useState('');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);


  // Scroll do góry przy wejściu / zmianie klienta
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Pobranie szczegółów i listy (lista potrzebna m.in. do sekcji oddziałów oraz do modala)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const detRes = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/get.php?id=${id}`);
        if (!detRes) return; // 401 obsłuży się globalnie
        
        if (detRes.status === 404) {
          if (!ignore) { setNotFound(true); setClient(null); }
        } else {
          const detJson = await detRes.json();
          if (detJson?.success && !ignore) setClient(detJson.client);
        }

        const listRes = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/list.php`);
        if (!listRes) return;
        const listJson = await listRes.json();
        if (listJson?.success && !ignore) setAllClients(listJson.clients || []);
      } catch {
        if (!ignore) setNotFound(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  const title = useMemo(() => client?.company_name || 'Klient', [client]);

  if (loading) return <p>Ładowanie…</p>;

  if (notFound) {
    return (
      <div>
        <nav className="mb-4 text-sm">
          <Link to="/customers" className="hover:underline">Klienci</Link>
          <span className="mx-2">/</span>
          <span>Nie znaleziono</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2">Klient nie został znaleziony (404)</h1>
        <p className="mb-4">Sprawdź adres URL lub wróć do listy klientów.</p>
        <Link to="/customers" className="buttonGreen">← Wróć do listy</Link>
      </div>
    );
  }

  if (!client) return null;

  // Oddziały przypisane do centrali (jak w modalu)
  const isHeadOffice = normalizeCategory(client.client_category) === 'DYSTRYBUTOR_CENTRALA';
  const branches = isHeadOffice
    ? allClients.filter((c) =>
      normalizeCategory(c.client_category) === 'DYSTRYBUTOR_ODDZIAŁ' &&
      (client.client_code_erp && c.index_of_parent) &&
      String(c.index_of_parent).trim() === String(client.client_code_erp).trim()
    )
    : [];

  // Link „Prowadź do klienta”
  const mapsHref = client.latitude && client.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${client.latitude},${client.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      [client.street, client.postal_code, client.city, client.voivodeship, client.country].filter(Boolean).join(', ')
    )}`;

  return (
    <div>
      {/* Breadcrumbs */}
      <nav className="mb-4 text-sm">
        <Link to="/customers" className="hover:underline">Klienci</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-400">{title}</span>
      </nav>

      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <button className="buttonGreen" onClick={() => setIsAddVisitOpen(true)}>{t('visit.addVisit')}</button>
          <button className="buttonGreen" onClick={() => setIsAddContactOpen(true)}>Dodaj kontakt</button>
          <button className="buttonGreen" onClick={() => setIsEditOpen(true)}>Edytuj</button>
          <button className="buttonRed" onClick={() => navigate(-1)}>Wróć</button>
        </div>
      </div>

      {/* SEKCJA 1: dane główne */}
      <Section title="Dane główne">
        <Grid >
          <Field label={t('addClientModal.companyName')} value={client.company_name} />
          <Field label={t('addClientModal.status')} value={client.status === '1' ? 'Nowy' : 'Zweryfikowany'} />
          <Field label={t('addClientModal.data_veryfication')} value={client.data_veryfication === '1' ? 'Gotowe' : 'Brak danych'} />
          <Field label={t('addClientModal.client_code_erp')} value={client.client_code_erp} />
          <Field label={t('addClientModal.nip')} value={client.nip} />
          <Field label={t('addClientModal.clientCategory')} value={client.client_category} />
          <Field label="Podkategoria klienta" value={client.client_subcategory} />
          <Field label={t('addClientModal.engoTeamDirector')} value={client.engo_team_director} />
          <Field label={t('addClientModal.engoTeamContact')} value={client.engo_team_contact} />
        </Grid>
      </Section>

      {/* SEKCJA 2: oddziały przypisane do centrali */}
      <Section title="Oddziały przypisane do centrali">
        {isHeadOffice ? (
          branches.length > 0 ? (
            <ul className="list-disc pl-6">
              {branches.map(b => (
                <li key={b.id}>
                  <Link to={`/customers/${b.id}`} className="hover:text-lime-500">{b.company_name}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>Brak oddziałów przypisanych do tej centrali.</p>
          )
        ) : (
          <p>Dotyczy tylko klientów kategorii „DYSTRYBUTOR_CENTRALA”.</p>
        )}
      </Section>

      {/* SEKCJA 3: lokalizacja firmy */}
      <Section title={t('addClientModal.location')}>
        <Grid>
          <Field label={t('addClientModal.latitude')} value={client.latitude} />
          <Field label={t('addClientModal.longitude')} value={client.longitude} />
          <Field label={t('addClientModal.street')} value={client.street} />
          <Field label={t('addClientModal.postalCode')} value={client.postal_code} />
          <Field label={t('addClientModal.city')} value={client.city} />
          <Field label={t('addClientModal.voivodeship')} value={client.voivodeship} />
          <Field label={t('addClientModal.country')} value={client.country} />

          <Mapa className='col-span-full z-0'>
            <LocationPicker
              street={client.street}
              city={client.city}
              postal_code={client.postal_code}
              voivodeship={client.voivodeship}
              country={client.country}
              latitude={numOrUndef(client.latitude)}
              longitude={numOrUndef(client.longitude)}
              onCoordsChange={() => { }}  // podgląd – bez zapisu
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

      {/* SEKCJA 4: dodatkowe informacje */}
      <Section title="Dodatkowe informacje">
        <Grid>
          <Field label={t('addClientModal.branches')} value={client.number_of_branches} />
          <Field label={t('addClientModal.salesReps')} value={client.number_of_sales_reps} />
          <Field label={t('addVisitModal.competitionInfo')} value={client.competition} />
          <Field label={t('addClientModal.fairs')} value={client.fairs} />
          <Field label={t('addClientModal.b2b')} value={client.has_b2b_platform} />
          <Field label={t('addClientModal.b2c')} value={client.has_b2c_platform} />
          <Field label={t('addClientModal.privateBrand')} value={client.private_brand === 1 ? (client.private_brand_details || 'Tak') : 'Nie'} />
          <Field label={t('addClientModal.loyaltyProgram')} value={client.loyalty_program === 1 ? (client.loyalty_program_details || 'Tak') : 'Nie'} />
        </Grid>
      </Section>

      {/* SEKCJA 5: dane finansowe */}
      <Section title="Dane finansowe">
        <Grid>
          <Field label={t('addClientModal.turnoverPln')} value={fmtMoney(client.turnover_pln)} />
          <Field label={t('addClientModal.turnoverEur')} value={fmtMoney(client.turnover_eur)} />
          <Field label={t('addClientModal.installationSales')} value={client.installation_sales_share} />
          <Field label={t('addClientModal.automationSales')} value={client.automatic_sales_share} />
          <Field label={t('addClientModal.salesPotential')} value={fmtMoney(client.sales_potential)} />
        </Grid>
      </Section>

      {/* SEKCJA 6: serwisy */}
      <Section title="Serwisy">
        <Grid>
          <Field label={t('addClientModal.facebook')} value={autoHttp(client.facebook)} />
          <Field label={t('addClientModal.webstore')} value={autoHttp(client.has_webstore)} />
          <Field label={t('addClientModal.possibility_www_baner')} value={yesNo(client.possibility_www_baner)} />
          <Field label={t('addClientModal.possibility_graphic_and_posts_FB')} value={yesNo(client.possibility_graphic_and_posts_FB)} />
          <Field label={t('addClientModal.has_ENGO_products_in_webstore')} value={yesNo(client.has_ENGO_products_in_webstore)} />
          <Field label={t('addClientModal.possibility_add_ENGO_products_to_webstore')} value={yesNo(client.possibility_add_ENGO_products_to_webstore)} />
          <Field label={t('addClientModal.possibility_add_articles')} value={yesNo(client.possibility_add_articles)} />
          <Field label={t('addClientModal.auctionService')} value={autoHttp(client.auction_service)} />
          <Field label={t('addClientModal.www')} value={autoHttp(client.www)} />
        </Grid>
      </Section>

      {/* SEKCJA 7: % Struktura sprzedaży */}
      <Section title="% Struktura sprzedaży">
        <Grid>
          <Field label="Instalator" value={client.structure_installer} />
          <Field label="E-commerce" value={client.structure_ecommerce} />
          <Field label="Kowalski (retail)" value={client.structure_retail} />
          <Field label="Podhurt (wholesale)" value={client.structure_wholesaler} />
          <Field label="Inne" value={client.structure_other} />
        </Grid>
      </Section>

      {/* SEKCJA 8: Kontakt (wyszukiwarka jak w modalu) */}
      <Section title="Kontakt">
        <input
          type="text"
          placeholder="Szukaj w kontaktach…"
          value={contactQuery}
          onChange={(e) => setContactQuery(e.target.value)}
          className="mb-4 p-2 border rounded w-full text-white bg-neutral-900 border-neutral-700"
        />

        {(Array.isArray(client.contacts) ? client.contacts : [])
          .filter((c) =>
            Object.values(c || {}).some((val) =>
              String(val ?? '').toLowerCase().includes(contactQuery.toLowerCase())
            )
          )
          .map((c) => (
            <div key={c.id} className="rounded border border-neutral-700 p-3 mb-2">
              <div className="font-medium">{c.name || '—'}</div>
              <div className="text-sm text-neutral-400">
                {c.department || '—'} {c.position ? `• ${c.position}` : ''}
              </div>
              <div className="text-sm mt-1">
                📧 {c.email ? <a className="underline" href={`mailto:${c.email}`}>{c.email}</a> : '—'}
                {' '}|☎️{' '}
                {c.phone ? <a className="underline" href={`tel:${c.phone}`}>{c.phone}</a> : '—'}
              </div>
              <div className="text-sm text-neutral-400 mt-1">{c.function_notes || '—'}</div>
              <div className="text-sm mt-1">Decyzyjność: {c.decision_level || '—'}</div>

              <button
                type="button"
                className="buttonGreenNeg"
                onClick={() => {
                  // dodajemy client_id, bo update.php go wymaga
                  setSelectedContact({ ...c, client_id: client.id, designer_id: null, installer_id: null, deweloper_id: null });
                  setIsEditContactOpen(true);
                }}
              >
                Edytuj
              </button>

            </div>


          )
          )
        }

        
      </Section>

      {/* Modal edycji – Twój komponent */}
      {isEditOpen && (
        <EditClientModal
          isOpen={isEditOpen}
          client={client}
          allClients={allClients}
          onClose={() => setIsEditOpen(false)}
          onClientUpdated={async () => {
            // odśwież dane i pokaż toast
            const detRes = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/get.php?id=${id}`);
            if (detRes && detRes.ok) {
              const detJson = await detRes.json();
              if (detJson?.success) setClient(detJson.client);
            }
            setToast('Zapisano zmiany klienta');
            setTimeout(() => setToast(null), 2200);
          }}
        />
      )}

  <Section title={t('visitsPage.allVisits')}>
        <ClientVisits
          client={client}
          clientId={client?.id}
          key={refreshFlag} // wymusza re-render po dodaniu/edycji
          onEdit={(visit) => {
            if (!canEditVisit(visit, user)) {
              alert(t('visitsPage.editRestricted'));
              return;
            }
            setSelectedVisit(visit);
            setIsEditModalOpen(true);
          }}
        />

        <AddVisitModal
          isOpen={isAddVisitOpen}
          onClose={() => setIsAddVisitOpen(false)}
          onVisitAdded={() => {
            setIsAddVisitOpen(false);
            setRefreshFlag(prev => !prev);
          }}
          // W CustomerDetails mamy jednego klienta – lista z 1 pozycją i blokada zmiany:
          clients={[{ id: client.id, company_name: client.company_name }]}
          fixedClientId={client.id}
        />

        {selectedVisit && (
          <EditVisitModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedVisit(null);
            }}
            onVisitUpdated={() => {
              setIsEditModalOpen(false);
              setSelectedVisit(null);
              setRefreshFlag(prev => !prev); // odśwież listę po edycji
            }}
            visit={selectedVisit}
            clients={[{ id: client.id, company_name: client.company_name }]}
          />
        )}
      </Section>

      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        clientId={client?.id}
        onAdded={(newContact) => {
          // lokalnie dopnij kontakt do klienta (bez przeładowywania strony)
          // załóżmy, że masz w stanie `client` i setter `setClient`
          setClient((prev) => {
            if (!prev) return prev;
            const nextContacts = [...(prev.contacts || []), newContact];
            return { ...prev, contacts: nextContacts };
          });

          // Jeśli wolisz „twarde” odświeżenie z API, zamiast powyższego:
          // fetchClientDetails(client.id);
        }}
      />

      <EditContactModal
        isOpen={isEditContactOpen}
        onClose={() => setIsEditContactOpen(false)}
        contact={selectedContact}
        onUpdated={(updated) => {
          // podmień kontakt w stanie klienta (bez refreshu API)
          setClient((prev) => {
            if (!prev) return prev;
            const next = (prev.contacts || []).map((c) =>
              c.id === updated.id ? { ...c, ...updated } : c
            );
            return { ...prev, contacts: next };
          });

          // jeśli wolisz dociągnąć z API:
          // fetchClientDetails(client.id);
        }}
      />



      {/* Prosty toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-neutral-800 text-white px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
