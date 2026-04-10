import React, { useEffect, useState } from "react";
import axios from "../../../../api/axiosInstance";
import JobCard from "./Card";
import ApplyCards from "./ApplyCards";

// Component to display Material Science internships
// This component fetches and displays internships in the Material Science sector
const MaterialScience = () => {
  const [internships, setInternships] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null); // ✅ for ApplyCards
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSectorInternships = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/interns/approved", {
          params: { isPremium: false, sector: "materials-science" },
        });
        setInternships(res.data.data);
      } catch (err) {
        console.error("Error fetching sector internships:", err);
        setError("Failed to load internships");
      } finally {
        setLoading(false);
      }
    };
    fetchSectorInternships();
  }, []);

  if (loading) return <p>Loading internships...</p>;
  if (error) return <p>{error}</p>;
  
// ✅ show loading or error messages
  return (
    <>
      {!selectedJob ? (
        <JobCard
          jobs={internships}
          searchTerm=""
          onViewDetails={(job) => setSelectedJob(job)} // ✅ pass function
        />
      ) : (
        <ApplyCards job={selectedJob} onBack={() => setSelectedJob(null)} /> // ✅ open ApplyCards
      )}
    </>
  );
};

export default MaterialScience;
