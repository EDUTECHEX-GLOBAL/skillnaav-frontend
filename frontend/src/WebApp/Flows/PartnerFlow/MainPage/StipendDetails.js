import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Modal from "react-modal";
import { ClipLoader } from "react-spinners";
import { CSVLink } from "react-csv";

Modal.setAppElement("#root");

const formatDateRange = (start, end) => {
  if (!start) return "";
  const startDate = new Date(start);
  let endDate;
  if (end && !isNaN(Date.parse(end))) {
    endDate = new Date(end);
  }
  const startString = startDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const endString = endDate
    ? endDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : end || "";
  return `${startString} – ${endString}`;
};

const StipendDetails = () => {
  const [internships, setInternships] = useState([]);
  const [stipends, setStipends] = useState([]);
const [loading, setLoading] = useState(false);
  const [loadingStipends, setLoadingStipends] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [selectedInternship, setSelectedInternship] = useState(null);

  const [stipendSearch, setStipendSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const stipendPerPage = 10;

  const partnerId = localStorage.getItem("partnerId");

  useEffect(() => {
   const fetchInternships = async () => {
    if (!partnerId) return;

    setLoading(true);
    try {
      const response = await axios.get(`/api/interns/partner/${partnerId}`);

      // ✅ FIX: extract array correctly
      setInternships(response.data.data || []);
    } catch (err) {
      console.error("Error fetching internships:", err);
      setInternships([]); // safety fallback
    } finally {
      setLoading(false);
    }
  };
    fetchInternships();
  }, [partnerId]);

  const handleShowStipendDetails = async (internship) => {
    setSelectedInternship(internship);
    setLoadingStipends(true);
    setModalIsOpen(true);
    setError(null);
    setStipendSearch("");
    setCurrentPage(1);
    try {
      const res = await axios.get(
        `/api/internship/stipend-details/internship/${internship._id?.$oid || internship._id}`
      );
      setStipends(res.data.stipendDetails || []);
    } catch (err) {
      setError("Failed to fetch stipend details: " + err.message);
      setStipends([]);
    } finally {
      setLoadingStipends(false);
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setStipends([]);
    setError(null);
    setSelectedInternship(null);
  };

  const filteredStipends = useMemo(() => {
    if (!stipendSearch.trim()) return stipends;
    const lower = stipendSearch.toLowerCase();
    return stipends.filter(
      (s) =>
        (s.bankAccountName?.toLowerCase().includes(lower) ||
          s.bankAccountNumber?.toLowerCase().includes(lower) ||
          s.ifscOrSwift?.toLowerCase().includes(lower) ||
          s.preferredCurrency?.toLowerCase().includes(lower) ||
          (s.notes?.toLowerCase().includes(lower) ?? false))
    );
  }, [stipends, stipendSearch]);

  const totalPages = Math.ceil(filteredStipends.length / stipendPerPage);
  const paginatedStipends = filteredStipends.slice(
    (currentPage - 1) * stipendPerPage,
    currentPage * stipendPerPage
  );

  if (loading)
    return (
      <div className="flex justify-center items-center p-10">
        <ClipLoader size={50} color="#14b8a6" />
        <span className="ml-3 text-teal-600 font-semibold text-lg">
          Loading internships...
        </span>
      </div>
    );

  if (error)
    return (
      <div className="text-red-600 p-4 font-semibold bg-red-100 rounded max-w-xl mx-auto">
        {error}
      </div>
    );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-lg max-w-5xl mx-auto">
  <h2 className="text-xl sm:text-2xl font-semibold text-teal-600 mb-6">Stipend Internships</h2>

  <div className="grid grid-cols-1 gap-6 mb-10">
    {internships.length === 0 ? (
      <p className="text-center text-gray-600">No stipend internships found for this partner.</p>
    ) : (
      internships.map((internship) => (
        <div
          key={internship._id?.$oid || internship._id}
          className="bg-white border rounded-xl shadow p-4 sm:p-6 flex flex-col sm:flex-row relative gap-4"
        >
          {internship.imgUrl && (
            <img
              src={internship.imgUrl}
              alt={internship.jobTitle}
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto sm:mx-0 rounded-full object-contain bg-gray-200"
            />
          )}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold">{internship.jobTitle}</h3>
            <p className="text-gray-700 font-medium">
              {internship.companyName}{" "}
              {internship.organization ? `(${internship.organization})` : ""}
            </p>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {internship.location} •{" "}
              {formatDateRange(internship.startDate, internship.endDateOrDuration)} •{" "}
              {internship.internshipMode}
            </p>
            <p className="text-teal-600 font-semibold mt-1">
              Student Pays:{" "}
              {internship.compensationDetails?.amount
                ? `${internship.compensationDetails.amount} ${internship.compensationDetails.currency}`
                : "N/A"}
            </p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              {internship.qualifications?.map((qual, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 border border-gray-300 text-gray-800 text-xs sm:text-sm rounded-full px-3 py-1"
                >
                  {qual}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => handleShowStipendDetails(internship)}
            className="mt-4 sm:mt-0 sm:self-start bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition w-full sm:w-auto"
          >
            Stipend Details
          </button>
        </div>
      ))
    )}
  </div>

  {/* Modal */}
  <Modal
    isOpen={modalIsOpen}
    onRequestClose={closeModal}
    contentLabel="Stipend Details Modal"
    className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
    overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50"
  >
    <div className="relative bg-white rounded-xl shadow-2xl w-full sm:max-w-lg md:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-300 p-6 sm:p-8">
      {/* Close button */}
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label="Close modal"
        title="Close"
      >
        ✕
      </button>

      {/* Content */}
      {loadingStipends ? (
        <div className="flex justify-center items-center space-x-3">
          <ClipLoader size={36} color="#14b8a6" />
          <span className="text-teal-600 font-semibold text-base sm:text-lg">
            Loading stipend details...
          </span>
        </div>
      ) : error ? (
        <p className="text-red-600 font-semibold">{error}</p>
      ) : stipends.length === 0 ? (
        <p className="text-gray-700 text-center text-lg">No stipend details available.</p>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-4 p-4 bg-teal-100 rounded-lg text-teal-900 font-semibold flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <p>Total stipend submissions: {stipends.length}</p>
            <p>
              Total stipend amount:{" "}
              {selectedInternship?.compensationDetails?.amount
                ? `${selectedInternship.compensationDetails.amount} ${selectedInternship.compensationDetails.currency}`
                : "N/A"}
            </p>
            <CSVLink
              data={paginatedStipends.map((s) => ({
                "Account Name": s.bankAccountName,
                "Account Number": s.bankAccountNumber,
                "IFSC / SWIFT": s.ifscOrSwift,
                Currency: s.preferredCurrency,
                Notes: s.notes || "-",
                "Submitted At": new Date(s.submittedAt).toLocaleString(),
              }))}
              filename={`stipend-details-${selectedInternship.jobTitle || "internship"}.csv`}
              className="inline-block cursor-pointer bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 text-white font-semibold py-2 px-4 rounded transition w-full sm:w-auto"
              target="_blank"
            >
              Export CSV
            </CSVLink>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search stipend details..."
            value={stipendSearch}
            onChange={(e) => {
              setStipendSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="mb-4 w-full border border-gray-300 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          {/* Table (scrollable on mobile) */}
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="hidden sm:table w-full text-left border-collapse table-auto">
              <thead className="bg-teal-600 text-white text-sm sm:text-base">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Account Name</th>
                  <th className="p-3">Account No.</th>
                  <th className="p-3">IFSC / SWIFT</th>
                  <th className="p-3">Currency</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3">Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStipends.map((stipend, idx) => (
                  <tr key={stipend._id} className={idx % 2 === 0 ? "bg-white" : "bg-teal-50"}>
                    <td className="p-3">{(currentPage - 1) * stipendPerPage + idx + 1}</td>
                    <td className="p-3">{stipend.bankAccountName}</td>
                    <td className="p-3">{stipend.bankAccountNumber}</td>
                    <td className="p-3">{stipend.ifscOrSwift}</td>
                    <td className="p-3">{stipend.preferredCurrency}</td>
                    <td className="p-3 whitespace-pre-wrap">{stipend.notes || "-"}</td>
                    <td className="p-3">{new Date(stipend.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Card layout for mobile */}
            <div className="sm:hidden space-y-4 p-2">
              {paginatedStipends.map((stipend, idx) => (
                <div key={stipend._id} className="border rounded-lg p-3 bg-white shadow-sm text-sm">
                  <p><span className="font-semibold">#</span> {(currentPage - 1) * stipendPerPage + idx + 1}</p>
                  <p><span className="font-semibold">Account Name:</span> {stipend.bankAccountName}</p>
                  <p><span className="font-semibold">Account No.:</span> {stipend.bankAccountNumber}</p>
                  <p><span className="font-semibold">IFSC / SWIFT:</span> {stipend.ifscOrSwift}</p>
                  <p><span className="font-semibold">Currency:</span> {stipend.preferredCurrency}</p>
                  <p><span className="font-semibold">Notes:</span> {stipend.notes || "-"}</p>
                  <p><span className="font-semibold">Submitted At:</span> {new Date(stipend.submittedAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-gray-700 gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 disabled:opacity-50 w-full sm:w-auto"
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 disabled:opacity-50 w-full sm:w-auto"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  </Modal>
</div>

  );
};

export default StipendDetails;
