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
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchedOnce = useRef(false); // 🔒 prevents re-fetch

  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location]);
  const openRecId = query.get("openRec");

  /* -----------------------------------
     FETCH ONLY ONCE
  ----------------------------------- */
  useEffect(() => {
    if (fetchedOnce.current) return; // 🚫 stop repeat
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
        const { data } = await axios.get(
          "/api/applications/recommendations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const raw =
          data?.recommendations ??
          (Array.isArray(data) ? data : []);

        const uniqueJobs = dedupeById(raw);

        setJobs(uniqueJobs);

        // handle openRec safely
        if (openRecId) {
          const match = uniqueJobs.find(
            j => String(j._id) === String(openRecId)
          );
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
     LOADER
  ----------------------------------- */
  if (loading) {
    return (
      <div className="p-6 font-[Poppins]">
        <h2 className="text-2xl font-bold mb-4">
          Recommended Internships
        </h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 font-[Poppins] text-red-600">
        {error}
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="p-6 font-[Poppins]">
        No recommendations available.
      </div>
    );
  }

  if (selectedJob) {
    return (
      <ApplyCards
        job={selectedJob}
        onBack={() => setSelectedJob(null)}
      />
    );
  }

  return (
    <div className="p-6 font-[Poppins]">
      <h2 className="text-2xl font-bold mb-4">
        Recommended Internships
      </h2>

      <JobCard
        jobs={jobs}
        onViewDetails={job => setSelectedJob(job)}
      />
    </div>
  );
};

export default Recommendations;
