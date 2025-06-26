import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useAuth } from '../context/AuthContext';
import { wasLoggedIn } from '../utils/wasLoggedIn';


function Logout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setUser } = useAuth(); // ← DODAJ TO

  useEffect(() => {
  const logout = async () => {
    await fetchWithAuth(`${import.meta.env.VITE_API_URL}/auth/logout.php`);
    setUser(null);
    wasLoggedIn.current = false; // 👈 zresetuj
    navigate('/login');
    };
    logout();
    }, []);

  return <p>{t('logout')}</p>;
}


export default Logout;