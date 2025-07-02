import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useSessionChecker from '../hooks/useSessionChecker';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { useTranslation } from 'react-i18next';

function Trainings() {
  useSessionChecker();
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const [trainings, setTrainings] = useState([]);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const response = await fetchWithAuth('/ai/API/szkolenia/list.php', {
          bearerToken: 'xw9@T3#z7L!uPv2H$r8NmCq5%YdKeF61^AoBjXs3&Zg0WfVtMRyLnJphUEGbDki*',
        });

        if (response.ok) {
          const data = await response.json();
          setTrainings(data);
        } else {
          console.error('Failed to fetch trainings');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchTrainings();
  }, []);

  if (loading) return <p>{t('Loading...')}</p>;

  const filteredTrainings = trainings.filter((training) => training.kraj !== 'PL');

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">{t('Trainings')}</h1>

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead className="bg-neutral-600 text-white">
          <tr>
            <th>{t('tableHeaders.number') || '#'}</th>
            <th>{t('Name')}</th>
            <th>{t('Date')}</th>
            <th>{t('City')}</th>
            <th>{t('KR')}</th>
            <th>{t('Country')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrainings.length > 0 ? (
            filteredTrainings.map((training, index) => (
              <tr key={index} className="border-b border-b-neutral-300 text-center">
                <td>{index + 1}</td>
                <td>{training.name || '-'}</td>
                <td>{training.date || '-'}</td>
                <td>{training.miasto_szkolenia || '-'}</td>
                <td>{training.KR || '-'}</td>
                <td>{training.kraj || '-'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>{t('No trainings found outside PL')}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Trainings;
