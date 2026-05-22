import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "../../../../api/axiosInstance";
import { useLocation } from "react-router-dom";
import JobCard from "./Card";
import ApplyCards from "./ApplyCards";

/* -----------------------------------
   HARD DEDUPE (GUARANTEED)
----------------------------------- */
const dedupeById = (arr = []) => {
  const seen = new Set();
  return arr.filter(item => {
    if (!item?._id) return false;
    if (seen.has(String(item._id))) return false;
    seen.add(String(item._id));
    return true;
  });
};

const Recommendations = () => {
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchedOnce = useRef(false);

  const location  = useLocation();
  const query     = useMemo(() => new URLSearchParams(location.search), [location]);
  const openRecId = query.get("openRec");

  /* -----------------------------------
     FETCH ONLY ONCE
  ----------------------------------- */
  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("userToken");
      if (!token) {
        setError("Please log in to view recommendations.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get("/api/applications/recommendations", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = data?.recommendations ?? (Array.isArray(data) ? data : []);
        const uniqueJobs = dedupeById(raw);
        setJobs(uniqueJobs);

        if (openRecId) {
          const match = uniqueJobs.find(j => String(j._id) === String(openRecId));
          if (match) setSelectedJob(match);
        }
      } catch (err) {
        console.error("Recommendation fetch failed", err);
        setError("Failed to fetch recommendations");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [openRecId]);

  /* -----------------------------------
     LOADER — skeleton cards
  ----------------------------------- */
  if (loading) {
    return (
      <div className="p-6 font-[Poppins]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recommended Internships</h2>
          <p className="text-sm text-gray-400 mt-1">
            Our AI is finding the best matches for your profile…
          </p>
        </div>

        {/* AI loading indicator */}
        <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-purple-50 border border-purple-100 rounded-xl">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
          </span>
          <p className="text-sm text-purple-700 font-medium">
            AI is personalising your recommendations…
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
              {/* match_reason skeleton */}
              <div className="h-8 bg-purple-50 rounded-lg w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 font-[Poppins]">
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400 text-xl">!</div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="p-6 font-[Poppins]">
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="text-4xl">🎯</div>
          <p className="text-gray-600 font-medium">No recommendations yet.</p>
          <p className="text-sm text-gray-400">
            Complete your profile and personality test to get personalised matches.
          </p>
        </div>
      </div>
    );
  }

  if (selectedJob) {
    return <ApplyCards job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  // Check if Claude provided match reasons for any job
  const hasAiReasons = jobs.some(j => j.match_reason);

  return (
    <div className="p-6 font-[Poppins]">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recommended Internships</h2>
        <p className="text-sm text-gray-500 mt-1">
          {jobs.length} internship{jobs.length !== 1 ? "s" : ""} matched to your profile
        </p>
      </div>

      {/* AI badge — only shown when Claude actually returned match reasons */}
      {hasAiReasons && (
        <div className="flex items-center gap-2.5 mb-5 px-4 py-2.5 bg-purple-50 border border-purple-100 rounded-xl w-fit">
          <span className="text-purple-500 text-sm">✦</span>
          <p className="text-sm text-purple-700 font-medium">
            AI-personalised — ranked and explained for your profile
          </p>
        </div>
      )}

      <JobCard
        jobs={jobs}
        onViewDetails={job => setSelectedJob(job)}
        isRecommendation
      />
    </div>
  );
};

export default Recommendations;