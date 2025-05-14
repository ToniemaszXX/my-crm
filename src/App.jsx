import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Visits from './pages/Visits';
import Login from './pages/Login';
import Logout from './pages/Logout';
import useAuth from './hooks/useAuth';

function Layout() {
  const location = useLocation();
  const loading = useAuth();

  if (loading) return <div className="text-white p-4">Checking session...</div>;

  const hideSidebar = location.pathname === "/login";

  return (
    <div className="flex h-screen w-screen box-border pr-5 bg-neutral-900">
      {!hideSidebar && <Sidebar />}
      <div className="w-full">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </div>
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
