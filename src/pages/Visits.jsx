import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import AddVisitModal from "../components/AddVisitModal";
import EditVisitModal from "../components/EditVisitModal";
import { useTranslation } from 'react-i18next';
import ClientVisits from "../components/ClientVisits";
import useSessionChecker from '../hooks/useSessionChecker';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import ClientVisitCard from "../components/ClientVisitCard";
import AllClientVisitsModal from "../components/AllClientVisitsModal";
import VisitDetails from "../components/VisitDetails";
import { canEditVisit } from "../utils/visitUtils";



function Visits() {
  const { user, loading } = useAuth();
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [sortMode, setSortMode] = useState("latestVisit");
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const [allClients, setAllClients] = useState([]);
  // const [viewMode, setViewMode] = useState("all");
  // const [expandedVisitId, setExpandedVisitId] = useState(null);
  const [visitDateFilter, setVisitDateFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [modalClient, setModalClient] = useState(null);

  //filltry
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");


  const { t } = useTranslation();

  useSessionChecker(); // 🔐 aktywuje sesję


  useEffect(() => {
    fetchAllClients();
    fetchClients();
  }, []);

  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL}/users/list.php`, {
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users);
        }
      })
      .catch(err => {
        console.error("Błąd pobierania użytkowników:", err);
      });
  }, []);

  const formatUsername = (username) => {
    return username
      .split('.') // rozdziel po kropce
      .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // wielka litera
      .join(' '); // połącz spacją
  };


  const fetchAllClients = async () => {
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/customers/list.php`, {
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
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/visits/get_visits_by_clients.php`, {
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

  const handleVisitEdited = async () => {
    setIsEditModalOpen(false);
    setSelectedVisit(null);

    const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/visits/get_visits_by_clients.php`);
    const data = await res.json();

    if (data.success) {
      setClients(data.data);

      if (modalClient) {
        const updatedClient = data.data.find(c => c.client_id === modalClient.client_id);
        if (updatedClient) setModalClient(updatedClient);
      }
    }
  };



  const handleEdit = (visit) => {
     if (!canEditVisit(visit, user)) {
    alert("Edycja wizyty jest możliwa tylko do 24 godzin od jej utworzenia.");
    return;
  }
    setSelectedVisit(visit);
    setIsEditModalOpen(true);
  };


  const getFilteredClients = () => {
    return clients
      .filter(client =>
        client.company_name.toLowerCase().includes(search.toLowerCase())
      )
      .map(client => {
        const filteredVisits = (client.visits || []).filter(visit => {
          const dateMatch = !visitDateFilter || (
            typeof visit.visit_date === 'string'
              ? visit.visit_date.slice(0, 10)
              : new Date(visit.visit_date).toISOString().split('T')[0]
          ) === visitDateFilter;

          const userMatch = !userFilter || String(visit.user_id) === String(userFilter);

          return dateMatch && userMatch;
        });

        return { ...client, visits: filteredVisits }; // <-- ten return był pominięty
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

  const toggleOnlyMine = () => setOnlyMine(prev => !prev);
  const toggleSortMode = () => setSortMode(prev => prev === "latestVisit" ? "alphabetical" : "latestVisit");

  const getTodayVisits = () => {
    const today = new Date().toISOString().split('T')[0];
    return clients.flatMap(client =>
      (client.visits || []).filter(v =>
        v.visit_date?.slice(0, 10) === today &&
        (!onlyMine || v.user_id === user.id)
      ).map(v => ({ ...v, client }))
    );
  };

  const getWeekVisits = () => {
    const now = new Date();
    const start = new Date(now.setDate(now.getDate() - now.getDay()));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return clients.flatMap(client =>
      (client.visits || []).filter(v => {
        const d = new Date(v.visit_date);
        return d >= start && d <= end && (!onlyMine || v.user_id === user.id);
      }).map(v => ({ ...v, client }))
    );
  };

  const getSortedFilteredClients = () => {
    const filtered = clients
      .filter(client =>
        client.company_name.toLowerCase().includes(search.toLowerCase())
      )
      .map(client => {
        const allVisits = client.visits || [];

        const filteredVisits = allVisits.filter(v => {
          const visitDate = v.visit_date?.slice(0, 10);
          const matchesSearch = client.company_name.toLowerCase().includes(search.toLowerCase());
          const matchesUser = !userFilter || String(v.user_id) === String(userFilter);
          const matchesMine = !onlyMine || v.user_id === user.id;
          const dateFromOK = !dateFromFilter || visitDate >= dateFromFilter;
          const dateToOK = !dateToFilter || visitDate <= dateToFilter;

          return (
            matchesSearch &&
            matchesUser &&
            matchesMine &&
            dateFromOK &&
            dateToOK
          );
        });

        // Użyj TYLKO ostatniej wizyty do belki, ale przekaż wszystkie do szczegółów
        const latestVisit = filteredVisits.sort((a, b) =>
          new Date(b.visit_date) - new Date(a.visit_date)
        )[0];

        return latestVisit
          ? { ...client, visits: allVisits, latestVisit }
          : null;
      })
      .filter(Boolean)

      .filter(client => client.visits.length > 0);

    if (sortMode === "alphabetical") {
      return filtered.sort((a, b) => a.company_name.localeCompare(b.company_name));
    } else {
      return filtered.sort((a, b) => {
        const dateA = new Date(a.visits[0]?.visit_date || 0);
        const dateB = new Date(b.visits[0]?.visit_date || 0);
        return dateB - dateA;
      });
    }
  };

  if (loading) return <p>{t('loading')}</p>;

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Wizyty</h1>
      </div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <button onClick={() => setIsAddModalOpen(true)} className="buttonGreen">
          Dodaj wizytę
        </button>
        <button
          onClick={toggleOnlyMine}
          className={`px-4 py-2 rounded border font-medium transition ${onlyMine
            ? "bg-green-600 text-white border-green-700"
            : "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            }`}
        >
          {onlyMine ? "Tryb: Moje wizyty" : "Tryb: Wszystkie wizyty"}
        </button>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

        {/* Wizyty z dzisiaj */}
        <section className="bg-gray-800 border border-gray-600 rounded max-h-[450px] overflow-y-auto relative">
          <h2 className="text-lg font-semibold text-white sticky top-0 bg-gray-800 p-4 border-b border-gray-700 z-10">
            Wizyty z dzisiaj
          </h2>
          <div className="p-4 pt-2">
            {getTodayVisits().length === 0 ? (
              <p className="text-white">Brak wizyt</p>
            ) : (
              getTodayVisits().map(visit => (
                <ClientVisitCard
                  key={visit.visit_id}
                  visit={visit}
                  users={users}
                  onShowAll={() => setModalClient(visit.client)}
                />
              ))
            )}
          </div>
        </section>

        {/* Wizyty z tego tygodnia */}
        <section className="bg-gray-800 border border-gray-600 rounded max-h-[450px] overflow-y-auto relative">
          <h2 className="text-lg font-semibold text-white sticky top-0 bg-gray-800 p-4 border-b border-gray-700 z-10">
            Wizyty z tego tygodnia
          </h2>
          <div className="p-4 pt-2">
            {getWeekVisits().length === 0 ? (
              <p className="text-white">Brak wizyt</p>
            ) : (
              getWeekVisits().map(visit => (
                <ClientVisitCard
                  key={visit.visit_id}
                  visit={visit}
                  users={users}
                  onShowAll={() => setModalClient(visit.client)}
                />
              ))
            )}
          </div>
        </section>

      </div>



      {/* Wszystkie wizyty */}
      <section className="bg-gray-800 border border-gray-600 rounded overflow-y-auto relative">
        {/* Sticky nagłówek */}
        <div className=" bg-gray-800 p-4 border-b border-gray-700 z-20 flex justify-between">

          <h2 className="text-xl font-semibold text-white sticky top-0">
            Wszystkie wizyty
          </h2>

          <button
            onClick={toggleSortMode}
            className="px-4 py-2 rounded border font-medium transition bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
          >
            Sortuj: {sortMode === "alphabetical" ? "A-Z" : "po dacie"}
          </button>
        </div>

        {/* Sticky filtry */}
        <div className="sticky top-[48px] bg-gray-800 z-10 p-4 border-b border-gray-700">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Wyszukaj klienta..."
              className="border p-2 rounded w-64"
            />


            <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="border p-2 rounded mb-3">
              <option value="">Wybierz handlowca</option>
              {users
                .filter(u => u.role === 'tsr' || u.role === 'manager')
                .map(u => (
                  <option key={u.id} value={u.id}>{formatUsername(u.username)}</option>
                ))}
            </select>

            <input type="date" value={dateFromFilter} onChange={e => setDateFromFilter(e.target.value)} className="border p-2 rounded" />
            <input type="date" value={dateToFilter} onChange={e => setDateToFilter(e.target.value)} className="border p-2 rounded" />

            <button
              onClick={() => {
                setUserFilter("");
                setDateFromFilter("");
                setDateToFilter("");
                setSearch("");
              }}
              className="buttonRed mb-3"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Lista klientów */}
        <div className="p-4 pt-2">
          {getSortedFilteredClients().map(client => (
            <ClientVisitCard
              key={client.client_id}
              client={client}
              users={users}
              onExpand={() =>
                setSelectedClient(selectedClient?.client_id === client.client_id ? null : client)
              }
              isExpanded={selectedClient?.client_id === client.client_id}
              onEdit={handleEdit}
            />
          ))}
        </div>
      </section>


      {/* Modale */}
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

      {modalClient && (
        <AllClientVisitsModal
          client={modalClient}
          users={users}
          onClose={() => setModalClient(null)}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}

export default Visits;
