import React, { useEffect, useState } from "react";
import axios from "axios";

const PartnerPayments = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch all partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data } = await axios.get("/api/partners/partners");
        setPartners(data);
      } catch (err) {
        setError(err.message || "Failed to fetch partners");
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  // Fetch payment summary for a partner
  const fetchPartnerPayments = async (partner) => {
    setSelectedPartner(partner);
    setSummaryLoading(true);
    setPaymentSummary(null);

    try {
      const { data } = await axios.get(
        `/api/internship/payments/admin/partner/${partner._id}`
      );
      setPaymentSummary(data.data);
    } catch (err) {
      console.error(err);
      setPaymentSummary({ totalPayments: 0, totalAmount: 0 });
    } finally {
      setSummaryLoading(false);
    }
  };

  // Filter partners by search
  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.universityName &&
        p.universityName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 font-[Poppins]">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        🤝 Partner Payments
      </h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="🔍 Search by name, email, or university..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 border border-gray-300 p-3 pl-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* <span className="absolute left-3 top-3 text-gray-400">🔍</span> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partner List */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[70vh] pr-2">
          {loading ? (
            <p className="text-gray-500">⏳ Loading partners...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : filteredPartners.length === 0 ? (
            <p className="text-gray-500">No partners found.</p>
          ) : (
            filteredPartners.map((partner) => (
              <div
                key={partner._id}
                className={`p-5 border rounded-xl bg-white shadow-sm cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1 ${
                  selectedPartner?._id === partner._id
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
                onClick={() => fetchPartnerPayments(partner)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg">
                    {partner.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {partner.name}
                    </p>
                    <p className="text-sm text-gray-600">{partner.email}</p>
                    <p className="text-xs text-gray-500 italic">
                      {partner.universityName || "No university assigned"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-2">
          {selectedPartner ? (
            <div className="border rounded-xl p-8 bg-gradient-to-br from-gray-50 to-white shadow-lg h-full">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                💳 Payment Summary
                <span className="text-blue-600">
                  ({selectedPartner.name})
                </span>
              </h2>

              {summaryLoading ? (
                <p className="text-gray-500">⏳ Fetching payment summary...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 bg-white rounded-xl shadow flex flex-col items-center justify-center hover:scale-105 transition">
                    <p className="text-sm text-gray-500">Total Payments</p>
                    <p className="text-4xl font-extrabold text-gray-800">
                      {paymentSummary?.totalPayments || 0}
                    </p>
                  </div>
                  <div className="p-6 bg-white rounded-xl shadow flex flex-col items-center justify-center hover:scale-105 transition">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-4xl font-extrabold text-green-600">
                      ₹{paymentSummary?.totalAmount?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 border rounded-xl bg-gray-50">
              <p>👈 Select a partner to view payment summary</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerPayments;
