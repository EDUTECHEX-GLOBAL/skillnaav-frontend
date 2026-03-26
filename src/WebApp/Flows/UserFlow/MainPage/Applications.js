import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
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
            className="mt-3 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
            onClick={() => openAssessment(l2.assessmentId)}
          >
            Start Assessment
          </button>
        );

      case "started":
        return (
          <button
            className="mt-3 w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition"
            onClick={() => openAssessment(l2.assessmentId)}
          >
            Resume Assessment
          </button>
        );

      case "submitted":
      case "evaluated":
        return (
          <button
            disabled
            className="mt-3 w-full bg-gray-300 text-gray-600 py-2 rounded cursor-not-allowed"
          >
            Assessment Submitted
          </button>
        );

      case "passed":
        return (
          <div className="mt-3 text-green-600 font-semibold text-center">
            ✅ Assessment Cleared
          </div>
        );

      case "rejected":
        return (
          <div className="mt-3 text-red-600 font-semibold text-center">
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
      <div className="mt-3 text-sm bg-blue-50 text-blue-800 p-2 rounded">
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
      <div className="p-4 font-poppins">
        <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
        <p>Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
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
    <div className="p-4 font-poppins">
      <h2 className="text-xl font-semibold mb-4">Your Applications</h2>

      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => {
            const job = app.internship;
            if (!job) return null;

            const finalStatus = resolveApplicationStatus(
              app.pipeline,
              app.status
            );

            return (
              <div key={app._id} className="bg-white rounded-lg shadow-lg p-4">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <img
                      src={job.imgUrl || "default-image.jpg"}
                      alt="Company logo"
                      className="rounded-full w-12 h-12 mr-4"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">{job.jobTitle}</h3>
                      <p className="text-gray-500">
                        {job.companyName || "Unknown Company"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      statusColors[finalStatus] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {finalStatus}
                  </span>
                </div>

                {/* META */}
                <div className="text-gray-500 text-sm mb-2">
                  <p>
                    <FontAwesomeIcon icon={faMapMarkerAlt} />{" "}
                    {job.location || "N/A"} • {job.jobType || "N/A"}
                  </p>
                  <p>
                    <FontAwesomeIcon icon={faClock} />{" "}
                    {job.endDateOrDuration || "N/A"}
                  </p>
                  <p>
                    <FontAwesomeIcon icon={faDollarSign} />{" "}
                    {job.internshipType === "STIPEND"
                      ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                      : job.internshipType === "FREE"
                      ? "Unpaid / Free"
                      : "N/A"}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="space-y-2">
                  {renderAssessmentCTA(app.pipeline, app._id)}
                  {renderInterviewInfo(app.pipeline)}

                  <button
                    onClick={() => setSelectedJob(job)}
                    className="w-full text-purple-600 font-semibold"
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