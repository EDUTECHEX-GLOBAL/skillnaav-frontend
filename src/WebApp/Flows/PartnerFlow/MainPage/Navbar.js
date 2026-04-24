// frontend/src/WebApp/Flows/PartnerFlow/MainPage/Navbar.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignOutAlt, faBars } from "@fortawesome/free-solid-svg-icons";
import logo from "../../../../assets-webapp/Skillnaav-logo.png";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";
import axios from "../../../../api/axiosInstance";
import { io as ioClient } from "socket.io-client";

// Feedback
import { useFeedback } from "../../../../context/FeedbackContext";
import { partnerFlowQuestions } from "../../../../components/FeedbackModal/questionSets";

const Navbar = ({ onToggleSidebar }) => {
  useTabContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", planType: "", profileImage: "" });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { openFeedback } = useFeedback();

  // Read from localStorage on mount
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

  // Fetch premium status from backend and sync localStorage & state
  const fetchPremiumStatus = useCallback(async () => {
    try {
      // ✅ FIX 1: Login saves the token under the key "token" (plain string, no JSON).
      // The previous code used JSON.parse(localStorage.getItem("userToken")) which
      // (a) read the wrong key "userToken" and (b) unnecessarily JSON-parsed a plain string.
      const token = localStorage.getItem("token");
      if (!token) return;

      const { data } = await axios.get("/api/partners/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Accept flexible backend shape: { user: {...} } or the profile object directly
      const resp = data?.user ? data.user : data;
      if (!resp) return;

      const updatedUser = {
        ...JSON.parse(localStorage.getItem("userInfo") || "{}"),
        isPremium:         resp.isPremium,
        planType:          resp.planType,
        premiumExpiration: resp.premiumExpiration,
        name:              resp.name         ?? undefined,
        email:             resp.email        ?? undefined,
        profileImage:      resp.profileImage ?? undefined,
      };

      // Remove undefined keys so they don't accidentally overwrite existing values
      Object.keys(updatedUser).forEach((k) => updatedUser[k] === undefined && delete updatedUser[k]);

      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setUserInfo((prev) => ({ ...prev, ...updatedUser }));
    } catch (error) {
      console.error("Failed to fetch premium status:", error);
    }
  }, []);

  // Sync on mount, on tab focus, on localStorage change, and on custom partnerUpdated events
  useEffect(() => {
    fetchPremiumStatus();

    const onFocus = () => fetchPremiumStatus();
    window.addEventListener("focus", onFocus);

    const onStorage = (e) => {
      if (e.key === "userInfo") {
        try {
          const newVal = JSON.parse(e.newValue);
          if (newVal) setUserInfo(newVal);
        } catch (_) {}
      }
    };
    window.addEventListener("storage", onStorage);

    // Dispatched by PartnerPremiumPage (onApprove success) and by socket handler below
    const onPartnerUpdatedEvent = (e) => {
      try {
        const updated = e?.detail;
        if (updated) setUserInfo((prev) => ({ ...prev, ...updated }));
      } catch (_) {}
    };
    window.addEventListener("partnerUpdated", onPartnerUpdatedEvent);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("partnerUpdated", onPartnerUpdatedEvent);
    };
  }, [fetchPremiumStatus]);

  // ─── Real-time partner update listener (Socket.IO) ────────────────────────
  useEffect(() => {
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem("userInfo")); } catch { return null; }
    })();
    const partnerId = stored?._id;
    if (!partnerId) return;

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
    const socket = ioClient(SOCKET_URL, { withCredentials: true });

    const handleConnect = () => {
      socket.emit("joinPartnerRoom", { partnerId });
    };

    const onPartnerUpdated = (payload) => {
      try {
        if (!payload || payload.partnerId !== partnerId) return;

        const existing = (() => {
          try { return JSON.parse(localStorage.getItem("userInfo")) || {}; } catch { return {}; }
        })();
        const updated = {
          ...existing,
          isPremium:         payload.isPremium,
          planType:          payload.planType,
          premiumExpiration: payload.premiumExpiration,
        };

        localStorage.setItem("userInfo", JSON.stringify(updated));
        setUserInfo(updated);
        window.dispatchEvent(new CustomEvent("partnerUpdated", { detail: updated }));
      } catch (err) {
        console.error("Error handling partner:updated payload", err);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("partner:updated", onPartnerUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("partner:updated", onPartnerUpdated);
      socket.disconnect();
    };
  }, []);

  const handleUserClick = () => setIsDropdownOpen((prev) => !prev);

  // Actual logout — clears session and navigates away
  const performLogout = async () => {
    const sessionId = localStorage.getItem("sessionId");
    // ✅ FIX 2: Read token from the correct key "token" (plain string)
    const token = localStorage.getItem("token");

    if (sessionId && token) {
      try {
        await axios.post(
          "/api/sessions/logout",
          { sessionId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (err) {
        console.warn("Logout session API failed:", err?.response?.data || err?.message || err);
        // Continue with client-side logout regardless
      }
    }

    try {
      // ✅ FIX 3: Remove "token" (the key Login actually writes), not the non-existent "userToken"
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("adminApproved");
      localStorage.removeItem("partnerId");
      localStorage.removeItem("loginTime");
      sessionStorage.removeItem("partnerSelectedTab");
    } catch (err) {
      console.warn("LocalStorage cleanup error:", err);
    }

    navigate("/partner/login");
  };

  // When logout is clicked: gate behind feedback modal if required
  const handleLogoutTrigger = async () => {
    const loginTime = Number(localStorage.getItem("loginTime"));
    const oneMinutePassed = !isNaN(loginTime) && (Date.now() - loginTime >= 60000);

    if (!oneMinutePassed) {
      return performLogout();
    }

    const sessionUser = (() => {
      try { return JSON.parse(localStorage.getItem("userInfo")); } catch { return null; }
    })();
    const userId = sessionUser?._id;

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
      console.warn("Feedback check failed, opening modal anyway");
    }

    openFeedback({
      flow: "partner",
      questions: partnerFlowQuestions,
      triggerInfo: { type: "logout", page: window.location.pathname },
      user: sessionUser,
      postSubmitCallback: () => performLogout(),
    });
  };

  // Close dropdown when clicking outside
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
      {/* Left: Logo + hamburger */}
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="md:hidden text-gray-700 focus:outline-none">
          <FontAwesomeIcon icon={faBars} className="text-xl" />
        </button>
        <img src={logo} alt="Skillnaav Logo" className="h-14 w-auto object-contain" width="120" height="56" />
      </div>

      {/* Right: User info + dropdown */}
      <div className="relative flex items-center ml-auto">
        {userInfo.name && (
          <div className="flex flex-col items-end mr-3 min-w-[90px] min-h-[40px] justify-center">
            <span className="text-gray-800 text-sm">{userInfo.name}</span>
            <span
              className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full transition-opacity duration-200
                ${userInfo.planType ? "opacity-100" : "opacity-0"}
                ${
                  userInfo.planType === "Freemium"      ? "bg-gray-200 text-gray-700"     :
                  userInfo.planType === "Premium Basic" ? "bg-purple-200 text-purple-800" :
                  userInfo.planType === "Premium Plus"  ? "bg-orange-200 text-orange-800" :
                                                          "bg-gray-100 text-gray-500"
                }`}
            >
              {userInfo.planType || "Loading"}
            </span>
          </div>
        )}

        {/* Profile image / fallback icon */}
        <button onClick={handleUserClick} className="focus:outline-none ml-2 w-10 h-10 flex items-center justify-center flex-shrink-0">
          {userInfo.profileImage ? (
            <img src={userInfo.profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-300" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-500" />
            </div>
          )}
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div ref={dropdownRef} className="absolute right-0 top-10 mt-2 bg-white shadow-xl rounded-xl border border-gray-200 z-50 w-auto min-w-[20rem] max-w-[90vw]">
            {/* Profile header */}
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