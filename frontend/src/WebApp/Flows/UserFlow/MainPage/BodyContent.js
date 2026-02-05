import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import AdvancedAi from "./AdvancedAi";
import MaterialScience from "./MaterialScience";
import QuantumComputing from "./QuantumComputing";
import ClimateTech from "./ClimateTech";
import BioTech from "./BioTech";
import Recommendations from "./Recommendations";
import StudentAssessment from "./StudentAssessment";


/**
 * BodyContent
 * - Listens for `openTab` events and tries several common context APIs (defensive)
 * - Syncs the browser URL to reflect selectedTab so refresh/back/links work
 */
const BodyContent = () => {
  const tabCtx = useTabContext(); // consumes whatever your context provides
  const navigate = useNavigate();

  // normalize selectedTab from common keys
  const selectedTab =
    tabCtx?.selectedTab ?? tabCtx?.tab ?? tabCtx?.currentTab ?? "home";

  // 🔒 Force HOME tab on every page reload
 useEffect(() => {
  const handler = (e) => {
    const tab = e?.detail?.tab;
    if (!tab) return;

    // ✅ YOUR ACTUAL CONTEXT API
    if (typeof tabCtx?.handleSelectTab === "function") {
      tabCtx.handleSelectTab(tab);
      return;
    }

    console.warn(
      "openTab event received but handleSelectTab not found",
      Object.keys(tabCtx || {})
    );
  };

  window.addEventListener("openTab", handler);
  return () => window.removeEventListener("openTab", handler);
}, [tabCtx]);



  // Sync URL when tab changes so address bar always matches tab
  useEffect(() => {
    try {
      // replace: true avoids history spam; change to false if you want separate history entries per tab
      navigate(`/user-main-page?openTab=${encodeURIComponent(selectedTab)}`, { replace: true });
    } catch (err) {
      // If navigate fails for any reason, don't break the app; just log
      console.warn("Failed to update URL for tab change:", err);
    }
  }, [selectedTab, navigate]);


  // Listen for openTab events from Notifications or other parts of the app
  // useEffect(() => {
  //   const handler = (e) => {
  //     const tab = e?.detail?.tab;
  //     if (!tab) return;

  //     // Try common setter patterns safely

  //     // 1) Preferred API: setSelectedTab(tab)
  //     if (typeof tabCtx?.setSelectedTab === "function") {
  //       tabCtx.setSelectedTab(tab);
  //       return;
  //     }

  //     // 2) Alternative names: setTab, setSelected
  //     if (typeof tabCtx?.setTab === "function") {
  //       tabCtx.setTab(tab);
  //       return;
  //     }
  //     if (typeof tabCtx?.setSelected === "function") {
  //       tabCtx.setSelected(tab);
  //       return;
  //     }

  //     // 3) Reducer-style dispatch
  //     if (typeof tabCtx?.dispatch === "function") {
  //       try {
  //         tabCtx.dispatch({ type: "SET_TAB", tab });
  //         return;
  //       } catch (err) {
  //         console.warn("tabCtx.dispatch failed", err);
  //       }
  //     }

  //     // 4) Generic update/setState helpers
  //     if (typeof tabCtx?.update === "function") {
  //       try {
  //         tabCtx.update({ selectedTab: tab });
  //         return;
  //       } catch (err) {
  //         console.warn("tabCtx.update failed", err);
  //       }
  //     }
  //     if (typeof tabCtx?.setState === "function") {
  //       try {
  //         tabCtx.setState((prev) => ({ ...(prev || {}), selectedTab: tab }));
  //         return;
  //       } catch (err) {
  //         console.warn("tabCtx.setState failed", err);
  //       }
  //     }

  //     // Nothing matched — log so you can adapt the context provider
  //     console.warn("openTab event received but no setter found on tab context. Context keys:", Object.keys(tabCtx || {}));
  //   };

  //   window.addEventListener("openTab", handler);
  //   return () => window.removeEventListener("openTab", handler);
  // }, [tabCtx]);

  // Choose which component to render for the selectedTab
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
    case "assessment":
      content = <StudentAssessment />;
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



// import React, { useEffect } from "react";
// import { useTabContext } from "./UserHomePageContext/HomePageContext";
// import Message from "./Message";
// import AeronauticalJobs from "./AeronauticalJobs";
// import SearchBar from "./SearchBar";
// import Home from "./Home";
// import Filter from "./Filter";
// import SavedJobs from "./SavedJobs";
// import Applications from "./Applications";
// import Support from "../MainPage/support/Support";
// import Profile from "./Profile";
// import PremiumPage from "./PremiumPage";
// import Notifications from "./Notifications";
// import OfferLetter from "./OfferLetter";
// import AdvancedAi from "./AdvancedAi";
// import MaterialScience from "./MaterialScience";
// import QuantumComputing from "./QuantumComputing";
// import ClimateTech from "./ClimateTech";
// import BioTech from "./BioTech";
// import Recommendations from "./Recommendations";

// const BodyContent = () => {
//   const { selectedTab, setSelectedTab } = useTabContext();
//   console.log("Selected Tab:", selectedTab);

//   useEffect(() => {
//     const handler = (e) => {
//       const tab = e?.detail?.tab;
//       if (!tab) return;
//       // if an external event requests the 'recommendations' tab, set it
//       setSelectedTab(tab);
//     };
//     window.addEventListener("openTab", handler);
//     return () => window.removeEventListener("openTab", handler);
//   }, [setSelectedTab]);

//   let content;
//   switch (selectedTab) {
//     case "home": content = <Home />; break;
//     case "aeronautical-jobs": content = <AeronauticalJobs />; break;
//     case "searchbar": content = <SearchBar />; break;
//     case "recommendations": content = <Recommendations />; break;
//     case "messages": content = <Message />; break;
//     case "applications": content = <Applications />; break;
//     case "saved-jobs": content = <SavedJobs />; break;
//     case "profile": content = <Profile />; break;
//     case "support": content = <Support />; break;
//     case "logout": content = <div>Logout Content</div>; break;
//     case "filter": content = <Filter />; break;
//     case "notifications": content = <Notifications />; break;
//     case "premium": content = <PremiumPage />; break;
//     case "offer-letter": content = <OfferLetter />; break;
//     case "advanced-ai": content = <AdvancedAi />; break;
//     case "quantum-computing": content = <QuantumComputing />; break;
//     case "climate-tech": content = <ClimateTech />; break;
//     case "biotech": content = <BioTech />; break;
//     case "materials-science": content = <MaterialScience />; break;
//     default: content = <div>Select a tab</div>;
//   }

//   return (
//     <div className="flex flex-col lg:flex-row p-4 flex-1">
//       <div className="lg:flex-1 hidden lg:block">{content}</div>
//       <div className="lg:hidden flex-1">{content}</div>
//     </div>
//   );
// };

// export default BodyContent;
