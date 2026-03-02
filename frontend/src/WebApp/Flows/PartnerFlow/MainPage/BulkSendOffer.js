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

// Fix Bug 7: validate schoolAdminId before sending
  const getValidSchoolAdminId = () => {
    const raw = localStorage.getItem("schoolAdminId");
    return raw && /^[a-f\d]{24}$/i.test(raw) ? raw : null;
  };

  const sendOfferToStudent = async (student) => {
    // Fix Bug 1: guard against undefined/null student entries
    if (!student || !student.student_id || !student.email) {
      console.warn("Skipping invalid student entry:", student);
      return;
    }
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
        // Fix Bug 6: use real partner/internship contact info, not hardcoded placeholders
        contactInfo: {
          name: internship?.contactPerson || "HR Manager",
          email: internship?.contactEmail || "",
          phone: internship?.contactPhone || "",
        },
        schoolAdminId: getValidSchoolAdminId(),
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

    // Fix Bug 5: use Promise.allSettled so one failure doesn't abort the rest
    const validStudents = selectedStudents.filter((s) => s && s.student_id && s.email);
    const results = await Promise.allSettled(validStudents.map((s) => sendOfferToStudent(s)));

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.filter((r) => r.status === "rejected").length;

    if (failedCount === 0) {
      toast.success(`All ${succeeded} offer letter${succeeded !== 1 ? "s" : ""} sent successfully!`);
      if (onSuccess) onSuccess(validStudents);
    } else if (succeeded > 0) {
      toast.warn(`${succeeded} sent, ${failedCount} failed. Please retry the failed ones.`);
      setError(`${failedCount} offer(s) failed to send. The rest were sent successfully.`);
      // Still mark the succeeded ones in parent state
      const failedIndexes = new Set(
        results.map((r, i) => (r.status === "rejected" ? i : -1)).filter((i) => i >= 0)
      );
      const succeededStudents = validStudents.filter((_, i) => !failedIndexes.has(i));
      if (onSuccess) onSuccess(succeededStudents);
    } else {
      toast.error("All offer letters failed to send.");
      setError("Failed to send offer letters. Please try again.");
    }

    setIsSending(false);
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