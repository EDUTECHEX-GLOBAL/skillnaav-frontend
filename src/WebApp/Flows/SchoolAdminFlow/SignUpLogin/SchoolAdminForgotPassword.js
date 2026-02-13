// SchoolAdminForgotPassword.js
import React, { useState } from "react";

const SchoolAdminForgotPassword = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, message: "", error: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: "", error: "" });

    try {
      const response = await fetch("/api/school-admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setStatus({ loading: false, message: data.message, error: "" });
        setIsSubmitted(true); // ✅ Hide form
      } else {
        setStatus({ loading: false, message: "", error: data.message });
      }
    } catch (err) {
      setStatus({ loading: false, message: "", error: "Something went wrong." });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <button
          className="absolute top-3 right-4 text-gray-600 text-xl font-bold hover:text-gray-800"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-xl font-bold text-center mb-4 text-blue-700">Forgot Password</h2>

        {status.message && (
          <p className="text-green-600 text-center mb-4">{status.message}</p>
        )}
        {status.error && (
          <p className="text-red-600 text-center mb-4">{status.error}</p>
        )}

        {!isSubmitted && (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 mb-4 border border-gray-300 rounded-md"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={status.loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold"
            >
              {status.loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SchoolAdminForgotPassword;
