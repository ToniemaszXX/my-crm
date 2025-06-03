import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import AddVisitModal from "../components/AddVisitModal";
import EditVisitModal from "../components/EditVisitModal";
import { useTranslation } from 'react-i18next';
import ClientVisits from "../components/ClientVisits";

function Visits() {
  const { user, loading } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allClients, setAllClients] = useState([]);
  const [viewMode, setViewMode] = useState("all");
  const [expandedVisitId, setExpandedVisitId] = useState(null);
  const [visitDateFilter, setVisitDateFilter] = useState("");

  const { t } = useTranslation();

  useEffect(() => {
    fetchAllClients();
    fetchClients();
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

  const getFilteredClients = () => {
    return clients
      .filter(client =>
        client.company_name.toLowerCase().includes(search.toLowerCase())
      )
      .map(client => {
        const filteredVisits = (client.visits || []).filter(visit => {
          if (!visitDateFilter) return true;
          const date = typeof visit.visit_date === 'string'
            ? visit.visit_date.slice(0, 10)
            : new Date(visit.visit_date).toISOString().split('T')[0];
          return date === visitDateFilter;
        });
        return { ...client, visits: filteredVisits };
      })
      .filter(client => client.visits.length > 0);
  };

  const getFilteredMyVisits = () => {
    return clients
      .flatMap(client =>
        client.visits
          .filter(visit => visit.user_id === user.id)
          .map(visit => ({ ...visit, clientName: client.company_name }))
      )
      .filter(visit => {
        if (!visitDateFilter) return true;
        const visitDate = typeof visit.visit_date === 'string'
          ? visit.visit_date.slice(0, 10)
          : new Date(visit.visit_date).toISOString().split('T')[0];
        return visitDate === visitDateFilter;
      })
      .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
  };

  if (loading) return <p>{t('loading')}</p>;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4 text-white">{t('visit.visitsLead')}</h1>

      <div className="flex flex-wrap gap-4 justify-between mb-4 items-center">
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
          type="date"
          className="border p-2 rounded"
          value={visitDateFilter}
          onChange={(e) => setVisitDateFilter(e.target.value)}
        />

        <button
          onClick={() => setVisitDateFilter('')}
          className="buttonRed"
        >
          Reset daty
        </button>

        <input
          type="text"
          placeholder={t('searchClient')}
          className="border p-2 rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {viewMode === "all" ? (
        getFilteredClients().length === 0 ? (
          <p className="text-white">{t('visit.noClientsWithVisit')}</p>
        ) : (
          <ul className="text-white space-y-2">
            {getFilteredClients().map((client) => (
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
                  <ClientVisits
                    client={client}
                    onEdit={(visit) => {
                      setSelectedVisit(visit);
                      setIsEditModalOpen(true);
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="text-white space-y-2">
          {getFilteredMyVisits().map((visit) => {
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
                    <p><strong>Data:</strong> {visit.visit_date}</p>
                    <p><strong>Utworzono:</strong> {visit.created_at}</p>
                    <p><strong>Z kim odbyła się wizyta:</strong> {visit.contact_person}</p>
                    <p><strong>Rodzaj spotkania:</strong> {visit.meeting_type}</p>
                    <p><strong>Cel spotkania:</strong> {visit.meeting_purpose}</p>
                    <p><strong>Podsumowanie po spotkaniu:</strong> {visit.post_meeting_summary}</p>
                    <p><strong>Zadania marketingowe:</strong> {visit.marketing_tasks}</p>
                    <p><strong>Plan działania:</strong> {visit.action_plan}</p>
                    <p><strong>Konkurencja:</strong> {visit.competition_info}</p>
                    <p><strong>Dodatkowe uwagi:</strong> {visit.additional_notes}</p>
                  </div>
                )}
              </div>
            );
          })}
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
