import React, { useCallback, useTransition } from "react";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../../../../../assets-webapp/Skillnaav-logo.png";
import { useFeedback } from "../../../../../context/FeedbackContext";
import { schoolAdminFlowQuestions } from "../../../../../components/FeedbackModal/questionSets";

const SchoolAdminNavbar = React.memo(({ onLogout, onToggleSidebar }) => {
  const { openFeedback } = useFeedback();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const performLogout = useCallback(() => {
    try {
      if (typeof onLogout === "function") onLogout();
    } catch (err) {
      console.warn("onLogout callback threw:", err);
    } finally {
      try {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("userToken");
        localStorage.removeItem("schoolAdminProfile");
        localStorage.removeItem("schoolAdminId");
        localStorage.removeItem("schoolAdminToken");
      } catch (e) {}
      navigate("/schooladmin/login");
    }
  }, [onLogout, navigate]);

  const handleLogoutClick = useCallback(() => {
    // ✅ useTransition defers heavy work off the main thread
    // so the click feels instant (INP improvement)
    startTransition(async () => {
      const parseLoginValue = (v) => {
        if (v === null || v === undefined) return NaN;
        const n = Number(String(v));
        return Number.isFinite(n) ? n : NaN;
      };

      const loginTime =
        parseLoginValue(localStorage.getItem("loginTime")) ||
        parseLoginValue(sessionStorage.getItem("loginTime"));
      const oneMinutePassed =
        !Number.isNaN(loginTime) && Date.now() - loginTime >= 60000;

      if (!oneMinutePassed) return performLogout();

      const parsedUserInfo = (() => {
        try { return JSON.parse(localStorage.getItem("userInfo")); } catch { return null; }
      })();
      const parsedSchoolProfile = (() => {
        try { return JSON.parse(localStorage.getItem("schoolAdminProfile")); } catch { return null; }
      })();

      const adminId =
        parsedUserInfo?._id || parsedUserInfo?.id ||
        parsedSchoolProfile?._id || parsedSchoolProfile?.id ||
        localStorage.getItem("schoolAdminId") || null;

      const snapshot = {
        _id: adminId,
        name: parsedUserInfo?.name || parsedSchoolProfile?.schoolName || null,
        email: parsedUserInfo?.email || parsedSchoolProfile?.email || null,
      };

      if (!adminId) {
        openFeedback({
          flow: "schoolAdmin",
          questions: schoolAdminFlowQuestions,
          triggerInfo: { type: "logout", page: window.location.pathname },
          user: snapshot,
          postSubmitCallback: () => performLogout(),
        });
        return;
      }

      try {
        const { data } = await axios.get("/api/feedback/check", {
          params: { userId: adminId, flow: "schoolAdmin" },
        });
        if (data?.alreadySubmitted) return performLogout();
      } catch (err) {
        console.warn("Feedback check failed:", err?.message);
      }

      openFeedback({
        flow: "schoolAdmin",
        questions: schoolAdminFlowQuestions,
        triggerInfo: { type: "logout", page: window.location.pathname },
        user: snapshot,
        postSubmitCallback: () => performLogout(),
      });
    });
  }, [performLogout, openFeedback]);

  return (
    <header className="bg-white shadow px-4 py-4 flex items-center justify-between border-b font-poppins">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="text-gray-600 md:hidden mr-4"
          aria-label="Toggle sidebar"
        >
          <FaBars className="text-xl" />
        </button>
        {/* ✅ Fixed dimensions prevent layout shift */}
        <img
          src={logo}
          alt="SkillNaav Logo"
          className="h-10 w-auto"
          width="120"
          height="40"
        />
      </div>

      <button
        onClick={handleLogoutClick}
        type="button"
        disabled={isPending}
        className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-70 transition-opacity"
      >
        <FaSignOutAlt className="mr-2" />
        {isPending ? "Logging out..." : "Logout"}
      </button>
    </header>
  );
});

export default SchoolAdminNavbar;