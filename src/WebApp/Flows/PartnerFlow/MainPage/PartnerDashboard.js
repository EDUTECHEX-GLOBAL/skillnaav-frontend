import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BodyContent from "./BodyContent";

const PartnerDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex flex-col h-screen font-poppins bg-gray-50">
      {/* Navbar */}
      <Navbar onToggleSidebar={handleToggleSidebar} />

      {/* Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <BodyContent />
        </main>
      </div>
    </div>
  );
};

export default PartnerDashboard;
