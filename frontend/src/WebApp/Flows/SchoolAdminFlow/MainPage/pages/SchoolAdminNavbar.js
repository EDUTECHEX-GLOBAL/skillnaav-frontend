// frontend/src/WebApp/Flows/SchoolAdminFlow/SchoolAdminNavbar.jsx
import React from "react";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../../../../../assets-webapp/Skillnaav-logo.png";

// Feedback Context
import { useFeedback } from "../../../../../context/FeedbackContext";
import { schoolAdminFlowQuestions } from "../../../../../components/FeedbackModal/questionSets";

const SchoolAdminNavbar = ({ onLogout, onToggleSidebar }) => {
  const { openFeedback } = useFeedback();
  const navigate = useNavigate();

  const performLogout = () => {
    try {
      if (typeof onLogout === "function") {
        onLogout();
      }
    } catch (err) {
      console.warn("onLogout callback threw:", err);
    } finally {
      try {
        // remove both kinds of keys so session is cleaned whichever flow stored it
        localStorage.removeItem("userInfo");
        localStorage.removeItem("userToken");
        localStorage.removeItem("schoolAdminProfile");
        localStorage.removeItem("schoolAdminId");
        localStorage.removeItem("schoolAdminToken");
      } catch (e) {}
      // SPA navigation - no hard reload
      navigate("/schooladmin/login");
    }
  };

const handleLogoutClick = async () => {
  // parse loginTime from either storage (covers both patterns)
  const parseLoginValue = (v) => {
    if (v === null || v === undefined) return NaN;
    const n = Number(String(v));
    return Number.isFinite(n) ? n : NaN;
  };

  const rawLocal = localStorage.getItem("loginTime");
  const rawSession = sessionStorage.getItem("loginTime");
  const loginTimeLocal = parseLoginValue(rawLocal);
  const loginTimeSession = parseLoginValue(rawSession);
  const loginTime = !Number.isNaN(loginTimeLocal) ? loginTimeLocal : loginTimeSession;
  const oneMinutePassed = !Number.isNaN(loginTime) && (Date.now() - loginTime >= 60000);

  // If less than 1 minute (or missing) => immediate logout
  if (!oneMinutePassed) {
    return performLogout();
  }

  // --- Resolve admin identity (same logic you had) ---
  const rawUserInfo = localStorage.getItem("userInfo");
  const parsedUserInfo = rawUserInfo ? JSON.parse(rawUserInfo) : null;

  const rawSchoolProfile = localStorage.getItem("schoolAdminProfile");
  const parsedSchoolProfile = rawSchoolProfile ? JSON.parse(rawSchoolProfile) : null;

  const schoolAdminIdKey = localStorage.getItem("schoolAdminId");
  const userTokenKey = localStorage.getItem("userToken");
  const schoolAdminTokenKey = localStorage.getItem("schoolAdminToken");

  const adminId =
    (parsedUserInfo && (parsedUserInfo._id || parsedUserInfo.id || parsedUserInfo.userId)) ||
    (parsedSchoolProfile && (parsedSchoolProfile._id || parsedSchoolProfile.id)) ||
    schoolAdminIdKey ||
    null;

  const adminName =
    (parsedUserInfo && (parsedUserInfo.name || parsedUserInfo.schoolName || parsedUserInfo.displayName)) ||
    (parsedSchoolProfile && (parsedSchoolProfile.schoolName || parsedSchoolProfile.name)) ||
    null;

  const adminEmail =
    (parsedUserInfo && (parsedUserInfo.email || parsedUserInfo.schoolEmail || parsedUserInfo.contactEmail)) ||
    (parsedSchoolProfile && (parsedSchoolProfile.email || parsedSchoolProfile.contactEmail)) ||
    null;

  const snapshot = {
    _id: adminId,
    name: adminName,
    email: adminEmail,
  };

  // If no id -> open modal and always logout when modal closes (or submitted)
  if (!adminId) {
    openFeedback({
      flow: "schoolAdmin",
      questions: schoolAdminFlowQuestions,
      triggerInfo: { type: "logout", page: window.location.pathname },

      user: snapshot,
      userId: null,
      userName: adminName,
      userEmail: adminEmail,

      // UNCONDITIONAL logout on modal close/submit
      postSubmitCallback: () => performLogout(),
    });
    return;
  }

  // We have an ID — check duplicate (server expects userId)
  try {
    const { data } = await axios.get("/api/feedback/check", {
      params: { userId: adminId, flow: "schoolAdmin" },
    });

    if (data?.alreadySubmitted) {
      // already submitted -> logout immediately
      performLogout();
      return;
    }
  } catch (err) {
    // If check fails, open the modal anyway (fail-open)
    console.warn("Feedback check failed — opening modal:", err?.message || err);
  }

  // Open modal and always logout when it closes/submits
  openFeedback({
    flow: "schoolAdmin",
    questions: schoolAdminFlowQuestions,
    triggerInfo: { type: "logout", page: window.location.pathname },

    user: snapshot,
    userId: adminId,
    userName: adminName,
    userEmail: adminEmail,

    // UNCONDITIONAL logout on modal close/submit
    postSubmitCallback: () => performLogout(),
  });
};



  return (
    <header className="bg-white shadow px-4 py-4 flex items-center justify-between border-b font-poppins">
      <div className="flex items-center">
        <button onClick={onToggleSidebar} className="text-gray-600 md:hidden mr-4">
          <FaBars className="text-xl" />
        </button>

        <img src={logo} alt="SkillNaav Logo" className="h-10 w-auto" />
      </div>

      <button
        onClick={handleLogoutClick}
        type="button"
        className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
      >
        <FaSignOutAlt className="mr-2" />
        Logout
      </button>
    </header>
  );
};

export default SchoolAdminNavbar;
