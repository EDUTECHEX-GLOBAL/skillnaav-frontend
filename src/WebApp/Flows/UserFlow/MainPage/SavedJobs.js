import React, { useEffect, useState } from "react";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faMapMarkerAlt,
  faClock,
  faDollarSign,
  faBookmark,
  faBriefcase,
} from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import ApplyCards from "./ApplyCards";

const formatJobDate = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return format(d, "dd MMM yyyy");
  } catch {
    return String(dateVal);
  }
};

const SavedJobs = () => {
  const { savedJobs, removeJob, getSavedJobs } = useTabContext();
  const [selectedJob, setSelectedJob] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const userInfo = (JSON.parse(localStorage.getItem("studentInfo")) || JSON.parse(localStorage.getItem("userInfo"))) || {};
  const userId = userInfo?._id;

  const validSavedJobs = savedJobs?.filter(job => job?.jobId?._id) || [];

  useEffect(() => {
    if (userId) {
      getSavedJobs();
    }
  }, [userId, getSavedJobs]);

  const handleRemove = async (jobId) => {
    setRemovingId(jobId);
    await removeJob(jobId);
    setRemovingId(null);
  };

  const getCompensationText = (job) => {
    if (job?.internshipType === "STIPEND") {
      const amount = job?.compensationDetails?.amount || "";
      const currency = job?.compensationDetails?.currency || "USD";
      const freq = job?.compensationDetails?.frequency?.toLowerCase() || "month";
      return `${amount} ${currency} per ${freq}`;
    } else if (job?.internshipType === "FREE") {
      return "Unpaid / Free";
    } else if (job?.internshipType === "PAID") {
      const amount = job?.compensationDetails?.amount || "";
      const currency = job?.compensationDetails?.currency || "USD";
      return `Student Pays: ${amount} ${currency}`;
    }
    return "N/A";
  };

  const formatJobDate = (val) => {
    if (!val) return "N/A";
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString();
    }
    return val;
  };

  if (selectedJob) {
    return <ApplyCards job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  return (
    <>
      <style>{`
        .sj-wrapper {
          padding: 24px 20px 120px 20px;
          font-family: 'Poppins', sans-serif;
          min-height: 100vh;
          background: #f7f8fc;
          width: 100%;
          box-sizing: border-box;
        }

        .sj-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .sj-header-icon {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          flex-shrink: 0;
        }

        .sj-header h2 {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
        }

        .sj-count {
          margin-left: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #7c3aed;
          background: #ede9fe;
          padding: 3px 10px;
          border-radius: 20px;
          white-space: nowrap;
        }

        /* Responsive Grid: 1 col on mobile, 2 cols on tablet/iPad Pro (1032px with sidebar), 3 cols on wide desktop */
        .sj-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          width: 100%;
          align-items: stretch;
        }

        @media (min-width: 640px) {
          .sj-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }
        }

        @media (min-width: 1280px) {
          .sj-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 20px;
          }
        }

        /* Card */
        .sj-card {
          background: #ffffff;
          border: 1px solid #e8e8f0;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          position: relative;
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          height: 100%;
          box-sizing: border-box;
          min-width: 0;
        }
        .sj-card:hover {
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        }

        /* Remove button */
        .sj-remove-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          background: #fff0f0;
          color: #ef4444;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          transition: background 0.2s, transform 0.15s;
          flex-shrink: 0;
          z-index: 10;
        }

        .sj-remove-btn:hover {
          background: #fee2e2;
          transform: scale(1.1);
        }

        .sj-remove-btn.removing {
          opacity: 0.5;
          pointer-events: none;
        }

        /* Header row */
        .sj-card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding-right: 36px;
        }

        .sj-logo {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #f0f0f5;
          flex-shrink: 0;
          background: #f5f5fb;
        }

        .sj-logo-fallback {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: linear-gradient(135deg, #ede9fe, #ddd6fe);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7c3aed;
          font-size: 18px;
          flex-shrink: 0;
        }

        .sj-title-block {
          min-width: 0;
          flex: 1;
        }

        .sj-job-title {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 3px 0;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.35;
          min-height: 40px;
        }

        .sj-company {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.25;
        }

        .sj-job-id {
          font-size: 11px;
          color: #9ca3af;
          margin: 3px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Info rows */
        .sj-info {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .sj-info-row {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          color: #6b7280;
          min-width: 0;
        }

        .sj-info-row svg {
          font-size: 11px;
          color: #a78bfa;
          flex-shrink: 0;
        }

        .sj-info-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Skills */
        .sj-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          min-height: 28px;
          align-items: center;
        }

        .sj-skill-tag {
          font-size: 11.5px;
          font-weight: 500;
          background: #f3f0ff;
          color: #6d28d9;
          padding: 3px 10px;
          border-radius: 20px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 110px;
          display: inline-block;
        }

        .sj-skill-more {
          font-size: 11.5px;
          font-weight: 500;
          background: #f3f4f6;
          color: #6b7280;
          padding: 3px 10px;
          border-radius: 20px;
          flex-shrink: 0;
        }

        /* Footer */
        .sj-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #f3f4f6;
          padding-top: 12px;
          margin-top: auto;
        }

        .sj-view-btn {
          font-size: 12.5px;
          font-weight: 600;
          color: #ffffff;
          background: #7c3aed;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          padding: 6px 14px;
          transition: background 0.2s, transform 0.1s;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .sj-view-btn:hover {
          background: #6d28d9;
          transform: translateY(-1px);
        }

        /* Empty state */
        .sj-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 72px 24px;
          text-align: center;
        }

        .sj-empty-icon {
          width: 64px;
          height: 64px;
          background: #ede9fe;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          color: #a78bfa;
          margin-bottom: 16px;
        }

        .sj-empty h3 {
          font-size: 17px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 6px 0;
        }

        .sj-empty p {
          font-size: 14px;
          color: #9ca3af;
          margin: 0;
        }

        /* Mobile responsive optimizations */
        @media (max-width: 640px) {
          .sj-wrapper {
            padding: 16px 12px 100px 12px;
          }
          .sj-header {
            margin-bottom: 16px;
            gap: 8px;
          }
          .sj-header-icon {
            width: 32px;
            height: 32px;
            font-size: 14px;
            border-radius: 8px;
          }
          .sj-header h2 {
            font-size: 18px;
          }
          .sj-count {
            font-size: 11.5px;
            padding: 2px 8px;
          }
          .sj-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .sj-card {
            padding: 14px;
            border-radius: 12px;
          }
          .sj-logo, .sj-logo-fallback {
            width: 40px;
            height: 40px;
            font-size: 16px;
            border-radius: 8px;
          }
          .sj-job-title {
            font-size: 14px;
            min-height: auto;
          }
          .sj-company {
            font-size: 12px;
          }
        }
      `}</style>

      <div className="sj-wrapper">
        {/* Header */}
        <div className="sj-header">
          <div className="sj-header-icon">
            <FontAwesomeIcon icon={faBookmark} />
          </div>
          <h2>Saved Jobs</h2>
          {validSavedJobs.length > 0 && (
            <span className="sj-count">{validSavedJobs.length} saved</span>
          )}
        </div>

        {/* Grid or Empty */}
        {validSavedJobs.length > 0 ? (
          <div className="sj-grid">
            {validSavedJobs.map((job) =>
              job?.jobId?._id ? (
                <div key={job.jobId._id} className="sj-card">
                  {/* Remove button */}
                  <button
                    className={`sj-remove-btn ${removingId === job.jobId._id ? "removing" : ""}`}
                    onClick={() => handleRemove(job.jobId._id)}
                    title="Remove from saved"
                  >
                    <FontAwesomeIcon icon={faHeart} />
                  </button>

                  {/* Header */}
                  <div className="sj-card-header">
                    {job.jobId?.imgUrl ? (
                      <img
                        src={job.jobId.imgUrl}
                        alt="Company Logo"
                        className="sj-logo"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="sj-logo-fallback">
                        <FontAwesomeIcon icon={faBriefcase} />
                      </div>
                    )}
                    <div className="sj-title-block">
                      <p className="sj-job-title" title={job.jobId?.jobTitle}>
                        {job.jobId?.jobTitle || "Unknown Title"}
                      </p>
                      <p className="sj-company" title={job.jobId?.companyName}>
                        {job.jobId?.companyName || "Unknown Company"}
                      </p>
                      <p className="sj-job-id" title={job.jobId?._id}>
                        ID: {job.jobId?._id}
                      </p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="sj-info">
                    <div className="sj-info-row">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span
                        className="sj-info-text"
                        title={`${job.jobId?.location} • ${job.jobId?.type}`}
                      >
                        {job.jobId?.location || "Unknown Location"} • {job.jobId?.type || "N/A"}
                      </span>
                    </div>
                    <div className="sj-info-row">
                      <FontAwesomeIcon icon={faClock} />
                      <span className="sj-info-text">
                        {formatJobDate(job.jobId?.startDate)} — {formatJobDate(job.jobId?.endDateOrDuration)}
                      </span>
                    </div>
                    <div className="sj-info-row">
                      <FontAwesomeIcon icon={faDollarSign} />
                      <span className="sj-info-text" title={getCompensationText(job.jobId)}>
                        {getCompensationText(job.jobId)}
                      </span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="sj-skills">
                    {job.jobId?.qualifications?.length > 0 ? (
                      <>
                        {job.jobId.qualifications.slice(0, 2).map((q, idx) => (
                          <span key={idx} className="sj-skill-tag" title={q}>
                            {q}
                          </span>
                        ))}
                        {job.jobId.qualifications.length > 2 && (
                          <span className="sj-skill-more">
                            +{job.jobId.qualifications.length - 2}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                        No qualifications listed
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="sj-card-footer">
                    <button
                      className="sj-view-btn"
                      onClick={() => setSelectedJob(job.jobId)}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ) : null
            )}
          </div>
        ) : (
          <div className="sj-empty">
            <div className="sj-empty-icon">
              <FontAwesomeIcon icon={faBookmark} />
            </div>
            <h3>No saved jobs yet</h3>
            <p>Jobs you save will appear here for easy access.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default SavedJobs;