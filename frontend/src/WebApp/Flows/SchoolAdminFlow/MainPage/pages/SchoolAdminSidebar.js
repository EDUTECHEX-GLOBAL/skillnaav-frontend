import React from "react";
import {
  FaHome,
  FaUserGraduate,
  FaBriefcase,
  FaCreditCard,
  FaSignOutAlt,
  FaIdCard,
} from "react-icons/fa";

const SchoolAdminSidebar = ({
  selectedTab,
  setSelectedTab,
  isOpen,
  onClose,
}) => {
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
                  onClose(); // close on mobile
                }}
              />
              {/* Add remaining items like Students, Upload Students, etc. */}
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

          {/* Bottom Section */}
          <div className="p-4 border-t text-sm">
            {/* Premium + Logout */}
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
    <span className="leading-snug text-left break-words whitespace-normal">
      {label}
    </span>
  </button>
);



export default SchoolAdminSidebar;
