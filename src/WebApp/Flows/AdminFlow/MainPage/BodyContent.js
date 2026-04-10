// frontend/src/WebApp/Flows/AdminFlow/MainPage/BodyContent.js
import React, { useRef } from "react";
import { useTabContext } from "./UserHomePageContext/HomePageContext";

import Dashboard from "./Dashboard";
import UserManagement from "./UserManagement";
import PartnerAccounts from "./PartnerAccounts";
import InternshipsPosted from "./InternshipsPosted";
import SchoolAdminAccounts from "./SchoolAdminAccounts";
import Bin from "./Bin";
import InternshipPayments from "./InternshipPayments";
import PartnerPayments from "./PartnerPayments";

// Feedback / analytics components
import AdminFeedbackList from "./AdminFeedbackList";
import AdminFeedbackDashboard from "./AdminFeedbackDashboard";
import UserFeedback from "./UserFeedback";
import PartnerFeedback from "./PartnerFeedback";
import SchoolFeedback from "./SchoolFeedback";

const BodyContent = () => {
  const { selectedTab } = useTabContext();

  // Hold one persistent map of component instances so switching tabs won't remount them unnecessarily
  const componentMapRef = useRef(null);
  if (!componentMapRef.current) {
    componentMapRef.current = {
      home: <Dashboard />,
      "user-management": <UserManagement />,
      "partner-accounts": <PartnerAccounts />,
      "internship-posts": <InternshipsPosted />,
      "school-accounts": <SchoolAdminAccounts />,
      bin: <Bin />,

      // Payments
      "internship-payments": <InternshipPayments />,
      "partner-payments": <PartnerPayments />,

      // Analytics / feedback dashboard
      analytics: <AdminFeedbackDashboard flow="all" />,

      // Feedback pages — list or flow-specific views
      "feedback-list": <AdminFeedbackList />,
      "user-feedback": <UserFeedback />,
      "partner-feedback": <PartnerFeedback />,
      "school-feedback": <SchoolFeedback />,
    };
  }

  const componentMap = componentMapRef.current;

 return (
  <div className="flex-1 overflow-y-auto bg-[#f7f9fc] p-3 sm:p-4 lg:p-6">
    {componentMap[selectedTab] ?? (
      <div className="text-center text-gray-500 mt-10">Select a tab</div>
    )}
  </div>
);
};

export default BodyContent;
