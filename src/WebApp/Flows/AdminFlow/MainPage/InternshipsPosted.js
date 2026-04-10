// ─── InternshipsPosted.jsx ────────────────────────────────────────────────────
// Admin view — lists all posted internships with approve / reject / delete /
// chat-review actions.
//
// Chat is fully extracted into <AdminChatModal />.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useMemo } from "react";
import axios from "../../../../api/axiosInstance";
import Modal from "react-modal";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaCommentDots,
} from "react-icons/fa";
import { format } from "date-fns";

import Skillnaavlogo from "../../../../assets-webapp/Skillnaavlogo.png";
import AdminChatModal from "./AdminChatModal"; // ← extracted chat component

Modal.setAppElement("#root");

// ─── Internship detail overlay ────────────────────────────────────────────────
const InternshipDetails = ({ internship, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[1000] overflow-y-auto"
  >
    <motion.div
      initial={{ scale: 0.9, y: 30 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 30 }}
      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-white/30"
    >
      {/* Header */}
      <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-2xl backdrop-blur-sm shadow-md transition-all"
            aria-label="Back to list"
          >
            ← Back to list
          </button>
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full ${
              internship.adminApproved
                ? "bg-emerald-100 text-emerald-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {internship.adminApproved ? "Approved" : "Pending"}
          </span>
        </div>
        <div className="mt-6 flex items-start gap-6">
          <img
            src={internship.imgUrl || Skillnaavlogo}
            alt={internship.companyName}
            className="w-20 h-20 rounded-2xl object-cover shadow-2xl ring-4 ring-white/50"
          />
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              {internship.jobTitle}
            </h1>
            <p className="text-2xl text-gray-700">{internship.companyName}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
              <FaMapMarkerAlt className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Location</p>
                <p className="text-xl font-bold text-gray-900">{internship.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl">
              <FaClock className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="text-xl font-bold text-gray-900">
                  {format(new Date(internship.startDate), "dd MMM yyyy")} –{" "}
                  {format(new Date(internship.endDateOrDuration), "dd MMM yyyy")}
                </p>
              </div>
            </div>

            <div className="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaDollarSign className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-xl p-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Compensation</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {internship.compensationDetails?.amount}{" "}
                      {internship.compensationDetails?.currency}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold px-3 py-1 bg-white/80 rounded-full">
                  {internship.internshipType}
                </span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {internship.qualifications?.map((skill, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                    internship.internshipMode === "ONLINE"
                      ? "bg-blue-500 text-white"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {internship.internshipMode === "ONLINE" ? "PC" : "🏢"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Mode</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {internship.internshipMode?.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {internship.jobDescription && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              About the Internship
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
              {internship.jobDescription}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const PartnerManagement = () => {
  const [internships, setInternships] = useState([]);

  // Chat modal
  const [chatInternship,   setChatInternship]   = useState(null);
  const [isChatOpen,       setIsChatOpen]       = useState(false);

  // Detail overlay
  const [detailInternship, setDetailInternship] = useState(null);

  // Approve modal
  const [isApproveModalOpen,  setIsApproveModalOpen]  = useState(false);
  const [internshipToApprove, setInternshipToApprove] = useState(null);

  // Reject modal
  const [isRejectModalOpen,  setIsRejectModalOpen]  = useState(false);
  const [internshipToReject, setInternshipToReject] = useState(null);
  const [rejectComment,      setRejectComment]      = useState("");

  // Delete modal
  const [isDeleteModalOpen,  setIsDeleteModalOpen]  = useState(false);
  const [internshipToDelete, setInternshipToDelete] = useState(null);

  // Filters
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [currentPage,   setCurrentPage]   = useState(1);
  const ITEMS_PER_PAGE = 10;

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/interns");
        setInternships(res.data || []);
      } catch (err) {
        console.error("fetchInternships:", err);
      }
    };
    load();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const calculatePostedTime = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 86_400_000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
  };

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApproveClick = (internship) => {
    setInternshipToApprove(internship);
    setIsApproveModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!internshipToApprove) return;
    try {
      await axios.patch(`/api/interns/${internshipToApprove._id}/approve`, { status: "approved" });
      setInternships((prev) =>
        prev.map((i) => (i._id === internshipToApprove._id ? { ...i, adminApproved: true } : i))
      );
      setIsApproveModalOpen(false);
      setInternshipToApprove(null);
    } catch (err) {
      console.error("confirmApprove:", err);
      alert("Failed to approve. Please try again.");
    }
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleRejectClick = (internship) => {
    setInternshipToReject(internship);
    setIsRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!internshipToReject) return;
    try {
      await axios.patch(`/api/interns/${internshipToReject._id}/reject`, {
        status: "rejected",
        reason: rejectComment,
      });
      setInternships((prev) =>
        prev.map((i) =>
          i._id === internshipToReject._id
            ? { ...i, adminApproved: false, rejectionReason: rejectComment }
            : i
        )
      );
      setIsRejectModalOpen(false);
      setRejectComment("");
    } catch (err) {
      console.error("confirmReject:", err);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = (internship) => {
    setInternshipToDelete(internship);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!internshipToDelete) return;
    try {
      await axios.delete(`/api/interns/${internshipToDelete._id}`);
      setInternships((prev) => prev.filter((i) => i._id !== internshipToDelete._id));
      setIsDeleteModalOpen(false);
      setInternshipToDelete(null);
    } catch (err) {
      console.error("confirmDelete:", err);
      alert("Error deleting internship. Please try again.");
    }
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const handleOpenChat = (internship) => {
    setChatInternship(internship);
    setIsChatOpen(true);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
    setChatInternship(null);
  };

  // Called by AdminChatModal after first admin message → update adminReviewed flag
  const handleReviewedUpdate = (internshipId) => {
    setInternships((prev) =>
      prev.map((i) => (i._id === internshipId ? { ...i, adminReviewed: true } : i))
    );
    // If the chat modal's internship object is still in state, refresh it too
    setChatInternship((prev) =>
      prev?._id === internshipId ? { ...prev, adminReviewed: true } : prev
    );
  };

  // ── Stats & filter ────────────────────────────────────────────────────────
  const { stats, filteredInternships } = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = internships.filter((i) => {
      const matchesSearch =
        i.jobTitle?.toLowerCase().includes(q) ||
        i.companyName?.toLowerCase().includes(q) ||
        i.organization?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "APPROVED" && i.adminApproved === true) ||
        (statusFilter === "REJECTED" && i.adminApproved === false && i.rejectionReason) ||
        (statusFilter === "PENDING"  && !i.adminApproved && !i.rejectionReason) ||
        (statusFilter === "REVIEWED" && i.adminReviewed);

      return matchesSearch && matchesStatus;
    });

    const stats = {
      total:    internships.length,
      approved: internships.filter((i) => i.adminApproved === true).length,
      rejected: internships.filter((i) => i.adminApproved === false && i.rejectionReason).length,
      pending:  internships.filter((i) => !i.adminApproved && !i.rejectionReason).length,
      reviewed: internships.filter((i) => i.adminReviewed).length,
    };

    return { stats, filteredInternships: filtered };
  }, [internships, searchQuery, statusFilter]);

  const totalPages       = Math.ceil(filteredInternships.length / ITEMS_PER_PAGE);
  const currentItems     = filteredInternships.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 rounded-lg shadow-md bg-gray-100 font-poppins text-sm">
      <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
        Admin Dashboard — Internship Management
      </h2>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { key: "ALL",      label: "Total",    count: stats.total,    color: "bg-gray-100 text-gray-800"   },
          { key: "APPROVED", label: "Approved", count: stats.approved, color: "bg-green-100 text-green-800"  },
          { key: "PENDING",  label: "Pending",  count: stats.pending,  color: "bg-orange-100 text-orange-800"},
          { key: "REJECTED", label: "Rejected", count: stats.rejected, color: "bg-red-100 text-red-800"     },
          { key: "REVIEWED", label: "Reviewed", count: stats.reviewed, color: "bg-purple-100 text-purple-800"},
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => { setStatusFilter(item.key); setCurrentPage(1); }}
            className={`p-4 rounded-2xl shadow-sm border transition-all text-left ${item.color} ${
              statusFilter === item.key ? "ring-2 ring-offset-2 ring-indigo-500 scale-[1.02]" : "hover:shadow-md"
            }`}
          >
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{item.count}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by organisation, role, or company…"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {currentItems.map((internship, index) => (
          <motion.div
            key={internship._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-gray-200/50 hover:border-purple-300/70 transition-all duration-300 overflow-hidden relative"
            whileHover={{ scale: 1.02 }}
          >
            {/* Badges */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-sm ${
                  internship.internshipType === "PAID"
                    ? "bg-red-100 text-red-700"
                    : internship.internshipType === "STIPEND"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {internship.internshipType}
              </span>
              <button
                onClick={() => handleOpenChat(internship)}
                aria-label="Open chat"
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all group-hover:scale-110 ${
                  internship.adminReviewed
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500 hover:bg-purple-500 hover:text-white"
                }`}
              >
                <FaCommentDots />
              </button>
            </div>

            {/* Header */}
            <div className="p-5 pt-12 border-b border-gray-100">
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={internship.imgUrl || Skillnaavlogo}
                  alt={internship.companyName}
                  className="w-12 h-12 rounded-full object-cover shadow-lg ring-2 ring-white/50"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-purple-700">
                    {internship.jobTitle}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-1">{internship.companyName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {calculatePostedTime(internship.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FaMapMarkerAlt className="w-4 h-4 shrink-0" />
                <span className="truncate">{internship.location}</span>
                <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full shrink-0">
                  {internship.internshipMode === "ONLINE" ? "Online" : "Offline"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FaClock className="w-4 h-4 shrink-0" />
                <span>
                  {format(new Date(internship.startDate), "dd MMM")} –{" "}
                  {format(new Date(internship.endDateOrDuration), "dd MMM yyyy")}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-xl border border-yellow-200/50">
                <FaDollarSign className="w-4 h-4 text-yellow-600 shrink-0" />
                <span className="truncate flex-1">
                  {internship.internshipType === "STIPEND"
                    ? `${internship.compensationDetails?.amount} ${internship.compensationDetails?.currency}/mo`
                    : internship.internshipType === "PAID"
                    ? `Student Pays: ${internship.compensationDetails?.amount}`
                    : "Free"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {internship.qualifications?.slice(0, 2).map((skill, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
                {internship.qualifications?.length > 2 && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                    +{internship.qualifications.length - 2}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 pt-3 bg-gradient-to-t from-gray-50 to-transparent">
              <div className="flex flex-wrap gap-1.5 text-xs mb-2">
                <button
                  className={`flex-1 py-2 px-3 rounded-xl font-semibold text-white shadow-sm transition-all ${
                    internship.adminApproved
                      ? "bg-green-500 cursor-default opacity-90"
                      : "bg-emerald-500 hover:bg-emerald-600 hover:shadow-md"
                  }`}
                  onClick={() => handleApproveClick(internship)}
                  disabled={internship.adminApproved}
                >
                  {internship.adminApproved ? "Approved ✓" : "Approve"}
                </button>

                <button
                  className={`px-3 py-2.5 rounded-xl font-semibold text-white shadow-sm transition-all ${
                    internship.adminReviewed
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-purple-500 hover:bg-purple-600 hover:shadow-md"
                  }`}
                  onClick={() => handleOpenChat(internship)}
                >
                  {internship.adminReviewed ? "Chat ✓" : "Review"}
                </button>

                <button
                  className="px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex-1"
                  onClick={() => handleRejectClick(internship)}
                >
                  Reject
                </button>

                <button
                  className="px-3 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
                  onClick={() => handleDeleteClick(internship)}
                >
                  Delete
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm"
                onClick={() => setDetailInternship(internship)}
              >
                View Details
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail overlay */}
      {detailInternship && (
        <InternshipDetails
          internship={detailInternship}
          onClose={() => setDetailInternship(null)}
        />
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-8">
        <button
          className="bg-gray-300 text-gray-700 rounded-md px-6 py-2 disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="text-gray-700 font-medium">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          className="bg-gray-300 text-gray-700 rounded-md px-6 py-2 disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* Delete */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => { setIsDeleteModalOpen(false); setInternshipToDelete(null); }}
        overlayClassName="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999]"
        className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 outline-none font-poppins"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
        {internshipToDelete && (
          <div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Are you sure you want to{" "}
              <span className="font-semibold text-red-600">permanently delete</span> the
              internship "<strong>{internshipToDelete.jobTitle}</strong>" at{" "}
              <strong>{internshipToDelete.companyName}</strong>?
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md"
              >
                Delete Internship
              </button>
              <button
                onClick={() => { setIsDeleteModalOpen(false); setInternshipToDelete(null); }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approve */}
      <Modal
        isOpen={isApproveModalOpen}
        onRequestClose={() => { setIsApproveModalOpen(false); setInternshipToApprove(null); }}
        overlayClassName="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999]"
        className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 outline-none font-poppins"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Approve Internship</h2>
        {internshipToApprove && (
          <div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Are you sure you want to{" "}
              <span className="font-semibold text-green-600">approve</span> the internship "
              <strong>{internshipToApprove.jobTitle}</strong>" at{" "}
              <strong>{internshipToApprove.companyName}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmApprove}
                className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md"
              >
                Yes, Approve
              </button>
              <button
                onClick={() => { setIsApproveModalOpen(false); setInternshipToApprove(null); }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject */}
      <Modal
        isOpen={isRejectModalOpen}
        onRequestClose={() => { setIsRejectModalOpen(false); setInternshipToReject(null); setRejectComment(""); }}
        overlayClassName="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999]"
        className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 outline-none font-poppins"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reject Internship</h2>
        {internshipToReject && (
          <div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              You're about to reject "<strong>{internshipToReject.jobTitle}</strong>" at{" "}
              <strong>{internshipToReject.companyName}</strong>.
            </p>
            <textarea
              placeholder="Reason for rejection (optional but recommended)…"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-6 text-gray-800 placeholder-gray-500"
              rows="5"
            />
            <div className="flex gap-3">
              <button
                onClick={confirmReject}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => { setIsRejectModalOpen(false); setInternshipToReject(null); setRejectComment(""); }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Chat Modal (fully extracted) ────────────────────────────────────── */}
      <AdminChatModal
        isOpen={isChatOpen}
        internship={chatInternship}
        onClose={handleChatClose}
        onReviewedUpdate={handleReviewedUpdate}
      />
    </div>
  );
};

export default PartnerManagement;