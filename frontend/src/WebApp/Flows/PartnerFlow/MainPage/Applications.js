import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faClock,
  faDollarSign,
  faEye,
  faStar,
  faDownload,
  faLock,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal";
import ScheduleForm from "./ScheduleForm";
import { ApplicationsTable, ShortlistedTable } from "./Tables";

const SHORTLIST_API_BASE_URL = process.env.REACT_APP_SHORTLIST_API_BASE_URL || "http://localhost:8001";

const InternshipList = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partnerData, setPartnerData] = useState(null);

  const [applications, setApplications] = useState({});
  const [loadingApplications, setLoadingApplications] = useState({});
  const [shortlistedCandidates, setShortlistedCandidates] = useState({});
  const [modalData, setModalData] = useState({
    open: false,
    internshipId: null,
    type: null,
    loading: false,
  });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [joiningDate, setJoiningDate] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [sendingOffer, setSendingOffer] = useState(false);

  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [selectedInternshipForSchedule, setSelectedInternshipForSchedule] = useState(null);

  const partnerId = localStorage.getItem("partnerId");

  useEffect(() => {
  const fetchPartnerData = async () => {
    try {
      const response = await axios.get(`/api/partners/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setPartnerData(response.data);

      // Fetch internships using the authenticated partner's ID
      if (response.data?._id) {
        fetchInternships(response.data._id);
      } else {
        throw new Error("Partner ID not found in profile");
      }
    } catch (err) {
      console.error("Failed to fetch partner data:", err);
      setError("Unable to load partner profile");
      setLoading(false);
    }
  };

  const fetchInternships = async (partnerId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/interns/partner/${partnerId}`);
      setInternships(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load internships");
    } finally {
      setLoading(false);
    }
  };

  fetchPartnerData();
}, []);


const hasPremiumAccess = () => {
  const plan = partnerData?.planType?.trim().toLowerCase();
  return partnerData?.isPremium && (plan === "premium basic" || plan === "premium plus");
};

const hasFullPremiumAccess = () => {
  const plan = partnerData?.planType?.trim().toLowerCase();
  return partnerData?.isPremium && plan === "premium plus";
};

  const calculateDaysAgo = (date) => {
    const posted = new Date(date);
    const now = new Date();
    const diff = now - posted;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (days === 0) return hours === 0 ? "Just now" : `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const fetchApplications = async (internshipId) => {
  if (!hasPremiumAccess()) {
    alert(`Please upgrade to Premium Basic or higher to view applications`);
    return;
  }

  try {
    setLoadingApplications(prev => ({ ...prev, [internshipId]: true }));
    const { data } = await axios.get(`/api/applications/internship/${internshipId}`);
    setApplications(prev => ({
      ...prev,
      [internshipId]: Array.isArray(data.applications) ? data.applications : [],
    }));
  } catch (err) {
    console.warn("Could not fetch applications:", err.message);
    setApplications(prev => ({ ...prev, [internshipId]: [] }));
  } finally {
    setLoadingApplications(prev => ({ ...prev, [internshipId]: false }));
    setModalData({ open: true, internshipId, type: "applications", loading: false });
  }
};


  const handleShortlist = async (id, description, skills) => {
    if (!hasPremiumAccess()) {
      alert(`Please upgrade to Premium Basic or higher to shortlist candidates`);
      return;
    }

    try {
      setModalData({ open: true, internshipId: id, type: "shortlisted", loading: true });
      const resumeUrls = (applications[id] || []).map((s) => s.resumeUrl);
      if (!resumeUrls.length) throw new Error("No applications to shortlist");

      const formData = new FormData();
      formData.append("job_description", description);
      formData.append("job_skills", JSON.stringify(skills));
      resumeUrls.forEach((url) => formData.append("resumes", url));
      formData.append("internship_id", id);

      const { data } = await axios.post(
        `${SHORTLIST_API_BASE_URL}/partner/shortlist`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setShortlistedCandidates((prev) => ({
        ...prev,
        [id]: data.shortlisted_candidates,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setModalData((prev) => ({ ...prev, loading: false }));
    }
  };

  const showShortlisted = async (internshipId) => {
    if (!hasPremiumAccess()) {
      alert(`Please upgrade to Premium Basic or higher to view shortlisted candidates`);
      return;
    }

    try {
      setModalData({ open: true, internshipId, type: "shortlisted", loading: true });
      const { data } = await axios.get(
        `${SHORTLIST_API_BASE_URL}/partner/shortlisted/${internshipId}`
      );
      setShortlistedCandidates((prev) => ({
        ...prev,
        [internshipId]: data.shortlisted_candidates,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setModalData((prev) => ({ ...prev, loading: false }));
    }
  };

  const updateApplicationStatus = async (studentId, status) => {
    try {
      await axios.put(`/api/applications/${studentId}/status`, { status });
      setApplications((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          updated[key] = updated[key].map((s) =>
            s._id === studentId ? { ...s, status } : s
          );
        });
        return updated;
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendOffer = (student) => {
    const internship = internships.find(i => i._id === modalData.internshipId);
    setSelectedStudent({ ...student, internship_id: modalData.internshipId });
    setJoiningDate(
      internship?.startDate
        ? new Date(internship.startDate).toISOString().split("T")[0]
        : ""
    );
    setTemplateId("");

    axios
      .get(`/api/templates?partnerId=${partnerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setTemplates(res.data))
      .catch(console.error);
  };

  const handleSendOfferLetter = async () => {
    if (!templateId || !joiningDate) return alert("Template and joining date required");

    try {
      setSendingOffer(true);

      const internship = internships.find(i => i._id === selectedStudent.internship_id);
      const schoolAdminId = localStorage.getItem("schoolAdminId");

      await axios.post(`/api/offer-letters`, {
        student_id: selectedStudent._id,
        internshipId: internship._id,
        templateId,
        name: selectedStudent.name,
        email: selectedStudent.email,
        position: internship.jobTitle,
        company: internship.companyName,
        location: internship.location,
        duration: internship.endDateOrDuration,
        startDate: joiningDate,
        internshipType: internship.internshipType,
        compensationDetails: internship.compensationDetails,
        jobDescription: internship.jobDescription,
        qualifications: internship.qualifications,
        contactInfo: {
          name: "HR Manager",
          email: "hr@company.com",
          phone: "9876543210",
        },
        noticePeriod: "2 weeks",
        schoolAdminId: schoolAdminId || null
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      alert("Offer sent successfully!");
      setSelectedStudent(null);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSendingOffer(false);
    }
  };

  const handleSchedule = (internshipId) => {
    if (!hasFullPremiumAccess()) {
      alert(`Please upgrade to Premium Plus to schedule interviews`);
      return;
    }
    setSelectedInternshipForSchedule(internshipId);
    setScheduleFormOpen(true);
  };

  const closeModal = () =>
    setModalData({ open: false, internshipId: null, type: null, loading: false });

  const showPremiumLock = (featureName, requiredPlan = "Premium Basic") => (
    <div className="relative group">
      <button 
        className="flex items-center gap-2 px-5 py-2 bg-gray-400 text-white font-semibold rounded-lg shadow-lg cursor-not-allowed"
        disabled
      >
        <FontAwesomeIcon icon={faLock} /> {featureName}
      </button>
      <div className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full mb-2 whitespace-nowrap">
        {requiredPlan === "Premium Basic" 
          ? "Upgrade to Premium Basic to access this feature"
          : "Upgrade to Premium Plus to access this feature"}
      </div>
    </div>
  );

  if (loading)
    return <div className="text-center text-lg text-gray-700">Loading internships...</div>;
  if (error)
    return (
      <div className="text-center text-lg text-red-500">
        {error}
        <button
          onClick={() => window.location.reload()}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="font-poppins max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
            <h2 className="text-lg font-medium mb-4">
              Send Offer to {selectedStudent.name}
            </h2>
            <label className="block mb-2">Joining Date:</label>
            <input
              type="date"
              className="border w-full mb-4 p-2 rounded"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
            <label className="block mb-2">Select Offer Template:</label>
            <select
              className="border w-full mb-4 p-2 rounded"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="" disabled>
                -- Select Template --
              </option>
              {templates.map((tpl) => (
                <option key={tpl._id} value={tpl._id}>
                  {tpl.name || tpl.title}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setSelectedStudent(null)}
                disabled={sendingOffer}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                  sendingOffer ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleSendOfferLetter}
                disabled={sendingOffer}
              >
                {sendingOffer ? "Sending..." : "Send Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-900">
          Internships Posted by Partner
        </h2>
        {partnerData && (
          <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
            partnerData.isPremium 
              ? partnerData.planType === "Premium Plus"
                ? "bg-purple-100 text-purple-800"
                : "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}>
            {partnerData.isPremium && (
              <FontAwesomeIcon icon={faCrown} className={
                partnerData.planType === "Premium Plus" ? "text-purple-500" : "text-blue-500"
              } />
            )}
            {partnerData.planType === "Freemium" && "Free Partner"}
            {partnerData.planType === "Premium Basic" && "Premium Basic"}
            {partnerData.planType === "Premium Plus" && "Premium Plus"}
            {partnerData.premiumExpiration && partnerData.isPremium && (
              <span className="text-xs ml-2">
                (Expires: {new Date(partnerData.premiumExpiration).toLocaleDateString()})
              </span>
            )}
          </div>
        )}
      </div>

    {internships.length === 0 ? (
  <div className="text-center text-gray-500 text-lg mt-10">
    🚫 No internships posted yet. Post one to see candidates here.
  </div>
) : (
  internships.map((internship) =>  {
          const compensationText =
            internship.internshipType === "STIPEND"
              ? `${internship.compensationDetails?.amount} ${internship.compensationDetails?.currency} per ${internship.compensationDetails?.frequency?.toLowerCase()}`
              : internship.internshipType === "FREE"
              ? "Unpaid / Free"
              : internship.internshipType === "PAID"
              ? `Student Pays: ${internship.compensationDetails?.amount} ${internship.compensationDetails?.currency}`
              : "N/A";

          return (
            <div
              key={internship._id}
              className="mb-6 p-6 border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition duration-300 ease-in-out"
            >
              <div className="flex items-center mb-4">
                <img
                  src={internship.imgUrl || "https://via.placeholder.com/150"}
                  alt={internship.companyName}
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div>
                  <h3 className="text-xl font-semibold">{internship.jobTitle}</h3>
                  <p className="text-gray-600">
                    {internship.companyName} • {calculateDaysAgo(internship.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-gray-600 mb-4">
                <p className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />{" "}
                  {internship.location} • {internship.jobType}
                </p>
                <p className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faClock} className="mr-2" />{" "}
                  {new Date(internship.startDate).toLocaleDateString()} – {new Date(internship.endDateOrDuration).toLocaleDateString()}
                </p>
                <p className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faDollarSign} className="mr-2" />{" "}
                  {compensationText}
                </p>
                <p className="mt-2">
                  <strong>Job Description:</strong>{" "}
                  {internship.jobDescription || "Not provided"}
                </p>
                <p className="mt-1">
                  <strong>Qualifications:</strong>{" "}
                  {Array.isArray(internship.qualifications)
                    ? internship.qualifications.join(", ")
                    : internship.qualifications?.match(/[A-Z]?[a-z]+/g)?.join(", ") || "Not provided"}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-4">
  {/* View Applications - Available for Premium Basic and Premium Plus */}
  {hasPremiumAccess() ? (
    <button
      onClick={() => fetchApplications(internship._id)}
      disabled={loadingApplications[internship._id]}
      className={`flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition duration-200 ${
        loadingApplications[internship._id] ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <FontAwesomeIcon icon={faEye} /> View Applications
    </button>
  ) : (
    showPremiumLock("View Applications", "Premium Basic")
  )}

                {/* Shortlist - Available for Premium Basic and Premium Plus */}
                {hasPremiumAccess() || hasFullPremiumAccess() ? (
                  <button
                    onClick={() =>
                      handleShortlist(
                        internship._id,
                        internship.jobDescription,
                        internship.qualifications || []
                      )
                    }
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-400 to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:from-green-500 hover:to-teal-600 transform hover:scale-105 transition duration-200"
                  >
                    <FontAwesomeIcon icon={faStar} /> Shortlist
                  </button>
                ) : (
                  showPremiumLock("Shortlist", "Premium Basic")
                )}

                {/* Shortlisted Resumes - Available for Premium Basic and Premium Plus */}
                {hasPremiumAccess() || hasFullPremiumAccess() ? (
                  <button
                    onClick={() => showShortlisted(internship._id)}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 transform hover:scale-105 transition duration-200"
                  >
                    <FontAwesomeIcon icon={faDownload} /> Shortlisted Resumes
                  </button>
                ) : (
                  showPremiumLock("Shortlisted Resumes", "Premium Basic")
                )}

                {/* Schedule - Only for Premium Plus */}
                {hasFullPremiumAccess() ? (
                  <button
                    onClick={() => handleSchedule(internship._id)}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition duration-200"
                  >
                    <FontAwesomeIcon icon={faClock} /> Schedule
                  </button>
                ) : (
                  showPremiumLock("Schedule", "Premium Plus")
                )}
              </div>
            </div>
          );
        })
      )}

      <Modal
        isOpen={modalData.open}
        onClose={closeModal}
        title={modalData.type === "applications" ? "Applications" : "Shortlisted Candidates"}
        isLoading={modalData.loading}
      >
        {modalData.type === "applications" && !modalData.loading && (
          (applications[modalData.internshipId] || []).length === 0
            ? <p className="p-6 text-center text-gray-600">No applications yet.</p>
            : <ApplicationsTable
                applications={applications[modalData.internshipId]}
                onStatusUpdate={updateApplicationStatus}
              />
        )}

        {modalData.type === "shortlisted" && !modalData.loading && (
          (shortlistedCandidates[modalData.internshipId] || []).length === 0
            ? <p className="p-6 text-center text-gray-600">No candidates shortlisted yet.</p>
            : <ShortlistedTable
                candidates={shortlistedCandidates[modalData.internshipId]}
                internshipId={modalData.internshipId}
                onSendOffer={handleSendOffer}
              />
        )}
      </Modal>

      <Modal
        isOpen={scheduleFormOpen}
        onClose={() => setScheduleFormOpen(false)}
        title="Create Internship Schedule"
      >
        {selectedInternshipForSchedule && (
          <ScheduleForm
            internshipId={selectedInternshipForSchedule}
            onClose={() => setScheduleFormOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default InternshipList;