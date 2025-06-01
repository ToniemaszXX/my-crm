import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import AddVisitModal from "../components/AddVisitModal";
import EditVisitModal from "../components/EditVisitModal";
import i18n from '../languages/i18n';
import { useTranslation } from 'react-i18next';
import { isAdmin } from '../utils/roles';
import { isTsr } from '../utils/roles';

function Visits() {
  const { user, loading } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allClients, setAllClients] = useState([]);
  const [viewMode, setViewMode] = useState("all"); // 'all' or 'myVisits'
  const [expandedVisitId, setExpandedVisitId] = useState(null);

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

    const myVisitsSortedByDate = clients
  .flatMap(client => 
    client.visits
      .filter(visit => visit.user_id === user.id) // zakładam, że `visit.created_by` zawiera ID użytkownika
      .map(visit => ({ ...visit, clientName: client.company_name }))
  )
  .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));


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

        <div className="flex space-x-2 mb-4">
          <button
            className={`px-4 py-2 rounded ${viewMode === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('all')}
          >
            Wszystkie wizyty
          </button>
          <button
            className={`px-4 py-2 rounded ${viewMode === 'myVisits' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('myVisits')}
          >
            Moje wizyty wg daty
          </button>
        </div>

        <input
          type="text"
          placeholder={t('searchClient')}
          className="border p-2 rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>


      {viewMode === "all" ? (
        filteredClients.length === 0 ? (
          <p className="text-white">{t('visit.noClientsWithVisit')}</p>
        ) : (
          <ul className="text-white space-y-2">
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
                  {client.visits.map((visit) => {
                    const createdAt = new Date(visit.created_at);
                    const now = new Date();
                    const diffInSeconds = (now - createdAt) / 1000;
                    const isTsrUser = isTsr(user);
                    const isAfter24h = diffInSeconds > 86400;
                    
                    const canEdit = !isTsrUser || (isTsrUser && !isAfter24h); // tylko TSR ma limit

                    // console.log('visit:', visit);
                    // console.log('created_at:', visit.created_at);
                    // console.log('user:', user);
                    // console.log('isTsr:', isTsr(user));

                    console.log("Zalogowany użytkownik ID:", user?.id);
                    console.log("Dane klientów z wizytami:", clients);
                    

                    const handleEditClick = () => {
                      if (isTsrUser && isAfter24h) {
                        alert("Nie możesz edytować wizyty po 24 godzinach od jej dodania.");
                        return;
                      }
                      setSelectedVisit(visit);
                      setIsEditModalOpen(true);
                    };

                    return (
                      <div key={visit.visit_id} className="border p-2 rounded flex justify-between items-center">
                        <div>
                          <p><strong>{t('visit.date')}:</strong> {visit.visit_date}</p>
                          <p><strong>{t('visit.whome')}:</strong> {visit.contact_person}</p>
                          <p><strong>{t('visit.type')}:</strong> {visit.meeting_type}</p>
                          <p><strong>{t('visit.goal')}:</strong> {visit.meeting_purpose}</p>
                        </div>
                        <button
                          onClick={handleEditClick}
                          className={`px-3 py-1 rounded ${
                            isTsrUser && isAfter24h
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-yellow-400 text-black hover:bg-yellow-500'
                          }`}
                        >
                          Edytuj
                        </button>

                      </div>
                    );
                  })}


                </div>
              )}
            </li>
          ))}
        </ul>
      )}
          </ul>
        )
      ) : (
        <div className="text-white space-y-2">
          {myVisitsSortedByDate.map((visit) => {
            const isExpanded = expandedVisitId === visit.visit_id;

            return (
              <div key={visit.visit_id} className="border rounded bg-white text-black">
                <div
                  className="p-2 font-semibold cursor-pointer bg-blue-100 hover:bg-blue-200"
                  onClick={() => setExpandedVisitId(isExpanded ? null : visit.visit_id)}
                >
                  {visit.visit_date} — {visit.clientName}
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-1">
                    <p><strong>Osoba kontaktowa:</strong> {visit.contact_person}</p>
                    <p><strong>Typ spotkania:</strong> {visit.meeting_type}</p>
                    <p><strong>Cel spotkania:</strong> {visit.meeting_purpose}</p>
                    {/* Możesz dodać inne pola tutaj: post_meeting_summary, action_plan itd. */}
                  </div>
                )}
              </div>
            );
          })
          }
        </div>
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
