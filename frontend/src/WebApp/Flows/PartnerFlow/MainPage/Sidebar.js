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
import logo from "../../../../assets-webapp/Skillnaav-logo.png";
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
      if (onClose) onClose(); // close on mobile
    }
  };

  const menuItems = [
    { id: "your-job-posts", label: "Internship Posts", icon: faBriefcase },
    { id: "post-a-job", label: "Post An Internship", icon: faPlus },
    { id: "messages", label: "Messages", icon: faEnvelope },
    { id: "applications", label: "Applications", icon: faFileAlt },
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
          className={`w-5 h-5 mr-3 ${
            isSelected ? "text-teal-500" : "text-gray-600"
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
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div
  className={`
    fixed md:relative z-50 md:z-auto
    inset-y-0 left-0
    w-64 h-screen bg-white shadow-lg font-poppins
    transform transition-transform duration-300 ease-in-out
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
    overflow-y-auto
  `}
  style={{
    display: isOpen ? "block" : undefined,
  }}
>
  
        {/* Logo */}
        {/* <div className="sticky top-0 z-10 bg-white py-4 flex items-center justify-center border-b border-gray-200">
          <img src={logo} alt="Skillnaav Logo" className="h-14 object-contain" />
        </div> */}

        {/* Navigation */}
        <nav className="flex-1 mt-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <SidebarButton item={item} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Support / Logout / Upgrade */}
        <div className="mt-6">
          <ul className="space-y-2">
            {actionItems.map((item) => (
              <li key={item.id}>
                <SidebarButton item={item} />
              </li>
            ))}
          </ul>

          <div className="mt-6 p-4 bg-teal-100 rounded-lg">
            <h3 className="text-teal-700 text-sm font-semibold">
              UPGRADE TO PREMIUM
            </h3>
            <p className="text-xs text-teal-600 mt-1">
              Your team has used 80% of your available space. Need more?
            </p>
            <button className="mt-4 w-full bg-teal-700 text-white py-2 px-4 rounded-lg">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
