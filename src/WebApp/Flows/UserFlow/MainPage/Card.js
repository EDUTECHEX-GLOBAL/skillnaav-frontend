import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaHeart } from "react-icons/fa";
import axios from "../../../../api/axiosInstance";
import { useTabContext } from "./UserHomePageContext/HomePageContext";

// Cache
const jobCache = {
  data: [],
  page: 1,
  hasMore: true,
  timestamp: null
};

const CACHE_DURATION = 60000;

const JobCard = ({
  jobs: externalJobs,
  searchTerm = "",
  onViewDetails
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
  const fetchJobs = useCallback(async (pageNumber = 1) => {
    if (loadingRef.current || (pageNumber !== 1 && !hasMoreRef.current) || isRecommendationMode) {
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
        `/api/interns/approved?page=${pageNumber}&limit=6`
      );

      const { data, hasMore: more } = res.data;

      setJobs(prev => {
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
  }, [isRecommendationMode]);

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
      { threshold: 0.8 }
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
        savedJob.jobId?._id === jobId || savedJob.jobId === jobId || savedJob._id === jobId
    );

  const toggleSaveJob = async (job) => {
    try {
      const savedLimit = getSavedLimitByPlan(planType);

      // Only block NEW saves, not unsaves
      if (!isJobSaved(job._id) && savedJobs.length >= savedLimit && savedLimit !== Infinity) {
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
    job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) return <p>{error}</p>;

  const calculatePostedTime = (date) => {
    const diff = Math.floor(
      (new Date() - new Date(date)) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const saved = isJobSaved(job._id);

            return (
              <div
                key={job._id}
                className="w-full p-4 border rounded-lg shadow-md relative"
              >
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  {job.internshipType && (
                    <span className="text-xs font-semibold bg-gray-200 px-2 py-1 rounded-full">
                      {job.internshipType}
                    </span>
                  )}

                  <button
                    onClick={() => toggleSaveJob(job)}
                    className={`transition ${
                      saved
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                    aria-label={saved ? "Unsave job" : "Save job"}
                  >
                    <FaHeart />
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <img
                    src={job.imgUrl}
                    alt="Company Logo"
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/favicon-512x469.png";
                    }}
                  />
                  <div className="flex-grow">
                    <h5 className="text-lg font-medium">{job.jobTitle}</h5>
                    <p className="text-sm text-gray-500">
                      {job.companyName} • {calculatePostedTime(job.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="flex items-center text-sm text-gray-500">
                    <FaMapMarkerAlt className="mr-2" />
                    {job.location}
                  </p>
                  <p className="flex items-center mt-2 text-sm text-gray-500">
                    <FaClock className="mr-2" />
                    {job.startDate
                      ? new Date(job.startDate).toLocaleDateString()
                      : "—"}{" "}
                    –{" "}
                    {job.endDateOrDuration
                      ? new Date(job.endDateOrDuration).toLocaleDateString()
                      : "—"}
                  </p>
                  <p className="flex items-center mt-2 text-sm text-gray-500">
                    <FaDollarSign className="mr-2" />
                    {job.internshipType === "STIPEND"
                      ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                      : job.internshipType === "FREE"
                      ? "Unpaid / Free"
                      : job.internshipType === "PAID"
                      ? `Student Pays: ${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                      : "N/A"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {job.qualifications?.slice(0, 2).map((q, i) => (
                    <span
                      key={i}
                      className="text-sm bg-gray-200 text-gray-800 py-1 px-3 rounded-full"
                    >
                      {q}
                    </span>
                  ))}
                  {job.qualifications?.length > 2 && (
                    <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                      +{job.qualifications.length - 2}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => onViewDetails(job)}
                    className="text-purple-600 text-sm font-medium"
                  >
                    View details
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">No jobs found</p>
        )}
      </div>

      {/* Saved Jobs Limit Reached Popup */}
      {showSavedJobPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Saved Jobs Limit Reached
            </h2>
            <p className="text-gray-600 mt-2">
              You have reached the maximum of{" "}
              {getSavedLimitByPlan(planType) === Infinity
                ? "unlimited"
                : getSavedLimitByPlan(planType)}{" "}
              saved jobs.
            </p>

            <div className="flex justify-between mt-4">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                onClick={() => setShowSavedJobPopup(false)}
              >
                Close
              </button>
              <button
                className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
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

      {/* Infinite scroll trigger */}
      {!isRecommendationMode && (
        <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
          {loading && (
            <span className="text-gray-500 text-sm">
              Loading more internships…
            </span>
          )}
        </div>
      )}
    </>
  );
};

export default JobCard;
