import React, { useState } from "react";
import axios from "../api/axiosInstance"; // Import axios for HTTP requests
import { isValidEmail } from "../utils/validation";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setEmailError("");

    // Validate TLD email format and typos
    if (!isValidEmail(email)) {
      const msg = "Please enter a valid email address with a valid domain (e.g., user@example.com).";
      setEmailError(msg);
      return;
    }

    try {
      const response = await axios.post("/api/contact", {
        name,
        email,
        subject,
        message,
      });
      console.log("Form submitted successfully!", response.data);
      setSubmitted(true);
      // Reset details after submission
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setErrorMsg("");
      setEmailError("");
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMsg("Failed to send message. Please try again.");
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError("");
      setErrorMsg("");
    }
  };

  const handleEmailBlur = () => {
    if (email.trim().length > 0 && !isValidEmail(email)) {
      const msg = "Please enter a valid email address with a valid domain (e.g., user@example.com).";
      setEmailError(msg);
    }
  };

  const SuccessAnimation = () => (
    <div
      className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6 flex justify-between items-center"
      role="alert"
    >
      <div>
        <strong className="font-bold">Success! </strong>
        <span className="block sm:inline">Your message has been submitted.</span>
      </div>
      <button
        type="button"
        onClick={() => setSubmitted(false)}
        className="text-green-700 hover:text-green-900 focus:outline-none p-1 cursor-pointer"
        aria-label="Close success alert"
      >
        <svg
          className="fill-current h-5 w-5 text-green-600"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M14.348 5.652a.5.5 0 0 0-.707 0L10 9.293 6.36 5.652a.5.5 0 1 0-.708.708L9.293 10l-3.64 3.64a.5.5 0 1 0 .708.708L10 10.707l3.64 3.64a.5.5 0 1 0 .708-.708L10.707 10l3.64-3.64a.5.5 0 0 0 0-.708z" />
        </svg>
      </button>
    </div>
  );

  return (
    <div
      id="contacts"
      className="bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-2xl overflow-hidden shadow-xl scroll-mt-28 lg:scroll-mt-32 w-full"
    >
      <div className="flex flex-col lg:flex-row">
        {/* Left Section */}
        <div className="w-full lg:w-1/2 py-8 px-4 sm:py-12 sm:px-8 lg:p-12 flex flex-col justify-center items-center text-center">
          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6">
            Have Questions? Get in Touch
          </h1>
          <p className="text-white text-base sm:text-lg mb-4">
            <a
              href="mailto:info@skillnaav.com"
              className="text-white font-medium hover:underline inline-block break-all"
            >
              Email to: info@skillnaav.com
            </a>
          </p>
        </div>

        {/* Right Section */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full lg:w-1/2 py-8 px-4 sm:py-12 sm:px-8 lg:p-12 flex flex-col justify-center"
        >
          <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center">
            Contact Us
          </h2>
          {submitted && <SuccessAnimation />}
          {errorMsg && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6 text-sm">
              {errorMsg}
            </div>
          )}
          <input
            type="text"
            placeholder="Enter Your Name*"
            className="w-full box-border py-3 px-4 bg-white rounded-xl text-base sm:text-lg text-gray-800 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-label="Enter Your Name"
          />
          <div className="mb-4">
            <input
              type="email"
              placeholder="Enter Your Email*"
              className={`w-full box-border py-3 px-4 bg-white rounded-xl text-base sm:text-lg text-gray-800 focus:outline-none focus:ring-2 ${
                emailError
                  ? "ring-2 ring-red-600 border-red-600"
                  : "focus:ring-pink-500"
              }`}
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              required
              aria-label="Enter Your Email"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "contact-email-error" : undefined}
            />
            {emailError && (
              <p
                id="contact-email-error"
                role="alert"
                aria-live="polite"
                className="text-white bg-red-600/95 text-xs sm:text-sm py-1.5 px-3 rounded-lg mt-2 font-medium shadow break-words"
              >
                {emailError}
              </p>
            )}
          </div>
          <input
            type="text"
            placeholder="Your Question About.."
            className="w-full box-border py-3 px-4 bg-white rounded-xl text-base sm:text-lg text-gray-800 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            placeholder="Your Message..."
            className="w-full box-border py-3 px-4 bg-white rounded-xl text-base sm:text-lg text-gray-800 mb-6 h-32 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full sm:w-auto py-3.5 px-8 bg-white rounded-xl text-pink-600 text-base sm:text-lg font-bold hover:bg-pink-50 shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
