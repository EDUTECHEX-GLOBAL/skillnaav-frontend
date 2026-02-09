import React, { useEffect, useState } from "react";
import axios from "axios";
import JobCard from "./Card";
import ApplyCards from "./ApplyCards";

// Component to display Climate Tech internships
// This component fetches and displays internships in the Climate Tech sector
const QuantumComputing = () => {
  const [internships, setInternships] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSectorInternships = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/interns/approved", {
          params: { isPremium: false, sector: "quantum-computing" },
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
      <h1 className="text-2xl font-bold mb-2">Quantum Computing Internships</h1>
      <p className="text-gray-600 mb-4">
        Discover opportunities in Quantum Computing and Next-Gen Computing
        research.
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

export default QuantumComputing;
