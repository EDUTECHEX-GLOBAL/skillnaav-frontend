import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  IconButton,
  InputAdornment,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import axios from "axios"; // Add axios import
import Card from "./Card";
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
  const [applicationCount, setApplicationCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
  // ✅ Add job data state here
  const [jobData, setJobData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  
  const isRestoringScroll = useRef(false);
  const loadMoreRef = useRef(null);

  const MAX_FREE_APPLICATIONS = 5;

  // ✅ Fetch user data on mount
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
    fetchJobData(1); // Initial fetch
  }, []);

  // ✅ Fetch job data function
  const fetchJobData = async (pageNumber = 1) => {
    try {
      if (loadingJobs || !hasMore) return;

      setLoadingJobs(true);

      const response = await axios.get(
        `/api/interns/approved?page=${pageNumber}&limit=6`
      );

      const { data, hasMore: more } = response.data;

      setJobData(prev =>
        pageNumber === 1 ? data : [...prev, ...data]
      );

      setHasMore(more);
      setPage(pageNumber);
    } catch (error) {
      console.error("Error fetching internships:", error);
    } finally {
      setLoadingJobs(false);
    }
  };

  // ✅ Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !loadingJobs) {
          fetchJobData(page + 1);
        }
      },
      { threshold: 0.8 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loadingJobs]);

  // ✅ Simplified handleViewDetails
  const handleViewDetails = async (job) => {
    // Save scroll position before navigating
    sessionStorage.setItem("scrollPosition", window.scrollY.toString());
    sessionStorage.setItem("scrollTime", Date.now().toString());
    
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo) return;

    setSelectedJob(job);
  };

  // ✅ Handle back from job details
  const handleBack = () => {
    setSelectedJob(null);
    isRestoringScroll.current = true;
  };

  // ✅ Restore scroll
  useEffect(() => {
    if (!selectedJob && isRestoringScroll.current) {
      const timer = setTimeout(() => {
        const savedPosition = sessionStorage.getItem("scrollPosition");
        const savedTime = sessionStorage.getItem("scrollTime");
        
        if (savedPosition && savedTime && (Date.now() - parseInt(savedTime)) < 10000) {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'instant'
          });
          
          sessionStorage.removeItem("scrollPosition");
          sessionStorage.removeItem("scrollTime");
        }
        
        isRestoringScroll.current = false;
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedJob]);

  // ✅ Show job details
  if (selectedJob) {
    return (
      <ApplyCards
        job={selectedJob}
        onBack={handleBack}
      />
    );
  }


  return (
    <div className="font-poppins">
      {/* Application Limit Popup */}
      {showLimitPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
            <h2 className="text-xl font-semibold text-gray-800">Application Limit Reached</h2>
            <p className="text-gray-600 mt-2">
              You have reached the maximum of {MAX_FREE_APPLICATIONS} free applications.
            </p>
            <p className="text-gray-600 mt-1">Upgrade your account to apply for more jobs.</p>

            {/* Buttons Container */}
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
                  // You might want to add a pricing modal here
                }}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔒 STICKY SEARCH BAR */}
      <div className="sticky top-0 z-20 bg-white border-b p-4">
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

        {appliedFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {appliedFilters.map((filter, index) => (
              <Chip
                key={index}
                label={filter}
                onDelete={() =>
                  setAppliedFilters((prev) =>
                    prev.filter((_, i) => i !== index)
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* 🔽 CARDS (WINDOW SCROLLS) */}
        <div className="p-4">
        <Card
          searchTerm={searchTerm}
          onViewDetails={handleViewDetails}
          jobData={jobData} // Pass job data as prop
        />
      </div>
       {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
        {loadingJobs && (
          <span className="text-gray-500 text-sm">Loading more internships…</span>
        )}
      </div>

      <FilterDialog
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(filters) => setAppliedFilters(filters)}
      />
    </div>
  );
};

export default SearchBar;