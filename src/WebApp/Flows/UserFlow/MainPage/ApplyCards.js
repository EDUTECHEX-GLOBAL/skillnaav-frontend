import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "../../../../api/axiosInstance";
import {
  FaChevronDown,
  FaClipboardCheck,
  FaDollarSign,
  FaHeadset,
  FaMapMarkerAlt,
  FaTrash,
} from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import { toast } from "react-toastify";
import SkillAnalysis from "./SkillnaavAnalysis";
import ProctoredAssessment from "./AssessmentModal";

const MAX_LIMITS = {
  Free: { applications: 5, saves: 3 },
  Freemium: { applications: 5, saves: 3 },
  "Premium Basic": { applications: 25, saves: 25 },
  "Premium Plus": { applications: Infinity, saves: Infinity },
};

const parseStoredJson = (...keys) => {
  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (value) return JSON.parse(value);
    } catch {
      // Continue to the next storage key.
    }
  }
  return null;
};

const getUserToken = () => {
  const token = localStorage.getItem("userToken");
  if (!token) return null;
  try {
    return JSON.parse(token);
  } catch {
    return token;
  }
};

const isActiveTicket = (ticket) =>
  ticket.status !== "resolved" && ticket.status !== "closed";

const openInNewTab = (url) => {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) win.opener = null;
};

const getStatusStyle = (status) => {
  const value = status?.toLowerCase();
  if (value === "open")
    return {
      bg: "#dcfce7",
      text: "#166534",
      dot: "#22c55e",
      border: "#86efac",
    };
  if (value === "in-progress")
    return {
      bg: "#fef9c3",
      text: "#854d0e",
      dot: "#eab308",
      border: "#fde047",
    };
  if (value === "resolved")
    return {
      bg: "#f3e8ff",
      text: "#6b21a8",
      dot: "#a855f7",
      border: "#d8b4fe",
    };
  return { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8", border: "#cbd5e1" };
};

const TicketBadge = ({ ticket, index, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const active = isActiveTicket(ticket);
  const statusStyle = getStatusStyle(ticket.status);

  return (
    <button
      type="button"
      onClick={() => onClick(ticket)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: active ? "#f0fdf4" : "#f8fafc",
        border: `1.5px solid ${active ? "#86efac" : "#e2e8f0"}`,
        borderRadius: 20,
        padding: "4px 10px 4px 5px",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered ? "0 4px 10px rgba(0,0,0,0.10)" : "none",
        transition: "transform 0.12s, box-shadow 0.12s",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: active ? "#22c55e" : "#cbd5e1",
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </span>
      <span style={{ color: active ? "#166534" : "#64748b" }}>
        #{ticket._id?.slice(-6)}
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          background: statusStyle.bg,
          borderRadius: 10,
          padding: "1px 6px",
          fontSize: 10,
          color: statusStyle.text,
          fontWeight: 500,
          textTransform: "capitalize",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: statusStyle.dot,
            flexShrink: 0,
            animation: active
              ? "ticketPulse 1.5s ease-in-out infinite"
              : "none",
          }}
        />
        {ticket.status}
      </span>
    </button>
  );
};

const DropdownTicketRow = ({ ticket, index, onClick, onClose }) => {
  const [hovered, setHovered] = useState(false);
  const active = isActiveTicket(ticket);
  const statusStyle = getStatusStyle(ticket.status);

  return (
    <div
      onClick={() => {
        onClick(ticket);
        onClose();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        cursor: "pointer",
        background: hovered ? (active ? "#f0fdf4" : "#f8fafc") : "#fff",
        borderRadius: 10,
        transition: "background 0.12s",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: active ? "#22c55e" : "#cbd5e1",
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: active ? "#166534" : "#475569",
          }}
        >
          #{ticket._id?.slice(-6)}
        </p>
        {ticket.lastMessage && (
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: "#9ca3af",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {ticket.lastMessage.substring(0, 45)}
            {ticket.lastMessage.length > 45 ? "..." : ""}
          </p>
        )}
      </div>

      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          background: statusStyle.bg,
          border: `1px solid ${statusStyle.border}`,
          borderRadius: 10,
          padding: "2px 7px",
          fontSize: 10,
          color: statusStyle.text,
          fontWeight: 500,
          textTransform: "capitalize",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: statusStyle.dot,
            flexShrink: 0,
          }}
        />
        {ticket.status}
      </span>
    </div>
  );
};

