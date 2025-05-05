import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div style={{ width: '220px', background: '#f2f2f2', padding: '20px', height: '100vh' }}>
      <h2>CRM ENGO</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '10px' }}>
          <Link to="/">Dashboard</Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
          <Link to="/customers">Customers</Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
          <Link to="/visits">Visits</Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
            <Link to="/logout">Logout</Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
