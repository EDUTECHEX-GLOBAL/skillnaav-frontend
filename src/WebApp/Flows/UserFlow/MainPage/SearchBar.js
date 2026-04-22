import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TextField,
  IconButton,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import axios from "../../../../api/axiosInstance";
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaHeart } from "react-icons/fa";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { format } from "date-fns";
import ApplyCards from "./ApplyCards";

const FilterDialog = ({ open, onClose, onApply }) => {
  const [filters, setFilters] = useState([]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleChange = (event) => {
    setFilters(event.target.value.split(",").map((filter) => filter.trim()));
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Apply Filters</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Filters (comma separated)"
          type="text"
          fullWidth
          variant="standard"
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleApply} color="primary">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [, setApplicationCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState("Freemium");
  const [showSavedJobPopup, setShowSavedJobPopup] = useState(false);

  const [jobData, setJobData] = useState([]);
  const [page, setPage] = useState(1);
  const [, setHasMore] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const isRestoringScroll = useRef(false);
  const loadMoreRef = useRef(null);
  const loadingJobsRef = useRef(false);
  const hasMoreRef = useRef(true);

  const MAX_FREE_APPLICATIONS = 5;

  const { savedJobs, saveJob, removeJob, handleSelectTab } = useTabContext();

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

  const fetchJobData = useCallback(async (pageNumber = 1) => {
    try {
      if (loadingJobsRef.current || (pageNumber !== 1 && !hasMoreRef.current)) {
        return;
      }

      loadingJobsRef.current = true;
      setLoadingJobs(true);

      const response = await axios.get(
        `/api/interns/approved?page=${pageNumber}&limit=6`
      );

      const { data, hasMore: more } = response.data;

      setJobData(prev =>
        pageNumber === 1 ? data : [...prev, ...data]
      );

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
        if (!token) {
          console.error("No token found in localStorage");
          return;
        }

        const { data } = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setIsPremium(data.isPremium);
        setPlanType(data.planType || "Freemium");

        const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {};
        if (userInfo._id) {
          const { data: countData } = await axios.get(
            `/api/applications/count/${userInfo._id}`
          );
          setApplicationCount(countData.count);
        }
      } catch (error) {
        console.error("Error fetching user profile or application count:", error);
      }
    };

    fetchUserProfile();
    fetchJobData(1);
  }, [fetchJobData]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMoreRef.current && !loadingJobsRef.current) {
          fetchJobData(page + 1);
        }
      },
      { threshold: 0.8 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [fetchJobData, page]);

  const handleViewDetails = async (job) => {
    try {
      sessionStorage.setItem("scrollPosition", window.scrollY.toString());
      sessionStorage.setItem("scrollTime", Date.now().toString());

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo) return;

      const { data: countData } = await axios.get(`/api/applications/count/${userInfo._id}`);
      setApplicationCount(countData.count);

      if (!isPremium && countData.count >= MAX_FREE_APPLICATIONS) {
        setShowLimitPopup(true);
      } else {
        setSelectedJob(job);
      }
    } catch (error) {
      console.error("Error fetching updated application count:", error);
    }
  };

  const handleBack = () => {
    setSelectedJob(null);
    isRestoringScroll.current = true;
  };

  useEffect(() => {
    if (!selectedJob && isRestoringScroll.current) {
      const timer = setTimeout(() => {
        const savedPosition = sessionStorage.getItem("scrollPosition");
        const savedTime = sessionStorage.getItem("scrollTime");

        if (savedPosition && savedTime && (Date.now() - parseInt(savedTime)) < 10000) {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: "instant"
          });

          sessionStorage.removeItem("scrollPosition");
          sessionStorage.removeItem("scrollTime");
        }

        isRestoringScroll.current = false;
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedJob]);

  const calculatePostedTime = (date) => {
    if (!date) return "—";
    const diff = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
  };

  const isJobSaved = (jobId) =>
    savedJobs?.some(
      (savedJob) =>
        savedJob.jobId?._id === jobId ||
        savedJob.jobId === jobId ||
        savedJob._id === jobId
    );

  const toggleSaveJob = async (job) => {
    try {
      const savedLimit = getSavedLimitByPlan(planType);

      if (!isJobSaved(job._id) && savedJobs?.length >= savedLimit && savedLimit !== Infinity) {
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

  const filteredJobs = jobData.filter((job) => {
    const matchesSearch =
      job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters =
      appliedFilters.length === 0 ||
      appliedFilters.some((filter) =>
        `${job.jobTitle} ${job.companyName} ${job.location} ${job.jobType} ${job.internshipType}`
          .toLowerCase()
          .includes(filter.toLowerCase())
      );

    return matchesSearch && matchesFilters;
  });

  if (selectedJob) {
    return (
      <ApplyCards
        job={selectedJob}
        onBack={handleBack}
      />
    );
  }

  return (
   <div className="font-poppins px-4 py-4">
      {/* Sticky Search Bar */}
     {/* Search Bar */}
<div className="bg-white border-b p-4">
  <div className="flex items-center gap-2">
    <TextField
      fullWidth
      placeholder="Search for internships and jobs"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: searchTerm && (
          <InputAdornment position="end">
            <IconButton onClick={() => setSearchTerm("")}>
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />

    <Button
      variant="contained"
      startIcon={<FilterListIcon />}
      onClick={() => setIsFilterOpen(true)}
    >
      Filter
    </Button>
  </div>
</div>

      {/* Cards */}
      <div className="p-4">
        <section className="py-2 px-0">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Search Results</h2>
          <p className="text-gray-600 mb-4">
            Showing internships and jobs matching your query
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job, index) => (
                <div key={index} className="relative border rounded-lg p-6 shadow-sm">
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    {job.internshipType && (
                      <span
                        className={`px-3 py-1 text-xs md:text-sm font-semibold uppercase rounded-full
                          ${
                            job.internshipType === "FREE"
                              ? "bg-green-100 text-green-700"
                              : job.internshipType === "STIPEND"
                              ? "bg-blue-100 text-blue-700"
                              : job.internshipType === "PAID"
                              ? "bg-red-100 text-red-700"
                              : ""
                          }`}
                      >
                        {job.internshipType}
                      </span>
                    )}

                    <button
                      onClick={() => toggleSaveJob(job)}
                      className={`transition ${
                        isJobSaved(job._id)
                          ? "text-red-500"
                          : "text-gray-500 hover:text-red-500"
                      }`}
                      aria-label={isJobSaved(job._id) ? "Unsave job" : "Save job"}
                    >
                      <FaHeart />
                    </button>
                  </div>

                  <div className="flex items-center mb-4">
                    <img
                      src={job.imgUrl}
                      alt={`${job.companyName} logo`}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                      width="48"
                      height="48"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/favicon-512x469.png";
                      }}
                    />
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold">{job.jobTitle}</h3>
                      <p className="text-gray-600">
                        {job.companyName} • {calculatePostedTime(job.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-gray-600 mb-4">
                    <p className="flex items-center text-sm md:text-base">
                      <FaMapMarkerAlt className="mr-2" /> {job.location} {job.jobType}
                    </p>
                    <p className="flex items-center mt-2 text-sm md:text-base">
                      <FaClock className="mr-2" />
                      {job.startDate ? format(new Date(job.startDate), "dd MMM yyyy") : "—"} –{" "}
                      {job.endDateOrDuration
                        ? format(new Date(job.endDateOrDuration), "dd MMM yyyy")
                        : "—"}
                    </p>
                    <div className="flex items-center gap-2 text-gray-600 text-sm md:text-base leading-none mt-2">
                      <FaDollarSign className="text-gray-600 w-4 h-4 flex-shrink-0" />
                      <span className="leading-none">
                        {job.internshipType === "STIPEND"
                          ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                          : job.internshipType === "FREE"
                          ? "Unpaid / Free"
                          : job.internshipType === "PAID"
                          ? `Student Pays: ${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                          : "N/A"}
                      </span>
                    </div>

                    <p className="flex items-center mt-2 text-sm md:text-base">
                      <span className="font-medium text-gray-600">
                        {job.internshipMode === "ONLINE"
                          ? "Online"
                          : job.internshipMode === "OFFLINE"
                          ? "Offline"
                          : "Hybrid"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {job.qualifications &&
                        job.qualifications.slice(0, 2).map((qualification, i) => (
                          <span
                            key={i}
                            className="text-sm md:text-base bg-gray-200 text-gray-800 py-1 px-3 rounded-full"
                          >
                            {qualification}
                          </span>
                        ))}
                      {job.qualifications && job.qualifications.length > 2 && (
                        <span className="text-sm md:text-base bg-gray-100 text-gray-700 py-1 px-3 rounded-full">
                          +{job.qualifications.length - 2}
                        </span>
                      )}
                    </div>

                    <button
                      className="text-purple-600 hover:underline text-sm md:text-base"
                      onClick={() => handleViewDetails(job)}
                    >
                      View details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">No jobs found</p>
            )}
          </div>
        </section>
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
        {loadingJobs && (
          <span className="text-gray-500 text-sm">Loading more internships…</span>
        )}
      </div>

      {/* Application Limit Popup */}
      {showLimitPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Application Limit Reached
            </h2>
            <p className="text-gray-600 mt-2">
              You have reached the maximum of {MAX_FREE_APPLICATIONS} free applications.
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

      {/* Saved Jobs Limit Popup */}
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

      <FilterDialog
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(filters) => setAppliedFilters(filters)}
      />
    </div>
  );
};

export default SearchBar;
