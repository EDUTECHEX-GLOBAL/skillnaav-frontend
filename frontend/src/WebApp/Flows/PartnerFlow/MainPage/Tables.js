import React from "react";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import SendOfferLetter from "./OfferLetter";
import ScheduleForm from "./ScheduleForm";
import Modal from "./Modal";
import { checkOfferStatus, checkOfferStatuses, getOfferStatusText, getOfferStatusColor } from "./offerUtils";

export const ApplicationsTable = ({ applications, onStatusUpdate }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full table-auto font-poppins text-sm">
      <thead>
        <tr className="bg-gray-100 text-gray-600 uppercase text-xs leading-normal">
          <th className="px-6 py-3 text-left">Name</th>
          <th className="px-6 py-3 text-left">Email</th>
          <th className="px-6 py-3 text-left">Applied Date</th>
          <th className="px-6 py-3 text-left">Resume</th>
          <th className="px-6 py-3 text-left">Status</th>
          <th className="px-6 py-3 text-left">Update Status</th>
        </tr>
      </thead>
      <tbody className="text-gray-700">
        {applications.map((student) => (
          <tr key={student._id} className="border-b hover:bg-gray-50 transition">
            <td className="px-6 py-4">{student.userName}</td>
            <td className="px-6 py-4">{student.userEmail}</td>
            <td className="px-6 py-4">{new Date(student.appliedDate).toLocaleDateString()}</td>
            <td className="px-6 py-4">
              <a href={student.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                View Resume
              </a>
            </td>
            <td className="px-6 py-4">{student.status || "Pending"}</td>
            <td className="px-6 py-4">
              <select
                value={student.status || "Pending"}
                onChange={(e) => onStatusUpdate(student._id, e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

  </div>
);

ApplicationsTable.propTypes = {
  applications: PropTypes.array.isRequired,
  onStatusUpdate: PropTypes.func.isRequired,
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
      
      <div className="overflow-x-auto">
        <table className="min-w-full font-poppins text-sm bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Resume</th>
              <th className="px-6 py-3 text-left">Offer Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {uniqueCandidates.map((student) => {
              const status = offerStatuses[student.student_id] || 'Not Sent';
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
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-xs text-gray-500">Checking...</span>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOfferStatusColor(status)}`}>
                        {getOfferStatusText(status)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    {isLoading ? (
                      <span className="text-gray-500">Loading...</span>
                    ) : status === 'Not Sent' ? (
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
