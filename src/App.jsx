import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Visits from './pages/Visits';
import Login from './pages/Login';
import Logout from './pages/Logout';
import { useAuth } from './context/AuthContext';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionLoginModal from './components/SessionLoginModal';
import { wasLoggedIn } from './utils/wasLoggedIn';



function Layout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showSessionModal, setShowSessionModal] = useState(false);

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

  const hideSidebar = location.pathname === "/login";

  return (
    <div className="relative flex bg-neutral-900">
      {!hideSidebar && <Sidebar />}

      <div className={`w-full h-screen box-border ${
        hideSidebar
          ? ''
          : 'p-5 overflow-y-auto text-neutral-300 portrait:ml-40 landscape:ml-56'
      }`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </div>

      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
          <SessionLoginModal onSuccess={() => setShowSessionModal(false)} />
        </div>
      )}
    </div>
  );
}




function App() {
  return (
    <Router basename="/engo/CRM">
      <Layout />
    </Router>
  );
}


export default App;
