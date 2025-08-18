import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { AiOutlineSearch, AiOutlineClose } from "react-icons/ai";

const InternshipPayments = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchInternshipsWithPayments = async () => {
      try {
        const { data } = await axios.get("/api/interns");
        const paidInternships = data.filter(
          (i) => i.internshipType === "PAID" || i?.compensationDetails?.type === "PAID"
        );

        const enrichedInternships = await Promise.all(
          paidInternships.map(async (i) => {
            try {
              const res = await axios.get(`/api/internship/payments/admin/internship/${i._id}`);
              return { ...i, paymentSummary: res.data?.data || { totalPayments: 0, totalAmount: 0 } };
            } catch {
              return { ...i, paymentSummary: { totalPayments: 0, totalAmount: 0 } };
            }
          })
        );

        setInternships(enrichedInternships);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInternshipsWithPayments();
  }, []);

  const handleViewPayments = async (internship) => {
    try {
      const res = await axios.get(`/api/internship/payments/${internship._id}/payments`);
      setSelectedPayments(res.data.payments || []);
      setSelectedInternship(internship);
      setSearch("");
    } catch (err) {
      console.error("Error fetching payment list:", err);
      setSelectedPayments([]);
      setSelectedInternship(internship);
    }
  };

  const filteredPayments = selectedPayments.filter(
    (p) =>
      p.studentId?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.studentId?.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading)
    return <div className="p-6 text-center text-gray-500 animate-pulse">⏳ Loading internships...</div>;

  return (
    <div className="p-6 font-[Poppins]">
      <h1 className="text-3xl font-bold mb-8">💼 Paid Internship Payments</h1>

      {/* Internship Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {internships.map((internship) => (
          <motion.div
            key={internship._id}
            className="bg-white shadow-lg rounded-xl p-5 hover:shadow-2xl transition-shadow cursor-pointer"
            whileHover={{ scale: 1.03 }}
          >
            <h2 className="text-xl font-semibold">{internship.jobTitle}</h2>
            <p className="text-gray-500">{internship.companyName}</p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-400">Payments</p>
                <p className="font-bold text-lg">{internship.paymentSummary?.totalPayments || 0}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-400">Amount</p>
                <p className="font-bold text-lg text-green-600">
                  ${internship.paymentSummary?.totalAmount?.toLocaleString() || 0}
                </p>
              </div>
            </div>

            <button
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              onClick={() => handleViewPayments(internship)}
            >
              🔎 View Payments
            </button>
          </motion.div>
        ))}
      </div>

      {/* Payment Modal */}
      {selectedInternship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50 overflow-auto">
          <motion.div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl relative"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedInternship(null)}
            >
              <AiOutlineClose size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-4">
              Payments for {selectedInternship.jobTitle} ({selectedPayments.length})
            </h2>

            <div className="relative mb-4">
              <AiOutlineSearch className="absolute top-2 left-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {filteredPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No payments found.</p>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-2 border">Student</th>
                      <th className="p-2 border">Amount</th>
                      <th className="p-2 border">Date</th>
                      <th className="p-2 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="p-2 border">
                          {p.studentId?.name}
                          <br />
                          <span className="text-xs text-gray-400">{p.studentId?.email}</span>
                        </td>
                        <td className="p-2 border font-semibold text-green-600">
                          ${p.amount.toLocaleString()}
                        </td>
                        <td className="p-2 border">
                          {new Date(p.completedAt).toLocaleDateString()}
                        </td>
                        <td className="p-2 border">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              p.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InternshipPayments;
