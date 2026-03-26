import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import Modal from "react-modal";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaCommentDots,
} from "react-icons/fa";
import { format } from "date-fns";

// Adjust this path to your actual default logo
 import Skillnaavlogo from "../../../../assets-webapp/Skillnaavlogo.png"; // ← Update if needed

Modal.setAppElement("#root");

const PartnerManagement = () => {
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [internshipToReject, setInternshipToReject] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [internshipToDelete, setInternshipToDelete] = useState(null);
  const [comment, setComment] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatError, setChatError] = useState(null);
  const [sending, setSending] = useState(false);
  const [selectedInternshipForDetails, setSelectedInternshipForDetails] =
    useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
const [internshipToApprove, setInternshipToApprove] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 10;

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-scroll chat
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [chatMessages]);

  // Auto-focus message input
  useEffect(() => {
    if (isModalOpen && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isModalOpen]);

  // Fetch internships
  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await axios.get("/api/interns");
        setInternships(response.data || []);
      } catch (err) {
        console.error("Error fetching internships:", err);
      }
    };
    fetchInternships();
  }, []);

  const calculatePostedTime = (date) => {
    const postedDate = new Date(date);
    const currentDate = new Date();
    const differenceInDays = Math.floor(
      (currentDate - postedDate) / (1000 * 60 * 60 * 24)
    );
    if (differenceInDays === 0) return "Today";
    if (differenceInDays === 1) return "Yesterday";
    return `${differenceInDays}d ago`;
  };

  const handleViewDetails = (internship) => {
    setSelectedInternshipForDetails(internship);
  };

  const closeDetailsView = () => {
    setSelectedInternshipForDetails(null);
  };

 const handleApproveClick = (internship) => {
  setInternshipToApprove(internship);
  setIsApproveModalOpen(true);
};

const confirmApprove = async () => {
  if (!internshipToApprove) return;
  try {
    await axios.patch(`/api/interns/${internshipToApprove._id}/approve`, {
      status: "approved",
    });
    setInternships((prev) =>
      prev.map((i) =>
        i._id === internshipToApprove._id ? { ...i, adminApproved: true } : i
      )
    );
    setIsApproveModalOpen(false);
    setInternshipToApprove(null);
  } catch (err) {
    console.error("Error approving internship:", err);
    alert("Failed to approve internship. Please try again.");
  }
};

