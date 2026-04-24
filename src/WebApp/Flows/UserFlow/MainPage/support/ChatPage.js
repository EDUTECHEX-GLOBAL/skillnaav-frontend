import React from "react";
import ChatThread from "./ChatThread"; // 👈 Make sure this is the upgraded version

const ChatPage = ({ internship, goBack }) => {
  return (
    <div className="p-4 font-poppins">
      <button
        onClick={goBack}
        className="text-sm text-blue-600 underline mb-3 hover:text-blue-800"
      >
        ← Back
      </button>

      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Chat for <span className="text-blue-600">{internship.jobTitle}</span>
        </h2>
        <p className="text-sm text-gray-600">
          Partner: {internship.internshipId?.companyName || "N/A"}
        </p>
      </div>

      <ChatThread internshipId={internship.internshipId?._id} />
    </div>
  );
};

export default ChatPage;
