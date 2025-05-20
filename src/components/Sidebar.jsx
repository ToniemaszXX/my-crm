import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // domyślna wartość
  let NameLogged = '';

  if (user?.username) {
    NameLogged = user.username
      .replace(/\./g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return (
    <div className="fixed top-0 left-0 bg-black p-5 h-screen z-[10] landscape:w-56 portrait:w-42 flex flex-col justify-between">
      <div>
        <h2 className='text-lime-500 text-xl font-bold mb-4'>CRM ENGO</h2>
        <ul className="list-none p-0 text-white">
          <li className='mb-3'>
            <Link to="/">{t('menu.dashboard')}</Link>
          </li>
          <li className='mb-3'>
            <Link to="/customers">{t('menu.clients')}</Link>
          </li>
          <li className='mb-3'>
            <Link to="/visits">{t('menu.visits')}</Link>
          </li>
          <li className='mb-3'>
            <Link to="/logout">{t('menu.logout')}</Link>
          </li>
        </ul>
      </div>

      {user && (
        <div className="text-white mt-4 text-sm border-t border-gray-700 pt-3">
          <p>{t('logged_in_as')}: <strong>{NameLogged}</strong></p>
          <p>{t('role')}: <strong>{user.role}</strong></p>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
