import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faSpinner,
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";

const SendOfferLetter = ({ student, internshipId, onSuccess }) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [internship, setInternship] = useState(null);
  const [templates, setTemplates] = useState([]);

  const [offerDetails, setOfferDetails] = useState({
    joiningDate: "",
    position: "",
    templateId: "",
  });

  const partnerId = localStorage.getItem("partnerId");

  // Load internship details
  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const response = await axios.get(`/api/interns/${internshipId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = response.data;

        setInternship(data);
        setOfferDetails((prev) => ({
          ...prev,
          position: data.jobTitle,
          joiningDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : "",
        }));
      } catch (err) {
        console.error("Error fetching internship:", err);
        setError(err.response?.data?.message || "Failed to load internship details");
      }
    };

    if (internshipId) fetchInternship();
  }, [internshipId]);

  // Load partner templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!partnerId) return;
      try {
        const res = await axios.get(`/api/templates?partnerId=${partnerId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setTemplates(res.data);
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      }
    };

    fetchTemplates();
  }, [partnerId]);

  const handleSendOffer = async () => {
    try {
      setIsSending(true);
      setError(null);

      if (!student || !offerDetails.templateId || !offerDetails.joiningDate || !internship) {
        throw new Error("Please fill in all fields");
      }

      const response = await axios.post(
  "/api/offer-letters",
  {
    partnerId, // ✅ Add this line
    student_id: student.student_id,
    name: student.name,
    email: student.email,
    internshipId,
    templateId: offerDetails.templateId,
    position: offerDetails.position,
    startDate: offerDetails.joiningDate,
    company: internship.companyName,
    location: internship.location,
    duration: internship.duration || internship.endDateOrDuration,
    internshipType: internship.internshipType,
    compensationDetails: internship.compensationDetails,
    jobDescription: internship.jobDescription,
    qualifications: internship.qualifications,
    contactInfo: {
      name: "HR Manager",
      email: "hr@example.com",
      phone: "9876543210",
    },
    schoolAdminId: localStorage.getItem("schoolAdminId") || null,
  },
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }
);


      setSuccess(true);
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to send offer letter");
    } finally {
      setIsSending(false);
    }
  };

  if (error) {
    return (
      <div className="text-red-500">
        {error}
        <button className="ml-2 text-blue-500 underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (success) {
    return <div className="text-green-600 font-medium">✅ Offer letter sent successfully!</div>;
  }

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h4 className="font-semibold text-lg mb-4">Send Offer Letter</h4>

      {!internship ? (
        <div className="flex items-center justify-center p-4">
          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
          Loading internship...
        </div>
      ) : (
        <>
          {/* Internship summary */}
          <div className="mb-4 bg-blue-50 p-3 rounded">
            <p className="font-medium">{internship.jobTitle}</p>
            <p>Company: {internship.companyName}</p>
            <p>Location: {internship.location}</p>
            <p>Duration: {internship.duration || internship.endDateOrDuration}</p>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Position</label>
              <input
                type="text"
                value={offerDetails.position}
                onChange={(e) =>
                  setOfferDetails((prev) => ({ ...prev, position: e.target.value }))
                }
                className="mt-1 w-full border px-2 py-1 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Joining Date</label>
              <input
                type="date"
                value={offerDetails.joiningDate}
                onChange={(e) =>
                  setOfferDetails((prev) => ({ ...prev, joiningDate: e.target.value }))
                }
                className="mt-1 w-full border px-2 py-1 rounded"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Offer Template</label>
              <select
                className="mt-1 w-full border px-2 py-1 rounded"
                value={offerDetails.templateId}
                onChange={(e) =>
                  setOfferDetails((prev) => ({ ...prev, templateId: e.target.value }))
                }
              >
                <option value="">-- Select a Template --</option>
                {templates.map((tpl) => (
                  <option key={tpl._id} value={tpl._id}>
                    <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                    {tpl.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={handleSendOffer}
            disabled={isSending || !offerDetails.templateId}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSending ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Sending...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                Send Offer
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default SendOfferLetter;
