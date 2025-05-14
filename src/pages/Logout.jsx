import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Logout() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        const logout = async () => {
            await fetch(`${import.meta.env.VITE_API_URL}/auth/logout.php`);
            navigate('/login');
        };

        logout();
    }, [navigate]);

    return <p>{t('logout')}</p>;
}

export default Logout;