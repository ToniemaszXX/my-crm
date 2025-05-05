import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Visits from './pages/Visits';
import Login from './pages/Login';
import Logout from './pages/Logout';

function Layout() {
  const Location = useLocation();
  const hideSidebar = location.pathname === "/login";

  return (
    <div className="flex h-screen w-screen box-border pr-5">

      {!hideSidebar && <Sidebar />}
      <div className='w-full'>
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
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
