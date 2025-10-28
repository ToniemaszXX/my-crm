// src/pages/CustomerDetails.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EditClientModal from '../components/EditClientModal';
import { resolveUserLabelById } from '@/utils/usersCache';
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
import { isViewer } from '../utils/roles';
import VisitSummaries from '@/components/VisitSummaries';
import VisitMarketingTasks from '@/components/VisitMarketingTasks';



// Normalize subcategory for stable comparisons: trim, strip diacritics, uppercase, collapse multiple spaces to a single space
const normalizeCategory = (cat) => (
  cat
    ? String(cat)
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase()
    : ''
);
const numOrUndef = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// Compare ERP parent/index codes robustly: trim, allow numeric or string, ignore leading zeros
const eqParentCode = (parent, code) => {
  const a = parent == null ? '' : String(parent).trim();
  const b = code == null ? '' : String(code).trim();
  if (!a || !b) return false;
  const an = Number(a);
  const bn = Number(b);
  if (Number.isFinite(an) && Number.isFinite(bn)) return an === bn;
  const strip0 = (x) => x.replace(/^0+/, '');
  return strip0(a) === strip0(b);
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
  const location = useLocation();
  // Resolve ENGO team names by *_user_id (must be declared before any early returns)
  const [engoNames, setEngoNames] = useState({ dir: '', man: '', cnt: '' });
  const [authorName, setAuthorName] = useState('');
  // Scroll to visits section when ?section=visits-section (or legacy 'visits') is present, after data is loaded
  useEffect(() => {
    if (loading || !client) return;
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
  }, [location.search, id, loading, client]);
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

  const title = useMemo(() => client?.company_name || t('customer.titleFallback'), [client, t]);

  // Resolve ENGO names by *_user_id (place before any early returns to keep hooks order stable)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!client) return;
      const marketId = client.market_id;
      const [dir, man, cnt] = await Promise.all([
        resolveUserLabelById({ id: client.engo_team_director_user_id, marketId, role: 'director' }).catch(() => undefined),
        resolveUserLabelById({ id: client.engo_team_manager_user_id, marketId, role: 'manager' }).catch(() => undefined),
        resolveUserLabelById({ id: client.engo_team_user_id, marketId }).catch(() => undefined),
      ]);
      if (!cancelled) setEngoNames({ dir: dir || '', man: man || '', cnt: cnt || '' });
    })();
    return () => { cancelled = true; };
  }, [client?.id, client?.market_id, client?.engo_team_director_user_id, client?.engo_team_manager_user_id, client?.engo_team_user_id]);

  // Resolve author name (created_by)
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!client?.created_by) { if (!cancel) setAuthorName(''); return; }
      const label = await resolveUserLabelById({ id: client.created_by, marketId: client.market_id }).catch(() => undefined);
      if (!cancel) setAuthorName(label || '');
    })();
    return () => { cancel = true; };
  }, [client?.created_by, client?.market_id]);

  if (loading) return <p>{t('loading')}</p>;

  if (notFound) {
    return (
      <div>
        <nav className="mb-4 text-sm">
          <Link to="/customers" className="hover:underline">{t('customersTitle')}</Link>
          <span className="mx-2">/</span>
          <span>{t('common.notFound')}</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2">{t('customer.notFound')}</h1>
        <p className="mb-4">{t('common.checkUrlOrBack')}</p>
        <Link to="/customers" className="buttonGreen">← {t('common.backToList')}</Link>
      </div>
    );
  }

  if (!client) return null;

  // Oddziały przypisane do centrali (jak w modalu)
  const isHeadOffice = normalizeCategory(client.client_subcategory) === 'DYSTRYBUTOR CENTRALA';
  const branches = isHeadOffice
    ? allClients.filter((c) =>
        normalizeCategory(c.client_subcategory) === 'DYSTRYBUTOR ODDZIAŁ' &&
        eqParentCode(c.index_of_parent, client.client_code_erp)
      )
    : [];

  // Link „Prowadź do klienta”
  const mapsHref = client.latitude && client.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${client.latitude},${client.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      [client.street, client.postal_code, client.city, client.voivodeship, client.country].filter(Boolean).join(', ')
    )}`;

  // Linked distributors for this client (buyers only)
  const linkedDistributors = Array.isArray(client.distributor_ids) && allClients?.length
    ? allClients.filter(c => client.distributor_ids.map(Number).includes(Number(c.id)))
    : [];

  

  return (
    <div>
      {/* Breadcrumbs */}
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

      {/* SEKCJA 1: dane główne */}
    <Section title={t('common.mainData')}>
        <Grid >
          <Field label={t('addClientModal.companyName')} value={client.company_name} />
      <Field label={t('addClientModal.status')} value={client.status === '1' ? t('filter.new') : t('filter.verified')} />
      <Field label={t('addClientModal.data_veryfication')} value={client.data_veryfication === '1' ? t('dataStatus.ready') : t('dataStatus.missing')} />
          <Field label={t('addClientModal.client_code_erp')} value={client.client_code_erp} />
          <Field label={t('addClientModal.nip')} value={client.nip} />
          <Field label={t('common.class')} value={(client.class_category && client.class_category !== '-') ? client.class_category : t('common.noClass')} />
          <Field label={t('addClientModal.clientCategory')} value={client.client_category} />
      <Field label={t('fields.clientSubcategory')} value={client.client_subcategory} />
          <Field label={t('addClientModal.engoTeamDirector')} value={engoNames.dir || '—'} />
          <Field label={t('addClientModal.engoTeamManager') || 'Manager ENGO'} value={engoNames.man || '—'} />
          <Field label={t('addClientModal.engoTeamContact')} value={engoNames.cnt || '—'} />
        </Grid>
      </Section>

      

      {/* SEKCJA 2b: oddziały przypisane do centrali */}
  <Section title={t('customer.sections.hqBranches')}>
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
    <p>{t('customer.noBranchesForHQ')}</p>
          )
        ) : (
      <p>{t('customer.onlyForHQ')}</p>
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

      {/* SEKCJA 2a: Firmy powiązane */}
      <Section title={t('relatedCompanies.title') || 'Firmy powiązane'}>
        {linkedDistributors.length > 0 ? (
          <ul className="list-disc pl-6">
            {linkedDistributors.map(d => (
              <li key={d.id}>
                <Link to={`/customers/${d.id}`} className="hover:text-lime-500">{d.company_name}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('relatedCompanies.empty') || 'Brak powiązanych firm.'}</p>
        )}
      </Section>

      {/* SEKCJA 4: dodatkowe informacje */}
    <Section title={t('common.additionalInfo')}>
        <Grid>
          <Field label={t('addClientModal.branches')} value={client.number_of_branches} />
          <Field label={t('addClientModal.salesReps')} value={client.number_of_sales_reps} />
          <Field label={t('addVisitModal.competitionInfo')} value={client.competition} />
          <Field label={t('addClientModal.fairs')} value={client.fairs} />
          <Field label={t('addClientModal.b2b')} value={client.has_b2b_platform} />
          <Field label={t('addClientModal.b2c')} value={client.has_b2c_platform} />
      <Field label={t('addClientModal.privateBrand')} value={client.private_brand === 1 ? (client.private_brand_details || t('addClientModal.yes')) : t('addClientModal.no')} />
      <Field label={t('addClientModal.loyaltyProgram')} value={client.loyalty_program === 1 ? (client.loyalty_program_details || t('addClientModal.yes')) : t('addClientModal.no')} />
        </Grid>
      </Section>

      {/* SEKCJA 5: dane finansowe */}
  <Section title={t('customer.sections.financialData')}>
        <Grid>
          <Field label={t('addClientModal.turnoverPln')} value={fmtMoney(client.turnover_pln)} />
          <Field label={t('addClientModal.turnoverEur')} value={fmtMoney(client.turnover_eur)} />
          <Field label={t('addClientModal.installationSales')} value={client.installation_sales_share} />
          <Field label={t('addClientModal.automationSales')} value={client.automatic_sales_share} />
          <Field label={t('addClientModal.salesPotential')} value={fmtMoney(client.sales_potential)} />
        </Grid>
      </Section>

      {/* SEKCJA 6: serwisy */}
  <Section title={t('customer.sections.services')}>
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
    <Section title={t('customer.sections.salesStructure')}>
        <Grid>
      <Field label={t('addClientModal.structure.installer')} value={client.structure_installer} />
      <Field label={t('addClientModal.structure.ecommerce')} value={client.structure_ecommerce} />
      <Field label={t('addClientModal.structure.retail')} value={client.structure_retail} />
      <Field label={t('addClientModal.structure.wholesaler')} value={client.structure_wholesaler} />
      <Field label={t('addClientModal.structure.other')} value={client.structure_other} />
        </Grid>
      </Section>

      {/* SEKCJA 8: Kontakt (wyszukiwarka jak w modalu) */}
    <Section title={t('addClientModal.contact')}>
        <input
          type="text"
          placeholder={t('editClientModal.searchContact')}
          value={contactQuery}
          onChange={(e) => setContactQuery(e.target.value)}
          className="mb-4 p-2 border rounded w-full text-white bg-neutral-900 border-neutral-700"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Array.isArray(client.contacts) ? client.contacts : [])
            .filter((c) =>
              Object.values(c || {}).some((val) =>
                String(val ?? '').toLowerCase().includes(contactQuery.toLowerCase())
              )
            )
            .map((c) => {
              const splitList = (val) => String(val || '')
                .split(';')
                .map(s => s.trim())
                .filter(Boolean);
              const emails = splitList(c.email);
              const phones = splitList(c.phone);
              return (
              <div key={c.id} className="rounded border border-neutral-700 p-3">
                <div className="font-medium">{`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || '—'}</div>
                <div className="text-sm text-neutral-400">
                  {c.department || '—'} {c.position ? `• ${c.position}` : ''}
                </div>
                <div className="text-sm mt-1 space-y-0.5">
                  <div>
                    📧 {emails.length > 0 ? (
                      <div className="inline-flex flex-col gap-0.5 align-top">
                        {emails.map((e, i) => (
                          <a key={i} className="underline" href={`mailto:${e}`}>{e}</a>
                        ))}
                      </div>
                    ) : '—'}
                  </div>
                  <div>
                    ☎️ {phones.length > 0 ? (
                      <div className="inline-flex flex-col gap-0.5 align-top">
                        {phones.map((p, i) => (
                          <a key={i} className="underline" href={`tel:${p}`}>{p}</a>
                        ))}
                      </div>
                    ) : '—'}
                  </div>
                </div>
                <div className="text-sm text-neutral-400 mt-1">{c.function_notes || '—'}</div>
                <div className="text-sm mt-1">{t('addClientModal.decisionLevel')}: {c.decision_level || '—'}</div>
                {!isViewer(user) && (
                  <button
                    type="button"
                    className="buttonGreenNeg mt-2"
                    onClick={() => {
                      // dodajemy client_id, bo update.php go wymaga
                      setSelectedContact({ ...c, client_id: client.id, designer_id: null, installer_id: null, deweloper_id: null });
                      setIsEditContactOpen(true);
                    }}
                  >
                    {t('edit')}
                  </button>
                )}
              </div>
            )})}
        </div>
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
            setToast(t('toast.clientSaved'));
            setTimeout(() => setToast(null), 2200);
          }}
        />
      )}

      {/* Grid directly above visits: left column = post-meeting summaries (half width) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title={t('visit.postMeetingSummaries') || 'Podsumowania po spotkaniu'}>
          <VisitSummaries
            entityType="client"
            entityId={client.id}
            marketId={client.market_id}
            reloadTrigger={refreshFlag}
          />
        </Section>
        <Section title={t('addVisitModal.marketingTasks') || 'Zadania marketingowe'}>
          <VisitMarketingTasks
            entityType="client"
            entityId={client.id}
            marketId={client.market_id}
            reloadTrigger={refreshFlag}
          />
        </Section>
      </div>

  <Section id="visits-section" title={t('visitsPage.allVisits')}>
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