const ApplyCards = ({ job, onBack }) => {
  const [isApplied, setIsApplied] = useState(false);
  const [resume, setResume] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [applicationCount, setApplicationCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showResumePopup, setShowResumePopup] = useState(false);
  const [showSkillAnalysis, setShowSkillAnalysis] = useState(false);
  const [planType, setPlanType] = useState("Free");
  const [schoolAdminId, setSchoolAdminId] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  //01-09-2026
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);

  const [existingResumes, setExistingResumes] = useState([]);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState(null);
  const [showResumeDropdown, setShowResumeDropdown] = useState(false);
  const [existingTickets, setExistingTickets] = useState([]);
  const [checkingTicket, setCheckingTicket] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const dropdownRef = useRef(null);
  const visibleCount = 2;

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchApplicationData = async () => {
      const userInfo = parseStoredJson("studentInfo", "userInfo");
      const studentId = userInfo?._id;
      const token = getUserToken();
      setSchoolAdminId(
        userInfo?.schoolAdminId || userInfo?.schoolAdmin || null,
      );

      if (!studentId) return;

      try {
        let freshPlan = userInfo?.planType || "Free";
        if (token) {
          try {
            const { data: profileData } = await axios.get(
              "/api/users/profile",
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            freshPlan = profileData.planType || freshPlan;
            localStorage.setItem(
              "studentInfo",
              JSON.stringify({ ...userInfo, planType: freshPlan }),
            );
          } catch {
            // Fall back to the locally stored plan type.
          }
        }
        setPlanType(freshPlan);

        const { data: appliedData } = await axios.get(
          `/api/applications/check-applied/${studentId}/${job._id}`,
        );
        setIsApplied(appliedData.isApplied);

        const { data: countData } = await axios.get(
          `/api/applications/count/${studentId}`,
        );
        setApplicationCount(countData.count);
      } catch (error) {
        console.error("Error fetching application data:", error);
      }
    };

    fetchApplicationData();
  }, [job._id]);

  useEffect(() => {
    const fetchResumes = async () => {
      const userInfo = parseStoredJson("studentInfo", "userInfo");
      const studentId = userInfo?._id;
      if (!studentId) return;

      try {
        const res = await axios.get(`/api/resumes/user/${studentId}`);
        setExistingResumes(res.data.resumes || []);
      } catch (error) {
        console.error("Error fetching resumes", error);
      }
    };

    fetchResumes();
  }, []);

  useEffect(() => {
    const fetchAssessment = async () => {
      const userInfo = parseStoredJson("studentInfo", "userInfo");
      const studentId = userInfo?._id;
      if (!studentId) return;

      try {
        const { data } = await axios.get(
          `/api/assessments/${studentId}/${job._id}`,
        );
        if (data?.assessment) setAssessment(data.assessment);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error fetching existing assessment:", error);
        }
      }
    };

    fetchAssessment();
  }, [job._id]);
  //01-09-2026
  useEffect(() => {
    const checkAssessmentSubmission = async () => {
      if (!assessment?._id) return;

      const userInfo = parseStoredJson("studentInfo", "userInfo");
      const studentId = userInfo?._id;

      if (!studentId) return;

      try {
        const { data } = await axios.get(
          `/api/assessments/submission/${studentId}/${assessment._id}`,
        );

        if (data?.submission) {
          setAssessmentCompleted(true);
        }
      } catch (error) {
        // No submission means assessment is not completed yet
        setAssessmentCompleted(false);
      }
    };

    checkAssessmentSubmission();
  }, [assessment?._id]);
  //01-09-2026
  useEffect(() => {
    const handleAssessmentCompleted = () => {
      setAssessmentCompleted(true);
    };

    window.addEventListener("assessmentCompleted", handleAssessmentCompleted);

    return () => {
      window.removeEventListener(
        "assessmentCompleted",
        handleAssessmentCompleted,
      );
    };
  }, []);

  const checkExistingTickets = useCallback(async () => {
    const userInfo = parseStoredJson("studentInfo", "userInfo");
    const token = getUserToken();
    if (!userInfo?._id || !token) return;

    setCheckingTicket(true);
    try {
      const { data } = await axios.get("/api/support/my-tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const matched = (data.tickets || [])
        .filter(
          (ticket) =>
            (ticket.courseName === job.jobTitle ||
              (job._id &&
                ticket.internshipId &&
                ticket.internshipId.toString() === job._id.toString())) &&
            ticket.category === "Internship Access",
        )
        .sort(
          (a, b) => (isActiveTicket(a) ? 0 : 1) - (isActiveTicket(b) ? 0 : 1),
        );
      setExistingTickets(matched);
    } catch (error) {
      console.error("Error checking existing tickets:", error);
      setExistingTickets([]);
    } finally {
      setCheckingTicket(false);
    }
  }, [job._id, job.jobTitle]);

  useEffect(() => {
    checkExistingTickets();
  }, [checkExistingTickets]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type))
      return toast.error("Only PDF, DOC and DOCX files are allowed.");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("File size should not exceed 5MB.");

    setResume(file);
    setSelectedResumeUrl(null);
  };

  const handleApply = async () => {
    if (isApplied) return;

    const userInfo = parseStoredJson("studentInfo", "userInfo");
    const studentId = userInfo?._id;
    const token = getUserToken();

    if (!studentId || !token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    if (job.internshipType === "STIPEND") {
      let studentAssessment = assessment;

      if (!studentAssessment) {
        try {
          const { data } = await axios.get(
            `/api/assessments/${studentId}/${job._id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          studentAssessment = data.assessment;
          if (studentAssessment) {
            setAssessment(studentAssessment);
          }
        } catch (error) {
          if (error.response?.status !== 404)
            console.error("Error fetching assessment:", error);
        }
      }

      // Subscription validation place before the assessment validation- 25-09-2026
      if (planType !== "Premium Plus" && planType !== "Premium Basic") {
        toast.error(
          "You must have a Premium Basic or Premium Plus subscription to apply for stipend internships.",
        );
        return;
      }

      // Assessment must exist - 25-09-2026
      if (!studentAssessment?._id) {
        toast.error(
          "Please generate and complete the assessment before applying.",
        );
        return;
      }

      // if (planType !== "Premium Plus" && planType !== "Premium Basic") {
      //   toast.error(
      //     "You must generate and complete the assessment before applying.",
      //   );
      //   return;
      // }

      // Check assessment submission
      let submission = null;
      try {
        const { data } = await axios.get(
          `/api/assessments/submission/${studentId}/${studentAssessment._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        submission = data.submission;
      } catch {
        submission = null;
      }

      // Assessment must be passed - 25-09-2026
      if (!submission) {
        toast.error("Please complete the assessment before applying.");
        return;
      }

      // if (!submission || submission.score < job.passingScore) {
      //   toast.error("You must pass the assessment to apply.");
      //   return;
      // }
      const candidatePercentage =
        submission.percentage != null
          ? submission.percentage
          : (submission.score / (submission.totalMarks || 1)) * 100;
      const requiredScore = job.passingScore || 60;
      if (candidatePercentage < requiredScore) {
        toast.error(`You must score at least ${requiredScore}% to apply.`);
        return;
      }
    }

    if (!resume && !selectedResumeUrl) {
      setShowResumePopup(true);
      return;
    }

    try {
      const { data: countData } = await axios.get(
        `/api/applications/count/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const maxApps = MAX_LIMITS[planType]?.applications || 5;
      if (countData.count >= maxApps) {
        setShowLimitPopup(true);
        return;
      }
    } catch (error) {
      console.error("Error checking application count:", error);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("internshipId", job._id);
      if (resume) formData.append("resume", resume);
      if (selectedResumeUrl) formData.append("resumeUrl", selectedResumeUrl);
      if (schoolAdminId) formData.append("schoolAdminId", schoolAdminId);

      const res = await axios.post("/api/applications/apply", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 201) {
        setIsApplied(true);
        const { data } = await axios.get(
          `/api/applications/count/${studentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setApplicationCount(data.count);
      }
    } catch (error) {
      const { status, data } = error.response || {};
      if (status === 403 || data?.message?.includes("already applied")) {
        toast.error("Please login to apply");
      } else {
        toast.error(data?.message || "Something went wrong.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkillAnalysis = () => {
    if (!job?.jobDescription || !job?.qualifications?.length) {
      toast.error("Job details are incomplete for skill analysis.");
      return;
    }
    setShowSkillAnalysis(true);
  };

  const handleGenerateAssessment = async () => {
    const userInfo = parseStoredJson("studentInfo", "userInfo");
    const studentId = userInfo?._id;
    if (!studentId) {
      toast.error("Please log in first.");
      return null;
    }

    if (assessment) {
      toast.error("You already have an assessment for this internship!");
      return assessment;
    }

    setLoadingAssessment(true);
    try {
      const response = await axios.post("/api/assessments/generate", {
        internshipId: job._id,
        studentId,
      });
      const generated = response.data?.assessment;
      setAssessment(generated);
      toast.success("AI Assessment generated successfully!");
      return generated;
    } catch (error) {
      console.error("Failed to fetch assessment:", error);
      const errMsg = error.response?.data?.message || "Failed to generate assessment. Please try again later.";
      toast.error(errMsg);
      return null;
    } finally {
      setLoadingAssessment(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    const deletedResume = existingResumes.find((item) => item._id === resumeId);
    try {
      await axios.delete(`/api/resumes/${resumeId}`);
      setExistingResumes((prev) =>
        prev.filter((item) => item._id !== resumeId),
      );
      if (deletedResume?.fileUrl === selectedResumeUrl)
        setSelectedResumeUrl(null);
      toast.success("Resume deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete resume");
    } finally {
      setResumeToDelete(null);
    }
  };

  const internshipContext = {
    internshipId: job._id,
    jobTitle: job.jobTitle,
    companyName: job.companyName,
    location: job.location,
    internshipType: job.internshipType,
    isApplied,
    applicationCount,
    planType,
    contactName: job.contactInfo?.name || null,
    contactEmail: job.contactInfo?.email || null,
    contactPhone: job.contactInfo?.phone || null,
  };

  const handleBadgeClick = (ticket) => {
    setShowDropdown(false);
    const url = `/user-support?ticketId=${encodeURIComponent(ticket._id)}`;
    openInNewTab(url);
  };

  const handleRaiseTicketClick = () => {
    setShowDropdown(false);
    const prefillKey = `userSupportPrefill:${Date.now()}`;
    localStorage.setItem(prefillKey, JSON.stringify(internshipContext));

    const url = `/user-support?prefillKey=${encodeURIComponent(prefillKey)}`;
    openInNewTab(url);
  };

  const activeTickets = existingTickets.filter(isActiveTicket);
  const latestActive = activeTickets[0] || null;
  const visibleBadges = activeTickets.slice(0, visibleCount);
  const hiddenBadges = activeTickets.slice(visibleCount);
  const hiddenCount = hiddenBadges.length;
  const maxAppsDisplay = MAX_LIMITS[planType]?.applications || 5;
  const selectedResumeName =
    existingResumes.find((item) => item.fileUrl === selectedResumeUrl)
      ?.fileName || "No resume selected";

  return (
    <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-full mx-auto p-5 sm:p-7 lg:p-10 pb-28 sm:pb-36 overflow-hidden font-poppins">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors duration-150 mb-5 border border-transparent hover:border-teal-100 min-h-[44px] min-w-[44px]"
        onClick={onBack}
        aria-label="Back to internships list"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to listings</span>
      </button>

      <div className="flex flex-col md:flex-row items-start justify-between mb-4 w-full min-w-0">
        <div className="flex items-start mb-4 md:mb-0 w-full min-w-0 overflow-hidden">
          {job.imgUrl && (
            <img
              src={job.imgUrl}
              alt="company-logo"
              className="rounded-2xl w-14 h-14 mr-4 flex-shrink-0 object-cover border border-slate-200/70 shadow-xs bg-slate-50"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 
              className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words leading-tight max-w-full"
              title={job.jobTitle}
            >
              {job.jobTitle}
            </h2>
            <p 
              className="text-slate-600 font-medium break-words max-w-full mt-1 text-sm sm:text-base"
              title={job.companyName}
            >
              {job.companyName}
            </p>
            <p className="text-slate-400 text-xs mt-1 truncate font-mono">
              ID: {job._id}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200/70 max-w-full">
                <FaMapMarkerAlt className="text-slate-400 flex-shrink-0" />
                <span className="truncate" title={job.location || "Location not specified"}>{job.location || "Location not specified"}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200/70 max-w-full">
                <FontAwesomeIcon icon={faClock} className="text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {isNaN(Date.parse(job.startDate))
                    ? job.startDate || "Date unknown"
                    : format(new Date(job.startDate), "dd MMM yyyy")}{" "}
                  -{" "}
                  {job.endDateOrDuration || job.duration
                    ? isNaN(Date.parse(job.endDateOrDuration || job.duration))
                      ? job.endDateOrDuration || job.duration
                      : format(
                          new Date(job.endDateOrDuration || job.duration),
                          "dd MMM yyyy",
                        )
                    : "-"}
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200/70 max-w-full">
                <FaDollarSign className="text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {job.compensationDetails?.pdfExtractedCompensation
                    ? job.compensationDetails.pdfExtractedCompensation
                    : job.internshipType === "STIPEND"
                      ? `${job.compensationDetails?.amount || "—"} ${job.compensationDetails?.currency || ""}${
                          job.compensationDetails?.frequency
                            ? ` per ${job.compensationDetails.frequency.toLowerCase()}`
                            : ""
                        }`.trim()
                      : job.internshipType === "FREE"
                        ? "Unpaid / Free"
                        : job.internshipType === "PAID"
                          ? `Student Pays: ${job.compensationDetails?.amount || "—"} ${job.compensationDetails?.currency || ""}`.trim()
                          : "N/A"}
                </span>
              </span>
            </div>

            <div className="mt-4 w-full">
              {existingResumes.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Select Existing Resume
                  </p>
                  <div className="relative w-full">
                    <button
                      type="button"
                      disabled={isApplied}
                      onClick={() => setShowResumeDropdown((prev) => !prev)}
                      className={`w-full border rounded-md px-4 py-2 flex justify-between items-center bg-white ${
                        isApplied ? "cursor-not-allowed bg-gray-100" : ""
                      }`}
                    >
                      <span className="truncate pr-2">
                        {selectedResumeUrl
                          ? selectedResumeName
                          : "-- Choose Resume --"}
                      </span>
                      <FaChevronDown className="flex-shrink-0" />
                    </button>

                    {showResumeDropdown && !isApplied && (
                      <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {existingResumes.map((item) => (
                          <div
                            key={item._id}
                            className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <span
                              className="flex-1 truncate"
                              onClick={() => {
                                setSelectedResumeUrl(item.fileUrl);
                                setResume(null);
                                setShowResumeDropdown(false);
                              }}
                            >
                              {item.fileName}
                            </span>
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700 ml-3 flex-shrink-0"
                              onClick={(event) => {
                                event.stopPropagation();
                                setResumeToDelete(item._id);
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedResumeUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedResumeUrl(null)}
                      className="text-red-500 text-sm hover:underline mt-2"
                    >
                      Clear selected resume
                    </button>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-500 mt-1">
                {existingResumes.length}/5 resumes used
              </p>
              {existingResumes.length >= 5 && (
                <p className="text-red-500 text-sm mt-1">
                  Maximum 5 resumes allowed. Delete one to upload another.
                </p>
              )}

              <div className="mt-3 w-full">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  disabled={isApplied || existingResumes.length >= 5}
                  onChange={handleFileChange}
                  className={`block w-full text-xs sm:text-sm overflow-hidden text-ellipsis !mt-0 my-1 h-auto p-1.5 border border-gray-300 rounded-lg bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 ${
                    isApplied || existingResumes.length >= 5
                      ? "text-gray-400 cursor-not-allowed bg-gray-50"
                      : "text-gray-600 cursor-pointer"
                  }`}
                />

                {resume && (
                  <button
                    type="button"
                    onClick={() => setResume(null)}
                    className="text-red-500 text-sm hover:underline mt-2"
                  >
                    Remove uploaded resume
                  </button>
                )}

                {selectedResumeUrl && (
                  <p className="text-gray-500 text-sm mt-2">
                    File upload disabled because a saved resume is selected.
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 break-words">
                <p className="text-sm font-semibold text-gray-700">
                  Resume that will be submitted
                </p>
                <p className="text-blue-700 mt-1 font-medium break-all sm:break-normal">
                  {resume?.name ||
                    (selectedResumeUrl
                      ? selectedResumeName
                      : "No resume selected")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:w-auto gap-2.5 sm:gap-3 mt-6 w-full pt-4 border-t border-slate-100">
              {job.applicationOpen ? (
                <button
                  onClick={handleApply}
                  disabled={isApplied || isUploading}
                  className={`w-full sm:w-auto min-h-[42px] flex items-center justify-center text-center text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl font-bold text-white shadow-sm transition-all whitespace-normal sm:whitespace-nowrap active:scale-95 cursor-pointer ${
                    isApplied
                      ? "bg-emerald-500 shadow-emerald-200"
                      : "bg-teal-600 hover:bg-teal-700 shadow-teal-200"
                  }`}
                >
                  {isApplied
                    ? "✓ Applied"
                    : isUploading
                      ? "Uploading..."
                      : "Apply now"}
                </button>
              ) : (
                <div className="col-span-1 min-[420px]:col-span-2 sm:col-auto text-rose-600 font-semibold p-2.5 border border-rose-200 bg-rose-50 rounded-xl text-center text-xs sm:text-sm">
                  Applications are currently closed for this internship.
                </div>
              )}

              <button
                onClick={handleSkillAnalysis}
                className="w-full sm:w-auto min-h-[42px] flex items-center justify-center text-center text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all whitespace-normal sm:whitespace-nowrap active:scale-95 cursor-pointer"
              >
                Skill Analysis
              </button>

              {job.internshipType === "STIPEND" && (
                <button
                  onClick={async () => {
                    let activeAssessment = assessment;
                    if (!activeAssessment) {
                      activeAssessment = await handleGenerateAssessment();
                    }
                    if (activeAssessment) {
                      setShowAssessmentModal(true);
                    }
                  }}
                  disabled={loadingAssessment}
                  className={`w-full sm:w-auto min-h-[42px] flex items-center justify-center text-center text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl font-bold text-white shadow-sm transition-all whitespace-normal sm:whitespace-nowrap active:scale-95 cursor-pointer ${
                    assessmentCompleted
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                      : assessment
                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                        : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-200"
                  }`}
                >
                  <FaClipboardCheck className="text-sm flex-shrink-0" />
                  <span>
                    {!assessment
                      ? loadingAssessment
                        ? "Generating Assessment..."
                        : "Generate Assessment"
                      : assessmentCompleted
                        ? "View Result"
                        : "Take Assessment"}
                  </span>
                </button>
              )}

              <button
                onClick={handleRaiseTicketClick}
                disabled={checkingTicket}
                className={`w-full sm:w-auto min-h-[42px] flex items-center justify-center gap-1.5 text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl font-bold text-white shadow-sm transition-all whitespace-normal sm:whitespace-nowrap active:scale-95 cursor-pointer ${
                  checkingTicket
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
                }`}
              >
                <FaHeadset className="text-xs sm:text-sm flex-shrink-0" />
                <span>{checkingTicket ? "Checking..." : "Raise Ticket"}</span>
              </button>
            </div>

            {activeTickets.length > 0 && !checkingTicket && (
              <div style={{ marginTop: 14, maxWidth: 440 }}>
                {latestActive && (
                  <div
                    onClick={() => handleBadgeClick(latestActive)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 14,
                      padding: "9px 14px",
                      cursor: "pointer",
                      marginBottom: 10,
                      transition: "background 0.15s",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#22c55e",
                        flexShrink: 0,
                        animation: "ticketPulse 1.5s ease-in-out infinite",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#166534",
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        Ticket #{latestActive._id?.slice(-6)} is active
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#15803d",
                          margin: 0,
                          lineHeight: 1.4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        Status:{" "}
                        <span
                          style={{
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {latestActive.status}
                        </span>
                        {latestActive.lastMessage && (
                          <>
                            {" "}
                            - "{latestActive.lastMessage.substring(0, 35)}
                            {latestActive.lastMessage.length > 35 ? "..." : ""}"
                          </>
                        )}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#166534",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      View
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      fontWeight: 500,
                      marginRight: 2,
                    }}
                  >
                    All tickets:
                  </span>
                  {visibleBadges.map((ticket, index) => (
                    <TicketBadge
                      key={ticket._id}
                      ticket={ticket}
                      index={index}
                      onClick={handleBadgeClick}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <div ref={dropdownRef} style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => setShowDropdown((prev) => !prev)}
                        style={{
                          height: 28,
                          padding: "0 10px",
                          background: showDropdown ? "#e5e7eb" : "#f3f4f6",
                          border: "1.5px solid #e5e7eb",
                          borderRadius: 20,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#374151",
                          whiteSpace: "nowrap",
                        }}
                      >
                        +{hiddenCount}
                      </button>
                      {showDropdown && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "calc(100% + 8px)",
                            left: 0,
                            minWidth: 260,
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 14,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            zIndex: 50,
                            overflow: "hidden",
                            animation: "dropIn 0.18s ease",
                          }}
                        >
                          <div
                            style={{
                              padding: "10px 14px 8px",
                              borderBottom: "1px solid #f3f4f6",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {hiddenCount} more ticket
                            {hiddenCount > 1 ? "s" : ""}
                          </div>
                          <div style={{ padding: "6px" }}>
                            {hiddenBadges.map((ticket, index) => (
                              <DropdownTicketRow
                                key={ticket._id}
                                ticket={ticket}
                                index={visibleCount + index}
                                onClick={handleBadgeClick}
                                onClose={() => setShowDropdown(false)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <style>{`
              @keyframes ticketPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.45; transform: scale(0.75); }
              }
              @keyframes dropIn {
                from { opacity: 0; transform: translateY(6px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
        </div>

        {showResumePopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-semibold mb-2">Resume Required</h2>
              <p className="text-gray-600">
                Please upload or select your resume before applying.
              </p>
              <button
                onClick={() => setShowResumePopup(false)}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showLimitPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Application Limit Reached
              </h2>
              <p className="text-gray-600 mt-2">
                You have reached the maximum of{" "}
                {maxAppsDisplay === Infinity ? "unlimited" : maxAppsDisplay}{" "}
                applications allowed under your plan ({planType}).
              </p>
              <p className="text-gray-600 mt-1">
                Upgrade your plan to apply for more internships.
              </p>
              <button
                className="bg-purple-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-purple-600"
                onClick={() => setShowLimitPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {resumeToDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Delete Resume
              </h2>
              <p className="text-gray-600 mt-2 mb-6">
                Are you sure you want to delete this resume? This action cannot
                be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                  onClick={() => setResumeToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => handleDeleteResume(resumeToDelete)}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showSkillAnalysis && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden my-auto">
              <SkillAnalysis
                job={job}
                onClose={() => setShowSkillAnalysis(false)}
              />
            </div>
          </div>
        )}
      </div>

      <hr className="my-4" />

      <div className="mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
          About the job
        </h3>
        {/* Add this "whitespace-pre-wrap break-words" for good alignment of description - 25-09-2026 */}
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
          {job.jobDescription || "No description available"}
        </p>
      </div>

      <div>
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
          Skills required
        </h3>
        <div className="flex flex-wrap gap-2">
          {(job.qualifications || []).map((qualification, index) => (
            <span
              key={index}
              className="text-sm bg-gray-200 text-gray-800 py-1 px-3 rounded-full break-all"
            >
              {qualification}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
          Contact Information
        </h3>
        <div className="bg-gray-50 border rounded-lg p-3 md:p-4 text-sm md:text-base text-gray-700 break-words break-all">
          {job.contactInfo?.name || "Not provided"}
          {job.contactInfo?.email ? `, ${job.contactInfo.email}` : ""}
          {job.contactInfo?.phone ? `, ${job.contactInfo.phone}` : ""}
        </div>
      </div>

      {showAssessmentModal && assessment && (
        <ProctoredAssessment
          assessment={assessment}
          studentId={parseStoredJson("studentInfo", "userInfo")?._id}
          onClose={() => setShowAssessmentModal(false)}
        />
      )}
    </div>
  );
};

export default ApplyCards;
