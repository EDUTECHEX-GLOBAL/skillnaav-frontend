import React, { useState, useEffect } from "react";
import axios from "../../../../api/axiosInstance";
import { FaMapMarkerAlt, FaDollarSign } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import SkillAnalysis from "./SkillnaavAnalysis";
import ProctoredAssessment from "./AssessmentModal";
import { FaTrash, FaChevronDown } from "react-icons/fa";

// 🟡 Limit definitions per plan
const MAX_LIMITS = {
  "Free": { applications: 5, saves: 3 },
  "Freemium": { applications: 5, saves: 3 },
  "Premium Basic": { applications: 25, saves: 25 },
  "Premium Plus": { applications: Infinity, saves: Infinity },
};

const ApplyCards = ({ job, onBack }) => {
  const [isApplied, setIsApplied] = useState(false);
  const [resume, setResume] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [, setApplicationCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showResumePopup, setShowResumePopup] = useState(false);
  const [showSkillAnalysis, setShowSkillAnalysis] = useState(false);
  const [planType, setPlanType] = useState("Free");
  const [schoolAdminId, setSchoolAdminId] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [existingResumes, setExistingResumes] = useState([]);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState(null);
  const [showResumeDropdown, setShowResumeDropdown] = useState(false);
  

  // ✅ Fetch application data
  useEffect(() => {
    const fetchApplicationData = async () => {
      const userInfo = (JSON.parse(localStorage.getItem("studentInfo")) || JSON.parse(localStorage.getItem("userInfo")));
      const studentId = userInfo?._id;
      const schoolAdminIdFromStorage = userInfo?.schoolAdminId || null;
      setSchoolAdminId(schoolAdminIdFromStorage);

      if (!studentId) return;

      try {
        // Fetch fresh planType from server to avoid stale localStorage after re-subscription
        const token = localStorage.getItem("userToken");
        let freshPlan = userInfo?.planType || "Free";
        if (token) {
          try {
            const { data: profileData } = await axios.get("/api/users/profile", {
              headers: { Authorization: `Bearer ${token}` },
            });
            freshPlan = profileData.planType || freshPlan;
            // Sync back to localStorage
            const updatedInfo = { ...userInfo, planType: freshPlan };
            localStorage.setItem("studentInfo", JSON.stringify(updatedInfo));
          } catch (_) { /* fallback to localStorage value */ }
        }
        setPlanType(freshPlan);

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
  useEffect(() => {
    const fetchResumes = async () => {
      const userInfo = (JSON.parse(localStorage.getItem("studentInfo")) || JSON.parse(localStorage.getItem("userInfo")));
      const studentId = userInfo?._id;
      if (!studentId) return;

      try {
        const res = await axios.get(`/api/resumes/user/${studentId}`);
        console.log("RESUME API RESPONSE:", res.data);   // ⭐ ADD THIS
        setExistingResumes(res.data.resumes || []);
      } catch (err) {
        console.error("Error fetching resumes", err);
      }
    };

    fetchResumes();
  }, []);

  // ✅ Fetch existing assessment if any
  useEffect(() => {
    const fetchAssessment = async () => {
      const userInfo = (JSON.parse(localStorage.getItem("studentInfo")) || JSON.parse(localStorage.getItem("userInfo")));
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

    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return alert("Only PDF, DOC and DOCX files are allowed.");
    }

    if (file.size > 5 * 1024 * 1024) {
      return alert("File size should not exceed 5MB.");
    }

    setResume(file);
    

    // disable dropdown
    setSelectedResumeUrl(null);
  };

  // ✅ Apply to internship
  const handleApply = async () => {
    if (isApplied) return;

    const userInfo = (JSON.parse(localStorage.getItem("studentInfo")) || JSON.parse(localStorage.getItem("userInfo")));
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

    // ✅ Check BOTH options
    if (!resume && !selectedResumeUrl) {
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

      if (resume) {
        formData.append("resume", resume);
      }

      if (selectedResumeUrl) {
        formData.append("resumeUrl", selectedResumeUrl);
      }
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
    const userInfo = (JSON.parse(localStorage.getItem("studentInfo")) || JSON.parse(localStorage.getItem("userInfo")));
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

  const handleDeleteResume = async (resumeId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this resume?"
  );

  if (!confirmDelete) return;

  try {
    await axios.delete(`/api/resumes/${resumeId}`);
if (
  selectedResumeUrl ===
  existingResumes.find((r) => r._id === resumeId)?.fileUrl
) {
  setSelectedResumeUrl(null);
}
    setExistingResumes((prev) =>
      prev.filter((resume) => resume._id !== resumeId)
    );

    if (
      selectedResumeUrl &&
      existingResumes.find(
        (resume) =>
          resume._id === resumeId &&
          resume.fileUrl === selectedResumeUrl
      )
    ) {
      setSelectedResumeUrl(null);
    }

    alert("Resume deleted successfully");
  } catch (error) {
    console.error(error);
    alert("Failed to delete resume");
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

  {/* Existing Resumes */}
  {existingResumes.length > 0 && (
    <div className="mb-3">
      <p className="text-sm font-semibold text-gray-700 mb-1">
        Select Existing Resume
      </p>

<div className="relative w-full">
  <button
    type="button"
    disabled={isApplied}
    onClick={() => setShowResumeDropdown(!showResumeDropdown)}
    className={`w-full border rounded-md px-4 py-2 flex justify-between items-center bg-white ${
      isApplied ? "cursor-not-allowed bg-gray-100" : ""
    }`}
  >
    <span>
      {selectedResumeUrl
        ? existingResumes.find(
            (r) => r.fileUrl === selectedResumeUrl
          )?.fileName
        : "-- Choose Resume --"}
    </span>

    <FaChevronDown />
  </button>

  {showResumeDropdown && !isApplied && (
    <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
      {existingResumes.length === 0 ? (
        <div className="px-4 py-2 text-gray-500">
          No resumes found
        </div>
      ) : (
        existingResumes.map((res) => (
          <div
            key={res._id}
            className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer"
          >
            <span
              className="flex-1 truncate"
              onClick={() => {
                setSelectedResumeUrl(res.fileUrl);
                setResume(null);
                setShowResumeDropdown(false);
              }}
            >
              {res.fileName}
            </span>

            <button
              type="button"
              className="text-red-500 hover:text-red-700 ml-3"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteResume(res._id);
              }}
            >
              <FaTrash />
            </button>
          </div>
        ))
      )}
    </div>
  )}
</div>



    {selectedResumeUrl && (
  <div className="mt-2">
    <button
      type="button"
      onClick={() => setSelectedResumeUrl(null)}
      className="text-red-500 text-sm hover:underline"
    >
      Clear selected resume
    </button>
  </div>
)}
    </div>
  )}

  {/* Resume Count */}
  <p className="text-sm text-gray-500 mt-1">
    {existingResumes.length}/5 resumes used
  </p>

  {existingResumes.length >= 5 && (
    <p className="text-red-500 text-sm mt-1">
      Maximum 5 resumes allowed. Delete one to upload another.
    </p>
  )}

  {/* Upload New Resume */}
  <div className="mt-3">
  <input
  type="file"
  accept=".pdf,.doc,.docx"
  disabled={isApplied || existingResumes.length >= 5}
  onChange={(e) => {
    handleFileChange(e);
    setSelectedResumeUrl(null);
  }}
  className={`block w-full text-sm ${
    isApplied || existingResumes.length >= 5
      ? "text-gray-400 cursor-not-allowed"
      : "text-gray-500"
  }`}
/>

    {resume && (
  <div className="mt-2">
    <button
      type="button"
      onClick={() => setResume(null)}
      className="text-red-500 text-sm hover:underline"
    >
      Remove uploaded resume
    </button>
  </div>
)}

    {selectedResumeUrl && (
      <p className="text-gray-500 text-sm mt-2">
        File upload disabled because a saved resume is selected.
      </p>
    )}
  </div>

  {/* Resume Preview */}
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
    <p className="text-sm font-semibold text-gray-700">
      Resume that will be submitted
    </p>

    <p className="text-blue-700 mt-1 font-medium">
      {resume?.name ||
        existingResumes.find(
          (r) => r.fileUrl === selectedResumeUrl
        )?.fileName ||
        "No resume selected"}
    </p>
  </div>

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
          studentId={(JSON.parse(localStorage.getItem("studentInfo")) || JSON.parse(localStorage.getItem("userInfo")))._id}
          onClose={() => setShowAssessmentModal(false)}
        />
      )}

    </div>
  );
};

export default ApplyCards;
