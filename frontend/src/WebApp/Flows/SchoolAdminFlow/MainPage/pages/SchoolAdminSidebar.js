import React from "react";
import {
  FaHome,
  FaUserGraduate,
  FaBriefcase,
  FaCreditCard,
  FaSignOutAlt,
  FaIdCard,
} from "react-icons/fa";

const SchoolAdminSidebar = ({ selectedTab, setSelectedTab }) => {
  return (
    <aside className="w-64 bg-white shadow-md flex flex-col justify-between h-full border-r font-poppins">
      {/* Top Navigation */}
      <div className="p-6">
        <nav className="flex flex-col gap-2">
          <SidebarItem
            label="Dashboard"
            icon={<FaHome />}
            active={selectedTab === "dashboard"}
            onClick={() => setSelectedTab("dashboard")}
          />
          <SidebarItem
            label="Students"
            icon={<FaUserGraduate />}
            active={selectedTab === "students"}
            onClick={() => setSelectedTab("students")}
          />
          <SidebarItem
            label="Upload Students"
            icon={<FaUserGraduate />}
            active={selectedTab === "upload-students"}
            onClick={() => setSelectedTab("upload-students")}
          />

          <SidebarItem
            label="Internship & Applications"
            icon={<FaBriefcase />}
            active={selectedTab === "internships"}
            onClick={() => setSelectedTab("internships")}
          />
          <SidebarItem
            label="Subscriptions"
            icon={<FaCreditCard />}
            active={selectedTab === "subscriptions"}
            onClick={() => setSelectedTab("subscriptions")}
          />
          <SidebarItem
            label="Profile"
            icon={<FaIdCard />}
            active={selectedTab === "profile"}
            onClick={() => setSelectedTab("profile")}
          />

        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t text-sm">
        <div className="text-blue-800 font-bold mb-2">UPGRADE TO PREMIUM</div>
        <p className="text-gray-600 mb-3">
          Your team has used <strong>80%</strong> of available space.
        </p>
        <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm">
          Upgrade Plan
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("schoolAdminToken");
            window.location.href = "/schooladmin/login";
          }}
          className="flex items-center justify-center text-red-600 font-medium mt-4 hover:underline w-full"
        >
          <FaSignOutAlt className="mr-2" />
          Logout
        </button>
      </div>
    </aside>
  );
};

const SidebarItem = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-start w-full px-4 py-2 rounded-md text-sm font-bold transition-all duration-150 ${active ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-blue-50"
      }`}
  >
    <span className="mt-0 mr-4 text-base">{icon}</span>
    <span className="leading-snug text-left break-words whitespace-normal">
      {label}
    </span>
  </button>
);



export default SchoolAdminSidebar;
