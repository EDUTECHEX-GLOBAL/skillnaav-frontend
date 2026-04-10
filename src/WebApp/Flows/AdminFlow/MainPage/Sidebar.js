import React, { useEffect, useState } from "react";
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
  faCreditCard,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useTabContext } from "./UserHomePageContext/HomePageContext";

const primaryNavItems = [
  { key: "home", icon: faHome, label: "Dashboard" },
  { key: "user-management", icon: faUsers, label: "User Management" },
];

const secondaryNavItems = [
  { key: "school-accounts", icon: faUniversity, label: "School Admin Accounts" },
  { key: "analytics", icon: faChartBar, label: "Analytics" },
  { key: "settings", icon: faCogs, label: "Settings" },
  { key: "bin", icon: faTrash, label: "Bin" },
];

const partnerManagementItems = [
  { key: "partner-accounts", label: "Partner Accounts" },
  { key: "internship-posts", label: "Internship Posts" },
];

const paymentManagementItems = [
  { key: "internship-payments", label: "Internship Payments" },
  { key: "partner-payments", label: "Partner Payments" },
];

const feedbackManagementItems = [
  { key: "feedback-list", label: "All Feedback" },
  { key: "user-feedback", label: "User Feedback" },
  { key: "partner-feedback", label: "Partner Feedback" },
  { key: "school-feedback", label: "School Admin Feedback" },
];

const PARTNER_MANAGEMENT_TABS = new Set(partnerManagementItems.map(({ key }) => key));
const PAYMENT_MANAGEMENT_TABS = new Set(paymentManagementItems.map(({ key }) => key));
const FEEDBACK_MANAGEMENT_TABS = new Set(feedbackManagementItems.map(({ key }) => key));

