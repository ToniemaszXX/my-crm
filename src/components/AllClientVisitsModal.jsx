import React from "react";
import VisitDetails from "./VisitDetails";

function AllClientVisitsModal({ client, onClose, users, onEdit }) {
    if (!client) return null;

    const sortedVisits = [...(client.visits || [])].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-auto py-10">
            <div className="bg-white text-black w-full max-w-4xl rounded-lg shadow-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-sm bg-red-500 text-white px-3 py-1 rounded"
                >
                    Zamknij
                </button>

                <h2 className="text-2xl font-bold mb-4">
                    Wszystkie wizyty: {client.company_name}
                </h2>

                {sortedVisits.length === 0 ? (
                    <p>Brak wizyt dla tego klienta.</p>
                ) : (
                    <div className="space-y-4">
                        {sortedVisits.map((visit) => (
                            <div key={visit.visit_id} className="border rounded p-4 bg-gray-50 relative">
                                <button
                                    onClick={() => onEdit(visit)}
                                    className="absolute top-2 right-2 text-sm bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 rounded"
                                >
                                    Edytuj
                                </button>
                                <VisitDetails visit={visit} users={users} />
                            </div>

                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AllClientVisitsModal;
