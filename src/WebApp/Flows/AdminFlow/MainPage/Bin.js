import React, { useEffect, useState } from "react";
import axios from "../../../../api/axiosInstance";
import { FaTrashAlt, FaUndo } from 'react-icons/fa';

const BinManagement = () => {
  const [deletedInternships, setDeletedInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedInternship, setSelectedInternship] = useState(null);

  useEffect(() => {
    const fetchDeletedInternships = async () => {
      try {
        const response = await axios.get("/api/interns/bin");
        setDeletedInternships(response.data);
      } catch (error) {
        setError("");
      } finally {
        setLoading(false);
      }
    };

    fetchDeletedInternships();
  }, []);

  const handleRestore = async () => {
    try {
      await axios.patch(`api/interns/${selectedInternship._id}/restore`, { deleted: false });
      setDeletedInternships((prevInternships) =>
        prevInternships.filter((i) => i._id !== selectedInternship._id)
      );
      setShowModal(false);
    } catch (error) {
      setError("Failed to restore internship. Please try again.");
    }
  };

  const handlePermanentDelete = async () => {
    try {
      await axios.delete(`api/interns/${selectedInternship._id}/permanent`);
      setDeletedInternships((prevInternships) =>
        prevInternships.filter((i) => i._id !== selectedInternship._id)
      );
      setShowModal(false);
    } catch (error) {
      setError("Failed to permanently delete internship. Please try again.");
    }
  };

  const openModal = (type, internship) => {
    setModalType(type);
    setSelectedInternship(internship);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedInternship(null);
    setModalType(null);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const totalPages = Math.ceil(deletedInternships.length / PAGE_SIZE);
  const visibleInternships = deletedInternships.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 rounded-lg shadow-md bg-gray-100 font-poppins text-sm">
      <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">Bin - Deleted Internships</h2>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {deletedInternships.length === 0 && (
        <div className="text-center text-gray-500 mt-4">No deleted internships found in the bin.</div>
      )}

      <div className="overflow-x-auto"> {/* Scrollable for small screens */}
        <table className="min-w-full bg-white rounded-lg shadow-lg">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">S.No</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Job Title</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Company</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Location</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Stipend</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleInternships.map((internship, index) => (
              <tr key={internship._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                <td className="px-4 py-2">{internship.jobTitle}</td>
                <td className="px-4 py-2">{internship.companyName}</td>
                <td className="px-4 py-2">{internship.location}</td>
                <td className="px-4 py-2">{internship.stipend}</td>
                <td className="px-4 py-2 flex space-x-2">
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-700"
                    onClick={() => openModal("restore", internship)}
                  >
                    <FaUndo className="inline mr-2" /> Restore
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-700"
                    onClick={() => openModal("delete", internship)}
                  >
                    <FaTrashAlt className="inline mr-2" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center px-2 sm:px-4 py-6 bg-transparent">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-white p-1 sm:p-1.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50 max-w-full overflow-x-auto scrollbar-none">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50/50 shrink-0"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              <span className="hidden sm:inline">Previous</span>
            </button>

            {getPageNumbers().map((p, idx) =>
              p === "..." ? (
                <div
                  key={`ellipsis-${idx}`}
                  className="w-7 sm:w-10 h-9 sm:h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 text-xs sm:text-sm font-semibold select-none shrink-0"
                >
                  ...
                </div>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 sm:w-10 h-9 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                    currentPage === p
                      ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50/50 shrink-0"
            >
              <span className="hidden sm:inline">Next</span>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-96 z-[1000]"> {/* Modal width for small screens */}
            <h3 className="text-xl font-semibold mb-4">
              {modalType === "restore"
                ? "Restore Internship"
                : "Permanently Delete Internship"}
            </h3>
            <p className="mb-4">
              Are you sure you want to{" "}
              {modalType === "restore" ? "restore" : "permanently delete"}{" "}
              this internship?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 ${
                  modalType === "restore"
                    ? "bg-green-500 hover:bg-green-700"
                    : "bg-red-500 hover:bg-red-700"
                } text-white rounded-md`}
                onClick={
                  modalType === "restore" ? handleRestore : handlePermanentDelete
                }
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinManagement;
