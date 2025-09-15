import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isTsr } from "../utils/roles";
import { useTranslation } from "react-i18next";

function ClientVisits({ client, clientId: propClientId, onEdit }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [visits, setVisits] = useState(client?.visits || null);
  const [loading, setLoading] = useState(false);

  // Ensure numeric clientId to match backend (which returns integers)
  const clientIdRaw = client?.client_id ?? client?.id ?? propClientId;
  const clientId = clientIdRaw != null ? Number(clientIdRaw) : null;

  useEffect(() => {
    if (visits !== null || !clientId) return;

    setLoading(true);
  fetch(`${import.meta.env.VITE_API_URL}/visits/get_visits_by_clients.php`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
      const matched = data.data.find((c) => Number(c.client_id) === clientId);
          setVisits(matched?.visits || []);
        } else {
          console.error("Błąd pobierania wizyt:", data.message);
          setVisits([]);
        }
      })
      .catch((err) => {
        console.error("Błąd:", err);
        setVisits([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [visits, clientId]);

  if (!clientId) return null;
  if (loading) return <p>{t('loading')}</p>;
  if (!visits || visits.length === 0) return <p>{t('visitsPage.noVisit')}</p>;

  return (
    <ul className="bg-white text-black p-4 rounded mt-2 space-y-2">
  {visits.map((visit) => {
    const createdAt = new Date(visit.created_at);
    const now = new Date();
    const diffInSeconds = (now - createdAt) / 1000;
    const isAfter24h = diffInSeconds > 86400;
    const canEdit = !isTsr(user) || (isTsr(user) && !isAfter24h);

    const renderField = (label, value) => {
      if (!value) return null;
      return (
        <p>
          <strong>{label}:</strong> {value}
        </p>
      );
    };

    return (
      <li key={visit.visit_id} className="border p-2 rounded flex justify-between items-start gap-4">
        <div className="space-y-1">
          {renderField(t('visit.date'), visit.visit_date)}
          {renderField("Utworzono", visit.created_at)}
          {renderField(t('addVisitModal.contactPerson'), visit.contact_person)}
          {renderField(t('addVisitModal.kindOfMeeting'), visit.meeting_type)}
          {renderField(t('addVisitModal.meetingPurpose'), visit.meeting_purpose)}
          {renderField(t('addVisitModal.postMeetingSummary'), visit.post_meeting_summary)}
          {renderField(t('addVisitModal.marketingTasks'), visit.marketing_tasks)}
          {renderField(t('addVisitModal.actionPlan'), visit.action_plan)}
          {renderField(t('addVisitModal.competitionInfo'), visit.competition_info)}
          {renderField(t('addVisitModal.additionalNotes'), visit.additional_notes)}

          {visit.attachment_file && (
            <p>
              <strong>{t('visit.attachment')}:</strong>{" "}
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

        {onEdit && (
          <button
            onClick={() => canEdit ? onEdit(visit) : alert(t("visit.editBlocked"))}
            className={`h-fit px-3 py-1 rounded ${
              !canEdit
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-yellow-400 text-black hover:bg-yellow-500"
            }`}
          >
            {t("edit")}
          </button>
        )}
      </li>
    );
  })}
</ul>

  );
}

export default ClientVisits;
