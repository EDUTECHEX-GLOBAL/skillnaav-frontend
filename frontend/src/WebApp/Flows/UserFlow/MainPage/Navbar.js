// Navbar.jsx (updated & cleaned)
import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faSignOutAlt,
  faBell,
  faBars,
  faCrown
} from "@fortawesome/free-solid-svg-icons";
import logo from "../../../../assets-webapp/Skillnaav-logo.png";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Feedback Context (clean: removed feedbackOpen)
import { useFeedback } from "../../../../context/FeedbackContext";
import { userFlowQuestions } from "../../../../components/FeedbackModal/questionSets";

const Navbar = ({ onToggleSidebar }) => {
  const { handleSelectTab } = useTabContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({ name: "", email: "", profileImage: "" });
  const [planType, setPlanType] = useState("Free");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  // From Feedback Context
  const { openFeedback } = useFeedback();

useEffect(() => {
  const rawUserInfo = localStorage.getItem("userInfo");
  if (!rawUserInfo) return;

  let storedUserInfo;
  try {
    storedUserInfo = JSON.parse(rawUserInfo);
  } catch (err) {
    console.error("Invalid userInfo in storage");
    return;
  }

  if (!storedUserInfo?._id) return;

  setUserInfo(storedUserInfo);
  setPlanType(storedUserInfo.planType || "Free");

  const studentId = storedUserInfo._id;

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`/api/notifications/${studentId}`);
      if (data?.success) {
        const unread = data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchPremiumStatus = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;

      const { data } = await axios.get("/api/users/premium-status", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!data?.user) return;

      const updatedUser = {
        ...storedUserInfo,
        isPremium: data.user.isPremium,
        planType: data.user.planType,
        premiumExpiration: data.user.premiumExpiration
      };

      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setPlanType(data.user.planType);
      setIsPremium(data.user.isPremium);
    } catch (err) {
      console.error("Failed to fetch premium status:", err);
    }
  };

  fetchNotifications();
  fetchPremiumStatus();
}, []);

useEffect(() => {
  const syncUserInfo = () => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setUserInfo(parsed);
      setPlanType(parsed.planType || "Free");
    } catch {
      console.error("Failed to sync userInfo");
    }
  };

  window.addEventListener("storage", syncUserInfo);

  return () => {
    window.removeEventListener("storage", syncUserInfo);
  };
}, []);


  const handleUserClick = () => setIsDropdownOpen(!isDropdownOpen);

  /* ---- performLogout declared first (prevents TDZ) ---- */
  const performLogout = async () => {
    const sessionId = localStorage.getItem("sessionId");
   const token = localStorage.getItem("userToken");


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
        console.error("Logout session error:", error.response?.data || error.message);
      }
    }

    localStorage.clear();
    navigate("/user/login");
  };

  /* Logout flow with Feedback (now includes 1-minute gating + safe callback) */
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const planStyles = {
    "Premium Plus": "bg-gradient-to-r from-orange-400 to-orange-600 text-white",
    "Premium Basic": "bg-gradient-to-r from-purple-500 to-purple-700 text-white",
    Free: "bg-gray-200 text-gray-700",
  };

  return (
    <div className="bg-white font-poppins border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center space-x-4">
          <button onClick={onToggleSidebar} className="text-gray-700 md:hidden">
            <FontAwesomeIcon icon={faBars} className="text-xl" />
          </button>
          <img src={logo} alt="Skillnaav Logo" className="h-12" />
        </div>

        <div className="relative flex items-center space-x-5">
          <div
            className="relative cursor-pointer group"
            onClick={() => handleSelectTab("notifications")}
          >
            <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-gray-700 hover:text-purple-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="relative" onClick={handleUserClick}>
            {userInfo.profileImage ? (
              <img
                src={userInfo.profileImage}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover cursor-pointer shadow-md border-2 border-purple-300 hover:scale-105"
              />
            ) : (
              <FontAwesomeIcon icon={faUser} className="w-8 h-8 text-gray-800 cursor-pointer" />
            )}
          </div>

          <div className="hidden sm:flex flex-col items-start">
            <span className="text-gray-800 text-sm font-semibold">{userInfo.name}</span>
            <span className={`text-xs font-semibold rounded-full px-2 py-0.5 mt-1 flex items-center gap-1 ${planStyles[planType]}`}>
              <FontAwesomeIcon icon={faCrown} className="text-[10px]" />
              {planType}
            </span>
          </div>

          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-16 mt-2 bg-white shadow-xl rounded-xl border border-gray-200 z-50 w-auto min-w-[20rem]"
            >
              <div className="px-4 py-3 border-b rounded-t-xl">
                <div className="flex items-center gap-2 text-black">
                  <img
                    src={require("../../../../assets-webapp/user-logo.svg").default}
                    alt="User Logo"
                    className="h-7 w-7"
                  />
                  <span className="text-sm font-medium">{userInfo.email}</span>
                </div>
              </div>

              <button
                onClick={handleLogoutTrigger}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
