import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import AddClientModal from '../components/AddClientModal';
import EditClientModal from '../components/EditClientModal';
import { useTranslation } from 'react-i18next';

function Customers() {
  const loading = useAuth();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchClients();
  }, []);

  // Odśwież listę po zmianie klientów lub zapytania
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = clients.filter(
        (client) =>
          (client.company_name || '').toLowerCase().includes(lowerQuery) ||
          (client.city || '').toLowerCase().includes(lowerQuery) ||
          (client.engo_team_contact || '').toLowerCase().includes(lowerQuery) ||
          (client.country || '').toLowerCase().includes(lowerQuery) ||
          (client.nip || '').toLowerCase().includes(lowerQuery) ||
          (client.street || '').toLowerCase().includes(lowerQuery) ||
          (client.postal_code || '').toLowerCase().includes(lowerQuery) ||
          (client.voivodeship || '').toLowerCase().includes(lowerQuery) ||
          (client.client_category || '').toLowerCase().includes(lowerQuery) ||
          (client.number_of_branches || '').toLowerCase().includes(lowerQuery) ||
          (client.number_of_sales_reps || '').toLowerCase().includes(lowerQuery) ||
          (client.www || '').toLowerCase().includes(lowerQuery) ||
          (client.turnover_pln || '').toLowerCase().includes(lowerQuery) ||
          (client.turnover_eur || '').toLowerCase().includes(lowerQuery) ||
          (client.installation_sales_share || '').toLowerCase().includes(lowerQuery) ||
          (client.automatic_sales_share || '').toLowerCase().includes(lowerQuery) ||
          (client.sales_potential || '').toLowerCase().includes(lowerQuery) ||
          (client.has_webstore || '').toLowerCase().includes(lowerQuery) ||
          (client.has_b2b_platform || '').toLowerCase().includes(lowerQuery) ||
          (client.has_b2c_platform || '').toLowerCase().includes(lowerQuery) ||
          (client.facebook || '').toLowerCase().includes(lowerQuery) ||
          (client.auction_service || '').toLowerCase().includes(lowerQuery) ||
          (client.private_bran || '').toLowerCase().includes(lowerQuery) ||
          (client.private_brand_details || '').toLowerCase().includes(lowerQuery) ||
          (client.loyalty_progra || '').toLowerCase().includes(lowerQuery) ||
          (client.loyalty_program_details || '').toLowerCase().includes(lowerQuery) ||
          (client.structure_installe || '').toLowerCase().includes(lowerQuery) ||
          (client.structure_wholesale || '').toLowerCase().includes(lowerQuery) ||
          (client.structure_ecommerc || '').toLowerCase().includes(lowerQuery) ||
          (client.structure_retai || '').toLowerCase().includes(lowerQuery) ||
          (client.structure_oth || '').toLowerCase().includes(lowerQuery)
      );
      setFilteredClients(filtered);
    }
  }, [clients, searchQuery]);

  const fetchClients = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/customers/list.php`);
    const data = await response.json();
    if (data.success) {
      setClients(data.clients);
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
  
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/customers/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      });
  
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
  

  return (
    


    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">{t('customersTitle')}</h1>

          <div className="mb-5 flex justify-between gap-2 items-center">
      <button onClick={() => setIsAddModalOpen(true)} className="buttonGreen">
        {t('addClient')}
      </button>
      <input
        type="text"
        placeholder={t('searchPlaceholder')}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="p-2 w-72 border rounded"
      />
    </div>


      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClientAdded={fetchClients}
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
        />
      )}

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead className='bg-neutral-600'>
          <tr>
            <th>{t('tableHeaders.number')}</th>
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
                <td>{client.company_name || '-'}</td>
                <td>{client.country || '-'}</td>
                <td className='portrait:hidden'>{client.city || '-'}</td>
                <td className='portrait:hidden'>{client.engo_team_contact || '-'}</td>
                <td style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button onClick={() => handleEdit(client)} className='buttonGreen2'>{t('details')}</button>
                    <button onClick={() => handleDelete(client.id)} className="buttonRed2">{t('delete')}</button>
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
