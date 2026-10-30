import React, { useState, useEffect, useRef, useCallback } from "react";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import axios from "../../../../api/axiosInstance";
import {
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaHeart,
  FaChevronDown,
  FaCheck,
} from "react-icons/fa";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { format } from "date-fns";
import ApplyCards from "./ApplyCards";

// ── Filter config ─────────────────────────────────────────────────────────────
const FILTER_GROUPS = [
  {
    key: "internshipType",
    label: "Type",
    options: [
      { value: "FREE", label: "Free" },
      { value: "STIPEND", label: "Stipend" },
      { value: "PAID", label: "Paid" },
    ],
  },
  {
    key: "internshipMode",
    label: "Mode",
    options: [
      { value: "ONLINE", label: "Online" },
      { value: "OFFLINE", label: "Offline" },
      { value: "HYBRID", label: "Hybrid" },
    ],
  },
  {
    key: "classification",
    label: "Level",
    options: [
      { value: "Basic", label: "Basic" },
      { value: "Intermediate", label: "Intermediate" },
      { value: "Advanced", label: "Advanced" },
    ],
  },
];

const FilterDropdown = ({ group, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = group.options.find((opt) => opt.value === value);
  const displayLabel = selectedOption
    ? selectedOption.label
    : `All ${group.label}s`;
  const isSelected = Boolean(value);

  return (
    <div
      className="flex flex-col gap-1 relative flex-1 min-w-[90px] sm:flex-initial sm:min-w-[130px]"
      ref={dropdownRef}
    >
      <label className="text-[11px] sm:text-xs text-gray-500 font-semibold tracking-wide">
        {group.label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm border transition bg-white text-left focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs ${
          isSelected
            ? "border-teal-500 bg-teal-50/60 text-teal-800 font-semibold ring-1 ring-teal-500"
            : "border-gray-300 text-gray-700 hover:border-gray-400"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayLabel}</span>
        <FaChevronDown
          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 shrink-0 ml-0.5 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-teal-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-40 overflow-hidden"
        >
          <button
            type="button"
            role="option"
            aria-selected={!isSelected}
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 text-xs sm:text-sm text-left transition ${
              !isSelected
                ? "bg-teal-50 text-teal-700 font-semibold"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="truncate">All {group.label}s</span>
            {!isSelected && (
              <FaCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-600 shrink-0 ml-1" />
            )}
          </button>
          {group.options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs sm:text-sm text-left transition ${
                  active
                    ? "bg-teal-50 text-teal-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {active && (
                  <FaCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-600 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    internshipType: null,
    internshipMode: null,
    classification: null,
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [, setApplicationCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState("Freemium");
  const [showSavedJobPopup, setShowSavedJobPopup] = useState(false);

  const [jobData, setJobData] = useState([]);
  const [page, setPage] = useState(1);
  const [, setHasMore] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Saves the <main> scrollTop before entering the detail view
  const savedScrollRef = useRef(0);
  const loadMoreRef = useRef(null);
  const loadingJobsRef = useRef(false);
  const hasMoreRef = useRef(true);

  const MAX_LIMITS = {
    Free: 5,
    Freemium: 5,
    "Premium Basic": 25,
    "Premium Plus": Infinity,
  };

  const { savedJobs, saveJob, removeJob, handleSelectTab } = useTabContext();

  // ── Filter helpers ────────────────────────────────────────────────────────
  const clearAllFilters = () =>
    setActiveFilters({
      internshipType: null,
      internshipMode: null,
      classification: null,
    });

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  // ── Plan helpers ──────────────────────────────────────────────────────────
  const getSavedLimitByPlan = (plan) => {
    switch (plan) {
      case "Premium Plus":
        return Infinity;
      case "Premium Basic":
        return 25;
      case "Freemium":
      default:
        return 3;
    }
  };

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchJobData = useCallback(async (pageNumber = 1, searchQuery = "") => {
    try {
      if (loadingJobsRef.current || (pageNumber !== 1 && !hasMoreRef.current))
        return;
      loadingJobsRef.current = true;
      setLoadingJobs(true);

      const response = await axios.get(
        `/api/interns/approved?page=${pageNumber}&limit=6&search=${encodeURIComponent(searchQuery)}`,
      );
      const { data, hasMore: more } = response.data;

      setJobData((prev) => (pageNumber === 1 ? data : [...prev, ...data]));
      hasMoreRef.current = more;
      setHasMore(more);
      setPage(pageNumber);
    } catch (error) {
      console.error("Error fetching internships:", error);
    } finally {
      loadingJobsRef.current = false;
      setLoadingJobs(false);
    }
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

    fetchUserProfile();
  }, []);

  useEffect(() => {
    fetchJobData(1, debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchJobData]);

  // ── Infinite scroll — only active when list is visible ───────────────────
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (
          firstEntry.isIntersecting &&
          hasMoreRef.current &&
          !loadingJobsRef.current
        ) {
          fetchJobData(page + 1, debouncedSearchTerm);
        }
      },
      { threshold: 0.8 },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchJobData, page, selectedJob, debouncedSearchTerm]);

  // ── Job actions ───────────────────────────────────────────────────────────
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
        // Save scroll position of <main> before switching to detail view
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
    // jobData is still in state — restore scroll after React repaints
    requestAnimationFrame(() => {
      const container = document.getElementById("main-scroll-container");
      if (container) container.scrollTop = savedScrollRef.current;
    });
  };

  const calculatePostedTime = (date) => {
    if (!date) return "—";
    const diff = Math.floor(
      (new Date() - new Date(date)) / (1000 * 60 * 60 * 24),
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
  };

  const isJobSaved = (jobId) =>
    savedJobs?.some(
      (savedJob) =>
        savedJob.jobId?._id === jobId ||
        savedJob.jobId === jobId ||
        savedJob._id === jobId,
    );

  const toggleSaveJob = async (job) => {
    try {
      const savedLimit = getSavedLimitByPlan(planType);
      if (
        !isJobSaved(job._id) &&
        savedJobs?.length >= savedLimit &&
        savedLimit !== Infinity
      ) {
        setShowSavedJobPopup(true);
        return;
      }
      if (isJobSaved(job._id)) {
        await removeJob(job._id);
      } else {
        await saveJob(job);
      }
    } catch (err) {
      console.error("Error toggling save job:", err);
    }
  };

  // ── Filtered jobs ─────────────────────────────────────────────────────────
  const filteredJobs = jobData.filter((job) => {
    const matchesSearch =
      job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job._id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTags = Object.entries(activeFilters).every(
      ([key, val]) => !val || job[key] === val,
    );

    return matchesSearch && matchesTags;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="font-poppins py-4">
      {selectedJob ? (
        // Detail view — list is unmounted so IntersectionObserver is disconnected
        <ApplyCards job={selectedJob} onBack={handleBack} />
      ) : (
        <>
          {/* Search bar + filter tags */}
          <div className="bg-white border-b p-3 sm:p-4 space-y-3">
            {/* Search Input Bar */}
            <div className="relative flex items-center w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <SearchIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search for internships and jobs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!m-0 !mt-0 !h-11 w-full !pl-10 !pr-10 text-xs sm:text-sm bg-gray-50/60 hover:bg-white focus:bg-white text-gray-800 placeholder-gray-400 !border border-gray-300 rounded-xl focus:!outline-none focus:!ring-2 focus:!ring-teal-500 focus:!border-teal-500 transition-all shadow-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                  aria-label="Clear search"
                >
                  <ClearIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>

            {/* Filter dropdowns */}
            <div className="flex items-center gap-2 sm:gap-3 pt-0.5 w-full">
              {FILTER_GROUPS.map((group) => (
                <FilterDropdown
                  key={group.key}
                  group={group}
                  value={activeFilters[group.key]}
                  onChange={(val) =>
                    setActiveFilters((prev) => ({
                      ...prev,
                      [group.key]: val,
                    }))
                  }
                />
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-teal-600 underline hover:text-teal-800"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Job cards */}
          <div className="py-2 lg:py-4">
            <section className="py-2 px-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Search Results
              </h2>
              <p className="text-gray-600 mb-4">
                Showing internships and jobs matching your query
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* {filteredJobs.length > 0 ? ( */}
                {/*comment the above condition add the below condition for correct loading effect while searching - 07-08-2026 */}
                {loadingJobs && filteredJobs.length === 0 ? (
                  <div className="col-span-full text-center py-10">
                    <p className="text-gray-500">Searching internships...</p>
                  </div>
                ) : filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <div
                      key={job._id}
                      className="border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-lg hover:border-purple-200 transition-all duration-200 bg-white flex flex-col gap-2.5 sm:gap-3 group"
                    >
                      {/* Top Row: Mode on Left + Type Badge & Save on Right */}
                      <div className="flex items-center justify-between w-full min-h-[28px]">
                        {job.internshipMode ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{job.internshipMode}</span>
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
                              isJobSaved(job._id)
                                ? "text-red-500"
                                : "text-gray-300 hover:text-red-400"
                            }`}
                            aria-label={
                              isJobSaved(job._id) ? "Unsave job" : "Save job"
                            }
                          >
                            <FaHeart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Company + title (2-line wrap) */}
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
                          <FaMapMarkerAlt className="mr-2 text-purple-500 flex-shrink-0 text-xs" />
                          <span className="truncate text-slate-700 font-medium">{job.location || "Location not specified"} {job.jobType ? `• ${job.jobType}` : ""}</span>
                        </p>
                        <p className="flex items-center">
                          <FaClock className="mr-2 text-purple-500 flex-shrink-0 text-xs" />
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
                          <FaDollarSign className="mr-2 text-purple-500 flex-shrink-0 text-xs" />
                          <span className="truncate font-semibold text-slate-800">
                            {job.internshipType === "STIPEND"
                              ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
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
                            job.qualifications
                              .slice(0, 2)
                              .map((qualification, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-purple-50 text-purple-700 font-medium py-0.5 px-2 rounded-lg border border-purple-100/80 truncate max-w-[110px] sm:max-w-[130px]"
                                  title={qualification}
                                >
                                  {qualification}
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
                          type="button"
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0"
                          onClick={() => handleViewDetails(job)}
                        >
                          <span>View details</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 col-span-full">
                    {/* Add style to this text - 07-08-2026*/}
                    <p className="text-gray-500">No jobs found</p>
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Load-more sentinel — inside list branch only, so observer stops when detail is shown */}
          <div
            ref={loadMoreRef}
            className="h-10 flex justify-center items-center"
          >
            {/* {loadingJobs && (
              <span className="text-gray-500 text-sm">
                Loading more internships…
              </span>
            )} */}
            {/*Add this for correct functionality while searching the internships - 07-08-2026 */}
            {loadingJobs && filteredJobs.length > 0 && hasMoreRef.current && (
              <span className="text-gray-500 text-sm">
                Loading more internships...
              </span>
            )}
          </div>
        </>
      )}

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

export default SearchBar;
