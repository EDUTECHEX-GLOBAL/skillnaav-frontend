import React, { useState, useCallback } from "react";
import DashboardHome from "./pages/DashboardHome";
import StudentsList from "./pages/StudentsList";
import Subscriptions from "./pages/Subscriptions";
import Internships from "./pages/Internships";
import SchoolAdminProfile from "./pages/SchoolAdminProfile";
import SchoolAdminNavbar from "./pages/SchoolAdminNavbar";
import SchoolAdminSidebar from "./pages/SchoolAdminSidebar";
import UploadStudents from "./pages/UploadStudents";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const SchoolAdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);           // mobile
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); // desktop

  const handleLogout = useCallback(() => {
    localStorage.removeItem("schoolAdminToken");
    window.location.href = "/schooladmin/login";
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const renderContent = useCallback(() => {
    switch (selectedTab) {
      case "dashboard":     return <DashboardHome />;
      case "students":      return <StudentsList />;
      case "upload":        return <UploadStudents />;
      case "internships":   return <Internships />;
      case "subscriptions": return <Subscriptions />;
      case "profile":       return <SchoolAdminProfile />;
      default:              return <DashboardHome />;
    }
  }, [selectedTab]);

  return (
    <div className="flex flex-col h-screen font-poppins bg-gray-50">
      {/* Navbar */}
      <SchoolAdminNavbar
        onLogout={handleLogout}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar */}
        <SchoolAdminSidebar
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          isDesktopOpen={isDesktopSidebarOpen}
        />

        {/* Desktop chevron toggle button at sidebar boundary */}
        <button
          onClick={() => setIsDesktopSidebarOpen((prev) => !prev)}
          className="hidden md:flex items-center justify-center absolute top-4 z-50
            w-6 h-6 rounded-full bg-white border border-gray-300 shadow-md
            hover:bg-teal-50 hover:border-teal-400 transition-all duration-200"
          style={{ left: isDesktopSidebarOpen ? "248px" : "48px" }}
          title={isDesktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isDesktopSidebarOpen
            ? <FaChevronLeft className="text-teal-600 text-xs" />
            : <FaChevronRight className="text-teal-600 text-xs" />
          }
        </button>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;