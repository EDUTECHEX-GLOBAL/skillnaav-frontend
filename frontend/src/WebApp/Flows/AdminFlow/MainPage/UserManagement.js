import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  AiOutlineClose, 
  AiOutlineSearch, 
  AiOutlineDownload,
  AiOutlineCheck,
  AiOutlineCloseCircle,
  AiOutlineEye,
  AiOutlineMail,
  AiOutlineCalendar,
  AiOutlineBook,
  AiOutlineEnvironment,
  AiOutlineUser,
  AiOutlineTag,
  AiOutlineCamera
} from "react-icons/ai";
import { MdOutlineSchool, MdOutlineWork } from "react-icons/md";
import jsPDF from "jspdf";
import UserCard from "./UserCard";

const UserManagement = () => {
  // ————————————————————————
  // HOOKS
  // ————————————————————————
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUserCardOpen, setIsUserCardOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 9;

  // Calculate pagination data
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const idxLast = currentPage * usersPerPage;
  const idxFirst = idxLast - usersPerPage;
  const currentUsers = filteredUsers.slice(idxFirst, idxLast);

  // ————————————————————————
  // Token setup & validity check
  // ————————————————————————
  const raw = localStorage.getItem("adminToken");
  const isValidToken = raw && raw.split(".").length === 3;

  useEffect(() => {
    if (!isValidToken) return;

    axios.defaults.headers.common["Authorization"] = `Bearer ${raw}`;
    
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get("/api/users/users");
        console.log("Fetched users:", data);
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isValidToken, raw]);

  // Filter users based on search and status
  useEffect(() => {
    let result = users;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.universityName?.toLowerCase().includes(query) ||
        user.fieldOfStudy?.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter(user => {
        if (statusFilter === "pending") return !user.status || user.status === "Pending";
        if (statusFilter === "approved") return user.status === "Approved";
        if (statusFilter === "rejected") return user.status === "Rejected";
        return true;
      });
    }
    
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, users]);

  const handleApprove = (userId) => setConfirmAction({ type: "approve", userId });
  const handleReject = (userId) => setConfirmAction({ type: "reject", userId });

  const confirmActionHandler = async () => {
    const { type, userId } = confirmAction;
    setConfirmLoading(true);

    try {
      await axios.patch(
        `/api/users/${type}/${userId}`,
        { status: type === "approve" ? "Approved" : "Rejected" }
      );
      
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === userId
            ? { ...user, status: type === "approve" ? "Approved" : "Rejected" }
            : user
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setIsUserCardOpen(true);
  };

  const closeProfileModal = () => {
    setIsUserCardOpen(false);
    setSelectedUser(null);
  };

  const downloadPDF = (user) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("User Profile Details", 20, 20);
    doc.setFontSize(12);
    
    const fields = [
      ["Name", user.name],
      ["Email", user.email],
      ["Status", user.status || "Pending"],
      ["University", user.universityName],
      ["Date of Birth", user.dob],
      ["Educational Level", user.educationLevel],
      ["Field of Study", user.fieldOfStudy],
      ["Desired Field", user.desiredField],
      ["City", user.city],
      ["Country", user.country],
    ];
    
    let yPos = 40;
    fields.forEach(([label, value]) => {
      doc.text(`${label}: ${value || "N/A"}`, 20, yPos);
      yPos += 10;
    });
    
    doc.save(`${user.name}_Profile.pdf`);
  };

  const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage(p => Math.max(p - 1, 1));

  const getStatusColor = (status) => {
    switch(status) {
      case "Approved": return "bg-green-100 text-green-800 border-green-200";
      case "Rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "Approved": return <AiOutlineCheck className="text-green-600" size={14} />;
      case "Rejected": return <AiOutlineCloseCircle className="text-red-600" size={14} />;
      default: return <AiOutlineCalendar className="text-yellow-600" size={14} />;
    }
  };

  const getAvatarInitial = (name) => {
    if (!name) return "U";
    const names = name.trim().split(' ');
    if (names.length > 1) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name) => {
    if (!name) return "from-blue-500 to-purple-600";
    
    const colors = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600",
      "from-orange-500 to-red-600",
      "from-purple-500 to-pink-600",
      "from-teal-500 to-cyan-600",
      "from-pink-500 to-rose-600",
      "from-indigo-500 to-blue-600",
      "from-emerald-500 to-green-600",
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const hasProfileImage = (user) => {
    return user.profileImage && 
           user.profileImage.trim() !== "" && 
           user.profileImage !== "null" && 
           user.profileImage !== "undefined";
  };

  const getProfileImageUrl = (profileImage) => {
    if (!profileImage || profileImage.trim() === "") return null;
    
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      return profileImage;
    }
    
    if (profileImage.startsWith('/')) {
      return `${window.location.origin}${profileImage}`;
    }
    
    return `${window.location.origin}/uploads/${profileImage}`;
  };

  // Render loading state
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 font-poppins">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h2>
          <p className="text-gray-600 mb-6">Your admin session has expired or is invalid.</p>
          <a 
            href="/admin/login" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Log In Again
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 font-poppins">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AiOutlineUser className="text-2xl text-blue-600" />
          </div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 font-poppins">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 font-poppins">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Applications</h1>
            <p className="text-gray-600 mt-2">Review and manage student applications</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg shadow">
              Total: <span className="font-bold text-blue-600">{filteredUsers.length}</span> students
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <AiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or university..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <AiOutlineClose size={20} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center justify-end gap-2">
              <span className="text-gray-600 mr-2">View:</span>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${viewMode === "grid" ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} hover:bg-blue-50 transition`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${viewMode === "list" ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} hover:bg-blue-50 transition`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {users.filter(u => !u.status || u.status === "Pending").length}
                  </p>
                </div>
                <AiOutlineCalendar className="text-yellow-600 text-2xl" />
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Approved</p>
                  <p className="text-2xl font-bold text-green-900">
                    {users.filter(u => u.status === "Approved").length}
                  </p>
                </div>
                <AiOutlineCheck className="text-green-600 text-2xl" />
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">
                    {users.filter(u => u.status === "Rejected").length}
                  </p>
                </div>
                <AiOutlineCloseCircle className="text-red-600 text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* User Cards Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentUsers.map((user) => (
              <div 
                key={user._id} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-100"
              >
                {/* Card Header with Profile Image */}
                <div className="relative">
                  <div className="h-24 bg-gradient-to-r from-blue-50 to-indigo-50"></div>
                  
                  {/* Profile Image/Initial */}
                  <div className="absolute -bottom-8 left-6">
                    {hasProfileImage(user) ? (
                      <div className="relative">
                        <img
                          src={getProfileImageUrl(user.profileImage)}
                          alt={user.name}
                          className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover bg-gray-100"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br ${getAvatarColor(user.name)}">
                                  ${getAvatarInitial(user.name)}
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className={`w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br ${getAvatarColor(user.name)}`}>
                          {getAvatarInitial(user.name)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-gray-100 p-1 rounded-full border-2 border-white">
                          <AiOutlineCamera className="text-gray-400 text-xs" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                      {getStatusIcon(user.status)}
                      <span>{user.status || "Pending"}</span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="pt-12 px-6 pb-6">
                  {/* User Info */}
                  <div className="mb-6">
                    <h3 className="font-bold text-xl text-gray-900 mb-1 truncate">{user.name || "No Name"}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <AiOutlineMail size={14} />
                      <span className="text-sm truncate">{user.email || "No Email"}</span>
                    </div>

                    {user.universityName && (
                      <div className="flex items-center gap-2 text-gray-700 mb-2">
                        <MdOutlineSchool size={16} />
                        <span className="text-sm truncate">{user.universityName}</span>
                      </div>
                    )}

                    {user.fieldOfStudy && (
                      <div className="text-sm text-gray-600 truncate">
                        <span className="font-medium">Field:</span> {user.fieldOfStudy}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleViewProfile(user)}
                      className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <AiOutlineEye />
                      View Full Profile
                    </button>
                    
                    <div className="flex gap-2">
                      {/* Approve Button - Always visible for admin */}
                      <button
                        onClick={() => handleApprove(user._id)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                          user.status === "Approved" 
                            ? "bg-green-600 text-white cursor-default" 
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        <AiOutlineCheck size={14} />
                        {user.status === "Approved" ? "Approved" : "Approve"}
                      </button>
                      
                      {/* Reject Button - Always visible for admin */}
                      <button
                        onClick={() => handleReject(user._id)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                          user.status === "Rejected" 
                            ? "bg-red-600 text-white cursor-default" 
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        <AiOutlineCloseCircle size={14} />
                        {user.status === "Rejected" ? "Rejected" : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4 mb-8">
            {currentUsers.map((user) => (
              <div 
                key={user._id} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    {/* Profile Image/Initial */}
                    {hasProfileImage(user) ? (
                      <div className="relative">
                        <img
                          src={getProfileImageUrl(user.profileImage)}
                          alt={user.name}
                          className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover bg-gray-100"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br ${getAvatarColor(user.name)}">
                                  ${getAvatarInitial(user.name)}
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br ${getAvatarColor(user.name)}`}>
                          {getAvatarInitial(user.name)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-gray-100 p-1 rounded-full border-2 border-white">
                          <AiOutlineCamera className="text-gray-400 text-xs" />
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{user.name || "No Name"}</h3>
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                          {getStatusIcon(user.status)}
                          <span>{user.status || "Pending"}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <AiOutlineMail size={14} />
                          <span className="text-sm">{user.email || "No Email"}</span>
                        </div>
                        {user.universityName && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MdOutlineSchool size={14} />
                            <span className="text-sm">{user.universityName}</span>
                          </div>
                        )}
                        {user.fieldOfStudy && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <AiOutlineBook size={14} />
                            <span className="text-sm">{user.fieldOfStudy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleViewProfile(user)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 text-sm"
                    >
                      <AiOutlineEye />
                      View Profile
                    </button>
                    
                    <div className="flex gap-2">
                      {/* Approve Button */}
                      <button
                        onClick={() => handleApprove(user._id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                          user.status === "Approved" 
                            ? "bg-green-600 text-white cursor-default" 
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        <AiOutlineCheck size={12} />
                        {user.status === "Approved" ? "Approved" : "Approve"}
                      </button>
                      
                      {/* Reject Button */}
                      <button
                        onClick={() => handleReject(user._id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                          user.status === "Rejected" 
                            ? "bg-red-600 text-white cursor-default" 
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        <AiOutlineCloseCircle size={12} />
                        {user.status === "Rejected" ? "Rejected" : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > usersPerPage && (
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-6">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-gray-400 text-6xl mb-4">👤</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No users match "${searchQuery}"`
                : "No users match the selected filters"}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* UserCard Component Modal */}
     
{isUserCardOpen && selectedUser && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="relative w-full max-w-4xl">
      <UserCard user={selectedUser} onClose={closeProfileModal} />
      
      {/* Action Buttons inside UserCard modal */}
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={() => {
            handleApprove(selectedUser._id);
            closeProfileModal();
          }}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
            selectedUser.status === "Approved" 
              ? "bg-green-600 text-white cursor-default" 
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          <AiOutlineCheck />
          {selectedUser.status === "Approved" ? "Approved" : "Approve"}
        </button>
        
        <button
          onClick={() => {
            handleReject(selectedUser._id);
            closeProfileModal();
          }}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
            selectedUser.status === "Rejected" 
              ? "bg-red-600 text-white cursor-default" 
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
        >
          <AiOutlineCloseCircle />
          {selectedUser.status === "Rejected" ? "Rejected" : "Reject"}
        </button>
        
        <button
          onClick={() => downloadPDF(selectedUser)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
        >
          <AiOutlineDownload />
          Download PDF
        </button>
      </div>
    </div>
  </div>
)}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {confirmAction.type === "approve" ? (
                  <AiOutlineCheck className="text-green-600 text-3xl" />
                ) : (
                  <AiOutlineCloseCircle className="text-red-600 text-3xl" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {confirmAction.type === "approve" ? "Approve Application" : "Reject Application"}
              </h3>
              <p className="text-gray-600">
                Are you sure you want to {confirmAction.type} this user's application?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmActionHandler}
                disabled={confirmLoading}
                className={`flex-1 px-4 py-3 rounded-lg text-white font-medium transition ${
                  confirmAction.type === "approve" 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } ${confirmLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {confirmLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  `Yes, ${confirmAction.type}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;