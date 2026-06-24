// File: SavedJobsPage.js
// Shows all internships saved by students belonging to this school admin.

import React, { useState, useEffect, useCallback } from "react";
import axios from "../../../../../api/axiosInstance";
import {
  FaBookmark,
  FaTimes,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaDollarSign,
  FaLaptopHouse,
  FaUserGraduate,
  FaChevronLeft,
  FaChevronRight,
  FaHeart
} from "react-icons/fa";
import { AiOutlineStar, AiOutlineLike, AiOutlineDislike } from 'react-icons/ai';

const AI_API = "/api/ai";

/* ─────────────────── HELPERS ─────────────────── */
const formatPostedDate = (dateStr) => {
  if (!dateStr) return "";
  const daysAgo = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "1d ago";
  return `${daysAgo}d ago`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/* ─────────────────── SKELETON ─────────────────── */
const SkeletonCard = () => (
  <div className="bg-white shadow-sm rounded-2xl p-5 animate-pulse border border-gray-100">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="w-14 h-5 bg-gray-100 rounded-full" />
    </div>
    <div className="space-y-2 mb-4">
      {[70, 55, 45, 40].map((w, i) => (
        <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
      ))}
    </div>
    <div className="flex gap-2 mb-4">
      {[60, 80, 50].map((w, i) => (
        <div key={i} className="h-6 bg-gray-100 rounded-full" style={{ width: `${w}px` }} />
      ))}
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="h-8 bg-gray-100 rounded-lg" />
      ))}
    </div>
  </div>
);

/* ──────────────────── EMPTY STATE ──────────────────── */
const EmptyState = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
      <FaBookmark className="text-green-300 text-2xl" />
    </div>
    <h3 className="text-lg font-semibold text-gray-700 mb-1">
      No saved jobs yet
    </h3>
    <p className="text-sm text-gray-400">
      Your students haven't saved any internships yet.
    </p>
  </div>
);


