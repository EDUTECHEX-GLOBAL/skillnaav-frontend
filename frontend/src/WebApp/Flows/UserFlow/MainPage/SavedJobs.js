import React, { useEffect, useState } from "react";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faMapMarkerAlt, faClock, faDollarSign } from "@fortawesome/free-solid-svg-icons";
import ApplyCards from "./ApplyCards"; // ✅ Import ApplyCards

const SavedJobs = () => {
  const { savedJobs, removeJob, getSavedJobs } = useTabContext();
  const [selectedJob, setSelectedJob] = useState(null); // ✅ State for detail view
  const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {};
  const userId = userInfo?._id;

  useEffect(() => {
    if (userId) {
      getSavedJobs();
    }
  }, [userId, getSavedJobs]);

  const calculatePostedTime = (date) => {
    const postedDate = new Date(date);
    const currentDate = new Date();
    const diffInTime = currentDate - postedDate;
    const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays}d ago`;
  };

  // ✅ If a job is selected, show ApplyCards view
  if (selectedJob) {
    return (
      <ApplyCards
        job={selectedJob}
        onBack={() => setSelectedJob(null)}
      />
    );
  }

  return (
    <div className="p-6 font-poppins">
      <h2 className="text-2xl font-bold mb-4">Saved Jobs</h2>

      {savedJobs?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedJobs.map((job) =>
            job?.jobId?._id ? (
              <div key={job.jobId._id} className="relative border rounded-lg p-6 shadow-sm">
                {/* Remove Job Button */}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => removeJob(job.jobId._id)}
                    className="text-red-500"
                  >
                    <FontAwesomeIcon icon={faHeart} className="w-6 h-6" />
                  </button>
                </div>

                {/* Job Header */}
                <div className="flex items-center mb-4">
                  <img
                    src={job.jobId?.imgUrl || "/default-image.png"}
                    alt="Company Logo"
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{job.jobId?.jobTitle || "Unknown Title"}</h3>
                    <p className="text-gray-600">{job.jobId?.companyName || "Unknown Company"}</p>
                  </div>
                </div>

                {/* Job Info */}
                <div className="text-gray-600 mb-4">
                  <p>
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> {job.jobId?.location || "Unknown Location"} • {job.jobId?.type || "N/A"}
                  </p>
                  <p><FontAwesomeIcon icon={faClock} /> {new Date(job.jobId?.startDate).toLocaleDateString()} - {job.jobId?.endDateOrDuration}</p>
                  <p>
                    <FontAwesomeIcon icon={faDollarSign} />
                    {job.jobId?.internshipType === "STIPEND"
                      ? `$${job.jobId?.compensationDetails?.amount} ${job.jobId?.compensationDetails?.currency} per ${job.jobId?.compensationDetails?.frequency?.toLowerCase()}`
                      : job.jobId?.internshipType === "FREE"
                      ? "Unpaid / Free"
                      : job.jobId?.internshipType === "PAID"
                      ? `Student Pays: $${job.jobId?.compensationDetails?.amount} ${job.jobId?.compensationDetails?.currency}`
                      : "N/A"
                    }
                  </p>
                </div>

                {/* Skills + View Details */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {job.jobId?.qualifications?.length > 0 ? (
                      job.jobId.qualifications.map((q, idx) => (
                        <span key={idx} className="text-sm bg-gray-200 text-gray-800 py-1 px-3 rounded-full">
                          {q}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No qualifications listed</span>
                    )}
                  </div>

                  <button
                    className="text-purple-600 hover:underline"
                    onClick={() => setSelectedJob(job.jobId)} // ✅ Set selected job
                  >
                    View details
                  </button>
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <p className="text-gray-600">You have no saved jobs.</p>
      )}
    </div>
  );
};

export default SavedJobs;
