import { useState } from "react";
import VisitDetails from "./VisitDetails";
import { useTranslation } from "react-i18next";

// Funkcja pomocnicza do formatowania username → Imię Nazwisko
const formatUsername = (username) => {
    if (!username) return "—";
    return username
        .split(".")
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
};

function ClientVisitCard({ visit, client, onExpand, isExpanded, onEdit, onShowAll, users = [] }) {
    const company = client || visit?.client;
    const visitData = visit?.visit_date ? visit : visit?.latestVisit || (company?.latestVisit || null);
    const [isOpen, setIsOpen] = useState(false);

    const latestVisitDate = visitData?.visit_date?.slice(0, 10) || "brak daty";
    const userId = visitData?.user_id;
    const user = users.find(u => String(u.id) === String(userId));
    const caretaker = user ? formatUsername(user.username) : "opiekun";
    const country = company?.country || "-";

    const toggle = () => setIsOpen(prev => !prev);
    const { t } = useTranslation();

    return (
        <div className="bg-blue-100 text-black font-semibold rounded shadow mb-2">
            <div
                className="px-4 py-2 cursor-pointer flex justify-between items-center hover:bg-blue-200"
                onClick={toggle}
            >
                <span>
                    {company?.company_name || "-"} — {country} — {caretaker} — {latestVisitDate}
                </span>

                {onShowAll && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowAll();
                        }}
                        className="text-sm bg-white text-gray-800 px-1 py-1 rounded shadow hover:bg-gray-100 transition min-w-[120px]"
                    >
                        {t("visitsPage.showHistory")}
                    </button>
                )}
            </div>

            {isOpen && visitData && (
                <div className="bg-white text-black py-4">
                    <div className="bg-white text-black px-6 py-4">
                        {(company?.visits || []).map(v => (
                            <div key={v.visit_id} className="mb-4 border-b pb-4 relative rounded-md bg-neutral-50 p-4">
                                {/* Przycisk Edytuj w prawym górnym rogu */}
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(v)}
                                        className="absolute top-2 right-2 text-sm text-white bg-gray-500 hover:bg-gray-700 px-3 py-1 rounded"
                                    >
                                        {t("visitsPage.edit")}
                                    </button>
                                )}

                                {/* Szczegóły wizyty */}
                                <VisitDetails visit={v} users={users} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}

export default ClientVisitCard;
