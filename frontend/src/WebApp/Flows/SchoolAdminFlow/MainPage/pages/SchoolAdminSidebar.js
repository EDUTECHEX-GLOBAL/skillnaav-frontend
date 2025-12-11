import React from "react";
import {
  FaHome,
  FaUserGraduate,
  FaBriefcase,
  FaCreditCard,
  FaSignOutAlt,
  FaIdCard,
  FaBook,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Feedback Context (same paths used in your Navbar)
import { useFeedback } from "../../../../../context/FeedbackContext";
import { schoolAdminFlowQuestions } from "../../../../../components/FeedbackModal/questionSets";

const SchoolAdminSidebar = ({ selectedTab, setSelectedTab, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { openFeedback } = useFeedback();

  // performLogout declared first (avoid TDZ)
  const performLogout = async () => {
    try {
      // try server logout if you keep sessionId/token by other flows (non-blocking)
      const sessionId = localStorage.getItem("sessionId");
      const token = localStorage.getItem("userToken") || localStorage.getItem("schoolAdminToken");
      if (sessionId && token) {
        try {
          await axios.post(
            "/api/sessions/logout",
            { sessionId },
            { headers: { Authorization: token ? `Bearer ${JSON.parse(token)}` : "" } }
          );
        } catch (err) {
          // don't block client-side logout
          console.warn("Session logout request failed:", err?.message || err);
        }
      }
    } catch (err) {
      // noop
    } finally {
      // clear relevant keys (keep other app-wide keys intact)
      try {
        localStorage.removeItem("sessionId");
        localStorage.removeItem("userToken");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("schoolAdminToken");
        localStorage.removeItem("schoolAdminId");
        localStorage.removeItem("schoolAdminProfile");
        // Optionally remove loginTime if you want:
        localStorage.removeItem("loginTime");
      } catch (e) {
        console.warn("LocalStorage cleanup error:", e);
      }
      // navigate to schooladmin login
      navigate("/schooladmin/login");
    }
  };

  const handleLogoutTrigger = async () => {
    // parse loginTime from either localStorage or sessionStorage
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

    // Immediate logout if less than 1 minute (or missing)
    if (!oneMinutePassed) {
      return performLogout();
    }

    // Resolve admin identity from multiple sources
    const rawUserInfo = localStorage.getItem("userInfo");
    const parsedUserInfo = rawUserInfo ? JSON.parse(rawUserInfo) : null;

    const rawSchoolProfile = localStorage.getItem("schoolAdminProfile");
    const parsedSchoolProfile = rawSchoolProfile ? JSON.parse(rawSchoolProfile) : null;

    const schoolAdminIdKey = localStorage.getItem("schoolAdminId");

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

    const snapshot = { _id: adminId, name: adminName, email: adminEmail };

    // If no id -> open modal and always logout when modal closes/submits
    if (!adminId) {
      openFeedback({
        flow: "schoolAdmin",
        questions: schoolAdminFlowQuestions,
        triggerInfo: { type: "logout", page: window.location.pathname },
        user: snapshot,
        userId: null,
        userName: adminName,
        userEmail: adminEmail,
        // UNCONDITIONAL logout when modal closes or is submitted
        postSubmitCallback: () => performLogout(),
      });
      return;
    }

    // If we have an ID, check backend if already submitted
    try {
      const resp = await axios.get("/api/feedback/check", {
        params: { userId: adminId, flow: "schoolAdmin" },
      });
      if (resp.data?.alreadySubmitted) {
        // already submitted — logout immediately
        return performLogout();
      }
    } catch (err) {
      // Fail-open: open modal anyway
      console.warn("Feedback check failed; opening modal anyway:", err?.message || err);
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
      postSubmitCallback: () => performLogout(),
    });
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${isOpen ? "block" : "hidden"}`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`
          fixed z-50 inset-y-0 left-0 w-64 bg-white shadow-md border-r transform
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:flex
        `}
      >
        <div className="flex flex-col justify-between h-full">
          {/* Top Section */}
          <div className="p-6">
            <nav className="flex flex-col gap-2">
              <SidebarItem
                label="Dashboard"
                icon={<FaHome />}
                active={selectedTab === "dashboard"}
                onClick={() => {
                  setSelectedTab("dashboard");
                  onClose?.();
                }}
              />
              <SidebarItem
                label="Students"
                icon={<FaUserGraduate />}
                active={selectedTab === "students"}
                onClick={() => {
                  setSelectedTab("students");
                  onClose?.();
                }}
              />
              <SidebarItem
                label="Upload Students"
                icon={<FaUserGraduate />}
                active={selectedTab === "upload-students"}
                onClick={() => {
                  setSelectedTab("upload-students");
                  onClose?.();
                }}
              />
              <SidebarItem
                label="Internship & Applications"
                icon={<FaBriefcase />}
                active={selectedTab === "internships"}
                onClick={() => {
                  setSelectedTab("internships");
                  onClose?.();
                }}
              />
              <SidebarItem
                label="Subscriptions"
                icon={<FaCreditCard />}
                active={selectedTab === "subscriptions"}
                onClick={() => {
                  setSelectedTab("subscriptions");
                  onClose?.();
                }}
              />
              <SidebarItem
                label="Profile"
                icon={<FaIdCard />}
                active={selectedTab === "profile"}
                onClick={() => {
                  setSelectedTab("profile");
                  onClose?.();
                }}
              />
              {/* <SidebarItem
                label="Curriculum"
                icon={<FaBook />}
                active={selectedTab === "curriculum"}
                onClick={() => setSelectedTab("curriculum")}
              /> */}
            </nav>
          </div>

          {/* Bottom Section */}
          <div className="p-4 border-t text-sm">
            {/* Premium + Logout */}
            <button
              onClick={() => {
                handleLogoutTrigger();
                if (onClose) onClose();
              }}
              className="flex items-center justify-center text-red-600 font-medium mt-4 hover:underline w-full"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const SidebarItem = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-start w-full px-4 py-2 rounded-md text-sm font-bold transition-all duration-150 ${active ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-blue-50"
      }`}
  >
    <span className="mt-0 mr-4 text-base">{icon}</span>
    <span className="leading-snug text-left break-words whitespace-normal">{label}</span>
  </button>
);

export default SchoolAdminSidebar;
