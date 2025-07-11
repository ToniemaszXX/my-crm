import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AddClientModal from '../components/AddClientModal';
import EditClientModal from '../components/EditClientModal';
import { useTranslation } from 'react-i18next';
import { isAdmin, isZarzad } from '../utils/roles';
import { europeanCountries } from '../components/CountrySelect';
import useSessionChecker from '../hooks/useSessionChecker';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { checkSessionBeforeSubmit } from '../utils/checkSessionBeforeSubmit';
import CountrySelect from '../components/CountrySelect';



function Customers() {
  const { user, loading } = useAuth();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const { t } = useTranslation();
  const [meModeOnly, setMeModeOnly] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterEngoTeamContact, setfilterEngoTeamContact] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');




  useEffect(() => {
    fetchClients();
  }, []);


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





  // Odśwież listę po zmianie klientów lub zapytania
  useEffect(() => {
    let baseClients = [...clients];

    const currentUserName = user?.username || '';

    // Me mode filtering first
    if (meModeOnly && currentUserName) {
      baseClients = baseClients.filter(client => {
        const result = isAssignedToUser(client.engo_team_contact, currentUserName);
        return result;
      });
    }

    // Filter by status
    if (filterStatus !== '') {
      baseClients = baseClients.filter(client => client.status === filterStatus);
    }

    // Filter by country
    if (filterCountry !== '') {
      baseClients = baseClients.filter(client => client.country === filterCountry);
    }

    // Filter by client category
    if (filterCategory !== '') {
      const normalizedCategory = filterCategory.trim().replace(/\s+/g, '_');
      baseClients = baseClients.filter(client =>
        (client.client_category || '').trim().replace(/\s+/g, '_') === normalizedCategory
      );
    }


    // Filter by Engo team contact
    if (filterEngoTeamContact !== '') {
      baseClients = baseClients.filter(client =>
        isAssignedToUser(client.engo_team_contact, filterEngoTeamContact));
    }

    // Filter by date range (created_at format: "YYYY-MM-DD HH:MM:SS")
    if (filterDateFrom !== '' || filterDateTo !== '') {
      baseClients = baseClients.filter(client => {
        if (!client.created_at) return false;

        const dateOnly = client.created_at.split(' ')[0]; // "2025-06-01"

        if (filterDateFrom && dateOnly < filterDateFrom) return false;
        if (filterDateTo && dateOnly > filterDateTo) return false;

        return true;
      });
    }



    // Then apply search query on top of that
    if (searchQuery.trim() === '') {
      setFilteredClients(baseClients);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = baseClients.filter((client) => {
        const query = lowerQuery;

        const baseMatch =
          (client.company_name || '').toLowerCase().includes(query) ||
          (client.client_code_erp || '').toLowerCase().includes(query) ||
          (client.status || '').includes(query) ||
          (client.data_veryfication || '').includes(query) ||
          (client.city || '').toLowerCase().includes(query) ||
          (client.engo_team_contact || '').toLowerCase().includes(query) ||
          (client.country || '').toLowerCase().includes(query) ||
          (client.nip || '').toLowerCase().includes(query) ||
          (client.street || '').toLowerCase().includes(query) ||
          (client.postal_code || '').toLowerCase().includes(query) ||
          (client.voivodeship || '').toLowerCase().includes(query) ||
          (client.client_category || '').toLowerCase().includes(query) ||
          (client.fairs || '').toLowerCase().includes(query) ||
          (client.competition || '').toLowerCase().includes(query) ||
          (client.number_of_branches || '').toLowerCase().includes(query) ||
          (client.number_of_sales_reps || '').toLowerCase().includes(query) ||
          (client.www || '').toLowerCase().includes(query) ||
          (client.turnover_pln || '').toLowerCase().includes(query) ||
          (client.turnover_eur || '').toLowerCase().includes(query) ||
          (client.installation_sales_share || '').toLowerCase().includes(query) ||
          (client.automatic_sales_share || '').toLowerCase().includes(query) ||
          (client.sales_potential || '').toLowerCase().includes(query) ||
          (client.has_webstore || '').toLowerCase().includes(query) ||
          (client.has_b2b_platform || '').toLowerCase().includes(query) ||
          (client.has_b2c_platform || '').toLowerCase().includes(query) ||
          (client.facebook || '').toLowerCase().includes(query) ||
          (client.auction_service || '').toLowerCase().includes(query) ||
          (client.private_bran || '').toLowerCase().includes(query) ||
          (client.private_brand_details || '').toLowerCase().includes(query) ||
          (client.loyalty_progra || '').toLowerCase().includes(query) ||
          (client.loyalty_program_details || '').toLowerCase().includes(query) ||
          (client.structure_installe || '').toLowerCase().includes(query) ||
          (client.structure_wholesale || '').toLowerCase().includes(query) ||
          (client.structure_ecommerc || '').toLowerCase().includes(query) ||
          (client.structure_retai || '').toLowerCase().includes(query) ||
          (client.structure_oth || '').toLowerCase().includes(query);

        const contactsMatch = Array.isArray(client.contacts)
          ? client.contacts.some(contact =>
            Object.values(contact).some(
              (val) => val && String(val).toLowerCase().includes(query)
            )
          )
          : false;

        return baseMatch || contactsMatch;
      });
      setFilteredClients(filtered);
    }
  }, [clients, searchQuery, meModeOnly, user, filterStatus, filterCountry, filterCategory, filterEngoTeamContact, filterDateFrom, filterDateTo]);

  const resetFilters = () => {
    setFilterStatus('');
    setFilterCountry('');
    setFilterCategory('');
    setfilterEngoTeamContact('');
    setSearchQuery('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const fetchClients = async () => {
    const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/list.php`);
    const data = await response.json();
    if (data.success) {
      const sortedClients = [...data.clients].sort((a, b) => {
        // Najpierw według statusu (Nowy na górze)
        if (a.status === "1" && b.status !== "1") return -1;
        if (a.status !== "1" && b.status === "1") return 1;

        // Potem alfabetycznie po nazwie firmy (case-insensitive)
        const nameA = (a.company_name || '').toLowerCase();
        const nameB = (b.company_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setClients(sortedClients);
    }
  };


  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
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


  const uniqueEngoContacts = [
    ...new Set(
      clients
        .flatMap(c =>
          (c.engo_team_contact || '')
            .split(';')
            .map(name => name.trim())
            .filter(Boolean)
        )
    )
  ];



  return (



    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">{t('customersTitle')}</h1>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 items-center flex-wrap">
            {!isZarzad(user) && (
              <button onClick={() => setIsAddModalOpen(true)} className="buttonGreen">
                {t('addClient')}
              </button>
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

          <div className="w-full sm:w-auto">
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

          <CountrySelect
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            hideLabel={true}
            // label={t('filter.chooseContry')}
            className="pl-1 pr-1 pt-2 pb-2 rounded border"
          />


          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className='pl-1 pr-1 pt-2 pb-2 rounded border'>
            <option value="">{t('addClientModal.selectCategory')}</option>
            <option value="CENTRALA_SIEĆ">{t('addClientModal.categories.CENTRALA_SIEĆ')}</option>
            <option value="DEWELOPER">{t('addClientModal.categories.DEWELOPER')}</option>
            <option value="DYSTRYBUTOR">{t('addClientModal.categories.DYSTRYBUTOR')}</option>
            <option value="DYSTRYBUTOR_CENTRALA">{t('addClientModal.categories.DYSTRYBUTOR_CENTRALA')}</option>
            <option value="DYSTRYBUTOR_MAGAZYN">{t('addClientModal.categories.DYSTRYBUTOR_MAGAZYN')}</option>
            <option value="DYSTRYBUTOR_ODDZIAŁ">{t('addClientModal.categories.DYSTRYBUTOR_ODDZIAŁ')}</option>
            <option value="ENGO_PLUS">{t('addClientModal.categories.ENGO_PLUS')}</option>
            <option value="INSTALATOR">{t('addClientModal.categories.INSTALATOR')}</option>
            <option value="PODHURT">{t('addClientModal.categories.PODHURT')}</option>
            <option value="PODHURT_ELEKTRYKA">{t('addClientModal.categories.PODHURT_ELEKTRYKA')}</option>
            <option value="PROJEKTANT">{t('addClientModal.categories.PROJEKTANT')}</option>
          </select>

          <select value={filterEngoTeamContact} onChange={(e) => setfilterEngoTeamContact(e.target.value)} className='pl-1 pr-1 pt-2 pb-2 rounded border'>
            <option value="">{t('addClientModal.chooseMember')}</option>
            {uniqueEngoContacts.map((contact) => (
              <option key={contact} value={contact}>
                {contact}
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

      {selectedClient && (
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
      )}

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead className='bg-neutral-600'>
          <tr>
            <th>{t('tableHeaders.number')}</th>
            <th>{t('tableHeaders.clientCode')}</th>
            <th>{t('tableHeaders.clientStatus')}</th>
            <th>{t('tableHeaders.company')}</th>
            <th>{t('tableHeaders.company')}</th>
            <th>{t('tableHeaders.country')}</th>
            <th className='portrait:hidden'>{t('tableHeaders.city')}</th>
            <th className='portrait:hidden'>{t('tableHeaders.salesperson')}</th>
            <th>{t('tableHeaders.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.length > 0 ? (
            filteredClients.map((client, index) => (
              <tr key={client.id} className='border-b border-b-neutral-300 text-center'>
                <td>{index + 1}</td>
                <td>{client.client_code_erp || '-'}</td>
                <td className={client.status === "1" ? "text-green-600 font-semibold" : "text-neutral-300 font-semibold"}>{client.status === "1" ? "Nowy" : "Zweryfikowany"}</td>
                <td className={client.data_veryfication === "1" ? "text-neutral-300 font-semibold" : "text-red-600 font-semibold"}>{client.data_veryfication === "1" ? "Gotowe" : "Brak danych"}</td>
                <td>{client.company_name || '-'}</td>
                <td>{client.country || '-'}</td>
                <td className='portrait:hidden'>{client.city || '-'}</td>
                <td className='portrait:hidden'>{client.engo_team_contact || '-'}</td>

                <td style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button onClick={() => handleEdit(client)} className='buttonGreen2'>{t('details')}</button>
                  {isAdmin(user) && (
                    <button onClick={() => handleDelete(client.id)} className="buttonRed2">{t('delete')}</button>
                  )}
                </td>


              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>{t('noClientsFound')}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Customers;
