import React, { useState } from "react";
import { Link } from "react-router-dom";
import SkillNaavLogo from "../assets/skillnaav_logo-250w.png";
import FacebookIcon from "../assets/facebook-custom.png";
import TwitterIcon from "../assets/X_custom.png";
import FeedIcon from "../assets/youtube.png";
import LinkedinIcon from "../assets/linkedin_custom.png";
import { isValidEmail } from "../utils/validation";

export default function Footer() {
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    setSubscribeError("");

    if (!isValidEmail(subscribeEmail)) {
      setSubscribeError("Please enter a valid email address with a valid domain (e.g., user@example.com).");
      return;
    }

    setIsSubscribed(true);
    setSubscribeEmail("");

    // Revert back to "Subscribe" after 4 seconds so page reload isn't needed
    setTimeout(() => {
      setIsSubscribed(false);
    }, 4000);
  };

  const handleEmailBlur = () => {
    if (subscribeEmail.trim().length > 0 && !isValidEmail(subscribeEmail)) {
      setSubscribeError("Please enter a valid email address with a valid domain (e.g., user@example.com).");
    }
  };

  return (
    <footer className="bg-white text-gray-800 mt-10 py-12 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Footer Logo */}
          <div className="flex items-start justify-center md:justify-start md:col-span-1">
            {/* link to home (valid href) */}
            <a href="/" aria-label="SkillNaav home">
              <img
                src={SkillNaavLogo}
                alt="SkillNaav logo"
                width={150}
                height={50}
              />
            </a>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-1">
            <h5 className="font-semibold mb-4">Contact Details</h5>
            <p className="mt-2">
              Email:{" "}
              <a
                href="mailto:info@skillnaav.com"
                className="text-blue-500 hover:underline"
              >
                info@skillnaav.com
              </a>
            </p>
          </div>

          {/* Useful Links */}
          <div className="md:col-span-1">
            <h5 className="font-semibold mb-4">Useful Links</h5>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/vision"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="hover:text-blue-600 transition"
                >
                  About SkillNaav
                </Link>
              </li>
              <li>
                <Link
                  to="/visa-information"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="hover:text-blue-600 transition"
                >
                  Visa Information
                </Link>
              </li>
              <li>
                <Link
                  to="/faqs"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="hover:text-blue-600 transition"
                >
                  Immigration FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="hover:text-blue-600 transition"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h5 className="font-semibold mb-4">Stay Informed</h5>
            <p className="text-sm text-gray-800 mb-4">
              Subscribe to our newsletters to get the latest news and updates
            </p>
            <form className="flex flex-col gap-2" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Your email address"
                className="py-2 px-3 text-sm text-gray-800 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={subscribeEmail}
                onChange={(e) => {
                  setSubscribeEmail(e.target.value);
                  if (subscribeError) setSubscribeError("");
                }}
                onBlur={handleEmailBlur}
                required
                aria-label="Email address for newsletter subscription"
              />
              {subscribeError && (
                <p className="text-xs text-red-600">{subscribeError}</p>
              )}
              <button
                type="submit"
                className={`px-6 py-2 text-white text-sm rounded transition focus:outline-none focus:ring-2 focus:ring-blue-500 text-center ${
                  isSubscribed ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
                }`}
                aria-pressed={isSubscribed}
              >
                {isSubscribed ? "Subscribed!" : "Subscribe"}
              </button>
            </form>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="flex justify-center mt-8 space-x-4">
          <a
            href="https://www.facebook.com/skillnaav"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800 transition duration-300"
            aria-label="SkillNaav on Facebook (opens in a new tab)"
          >
            <img src={FacebookIcon} alt="Facebook — SkillNaav" width={24} height={24} />
          </a>
          <a
            href="https://twitter.com/skillnaav"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800 transition duration-300"
            aria-label="SkillNaav on X (Twitter) (opens in a new tab)"
          >
            <img src={TwitterIcon} alt="X (Twitter) — SkillNaav" width={24} height={24} />
          </a>
          <a
            href="https://www.youtube.com/skillnaav"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800 transition duration-300"
            aria-label="SkillNaav on YouTube (opens in a new tab)"
          >
            <img src={FeedIcon} alt="YouTube — SkillNaav" width={24} height={24} />
          </a>
          <a
            href="https://www.linkedin.com/company/skillnaav"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800 transition duration-300"
            aria-label="SkillNaav on LinkedIn (opens in a new tab)"
          >
            <img src={LinkedinIcon} alt="LinkedIn — SkillNaav" width={24} height={24} />
          </a>
        </div>

        {/* Copyright Text */}
        <div className="mt-8 text-center text-sm text-gray-800">
          <p>&copy; 2024 SkillNaav. All Rights Reserved</p>
          <p className="mt-1">
            <Link
              to="/privacy"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-blue-600 transition underline-offset-2 hover:underline cursor-pointer"
            >
              Privacy Policy
            </Link>
            <span className="mx-2 text-gray-400">|</span>
            <Link
              to="/terms"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-blue-600 transition underline-offset-2 hover:underline cursor-pointer"
            >
              Terms and Conditions
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
