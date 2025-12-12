// frontend/src/WebApp/Flows/PartnerFlow/MainPage/Navbar.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignOutAlt, faBars } from "@fortawesome/free-solid-svg-icons";
import logo from "../../../../assets-webapp/Skillnaav-logo.png";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io as ioClient } from "socket.io-client";

// Feedback
import { useFeedback } from "../../../../context/FeedbackContext";
// adjust this path if your questionSets file is elsewhere
import { partnerFlowQuestions } from "../../../../components/FeedbackModal/questionSets";

const Navbar = ({ onToggleSidebar }) => {
  const { fine } = useTabContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", planType: "", profileImage: "" });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Feedback context
  const { openFeedback } = useFeedback();

  // Read from localStorage on mount (initial load)
  useEffect(() => {
    try {
      const storedUserInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (storedUserInfo) {
        setUserInfo(storedUserInfo);
      }
    } catch (err) {
      console.warn("Failed reading userInfo from localStorage", err);
    }
  }, []);

  // Fetch premium status from backend and update localStorage & state
  const fetchPremiumStatus = useCallback(async () => {
    try {
      const token = (() => {
        try { return JSON.parse(localStorage.getItem("userToken")); } catch { return null; }
      })();
      if (!token) return;

      const { data } = await axios.get("/api/users/premium-status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Accept flexible backend shape: { user: {...} } or just {...}
      const resp = data?.user ? data.user : data;
      if (!resp) return;

      const updatedUser = {
        ...JSON.parse(localStorage.getItem("userInfo") || "{}"),
        isPremium: resp.isPremium,
        planType: resp.planType,
        premiumExpiration: resp.premiumExpiration,
        // include other fields if you want to keep them in sync (e.g., profileImage, name, email)
        name: resp.name ?? undefined,
        email: resp.email ?? undefined,
        profileImage: resp.profileImage ?? undefined,
      };

      // Clean undefined props so they don't overwrite existing values accidentally
      Object.keys(updatedUser).forEach((k) => updatedUser[k] === undefined && delete updatedUser[k]);

      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setUserInfo((prev) => ({ ...prev, ...updatedUser }));
    } catch (error) {
      console.error("Failed to fetch premium status:", error);
    }
  }, []);

  // Sync on mount, on focus (useful after payment redirect), when localStorage changes (other tabs or flows),
  // and listen for custom 'partnerUpdated' events dispatched by socket handler.
  useEffect(() => {
    fetchPremiumStatus();

    // Refresh when user returns to the tab (after payment redirect)
    const onFocus = () => {
      fetchPremiumStatus();
    };
    window.addEventListener("focus", onFocus);

    // Sync if localStorage is changed in another tab or some other code writes to userInfo
    const onStorage = (e) => {
      if (e.key === "userInfo") {
        try {
          const newVal = JSON.parse(e.newValue);
          if (newVal) setUserInfo(newVal);
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener("storage", onStorage);

    // Listen for custom partnerUpdated events (dispatched by socket handler on same tab)
    const onPartnerUpdatedEvent = (e) => {
      try {
        const updated = e?.detail;
        if (updated) setUserInfo((prev) => ({ ...prev, ...updated }));
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("partnerUpdated", onPartnerUpdatedEvent);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("partnerUpdated", onPartnerUpdatedEvent);
    };
  }, [fetchPremiumStatus]);

  // ----------------------------
  // Real-time partner downgrade listener (Socket.IO)
  // ----------------------------
  useEffect(() => {
    // Get partner id from stored userInfo
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem("userInfo")); } catch { return null; }
    })();
    const partnerId = stored?._id;
    if (!partnerId) return; // no partner logged in

    // Prefer explicit env variable; fallback to same-origin with port 5000
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || `http://localhost:5000`;

    const socket = ioClient(SOCKET_URL, { withCredentials: true });

    const handleConnect = () => {
      socket.emit("joinPartnerRoom", { partnerId });
    };

    const onPartnerUpdated = (payload) => {
      try {
        if (!payload || payload.partnerId !== partnerId) return;

        // Merge with existing userInfo
        const existing = (() => { try { return JSON.parse(localStorage.getItem("userInfo")) || {}; } catch { return {}; } })();
        const updated = {
          ...existing,
          isPremium: payload.isPremium,
          planType: payload.planType,
          premiumExpiration: payload.premiumExpiration,
        };

        // Persist + update state + notify other listeners
        localStorage.setItem("userInfo", JSON.stringify(updated));
        setUserInfo(updated);
        window.dispatchEvent(new CustomEvent("partnerUpdated", { detail: updated }));
      } catch (err) {
        console.error("Error handling partner:updated payload", err);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("partner:updated", onPartnerUpdated);

    // cleanup on unmount
    return () => {
      socket.off("connect", handleConnect);
      socket.off("partner:updated", onPartnerUpdated);
      socket.disconnect();
    };
  }, []);

  const handleUserClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // actual logout action (clears session & navigates)
  const performLogout = async () => {
    const sessionId = localStorage.getItem("sessionId");
    const token = (() => {
      try { return JSON.parse(localStorage.getItem("userToken")); } catch { return null; }
    })();

    if (sessionId && token) {
      try {
        await axios.post("/api/sessions/logout", { sessionId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn("Logout session API failed:", err?.response?.data || err?.message || err);
        // continue with client-side logout anyway
      }
    }

    try {
      localStorage.removeItem("sessionId");
      localStorage.removeItem("userToken");
      localStorage.removeItem("userInfo");
    } catch (err) {
      console.warn("LocalStorage cleanup error:", err);
    }

    navigate("/partner/login");
  };

  // When logout clicked: check feedback and open modal if required (partner flow)
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
    const userId = sessionUser?._id;

    // If userId missing, open feedback with null user and perform logout in callback
    if (!userId) {
      openFeedback({
        flow: "partner",
        questions: partnerFlowQuestions,
        triggerInfo: { type: "logout", page: window.location.pathname },
        user: null,
        postSubmitCallback: () => performLogout(),
      });
      return;
    }

    try {
      const resp = await axios.get("/api/feedback/check", {
        params: { userId, flow: "partner" },
      });

      if (resp.data?.alreadySubmitted) {
        performLogout();
        return;
      }
    } catch (err) {
      console.warn("Feedback check failed, opening modal");
    }

    openFeedback({
      flow: "partner",
      questions: partnerFlowQuestions,
      triggerInfo: { type: "logout", page: window.location.pathname },
      user: sessionUser,
      postSubmitCallback: () => performLogout(),
    });
  };


  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white font-poppins text-gray-800 py-5 px-4 border-b border-gray-300 sticky top-0 z-50 flex justify-between items-center">
      {/* Left Section: Logo + Hamburger */}
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="md:hidden text-gray-700 focus:outline-none">
          <FontAwesomeIcon icon={faBars} className="text-xl" />
        </button>
        <img src={logo} alt="Skillnaav Logo" className="h-14 object-contain" />
      </div>

      {/* Right Section: User info + Dropdown */}
      <div className="relative flex items-center ml-auto">
        {userInfo.name && (
          <div className="flex flex-col items-end mr-3">
            <span className="text-gray-800 text-sm">{userInfo.name}</span>

            {userInfo.planType && (
              <span className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                userInfo.planType === "Freemium"
                  ? "bg-gray-200 text-gray-700"
                  : userInfo.planType === "Premium Basic"
                  ? "bg-purple-200 text-purple-800"
                  : userInfo.planType === "Premium Plus"
                  ? "bg-orange-200 text-orange-800"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {userInfo.planType}
              </span>
            )}
          </div>
        )}

        {/* Profile Image / Fallback Icon */}
        <button onClick={handleUserClick} className="focus:outline-none ml-2">
          {userInfo.profileImage ? (
            <img src={userInfo.profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-300" />
          ) : (
            <FontAwesomeIcon icon={faUser} className="w-6 h-6 text-gray-800" />
          )}
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div ref={dropdownRef} className="absolute right-0 top-10 mt-2 bg-white shadow-xl rounded-xl border border-gray-200 z-50 w-auto min-w-[20rem] max-w-[90vw]">
            {/* Email / Profile Header */}
            <div className="px-4 py-3 border-b rounded-t-xl bg-white">
              <div className="flex items-center gap-3 text-black">
                <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-300">
                  {userInfo.profileImage ? (
                    <img src={userInfo.profileImage} alt="User" className="h-full w-full object-cover" />
                  ) : (
                    <FontAwesomeIcon icon={faUser} className="text-gray-600 w-full h-full p-3" />
                  )}
                </div>

                <span className="block text-sm font-medium whitespace-nowrap" title={userInfo.email}>
                  {userInfo.email}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogoutTrigger}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition rounded-b-xl"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
              </div>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
