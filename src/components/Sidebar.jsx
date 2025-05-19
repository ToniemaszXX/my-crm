import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Sidebar() {

  const { t } = useTranslation();
  
  return (
    <div className="fixed top-0 left-0 bg-black p-5  h-screen z-[10] landscape:w-56 portrait:w-42 ">
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
  );
}

export default Sidebar;
