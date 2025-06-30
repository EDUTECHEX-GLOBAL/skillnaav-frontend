import React, { useState } from "react";
import DashboardHome from "./pages/DashboardHome";
import StudentsList from "./pages/StudentsList";
import Subscriptions from "./pages/Subscriptions";
import Internships from "./pages/Internships";
import SchoolAdminProfile from "./pages/SchoolAdminProfile";

import SchoolAdminNavbar from "./pages/SchoolAdminNavbar";
import SchoolAdminSidebar from "./pages/SchoolAdminSidebar";

const SchoolAdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const handleLogout = () => {
    localStorage.removeItem("schoolAdminToken");
    window.location.href = "/schooladmin/login";
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "dashboard":
        return <DashboardHome />;
      case "students":
        return <StudentsList />;
      case "internships":
        return <Internships />;
      case "subscriptions":
        return <Subscriptions />;
      case "profile":
        return <SchoolAdminProfile />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="h-screen flex flex-col font-poppins">
      <SchoolAdminNavbar onLogout={handleLogout} />

      <div className="flex flex-1 overflow-hidden">
        <SchoolAdminSidebar
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;
