import React, { useEffect, useState, useCallback } from "react";
import axios from "../../../../api/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faClock,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";
import ApplyCards from "./ApplyCards";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const studentId = userInfo?._id || null;

  /* ================================
     FETCH APPLICATIONS
  ================================= */
  const fetchDashboardApplications = useCallback(async () => {
    try {
      if (!studentId) {
        setError("Student ID not found. Please login again.");
        setLoading(false);
        return;
      }

      const { data } = await axios.get(
        `/api/applications/student/${studentId}/dashboard`
      );

      setApplications(data.applications || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardApplications();
  }, [fetchDashboardApplications]);

  /* ================================
     ✅ REFRESH ON ASSESSMENT COMPLETION
     Listen for the custom event dispatched by ProctoredAssessment
     after a successful submit, so pipeline status updates immediately.
  ================================= */
  useEffect(() => {
    const handleAssessmentCompleted = () => {
      // Small delay to let the backend update pipeline status
      setTimeout(() => {
        fetchDashboardApplications();
      }, 1500);
    };

    window.addEventListener("assessmentCompleted", handleAssessmentCompleted);

    // Also refresh when the user switches back to this tab
    // (covers the case where assessment opens in a different tab/view)
    const handleVisibility = () => {
      if (!document.hidden) {
        fetchDashboardApplications();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("assessmentCompleted", handleAssessmentCompleted);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchDashboardApplications]);

  /* ================================
     FINAL STATUS RESOLVER (L3 > L2 > L1 > DB status)
  ================================= */
  const resolveApplicationStatus = (pipeline, appStatus) => {
    if (!pipeline) return appStatus || "Applied";

    // L3 (highest priority)
    if (pipeline.l3?.status === "scheduled") return "Interview Scheduled";
    if (pipeline.l3?.status === "sent") return "Interview Invite Sent";
    if (pipeline.l3?.status === "created") return "Interview Pending";

    // L2
    if (pipeline.l2?.status === "passed") return "Assessment Cleared";
    if (
      ["generated", "sent", "started", "submitted"].includes(
        pipeline.l2?.status
      )
    )
      return "Assessment In Progress";
    if (pipeline.l2?.status === "rejected") return "Assessment Failed";

    // L1
    if (pipeline.l1?.status === "shortlisted") return "Shortlisted";
    if (pipeline.l1?.status === "rejected") return "Rejected";

    // No pipeline stage matched — fall back to the raw DB status on the
    // application document.
    if (appStatus && appStatus !== "Applied") return appStatus;

    return "Applied";
  };

  /* ================================
     STATUS COLORS
  ================================= */
  const statusColors = {
    Applied: "bg-gray-100 text-gray-700",
    Shortlisted: "bg-yellow-100 text-yellow-700",
    Rejected: "bg-red-100 text-red-700",

    "Assessment In Progress": "bg-purple-100 text-purple-700",
    "Assessment Cleared": "bg-green-100 text-green-700",
    "Assessment Failed": "bg-red-100 text-red-700",

    "Interview Pending": "bg-orange-100 text-orange-700",
    "Interview Scheduled": "bg-blue-100 text-blue-700",
    "Interview Invite Sent": "bg-green-100 text-green-800",
  };

  /* ================================
     ASSESSMENT CTA (ONLY L2)
  ================================= */
  const renderAssessmentCTA = (pipeline, appId) => {
    if (!pipeline) return null;

    const { l2, l3 } = pipeline;

    // Once in L3, never show assessment CTA
    if (l3?.status && l3.status !== "not_used") return null;
    if (!l2 || l2.status === "not_used") return null;

    switch (l2.status) {
      case "generated":
      case "sent":
        return (
          <button
            className="mt-3 w-full rounded bg-purple-600 py-2 text-sm text-white transition hover:bg-purple-700 sm:text-base"
            onClick={() => openAssessment(l2.assessmentId)}
          >
            Start Assessment
          </button>
        );

      case "started":
        return (
          <div className="mt-3 text-center text-sm font-semibold text-orange-600 sm:text-base">
            ⏳ Assessment In Progress
          </div>
        );

      case "submitted":
        return (
          <div className="mt-3 text-center text-sm font-semibold text-blue-600 sm:text-base">
            📝 Assessment Submitted - Awaiting Results
          </div>
        );

      case "evaluated":
        // This shouldn't happen as backend updates to passed/rejected
        return (
          <div className="mt-3 text-center text-sm font-semibold text-gray-600 sm:text-base">
            Assessment Evaluated
          </div>
        );

      case "passed":
        return (
          <div className="mt-3 text-center text-sm font-semibold text-green-600 sm:text-base">
            ✅ Assessment Passed
          </div>
        );

      case "rejected":
        return (
          <div className="mt-3 text-center text-sm font-semibold text-red-600 sm:text-base">
            ❌ Assessment Failed
          </div>
        );

      default:
        return null;
    }
  };

  /* ================================
     INTERVIEW INFO (L3)
  ================================= */
  const renderInterviewInfo = (pipeline) => {
    const l3 = pipeline?.l3;

    if (!l3 || !["scheduled", "sent"].includes(l3.status)) return null;

    const interview =
      typeof l3.interviewId === "object" ? l3.interviewId : null;

    const scheduledAt = interview?.scheduledAt || l3?.scheduledAt;

    return (
      <div className="mt-3 rounded bg-blue-50 p-2 text-xs text-blue-800 sm:text-sm">
        📅 <b>Interview Scheduled</b>

        {scheduledAt && (
          <div className="mt-1">
            {new Date(scheduledAt).toLocaleString()}
          </div>
        )}

        {interview?.link ? (
          <div className="mt-1">
            🔗{" "}
            <a
              href={interview.link}
              target="_blank"
              rel="noreferrer"
              className="underline font-medium"
            >
              Join Interview
            </a>
          </div>
        ) : (
          <div className="mt-1 text-gray-600">
            Meeting link will be shared shortly
          </div>
        )}
      </div>
    );
  };

  /* ================================
     OPEN ASSESSMENT
  ================================= */
  const openAssessment = (assessmentId) => {
    if (!assessmentId) return;
    localStorage.setItem("activeAssessmentId", assessmentId);

    window.dispatchEvent(
      new CustomEvent("openTab", { detail: { tab: "assessment" } })
    );
  };

  /* ================================
     LOADING / ERROR
  ================================= */
  if (loading) {
    return (
      <div className="p-3 font-poppins sm:p-4">
        <h2 className="mb-4 text-lg font-semibold sm:text-xl">Your Applications</h2>
        <p>Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-3 text-red-600 sm:p-4">{error}</div>;
  }

  /* ================================
     DETAILS VIEW
  ================================= */
  if (selectedJob) {
    return <ApplyCards job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  /* ================================
     MAIN RENDER
  ================================= */
  return (
    <div className="p-3 font-poppins sm:p-4">
      <h2 className="mb-4 text-lg font-semibold sm:text-xl">Your Applications</h2>

      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {applications.map((app) => {
            const job = app.internship;
            if (!job) return null;

            const finalStatus = resolveApplicationStatus(
              app.pipeline,
              app.status
            );
            return (
              <div
                key={app._id}
                className="flex min-h-[260px] w-full max-w-full flex-col overflow-hidden rounded-lg bg-white p-3 shadow-lg sm:min-h-[280px] sm:p-4 xl:min-h-0 xl:aspect-square"
              >
                <div className="mb-3 flex justify-end">
                  <span
                    className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs leading-tight text-center whitespace-normal break-words sm:px-3 sm:text-sm ${statusColors[finalStatus] || "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {finalStatus}
                  </span>
                </div>

                {/* HEADER */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <img
                      src={job.imgUrl || "default-image.jpg"}
                      alt="Company logo"
                      className="mr-3 h-10 w-10 flex-shrink-0 rounded-full sm:mr-4 sm:h-12 sm:w-12"
                    />
                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-base font-semibold leading-snug sm:text-lg"
                        title={job.jobTitle || ""}
                      >
                        {job.jobTitle}
                      </h3>
                      <p
                        className="mt-1 truncate text-sm text-gray-500 sm:text-base"
                        title={job.companyName || "Unknown Company"}
                      >
                        {job.companyName || "Unknown Company"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* META */}
                <div className="space-y-1.5 text-xs text-gray-500 sm:space-y-2 sm:text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="flex-shrink-0 text-[11px] sm:text-sm"
                    />
                    <p
                      className="min-w-0 flex-1 truncate"
                      title={`${job.location || "N/A"} • ${job.jobType || "N/A"}`}
                    >
                      {job.location || "N/A"} • {job.jobType || "N/A"}
                    </p>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <FontAwesomeIcon
                      icon={faClock}
                      className="flex-shrink-0 text-[11px] sm:text-sm"
                    />
                    <p
                      className="min-w-0 flex-1 truncate"
                      title={job.endDateOrDuration || "N/A"}
                    >
                      {job.endDateOrDuration || "N/A"}
                    </p>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      className="flex-shrink-0 text-[11px] sm:text-sm"
                    />
                    <p
                      className="min-w-0 flex-1 truncate"
                      title={
                        job.internshipType === "STIPEND"
                          ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                          : job.internshipType === "FREE"
                            ? "Unpaid / Free"
                            : "N/A"
                      }
                    >
                      {job.internshipType === "STIPEND"
                        ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                        : job.internshipType === "FREE"
                          ? "Unpaid / Free"
                          : "N/A"}
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-auto space-y-2 pt-3 sm:pt-4">
                  {renderAssessmentCTA(app.pipeline, app._id)}
                  {renderInterviewInfo(app.pipeline)}

                  <button
                    onClick={() => setSelectedJob(job)}
                    className="w-full text-sm font-semibold text-purple-600 sm:text-base"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Applications;
