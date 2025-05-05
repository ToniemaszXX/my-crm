import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import AddClientModal from '../components/AddClientModal';
import EditClientModal from '../components/EditClientModal';

function Customers() {
  const loading = useAuth();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

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
          (client.nip || '').toLowerCase().includes(lowerQuery) ||
          (client.country || '').toLowerCase().includes(lowerQuery)
      );
      setFilteredClients(filtered);
    }
  }, [clients, searchQuery]);

  const fetchClients = async () => {
    const response = await fetch('/api/customers/list.php');
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

  if (loading) return <p>Loading...</p>;

  const handleDelete = async (id) => {
    const confirm = window.confirm('Czy na pewno chcesz usunąć tego klienta?');
    if (!confirm) return;
  
    try {
      const response = await fetch('/api/customers/delete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert('Klient został usunięty.');
        fetchClients();
      } else {
        alert('Błąd podczas usuwania klienta.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Wystąpił błąd po stronie klienta.');
    }
  };
  

  return (
    


    <div className="p-5 w-full">
      <h1 className="text-2xl font-bold mb-4">Clients</h1>

          <div className="mb-5 flex justify-between gap-2">
      <button onClick={() => setIsAddModalOpen(true)} className="bg-lime-500 text-white px-4 py-2 rounded">
        Add Client
      </button>
      <input
        type="text"
        placeholder="Search clients..."
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
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th>#</th>
            <th>Company Name</th>
            <th>City</th>
            <th>NIP</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.length > 0 ? (
            filteredClients.map((client, index) => (
              <tr key={client.id} style={{ textAlign: 'center' }}>
                <td>{index + 1}</td>
                <td>{client.company_name || '-'}</td>
                <td>{client.city || '-'}</td>
                <td>{client.nip || '-'}</td>
                <td style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button onClick={() => handleEdit(client)} className='buttonGreenNeg'>Edit</button>
                    <button onClick={() => handleDelete(client.id)} className="buttonRedNeg">Delete</button>
                </td>

              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>No clients found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Customers;
