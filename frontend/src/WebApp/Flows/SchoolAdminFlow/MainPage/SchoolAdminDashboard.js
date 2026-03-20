import React, { useState, useCallback } from "react";
import DashboardHome from "./pages/DashboardHome";
import StudentsList from "./pages/StudentsList";
import Subscriptions from "./pages/Subscriptions";
import Internships from "./pages/Internships";
import SchoolAdminProfile from "./pages/SchoolAdminProfile";

import SchoolAdminNavbar from "./pages/SchoolAdminNavbar";
import SchoolAdminSidebar from "./pages/SchoolAdminSidebar";
import UploadStudents from "./pages/UploadStudents";
// import CurriculumSetup from "./pages/CurriculumSetup";


const SchoolAdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ✅ Memoize so child components don't re-render on every state change
  const handleLogout = useCallback(() => {
    localStorage.removeItem("schoolAdminToken");
    window.location.href = "/schooladmin/login";
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);
const renderContent = useCallback(() => {
  switch (selectedTab) {
    case "dashboard":     return <DashboardHome />;
    case "students":      return <StudentsList />;
    case "upload-students": return <UploadStudents />;
    case "internships":   return <Internships />;
    case "subscriptions": return <Subscriptions />;
    case "profile":       return <SchoolAdminProfile />;
    default:              return <DashboardHome />;
  }
}, [selectedTab]);

return (
  <div className="h-screen flex flex-col font-poppins">
    <SchoolAdminNavbar
      onLogout={handleLogout}
      onToggleSidebar={handleToggleSidebar}
    />
    <div className="flex flex-1 overflow-hidden relative">
      <SchoolAdminSidebar
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />
      <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {renderContent()}
      </main>
    </div>
  </div>
);
};


export default SchoolAdminDashboard;
