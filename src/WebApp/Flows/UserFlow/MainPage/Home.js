import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faClock,
  faDollarSign,
  faHeart,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import ApplyCards from "./ApplyCards";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import axios from "../../../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import Skillnaavlogo from "../../../../assets-webapp/Skillnaavlogo.png";
import { format } from "date-fns";

const Homeimage = "/Home-Image.png";

const MAX_LIMITS = {
  Free: 5,
  Freemium: 5,
  "Premium Basic": 25,
  "Premium Plus": Infinity,
};

const getSavedLimitByPlan = (planType) => {
  switch (planType) {
    case "Premium Plus":
      return Infinity;
    case "Premium Basic":
      return 25;
    case "Freemium":
    default:
      return 3;
  }
};

const Home = () => {
  const [assistantPreviewVisible, setAssistantPreviewVisible] = useState(
    () => window.__skillnaavAssistantPreviewVisible ?? true
  );
  const [assistantExpanded, setAssistantExpanded] = useState(false);
  useEffect(() => {
    const updateAssistantPreview = (event) => {
      setAssistantPreviewVisible(event.detail.visible);
      setAssistantExpanded(!!event.detail.expanded);
    };
    window.addEventListener("skillnaav-assistant-preview", updateAssistantPreview);
    return () => window.removeEventListener("skillnaav-assistant-preview", updateAssistantPreview);
  }, []);
  const { savedJobs, saveJob, removeJob, handleSelectTab } = useTabContext();

  // ─── selectedJob controls which view is shown ───────────────────────────
  // Keeping this as local state means Home is never unmounted → jobData stays
  // intact → scroll position can be restored cheaply.
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobData, setJobData] = useState([]);
  const [, setApplicationCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showSavedJobPopup, setShowSavedJobPopup] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState("Freemium");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const loadMoreRef = useRef(null);

  // Saved scroll position of <main id="main-scroll-container"> before entering detail view
  const savedScrollRef = useRef(0);

  const navigate = useNavigate();
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  // ─── Data fetching ───────────────────────────────────────────────────────
  const fetchJobData = async (pageNumber = 1) => {
    try {
      if (loadingRef.current || !hasMoreRef.current) return;

      loadingRef.current = true;
      setLoadingJobs(true);

      const userInfo =
        JSON.parse(localStorage.getItem("studentInfo")) ||
        JSON.parse(localStorage.getItem("userInfo")) ||
        {};
      const isPremiumUser = userInfo.isPremium ? "true" : "false";

      const response = await axios.get(
        `/api/interns/approved?isPremium=${isPremiumUser}&page=${pageNumber}&limit=6`,
      );

      const { data, hasMore: more } = response.data;

      setJobData((prev) => (pageNumber === 1 ? data : [...prev, ...data]));
      hasMoreRef.current = more;
      setHasMore(more);
      setPage(pageNumber);
    } catch (error) {
      console.error("Error fetching internships:", error);
    } finally {
      loadingRef.current = false;
      setLoadingJobs(false);
    }
  };

  // ─── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = "/Home-Image.png";
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;

        const { data } = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setIsPremium(data.isPremium);
        setPlanType(data.planType || "Freemium");

        const userInfo =
          JSON.parse(localStorage.getItem("studentInfo")) ||
          JSON.parse(localStorage.getItem("userInfo")) ||
          {};
        if (userInfo._id) {
          const { data: countData } = await axios.get(
            `/api/applications/count/${userInfo._id}`,
          );
          setApplicationCount(countData.count);
        }
      } catch (error) {
        console.error(
          "Error fetching user profile or application count:",
          error,
        );
      }
    };

    fetchJobData(1);
    fetchUserProfile();
  }, []);

  // IntersectionObserver for infinite scroll — only active when list is visible
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (
          firstEntry.isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current
        ) {
          fetchJobData(page + 1);
        }
      },
      { threshold: 0.8 },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [page, hasMore, loadingJobs, selectedJob]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleViewDetails = async (job) => {
    try {
      const userInfo =
        JSON.parse(localStorage.getItem("studentInfo")) ||
        JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo) return;

      const { data: checkData } = await axios.get(
        `/api/applications/check-applied/${userInfo._id}/${job._id}`,
      );

      if (checkData.isApplied) {
        // Allow them to view details of jobs they already applied to
        const container = document.getElementById("main-scroll-container");
        if (container) savedScrollRef.current = container.scrollTop;
        setSelectedJob(job);
        return;
      }

      const { data: countData } = await axios.get(
        `/api/applications/count/${userInfo._id}`,
      );
      setApplicationCount(countData.count);

      const maxApps = MAX_LIMITS[planType] || 5;

      if (countData.count >= maxApps) {
        setShowLimitPopup(true);
      } else {
        // Save the scroll position of the main container BEFORE switching view
        const container = document.getElementById("main-scroll-container");
        if (container) savedScrollRef.current = container.scrollTop;
        setSelectedJob(job);
      }
    } catch (error) {
      console.error("Error fetching updated application count:", error);
    }
  };

  const handleBack = () => {
    setSelectedJob(null);

    // jobData is still in state (Home never unmounted) so cards render
    // synchronously. requestAnimationFrame fires after paint — scroll is ready.
    requestAnimationFrame(() => {
      const container = document.getElementById("main-scroll-container");
      if (container) container.scrollTop = savedScrollRef.current;
    });
  };

  const toggleSaveJob = async (job) => {
    try {
      if (isPremium && planType === "Freemium") return;

      const savedLimit = getSavedLimitByPlan(planType);
      const jobExists = savedJobs.some((savedJob) => {
        const jobToCheck = savedJob.savedJob || savedJob;
        return jobToCheck.jobId?._id === job._id || jobToCheck._id === job._id;
      });

      if (
        !jobExists &&
        savedJobs.length >= savedLimit &&
        savedLimit !== Infinity
      ) {
        setShowSavedJobPopup(true);
        return;
      }

      if (jobExists) {
        await removeJob(job._id);
      } else {
        await saveJob(job);
      }
    } catch (error) {
      console.error("Error toggling job save:", error);
    }
  };

  const calculatePostedTime = (date) => {
    const postedDate = new Date(date);
    const currentDate = new Date();
    const differenceInDays = Math.floor(
      (currentDate - postedDate) / (1000 * 60 * 60 * 24),
    );
    if (differenceInDays === 0) return "Today";
    if (differenceInDays === 1) return "Yesterday";
    return `${differenceInDays}d ago`;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="font-poppins pb-24 sm:pb-32">
      {selectedJob ? (
        // ── Detail view ──────────────────────────────────────────────────
        // selectedJob is set → list is NOT rendered → IntersectionObserver
        // does NOT fire → no background pagination requests.
        <ApplyCards
          job={selectedJob}
          onBack={handleBack}
          isPremium={isPremium}
        />
      ) : (
        // ── List view ────────────────────────────────────────────────────
        <>
          {/* Header Banner */}
          <div className="relative w-full rounded-xl overflow-hidden mb-3 sm:mb-6 shadow-xs border border-slate-100 bg-white flex items-center justify-center">
            <img
              src={Homeimage}
              alt="Finding Your Dream Job"
              className="w-full max-w-full h-auto object-contain block"
              fetchpriority="high"
            />
          </div>

          {/* Job cards */}
          <section className="py-2 sm:py-6 px-1 sm:px-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-gray-900">Find your next role</h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Recommendations based on your profile
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {jobData.map((job) => {
                const saved = savedJobs.some(
                  (savedJob) =>
                    savedJob.jobId?._id === job._id ||
                    savedJob.jobId === job._id ||
                    savedJob._id === job._id,
                );

                return (
                  <div
                    key={job._id}
                    className="border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-lg hover:border-purple-200 transition-all duration-200 bg-white flex flex-col gap-2.5 sm:gap-3 group"
                  >
                    {/* Top Row: Mode Badge on Left + Type Badge & Save on Right */}
                    <div className="flex items-center justify-between w-full min-h-[28px]">
                      {job.internshipMode ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60">
                          <FontAwesomeIcon icon={faGlobe} className="text-slate-400 text-[11px]" />
                          <span>
                            {job.internshipMode === "ONLINE"
                              ? "Online"
                              : job.internshipMode === "OFFLINE"
                                ? "Offline"
                                : "Hybrid"}
                          </span>
                        </span>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        {job.internshipType && (
                          <span
                            className={`px-2.5 py-0.5 text-xs font-semibold uppercase rounded-full ${
                              job.internshipType === "FREE"
                                ? "bg-green-100 text-green-700 border border-green-200/60"
                                : job.internshipType === "STIPEND"
                                  ? "bg-blue-100 text-blue-700 border border-blue-200/60"
                                  : job.internshipType === "PAID"
                                    ? "bg-red-100 text-red-700 border border-red-200/60"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {job.internshipType}
                          </span>
                        )}
                        <button
                          onClick={() => toggleSaveJob(job)}
                          className={`p-1.5 transition rounded-full hover:bg-slate-50 ${
                            saved
                              ? "text-red-500"
                              : "text-gray-300 hover:text-red-400"
                          }`}
                          aria-label={saved ? "Unsave job" : "Save job"}
                        >
                          <FontAwesomeIcon icon={faHeart} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Company + title (2-line wrap so title never gets truncated aggressively) */}
                    <div className="flex items-start gap-3">
                      <img
                        src={job.imgUrl}
                        alt={`${job.companyName} logo`}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-slate-100 shadow-xs mt-0.5"
                        width="44"
                        height="44"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/favicon-512x469.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors cursor-pointer"
                          title={job.jobTitle}
                          onClick={() => handleViewDetails(job)}
                        >
                          {job.jobTitle}
                        </h3>
                        <div className="flex items-center text-xs sm:text-sm text-slate-500 mt-1">
                          <span className="font-medium truncate max-w-[160px] sm:max-w-none text-slate-600" title={job.companyName}>
                            {job.companyName}
                          </span>
                          <span className="mx-1.5 text-slate-300">•</span>
                          <span className="whitespace-nowrap flex-shrink-0">
                            {calculatePostedTime(job.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Meta information container */}
                    <div className="text-slate-600 space-y-1.5 text-xs sm:text-sm bg-slate-50/70 rounded-xl p-2.5 sm:p-3 border border-slate-100">
                      <p className="flex items-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-purple-500 flex-shrink-0 w-3.5 text-xs" />
                        <span className="truncate text-slate-700 font-medium">{job.location || "Location not specified"} {job.jobType ? `• ${job.jobType}` : ""}</span>
                      </p>
                      <p className="flex items-center">
                        <FontAwesomeIcon icon={faClock} className="mr-2 text-purple-500 flex-shrink-0 w-3.5 text-xs" />
                        <span className="truncate text-slate-600">
                          {job.startDate
                            ? format(new Date(job.startDate), "dd MMM yyyy")
                            : "—"}{" "}
                          –{" "}
                          {job.endDateOrDuration
                            ? format(
                                new Date(job.endDateOrDuration),
                                "dd MMM yyyy",
                              )
                            : "—"}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <FontAwesomeIcon
                          icon={faDollarSign}
                          className="mr-2 text-purple-500 flex-shrink-0 w-3.5 text-xs"
                        />
                        <span className="truncate font-semibold text-slate-800">
                          {job.internshipType === "STIPEND"
                            ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency} per ${job.compensationDetails?.frequency?.toLowerCase()}`
                            : job.internshipType === "FREE"
                              ? "Unpaid / Free"
                              : job.internshipType === "PAID"
                                ? `Student Pays: ${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                                : "N/A"}
                        </span>
                      </p>
                    </div>

                    {/* Qualifications + View details */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 pr-1">
                        {job.qualifications &&
                          job.qualifications.slice(0, 2).map((q, i) => (
                            <span
                              key={i}
                              className="text-xs bg-purple-50 text-purple-700 font-medium py-0.5 px-2 rounded-lg border border-purple-100/80 truncate max-w-[110px] sm:max-w-[130px]"
                              title={q}
                            >
                              {q}
                            </span>
                          ))}
                        {job.qualifications &&
                          job.qualifications.length > 2 && (
                            <span className="text-xs bg-slate-100 text-slate-600 font-medium py-0.5 px-1.5 rounded-lg border border-slate-200 flex-shrink-0">
                              +{job.qualifications.length - 2}
                            </span>
                          )}
                      </div>
                      <button
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0"
                        onClick={() => handleViewDetails(job)}
                      >
                        <span>View details</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load-more sentinel — inside list branch so observer is disconnected
                when the detail view is shown, preventing background fetches */}
            <div
              ref={loadMoreRef}
              className="h-10 flex justify-center items-center mt-4"
            >
              {loadingJobs && (
                <span className="text-gray-500 text-sm">
                  Loading more internships…
                </span>
              )}
            </div>
          </section>
        </>
      )}

      {/* Skillnaav analysis FAB */}
      <div className={`fixed right-4 sm:right-6 z-50 transition-all duration-300 ${!assistantPreviewVisible ? "bottom-20 sm:bottom-28" : assistantExpanded ? "bottom-[370px] sm:bottom-[390px]" : "bottom-24 sm:bottom-[300px]"}`}>
        <button
          onClick={() => navigate("/skillnaav-analysis")}
          className="bg-white rounded-full shadow-lg p-2.5 sm:p-4 hover:shadow-xl hover:scale-105 transition-all duration-300 border border-slate-100"
          aria-label="Skillnaav Analysis"
        >
          <img
            src={Skillnaavlogo}
            alt="Skillnaav Analysis"
            className="w-9 h-9 sm:w-12 sm:h-12 object-contain"
          />
        </button>
      </div>

      {/* Application limit popup */}
      {showLimitPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Application Limit Reached
            </h2>
            <p className="text-gray-600 mt-2">
              You have reached the maximum of {MAX_LIMITS[planType] || 5}{" "}
              applications allowed under your plan ({planType}).
            </p>
            <p className="text-gray-600 mt-1">
              Upgrade your account to apply for more jobs.
            </p>
            <div className="flex justify-between mt-4">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                onClick={() => setShowLimitPopup(false)}
              >
                Close
              </button>
              <button
                className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                onClick={() => {
                  setShowLimitPopup(false);
                  if (handleSelectTab) handleSelectTab("premium");
                }}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved jobs limit popup */}
      {showSavedJobPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Saved Jobs Limit Reached
            </h2>
            <p className="text-gray-600 mt-2">
              You have reached the maximum of{" "}
              {getSavedLimitByPlan(planType) === Infinity
                ? "unlimited"
                : getSavedLimitByPlan(planType)}{" "}
              saved jobs.
            </p>
            <div className="flex justify-between mt-4">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                onClick={() => setShowSavedJobPopup(false)}
              >
                Close
              </button>
              <button
                className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                onClick={() => {
                  setShowSavedJobPopup(false);
                  if (handleSelectTab) handleSelectTab("premium");
                }}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
