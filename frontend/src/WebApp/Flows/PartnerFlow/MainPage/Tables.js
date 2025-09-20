import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "./Modal";
import SendOfferLetter from "./OfferLetter";
import BulkSendOffer from "./BulkSendOffer"; // ensure this file exists
import {
  checkOfferStatuses,
  getOfferStatusText,
  getOfferStatusColor,
} from "./offerUtils";

// --- Applications UI helpers ---
const formatAppDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const getApplicationStatusText = (status) => {
  const s = (status || "").trim().toLowerCase();
  if (s === "shortlisted") return "Shortlisted";
  if (s === "approved" || s === "selected") return "Approved";
  if (s === "rejected" || s === "declined") return "Rejected";
  if (s === "pending" || !s) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
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

// ApplicationsTable
export const ApplicationsTable = ({ applications }) => (
  <div className="h-[80vh] overflow-auto -mr-6 pr-6 bg-white">
    <table className="min-w-full font-poppins text-sm bg-white">
      <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-20">
        <tr>
          <th className="px-6 py-3 text-center">Name</th>
          <th className="px-6 py-3 text-center">Email</th>
          <th className="px-6 py-3 text-center">Applied Date</th>
          <th className="px-6 py-3 text-center">Resume</th>
          <th className="px-6 py-3 text-center">Status</th>
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
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${statusCls}`}
                >
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

// ShortlistedTable
export const ShortlistedTable = ({ candidates, internshipId }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [offerStatuses, setOfferStatuses] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState({});
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const uniqueCandidates = candidates.filter(
    (student, index, self) =>
      index === self.findIndex((s) => s.email === student.email)
  );

  useEffect(() => {
    async function fetchStatuses() {
      if (!candidates.length) return;
      setIsLoadingAll(true);
      try {
        const studentIds = candidates
          .filter((s) => s.student_id)
          .map((s) => s.student_id);
        if (!studentIds.length) {
          setIsLoadingAll(false);
          return;
        }
        const loadingMap = {};
        studentIds.forEach((id) => {
          loadingMap[id] = true;
        });
        setLoadingStatuses(loadingMap);

        const statusMap = await checkOfferStatuses(studentIds, internshipId);
        setOfferStatuses(statusMap);
        setLoadingStatuses({});
      } finally {
        setIsLoadingAll(false);
      }
    }
    fetchStatuses();
  }, [candidates, internshipId]);

  // Bulk selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(
        uniqueCandidates
          .filter((s) => offerStatuses[s.student_id] !== "Sent")
          .map((s) => s.student_id)
      );
    } else {
      setSelectedStudents([]);
    }
  };

  const toggleStudentSelect = (id) => {
    if (offerStatuses[id] === "Sent") return; // don't allow reselect
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((sid) => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  // Single offer modal handlers
  const handleSendOfferClick = (student) => {
    if (offerStatuses[student.student_id] === "Sent") return;
    setSelectedStudent(student);
    setShowOfferModal(true);
  };

  const handleOfferSuccess = () => {
    if (selectedStudent?.student_id) {
      setOfferStatuses((prev) => ({
        ...prev,
        [selectedStudent.student_id]: "Sent",
      }));
    }
    setShowOfferModal(false);
    setSelectedStudent(null);
  };

  const handleCloseOfferModal = () => {
    setShowOfferModal(false);
    setSelectedStudent(null);
  };

  // Bulk offer modal handlers
  const handleBulkOfferSuccess = (sentStudents) => {
    setShowBulkModal(false);
    setSelectedStudents([]);
    setOfferStatuses((prev) => {
      const updated = { ...prev };
      sentStudents.forEach((student) => {
        if (student?.student_id) {
          updated[student.student_id] = "Sent";
        }
      });
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {isLoadingAll && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading offer statuses...</span>
        </div>
      )}

      {/* Bulk send button */}
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        disabled={selectedStudents.length === 0}
        onClick={() => setShowBulkModal(true)}
      >
        Send Offer Letter to Selected ({selectedStudents.length})
      </button>

      <div className="h-[80vh] overflow-auto -mr-6 pr-6 bg-white">
        <table className="min-w-full font-poppins text-sm bg-white">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-20">
            <tr>
              <th className="px-6 py-3 text-center">
                <input
                  type="checkbox"
                  checked={
                    selectedStudents.length > 0 &&
                    selectedStudents.length ===
                      uniqueCandidates.filter(
                        (s) => offerStatuses[s.student_id] !== "Sent"
                      ).length
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-center">Name</th>
              <th className="px-6 py-3 text-center">Email</th>
              <th className="px-6 py-3 text-center">Resume</th>
              <th className="px-6 py-3 text-center">Offer Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-center">
            {uniqueCandidates.map((student) => {
              const status = offerStatuses[student.student_id] || "Not Sent";
              const isLoading = loadingStatuses[student.student_id];

              return (
                <tr key={student.student_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.student_id)}
                      disabled={status === "Sent"}
                      onChange={() => toggleStudentSelect(student.student_id)}
                    />
                  </td>
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

      {/* Single send modal */}
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
              resumeUrl: selectedStudent.resumeUrl,
            }}
            internshipId={internshipId}
            onSuccess={handleOfferSuccess}
            onCancel={handleCloseOfferModal}
          />
        </Modal>
      )}

      {/* Bulk send modal */}
      {showBulkModal && (
        <Modal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          title={`Send Offers to ${selectedStudents.length} Students`}
        >
          <BulkSendOffer
            selectedStudents={selectedStudents.map((id) =>
              uniqueCandidates.find((student) => student.student_id === id)
            )}
            internshipId={internshipId}
            onCancel={() => setShowBulkModal(false)}
            onSuccess={handleBulkOfferSuccess}
          />
        </Modal>
      )}
    </div>
  );
};

ShortlistedTable.propTypes = {
  candidates: PropTypes.array.isRequired,
  internshipId: PropTypes.string.isRequired,
};

export default ShortlistedTable;
