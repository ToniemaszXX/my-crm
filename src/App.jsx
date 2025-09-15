import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import InstallerDetails from './pages/InstallerDetails';
import DesignerDetails from './pages/DesignerDetails';
import DeweloperDetails from './pages/DeweloperDetails';
import Visits from './pages/Visits';
import Trainings from './pages/Trainings';
import Login from './pages/Login';
import Logout from './pages/Logout';
import { useAuth } from './context/AuthContext';
import { useEffect, useState } from 'react';

import SessionLoginModal from './components/SessionLoginModal';
import { wasLoggedIn } from './utils/wasLoggedIn';

// NOWE: handler 401 -> otwiera modal
import { setUnauthorizedHandler } from './utils/fetchWithAuth';

function Layout() {
  const { user, loading, refreshSession } = useAuth();
  const location = useLocation();

  const [showSessionModal, setShowSessionModal] = useState(false);

  // Rejestracja globalnego handlera 401:
  // Gdy dowolny request dostanie 401, otwieramy modal (tylko raz).
  useEffect(() => {
    setUnauthorizedHandler(() => setShowSessionModal(true));
  }, []);

  // Zachowanie Twojej wcześniejszej logiki: jeśli byłeś zalogowany i
  // nagle user===null (poza /login) -> pokaż modal.
  useEffect(() => {
    if (!loading) {
      if (user) {
        wasLoggedIn.current = true;
      }
      if (!user && wasLoggedIn.current && location.pathname !== '/login') {
        setShowSessionModal(true);
      }
    }
  }, [loading, user, location]);

  if (loading) return <div className="text-white p-4">Checking session...</div>;

  const hideSidebar = location.pathname === '/login';

  return (
    <div className="relative flex bg-slate-50">
      {!hideSidebar && <Sidebar />}

      <div
        className={`w-full h-screen box-border ${
          hideSidebar ? '' : 'p-5 overflow-y-auto text-neutral-900 portrait:ml-40 landscape:ml-56'
        }`}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetails />} />
          <Route path="/installers/:id" element={<InstallerDetails />} />
    <Route path="/designers/:id" element={<DesignerDetails />} />
    <Route path="/developers/:id" element={<DeweloperDetails />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/trainings" element={<Trainings />} />
        </Routes>
      </div>

      {/* Modal sesji: ma własny overlay, więc NIE owijamy go dodatkowym divem */}
      <SessionLoginModal
        open={showSessionModal}
        onSuccess={() => {
          // Użytkownik zalogował się w modalu:
          // - modal się zamknie,
          // - fetchWithAuth ponowi przerwane żądanie.
          refreshSession();
          setShowSessionModal(false);
        }}
        onClose={() => {
          // Użytkownik anulował modal:
          // - SessionLoginModal wywoła completeReauth(false),
          // - fetchWithAuth zrobi redirect na /login.
          setShowSessionModal(false);
        }}
      />
    </div>
  );
}

export default function App() {
  // Dobrze mieć dynamiczny basename: w DEV "/" a w PROD "/engo/CRM"
  const basename = import.meta.env.PROD ? '/engo/CRM' : '/';

  return (
    <Router basename={basename}>
      <Layout />
    </Router>
  );
}
