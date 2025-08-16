// BodyContent.js
import React from "react";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import Dashboard from "./Dashboard";
import UserManagement from "./UserManagement";
import PartnerAccounts from "./PartnerAccounts";
import InternshipsPosted from "./InternshipsPosted";
import SchoolAdminAccounts from "./SchoolAdminAccounts";
import Bin from "./Bin";

// ✅ Import new payment components
import InternshipPayments from "./InternshipPayments";
import PartnerPayments from "./PartnerPayments";

const BodyContent = () => {
  const { selectedTab } = useTabContext();

  const mapTabToComponent = {
    home: <Dashboard />,
    "user-management": <UserManagement />,
    "partner-accounts": <PartnerAccounts />,
    "internship-posts": <InternshipsPosted />,
    "school-accounts": <SchoolAdminAccounts />,
    bin: <Bin />,
    // ✅ New routes
    "internship-payments": <InternshipPayments />,
    "partner-payments": <PartnerPayments />,
  };

  return (
    <div className="flex-1 p-6 bg-gray-50">
      {mapTabToComponent[selectedTab] || (
        <div className="text-center text-gray-500 mt-10">Select a tab</div>
      )}
    </div>
  );
};

export default BodyContent;
