import React, { useState, useEffect, useRef } from "react";
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
  faTimes,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal";
import ScheduleForm from "./ScheduleForm";
import { ApplicationsTable, ShortlistedTable } from "./Tables";
import { toast } from "react-toastify";
import ConfirmCloseSchedule from "./ConfirmCloseSchedule";
import InternshipScheduleViewer from "./InternshipScheduleViewer";
import TimeSlotsSelected from "./TimeSlotsSelected";

const AI_API = "/api/ai";

const InternshipList = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partnerData, setPartnerData] = useState(null);

  const [applications, setApplications] = useState({});
  const [loadingApplications, setLoadingApplications] = useState({});
  const [shortlistedCandidates, setShortlistedCandidates] = useState({});
  const [loadingShortlist, setLoadingShortlist] = useState(false);
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

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Ref to hold partner ID so pagination buttons can access it without stale closure
  const partnerIdRef = useRef(null);

  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [selectedInternshipForSchedule, setSelectedInternshipForSchedule] = useState(null);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [scheduleViewerOpen, setScheduleViewerOpen] = useState(false);
  const [selectedInternshipForView, setSelectedInternshipForView] = useState(null);

  const [timeSlotsModal, setTimeSlotsModal] = useState({
    open: false,
    internshipId: null,
  });

  // ─── fetchInternships at component scope so pagination can call it ────────
  const fetchInternships = async (pid, pageNum = 1) => {
    if (!pid) return;

    pageNum === 1 ? setLoading(true) : setLoadingMore(true);

    try {
      const response = await axios.get(`/api/interns/partner/${pid}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: { page: pageNum, limit: 6 },
      });

      const newData = response.data.data || [];
      const tp = response.data.totalPages || 1;

      setInternships(newData);
      setPage(pageNum);
      setTotalPages(tp);
      setHasMore(pageNum < tp);
    } catch (err) {
      console.error("Error fetching internships:", err);
      if (pageNum === 1) setInternships([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchPartnerData = async () => {
      try {
        const response = await axios.get(`/api/partners/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setPartnerData(response.data);

        if (response.data?._id) {
          partnerIdRef.current = response.data._id;
          fetchInternships(response.data._id, 1);
        } else {
          throw new Error("Partner ID not found in profile");
        }
      } catch (err) {
        console.error("Failed to fetch partner data:", err);
        setError("Unable to load partner profile");
        setLoading(false);
      }
    };

    fetchPartnerData();
  }, []);

  const toggleApplicationOpen = async (internshipId, newStatus) => {
    try {
      setInternships(prev =>
        prev.map(intern =>
          intern._id === internshipId ? { ...intern, applicationOpen: newStatus } : intern
        )
      );

      await axios.put(`/api/interns/${internshipId}`, { applicationOpen: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      toast.success(`Internship applications are now ${newStatus ? "open" : "closed"}.`);
    } catch (error) {
      console.error("Failed to update application status:", error);
      toast.error("Failed to update application status. Please try again.");

      setInternships(prev =>
        prev.map(intern =>
          intern._id === internshipId ? { ...intern, applicationOpen: !newStatus } : intern
        )
      );
    }
  };

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
      toast.error(`Please upgrade to Premium Basic or higher to view applications`);
      return;
    }

    try {
      setLoadingApplications(prev => ({ ...prev, [internshipId]: true }));
      setModalData({ open: true, internshipId, type: "applications", loading: true });
      const { data } = await axios.get(`/api/applications/internship/${internshipId}`);
      setApplications(prev => ({
        ...prev,
        [internshipId]: Array.isArray(data.applications) ? data.applications : [],
      }));
    } catch (err) {
      console.warn("Could not fetch applications:", err.message);
      setApplications(prev => ({ ...prev, [internshipId]: [] }));
      toast.error("Failed to load applications.");
    } finally {
      setLoadingApplications(prev => ({ ...prev, [internshipId]: false }));
      setModalData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleShortlist = async (id, description, skills) => {
    if (!hasPremiumAccess()) {
      toast.error(`Please upgrade to Premium Basic or higher to shortlist candidates`);
      return;
    }

    setLoadingShortlist(true);
    setModalData({ open: true, internshipId: id, type: "shortlisted", loading: true });

    try {
      let resumes = [];

      if (!applications[id] || applications[id].length === 0) {
        try {
          const { data } = await axios.get(`/api/applications/internship/${id}`);
          const fetchedApplications = Array.isArray(data.applications) ? data.applications : [];
          setApplications(prev => ({ ...prev, [id]: fetchedApplications }));
          resumes = fetchedApplications.map((s) => s.resumeUrl).filter(Boolean);
        } catch (err) {
          console.error("Error fetching applications for shortlisting:", err);
        }
      } else {
        resumes = applications[id].map((s) => s.resumeUrl).filter(Boolean);
      }

      const formData = new FormData();
      formData.append("job_description", description || "");
      formData.append("job_skills", JSON.stringify(skills || []));
      resumes.forEach((url) => formData.append("resumes", url));
      formData.append("internship_id", id);

      const { data } = await axios.post(
        `${AI_API}/partner/shortlist`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setShortlistedCandidates((prev) => ({
        ...prev,
        [id]: data.shortlisted_candidates || [],
      }));
      toast.success("Candidates shortlisted successfully!");
    } catch (err) {
      console.error("Shortlisting error:", err);
      toast.error("Shortlisting failed. Please try again.");
      setError(err.message);
    } finally {
      setLoadingShortlist(false);
      setModalData((prev) => ({ ...prev, loading: false }));
    }
  };

  const showShortlisted = async (internshipId) => {
    if (!hasPremiumAccess()) {
      toast.error(`Please upgrade to Premium Basic or higher to view shortlisted candidates`);
      return;
    }

    setLoadingShortlist(true);
    setModalData({ open: true, internshipId, type: "shortlisted", loading: true });

    try {
      const { data } = await axios.get(
        `${AI_API}/partner/shortlisted/${internshipId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setShortlistedCandidates((prev) => ({
        ...prev,
        [internshipId]: data.shortlisted_candidates,
      }));
    } catch (err) {
      toast.error("Failed to load shortlisted candidates.");
      setError(err.message);
    } finally {
      setLoadingShortlist(false);
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
      .get(`/api/templates?partnerId=${partnerData?._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        setTemplates(res.data);
      })
      .catch(err => {
        console.error("Error fetching templates:", err);
        toast.error("Failed to load templates");
      });
  };

  const handleSendOfferLetter = async () => {
    if (!templateId || !joiningDate) {
      toast.warn("Template and joining date are required.");
      return;
    }

    try {
      setSendingOffer(true);

      const internship = internships.find(i => i._id === selectedStudent?.internship_id);
      const schoolAdminId = localStorage.getItem("schoolAdminId");

      const payload = {
        partnerId: partnerData?._id,
        student_id: selectedStudent?._id,
        internshipId: internship?._id,
        templateId,
        name: selectedStudent?.name,
        email: selectedStudent?.email,
        position: internship?.jobTitle,
        company: internship?.companyName,
        location: internship?.location,
        duration: internship?.endDateOrDuration,
        startDate: joiningDate,
        internshipType: internship?.internshipType,
        compensationDetails: internship?.compensationDetails,
        jobDescription: internship?.jobDescription,
        qualifications: Array.isArray(internship?.qualifications)
          ? internship.qualifications
          : (typeof internship?.qualifications === 'string'
            ? internship.qualifications.match(/[A-Z]?[a-z]+/g)
            : []),
        contactInfo: {
          name: "HR Manager",
          email: "hr@company.com",
          phone: "9876543210",
        },
        noticePeriod: "2 weeks",
        schoolAdminId: schoolAdminId || null,
      };

      await axios.post(`/api/offer-letters`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Offer sent successfully!");
      setSelectedStudent(null);
    } catch (err) {
      console.error("Offer letter error:", err);
      toast.error(err.response?.data?.error || "Failed to send offer letter");
    } finally {
      setSendingOffer(false);
    }
  };

  const handleSchedule = (internshipId) => {
    if (!hasFullPremiumAccess()) {
      toast.error(`Please upgrade to Premium Plus to schedule interviews`);
      return;
    }
    setSelectedInternshipForSchedule(internshipId);
    setScheduleFormOpen(true);
  };

  const openScheduleViewer = (internshipId) => {
    if (!hasPremiumAccess()) {
      toast.error("Please upgrade to Premium Basic or higher to view schedules");
      return;
    }
    setSelectedInternshipForView(internshipId);
    setScheduleViewerOpen(true);
  };

  const openTimeSlotsSelected = (internshipId) => {
    if (!hasFullPremiumAccess()) {
      toast.error("Please upgrade to Premium Plus to view accepted students");
      return;
    }
    setTimeSlotsModal({ open: true, internshipId });
  };

  const handleConfirmClose = async (internshipId) => {
    try {
      await axios.put('/api/schedule/close', {
        internshipId,
        partnerId: localStorage.getItem("partnerId")
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      toast.success("Schedule closed permanently!");
      setConfirmCloseOpen(false);

      setInternships(prev =>
        prev.map(i => i._id === internshipId ? { ...i, isScheduleClosed: true } : i)
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to close schedule");
    }
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700 bg-gray-100">
        <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-xl">
          <div className="w-16 h-16 border-4 border-dashed rounded-full border-blue-500 animate-spin mb-4"></div>
          <p className="text-xl font-semibold">Loading internships...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait a moment.</p>
        </div>
      </div>
    );

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
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
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

      {/* ─── Internship Cards ─────────────────────────────────────────────── */}
      {internships.length === 0 ? (
        <div className="text-center text-gray-500 text-lg mt-10">
          🚫 No internships posted yet. Post one to see candidates here.
        </div>
      ) : (
        internships.map((internship) => {
          const compensationText =
            internship.internshipType === "STIPEND"
              ? `${internship.compensationDetails?.amount} ${internship.compensationDetails?.currency} per ${internship.compensationDetails?.frequency?.toLowerCase()}`
              : internship.internshipType === "FREE"
                ? "Unpaid / Free"
                : internship.internshipType === "PAID"
                  ? `Student Pays: ${internship.compensationDetails?.amount} ${internship.compensationDetails?.currency}`
                  : "N/A";

          const isPaidInternship = (internship?.internshipType || "").toUpperCase() === "PAID";

          return (
            <div
              key={internship._id}
              className="mb-6 p-6 border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition duration-300 ease-in-out"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={internship.imgUrl || "https://via.placeholder.com/150"}
                    alt={internship.companyName}
                    className="w-16 h-16 rounded-full object-cover shadow-md"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{internship.jobTitle}</h3>
                    <p className="text-gray-600 text-sm mt-0.5">
                      {internship.companyName} • {calculateDaysAgo(internship.createdAt)}
                    </p>
                  </div>
                </div>

                <label className="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={internship.applicationOpen}
                    onChange={() => toggleApplicationOpen(internship._id, !internship.applicationOpen)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gradient-to-r from-red-500 to-pink-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-teal-500 peer-checked:to-cyan-600 transition-colors duration-300"></div>
                  <span className="ml-3 text-sm font-semibold text-gray-900">
                    {internship.applicationOpen ? "Open" : "Closed"}
                  </span>
                </label>
              </div>

              <div className="text-gray-600 mb-4">
                <p className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                  {internship.location} • {internship.jobType}
                </p>
                <p className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faClock} className="mr-2" />
                  {new Date(internship.startDate).toLocaleDateString()} – {new Date(internship.endDateOrDuration).toLocaleDateString()}
                </p>
                <p className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
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
                {hasPremiumAccess() ? (
                  <button
                    onClick={() => fetchApplications(internship._id)}
                    disabled={loadingApplications[internship._id]}
                    className={`flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition duration-200 ${
                      loadingApplications[internship._id] ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loadingApplications[internship._id] ? "Loading..." : (
                      <><FontAwesomeIcon icon={faEye} /> View Applications</>
                    )}
                  </button>
                ) : (
                  showPremiumLock("View Applications", "Premium Basic")
                )}

                {hasPremiumAccess() || hasFullPremiumAccess() ? (
                  <button
                    onClick={() => handleShortlist(internship._id, internship.jobDescription, internship.qualifications || [])}
                    disabled={loadingShortlist}
                    className={`flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-400 to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:from-green-500 hover:to-teal-600 transform hover:scale-105 transition duration-200 ${
                      loadingShortlist ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loadingShortlist ? "Shortlisting..." : (
                      <><FontAwesomeIcon icon={faStar} /> Shortlist</>
                    )}
                  </button>
                ) : (
                  showPremiumLock("Shortlist", "Premium Basic")
                )}

                {hasPremiumAccess() || hasFullPremiumAccess() ? (
                  <button
                    onClick={() => showShortlisted(internship._id)}
                    disabled={loadingShortlist}
                    className={`flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 transform hover:scale-105 transition duration-200 ${
                      loadingShortlist ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loadingShortlist ? "Loading..." : (
                      <><FontAwesomeIcon icon={faDownload} /> Shortlisted Resumes</>
                    )}
                  </button>
                ) : (
                  showPremiumLock("Shortlisted Resumes", "Premium Basic")
                )}

                {isPaidInternship && (
                  hasFullPremiumAccess() ? (
                    <button
                      onClick={() => openTimeSlotsSelected(internship._id)}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-slate-600 to-gray-800 text-white font-semibold rounded-lg shadow-lg hover:from-slate-700 hover:to-gray-900 transform hover:scale-105 transition duration-200"
                    >
                      <FontAwesomeIcon icon={faCalendarAlt} /> Time Slots Selected
                    </button>
                  ) : (
                    showPremiumLock("Time Slots Selected", "Premium Plus")
                  )
                )}

                {hasFullPremiumAccess() ? (
                  <>
                    <button
                      onClick={() => handleSchedule(internship._id)}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition duration-200"
                    >
                      <FontAwesomeIcon icon={faClock} /> Internship Schedule
                    </button>

                    {hasPremiumAccess() ? (
                      <button
                        onClick={() => openScheduleViewer(internship._id)}
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 text-white font-semibold rounded-lg shadow-lg hover:from-cyan-600 hover:to-sky-700 transform hover:scale-105 transition duration-200"
                      >
                        <FontAwesomeIcon icon={faCalendarAlt} /> View Schedule
                      </button>
                    ) : (
                      showPremiumLock("View Schedule", "Premium Basic")
                    )}

                    <button
                      onClick={() => setConfirmCloseOpen(internship._id)}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:from-red-600 hover:to-pink-700 transform hover:scale-105 transition duration-200"
                    >
                      <FontAwesomeIcon icon={faTimes} /> Close Schedule
                    </button>
                  </>
                ) : (
                  showPremiumLock("Schedule", "Premium Plus")
                )}
              </div>
            </div>
          );
        })
      )}

      {/* ─── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
          {/* Prev button */}
          <button
            onClick={() => fetchInternships(partnerIdRef.current, page - 1)}
            disabled={page === 1 || loadingMore}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Prev
          </button>

          {/* Page number buttons */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => fetchInternships(partnerIdRef.current, pageNum)}
              disabled={loadingMore}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                pageNum === page
                  ? "bg-blue-600 text-white shadow"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {pageNum}
            </button>
          ))}

          {/* Next button */}
          <button
            onClick={() => fetchInternships(partnerIdRef.current, page + 1)}
            disabled={!hasMore || loadingMore}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loadingMore ? "Loading..." : "Next →"}
          </button>
        </div>
      )}

      {/* ─── Modals ───────────────────────────────────────────────────────── */}
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

      <Modal
        isOpen={timeSlotsModal.open}
        onClose={() => setTimeSlotsModal({ open: false, internshipId: null })}
        title="Time Slots Selected"
      >
        {timeSlotsModal.internshipId && (
          <TimeSlotsSelected internshipId={timeSlotsModal.internshipId} />
        )}
      </Modal>

      <ConfirmCloseSchedule
        isOpen={!!confirmCloseOpen}
        onCancel={() => setConfirmCloseOpen(false)}
        onConfirm={() => handleConfirmClose(confirmCloseOpen)}
      />

      <InternshipScheduleViewer
        isOpen={scheduleViewerOpen}
        onClose={() => {
          setScheduleViewerOpen(false);
          setSelectedInternshipForView(null);
        }}
        internshipId={selectedInternshipForView}
        partnerId={partnerData?._id || localStorage.getItem("partnerId")}
      />
    </div>
  );
};

export default InternshipList;