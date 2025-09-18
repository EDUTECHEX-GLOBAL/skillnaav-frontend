import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faClock, faDollarSign } from "@fortawesome/free-solid-svg-icons";
import ApplyCards from "./ApplyCards"; // ✅ Import ApplyCards component

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null); // ✅ NEW: state to handle selected job

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const studentId = userInfo ? userInfo._id : null;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        if (!studentId) {
          setError("Student ID not found. Please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/applications/student/${studentId}/applications`);
        setApplications(response.data.applications);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching applications:", err);
        setError("Failed to load applications. Please try again.");
        setLoading(false);
      }
    };

    fetchApplications();
  }, [studentId]);

  if (loading) {
    return (
      <div className="p-4 font-poppins">
        <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-4 animate-pulse">
              {/* Skeleton UI */}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <p>{error}</p>;

  const statusColors = {
    Applied: "bg-green-100 text-green-700",
    Shortlisted: "bg-blue-100 text-blue-700",
    Rejected: "bg-red-100 text-red-700",
    Pending: "bg-yellow-100 text-yellow-700",
    // Add other statuses and colors as needed
  };

  // If a job is selected, show ApplyCards view
  if (selectedJob) {
    return (
      <ApplyCards
        job={selectedJob}
        onBack={() => setSelectedJob(null)} // ✅ Go back to application list
      />
    );
  }

  return (
    <div className="p-4 font-poppins">
      <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((application, index) => {
            const job = application.internshipId;
            if (!job) return null;

            return (
              <div key={index} className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <img
                      src={job?.imgUrl || "default-image.jpg"}
                      alt={`${job?.companyName || "Company"} logo`}
                      className="rounded-full w-12 h-12 mr-4"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">{job?.jobTitle || "N/A"}</h3>
                      <p className="text-gray-500">{job?.companyName || "Unknown Company"}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      statusColors[application.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {application.status}
                  </span>
                </div>

                <div className="text-gray-500 text-sm mb-2">
                  <p>
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> {job?.location || "N/A"} •{" "}
                    {job?.jobType || "N/A"}
                  </p>
                  <p>
                    <FontAwesomeIcon icon={faClock} /> {job?.endDateOrDuration || "N/A"}
                  </p>
                  <p>
                    <FontAwesomeIcon icon={faDollarSign} />{" "}
                    {job.internshipType === "STIPEND"
                      ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency} per ${job.compensationDetails?.frequency?.toLowerCase()}`
                      : job.internshipType === "FREE"
                      ? "Unpaid / Free"
                      : job.internshipType === "PAID"
                      ? `Student Pays: ${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                      : "N/A"}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-2">
                    {job.qualifications &&
                      job.qualifications.slice(0, 2).map((qualification, idx) => (
                        <span
                          key={idx}
                          className="text-sm bg-gray-200 text-gray-800 py-1 px-3 rounded-full"
                        >
                          {qualification}
                        </span>
                      ))}
                    {job.qualifications && job.qualifications.length > 2 && (
                      <span className="text-sm bg-gray-100 text-gray-700 py-1 px-3 rounded-full">
                        +{job.qualifications.length - 2}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedJob(job)}
                    className="text-purple-500 font-semibold"
                  >
                    View details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Applications;
