import { useTranslation } from 'react-i18next';


function VisitDetails({ visit, users }) {

  const { t } = useTranslation();

  const findUsername = (id) => {
    const user = users?.find(u => String(u.id) === String(visit.user_id));
    if (!user) return 'Nieznany';
    const parts = [];
    if (user.name) parts.push(String(user.name));
    if (user.surname) parts.push(String(user.surname));
    const joined = parts.join(' ').trim();
    if (joined) return joined;
    // fallback: use username split formatting
    return user.username ? String(user.username).split('.').map(p => p ? p[0].toUpperCase() + p.slice(1) : p).join(' ') : 'Nieznany';
  };

  return (
    <div className="space-y-4 text-sm bg-neutral-50 p-5  border-0 rounded-md ">
      {/* Sekcja z datami i nagłówkami */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
  <p><strong>{t("visitsPage.visitDate")}<br /></strong> <span className="whitespace-pre-wrap break-words">{visit.visit_date?.slice(0, 10) || '-'}</span></p>
  <p><strong>{t("visitsPage.creationDate")}<br /></strong> <span className="whitespace-pre-wrap break-words">{visit.created_at?.slice(0, 10) || '-'}</span></p>
  <p><strong>{t("visitsPage.kindOfMeet")}<br /></strong> <span className="whitespace-pre-wrap break-words">{visit.meeting_type || '-'}</span></p>
  <p><strong>{t("visitsPage.client")}<br /></strong> <span className="whitespace-pre-wrap break-words">{visit.contact_person || '-'}</span></p>
  <p><strong>{t("visitsPage.trader")}<br /></strong> <span className="whitespace-pre-wrap break-words">{findUsername(visit.user_id)}</span></p>
      </div>

      <hr className="my-2 border-gray-400" />

      {/* Sekcja treści wizyty */}
      <div className="space-y-2">
        <p><strong>{t("visitsPage.goal")}<br /></strong> <span className="whitespace-pre-wrap break-words">{visit.meeting_purpose || '-'}</span></p>
        <p><strong>{t("visitsPage.resume")}<br /></strong> <span className="whitespace-pre-wrap break-words">{visit.post_meeting_summary || '-'}</span></p>
        <p><strong>{t("visitsPage.marketing")}<br /></strong> <span className="whitespace-pre-wrap break-words">{visit.marketing_tasks || '-'}</span></p>
        {visit.marketing_response !== undefined && (
          <p><strong>{t("visitsPage.marketingResponse")}<br /></strong> <span className="whitespace-pre-wrap break-words">{visit.marketing_response || '-'}</span></p>
        )}
        <p><strong>{t("visitsPage.toDo")}<br /></strong> <span className="whitespace-pre-wrap break-words">{visit.action_plan || '-'}</span></p>
        {visit.director_response !== undefined && (
          <p><strong>{t("visitsPage.directorResponse")}<br /></strong> <span className="whitespace-pre-wrap break-words">{visit.director_response || '-'}</span></p>
        )}
      </div>
    </div>
  );
}

export default VisitDetails;
