import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AddClientModal from '../components/AddClientModal';
import AddInstallerModal from '../components/AddInstallerModal';
import EditInstallerModal from '../components/EditInstallerModal';
import AddDesignerModal from '../components/AddDesignerModal';
import AddDeweloperModal from '../components/AddDeweloperModal';
// import EditClientModal from '../components/EditClientModal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAdmin, isZarzad, isAdminManager, isAdminZarzad } from '../utils/roles';
import { europeanCountries } from '../components/CountrySelect';
import useSessionChecker from '../hooks/useSessionChecker';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import CountrySelect from '../components/CountrySelect';
import { resolveUserLabelById } from '@/utils/usersCache';



function Customers() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddInstallerOpen, setIsAddInstallerOpen] = useState(false);
  const [isEditInstallerOpen, setIsEditInstallerOpen] = useState(false);
  const [selectedInstaller, setSelectedInstaller] = useState(null);
  const [isAddDesignerOpen, setIsAddDesignerOpen] = useState(false);
  const [isAddDeveloperOpen, setIsAddDeveloperOpen] = useState(false);
  // Designer details are now a page route
  // const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const [selectedClient, setSelectedClient] = useState(null);
  const { t } = useTranslation();
  const [meModeOnly, setMeModeOnly] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterClassCategory, setFilterClassCategory] = useState('');
  const [filterEngoTeamContact, setfilterEngoTeamContact] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  // Pagination state
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('customers.pageSize');
    return saved ? Number(saved) : 50; // default 50
  });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [engoContactsOptions, setEngoContactsOptions] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pageInput, setPageInput] = useState('1');
  const [engoNameMap, setEngoNameMap] = useState({}); // id -> label resolved


  useEffect(() => {
    // Początkowe pobranie opcji Engo contacts (raz) do selecta
    fetchEngoContactsOptions();
  }, []);

  // Debounce search input to limit server calls
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);


  //filtracja me mode

  const normalizeText = (text) => {
    if (!text) return '';

    const polishMap = {
      ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n',
      ó: 'o', ś: 's', ź: 'z', ż: 'z',
      Ą: 'a', Ć: 'c', Ę: 'e', Ł: 'l', Ń: 'n',
      Ó: 'o', Ś: 's', Ź: 'z', Ż: 'z'
    };


    return text
      .trim()
      .toLowerCase()
      .split('')
      .map(char => polishMap[char] || char)
      .join('')
      .replace(/\s+/g, '.');            // zamienia spacje na kropki
  };


  const isAssignedToUser = (contactField, userName) => {
    const normalizedUser = normalizeText(userName);

    const contactList = Array.isArray(contactField)
      ? contactField
      : (contactField || '').split(';');

    const normalizedList = contactList.map(name => normalizeText(name));
    return normalizedList.includes(normalizedUser);
  };


  // Reset strony przy zmianie filtrów/szukania, by nie wypaść poza zakres
  useEffect(() => {
    setPage(1);
  }, [searchQuery, meModeOnly, filterStatus, filterCountry, filterCategory, filterClassCategory, filterEngoTeamContact, filterDateFrom, filterDateTo]);

  // Pobranie danych z BE przy zmianach paginacji/filtrów/szukania
  useEffect(() => {
    if (loading) return;
    fetchClients();
  }, [page, pageSize, debouncedQuery, meModeOnly, filterStatus, filterCountry, filterCategory, filterClassCategory, filterEngoTeamContact, filterDateFrom, filterDateTo, loading]);

  const resetFilters = () => {
    setFilterStatus('');
    setFilterCountry('');
    setFilterCategory('');
  setFilterClassCategory('');
    setfilterEngoTeamContact('');
    setSearchQuery('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(1);
  };

  // Persist pageSize choice
  useEffect(() => {
    localStorage.setItem('customers.pageSize', String(pageSize));
  }, [pageSize]);

  // Derived pagination values
  const total = totalCount || filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(total, startIndex + pageSize);
  // BE zwraca już odpowiednią stronę, więc renderujemy bez local slice
  const pagedClients = filteredClients;

  // Sync input with derived currentPage
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // Clamp page state when totalPages shrinks
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages]);

  const commitPageInput = () => {
    const n = parseInt(pageInput, 10);
    if (Number.isNaN(n)) {
      setPageInput(String(currentPage));
      return;
    }
    const clamped = Math.max(1, Math.min(totalPages, n));
    setPage(clamped);
    setPageInput(String(clamped));
  };

  // Resolve ENGO names by *_user_id for rows being rendered (robust to missing server-provided names)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = Array.isArray(pagedClients) ? pagedClients : [];
      // collect unique (id, market) for contact role; include manager/director optionally
      const tuples = [];
      const seen = new Set();
      for (const r of rows) {
        const marketId = r?.market_id;
        const ids = [r?.engo_team_user_id, r?.engo_team_manager_user_id, r?.engo_team_director_user_id].filter((x) => x != null && x !== '');
        for (const id of ids) {
          const key = `${id}|${marketId||''}`;
          if (seen.has(key)) continue;
          seen.add(key);
          tuples.push({ id, marketId });
        }
      }
      if (tuples.length === 0) { if (!cancelled) setEngoNameMap({}); return; }
      const results = await Promise.all(
        tuples.map(({ id, marketId }) => resolveUserLabelById({ id, marketId }).then((label) => ({ id: Number(id), label: label || '' })).catch(() => ({ id: Number(id), label: '' })))
      );
      if (cancelled) return;
      const map = {};
      for (const r of results) { if (r.label) map[Number(r.id)] = r.label; }
      setEngoNameMap(map);
    })();
    return () => { cancelled = true; };
  }, [pagedClients]);

  const fetchClients = async () => {
    try {
      setListLoading(true);
      const payload = {
        page,
        per_page: pageSize,
        search: debouncedQuery || '',
        status: filterStatus || '',
        country: filterCountry || '',
        subcategory: filterCategory || '',
        classCategory: filterClassCategory || '',
        // Switch to filtering by user ID
        engoTeamUserId: (meModeOnly && user?.id)
          ? Number(user.id)
          : (filterEngoTeamContact ? Number(filterEngoTeamContact) : 0),
  dateFrom: filterDateFrom || '',
  dateTo: filterDateTo || '',
      };
      const resp = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/entities/list_combined.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp) return;
      const data = await resp.json();
      if (data?.success) {
        setClients(data.data || []);
        setFilteredClients(data.data || []);
        setTotalCount(Number(data.total || 0));
      } else {
        setClients([]);
        setFilteredClients([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('fetchClients error', err);
      setClients([]);
      setFilteredClients([]);
      setTotalCount(0);
    } finally {
      setListLoading(false);
    }
  };

  const fetchEngoContactsOptions = async () => {
    try {
  const resp = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/entities/list_engo_contacts.php`);
      if (!resp) return;
      const data = await resp.json();
      // Expecting [{id, label}]
      const options = Array.isArray(data?.contacts) ? data.contacts : [];
      setEngoContactsOptions(options);
    } catch (e) {
      console.warn('fetchEngoContactsOptions error', e);
    }
  };


  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // const handleEdit = (client) => {
  //   setSelectedClient(client);
  //   setIsEditModalOpen(true);
  // };

  const handleEdit = (client) => {
    navigate(`/customers/${client.id}`);
  };

  const handleEditInstaller = (installer) => {
    navigate(`/installers/${installer.id}`);
  };

  const handleDeleteDeveloper = async (id) => {
    const confirm = window.confirm(t('alertClientRemove'));
    if (!confirm) return;

    const canProceed = await checkSessionBeforeSubmit();
    if (!canProceed) return;

    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Developers/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response) return;
      const data = await response.json();
      if (data.success) {
        alert(t('clientDeleted'));
        fetchClients();
      } else {
        alert(t('clientDeleteError'));
      }
    } catch (error) {
      console.error('Delete developer error:', error);
      alert(t('clientDeleteClientError'));
    }
  };

  const handleEditDesigner = (designer) => {
    navigate(`/designers/${designer.id}`);
  };

  const handleEditDeveloper = (developer) => {
    navigate(`/developers/${developer.id}`);
  };

  if (loading) return <p>{t('loading')}</p>;

  const handleDelete = async (id) => {
    const confirm = window.confirm(t('alertClientRemove'));
    if (!confirm) return;

    const canProceed = await checkSessionBeforeSubmit(); // 🔐 sprawdzenie sesji
    if (!canProceed) return;

    try {
  const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response) return; // sesja mogła wygasnąć — fetchWithAuth zrobił redirect

      const data = await response.json();

      if (data.success) {
        alert(t('clientDeleted'));
        fetchClients();
      } else {
        alert(t('clientDeleteError'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(t('clientDeleteClientError'));
    }
  };

  const handleDeleteInstaller = async (id) => {
    const confirm = window.confirm(t('alertClientRemove'));
    if (!confirm) return;

    const canProceed = await checkSessionBeforeSubmit();
    if (!canProceed) return;

    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Installers/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response) return;
      const data = await response.json();
      if (data.success) {
        alert(t('clientDeleted'));
        fetchClients();
      } else {
        alert(t('clientDeleteError'));
      }
    } catch (error) {
      console.error('Delete installer error:', error);
      alert(t('clientDeleteClientError'));
    }
  };

  const handleDeleteDesigner = async (id) => {
    const confirm = window.confirm(t('alertClientRemove'));
    if (!confirm) return;

    const canProceed = await checkSessionBeforeSubmit();
    if (!canProceed) return;

    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/Designers/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response) return;
      const data = await response.json();
      if (data.success) {
        alert(t('clientDeleted'));
        fetchClients();
      } else {
        alert(t('clientDeleteError'));
      }
    } catch (error) {
      console.error('Delete designer error:', error);
      alert(t('clientDeleteClientError'));
    }
  };


  const uniqueEngoContacts = engoContactsOptions;



  return (

  <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">{t('customersTitle')}</h1>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 items-center flex-wrap">
            {/* Dodaj klienta: dostępne dla użytkowników niebędących zarządem */}
            {/* {isAdminManager(user) && ( */}
              <button onClick={() => setIsAddModalOpen(true)} className="buttonGreen">
                {t('addClient')}
              </button>
            {/* )} */}

            {/* Dodaj instalatora/dewelopera/projektanta: tylko dla admina */}
            {isAdminManager(user) && (
              <>
                <button onClick={() => setIsAddInstallerOpen(true)} className="buttonGreen">
                  {t('addInstaler')}
                </button>
                  </>
            )}
            {isAdminZarzad(user) && (
              <>
                <button onClick={() => setIsAddDeveloperOpen(true)} className="buttonGreen">
                  {t('addDeweloper')}
                </button>
                <button onClick={() => setIsAddDesignerOpen(true)} className="buttonGreen">
                  {t('addDesigner')}
                </button>
              </>
            )}

            <label className="flex items-center gap-2">
              <input
                className='mb-0'
                type="checkbox"
                checked={meModeOnly}
                onChange={(e) => setMeModeOnly(e.target.checked)}
              />
              {t('meMode')}
            </label>


          </div>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="p-2 w-full sm:w-72 border rounded mb-0"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className='pl-1 pr-1 pt-2 pb-2 rounded border'>
            <option value="">{t('filter.chooseStatus')}</option>
            <option value="1">{t('filter.new')}</option>
            <option value="0">{t('filter.verified')}</option>
          </select>

          {!(user?.singleMarketId === 1) && (
            <CountrySelect
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              hideLabel={true}
              // label={t('filter.chooseContry')}
              className="pl-1 pr-1 pt-2 pb-2 rounded border"
            />
          )}


          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className='pl-1 pr-1 pt-2 pb-2 rounded border'>
            <option value="">{t('addClientModal.selectCategory')}</option>
            <option value="GRUPA ZAKUPOWA">{t('addClientModal.categories.GRUPA_ZAKUPOWA')}</option>
            <option value="DEWELOPER">{t('addClientModal.categories.DEWELOPER')}</option>
            <option value="DYSTRYBUTOR CENTRALA">{t('addClientModal.categories.DYSTRYBUTOR_CENTRALA')}</option>
            <option value="DYSTRYBUTOR MAGAZYN">{t('addClientModal.categories.DYSTRYBUTOR_MAGAZYN')}</option>
            <option value="DYSTRYBUTOR ODDZIAŁ">{t('addClientModal.categories.DYSTRYBUTOR_ODDZIAŁ')}</option>
            <option value="PODHURT">{t('addClientModal.categories.PODHURT')}</option>
            <option value="INSTALATOR FIRMA">{t('addClientModal.categories.INSTALATOR_FIRMA')}</option>
            <option value="INSTALATOR ENGO PLUS">{t('addClientModal.categories.ENGO_PLUS')}</option>
            <option value="PROJEKTANT">{t('addClientModal.categories.PROJEKTANT')}</option>
            <option value="KLIENT POTENCJALNY">{t('addClientModal.categories.KLIENT_POTENCJALNY')}</option>
          </select>

          <select value={filterClassCategory} onChange={(e) => setFilterClassCategory(e.target.value)} className='pl-1 pr-1 pt-2 pb-2 rounded border'>
            <option value="">{t('filter.class')}</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="-">{t('common.noClass')}</option>
          </select>

          <select value={filterEngoTeamContact} onChange={(e) => setfilterEngoTeamContact(e.target.value)} className='pl-1 pr-1 pt-2 pb-2 rounded border'>
            <option value="">{t('addClientModal.chooseMember')}</option>
            {uniqueEngoContacts.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>

          <div className="flex gap-4 items-center flex-wrap">
            <div>
              <label className="text-sm text-neutral-300 block">{t('filter.fromDate') || 'Data od'}</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-300 block">{t('filter.toDate') || 'Data do'}</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
          </div>

          <button onClick={resetFilters} className="buttonRed">
            {t('filter.reset')}
          </button>
        </div>
      </div>



      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClientAdded={fetchClients}
        allClients={clients}
      />

      <AddInstallerModal
        isOpen={isAddInstallerOpen}
        onClose={() => setIsAddInstallerOpen(false)}
        onInstallerAdded={fetchClients}
      />

      <AddDesignerModal
        isOpen={isAddDesignerOpen}
        onClose={() => setIsAddDesignerOpen(false)}
        onDesignerAdded={fetchClients}
      />

      <AddDeweloperModal
        isOpen={isAddDeveloperOpen}
        onClose={() => setIsAddDeveloperOpen(false)}
        onDeveloperAdded={fetchClients}
      />

      {false && selectedInstaller && (
        <EditInstallerModal
          isOpen={isEditInstallerOpen}
          installer={selectedInstaller}
          onClose={() => { setIsEditInstallerOpen(false); setSelectedInstaller(null); }}
          onInstallerUpdated={() => { setIsEditInstallerOpen(false); setSelectedInstaller(null); fetchClients(); }}
        />
      )}

      {/* {selectedClient && (
        <EditClientModal
          isOpen={isEditModalOpen}
          client={selectedClient}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedClient(null);
          }}
          onClientUpdated={fetchClients}
          allClients={clients}
        />
      )} */}

  {/* Scroll container for the table with sticky header */}
  <div className="w-full" style={{ height: 'calc(100vh - 320px)', overflowY: 'auto', boxSizing: 'border-box' }}>
  <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead className=''>
          <tr>
            <th className="sticky top-0 bg-white z-10">{t('tableHeaders.number')}</th>
            <th className="sticky top-0 bg-white z-10">{t('tableHeaders.clientCode')}</th>
            <th className="sticky top-0 bg-white z-10">{t('tableHeaders.clientStatus')}</th>
            <th className="sticky top-0 bg-white z-10">{t('tableHeaders.dataStatus')}</th>
            <th className="sticky top-0 bg-white z-10">{t('tableHeaders.company')}</th>
            <th className="sticky top-0 bg-white z-10">{t('tableHeaders.category')}</th>
            <th className="sticky top-0 bg-white z-10">{t('common.class')}</th>
            <th className="sticky top-0 bg-white z-10">{t('tableHeaders.country')}</th>
            <th className='portrait:hidden sticky top-0 bg-white z-10'>{t('tableHeaders.city')}</th>
            <th className='portrait:hidden sticky top-0 bg-white z-10'>{t('tableHeaders.salesperson')}</th>
            <th className="sticky top-0 bg-white z-10">{t('tableHeaders.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {listLoading ? (
            Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
              <tr key={`skel-${i}`} className="border-b border-b-neutral-200">
                <td><div className="h-4 w-8 bg-neutral-200 rounded animate-pulse" /></td>
                <td><div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" /></td>
                <td><div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" /></td>
                <td><div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" /></td>
                <td><div className="h-4 w-48 bg-neutral-200 rounded animate-pulse" /></td>
                <td><div className="h-4 w-40 bg-neutral-200 rounded animate-pulse" /></td>
                <td><div className="h-4 w-10 bg-neutral-200 rounded animate-pulse" /></td>
                <td><div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" /></td>
                <td className='portrait:hidden'><div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" /></td>
                <td className='portrait:hidden'><div className="h-4 w-36 bg-neutral-200 rounded animate-pulse" /></td>
                <td>
                  <div className="flex justify-center gap-2">
                    <div className="h-8 w-20 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-8 w-20 bg-neutral-200 rounded animate-pulse" />
                  </div>
                </td>
              </tr>
            ))
          ) : pagedClients.length > 0 ? (
            pagedClients.map((client, index) => (
              <tr key={`${client.type || 'client'}-${client.id}`} className='border-b border-b-neutral-300 text-center'>
                <td>{startIndex + index + 1}</td>
                <td>{client.client_code_erp || '-'}</td>
                <td className={client.status === "1" ? "text-green-600 font-semibold" : "text-neutral-300 font-semibold"}>{client.status === "1" ? "Nowy" : "Zweryfikowany"}</td>
                <td className={client.data_veryfication === "1" ? "text-neutral-300 font-semibold" : "text-red-600 font-semibold"}>{client.data_veryfication === "1" ? "Gotowe" : "Brak danych"}</td>
                <td>{client.company_name || '-'}</td>
                <td>{client.client_subcategory || '-'}</td>
                <td>{(client.class_category && client.class_category !== '-') ? client.class_category : t('common.noClass')}</td>
                <td>{client.country || '-'}</td>
                <td className='portrait:hidden'>{client.city || '-'}</td>
                <td className='portrait:hidden'>
                  {
                    (client.engo_team_user_id && engoNameMap[Number(client.engo_team_user_id)])
                    || client.engo_team_user_name
                    || client.engo_team_contact
                    || '-'
                  }
                </td>

                <td style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {(!client.type || client.type === 'client') ? (
                    <>
                      <button onClick={() => handleEdit(client)} className='buttonGreen2'>{t('details')}</button>
                      {isAdmin(user) && (
                        <button onClick={() => handleDelete(client.id)} className="buttonRed2">{t('delete')}</button>
                      )}
                    </>
                  ) : client.type === 'installer' ? (
                    <>
                      <button onClick={() => handleEditInstaller(client)} className='buttonGreen2'>{t('details')}</button>
                      {isAdmin(user) && (
                        <button onClick={() => handleDeleteInstaller(client.id)} className="buttonRed2">{t('delete')}</button>
                      )}
                    </>
                  ) : client.type === 'developer' ? (
                    <>
                      <button onClick={() => handleEditDeveloper(client)} className='buttonGreen2'>{t('details')}</button>
                      {isAdmin(user) && (
                        <button onClick={() => handleDeleteDeveloper(client.id)} className="buttonRed2">{t('delete')}</button>
                      )}
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditDesigner(client)} className='buttonGreen2'>{t('details')}</button>
                      {isAdmin(user) && (
                        <button onClick={() => handleDeleteDesigner(client.id)} className="buttonRed2">{t('delete')}</button>
                      )}
                    </>
                  )}
                </td>


              </tr>
            ))
          ) : (
            <tr>
        <td colSpan="11" style={{ textAlign: 'center' }}>{t('noClientsFound')}</td>
            </tr>
          )}
        </tbody>
      </table>
  </div>

      {/* Pagination controls and range info */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-neutral-500">
          {total > 0
            ? `${t('common.showing') || 'Pokazano'} ${startIndex + 1}–${endIndex} ${t('common.of') || 'z'} ${total}`
            : `${t('noClientsFound')}`}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-500 mr-2">
            {t('common.perPage') || 'Na stronę'}
          </label>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="p-2 border rounded"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
          <button
            className="buttonGreen2 disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || listLoading}
          >
            {t('common.prev') || 'Prev'}
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span>{t('common.page') || 'Strona'}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="\\d*"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitPageInput();
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
              }}
              onWheel={(e) => e.preventDefault()}
              onBlur={commitPageInput}
              disabled={listLoading}
              className="w-16 px-2 py-1 border rounded text-center"
            />
            <span>/ {totalPages}</span>
          </div>
          <button
            className="buttonGreen2 disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || listLoading}
          >
            {t('common.next') || 'Next'}
          </button>
        </div>
      </div>


    </div>
  );
}

export default Customers;
