import React, { useEffect, useState } from "react";
import axios from "axios";
import JobCard from "./Card";
import ApplyCards from "./ApplyCards";

const Recommendations = () => {
  const [jobSummaries, setJobSummaries] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Fetch recommendations list
  useEffect(() => {
    const fetchRecommendations = async () => {
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

        if (response.data?.recommendations) {
          setJobSummaries(response.data.recommendations);
        } else if (Array.isArray(response.data)) {
          setJobSummaries(response.data);
        } else {
          setJobSummaries([]);
          setError("No recommendations returned");
        }
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
        setError("Failed to fetch recommendations");
        setJobSummaries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // Hydrate jobs with full details
  useEffect(() => {
    const hydrateJobs = async () => {
      if (!jobSummaries.length) return setJobs([]);
      try {
        const detailPromises = jobSummaries.map(async (summary) => {
          if (
            summary.createdAt &&
            summary.adminApproved &&
            summary.companyName &&
            summary.jobTitle
          ) {
            return summary;
          }
          const resp = await axios.get(`/api/interns/${summary._id}`);
          return resp.data;
        });
        const jobsArr = await Promise.all(detailPromises);
        setJobs(jobsArr.filter(Boolean));
      } catch (err) {
        setError("Failed to load full job details");
        setJobs([]);
      }
    };

    hydrateJobs();
  }, [jobSummaries]);

  if (loading) return <div>Loading recommendations...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!jobs.length) return <div>No recommendations at the moment.</div>;

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
