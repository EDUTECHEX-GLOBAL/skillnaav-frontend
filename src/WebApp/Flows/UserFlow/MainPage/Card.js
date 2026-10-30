import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaHeart } from "react-icons/fa";
import axios from "../../../../api/axiosInstance";
import { useTabContext } from "./UserHomePageContext/HomePageContext";

// Cache
const jobCache = {
  data: [],
  page: 1,
  hasMore: true,
  timestamp: null,
};

const CACHE_DURATION = 60000;

const JobCard = ({
  jobs: externalJobs,
  searchTerm = "",
  onViewDetails,
  isRecommendation = false, // NEW: true when rendered inside Recommendations.jsx
}) => {
  const { savedJobs, saveJob, removeJob, handleSelectTab } = useTabContext();
  const [, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState("Freemium");
  const [showSavedJobPopup, setShowSavedJobPopup] = useState(false);

  const isRecommendationMode = Array.isArray(externalJobs);

  const [jobs, setJobs] = useState(externalJobs || jobCache.data || []);
  const [page, setPage] = useState(jobCache.page || 1);
  const [, setHasMore] = useState(jobCache.hasMore !== false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadMoreRef = useRef(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(jobCache.hasMore !== false);

  const getSavedLimitByPlan = (plan) => {
    switch (plan) {
      case "Premium Plus":
        return Infinity;
      case "Premium Basic":
        return 25;
      case "Freemium":
      default:
        return 3;
    }
  };

  /* ----------------------------------
     USE RECOMMENDATION JOBS DIRECTLY
  ---------------------------------- */
  useEffect(() => {
    if (isRecommendationMode) {
      setJobs(externalJobs);
      setHasMore(false);
    }
  }, [externalJobs, isRecommendationMode]);

  /* ----------------------------------
     FETCH APPROVED JOBS (HOME PAGE)
  ---------------------------------- */
  const fetchJobs = useCallback(
    async (pageNumber = 1) => {
      if (
        loadingRef.current ||
        (pageNumber !== 1 && !hasMoreRef.current) ||
        isRecommendationMode
      ) {
        return;
      }

      try {
        loadingRef.current = true;
        setLoading(true);

        if (
          pageNumber === 1 &&
          jobCache.timestamp &&
          Date.now() - jobCache.timestamp < CACHE_DURATION
        ) {
          setJobs(jobCache.data);
          setPage(jobCache.page);
          setHasMore(jobCache.hasMore);
          hasMoreRef.current = jobCache.hasMore;
          loadingRef.current = false;
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `/api/interns/approved?page=${pageNumber}&limit=6`,
        );
        const { data, hasMore: more } = res.data;

        setJobs((prev) => {
          const updated = pageNumber === 1 ? data : [...prev, ...data];
          jobCache.data = updated;
          jobCache.page = pageNumber;
          jobCache.hasMore = more;
          jobCache.timestamp = Date.now();
          return updated;
        });

        hasMoreRef.current = more;
        setHasMore(more);
        setPage(pageNumber);
      } catch {
        setError("Failed to load jobs.");
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [isRecommendationMode],
  );

  /* ----------------------------------
     INITIAL LOAD (ONLY HOME PAGE)
  ---------------------------------- */
  useEffect(() => {
    if (isRecommendationMode) return;
    if (jobCache.data.length > 0) {
      setJobs(jobCache.data);
      setPage(jobCache.page);
      setHasMore(jobCache.hasMore);
      return;
    }
    fetchJobs(1);
  }, [fetchJobs, isRecommendationMode]);

  /* ----------------------------------
     INFINITE SCROLL (ONLY HOME PAGE)
  ---------------------------------- */
  useEffect(() => {
    if (isRecommendationMode || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchJobs(page + 1);
        }
      },
      { threshold: 0.8 },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchJobs, isRecommendationMode, page]);

  /* ----------------------------------
     SAVED JOB LOGIC
  ---------------------------------- */
  const isJobSaved = (jobId) =>
    savedJobs.some(
      (savedJob) =>
        savedJob.jobId?._id === jobId ||
        savedJob.jobId === jobId ||
        savedJob._id === jobId,
    );

  const toggleSaveJob = async (job) => {
    try {
      const savedLimit = getSavedLimitByPlan(planType);
      if (
        !isJobSaved(job._id) &&
        savedJobs.length >= savedLimit &&
        savedLimit !== Infinity
      ) {
        setShowSavedJobPopup(true);
        return;
      }
      isJobSaved(job._id) ? await removeJob(job._id) : await saveJob(job);
    } catch (err) {
      console.error("Error toggling save job:", err);
    }
  };

  /* ----------------------------------
     FETCH USER PROFILE
  ---------------------------------- */
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        const { data } = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsPremium(data.isPremium);
        setPlanType(data.planType || "Freemium");
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };
    fetchUserProfile();
  }, []);

  const filteredJobs = jobs.filter((job) =>
    job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (error) return <p>{error}</p>;

  const calculatePostedTime = (date) => {
    const diff = Math.floor(
      (new Date() - new Date(date)) / (1000 * 60 * 60 * 24),
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job, index) => {
            const saved = isJobSaved(job._id);

            return (
              <div
                key={job._id}
                className="w-full max-w-full p-3.5 sm:p-4 border border-slate-200/80 rounded-2xl shadow-xs bg-white hover:shadow-lg hover:border-purple-200 transition-all duration-200 flex flex-col gap-2.5 sm:gap-3 group box-border overflow-hidden"
              >
                {/* ── Top Bar: Match Rank / Mode on Left + Type Badge & Heart on Right ── */}
                <div className="flex items-center justify-between w-full min-h-[28px] gap-2 flex-wrap sm:flex-nowrap">
                  {isRecommendation ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-xs whitespace-nowrap flex-shrink-0 z-10">
                      <span className="text-purple-500 font-extrabold text-xs">✦</span> #{index + 1} Match
                    </span>
                  ) : job.internshipMode ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 whitespace-nowrap flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{job.internshipMode}</span>
                    </span>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                    {job.internshipType && (
                      <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full border border-gray-200/70 uppercase whitespace-nowrap">
                        {job.internshipType}
                      </span>
                    )}
                    <button
                      onClick={() => toggleSaveJob(job)}
                      className={`p-1.5 transition rounded-full hover:bg-slate-50 ${saved ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
                      aria-label={saved ? "Unsave job" : "Save job"}
                    >
                      <FaHeart className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── Company + title (2-line wrap so title never gets truncated aggressively) ── */}
                <div className="flex items-start gap-3 w-full min-w-0 overflow-hidden">
                  <img
                    src={job.imgUrl}
                    alt="Company Logo"
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-slate-100 shadow-xs mt-0.5"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/favicon-512x469.png";
                    }}
                  />
                  <div className="flex-grow min-w-0 overflow-hidden">
                    <h5
                      className="text-base sm:text-lg font-bold text-slate-900 leading-snug truncate block group-hover:text-purple-700 transition-colors cursor-pointer max-w-full"
                      title={job.jobTitle}
                      onClick={() => onViewDetails(job)}
                    >
                      {job.jobTitle}
                    </h5>
                    <div className="flex items-center text-xs sm:text-sm text-slate-500 mt-1 min-w-0">
                      <span className="font-medium truncate flex-1 text-slate-600" title={job.companyName}>{job.companyName}</span>
                      <span className="mx-1.5 text-slate-300 flex-shrink-0">·</span>
                      <span className="whitespace-nowrap flex-shrink-0">
                        {calculatePostedTime(job.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Meta information container ── */}
                <div className="text-slate-600 space-y-1.5 text-xs sm:text-sm bg-slate-50/70 rounded-xl p-2.5 sm:p-3 border border-slate-100 max-w-full overflow-hidden">
                  <p className="flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-purple-500 flex-shrink-0 text-xs" />
                    <span className="truncate text-slate-700 font-medium">{job.location || "Location not specified"} {job.jobType ? `• ${job.jobType}` : ""}</span>
                  </p>
                  <p className="flex items-center">
                    <FaClock className="mr-2 text-purple-500 flex-shrink-0 text-xs" />
                    <span className="truncate text-slate-600">
                      {job.startDate
                        ? new Date(job.startDate).toLocaleDateString()
                        : "—"}
                      {" – "}
                      {job.endDateOrDuration
                        ? new Date(job.endDateOrDuration).toLocaleDateString()
                        : "—"}
                    </span>
                  </p>
                  <p className="flex items-center">
                    <FaDollarSign className="mr-2 text-purple-500 flex-shrink-0 text-xs" />
                    <span className="truncate font-semibold text-slate-800">
                      {job.internshipType === "STIPEND"
                        ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                        : job.internshipType === "FREE"
                          ? "Unpaid / Free"
                          : job.internshipType === "PAID"
                            ? `Student Pays: ${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                            : "N/A"}
                    </span>
                  </p>
                </div>

                {/* ── Footer: Qualifications + View details ── */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 gap-2 max-w-full overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 pr-1 overflow-hidden">
                    {job.qualifications?.slice(0, 2).map((q, i) => (
                      <span
                        key={i}
                        className="text-xs bg-purple-50 text-purple-700 font-medium py-0.5 px-2 rounded-lg border border-purple-100/80 truncate max-w-[100px] sm:max-w-[130px] flex-shrink-0"
                        title={q}
                      >
                        {q}
                      </span>
                    ))}
                    {job.qualifications?.length > 2 && (
                      <span className="text-xs bg-slate-100 text-slate-600 font-medium py-0.5 px-1.5 rounded-lg border border-slate-200 flex-shrink-0">
                        +{job.qualifications.length - 2}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onViewDetails(job)}
                    className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0"
                  >
                    <span>View details</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <p className="text-sm font-medium">No jobs found</p>
          </div>
        )}
      </div>

      {/* Saved Jobs Limit Popup */}
      {showSavedJobPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Saved Jobs Limit Reached
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              You have reached the maximum of{" "}
              {getSavedLimitByPlan(planType) === Infinity
                ? "unlimited"
                : getSavedLimitByPlan(planType)}{" "}
              saved jobs for your plan.
            </p>
            <div className="flex justify-between mt-5 gap-3">
              <button
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
                onClick={() => setShowSavedJobPopup(false)}
              >
                Close
              </button>
              <button
                className="flex-1 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition"
                onClick={() => {
                  setShowSavedJobPopup(false);
                  if (handleSelectTab) handleSelectTab("premium");
                }}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Infinite scroll trigger (home page only) */}
      {!isRecommendationMode && (
        <div
          ref={loadMoreRef}
          className="h-10 flex justify-center items-center"
        >
          {loading && (
            <span className="text-gray-400 text-sm">
              Loading more internships…
            </span>
          )}
        </div>
      )}
    </>
  );
};

export default JobCard;
