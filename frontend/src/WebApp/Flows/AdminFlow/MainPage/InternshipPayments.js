import React, { useEffect, useState } from "react";
import axios from "axios";

const InternshipPayments = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInternshipsWithPayments = async () => {
      try {
        const { data } = await axios.get("/api/interns");

        // Filter for PAID internships
        const paidInternships = data.filter(
          (internship) =>
            internship.internshipType === "PAID" ||
            internship?.compensationDetails?.type === "PAID"
        );

        // Fetch payment summaries for each
        const enrichedInternships = await Promise.all(
          paidInternships.map(async (internship) => {
            try {
              const paymentRes = await axios.get(
                `/api/internship/payments/admin/internship/${internship._id}`
              );
              return {
                ...internship,
                paymentSummary: paymentRes.data?.data || {
                  totalPayments: 0,
                  totalAmount: 0,
                },
              };
            } catch (err) {
              console.error(
                `Error fetching payments for internship ${internship._id}:`,
                err
              );
              return {
                ...internship,
                paymentSummary: { totalPayments: 0, totalAmount: 0 },
              };
            }
          })
        );

        setInternships(enrichedInternships);
      } catch (err) {
        console.error("Error fetching internships:", err);
        setError("Failed to fetch internships.");
      } finally {
        setLoading(false);
      }
    };

    fetchInternshipsWithPayments();
  }, []);

  if (loading) return <p className="p-4">Loading internships...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (internships.length === 0)
    return <p className="p-4">No paid internships found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Paid Internship Payments</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {internships.map((internship) => (
          <div
            key={internship._id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
          >
            <img
              src={internship.imgUrl}
              alt={internship.jobTitle}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h2 className="text-lg font-semibold">{internship.jobTitle}</h2>
              <p className="text-gray-600">{internship.companyName}</p>
              <p className="text-sm text-gray-500">{internship.location}</p>

              {/* Compensation Info */}
              <div className="mt-2">
                <span className="text-green-600 font-bold">
                  {internship?.compensationDetails?.amount}{" "}
                  {internship?.compensationDetails?.currency}
                </span>{" "}
                <span className="text-gray-500 text-sm">
                  {internship?.compensationDetails?.frequency}
                </span>
              </div>

              {/* Payment Summary */}
              <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Total Payments:</strong>{" "}
                  {internship.paymentSummary?.totalPayments || 0}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Total Amount Received:</strong>{" "}
                  {internship.paymentSummary?.totalAmount || 0} USD
                </p>
              </div>

              <button
                className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                onClick={() =>
                  console.log(
                    "Go to detailed payment view for",
                    internship._id
                  )
                }
              >
                View Detailed Payments
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternshipPayments;