const Sidebar = ({ isOpen, isCompactLayout, onClose, isDesktopOpen = true }) => {
  const { handleSelectTab, selectedTab } = useTabContext();
  const navigate = useNavigate();
  const showLabels = isCompactLayout || isDesktopOpen;

  const [partnerOpen, setPartnerOpen] = useState(PARTNER_MANAGEMENT_TABS.has(selectedTab));
  const [paymentOpen, setPaymentOpen] = useState(PAYMENT_MANAGEMENT_TABS.has(selectedTab));
  const [feedbackOpen, setFeedbackOpen] = useState(FEEDBACK_MANAGEMENT_TABS.has(selectedTab));

  useEffect(() => {
    setPartnerOpen(PARTNER_MANAGEMENT_TABS.has(selectedTab));
    setPaymentOpen(PAYMENT_MANAGEMENT_TABS.has(selectedTab));
    setFeedbackOpen(FEEDBACK_MANAGEMENT_TABS.has(selectedTab));
  }, [selectedTab]);

  const handleTabClick = (key) => {
    if (key === "logout") {
      localStorage.removeItem("userInfo");
      localStorage.removeItem("adminInfo");
      localStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminSelectedTab");
      navigate("/admin/login");
    } else {
      handleSelectTab(key);
    }

    if (isCompactLayout) onClose?.();
  };

  const SidebarButton = ({ item, isActive, onClick, icon }) => (
    <button
      onClick={onClick}
      title={!showLabels ? item.label : ""}
      className={`flex items-center w-full p-3 rounded-lg font-medium transition-colors ${isActive ? "bg-teal-100 text-teal-700" : "text-gray-600 hover:bg-gray-100"
        } ${showLabels ? "items-start" : "items-center justify-center"}`}
    >
      <FontAwesomeIcon
        icon={icon}
        className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-teal-600" : "text-gray-500"
          } ${showLabels ? "mr-3 mt-0.5" : ""}`}
      />
      {showLabels && (
        <span className="min-w-0 text-left whitespace-normal break-words leading-5">
          {item.label}
        </span>
      )}
    </button>
  );

  const SidebarSection = ({
    icon,
    label,
    isActive,
    isExpanded,
    setExpanded,
    items,
  }) => (
    <div>
      <button
        onClick={() => showLabels && setExpanded((prev) => !prev)}
        title={!showLabels ? label : ""}
        className={`flex w-full p-3 rounded-lg font-medium transition-colors ${isActive ? "bg-teal-100 text-teal-700" : "text-gray-600 hover:bg-gray-100"
          } ${showLabels ? "justify-between" : "justify-center"}`}
      >
        {showLabels ? (
          <>
            <span className="flex flex-1 items-center min-w-0 pr-2">
              <FontAwesomeIcon
                icon={icon}
                className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-teal-600" : "text-gray-500"
                  } ${showLabels ? "mr-3" : ""}`}
              />
              <span className="min-w-0 text-left whitespace-normal break-words leading-5 text-[15px]">
                {label}
              </span>
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`ml-2 flex-shrink-0 text-xs transition-transform self-center ${isExpanded ? "rotate-180" : ""}`}
            />
          </>
        ) : (
          <FontAwesomeIcon
            icon={icon}
            className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-teal-600" : "text-gray-500"}`}
          />
        )}
      </button>

      {showLabels && isExpanded && (
        <div className="mt-1 ml-3 space-y-1 border-l border-gray-200 pl-3">
          {items.map((item) => {
            const isSelected = selectedTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${isSelected
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <span className="whitespace-normal break-words leading-5">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      {isCompactLayout && isOpen && (
        <div
          className="fixed top-[90px] right-0 bottom-0 left-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          ${isCompactLayout ? "fixed top-[90px] bottom-0 left-0 z-50" : "relative z-auto"}
          bg-white shadow-lg font-poppins
          transition-all duration-300 ease-in-out
          flex flex-col overflow-hidden shrink-0
          ${isCompactLayout
            ? `${isOpen ? "translate-x-0" : "-translate-x-full"} w-64`
            : `translate-x-0 ${!isDesktopOpen ? "w-14" : "w-64"}`
          }
        `}
        style={{ height: isCompactLayout ? "calc(100vh - 90px)" : "100%" }}
      >
        <div className="w-full h-full flex flex-col">
          <div className={`flex-1 overflow-y-auto hide-scrollbar pt-4 pb-6 ${showLabels ? "px-3" : "px-1"}`}>
            <ul className="space-y-2">
              {primaryNavItems.map((item) => (
                <li key={item.key}>
                  <SidebarButton
                    item={item}
                    icon={item.icon}
                    isActive={selectedTab === item.key}
                    onClick={() => handleTabClick(item.key)}
                  />
                </li>
              ))}

              <li>
                <SidebarSection
                  icon={faClipboardList}
                  label="Partner Management"
                  isActive={PARTNER_MANAGEMENT_TABS.has(selectedTab)}
                  isExpanded={partnerOpen}
                  setExpanded={setPartnerOpen}
                  items={partnerManagementItems}
                />
              </li>

              <li>
                <SidebarSection
                  icon={faCreditCard}
                  label="Payment Management"
                  isActive={PAYMENT_MANAGEMENT_TABS.has(selectedTab)}
                  isExpanded={paymentOpen}
                  setExpanded={setPaymentOpen}
                  items={paymentManagementItems}
                />
              </li>

              <li>
                <SidebarSection
                  icon={faCommentDots}
                  label="Feedback Management"
                  isActive={FEEDBACK_MANAGEMENT_TABS.has(selectedTab)}
                  isExpanded={feedbackOpen}
                  setExpanded={setFeedbackOpen}
                  items={feedbackManagementItems}
                />
              </li>

              {secondaryNavItems.map((item) => (
                <li key={item.key}>
                  <SidebarButton
                    item={item}
                    icon={item.icon}
                    isActive={selectedTab === item.key}
                    onClick={() => handleTabClick(item.key)}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 shrink-0">
            <button
              onClick={() => handleTabClick("logout")}
              title={!showLabels ? "Logout" : ""}
              className={`flex items-center w-full p-3 rounded-lg font-medium text-red-500 hover:bg-red-50 transition-colors ${showLabels ? "" : "justify-center"
                }`}
            >
              <FontAwesomeIcon
                icon={faSignOutAlt}
                className={`w-5 h-5 flex-shrink-0 ${showLabels ? "mr-3" : ""}`}
              />
              {showLabels && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
