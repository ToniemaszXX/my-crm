import useAuth from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

function Dashboard() {
    const { t } = useTranslation();

    const loading = useAuth();

    if (loading) {
        return <p>{t('loading')}</p>;
    }

    return <h1>{t('welcome')}</h1>;
  }
  
  export default Dashboard;
  