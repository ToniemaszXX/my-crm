function VisitDetails({ visit, users }) {
  const findUsername = (id) => {
    const user = users?.find(u => String(u.id) === String(visit.user_id));
    return user ? user.username.replace('.', ' ') : 'Nieznany';
  };

  return (
    <div className="space-y-4 text-sm bg-neutral-50 p-5  border-0 rounded-md ">
      {/* Sekcja z datami i nagłówkami */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <p><strong>Data spotkania:<br /></strong> {visit.visit_date?.slice(0, 10) || '-'}</p>
        <p><strong>Data utworzenia:<br /></strong> {visit.created_at?.slice(0, 10) || '-'}</p>
        <p><strong>Rodzaj spotkania:<br /></strong> {visit.meeting_type || '-'}</p>
        <p><strong>Interesant:<br /></strong> {visit.contact_person || '-'}</p>
        <p><strong>Handlowiec:<br /></strong> {findUsername(visit.user_id)}</p>
      </div>

      <hr className="my-2 border-gray-400" />

      {/* Sekcja treści wizyty */}
      <div className="space-y-2">
        <p><strong>Cel spotkania:<br /></strong> {visit.meeting_purpose || '-'}</p>
        <p><strong>Podsumowanie:<br /></strong> {visit.post_meeting_summary || '-'}</p>
        <p><strong>Marketing:<br /></strong> {visit.marketing_tasks || '-'}</p>
        <p><strong>Plan działania:<br /></strong> {visit.action_plan || '-'}</p>
      </div>
    </div>
  );
}

export default VisitDetails;
