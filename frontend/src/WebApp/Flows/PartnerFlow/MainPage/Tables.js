import React from "react";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import SendOfferLetter from "./OfferLetter";
import Modal from "./Modal";
import { checkOfferStatus, checkOfferStatuses, getOfferStatusText, getOfferStatusColor } from "./offerUtils";

// --- Applications UI helpers (chips + date) ---
const formatAppDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`; // e.g., 17/07/2025
};

const getApplicationStatusText = (status) => {
  const s = (status || "").trim().toLowerCase();
  if (s === "shortlisted") return "Shortlisted";
  if (s === "approved" || s === "selected") return "Approved";
  if (s === "rejected" || s === "declined") return "Rejected";
  if (s === "pending" || !s) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1); // fallback
};

const getApplicationStatusColor = (status) => {
  switch ((status || "").trim().toLowerCase()) {
    case "shortlisted":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
    case "selected":
      return "bg-green-100 text-green-800";
    case "rejected":
    case "declined":
      return "bg-red-100 text-red-800";
    case "pending":
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Tables.js — REPLACE THIS WHOLE BLOCK

export const ApplicationsTable = ({ applications }) => (
  <div className="h-[80vh] overflow-auto -mr-6 pr-6 bg-white">
    <table className="min-w-full font-poppins text-sm bg-white">
      <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-20">
        <tr>
          <th className="px-6 py-3 text-center bg-gray-100">Name</th>
          <th className="px-6 py-3 text-center bg-gray-100">Email</th>
          <th className="px-6 py-3 text-center bg-gray-100">Applied Date</th>
          <th className="px-6 py-3 text-center bg-gray-100">Resume</th>
          <th className="px-6 py-3 text-center bg-gray-100">Status</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200 text-center">
        {applications.map((student) => {
          const statusText = getApplicationStatusText(student.status);
          const statusCls = getApplicationStatusColor(student.status);

          return (
            <tr key={student._id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4">{student.userName || "N/A"}</td>
              <td className="px-6 py-4">{student.userEmail || "N/A"}</td>
              <td className="px-6 py-4">{formatAppDate(student.appliedDate)}</td>
              <td className="px-6 py-4">
                {student.resumeUrl ? (
                  <a
                    href={student.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Resume
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCls}`}>
                  {statusText}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

ApplicationsTable.propTypes = {
  applications: PropTypes.array.isRequired,
};

export const ShortlistedTable = ({ candidates, internshipId, onSendOffer }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [offerStatuses, setOfferStatuses] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState({});
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false); // ✅ Loading state for all

  // Fetch offer status for ALL candidates in one call
  useEffect(() => {
    const fetchOfferStatuses = async () => {
      if (!candidates.length) return;

      setIsLoadingAll(true);

      try {
        // Get all valid student IDs
        const studentIds = candidates
          .filter(student => student.student_id)
          .map(student => student.student_id);

        if (studentIds.length === 0) {
          setIsLoadingAll(false);
          return;
        }

        // Set loading state for all students
        const loadingStates = {};
        studentIds.forEach(id => {
          loadingStates[id] = true;
        });
        setLoadingStatuses(loadingStates);

        // Make single batch API call
        const statusMap = await checkOfferStatuses(studentIds, internshipId);

        setOfferStatuses(statusMap);

        // Clear loading states
        setLoadingStatuses({});

      } catch (error) {
        console.error('Error fetching offer statuses:', error);
        // Fallback: try individual calls if batch fails
        await fetchIndividualStatuses();
      } finally {
        setIsLoadingAll(false);
      }
    };

    // Fallback function for individual calls
    const fetchIndividualStatuses = async () => {
      const statuses = {};
      const loading = {};

      for (const student of candidates) {
        if (student.student_id) {
          loading[student.student_id] = true;
          setLoadingStatuses(prev => ({ ...prev, [student.student_id]: true }));

          statuses[student.student_id] = await checkOfferStatus(student.student_id, internshipId);

          loading[student.student_id] = false;
          setLoadingStatuses(prev => ({ ...prev, [student.student_id]: false }));

          // Update statuses incrementally for better UX
          setOfferStatuses(prev => ({
            ...prev,
            [student.student_id]: statuses[student.student_id]
          }));
        }
      }
    };

    fetchOfferStatuses();
  }, [candidates, internshipId]);

  const handleSendOfferClick = (student) => {
    setSelectedStudent(student);
    setShowOfferModal(true);
  };

  const handleOfferSuccess = () => {
    if (selectedStudent && selectedStudent.student_id) {
      setOfferStatuses(prev => ({
        ...prev,
        [selectedStudent.student_id]: 'Sent'
      }));
    }
    handleCloseOfferModal();
  };

  const handleCloseOfferModal = () => {
    setShowOfferModal(false);
    setSelectedStudent(null);
  };

  const uniqueCandidates = candidates.filter(
    (student, index, self) =>
      index === self.findIndex((s) => s.email === student.email)
  );

  return (
    <div className="space-y-4">
      {/* Loading indicator for all statuses */}
      {isLoadingAll && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading offer statuses...</span>
        </div>
      )}

      <div className="h-[80vh] overflow-auto -mr-6 pr-6 bg-white">
        <table className="min-w-full font-poppins text-sm bg-white">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-20">
            <tr>
              <th className="px-6 py-3 text-center bg-gray-100">Name</th>
              <th className="px-6 py-3 text-center bg-gray-100">Email</th>
              <th className="px-6 py-3 text-center bg-gray-100">Resume</th>
              <th className="px-6 py-3 text-center bg-gray-100">Offer Status</th>
              <th className="px-6 py-3 text-center bg-gray-100">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-center">
            {uniqueCandidates.map((student) => {
              const status = offerStatuses[student.student_id] || "Not Sent";
              const isLoading = loadingStatuses[student.student_id];

              return (
                <tr key={student.student_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">{student.name || "N/A"}</td>
                  <td className="px-6 py-4">{student.email || "N/A"}</td>
                  <td className="px-6 py-4">
                    <a
                      href={student.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Resume
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    {isLoading ? (
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-xs text-gray-500">Checking...</span>
                      </div>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getOfferStatusColor(
                          status
                        )}`}
                      >
                        {getOfferStatusText(status)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    {isLoading ? (
                      <span className="text-gray-500">Loading...</span>
                    ) : status === "Not Sent" ? (
                      <button
                        onClick={() => handleSendOfferClick(student)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Send Offer
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {getOfferStatusText(status)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Offer Letter Modal */}
      {showOfferModal && selectedStudent && (
        <Modal
          isOpen={showOfferModal}
          onClose={handleCloseOfferModal}
          title="Send Offer Letter"
        >
          <SendOfferLetter
            student={{
              _id: selectedStudent.student_id,
              name: selectedStudent.name,
              email: selectedStudent.email,
              resumeUrl: selectedStudent.resumeUrl
            }}
            internshipId={internshipId}
            onSuccess={handleOfferSuccess}
            onCancel={handleCloseOfferModal}
          />
        </Modal>
      )}
    </div>
  );
};

ShortlistedTable.propTypes = {
  candidates: PropTypes.array.isRequired,
  internshipId: PropTypes.string.isRequired,
  onSendOffer: PropTypes.func,
};
export default ShortlistedTable;