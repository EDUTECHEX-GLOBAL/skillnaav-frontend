// Card.js (or whatever your Card component file is called)
import React, { useEffect, useState, useRef } from "react";
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaHeart } from "react-icons/fa";
import axios from "axios";
import { useTabContext } from "./UserHomePageContext/HomePageContext";

// Create a cache outside the component to persist across re-renders
const jobCache = {
  data: [],
  page: 1,
  hasMore: true,
  timestamp: null
};

const CACHE_DURATION = 60000; // Cache for 1 minute

const JobCard = ({ searchTerm = "", onViewDetails }) => {
  const { savedJobs, saveJob, removeJob } = useTabContext();

  const [jobs, setJobs] = useState(jobCache.data || []);
  const [page, setPage] = useState(jobCache.page || 1);
  const [hasMore, setHasMore] = useState(jobCache.hasMore !== false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadMoreRef = useRef(null);

  // ✅ SAME fetch logic as Home.js
  const fetchJobs = async (pageNumber = 1) => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);

      // Check cache first
      if (pageNumber === 1 && jobCache.timestamp && 
          (Date.now() - jobCache.timestamp) < CACHE_DURATION) {
        console.log("Using cached job data");
        setJobs(jobCache.data);
        setPage(jobCache.page);
        setHasMore(jobCache.hasMore);
        setLoading(false);
        return;
      }

      const res = await axios.get(
        `/api/interns/approved?page=${pageNumber}&limit=6`
      );

      const { data, hasMore: more } = res.data;

      setJobs((prev) =>
        pageNumber === 1 ? data : [...prev, ...data]
      );

      setHasMore(more);
      setPage(pageNumber);

      // Update cache
  setJobs(prev => {
  const updated = pageNumber === 1 ? data : [...prev, ...data];

  // 🔒 lock order
  jobCache.data = updated;
  jobCache.page = pageNumber;
  jobCache.hasMore = more;
  jobCache.timestamp = Date.now();

  return updated;
});


    } catch {
      setError("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load - only fetch if cache is empty or expired
useEffect(() => {
  if (jobCache.data.length > 0) {
    setJobs(jobCache.data);
    setPage(jobCache.page);
    setHasMore(jobCache.hasMore);
    return;
  }

  fetchJobs(1);
}, []);

  // ✅ FIXED Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          fetchJobs(page + 1);
        }
      },
      { threshold: 0.8 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  // ✅ Check saved job
  const isJobSaved = (jobId) =>
    savedJobs.some(
      (savedJob) =>
        savedJob.jobId?._id === jobId || savedJob.jobId === jobId
    );

  // ✅ Toggle save / unsave
  const toggleSaveJob = async (job) => {
    try {
      if (isJobSaved(job._id)) {
        await removeJob(job._id);
      } else {
        await saveJob(job);
      }
    } catch (err) {
      console.error("Error toggling save job:", err);
    }
  };

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
          filteredJobs.map((job, index) => {
            const saved = isJobSaved(job._id);

            return (
              <div
                key={job._id} // Use job._id for stable keys
                className="w-full p-4 border rounded-lg shadow-md relative"
              >
                {/* Badge & Save */}
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
                  >
                    <FaHeart />
                  </button>
                </div>

                {/* Job Info */}
                <div className="flex items-start gap-4">
                  <img
                    src={job.imgUrl}
                    alt="Company Logo"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-grow">
                    <h5 className="text-lg font-medium">{job.jobTitle}</h5>
                    <p className="text-sm text-gray-500">
                      {job.companyName} • {calculatePostedTime(job.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4">
                  <p className="flex items-center text-sm text-gray-500">
                    <FaMapMarkerAlt className="mr-2" />
                    {job.location}
                  </p>
                  <p className="flex items-center mt-2 text-sm text-gray-500">
                    <FaClock className="mr-2" />
                    {new Date(job.startDate).toLocaleDateString()} -{" "}
                    {job.endDateOrDuration}
                  </p>
                  <p className="flex items-center mt-2 text-sm text-gray-500">
                    <FaDollarSign className="mr-2" />
                    {job.internshipType === "STIPEND"
                      ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                      : job.internshipType === "FREE"
                      ? "Unpaid / Free"
                      : `Student Pays: ${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`}
                  </p>
                </div>

                {/* Qualifications */}
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

                {/* View details */}
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

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
        {loading && (
          <span className="text-gray-500 text-sm">
            Loading more internships…
          </span>
        )}
      </div>
    </>
  );
};

export default JobCard;