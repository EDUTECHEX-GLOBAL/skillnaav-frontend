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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">🤝 Partner Payments</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by name, email, or university..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-1/2 border p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {loading ? (
        <p>Loading partners...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : filteredPartners.length === 0 ? (
        <p className="text-gray-500">No partners found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.map((partner) => (
            <div
              key={partner._id}
              className={`p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition ${
                selectedPartner?._id === partner._id
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
              onClick={() => fetchPartnerPayments(partner)}
            >
              <p className="font-medium text-lg">{partner.name}</p>
              <p className="text-sm text-gray-600">{partner.email}</p>
              <p className="text-sm text-gray-500">
                {partner.universityName || "No university assigned"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Partner Payment Summary */}
      {selectedPartner && (
        <div className="mt-6 border rounded-lg p-6 bg-gray-50 shadow">
          <h2 className="text-xl font-semibold mb-4">
            Payment Summary for {selectedPartner.name}
          </h2>

          {summaryLoading ? (
            <p>Loading payment summary...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg shadow text-center">
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold">
                  {paymentSummary?.totalPayments || 0}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow text-center">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{paymentSummary?.totalAmount || 0}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PartnerPayments;
