//File: BodyContent.js

import React from "react";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import Message from "./Message";
import Applications from "./Applications";
import Profile from "./Profile";
import Support from "./Support";
import YourJobPosts from "./YourJobPosts";
import PostAJob from "./PostAJob";
import PartnerPremiumPage from "./PartnerPremiumPage";
import OfferTemplateManager from "./OfferTemplateManager";
import CustomInternshipCertificateManager from "./CustomInternshipCertificateManager";
import StipendDetails from "./StipendDetails";
import InstructureManagement from "./InstructureManagement";
import InternshipPayments from "./InternshipPayments"; // ✅ New
import Bin from "./Bin";

const BodyContent = () => {
  const { selectedTab } = useTabContext();

  let content;

  switch (selectedTab) {
    case "your-job-posts":
      content = <YourJobPosts />;
      break;
    case "instructors":
      content = <InstructureManagement />;
      break;
    case "post-a-job":
      content = <PostAJob />;
      break;
    case "messages":
      content = <Message />;
      break;
    case "applications":
      content = <Applications />;
      break;
    case "profile":
      content = <Profile />;
      break;
    case "support":
      content = <Support />;
      break;
    case "upgrade":
      content = <PartnerPremiumPage />;
      break;
    case "offer-templates":
      content = <OfferTemplateManager />;
      break;
    case "custom-internship-certificate":
      content = <CustomInternshipCertificateManager />;
      break;
    case "stipend-details":
      content = <StipendDetails />;
      break;
    // ✅ New — Payments received for paid internships
    case "internship-payments":
      content = <InternshipPayments />;
      break;
    case "bin":
      content = <Bin />;
      break;
    case "logout":
      content = <div>You have been logged out. Please log in again.</div>;
      break;
    default:
      content = <div>Select a tab</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row p-4 flex-1">
      {/* Desktop */}
      <div className="lg:flex-1 hidden lg:block">{content}</div>
      {/* Mobile */}
      <div className="lg:hidden flex-1">{content}</div>
    </div>
  );
};

export default BodyContent;