//File: Sidebar.js

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faUser,
  faBriefcase,
  faPlus,
  faLifeRing,
  faEnvelope,
  faSignOutAlt,
  faFileAlt,
  faMoneyBillWave,
  faUsers,
  faCertificate,
  faFileInvoiceDollar,
} from "@fortawesome/free-solid-svg-icons";

import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";
import { useFeedback } from "../../../../context/FeedbackContext";
import { partnerFlowQuestions } from "../../../../components/FeedbackModal/questionSets";
import axios from "axios";

const Sidebar = ({ isOpen, onClose, isDesktopOpen = true }) => {
  const { handleSelectTab } = useTabContext();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = React.useState("your-job-posts");

  const { openFeedback } = useFeedback();

  const performLogout = async () => {
    const sessionId = localStorage.getItem("sessionId");
    const token = (() => {
      try { return JSON.parse(localStorage.getItem("userToken")); } catch { return null; }
    })();

    if (sessionId && token) {
      try {
        await axios.post(
          "/api/sessions/logout",
          { sessionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.warn("Logout session API failed:", err?.response?.data || err?.message || err);
      }
    }

    try {
      localStorage.removeItem("sessionId");
      localStorage.removeItem("userToken");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");
      localStorage.removeItem("partnerId");
      localStorage.removeItem("adminApproved");
    } catch (err) {
      console.warn("LocalStorage cleanup error:", err);
    }

    navigate("/partner/login");
  };

  const handleLogoutTrigger = async () => {
    const loginTime = Number(localStorage.getItem("loginTime"));
    const oneMinutePassed = !isNaN(loginTime) && (Date.now() - loginTime >= 60000);

    if (!oneMinutePassed) {
      return performLogout();
    }

    const sessionUser = JSON.parse(localStorage.getItem("userInfo")) || null;
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

  const handleTabClick = (tab) => {
    if (tab === "logout") {
      handleLogoutTrigger();
    } else {
      setSelectedTab(tab);
      handleSelectTab(tab);
      if (onClose) onClose();
    }
  };

  const menuItems = [
    { id: "your-job-posts", label: "Internship Posts", icon: faBriefcase },
    { id: "post-a-job", label: "Post An Internship", icon: faPlus },
    { id: "messages", label: "Messages", icon: faEnvelope },
    { id: "applications", label: "Applications", icon: faFileAlt },
    { id: "instructors", label: "Instructor Management", icon: faUsers },
    { id: "offer-templates", label: "Offer Templates", icon: faFileAlt },
    { id: "custom-internship-certificate", label: "Custom Internship Certificate", icon: faCertificate },
    { id: "stipend-details", label: "Stipend Details", icon: faMoneyBillWave },
    { id: "internship-payments", label: "Internship Payments", icon: faFileInvoiceDollar },
    { id: "profile", label: "Profile", icon: faUser },
  ];

  const actionItems = [
    { id: "support", icon: faLifeRing, label: "Support" },
    {
      id: "logout",
      icon: faSignOutAlt,
      label: "Logout",
      customTextColor: "text-teal-500",
      hoverBg: "hover:bg-teal-100",
    },
  ];

  const SidebarButton = ({ item }) => {
    const isSelected = selectedTab === item.id;
    const selectedColor = "bg-teal-100 text-teal-500";
    const defaultColor = "text-gray-700 hover:bg-gray-100";

    return (
      <button
        onClick={() => handleTabClick(item.id)}
        className={`flex items-center p-3 rounded-lg w-full text-left font-semibold ${
          isSelected ? selectedColor : defaultColor
        } ${item.hoverBg || "hover:bg-gray-100"}`}
      >
        <FontAwesomeIcon
          icon={item.icon}
          className={`w-5 h-5 mr-3 flex-shrink-0 ${isSelected ? "text-teal-500" : "text-gray-600"}`}
        />
        <span className={`${isSelected ? "text-teal-500" : "text-gray-700"}`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
    <div
        className={`
          fixed md:relative z-50 md:z-auto
          top-0 left-0
          bg-white shadow-lg font-poppins
          transition-all duration-300 ease-in-out
          flex flex-col overflow-hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          w-64
          ${!isDesktopOpen ? "md:w-14" : "md:w-64"}
        `}
        style={{ height: "calc(100vh - 96px)" }}
      >
        {/* Inner wrapper — fixed wide, parent clips it */}
        <div className="w-64 flex flex-col h-full">
          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <SidebarButton item={item} />
                </li>
              ))}
              {actionItems.map((item) => (
                <li key={item.id}>
                  <SidebarButton item={item} />
                </li>
              ))}
            </ul>
          </div>

          {/* Sticky bottom Upgrade box — only visible when open */}
          {isDesktopOpen && (
            <div className="p-4 bg-teal-100 rounded-lg m-3">
              <h3 className="text-teal-700 text-sm font-semibold">UPGRADE TO PREMIUM</h3>
              <p className="text-xs text-teal-600 mt-1">
                Your team has used 80% of your available space. Need more?
              </p>
              <button
                onClick={() => handleTabClick("upgrade")}
                className="mt-3 w-full bg-teal-700 text-white py-2 px-4 rounded-lg hover:bg-teal-800 transition"
              >
                Upgrade Plan
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};;

export default Sidebar;