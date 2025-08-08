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
} from "@fortawesome/free-solid-svg-icons";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ isOpen, onClose }) => {
  const { handleSelectTab } = useTabContext();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = React.useState("your-job-posts");

  const handleTabClick = (tab) => {
    if (tab === "logout") {
      localStorage.removeItem("userInfo");
      navigate("/partner/login");
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
  { id: "offer-templates", label: "Offer Templates", icon: faFileAlt }, // ✅ NEW
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
        className={`flex items-center p-3 rounded-lg w-full text-left font-semibold ${isSelected ? selectedColor : defaultColor
          } ${item.hoverBg || "hover:bg-gray-100"}`}
      >
        <FontAwesomeIcon
          icon={item.icon}
          className={`w-5 h-5 mr-3 ${isSelected ? "text-teal-500" : "text-gray-600"
            }`}
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
        ></div>
      )}

      {/* Sidebar */}
<div
  className={`fixed md:relative z-50 md:z-auto
    top-0 left-0
    w-64 bg-white shadow-lg font-poppins
    transform transition-transform duration-300 ease-in-out
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
    flex flex-col
  `}
  style={{ height: "calc(100vh - 96px)" }} // Adjust height under navbar
>

  {/* Scrollable area only for the list */}
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

  {/* Sticky bottom Upgrade box */}
  <div className="p-4 bg-teal-100 rounded-lg m-3">
    <h3 className="text-teal-700 text-sm font-semibold">
      UPGRADE TO PREMIUM
    </h3>
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
</div>

    </>
  );
};

export default Sidebar;
