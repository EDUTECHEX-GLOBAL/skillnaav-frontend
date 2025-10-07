import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Modal from "react-modal";

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
  const [deletedInternships, setDeletedInternships] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatError, setChatError] = useState(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 10;

  // Sorting
  const [sortCriteria, setSortCriteria] = useState("jobTitle");
  const [sortDirection, setSortDirection] = useState("asc");

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-scroll chat
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [chatMessages]);

  // Auto-focus message input when modal opens
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

  // Approve internship
  const handleApprove = async (internId) => {
    try {
      await axios.patch(`/api/interns/${internId}/approve`, { status: "approved" });
      setInternships((prev) =>
        prev.map((i) => (i._id === internId ? { ...i, adminApproved: true } : i))
      );
    } catch (err) {
      console.error("Error approving internship:", err);
    }
  };

  // Reject internship
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
        prev.map((i) => (i._id === internshipToReject._id ? { ...i, adminApproved: false } : i))
      );
      setIsRejectModalOpen(false);
      setComment("");
    } catch (err) {
      console.error("Error rejecting internship:", err);
    }
  };

  // Review / Chat
  const handleReview = (internship) => {
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

  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedInternship) return;

      try {
        const response = await axios.get(`/api/chats/internship/${selectedInternship._id}`);
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          setChatMessages(data);
          setChatError(null);
        } else {
          setChatMessages([]);
          setChatError("No messages yet. Start the conversation to review this internship.");
        }
      } catch (err) {
        setChatMessages([]);
        setChatError("No messages yet. Start the conversation to review this internship.");
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [selectedInternship]);

  // Enhanced message sending with Enter key support
