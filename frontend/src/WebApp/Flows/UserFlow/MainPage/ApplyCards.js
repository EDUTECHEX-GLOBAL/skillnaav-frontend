import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHeart, FaMapMarkerAlt, FaDollarSign } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import SkillAnalysis from "./SkillnaavAnalysis";
import ProctoredAssessment from "./AssessmentModal";

// 🟡 Limit definitions per plan
const MAX_LIMITS = {
  "Free": { applications: 5, saves: 3 },
  "Premium Basic": { applications: 25, saves: 25 },
  "Premium Plus": { applications: Infinity, saves: Infinity },
};

const ApplyCards = ({ job, onBack }) => {
  const { savedJobs, saveJob, removeJob } = useTabContext();
  const [isApplied, setIsApplied] = useState(false);
  const [resume, setResume] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [applicationCount, setApplicationCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showResumePopup, setShowResumePopup] = useState(false);
  const [showSkillAnalysis, setShowSkillAnalysis] = useState(false);
  const [planType, setPlanType] = useState("Free");
  const [schoolAdminId, setSchoolAdminId] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);



  const navigate = useNavigate();

  // ✅ Fetch application data
  useEffect(() => {
    const fetchApplicationData = async () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const studentId = userInfo?._id;
      const schoolAdminIdFromStorage = userInfo?.schoolAdminId || null;
      const plan = userInfo?.planType || "Free";
      setPlanType(plan);
      setSchoolAdminId(schoolAdminIdFromStorage);

      if (!studentId) return;

      try {
        const { data: appliedData } = await axios.get(
          `/api/applications/check-applied/${studentId}/${job._id}`
        );
        setIsApplied(appliedData.isApplied);

        const { data: countData } = await axios.get(
          `/api/applications/count/${studentId}`
        );
        setApplicationCount(countData.count);
      } catch (error) {
        console.error("Error fetching application data:", error);
      }
    };

    fetchApplicationData();
  }, [job._id]);

  // ✅ Fetch existing assessment if any
  useEffect(() => {
    const fetchAssessment = async () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const studentId = userInfo?._id;
      if (!studentId) return;

      try {
        const { data } = await axios.get(`/api/assessments/${studentId}/${job._id}`);
        if (data?.assessment) setAssessment(data.assessment);
      } catch (error) {
        console.error("Error fetching existing assessment:", error);
      }
    };

    fetchAssessment();
  }, [job._id]);

  // ✅ File upload handler
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!file) return;
    if (!allowedTypes.includes(file.type)) return alert("Only PDF, DOC, and DOCX files are allowed.");
    if (file.size > 5 * 1024 * 1024) return alert("File size should not exceed 5MB.");

    setResume(file);
  };

  // ✅ Apply to internship
 const handleApply = async () => {
  if (isApplied) return;

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const studentId = userInfo?._id;
  const token = localStorage.getItem("userToken");

  if (!studentId || !token) {
    console.error("Missing user or token.");
    alert("Session expired. Please log in again.");
    return;
  }

  // 🔹 Check if stipend internship requires assessment
  if (job.internshipType === "STIPEND") {
    let studentAssessment;

    try {
      const { data } = await axios.get(
        `/api/assessments/${studentId}/${job._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      studentAssessment = data.assessment;
      setAssessment(studentAssessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
    }

    if (!studentAssessment) {
      alert("You must generate and complete the assessment before applying.");
      return;
    }

    let submission;
    try {
      const { data } = await axios.get(
        `/api/assessments/submission/${studentId}/${studentAssessment._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      submission = data.submission;
    } catch {
      submission = null;
    }

    if (!submission || submission.fitStatus !== "fit") {
      alert("You must pass the assessment to apply.");
      return;
    }
  }

  if (!resume) {
    setShowResumePopup(true);
    return;
  }

  // 🔹 Check application limit
  try {
    const { data: countData } = await axios.get(
      `/api/applications/count/${studentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const maxApps = MAX_LIMITS[planType]?.applications || 5;
    if (countData.count >= maxApps) {
      setShowLimitPopup(true);
      return;
    }
  } catch (error) {
    console.error("Error checking application count:", error);
    return;
  }

  // 🔹 Apply
  setIsUploading(true);
  try {
    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("internshipId", job._id);
    formData.append("resume", resume);
    if (schoolAdminId) formData.append("schoolAdminId", schoolAdminId);

    const res = await axios.post("/api/applications/apply", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.status === 201) {
      setIsApplied(true);
      const { data } = await axios.get(
        `/api/applications/count/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplicationCount(data.count);
    }
  } catch (error) {
    const { status, data } = error.response || {};
    if (status === 403 || data?.message?.includes("already applied")) {
      setIsApplied(true);
    } else {
      alert(data?.message || "Something went wrong.");
    }
  } finally {
    setIsUploading(false);
  }
};


  // ✅ Save/unsave job
  const toggleSaveJob = () => {
    const alreadySaved = savedJobs.some((savedJob) => savedJob.jobTitle === job.jobTitle);
    const maxSaves = MAX_LIMITS[planType]?.saves || 3;

    if (!alreadySaved && savedJobs.length >= maxSaves) {
      alert(`You've reached your saved internship limit (${maxSaves}) for your plan: ${planType}`);
      return;
    }

    alreadySaved ? removeJob(job) : saveJob(job);
  };

  // ✅ Skill analysis modal
  const handleSkillAnalysis = () => {
    if (!job?.jobDescription || !job?.qualifications?.length) {
      alert("Job details are incomplete for skill analysis.");
      return;
    }
    setShowSkillAnalysis(true);
  };

  const closeSkillAnalysis = () => setShowSkillAnalysis(false);

  // ✅ Generate AI assessment
  const handleGenerateAssessment = async () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const studentId = userInfo?._id;
    if (!studentId) return alert("Please log in first.");

    if (assessment) {
      alert("You already have an assessment for this internship!");
      return;
    }

    setLoadingAssessment(true);
    try {
      const response = await axios.post("/api/assessments/generate", {
        internshipId: job._id,
        studentId,
      });
      setAssessment(response.data.assessment);
      alert("AI Assessment generated successfully!");
    } catch (error) {
      console.error("Failed to fetch assessment:", error);
      alert("Failed to generate assessment. Please try again later.");
    } finally {
      setLoadingAssessment(false);
    }
  };

  const maxAppsDisplay = MAX_LIMITS[planType]?.applications || 5;

  return (
    <div className="relative bg-white rounded-lg shadow-lg max-w-full mx-auto p-4 sm:p-6 lg:p-8 xl:p-12 overflow-auto">
      <button className="text-gray-500 w-12 h-12 text-sm mb-4" onClick={onBack}>
        &lt; back
      </button>

      <div className="flex flex-col md:flex-row items-start justify-between mb-4">
        <div className="flex items-start mb-4 md:mb-0">
          {job.imgUrl && (
            <img src={job.imgUrl} alt="company-logo" className="rounded-full w-12 h-12 mr-4" />
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">{job.jobTitle}</h2>
            <p className="text-gray-500">{job.companyName}</p>

            <div className="text-gray-500 mt-2 text-sm md:text-base flex items-center">
              <FaMapMarkerAlt className="mr-2" />
              <p>{job.location || "Location not specified"} </p>
            </div>

            <div className="flex items-center text-gray-500 mt-2 text-sm md:text-base">
              <p className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="mr-2" />
                {format(new Date(job.startDate), "dd MMM yyyy")} –{" "}
                {job.endDateOrDuration ? format(new Date(job.endDateOrDuration), "dd MMM yyyy") : "—"}
              </p>
            </div>

            <div className="flex items-center text-gray-500 mt-2 text-sm md:text-base">
              <FaDollarSign className="mr-2" />
              <p>
                {job.internshipType === "STIPEND"
                  ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency} per ${job.compensationDetails?.frequency?.toLowerCase()}`
                  : job.internshipType === "FREE"
                    ? "Unpaid / Free"
                    : job.internshipType === "PAID"
                      ? `Student Pays: ${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                      : "N/A"
                }
              </p>
            </div>

            <div className="mt-4">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>

            <div className="flex gap-4 mt-4">
              {job.applicationOpen ? (
                <button
                  onClick={handleApply}
                  disabled={isApplied || isUploading}
                  className={`text-white px-4 py-2 rounded-full font-semibold ${isApplied ? "bg-green-500" : "bg-purple-500 hover:bg-purple-600"
                    }`}
                >
                  {isApplied ? "Applied" : isUploading ? "Uploading..." : "Apply now"}
                </button>
              ) : (
                <div className="text-red-600 font-semibold p-2 border border-red-400 rounded">
                  Applications are currently closed for this internship.
                </div>
              )}

              <button
                onClick={handleSkillAnalysis}
                className="text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full font-semibold"
              >
                Skill Analysis
              </button>

              {job.internshipType === "STIPEND" && (
                <button
                  onClick={async () => {
                    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
                    const studentId = userInfo?._id;

                    if (!assessment) {
                      // Generate assessment first
                      await handleGenerateAssessment();
                    }
                    setShowAssessmentModal(true); // Open modal only after button click
                  }}
                  disabled={loadingAssessment}
                  className={`px-4 py-2 rounded-full font-semibold ${assessment
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                    }`}
                >
                  {assessment
                    ? "Take Assessment"
                    : loadingAssessment
                      ? "Generating..."
                      : "Generate Assessment"}
                </button>
              )}


            </div>
          </div>
        </div>

        {/* Popups */}
        {showResumePopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-semibold mb-2">Resume Required</h2>
              <p className="text-gray-600">Please upload your resume before applying.</p>
              <button
                onClick={() => setShowResumePopup(false)}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showLimitPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
              <h2 className="text-xl font-semibold text-gray-800">Application Limit Reached</h2>
              <p className="text-gray-600 mt-2">
                You have reached the maximum of {maxAppsDisplay === Infinity ? "∞" : maxAppsDisplay} applications allowed under your plan ({planType}).
              </p>
              <p className="text-gray-600 mt-1">Upgrade your plan to apply for more internships.</p>
              <button
                className="bg-purple-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-purple-600"
                onClick={() => setShowLimitPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showSkillAnalysis && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full overflow-hidden">
              <SkillAnalysis job={job} onClose={closeSkillAnalysis} />
            </div>
          </div>
        )}
      </div>

      <hr className="my-4" />

      <div className="mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">About the job</h3>
        <p className="text-gray-600 leading-relaxed">
          {job.jobDescription || "No description available"}
        </p>
      </div>

      <div>
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Skills required</h3>
        <div className="flex flex-wrap gap-2">
          {(job.qualifications || []).map((qualification, index) => (
            <span key={index} className="text-sm bg-gray-200 text-gray-800 py-1 px-3 rounded-full">
              {qualification}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Contact Information</h3>
        <p className="text-gray-600">
          {job.contactInfo?.name || "Not provided"}, {job.contactInfo?.email || "Not provided"}, {job.contactInfo?.phone || "Not provided"}
        </p>
      </div>

      {/* Assessment Modal */}
      {showAssessmentModal && assessment && (
        <ProctoredAssessment
          assessment={assessment}
          studentId={JSON.parse(localStorage.getItem("userInfo"))._id}
          onClose={() => setShowAssessmentModal(false)}
        />
      )}

    </div>
  );
};

export default ApplyCards;
