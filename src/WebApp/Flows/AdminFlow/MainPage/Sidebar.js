import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUsers,
  faClipboardList,
  faChevronDown,
  faUniversity,
  faChartBar,
  faCogs,
  faTrash,
  faSignOutAlt,
  faBuilding,
  faBriefcase,
  faCreditCard // ✅ New icon for payments
} from "@fortawesome/free-solid-svg-icons";
import logo from "../../../../assets-webapp/Skillnaav-logo.png";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";



const navItems = [
  { key: "home", icon: faHome, label: "Dashboard" },
  { key: "user-management", icon: faUsers, label: "User Management" },
  { key: "school-accounts", icon: faUniversity, label: "School Admin Accounts" },
  { key: "analytics", icon: faChartBar, label: "Analytics" },
  { key: "settings", icon: faCogs, label: "Settings" },
  { key: "bin", icon: faTrash, label: "Bin" },
];

const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
  const [tab, setTab] = useState("home");
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false); // ✅ New state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { handleSelectTab } = useTabContext();
  const nav = useNavigate();

  const clickTab = (key) => {
    if (key === "logout") {
      localStorage.removeItem("userInfo");
      nav("/admin/login");
    } else {
      setTab(key);
      handleSelectTab(key);
    }
    setSidebarOpen(false);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}  
        lg:translate-x-0 lg:static lg:shadow-none`}
    >
      {/* Fixed Logo */}
      <div className="flex justify-center items-center h-20 border-b sticky top-0 bg-white z-10">
        <img src={logo} alt="Logo" className="h-14" />
      </div>

      {/* Scrollable content */}
      <div className="flex flex-col h-[calc(100%-5rem)] p-4 overflow-y-auto scrollbar-hide">
        <nav className="flex-1">
          <ul className="space-y-3">
            {navItems.slice(0, 2).map(({ key, icon, label }) => (
              <li key={key}>
                <button
                  onClick={() => clickTab(key)}
                  className={`flex items-center w-full p-2 rounded-lg text-left font-medium ${tab === key
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <FontAwesomeIcon icon={icon} className="w-5 h-5 mr-3" />
                  {label}
                </button>
              </li>
            ))}

            {/* Partner Management */}
            <li>
              <button
                onClick={() => setPartnerOpen((v) => !v)}
                className="flex items-center justify-between w-full p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5 mr-3" />
                  <p className="font-medium">Partner Management</p>
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`${partnerOpen ? "rotate-180" : ""} transform`}
                />
              </button>
              {partnerOpen && (
                <ul className="ml-6 mt-1 space-y-2">
                  <li>
                    <button
                      onClick={() => clickTab("partner-accounts")}
                      className={`flex items-center w-full p-2 rounded-lg font-medium ${tab === "partner-accounts"
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 mr-2" />
                      Partner Accounts
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => clickTab("internship-posts")}
                      className={`flex items-center w-full p-2 rounded-lg font-medium ${tab === "internship-posts"
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <FontAwesomeIcon icon={faBriefcase} className="w-4 h-4 mr-2" />
                      Internship Posts
                    </button>
                  </li>
                </ul>
              )}
            </li>

            {/* ✅ Payment Management */}
            <li>
              <button
                onClick={() => setPaymentOpen((v) => !v)}
                className="flex items-center justify-between w-full p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 mr-3" />
                  <p className="font-medium">Payment Management</p>
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`${paymentOpen ? "rotate-180" : ""} transform`}
                />
              </button>
              {paymentOpen && (
                <ul className="ml-6 mt-1 space-y-2">
                  <li>
                    <button
                      onClick={() => clickTab("internship-payments")}
                      className={`flex items-center w-full p-2 rounded-lg font-medium ${tab === "internship-payments"
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      Internship Payments
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => clickTab("partner-payments")}
                      className={`flex items-center w-full p-2 rounded-lg font-medium ${tab === "partner-payments"
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      Partner Payments
                    </button>
                  </li>
                </ul>
              )}
            </li>

            {/* ✅ Feedback Management */}
<li>
  <button
    onClick={() => setFeedbackOpen((v) => !v)}
    className="flex items-center justify-between w-full p-2 rounded-lg text-gray-700 hover:bg-gray-100"
  >
    <span className="flex items-center">
      <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5 mr-3" />
      <p className="font-medium">Feedback Management</p>
    </span>
    <FontAwesomeIcon
      icon={faChevronDown}
      className={`${feedbackOpen ? "rotate-180" : ""} transform`}
    />
  </button>

  {feedbackOpen && (
    <ul className="ml-6 mt-1 space-y-2">
      <li>
        <button
          onClick={() => clickTab("feedback-list")}
          className={`flex items-center w-full p-2 rounded-lg font-medium ${
            tab === "feedback-list"
              ? "bg-blue-100 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          All Feedback
        </button>
      </li>

      <li>
        <button
          onClick={() => clickTab("user-feedback")}
          className={`flex items-center w-full p-2 rounded-lg font-medium ${
            tab === "user-feedback"
              ? "bg-blue-100 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          User Feedback
        </button>
      </li>

      <li>
        <button
          onClick={() => clickTab("partner-feedback")}
          className={`flex items-center w-full p-2 rounded-lg font-medium ${
            tab === "partner-feedback"
              ? "bg-blue-100 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Partner Feedback
        </button>
      </li>

      <li>
        <button
          onClick={() => clickTab("school-feedback")}
          className={`flex items-center w-full p-2 rounded-lg font-medium ${
            tab === "school-feedback"
              ? "bg-blue-100 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          School Admin Feedback
        </button>
      </li>
    </ul>
  )}
</li>


            {/* Remaining Nav Items */}
            {navItems.slice(2).map(({ key, icon, label }) => (
              <li key={key}>
                <button
                  onClick={() => clickTab(key)}
                  className={`flex items-center w-full p-2 rounded-lg text-left font-medium ${tab === key
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <FontAwesomeIcon icon={icon} className="w-5 h-5 mr-3" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <button
          onClick={() => clickTab("logout")}
          className="mt-4 flex items-center w-full p-2 rounded-lg text-red-600 hover:bg-red-100 font-medium"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