const closeApproveModal = () => {
  setIsApproveModalOpen(false);
  setInternshipToApprove(null);
};
  // Reject
  const handleRejectClick = (internship) => {
    setInternshipToReject(internship);
    setIsRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!internshipToReject) return;
    try {
      await axios.patch(`/api/interns/${internshipToReject._id}/reject`, {
        status: "rejected",
        reason: comment,
      });
      setInternships((prev) =>
        prev.map((i) =>
          i._id === internshipToReject._id
            ? { ...i, adminApproved: false, rejectionReason: comment }
            : i
        )
      );
      setIsRejectModalOpen(false);
      setComment("");
    } catch (err) {
      console.error("Error rejecting internship:", err);
    }
  };

  // Chat
  const handleOpenChat = (internship) => {
    setSelectedInternship(internship);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInternship(null);
    setChatMessages([]);
    setNewMessage("");
    setChatError(null);
    setSending(false);
  };

  // Chat polling
  useEffect(() => {
    if (!isModalOpen || !selectedInternship) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `/api/chats/internship/${selectedInternship._id}`,
          { params: { t: Date.now() } }
        );
        const data = response.data;

        const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));
        const adminId = adminInfo?._id || adminInfo?.id;

        if (Array.isArray(data) && data.length > 0) {
          const wasAdminSender = data.some((msg) => msg.sender === adminId);

          if (wasAdminSender && !selectedInternship.adminReviewed) {
            setSelectedInternship((prev) => ({ ...prev, adminReviewed: true }));
            setInternships((prev) =>
              prev.map((i) =>
                i._id === selectedInternship._id
                  ? { ...i, adminReviewed: true }
                  : i
              )
            );
          }

          setChatMessages(data);
          setChatError(null);
        } else {
          setChatMessages([]);
          setChatError(
            "No messages yet. Start the conversation to review this internship."
          );
        }
      } catch (err) {
        setChatMessages([]);
        setChatError(
          "Failed to load chat history. Start the conversation to review this internship."
        );
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [selectedInternship, isModalOpen]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedInternship || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));
    if (!(adminInfo?._id || adminInfo?.id)) {
      console.error("Admin ID not found.");
      setNewMessage(messageText);
      setSending(false);
      return;
    }

    const adminId = adminInfo._id || adminInfo.id;

    const optimisticMessage = {
      sender: adminId,
      message: messageText,
      timestamp: new Date(),
      _id: Date.now(),
    };

    setChatMessages((prev) => [...prev, optimisticMessage]);
    setChatError(null);

    try {
      const payload = {
        internshipId: selectedInternship._id,
        senderId: adminId,
        partnerId: selectedInternship.partnerId,
        message: messageText,
      };

      const response = await axios.post("/api/chats/send", payload);

      setChatMessages((prev) => [...prev.slice(0, -1), response.data]);

      // Mark as reviewed after first message
      if (!selectedInternship.adminReviewed) {
        await axios.post(`/api/interns/${selectedInternship._id}/review`);
        setSelectedInternship((prev) => ({ ...prev, adminReviewed: true }));
        setInternships((prev) =>
          prev.map((i) =>
            i._id === selectedInternship._id ? { ...i, adminReviewed: true } : i
          )
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setChatMessages((prev) => prev.slice(0, -1));
      setNewMessage(messageText);
      setChatError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
      messageInputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex mb-4 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
          isOwn
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.message}
        </p>
        <p className={`text-xs mt-2 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );

  // Delete
  const handleDeleteClick = (internship) => {
    setInternshipToDelete(internship);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!internshipToDelete) return;
    try {
      await axios.delete(`/api/interns/${internshipToDelete._id}`);
      setInternships((prev) =>
        prev.filter((i) => i._id !== internshipToDelete._id)
      );
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting internship:", err);
      alert("Error deleting internship. Please try again later.");
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setInternshipToDelete(null);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setInternshipToReject(null);
    setComment("");
  };

  // Stats & Filtering with useMemo
  const { stats, filteredInternships } = useMemo(() => {
    const filtered = internships.filter((i) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        i.jobTitle?.toLowerCase().includes(q) ||
        i.companyName?.toLowerCase().includes(q) ||
        i.organization?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "APPROVED" && i.adminApproved === true) ||
        (statusFilter === "REJECTED" &&
          i.adminApproved === false &&
          i.rejectionReason) ||
        (statusFilter === "PENDING" &&
          !i.adminApproved &&
          !i.rejectionReason) ||
        (statusFilter === "REVIEWED" && i.adminReviewed);

      return matchesSearch && matchesStatus;
    });

    const stats = {
      total: internships.length,
      approved: internships.filter((i) => i.adminApproved === true).length,
      rejected: internships.filter(
        (i) => i.adminApproved === false && i.rejectionReason
      ).length,
      pending: internships.filter(
        (i) => !i.adminApproved && !i.rejectionReason
      ).length,
      reviewed: internships.filter((i) => i.adminReviewed).length,
    };

    return { stats, filteredInternships: filtered };
  }, [internships, searchQuery, statusFilter]);

  const indexOfLastInternship = currentPage * applicationsPerPage;
  const indexOfFirstInternship = indexOfLastInternship - applicationsPerPage;
  const currentInternships = filteredInternships.slice(
    indexOfFirstInternship,
    indexOfLastInternship
  );
  const totalPages = Math.ceil(filteredInternships.length / applicationsPerPage);

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
              src={internship.imgUrl}
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
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                <FaMapMarkerAlt className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Location</p>
                  <p className="text-xl font-bold text-gray-900">
                    {internship.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl">
                <FaClock className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-xl font-bold text-gray-900">
                    {format(new Date(internship.startDate), "dd MMM yyyy")} –{" "}
                    {format(
                      new Date(internship.endDateOrDuration),
                      "dd MMM yyyy"
                    )}
                  </p>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaDollarSign className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-xl p-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Compensation
                      </p>
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

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Skills Required
                </h3>
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
                    {internship.internshipMode === "ONLINE" ? "PC" : "Building"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mode</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">
                      {internship.internshipMode.toLowerCase()}
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

  return (
    <div className="p-6 rounded-lg shadow-md bg-gray-100 font-poppins text-sm">
      <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
        Admin Dashboard - Internship Management
      </h2>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          {
            key: "ALL",
            label: "Total",
            count: stats.total,
            color: "bg-gray-100 text-gray-800",
          },
          {
            key: "APPROVED",
            label: "Approved",
            count: stats.approved,
            color: "bg-green-100 text-green-800",
          },
          {
            key: "PENDING",
            label: "Pending",
            count: stats.pending,
            color: "bg-orange-100 text-orange-800",
          },
          {
            key: "REJECTED",
            label: "Rejected",
            count: stats.rejected,
            color: "bg-red-100 text-red-800",
          },
          {
            key: "REVIEWED",
            label: "Reviewed",
            count: stats.reviewed,
            color: "bg-purple-100 text-purple-800",
          },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setStatusFilter(item.key);
              setCurrentPage(1);
            }}
            className={`p-4 rounded-2xl shadow-sm border transition-all text-left ${item.color} ${
              statusFilter === item.key
                ? "ring-2 ring-offset-2 ring-indigo-500 scale-[1.02]"
                : "hover:shadow-md"
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
          placeholder="Search by Organization, Role, or Company"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {currentInternships.map((internship, index) => (
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
                aria-label="Open chat to review"
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
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {internship.companyName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {calculatePostedTime(internship.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FaMapMarkerAlt className="w-4 h-4" />
                <span className="truncate">{internship.location}</span>
                <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {internship.internshipMode === "ONLINE"
                    ? "PC Online"
                    : "Building Offline"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FaClock className="w-4 h-4" />
                <span>
                  {format(new Date(internship.startDate), "dd MMM")} –{" "}
                  {format(new Date(internship.endDateOrDuration), "dd MMM yyyy")}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-xl border border-yellow-200/50">
                <FaDollarSign className="w-4 h-4 text-yellow-600" />
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
                  <span
                    key={i}
                    className="text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full"
                  >
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
      aria-label="Approve internship"
    >
      {internship.adminApproved ? "Approved" : "Approve"}
    </button>

    <button
      className={`px-3 py-2.5 rounded-xl font-semibold text-white shadow-sm transition-all ${
        internship.adminReviewed
          ? "bg-green-600 hover:bg-green-700"
          : "bg-purple-500 hover:bg-purple-600 hover:shadow-md"
      }`}
      onClick={() => handleOpenChat(internship)}
      aria-label="Review via chat"
    >
      Review
    </button>

    <button
      className="px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex-1"
      onClick={() => handleRejectClick(internship)}
      aria-label="Reject internship"
    >
      Reject
    </button>

    <button
      className="px-3 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
      onClick={() => handleDeleteClick(internship)}
      aria-label="Delete internship"
    >
      Delete
    </button>
  </div>

  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm"
    onClick={() => handleViewDetails(internship)}
  >
    View Details
  </motion.button>
</div>
          </motion.div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedInternshipForDetails && (
        <InternshipDetails
          internship={selectedInternshipForDetails}
          onClose={closeDetailsView}
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
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* All Modals (Delete, Reject, Chat) */}
      {/* ... (unchanged from your original code – kept for completeness) */}
     {/* Delete Modal */}
<Modal
  isOpen={isDeleteModalOpen}
  onRequestClose={closeDeleteModal}
  overlayClassName="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999]"
  className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 outline-none font-poppins"
>
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
  {internshipToDelete && (
    <div>
      <p className="text-gray-700 mb-6 leading-relaxed">
        Are you sure you want to <span className="font-semibold text-red-600">permanently delete</span> the internship
        "<strong className="text-gray-900">{internshipToDelete.jobTitle}</strong>" at{" "}
        <strong className="text-gray-900">{internshipToDelete.companyName}</strong>?
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={confirmDelete}
          className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
        >
          Delete Internship
        </button>
        <button
          onClick={closeDeleteModal}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</Modal>

{/* Approve Confirmation Modal */}
<Modal
  isOpen={isApproveModalOpen}
  onRequestClose={closeApproveModal}
  overlayClassName="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999]"
  className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 outline-none font-poppins"
>
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Approve Internship</h2>
  {internshipToApprove && (
    <div>
      <p className="text-gray-700 mb-6 leading-relaxed">
        Are you sure you want to <span className="font-semibold text-green-600">approve</span> the internship
        "<strong className="text-gray-900">{internshipToApprove.jobTitle}</strong>" at{" "}
        <strong className="text-gray-900">{internshipToApprove.companyName}</strong>?
      </p>
      <div className="flex gap-3">
        <button
          onClick={confirmApprove}
          className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
        >
          Yes, Approve
        </button>
        <button
          onClick={closeApproveModal}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</Modal>

{/* Reject Modal */}
<Modal
  isOpen={isRejectModalOpen}
  onRequestClose={closeRejectModal}
  overlayClassName="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999]"
  className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 outline-none font-poppins"
>
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Reject Internship</h2>
  {internshipToReject && (
    <div>
      <p className="text-gray-700 mb-6 leading-relaxed">
        You're about to reject the internship "<strong className="text-gray-900">{internshipToReject.jobTitle}</strong>" at{" "}
        <strong className="text-gray-900">{internshipToReject.companyName}</strong>.
      </p>
      <textarea
        placeholder="Add a reason for rejection (optional but recommended)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-6 text-gray-800 placeholder-gray-500"
        rows="5"
      />
      <div className="flex gap-3">
        <button
          onClick={confirmReject}
          className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
        >
          Confirm Rejection
        </button>
        <button
          onClick={closeRejectModal}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</Modal>

{/* Enhanced Review / Chat Modal */}
<Modal
  isOpen={isModalOpen}
  onRequestClose={closeModal}
  overlayClassName="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999]"
  className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] z-[1000] overflow-hidden outline-none font-poppins"
>
  <div className="flex flex-col h-full max-h-[90vh]">
    {/* Header */}
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-t-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Internship</h2>
          <p className="text-blue-100 text-lg mt-1">
            {selectedInternship?.jobTitle} <span className="opacity-80">at</span> {selectedInternship?.companyName}
          </p>
        </div>
        <button
          onClick={closeModal}
          className="p-3 hover:bg-white/20 rounded-full transition-all"
          aria-label="Close chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    {/* Messages Area */}
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
      {chatError && chatMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <FaCommentDots className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">No messages yet</h3>
            <p className="text-gray-600 max-w-sm mx-auto">{chatError}</p>
          </div>
        </div>
      ) : (
        <>
          {chatMessages.map((msg, idx) => {
            const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));
            const isOwn = msg.sender === (adminInfo?._id || adminInfo?.id);
            return <MessageBubble key={msg._id || idx} message={msg} isOwn={isOwn} />;
          })}
          <div ref={messagesEndRef} />
        </>
      )}
      {chatError && chatMessages.length > 0 && (
        <div className="text-center text-red-600 text-sm bg-red-50 py-2 px-4 rounded-lg mt-4">
          {chatError}
        </div>
      )}
    </div>

    {/* Input Area */}
    <div className="bg-white border-t border-gray-200 p-8">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <textarea
            ref={messageInputRef}
            placeholder="Type your message to the partner..."
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            className="w-full px-5 py-4 pr-14 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all text-gray-800 placeholder-gray-500"
            rows={1}
            disabled={sending}
          />
          <div className="absolute right-10 bottom-10"> {/* Adjusted for padding */}
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>
        </div>
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          className={`p-4 rounded-2xl transition-all shadow-lg ${
            newMessage.trim() && !sending
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="Send message"
        >
          {sending ? (
            <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 mt-3">
        Press <kbd className="px-2 py-1 bg-gray-200 rounded">Enter</kbd> to send •{" "}
        <kbd className="px-2 py-1 bg-gray-200 rounded">Shift + Enter</kbd> for new line
      </p>
    </div>
  </div>
</Modal>
    </div>
  );
};

export default PartnerManagement;