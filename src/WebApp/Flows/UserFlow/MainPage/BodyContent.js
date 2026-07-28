import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import Message from "./Message";
import SearchBar from "./SearchBar";
import Home from "./Home";
import Filter from "./Filter";
import SavedJobs from "./SavedJobs";
import Applications from "./Applications";
import ProfilePage from "./ProfilePage";
import PremiumPage from "./PremiumPage";
import Notifications from "./Notifications";
import OfferLetter from "./OfferLetter";
import AdvancedAi from "./AdvancedAi";
import MaterialScience from "./MaterialScience";
import QuantumComputing from "./QuantumComputing";
import ClimateTech from "./ClimateTech";
import BioTech from "./BioTech";
import Recommendations from "./Recommendations";
import StudentAssessment from "./StudentAssessment";
import UserAttendance from "./UserAttendance";


const BodyContent = () => {
  const { selectedTab = "home", handleSelectTab } = useTabContext();

  useEffect(() => {
    const handler = (e) => {
      const tab = e?.detail?.tab;
      if (!tab || typeof handleSelectTab !== "function") return;
      handleSelectTab(tab);
    };

    window.addEventListener("openTab", handler);
    return () => window.removeEventListener("openTab", handler);
  }, [handleSelectTab]);

  let content;
  switch (selectedTab) {
    case "home":
      content = <Home />;
      break;
    case "searchbar":
      content = <SearchBar />;
      break;
    case "recommendations":
      content = <Recommendations />;
      break;
    case "messages":
      content = <Message />;
      break;
    case "applications":
      content = <Applications />;
      break;
    case "saved-jobs":
      content = <SavedJobs />;
      break;
    case "assessment":
      content = <StudentAssessment />;
      break;
    case "attendance":
      content = <UserAttendance />;
      break;
    case "profile":
      content = <ProfilePage />;
      break;
    case "support":
      content = <Navigate to="/user-support" replace />;
      break;
    case "logout":
      content = <div>Logout Content</div>;
      break;
    case "filter":
      content = <Filter />;
      break;
    case "notifications":
      content = <Notifications />;
      break;
    case "premium":
      content = <PremiumPage />;
      break;
    case "offer-letter":
      content = <OfferLetter />;
      break;
    case "advanced-ai":
      content = <AdvancedAi />;
      break;
    case "quantum-computing":
      content = <QuantumComputing />;
      break;
    case "climate-tech":
      content = <ClimateTech />;
      break;
    case "biotech":
      content = <BioTech />;
      break;
    case "materials-science":
      content = <MaterialScience />;
      break;
    default:
      content = <div>Select a tab</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row p-4 flex-1">
      {/* Desktop View */}
      <div className="lg:flex-1 hidden lg:block">{content}</div>

      {/* Mobile View */}
      <div className="lg:hidden flex-1">{content}</div>
    </div>
  );
};

export default BodyContent;
