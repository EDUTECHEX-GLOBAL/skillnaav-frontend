// components/InternshipPaymentCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaHeart } from "react-icons/fa";
import { AiOutlineEye } from "react-icons/ai";

const InternshipPaymentCard = ({ internship, onViewPayments }) => {
  const totalPayments = internship.paymentSummary?.totalPayments || 0;
  const totalAmount = internship.paymentSummary?.totalAmount || 0;

  const calculatePostedTime = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
  };

  return (
    <motion.div
      className="w-full p-6 border border-gray-200 rounded-2xl shadow-md relative hover:shadow-xl hover:border-gray-300 transition-all duration-200 bg-white group cursor-pointer"
      whileHover={{ y: -4 }}
      onClick={() => onViewPayments(internship)}
    >
      {/* Badge & Heart */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="text-xs font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full">
           PAID
        </span>
        <button className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-gray-100">
          <FaHeart size={16} />
        </button>
      </div>

      {/* Logo & Header */}
      <div className="flex items-start gap-4 mb-4">
        {internship.imgUrl ? (
          <img
            src={internship.imgUrl}
            alt={internship.companyName}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
        )}
        <div className="flex-grow min-w-0">
          <h5 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">
            {internship.jobTitle}
          </h5>
          <p className="text-sm text-gray-500 line-clamp-1">
            {internship.companyName} • {calculatePostedTime(internship.createdAt)}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {internship.location && (
          <p className="flex items-center text-sm text-gray-600">
            <FaMapMarkerAlt className="mr-2 text-green-500 w-4 h-4" />
            {internship.location}
          </p>
        )}
        <p className="flex items-center text-sm text-gray-600">
          <FaDollarSign className="mr-2 text-green-500 w-4 h-4" />
          <span className="font-semibold text-lg text-gray-900">
            ${totalAmount.toLocaleString()}
          </span>
          <span className="text-xs text-gray-500 ml-1">total</span>
        </p>
        <p className="flex items-center text-sm text-gray-600">
          <AiOutlineEye className="mr-2 text-blue-500 w-4 h-4" />
          <span className="font-semibold">{totalPayments}</span> payments
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
          {totalPayments} students
        </span>
        {internship.qualifications?.slice(0, 2).map((q, i) => (
          <span key={i} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
            {q}
          </span>
        ))}
        {internship.qualifications?.length > 2 && (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            +{internship.qualifications.length - 2}
          </span>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-gray-200">
        <button className="w-full text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center justify-center gap-1 hover:bg-blue-50 py-2 px-2 rounded-xl transition-all group-hover:translate-x-2">
          <AiOutlineEye size={16} />
          View {totalPayments} Payments
        </button>
      </div>
    </motion.div>
  );
};

export default InternshipPaymentCard;
