import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome, faPlane, faSearch, faFileAlt, faHeart, faUser,
  faLifeRing, faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";
import logo from "../../../../assets-webapp/Skillnaav-logo.png";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Sidebar = ({ isMobile, isOpen, onClose }) => {
  const [selectedTab, setSelectedTab] = useState("home");
  const { handleSelectTab } = useTabContext();
  const navigate = useNavigate();

  const handleTabClick = async (tab) => {
    if (tab === "logout") {
      await handleLogout();
    } else {
      setSelectedTab(tab);
      handleSelectTab(tab);
      if (isMobile && onClose) onClose();
    }
  };

  const handleLogout = async () => {
    const sessionId = localStorage.getItem("sessionId");
    const token = JSON.parse(localStorage.getItem("userToken"));
    if (sessionId && token) {
      try {
        await axios.post("/api/sessions/logout", { sessionId }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("Logout failed:", error.response?.data || error.message);
      }
    }

    localStorage.removeItem("sessionId");
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    navigate("/user/login");
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
        className={`fixed md:sticky top-0
    h-screen w-64 bg-white shadow-lg font-poppins
    z-[100] md:z-10
    transform transition-transform duration-300 ease-in-out
    ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
  `}
      >

        {/* Fixed logo (only for desktop) */}
        <div className="hidden md:flex items-center justify-center h-20 border-b border-gray-200 sticky top-0 z-20 bg-white">
          <img src={logo} alt="Skillnaav Logo" className="h-12 object-contain" />
        </div>

        {/* Scrollable content with hidden scrollbar */}
        <div className="h-[calc(100%-5rem)] overflow-y-auto px-4 pt-4 pb-6 hide-scrollbar">
          {/* Navigation items */}
          <nav className="space-y-2">
            {[
              { id: "home", icon: faHome, label: "HomePage" },
              { id: "aeronautical-jobs", icon: faPlane, label: "Aeronautical Jobs" },
              { id: "searchbar", icon: faSearch, label: "Search" },
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
