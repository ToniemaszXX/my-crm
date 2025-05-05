import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="bg-black p-5 w-56 h-screen">
      <h2 className='text-lime-500 text-xl font-bold mb-4'>CRM ENGO</h2>
      <ul className="list-none p-0 text-white">
        <li className='mb-3'>
          <Link to="/">Dashboard</Link>
        </li>
        <li className='mb-3'>
          <Link to="/customers">Customers</Link>
        </li>
        <li className='mb-3'>
          <Link to="/visits">Visits</Link>
        </li>
        <li className='mb-3'>
            <Link to="/logout">Logout</Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
