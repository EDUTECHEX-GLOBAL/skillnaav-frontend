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

  const messagesEndRef = useRef(null);

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
  };

  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedInternship) return;

      try {
        const response = await axios.get(`/api/chats/${selectedInternship._id}`);
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          setChatMessages(data);
          setChatError(null);
        } else {
          setChatMessages([]);
          setChatError("No messages yet. Let’s review the internship.");
        }
      } catch (err) {
        setChatMessages([]);
        setChatError("No messages yet. Let’s review the internship.");
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [selectedInternship]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedInternship) return;

    try {
      const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));
      if (!adminInfo?.id) return console.error("Admin ID not found");

      const messagePayload = {
        internshipId: selectedInternship._id,
        senderId: adminInfo.id,
        receiverId: selectedInternship.partnerId,
        message: newMessage.trim(),
      };

      const response = await axios.post("/api/chats", messagePayload);

      setChatMessages((prev) => [
        ...prev,
        { sender: adminInfo.id, message: newMessage, timestamp: new Date() },
      ]);
      setNewMessage("");

      // Update internship review status
      await axios.patch(`/api/interns/${selectedInternship._id}/update`, {
        AdminReviewed: true,
      });
      setSelectedInternship((prev) => ({ ...prev, AdminReviewed: true }));
    } catch (err) {
      console.error("Error sending message:", err.response?.data || err.message);
    }
  };

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

      {/* Review / Chat Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        overlayClassName="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]"
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl z-[1000] overflow-hidden"
      >
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Review Internship - <span className="text-blue-600">{selectedInternship?.jobTitle}</span>
          </h2>

          {/* Chat Messages */}
          <div className="overflow-y-auto max-h-[300px] bg-gray-50 p-4 rounded-lg shadow-sm space-y-4">
            {chatError ? (
              <div className="text-center text-gray-500 text-sm">{chatError}</div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === JSON.parse(localStorage.getItem("adminInfo"))?.id ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-lg px-4 py-3 max-w-[70%] ${msg.sender === JSON.parse(localStorage.getItem("adminInfo"))?.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
            >
              Send
            </button>
          </div>

          {/* Close Button */}
          <div className="text-center mt-4">
            <button onClick={closeModal} className="text-sm text-blue-600 hover:underline">Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PartnerManagement;
