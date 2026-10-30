import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BodyContent from "./BodyContent";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const PartnerDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  ); // desktop / tablet
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const { selectedTab } = useTabContext();

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-close mobile sidebar when tab changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [selectedTab, isMobile]);

  return (
    <div className="flex flex-col h-screen font-poppins bg-gray-50">
      {/* Navbar */}
      <Navbar onToggleSidebar={handleToggleSidebar} onCloseSidebar={handleCloseSidebar} />

      {/* Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar — passes desktop open state */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          isDesktopOpen={isDesktopSidebarOpen}
        />

        {/* Desktop toggle button — sits at the boundary of the sidebar */}
        <button
          onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          className="hidden md:flex items-center justify-center absolute top-4 z-50
            w-6 h-6 rounded-full bg-white border border-gray-300 shadow-md
            hover:bg-teal-50 hover:border-teal-400 transition-all duration-200"
          style={{ left: isDesktopSidebarOpen ? "244px" : "44px" }}
          title={isDesktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <FontAwesomeIcon
            icon={isDesktopSidebarOpen ? faChevronLeft : faChevronRight}
            className="text-teal-600 text-xs"
          />
        </button>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <BodyContent />
        </main>
      </div>
    </div>
  );
};

export default PartnerDashboard;