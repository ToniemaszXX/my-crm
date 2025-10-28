// Lista domyślnych pól wizyty (może być użyta jako fallback,
// docelowo UI korzysta z endpointu /admin/notifications_fields.php?entity=visit
// aby pobrać listę kolumn z bazy).
export const VISIT_FIELDS = [
  { key: 'visit_date', label: 'Data wizyty' },
  { key: 'contact_person', label: 'Osoba kontaktowa' },
  { key: 'meeting_type', label: 'Typ spotkania' },
  { key: 'meeting_purpose', label: 'Cel spotkania' },
  { key: 'post_meeting_summary', label: 'Podsumowanie po spotkaniu' },
  { key: 'marketing_tasks', label: 'Zadania marketingowe' },
  { key: 'marketing_response', label: 'Odpowiedź marketingu' },
  { key: 'action_plan', label: 'Plan działań' },
  { key: 'competition_info', label: 'Informacje o konkurencji' },
  { key: 'additional_notes', label: 'Dodatkowe notatki' },
  { key: 'director_response', label: 'Odpowiedź dyrektora' },
  { key: 'attachment_file', label: 'Załącznik' },
];