const MiniStat = ({ icon, label, bg, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${bg} cursor-pointer hover:opacity-80 transition text-xs font-medium w-full`}
  >
    {icon}
    <span>{label}</span>
  </button>
);


const StatusModal = ({ status, students, loading, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Students - <span className="text-green-600">{status}</span>
          </h2>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''} found</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow text-gray-500 hover:text-red-500 hover:shadow-md transition"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
            <p className="text-sm text-gray-400">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-gray-500 font-medium">No students in this category</p>
            <p className="text-sm text-gray-400">Nobody has been marked as {status} yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-green-50 sticky top-0 z-10">
              <tr>
                {['Name', 'Email', 'Applied Date', 'Resume', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600 border-b border-green-100">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-50">
                  <td className="px-5 py-3 font-medium">{s.userName}</td>
                  <td className="px-5 py-3 text-gray-500">{s.userEmail}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {s.appliedDate ? new Date(s.appliedDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-5 py-3">
                    {s.resumeUrl ? (
                      <a href={s.resumeUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-500 hover:underline font-medium">
                        View Resume
                      </a>
                    ) : <span className="text-gray-400">N/A</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                      s.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                      s.status === 'Shortlisted' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
);

/* ─────────────────── PAGINATION ─────────────────── */
const PAGE_SIZE = 9;

const Pagination = ({ page, totalPages, onPageChange, loading }) => {
  if (totalPages <= 1) return null;
  const delta = 2;
  const pages = [];
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }
  return (
    <div className="col-span-full flex items-center justify-center gap-2 pt-4 pb-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1 || loading}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <FaChevronLeft className="text-xs" />
      </button>

      {pages[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="w-9 h-9 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition">1</button>
          {pages[0] > 2 && <span className="text-gray-400 text-sm px-1">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          disabled={loading}
          className={`w-9 h-9 rounded-lg border text-sm font-medium transition disabled:cursor-not-allowed ${
            p === page
              ? "bg-green-600 border-green-600 text-white shadow-sm"
              : "border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600"
          }`}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-gray-400 text-sm px-1">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="w-9 h-9 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || loading}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <FaChevronRight className="text-xs" />
      </button>
    </div>
  );
};

/* ─────────────────── MAIN COMPONENT ─────────────────── */
const SavedJobsPage = () => {
  const [allSaved, setAllSaved]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [page, setPage]                   = useState(1);

  // Modal
  const [modalStatus, setModalStatus] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetchingApplications, setIsFetchingApplications] = useState(false);

  /* Fetch once on mount */
  const fetchSavedJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        localStorage.getItem("schoolAdminToken") ||
        localStorage.getItem("userToken");
      const { data } = await axios.get("/api/school-admin/saved-jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllSaved(data.savedJobs || []);
    } catch (err) {
      setError("Failed to load saved jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedJobs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Pagination */
  const totalPages = Math.ceil(allSaved.length / PAGE_SIZE) || 1;
  const paginated  = allSaved.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isJobSaved = (jobId) =>
    allSaved.some((savedJob) => savedJob.isAdminSaved && (savedJob.jobId?._id === jobId || savedJob.jobId === jobId));

  const toggleSaveJob = async (job) => {
    try {
      const schoolAdminId = localStorage.getItem('schoolAdminId') || localStorage.getItem('adminId');
      const token = localStorage.getItem('schoolAdminToken') || localStorage.getItem('token');
      if (!schoolAdminId || !token) return;

      if (isJobSaved(job._id)) {
        await axios.delete(`/api/school-admin/saved-jobs/remove/${schoolAdminId}/${job._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSavedJobs();
      } else {
        await axios.post("/api/school-admin/saved-jobs/save", 
          { schoolAdminId, jobId: job._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchSavedJobs();
      }
    } catch (err) {
      console.error("Error toggling save job:", err);
    }
  };

  const openModal = async (status, internshipId) => {
    const token =
      localStorage.getItem('schoolAdminToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('adminToken');

    const schoolAdminId =
      localStorage.getItem('schoolAdminId') ||
      localStorage.getItem('adminId');

    if (!token) { alert('Session expired. Please log in again.'); return; }
    if (!internshipId || !schoolAdminId) { alert('Missing required data. Please login again.'); return; }

    setIsOpen(true);
    setModalStatus(status);
    setApplications([]);
    setIsFetchingApplications(true);

    try {
      let response;

      if (status === 'Shortlisted') {
        response = await axios.get(
          `${AI_API}/partner/shortlisted/by-admin?internship_id=${internshipId}&school_admin_id=${schoolAdminId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setApplications((response.data.shortlisted_candidates || []).map(c => ({
          userName: c.name || 'N/A', userEmail: c.email || 'N/A',
          appliedDate: c.appliedDate || '', resumeUrl: c.resumeUrl || '', status: 'Shortlisted',
        })));
      } else if (status === 'Accepted' || status === 'Rejected') {
        response = await axios.get(`/api/offer-letters/internship/${internshipId}?schoolAdminId=${schoolAdminId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplications(response.data.offers.filter(o => o.status === status).map(o => ({
          userName: o.name, userEmail: o.email, appliedDate: o.sentDate, resumeUrl: o.s3Url, status: o.status,
        })));
      } else {
        response = await axios.get(`/api/applications/internship/${internshipId}?schoolAdmin=${schoolAdminId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplications(response.data.applications);
      }
    } catch (err) {
      setApplications([]);
    } finally {
      setIsFetchingApplications(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalStatus(null);
    setApplications([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      {/* -- Header -- */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-5 mt-2">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-sm">
              <FaBookmark className="text-white text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
            {!loading && (
              <span className="ml-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                {allSaved.length} saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* -- Grid -- */}
      <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Loading skeletons */}
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {/* Error state */}
        {error && !loading && (
          <div className="col-span-full text-center py-12">
            <p className="text-red-500 font-medium mb-3">{error}</p>
            <button
              onClick={fetchSavedJobs}
              className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && allSaved.length === 0 && (
          <EmptyState />
        )}

        {/* Cards */}
        {!loading && !error && paginated.map((entry) => {
          const job     = entry.jobId;
          const student = entry.userId;
          if (!job) return null;
          return (
            <div key={entry._id} className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5 relative border border-gray-100 flex flex-col">
              {/* Type badge */}
              <span className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full ${
                job.internshipType === 'STIPEND'
                  ? 'bg-blue-100 text-blue-700'
                  : job.internshipType === 'PAID'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {job.internshipType || 'FREE'}
              </span>

              {/* Header */}
              <div className="flex items-start gap-3">
                <img
                  src={job.imgUrl || 'https://dummyimage.com/40x40/cccccc/000000&text=No+Image'}
                  alt="logo"
                  className="w-10 h-10 object-contain rounded-full border border-gray-100 shrink-0"
                />
                <div className="min-w-0 pr-14">
                  <h3 className="text-base font-semibold text-gray-800 truncate">{job.jobTitle}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    {job.companyName}
                    <span className="text-gray-300">·</span>
                    <span>{formatPostedDate(job.createdAt)}</span>
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="text-sm text-gray-600 mt-4 space-y-1.5">
                {job.location && (
                  <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-gray-400 shrink-0" /><span className="truncate">{job.location}</span></div>
                )}
                {(job.startDate || job.endDateOrDuration) && (
                  <div className="flex items-center gap-2"><FaCalendarAlt className="text-gray-400 shrink-0" /><span>{formatDate(job.startDate)} – {formatDate(job.endDateOrDuration)}</span></div>
                )}
                {job.pay && (
                  <div className="flex items-center gap-2"><FaDollarSign className="text-gray-400 shrink-0" /><span>{job.pay}</span></div>
                )}
                {job.internshipType && (
                  <div className="flex items-center gap-2"><FaLaptopHouse className="text-gray-400 shrink-0" /><span>{job.internshipType}</span></div>
                )}
              </div>

              {/* Skills */}
              {job.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 5).map((skill, i) => (
                    <span key={i} className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs rounded-full font-medium">{skill}</span>
                  ))}
                  {job.skills.length > 5 && (
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{job.skills.length - 5}</span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 flex justify-between items-center">
                <button className="text-green-600 text-sm font-medium hover:text-green-700 hover:underline transition">View details</button>
                <button
                  onClick={() => toggleSaveJob(job)}
                  className={`transition text-lg ${isJobSaved(job._id) ? "text-pink-500" : "text-gray-300 hover:text-pink-400"}`}
                  aria-label={isJobSaved(job._id) ? "Unsave job" : "Save job"}
                >
                  <FaHeart />
                </button>
              </div>

              {/* Status actions */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-medium">
                <MiniStat icon={<FaLaptopHouse className="text-orange-400" />}   label="Applied"     bg="bg-orange-50 text-orange-700"   onClick={() => openModal('Applied',     job._id)} />
                <MiniStat icon={<AiOutlineStar className="text-green-500" />}    label="Shortlisted" bg="bg-green-50 text-green-700"    onClick={() => openModal('Shortlisted', job._id)} />
                <MiniStat icon={<AiOutlineLike className="text-pink-500" />}     label="Accepted"    bg="bg-pink-50 text-pink-700"      onClick={() => openModal('Accepted',    job._id)} />
                <MiniStat icon={<AiOutlineDislike className="text-indigo-400" />} label="Rejected"   bg="bg-indigo-50 text-indigo-700"  onClick={() => openModal('Rejected',    job._id)} />
              </div>

              {/* Student who saved it */}
              <div className="mt-3 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex items-center gap-2">
                <FaUserGraduate className="text-green-400 shrink-0 text-sm" />
                <span className="truncate">Saved by: {(student && (student.name || student.email)) ? (student.name || student.email) : "You (Admin)"}</span>
                <span className="ml-auto shrink-0 text-gray-400">{formatDate(entry.createdAt)}</span>
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {!loading && !error && allSaved.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            loading={loading}
          />
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <StatusModal
          status={modalStatus}
          loading={isFetchingApplications}
          students={applications}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default SavedJobsPage;