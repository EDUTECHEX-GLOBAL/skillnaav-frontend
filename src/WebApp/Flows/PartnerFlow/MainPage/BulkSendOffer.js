import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const BulkSendOffer = ({ selectedStudents, internshipId, onCancel, onSuccess }) =>  {
  const [offerDetails, setOfferDetails] = useState({
    joiningDate: "",
    position: "",
    templateId: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [internship, setInternship] = useState(null);
  const [templates, setTemplates] = useState([]);
  const partnerId = localStorage.getItem("partnerId");

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const res = await axios.get(`/api/interns/${internshipId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = res.data;
        setInternship(data);
        setOfferDetails((prev) => ({
          ...prev,
          position: data.jobTitle,
          joiningDate: data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "",
        }));
      } catch (err) {
        console.error("Error loading internship:", err);
      }
    };

    const fetchTemplates = async () => {
      try {
        const res = await axios.get(`/api/templates?partnerId=${partnerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTemplates(res.data);
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      }
    };

    fetchInternship();
    fetchTemplates();
  }, [internshipId, partnerId]);

const sendOfferToStudent = async (student) => {
    await axios.post(
      "/api/offer-letters",
      {
        partnerId,
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        internshipId,
        templateId: offerDetails.templateId,
        position: offerDetails.position,
        startDate: offerDetails.joiningDate,
        company: internship?.companyName,
        location: internship?.location,
        duration: internship?.duration || internship?.endDateOrDuration,
        internshipType: internship?.internshipType,
        compensationDetails: internship?.compensationDetails,
        jobDescription: internship?.jobDescription,
        qualifications: Array.isArray(internship?.qualifications)
          ? internship.qualifications
          : (internship?.qualifications || "").split(",").map((q) => q.trim()),
        contactInfo: {
          name: "HR Manager",
          email: "hr@example.com",
          phone: "9876543210",
        },
        schoolAdminId: localStorage.getItem("schoolAdminId") || null,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
  };

 const handleSendBulk = async () => {
  if (!offerDetails.templateId || !offerDetails.joiningDate) {
    setError("Please select template and joining date");
    return;
  }
  setIsSending(true);
  setError(null);

  try {
    for (const student of selectedStudents) {
      await sendOfferToStudent(student);
    }
    toast.success("Offer letters sent successfully!");
    if (onSuccess) onSuccess(selectedStudents); // Pass the students sent offers
  } catch (err) {
    setError("Failed to send some offer letters");
    toast.error("Failed to send some offer letters");
  } finally {
    setIsSending(false);
  }
};


  

  return (
    <div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Position</label>
        <input
          type="text"
          value={offerDetails.position}
          onChange={(e) => setOfferDetails((prev) => ({ ...prev, position: e.target.value }))}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Joining Date</label>
        <input
          type="date"
          value={offerDetails.joiningDate}
          onChange={(e) => setOfferDetails((prev) => ({ ...prev, joiningDate: e.target.value }))}
          className="w-full border rounded px-3 py-2"
          min={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Offer Template</label>
        <select
          value={offerDetails.templateId}
          onChange={(e) => setOfferDetails((prev) => ({ ...prev, templateId: e.target.value }))}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select a template</option>
          {templates.map((tpl) => (
            <option key={tpl._id} value={tpl._id}>
              {tpl.name || tpl.title}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={isSending}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSendBulk}
          disabled={isSending || !offerDetails.templateId || !offerDetails.joiningDate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:opacity-50"
        >
          {isSending ? "Sending..." : "Send Offers"}
        </button>
      </div>
    </div>
  );
};

export default BulkSendOffer;
