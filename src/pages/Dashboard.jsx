import { useAuth } from '../context/AuthContext';
import useSessionChecker from '../hooks/useSessionChecker';
import { useTranslation } from 'react-i18next';


function Dashboard() {
    const { t } = useTranslation();
    const { loading } = useAuth();

    useSessionChecker(); // 🔐 pilnuje sesji

    if (loading) {
        return <p>{t('loading')}</p>;
    }

    return <h1>{t('welcome')}</h1>;
  }
  
  export default Dashboard;
  