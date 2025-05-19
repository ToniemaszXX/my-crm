import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import AddVisitModal from "../components/AddVisitModal";
import EditVisitModal from "../components/EditVisitModal";
import i18n from '../languages/i18n';
import { useTranslation } from 'react-i18next';
import { isAdmin } from '../utils/roles';

function Visits() {
  const { user, loading } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allClients, setAllClients] = useState([]);
  const { t } = useTranslation();

    useEffect(() => {
    fetchAllClients();
    }, []);

    const fetchAllClients = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/customers/list.php`, {
        credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
        setAllClients(data.clients);
        }
    } catch (err) {
        console.error("Błąd pobierania wszystkich klientów", err);
    }
    };


  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/visits/get_visits_by_clients.php`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (err) {
      console.error("Błąd pobierania klientów z wizytami", err);
    }
  };

  const handleVisitAdded = () => {
    setIsAddModalOpen(false);
    fetchClients();
  };

  const handleVisitEdited = () => {
    setIsEditModalOpen(false);
    setSelectedVisit(null);
    fetchClients();
  };

  const filteredClients = clients.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p>{t('loading')}</p>;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4 text-white">{t('visit.visitsLead')}</h1>

      <div className="flex justify-between mb-4 items-center">
        <button onClick={() => setIsAddModalOpen(true)} className="buttonGreen">
          {t('visit.addVisit')}
        </button>
        <input
          type="text"
          placeholder={t('searchClient')}
          className="border p-2 rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <p className="text-white">{t('visit.noClientsWithVisit')}</p>
      ) : (
        <ul className="text-white space-y-2">
          {filteredClients.map((client) => (
            <li key={client.client_id}>
              <div
                className="bg-blue-100 text-black font-semibold px-4 py-2 rounded cursor-pointer"
                onClick={() =>
                  setSelectedClient(
                    selectedClient?.client_id === client.client_id
                      ? null
                      : client
                  )
                }
              >
                {client.company_name}
              </div>

              {selectedClient?.client_id === client.client_id && (
                <div className="bg-white text-black p-4 rounded mt-2 space-y-2">
                  {client.visits.map((visit) => (
                    <div
                      key={visit.visit_id}
                      className="border p-2 rounded flex justify-between items-center"
                    >
                      <div>
                        <p><strong>{t('visit.date')}:</strong> {visit.visit_date}</p>
                        <p><strong>{t('visit.whome')}:</strong> {visit.contact_person}</p>
                        <p><strong>{t('visit.type')}:</strong> {visit.meeting_type}</p>
                        <p><strong>{t('visit.goal')}:</strong> {visit.meeting_purpose}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedVisit(visit);
                          setIsEditModalOpen(true);
                        }}
                        className="bg-yellow-400 text-black px-3 py-1 rounded"
                      >
                        Edytuj
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

        <AddVisitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onVisitAdded={handleVisitAdded}
        clients={allClients}
        />

      {selectedVisit && (
        <EditVisitModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onVisitUpdated={handleVisitEdited}
          visit={selectedVisit}
          clients={clients}
        />
      )}
    </div>
  );
}

export default Visits;
