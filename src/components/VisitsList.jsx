import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isTsr } from '@/utils/roles';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useTranslation } from 'react-i18next';
import { isViewer } from '../utils/roles';

// Generic visits list for designer/installer/deweloper (and can work for client too)
export default function VisitsList({ entityType, entityId, onEdit, reloadTrigger }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [visits, setVisits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!entityType || !entityId) return;
    let ignore = false;
    setLoading(true);
    setVisits(null);
    setServerError('');
    fetchWithAuth(`${import.meta.env.VITE_API_URL}/visits/get_by_entity.php?entity_type=${encodeURIComponent(entityType)}&id=${encodeURIComponent(entityId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!ignore) {
          if (data?.success) setVisits(data.data?.visits || []);
          else {
            setVisits([]);
            setServerError(data?.message || 'Błąd pobierania wizyt.');
          }
        }
      })
      .catch(() => { if (!ignore) { setVisits([]); setServerError('Błąd sieci.'); }})
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [entityType, entityId, reloadTrigger]);

  // Fetch users to resolve the creator of a visit
  useEffect(() => {
    let ignore = false;
    fetchWithAuth(`${import.meta.env.VITE_API_URL}/users/list.php`)
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        if (ignore) return;
        const list = data?.data || data?.users || [];
        setUsers(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!ignore) setUsers([]); });
    return () => { ignore = true; };
  }, []);

  if (!entityType || !entityId) return null;
  if (loading) return <p>{t('loading')}</p>;
  if (!visits || visits.length === 0) return <>
    {serverError ? <p className="text-red-500">{serverError}</p> : <p>{t('visitsPage.noVisit')}</p>}
  </>;

  return (
    <ul className="bg-white text-black p-4 rounded mt-2 space-y-2">
      {visits.map((visit) => {
        const createdAt = new Date(visit.created_at);
        const now = new Date();
        const diffInSeconds = (now - createdAt) / 1000;
  const isAfter24h = diffInSeconds > 86400;
  // Viewers cannot edit at all; TSR can edit only within 24h; others can edit anytime
  const canEdit = !isViewer(user) && (!isTsr(user) || (isTsr(user) && !isAfter24h));

        const renderField = (label, value) => {
          if (!value) return null;
          return (
            <p>
              <strong>{label}:</strong>{' '}
              <span className="whitespace-pre-wrap break-words">{value}</span>
            </p>
          );
        };
        const findUser = (id) => users.find((u) => String(u.id) === String(id));
        const formatUserDisplay = (u) => {
          if (!u) return '—';
          const parts = [];
          if (u.name) parts.push(String(u.name));
          if (u.surname) parts.push(String(u.surname));
          const joined = parts.join(' ').trim();
          if (joined) return joined;
          if (u.username) {
            return String(u.username)
              .split('.')
              .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
              .join(' ');
          }
          return '—';
        };
        const caretaker = formatUserDisplay(findUser(visit.user_id));

        return (
          <li key={visit.visit_id} className="border p-2 rounded flex justify-between items-start gap-4">
            <div className="space-y-1">
              {renderField(t('visit.date'), visit.visit_date)}
              {renderField('Utworzono', visit.created_at)}
              {renderField(t('visitsPage.trader'), caretaker)}
              {renderField(t('addVisitModal.contactPerson'), visit.contact_person)}
              {renderField(t('addVisitModal.kindOfMeeting'), visit.meeting_type)}
              {renderField(t('addVisitModal.meetingPurpose'), visit.meeting_purpose)}
              {renderField(t('addVisitModal.postMeetingSummary'), visit.post_meeting_summary)}
              {renderField(t('addVisitModal.marketingTasks'), visit.marketing_tasks)}
              {renderField(t('visitsPage.marketingResponse'), visit.marketing_response)}
              {renderField(t('addVisitModal.actionPlan'), visit.action_plan)}
              {renderField(t('addVisitModal.competitionInfo'), visit.competition_info)}
              {renderField(t('addVisitModal.additionalNotes'), visit.additional_notes)}
              {renderField(t('visitsPage.directorResponse'), visit.director_response)}

              {visit.attachment_file && (
                <p>
                  <strong>{t('visit.attachment')}:</strong>{' '}
                  <a
                    href={`${import.meta.env.VITE_API_URL}/uploads/${visit.attachment_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {visit.attachment_file}
                  </a>
                </p>
              )}
            </div>

            
              
            {onEdit && !isViewer(user) && (
               <button
                onClick={() => (canEdit ? onEdit(visit) : alert(t('visit.editBlocked')))}
                className={`h-fit px-3 py-1 rounded ${
                  !canEdit
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-yellow-400 text-black hover:bg-yellow-500'
                }`}
              >
                {t('edit')}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
