import { useAuth } from '../context/AuthContext';
import useSessionChecker from '../hooks/useSessionChecker';
import { useTranslation } from 'react-i18next';
import NotificationsWidget from '../components/NotificationsWidget';


function Dashboard() {
    const { t } = useTranslation();
    const { loading } = useAuth();

    useSessionChecker(); // 🔐 pilnuje sesji

    if (loading) {
        return <p>{t('loading')}</p>;
    }

        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">{t('welcome')}</h1>
                <div className="w-full flex flex-col lg:flex-row gap-4">
                    <div className="w-full lg:w-1/3">
                        <NotificationsWidget />
                    </div>
                    {/* Możesz dodać kolejne karty po prawej w pozostałych 2/3 */}
                    <div className="w-full lg:w-2/3"></div>
                </div>
            </div>
        );
  }
  
  export default Dashboard;
  