// Sidebar.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faPlane,
  faSearch,
  faFileAlt,
  faHeart,
  faUser,
  faLifeRing,
  faSignOutAlt,
  faChevronDown,
  faChevronUp,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import axios from "axios";

// Feedback context + questions snapshot
import { useFeedback } from "../../../../context/FeedbackContext";
import { userFlowQuestions } from "../../../../components/FeedbackModal/questionSets";

const Sidebar = ({ isMobile, isOpen, onClose }) => {
  const [selectedTab, setSelectedTab] = useState("home");
  const [showSectors, setShowSectors] = useState(false);
  const { handleSelectTab } = useTabContext();
  const navigate = useNavigate();

  const location = useLocation();

  // Feedback context
  const { openFeedback } = useFeedback();

  // When URL contains ?tab=..., open that tab automatically
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get("tab");
    if (tabFromUrl) {
      setSelectedTab(tabFromUrl);
      handleSelectTab(tabFromUrl);
    }
  }, [location.search, handleSelectTab]);

  const topSectors = [
    { id: "advanced-ai", name: "Advanced AI & Autonomous Systems" },
    { id: "quantum-computing", name: "Quantum Computing & Next-Gen Computing" },
    { id: "climate-tech", name: "Climate Tech & Carbon Capture" },
    { id: "biotech", name: "Biotechnology & Synthetic Biology" },
    { id: "materials-science", name: "Advanced Materials Science" },
  ];

  const handleTabClick = async (tab) => {
    if (tab === "logout") {
      await handleLogoutTrigger();
    } else {
      setSelectedTab(tab);
      handleSelectTab(tab);
      if (isMobile && onClose) onClose();
    }
  };

  /* ---- performLogout is declared first to avoid TDZ/runtime error ---- */
  const performLogout = async () => {
    const sessionId = localStorage.getItem("sessionId");
    const token = JSON.parse(localStorage.getItem("userToken") || "null");

    if (sessionId && token) {
      try {
        await axios.post(
          "/api/sessions/logout",
          { sessionId },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (error) {
        // don't block logout for session errors
        console.error("Logout session error:", error?.response?.data || error?.message);
      }
    }

    // clear only relevant keys (avoid wiping unrelated app data)
    try {
      localStorage.clear();
    } catch (err) {
      console.warn("LocalStorage clear failed:", err);
    }

    navigate("/user/login");
  };

  // When user clicks logout, check if they already submitted feedback.
  // If not, open feedback modal; after submit, perform logout.
  const handleLogoutTrigger = async () => {
    // --- NEW: enforce 1 minute since login before showing feedback modal ---
    const loginTime = Number(localStorage.getItem("loginTime"));
    const oneMinutePassed = !isNaN(loginTime) && (Date.now() - loginTime >= 60000);

    if (!oneMinutePassed) {
      // Less than 1 minute since login → skip feedback and logout immediately
      return performLogout();
    }
    // --- END login gating ---

    const sessionUser = JSON.parse(localStorage.getItem("userInfo")) || null;
    const userId = sessionUser?._1d || sessionUser?._id; // attempt safe read for different shapes

    // If userId missing, open feedback with null user and perform logout in callback
    if (!userId) {
      openFeedback({
        flow: "user",
        questions: userFlowQuestions,
        triggerInfo: { type: "logout", page: window.location.pathname },
        user: null,
        postSubmitCallback: () => performLogout(),
      });
      return;
    }

    try {
      const resp = await axios.get("/api/feedback/check", {
        params: { userId, flow: "user" },
      });

      if (resp.data?.alreadySubmitted) {
        performLogout();
        return;
      }
    } catch (err) {
      console.warn("Feedback check failed, opening modal");
    }

    openFeedback({
      flow: "user",
      questions: userFlowQuestions,
      triggerInfo: { type: "logout", page: window.location.pathname },
      user: sessionUser,
      postSubmitCallback: () => performLogout(),
    });
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:sticky top-16
        h-[calc(100vh-4rem)] w-64 bg-white shadow-lg font-poppins
        z-[100] md:z-10
        transform transition-transform duration-300 ease-in-out
        ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
      `}
      >
        <div className="h-[calc(100%-5rem)] overflow-y-auto px-4 pt-4 pb-6 hide-scrollbar">
          <nav className="space-y-2">
            {[
              { id: "home", icon: faHome, label: "HomePage" },
              { id: "aeronautical-jobs", icon: faPlane, label: "Aeronautical Jobs" },
              { id: "searchbar", icon: faSearch, label: "Search" },
              { id: "recommendations", icon: faStar, label: "Recommendations" },
              { id: "applications", icon: faFileAlt, label: "Applications" },
              { id: "offer-letter", icon: faFileAlt, label: "Offer Letter" },
              { id: "saved-jobs", icon: faHeart, label: "Saved Jobs" },
              { id: "profile", icon: faUser, label: "Profile" },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`flex items-center p-3 rounded-lg w-full text-left font-medium ${selectedTab === id
                  ? "bg-[#F0DEFD] text-[#7520A9]"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <FontAwesomeIcon icon={icon} className="w-5 h-5 mr-3" />
                {label}
              </button>
            ))}

            {/* Top Sectors Dropdown */}
            <div className="mt-2">
              <button
                onClick={() => setShowSectors(!showSectors)}
                className="flex items-center justify-between p-3 rounded-lg w-full font-medium text-gray-700 hover:bg-gray-100"
              >
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5 mr-3" />
                  Top Sectors
                </span>
                <FontAwesomeIcon icon={showSectors ? faChevronUp : faChevronDown} />
              </button>

              {showSectors && (
                <ul className="pl-8 mt-2 space-y-1">
                  {topSectors.map((sector, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 hover:text-[#7520A9] cursor-pointer"
                      onClick={() => handleTabClick(sector.id)}
                    >
                      • {sector.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </nav>

          {/* Support & Logout */}
          <div className="mt-6 space-y-2">
            <button
              onClick={() => handleTabClick("support")}
              className={`flex items-center p-3 rounded-lg w-full text-left font-medium ${selectedTab === "support"
                ? "bg-[#F0DEFD] text-[#7520A9]"
                : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              <FontAwesomeIcon icon={faLifeRing} className="w-5 h-5 mr-3" />
              Support
            </button>
            <button
              onClick={() => handleTabClick("logout")}
              className="flex items-center p-3 rounded-lg w-full text-left font-medium text-red-600 hover:bg-red-100"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>

          {/* Upgrade Box */}
          <div className="mt-6 p-4 bg-purple-100 rounded-lg">
            <h3 className="text-purple-700 text-sm font-semibold">UPGRADE TO PREMIUM</h3>
            <p className="text-xs text-gray-600 mt-1">
              Apply to more jobs and unlock premium benefits!
            </p>
            <button
              onClick={() => handleTabClick("premium")}
              className="mt-4 w-full bg-purple-700 text-white py-2 px-4 rounded-lg hover:bg-purple-800 transition"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