const handleSendMessage = async () => {
  if (!newMessage.trim() || !selectedInternship || sending) return;

  const messageText = newMessage.trim();
  setNewMessage("");
  setSending(true);

  // Optimistic UI update
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));
  
  if (!adminInfo?.id) {
    console.error("Admin ID not found");
    setSending(false);
    setNewMessage(messageText);
    return;
  }

  const optimisticMessage = {
    sender: adminInfo.id,
    message: messageText,
    timestamp: new Date(),
    _id: Date.now()
  };

  setChatMessages((prev) => [...prev, optimisticMessage]);
  setChatError(null);

  try {
    const messagePayload = {
      internshipId: selectedInternship._id,
      senderId: adminInfo.id,
      receiverId: selectedInternship.partnerId,
      message: messageText,
    };

    const response = await axios.post("/api/chats/send", messagePayload);

    // Replace optimistic message with server response
    setChatMessages((prev) => [
      ...prev.slice(0, -1),
      response.data
    ]);

    // Update internship review status using the correct endpoint
    try {
      await axios.post(`/api/interns/${selectedInternship._id}/review`);
      
      // Update local state to reflect the review status
      setSelectedInternship((prev) => ({ ...prev, isAdminReviewed: true, AdminReviewed: true }));
      setInternships((prev) => 
        prev.map((intern) => 
          intern._id === selectedInternship._id 
            ? { ...intern, isAdminReviewed: true, AdminReviewed: true }
            : intern
        )
      );
    } catch (reviewError) {
      console.error("Error marking internship as reviewed:", reviewError);
      // Continue without failing the message send
    }

  } catch (err) {
    console.error("Error sending message:", err.response?.data || err.message);
    // Remove optimistic message on error
    setChatMessages((prev) => prev.slice(0, -1));
    setNewMessage(messageText);
  } finally {
    setSending(false);
    messageInputRef.current?.focus();
  }
};

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // Enhanced Message Bubble Component
  const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
        isOwn 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
        <p className={`text-xs mt-2 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );

  // Delete internship
  const handleDeleteClick = (internship) => {
    setInternshipToDelete(internship);
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = async () => {
    if (!internshipToDelete) return;
    try {
      setDeletedInternships((prev) => [...prev, internshipToDelete]);
      await axios.delete(`/api/interns/${internshipToDelete._id}`);
      setInternships((prev) => prev.filter((i) => i._id !== internshipToDelete._id));
      setIsDeleteModalOpen(false);
    } catch (err) {
      setDeletedInternships((prev) => prev.filter((i) => i._id !== internshipToDelete._id));
      setInternships((prev) => [...prev, internshipToDelete]);
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

  // Sorting & Pagination
  const sortInternships = (list) =>
    list.sort((a, b) => {
      const aValue = a[sortCriteria]?.toLowerCase() || "";
      const bValue = b[sortCriteria]?.toLowerCase() || "";
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });

  const filteredInternships = internships.filter((i) => {
    const q = searchQuery.toLowerCase();
    return (
      i.jobTitle.toLowerCase().includes(q) ||
      i.companyName.toLowerCase().includes(q) ||
      (i.organization && i.organization.toLowerCase().includes(q))
    );
  });

  const indexOfLastInternship = currentPage * applicationsPerPage;
  const indexOfFirstInternship = indexOfLastInternship - applicationsPerPage;
  const currentInternships = sortInternships([...filteredInternships]).slice(
    indexOfFirstInternship,
    indexOfLastInternship
  );
  const totalPages = Math.ceil(filteredInternships.length / applicationsPerPage);

  return (
    <div className="p-6 rounded-lg shadow-md bg-gray-100 font-poppins text-sm">
      <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
        Admin Dashboard - Internship Management
      </h2>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Organization, Role, or Company"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded-md w-full focus:outline-none focus:ring focus:ring-indigo-400"
        />
      </div>

      {/* Sorting */}
      <div className="flex mb-4 space-x-4">
        <select
          value={sortCriteria}
          onChange={(e) => setSortCriteria(e.target.value)}
          className="p-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-400"
        >
          <option value="jobTitle">Sort by Job Title</option>
          <option value="companyName">Sort by Company</option>
        </select>
        <select
          value={sortDirection}
          onChange={(e) => setSortDirection(e.target.value)}
          className="p-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-400"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Internships Table */}
      <div className="mb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        <table className="min-w-full bg-white rounded-lg shadow-lg">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">S.No</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Job Title</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Company</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Location</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Stipend/Salary</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentInternships.map((internship, index) => (
              <tr key={internship._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2">{index + 1 + (currentPage - 1) * applicationsPerPage}</td>
                <td className="px-4 py-2">{internship.jobTitle}</td>
                <td className="px-4 py-2">{internship.companyName}</td>
                <td className="px-4 py-2">{internship.location}</td>
                <td className="px-4 py-2">
                  {internship.internshipType === "STIPEND"
                    ? `${internship.compensationDetails?.amount} ${internship.compensationDetails?.currency} per ${internship.compensationDetails?.frequency?.toLowerCase()}`
                    : internship.internshipType === "FREE"
                      ? "Free"
                      : internship.internshipType === "PAID"
                        ? `Student Pays: ${internship.compensationDetails?.amount} ${internship.compensationDetails?.currency}`
                        : "N/A"}
                </td>
                <td className="px-4 py-2 flex space-x-2">
                  <button
                    className={`px-3 py-1 rounded-md text-white ${internship.adminApproved ? "bg-green-500" : "bg-blue-500 hover:bg-blue-700"}`}
                    onClick={() => handleApprove(internship._id)}
                    disabled={internship.adminApproved}
                  >
                    {internship.adminApproved ? "Approved" : "Approve"}
                  </button>

                  <button
                    className={`px-3 py-1 rounded-md text-white ${internship.AdminReviewed ? "bg-green-500 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-700"}`}
                    onClick={() => !internship.AdminReviewed && handleReview(internship)}
                    disabled={internship.AdminReviewed}
                  >
                    {internship.AdminReviewed ? "Reviewed" : "Review"}
                  </button>

                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-700"
                    onClick={() => handleRejectClick(internship)}
                  >
                    Reject
                  </button>

                  <button
                    className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-700"
                    onClick={() => handleDeleteClick(internship)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <button
          className="bg-gray-300 text-gray-700 rounded-md px-4 py-2 disabled:opacity-50"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="bg-gray-300 text-gray-700 rounded-md px-4 py-2 disabled:opacity-50"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Modals */}
      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        overlayClassName="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]"
        className="bg-white p-6 rounded-lg shadow-lg w-96 z-[1000]"
      >
        <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
        {internshipToDelete && (
          <div>
            <p>
              Are you sure you want to delete the internship for <strong>{internshipToDelete.jobTitle}</strong> at <strong>{internshipToDelete.companyName}</strong>?
            </p>
            <div className="flex space-x-2 mt-4">
              <button onClick={confirmDelete} className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Delete</button>
              <button onClick={closeDeleteModal} className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onRequestClose={closeRejectModal}
        overlayClassName="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]"
        className="bg-white p-6 rounded-lg shadow-lg w-96 z-[1000]"
      >
        <h2 className="text-lg font-semibold mb-4">Reject Internship</h2>
        {internshipToReject && (
          <div>
            <p className="text-gray-700 mb-4">
              Are you sure you want to reject the internship for <strong>{internshipToReject.jobTitle}</strong> at <strong>{internshipToReject.companyName}</strong>?
            </p>
            <textarea
              placeholder="Optional rejection comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
              rows="4"
            />
            <div className="flex space-x-2">
              <button onClick={confirmReject} className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Confirm Reject</button>
              <button onClick={closeRejectModal} className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Enhanced Review / Chat Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        overlayClassName="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] z-[1000] overflow-hidden"
      >
        <div className="flex flex-col h-[80vh]">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Review Internship</h2>
                <p className="text-blue-100 text-sm mt-1">{selectedInternship?.jobTitle} at {selectedInternship?.companyName}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Enhanced Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-1">
            {chatError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Start the conversation</h3>
                  <p className="text-gray-500 text-sm">{chatError}</p>
                </div>
              </div>
            ) : (
              <>
                {chatMessages.map((msg, idx) => {
                  const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));
                  const isOwn = msg.sender === adminInfo?.id;
                  return (
                    <MessageBubble
                      key={msg._id || idx}
                      message={msg}
                      isOwn={isOwn}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Enhanced Message Input Area */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={messageInputRef}
                  placeholder="Type your review message..."
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyPress}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 min-h-[48px] max-h-[120px]"
                  rows={1}
                  disabled={sending}
                />
                <div className="absolute right-3 bottom-3">
                  <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className={`p-3 rounded-2xl transition-all duration-200 ${
                  newMessage.trim() && !sending
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {sending ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Enter to send • Shift + Enter for new line
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PartnerManagement;
