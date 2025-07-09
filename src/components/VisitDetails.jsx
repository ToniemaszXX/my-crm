import { useTranslation } from 'react-i18next';


function VisitDetails({ visit, users }) {

  const { t } = useTranslation();

  const findUsername = (id) => {
    const user = users?.find(u => String(u.id) === String(visit.user_id));
    return user ? user.username.replace('.', ' ') : 'Nieznany';
  };

  return (
    <div className="space-y-4 text-sm bg-neutral-50 p-5  border-0 rounded-md ">
      {/* Sekcja z datami i nagłówkami */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <p><strong>{t("visitsPage.visitDate")}<br /></strong> {visit.visit_date?.slice(0, 10) || '-'}</p>
        <p><strong>{t("visitsPage.creationDate")}<br /></strong> {visit.created_at?.slice(0, 10) || '-'}</p>
        <p><strong>{t("visitsPage.kindOfMeet")}<br /></strong> {visit.meeting_type || '-'}</p>
        <p><strong>{t("visitsPage.client")}<br /></strong> {visit.contact_person || '-'}</p>
        <p><strong>{t("visitsPage.trader")}<br /></strong> {findUsername(visit.user_id)}</p>
      </div>

      <hr className="my-2 border-gray-400" />

      {/* Sekcja treści wizyty */}
      <div className="space-y-2">
        <p><strong>{t("visitsPage.goal")}<br /></strong> {visit.meeting_purpose || '-'}</p>
        <p><strong>{t("visitsPage.resume")}<br /></strong> {visit.post_meeting_summary || '-'}</p>
        <p><strong>{t("visitsPage.marketing")}<br /></strong> {visit.marketing_tasks || '-'}</p>
        <p><strong>{t("visitsPage.toDo")}<br /></strong> {visit.action_plan || '-'}</p>
      </div>
    </div>
  );
}

export default VisitDetails;
