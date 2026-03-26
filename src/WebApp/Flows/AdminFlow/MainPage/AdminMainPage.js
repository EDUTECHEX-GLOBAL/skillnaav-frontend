// AdminMainPage.js
import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BodyContent from "./BodyContent";
import { TabProvider } from "./UserHomePageContext/HomePageContext";

const AdminMainPage = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <TabProvider>
      {/* full-screen flex container, no page scroll */}
      <div className="flex h-screen overflow-hidden">
        {/* fixed sidebar */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* main area: navbar + scrollable content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Navbar toggleSidebar={toggleSidebar} />
          <BodyContent />
        </div>
      </div>
    </TabProvider>
  );
};

export default AdminMainPage;
