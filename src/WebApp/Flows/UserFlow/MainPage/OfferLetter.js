import React, { useEffect, useState } from "react";
import axios from "../../../../api/axiosInstance";
import OfferLetterCard from "./OfferLetterCard";
import { Skeleton } from "antd";

const offerGridClassName =
  "grid w-full gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))] xl:[grid-template-columns:repeat(3,minmax(0,1fr))]";

const OfferLetters = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  // Ensure correct id field
  const studentId = userInfo?.studentId || userInfo?._id;

  useEffect(() => {
    const fetchOffers = async () => {
      if (!studentId) {
        setError("Student ID not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`/api/offer-letters/student/${studentId}`);
        setOffers(res.data || []);
      } catch (err) {
        console.error("Error fetching offers:", err);
        setError("Failed to load offer letters.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [studentId]);

  return (
    <div className="w-full p-2 font-poppins sm:p-3 lg:p-4">
      <h2 className="text-xl font-semibold mb-4">Your Offer Letters</h2>

      {loading && (
        <div className={offerGridClassName}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[420px] min-w-0 w-full p-4 border rounded shadow-sm bg-white">
              <Skeleton active />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 font-medium">{error}</p>}

      {!loading && !error && offers.length === 0 && (
        <p className="text-gray-600 italic">
          No offer letters yet. Please check back later.
        </p>
      )}

      {!loading && !error && offers.length > 0 && (
        <div className={offerGridClassName}>
          {offers.map((offer) => (
            <OfferLetterCard
              key={offer._id}
              offer={offer}
              onStatusChange={(newStatus) =>
                setOffers((prev) =>
                  prev.map((o) =>
                    o._id === offer._id ? { ...o, status: newStatus } : o
                  )
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OfferLetters;
