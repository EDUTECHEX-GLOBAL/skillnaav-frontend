import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { AiOutlineSearch, AiOutlineClose } from "react-icons/ai";
import UserCard from './UserCard';
import InternshipPaymentCard from './InternshipPaymentCard';

const InternshipPayments = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [search, setSearch] = useState("");

  // user profile state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    const fetchInternshipsWithPayments = async () => {
      try {
        const { data } = await axios.get("/api/interns");
        const paidInternships = data.filter(
          (i) =>
            i.internshipType === "PAID" ||
            i?.compensationDetails?.type === "PAID"
        );

        const enrichedInternships = await Promise.all(
          paidInternships.map(async (i) => {
            try {
              const res = await axios.get(
                `/api/internship/payments/admin/internship/${i._id}`
              );
              return {
                ...i,
                paymentSummary:
                  res.data?.data || { totalPayments: 0, totalAmount: 0 },
              };
            } catch {
              return {
                ...i,
                paymentSummary: { totalPayments: 0, totalAmount: 0 },
              };
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
      const res = await axios.get(
        `/api/internship/payments/${internship._id}/payments`
      );
      setSelectedPayments(res.data.payments || []);
      setSelectedInternship(internship);
      setSearch("");
    } catch (err) {
      console.error("Error fetching payment list:", err);
      setSelectedPayments([]);
      setSelectedInternship(internship);
    }
  };

  const handleViewUser = async (studentIdObj) => {
    try {
      setUserLoading(true);
      const res = await axios.get(`/api/users/${studentIdObj._id}`);
      setSelectedUser(res.data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setSelectedUser(studentIdObj);
    } finally {
      setUserLoading(false);
    }
  };

  const filteredPayments = selectedPayments.filter(
    (p) =>
      p.studentId?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      p.studentId?.email
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  if (loading)
    return (
      <div className="p-8 min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-2xl"
        />
      </div>
    );

  return (
    <div className="p-8 font-[Poppins] min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Spacious Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-12"
      >
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-emerald-900 to-green-900 bg-clip-text text-transparent mb-3 leading-tight">
                Paid Internships
              </h1>
              <p className="text-2xl text-gray-600 font-light">{internships.length} programs</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Spacious 2-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
        {internships.map((internship, index) => (
          <motion.div
            key={internship._id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <InternshipPaymentCard
              internship={internship}
              onViewPayments={handleViewPayments}
            />
          </motion.div>
        ))}
      </div>

    {/* Payment Details Modal - FIXED with proper scroll */}
{selectedInternship && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-50 overflow-hidden">
    <motion.div
      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col border border-white/30 overflow-hidden"
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 30 }}
    >
      {/* Fixed Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50/80 to-blue-50/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">$</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-slate-800 bg-clip-text text-transparent">
                {selectedInternship.jobTitle}
              </h2>
              <p className="text-lg text-gray-600 font-medium">{selectedInternship.companyName}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-2xl backdrop-blur-sm shadow-md border hover:shadow-lg transition-all"
            onClick={() => setSelectedInternship(null)}
          >
            <AiOutlineClose size={24} />
          </motion.button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-20 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Search */}
        <div className="mb-8 sticky top-0 bg-white/80 backdrop-blur-sm pt-6 -mt-6 pb-6 z-10 border-b border-gray-100">
          <div className="relative max-w-md mx-auto">
            <AiOutlineSearch className="absolute left-4 top-10 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-3 focus:ring-emerald-400/50 focus:border-emerald-400 text-lg shadow-sm transition-all bg-white/70 hover:shadow-md"
            />
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 px-8"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <AiOutlineSearch className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-3xl font-bold text-gray-500 mb-4">No payments found</h3>
              <p className="text-xl text-gray-400">{search ? 'Try different search terms' : 'No payments yet'}</p>
            </motion.div>
          ) : (
            filteredPayments.map((p, index) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="group flex items-center p-6 bg-white/70 backdrop-blur-sm rounded-3xl hover:bg-white hover:shadow-xl hover:border-emerald-200/70 hover:-translate-y-1 border border-gray-200/50 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => handleViewUser(p.studentId)}
              >
                {/* Student Avatar & Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white/50 shrink-0 group-hover:scale-105 transition-transform">
                    {p.studentId?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {p.studentId?.name}
                    </h4>
                    <p className="text-lg text-gray-600 line-clamp-1">{p.studentId?.email}</p>
                  </div>
                </div>

                {/* Amount & Date & Status */}
                <div className="text-right ml-6 flex flex-col items-end gap-2">
                  <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent drop-shadow-lg group-hover:scale-105 transition-transform">
                    ${p.amount.toLocaleString()}
                  </div>
                  <div className="text-base text-gray-500 font-medium">
                    {new Date(p.completedAt).toLocaleDateString()}
                  </div>
                  <motion.span 
                    className={`px-4 py-2 rounded-2xl text-base font-bold shadow-md ${
                      p.status === "COMPLETED"
                        ? "bg-emerald-100/80 text-emerald-800 border-2 border-emerald-200/60 backdrop-blur-sm"
                        : "bg-red-100/80 text-red-800 border-2 border-red-200/60 backdrop-blur-sm"
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {p.status}
                  </motion.span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  </div>
)}


      {/* User Profile */}
      {selectedUser && !userLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-8 z-[80]">
          <UserCard user={selectedUser} onClose={() => setSelectedUser(null)} />
        </div>
      )}

      {userLoading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-8 z-[80]">
          <motion.div
            className="bg-white/95 backdrop-blur-xl rounded-3xl p-16 shadow-2xl border border-white/50 text-center max-w-lg w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-500 rounded-3xl mx-auto mb-8 animate-spin"></div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Loading Profile</h3>
            <p className="text-xl text-gray-600">Fetching student details...</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InternshipPayments;
