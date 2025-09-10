import React from "react";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import Message from "./Message";
import AeronauticalJobs from "./AeronauticalJobs";
import SearchBar from "./SearchBar";
import Home from "./Home";
import Filter from "./Filter";
import SavedJobs from "./SavedJobs";
import Applications from "./Applications";
import Support from "../MainPage/support/Support";
import Profile from "./Profile";
import PremiumPage from "./PremiumPage";
import Notifications from "./Notifications";
import OfferLetter from "./OfferLetter";
import AdvancedAi from "./AdvancedAi"; // Import the new component
import MaterialScience from "./MaterialScience"; // Import the new component
import QuantumComputing from "./QuantumComputing";
import ClimateTech from "./ClimateTech";
import BioTech from "./BioTech";
import Recommendations from "./Recommendations"; // add import


// Optional: create simple components as placeholders for now
const SectorPlaceholder = ({ name }) => (
  <div className="text-xl text-gray-800 font-semibold p-6">
    Coming Soon: {name}
  </div>
);

const BodyContent = () => {
  const { selectedTab } = useTabContext();
  console.log("Selected Tab:", selectedTab);

  let content;
  switch (selectedTab) {
    case "home":
      content = <Home />;
      break;
    case "aeronautical-jobs":
      content = <AeronauticalJobs />;
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
    case "profile":
      content = <Profile />;
      break;
    case "support":
      content = <Support />;
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

    // New Top Sectors
    case "advanced-ai":
      content = <AdvancedAi/>;
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
      content = <MaterialScience/>;
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
