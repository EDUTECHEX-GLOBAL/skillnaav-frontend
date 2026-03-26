import React from "react";
import TicketThread from "./TicketThread";

const TicketsPage = ({ internship, goBack }) => {
  const internshipTitle = internship.internshipId.jobTitle;
  const partnerName = internship.internshipId.companyName; // or use partner name if available
  const internshipId = internship.internshipId._id;

  return (
    <div className="p-4 font-poppins">
      <button onClick={goBack} className="text-sm text-purple-600 underline mb-3">← Back</button>

      <h2 className="text-xl font-semibold mb-1">Ticket for <span className="text-purple-700">{internshipTitle}</span></h2>
      <p className="text-sm text-gray-600 mb-4">Partner: {partnerName}</p>

      {/* ✅ Real thread component */}
      <TicketThread internshipId={internshipId} />
    </div>
  );
};

export default TicketsPage;
