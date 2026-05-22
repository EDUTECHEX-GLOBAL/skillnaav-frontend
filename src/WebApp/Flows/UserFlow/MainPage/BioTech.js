import React, { useEffect, useState } from "react";
import axios from "../../../../api/axiosInstance";
import JobCard from "./Card";
import ApplyCards from "./ApplyCards";

// Component to display Biotechnology internshipsss
const BioTech = () => {
  const [internships, setInternships] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch internships for "Biotechnology" sector when component mounts
  useEffect(() => {
    const fetchSectorInternships = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/interns/approved", {
          params: { isPremium: false, sector: "biotechnology" },
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

// Render the component
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">
        Biotechnology & Synthetic Biology Internships
      </h1>
      <p className="text-gray-600 mb-4">
        Explore the latest roles in Biotechnology, Bioengineering, and Synthetic
        Biology.
      </p>

      {!selectedJob ? (
        <JobCard
          jobs={internships}
          searchTerm=""
          onViewDetails={(job) => setSelectedJob(job)}
        />
      ) : (
        <ApplyCards job={selectedJob} onBack={() => setSelectedJob(null)} />
      )}
    </div>
  );
};

export default BioTech;
