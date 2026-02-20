import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Modal from "react-modal";
import { ClipLoader } from "react-spinners";
import { CSVLink } from "react-csv";

Modal.setAppElement("#root");

/* ---------------- Utils ---------------- */
const formatDateRange = (start, end) => {
  if (!start) return "";
  const s = new Date(start).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const e =
    end && !isNaN(Date.parse(end))
      ? new Date(end).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : end || "";
  return `${s} – ${e}`;
};

/* ---------------- Component ---------------- */
const StipendDetails = () => {
  const [internships, setInternships] = useState([]);
  const [stipends, setStipends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStipends, setLoadingStipends] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const partnerId = localStorage.getItem("partnerId");

  /* Fetch internships */
  useEffect(() => {
    if (!partnerId) return;
    setLoading(true);
    axios.get(`/api/interns/partner/${partnerId}?internshipType=STIPEND`)
      .then((res) => setInternships(res.data?.data || []))
      .catch(() => setInternships([]))
      .finally(() => setLoading(false));
  }, [partnerId]);

  const stipendInternships = useMemo(() => {
    return internships.filter(
      (i) =>
        i.internshipType === "STIPEND" &&
        i.compensationDetails?.type === "STIPEND" &&
        i.adminApproved === true
    );
  }, [internships]);




  /* Fetch stipend details */
  const openStipends = async (internship) => {
    setSelectedInternship(internship);
    setModalIsOpen(true);
    setLoadingStipends(true);
    setSearch("");
    setPage(1);

    try {
      const res = await axios.get(
        `/api/internship/stipend-details/internship/${internship._id?.$oid || internship._id}`
      );
      setStipends(res.data?.stipendDetails || []);
    } catch {
      setError("Failed to load stipend details");
    } finally {
      setLoadingStipends(false);
    }
  };

  /* Derived data */
  const filtered = useMemo(() => {
    if (!search) return stipends;
    const q = search.toLowerCase();
    return stipends.filter(
      (s) =>
        s.bankAccountName?.toLowerCase().includes(q) ||
        s.ifscOrSwift?.toLowerCase().includes(q) ||
        s.bankAccountNumber?.includes(q)
    );
  }, [stipends, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 font-[Poppins]">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Stipend Internships
        </h1>
        <p className="text-slate-500 mt-1">
          View stipend submissions for your posted internships
        </p>
      </div>

      {/* Internship Cards (KEPT) */}
      {loading ? (
        <div className="flex justify-center py-16">
          <ClipLoader size={36} color="#14b8a6" />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-4">
          {stipendInternships.map((internship) => (

            <div
              key={internship._id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row gap-5"
            >
              {internship.imgUrl && (
                <img
                  src={internship.imgUrl}
                  alt={internship.jobTitle}
                  className="w-20 h-20 rounded-lg object-contain bg-slate-100"
                />
              )}

              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900">
                  {internship.jobTitle}
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {internship.companyName}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {internship.location} •{" "}
                  {formatDateRange(
                    internship.startDate,
                    internship.endDateOrDuration
                  )}
                </p>

                <p className="text-sm text-teal-700 font-medium mt-2">
                  Stipend:{" "}
                  {internship.compensationDetails?.amount
                    ? `${internship.compensationDetails.amount} ${internship.compensationDetails.currency}`
                    : "N/A"}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {internship.qualifications?.map((q, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start sm:items-center">
                <button
                  onClick={() => openStipends(internship)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  View Stipends
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        overlayClassName="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
        className="bg-white rounded-2xl max-w-6xl w-full mx-4 p-8 outline-none shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {selectedInternship?.jobTitle}
            </h2>
            <p className="text-sm text-slate-500">
              {selectedInternship?.companyName}
            </p>
          </div>
          <button
            onClick={() => setModalIsOpen(false)}
            className="text-slate-400 hover:text-slate-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 border rounded-lg p-4">
            <p className="text-sm text-slate-500">Submissions</p>
            <p className="text-2xl font-semibold">{stipends.length}</p>
          </div>

          <div className="bg-slate-50 border rounded-lg p-4">
            <p className="text-sm text-slate-500">Student Pays</p>
            <p className="text-lg font-medium">
              {selectedInternship?.compensationDetails?.amount || "N/A"}
            </p>
          </div>

          <CSVLink
            data={filtered}
            filename={`stipends-${selectedInternship?.jobTitle}.csv`}
            className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
          >
            Export CSV
          </CSVLink>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search account name, IFSC, number"
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
        />

        {/* Table */}
        {loadingStipends ? (
          <div className="flex justify-center py-20">
            <ClipLoader size={32} color="#14b8a6" />
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-3 text-left">Account Name</th>
                  <th className="px-5 py-3 text-left">Account</th>
                  <th className="px-5 py-3 text-left">IFSC</th>
                  <th className="px-5 py-3 text-left">Currency</th>
                  <th className="px-5 py-3 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pageData.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium">
                      {s.bankAccountName}
                    </td>
                    <td className="px-5 py-3 font-mono">
                      ****{s.bankAccountNumber?.slice(-4)}
                    </td>
                    <td className="px-5 py-3">{s.ifscOrSwift}</td>
                    <td className="px-5 py-3">{s.preferredCurrency}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(s.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-md bg-slate-200 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-md bg-slate-200 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default StipendDetails;