import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import JobCard from "./Card";
import ApplyCards from "./ApplyCards";

const Recommendations = () => {
  const [jobSummaries, setJobSummaries] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const location = useLocation();
  // parse query params
  const query = new URLSearchParams(location.search);
  const openRecId = query.get("openRec"); // if present, auto-open this job after load

  // Fetch recommendations list (uses your Node endpoint)
  useEffect(() => {
    let mounted = true;
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const token =
          JSON.parse(localStorage.getItem("token")) ||
          JSON.parse(localStorage.getItem("userToken")) ||
          null;

        const response = await axios.get("/api/applications/recommendations", {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });

        // support multiple shapes
        const recs =
          response.data?.recommendations ??
          (Array.isArray(response.data) ? response.data : []);

        if (mounted) setJobSummaries(Array.isArray(recs) ? recs : []);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
        if (mounted) {
          setError("Failed to fetch recommendations");
          setJobSummaries([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => {
      mounted = false;
    };
  }, []);

  // Hydrate jobs with full details, then auto-open openRec if provided
  useEffect(() => {
    let mounted = true;
    const hydrateJobs = async () => {
      if (!jobSummaries || jobSummaries.length === 0) {
        if (mounted) setJobs([]);
        return;
      }

      try {
        const detailPromises = jobSummaries.map(async (summary) => {
          // if summary already has full fields, return as-is
          if (
            summary.createdAt &&
            (summary.adminApproved || summary.companyName) &&
            summary.jobTitle
          ) {
            return summary;
          }
          // otherwise fetch details
          try {
            const resp = await axios.get(`/api/interns/${summary._id}`);
            // backend might return { job: {...} } or the job object directly
            return resp?.data?.job ?? resp?.data ?? null;
          } catch (e) {
            // log and continue
            console.warn("Failed to fetch job details for", summary._id, e?.message || e);
            return null;
          }
        });

        const jobsArr = (await Promise.all(detailPromises)).filter(Boolean);

        if (!mounted) return;
        setJobs(jobsArr);

        // if openRecId provided, try to find and open it
        if (openRecId) {
          const match = jobsArr.find((j) => String(j._id) === String(openRecId) || String(j._id) === String(openRecId).replace(/^"|"$/g, ""));
          if (match) {
            setSelectedJob(match);
          } else {
            // If we didn't find the job in fetched details, optionally try fetching it directly
            try {
              const resp = await axios.get(`/api/interns/${openRecId}`);
              const directJob = resp?.data?.job ?? resp?.data ?? null;
              if (directJob && mounted) setSelectedJob(directJob);
            } catch (err) {
              // ignore: it's okay if the specific job isn't available
              console.warn("openRec direct fetch failed:", err?.message || err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load full job details", err);
        if (mounted) {
          setError("Failed to load full job details");
          setJobs([]);
        }
      }
    };

    hydrateJobs();
    return () => {
      mounted = false;
    };
  }, [jobSummaries, openRecId]);

  // Skeleton loader
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="p-4 border rounded-lg shadow-md bg-white flex flex-col gap-3"
        >
          <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-300 rounded mt-2"></div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 font-[Poppins]">
        <h2 className="text-2xl font-bold mb-4">Recommended Internships</h2>
        <SkeletonLoader />
      </div>
    );
  }

  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!jobs.length) return <div className="p-6 font-[Poppins]">No recommendations at the moment.</div>;

  if (selectedJob) {
    return (
      <ApplyCards job={selectedJob} onBack={() => setSelectedJob(null)} />
    );
  }

  return (
    <div className="font-[Poppins] p-6">
      <h2 className="text-2xl font-bold mb-4">Recommended Internships</h2>
      <JobCard jobs={jobs} onViewDetails={(job) => setSelectedJob(job)} />
    </div>
  );
};

export default Recommendations;
