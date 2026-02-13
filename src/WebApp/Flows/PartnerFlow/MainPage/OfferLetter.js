import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faSpinner,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const SendOfferLetter = ({ student, internshipId, onSuccess, onCancel }) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [internship, setInternship] = useState(null);
  const [templates, setTemplates] = useState([]);

  const [offerDetails, setOfferDetails] = useState({
    joiningDate: "",
    position: "",
    templateId: "",
  });

  const partnerId = localStorage.getItem("partnerId");

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const response = await axios.get(`/api/interns/${internshipId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!partnerId) return;
      try {
        const res = await axios.get(`/api/templates?partnerId=${partnerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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
          partnerId,
          student_id: student._id,
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
          qualifications: Array.isArray(internship.qualifications)
            ? internship.qualifications
            : (internship.qualifications || "").split(",").map(q => q.trim()),
          contactInfo: {
            name: "HR Manager",
            email: "hr@example.com",
            phone: "9876543210",
          },
          schoolAdminId: localStorage.getItem("schoolAdminId") || null,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      toast.success("Offer sent successfully!");
      if (onSuccess) onSuccess(response.data);

    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to send offer letter";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-lg">Send Offer Letter</h4>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {!internship ? (
        <div className="flex items-center justify-center p-4">
          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
          Loading internship details...
        </div>
      ) : (
        <>
          {/* Internship Summary */}
          <div className="mb-4 bg-blue-50 p-3 rounded">
            <p className="font-medium">{internship.jobTitle}</p>
            <p>Company: {internship.companyName}</p>
            <p>Location: {internship.location}</p>
            <p>Duration: {internship.duration || internship.endDateOrDuration}</p>
          </div>

          {/* Candidate Info */}
          <div className="mb-4 bg-gray-50 p-3 rounded">
            <p className="font-medium">Candidate: {student.name}</p>
            <p>Email: {student.email}</p>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <input
                type="text"
                value={offerDetails.position}
                onChange={(e) =>
                  setOfferDetails((prev) => ({ ...prev, position: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Joining Date</label>
              <input
                type="date"
                value={offerDetails.joiningDate}
                onChange={(e) =>
                  setOfferDetails((prev) => ({ ...prev, joiningDate: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Offer Template</label>
              <select
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={offerDetails.templateId}
                onChange={(e) =>
                  setOfferDetails((prev) => ({ ...prev, templateId: e.target.value }))
                }
              >
                <option value="">-- Select a Template --</option>
                {templates.map((tpl) => (
                  <option key={tpl._id} value={tpl._id}>
                    {tpl.name || tpl.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={isSending}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Back to List
            </button>
            <button
              onClick={handleSendOffer}
              disabled={isSending || !offerDetails.templateId}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
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
          </div>
        </>
      )}
    </div>
  );
};

export default SendOfferLetter;

