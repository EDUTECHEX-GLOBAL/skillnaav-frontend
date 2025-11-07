import React, { useState, useEffect } from "react";
import { Skeleton, Modal } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BodyContent from "./BodyContent";
import { TabProvider, useTabContext } from "./UserHomePageContext/HomePageContext";
import axios from "axios";
import PremiumPage from "./PremiumPage";
import Chatbot from "../../../../components/Chatbot";
import chatBotImage from "../../../../assets-webapp/chat-bot.png";

const UserMainPageContent = () => {
  const { handleSelectTab } = useTabContext();

  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [assistDockOpen, setAssistDockOpen] = useState(false); // controls the half-cylinder dock reveal

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        let token = localStorage.getItem("userToken");
        if (!token) {
          token = sessionStorage.getItem("userToken");
          if (token) localStorage.setItem("userToken", token);
        }

        if (token) {
          const parsedToken = JSON.parse(token);
          const response = await axios.get("/api/users/profile", {
            headers: { Authorization: `Bearer ${parsedToken}` },
          });
          setUserInfo(response.data);
          setIsApproved(response.data.adminApproved);

          // Handle query params after fetching user info
          const openTab = searchParams.get("openTab");
          const openRec = searchParams.get("openRec");
          if (openTab) {
            handleSelectTab(openTab);
            // Optionally handle openRec inside the tab content component
          }
        } else {
          const openTab = searchParams.get("openTab");
          const openRec = searchParams.get("openRec");
          if (openTab) {
            const nextPath = `/user-main-page?openTab=${openTab}${openRec ? `&openRec=${openRec}` : ""}`;
            navigate(`/user/login?next=${encodeURIComponent(nextPath)}`, { replace: true });
          } else {
            navigate("/user/login");
          }
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        navigate("/user/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [searchParams, navigate, handleSelectTab]);

  useEffect(() => {
    if (userInfo && !userInfo.isPremium) {
      const interval = setInterval(() => {
        setShowUpgradePopup(true);
        setTimeout(() => setShowUpgradePopup(false), 10000);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [userInfo]);

  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  return (
    <>
      <Navbar onToggleSidebar={handleToggleSidebar} />

      <div className="flex">
        <Sidebar isMobile={isMobile} isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

        <div className="flex-1 flex flex-col relative">
          {loading ? (
            <div className="p-4">
              <Skeleton active />
            </div>
          ) : (
            <div className="relative flex-1 overflow-y-auto">
              <BodyContent />

              {!isApproved && (
                <>
                  <div className="absolute inset-0 bg-gray-500 opacity-50 z-10" />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="bg-white p-4 rounded shadow-md text-center max-w-xs mx-auto">
                      <h2 className="text-lg font-semibold">Account Not Approved</h2>
                      <p className="text-sm">
                        Your account is not approved by an admin yet. Some features may be restricted.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showPricingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full p-2"
              onClick={() => setShowPricingModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>
            <PremiumPage />
          </div>
        </div>
      )}

      <Modal
        open={showUpgradePopup}
        onCancel={() => setShowUpgradePopup(false)}
        footer={[
          <button
            key="upgrade"
            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
            onClick={() => {
              setShowUpgradePopup(false);
              setShowPricingModal(true);
            }}
          >
            Upgrade Now
          </button>,
        ]}
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold">Unlock More Features!</h2>
          <p className="text-gray-600 mt-2">
            Upgrade to <span className="text-blue-500 font-medium">Premium</span> to apply for unlimited jobs, get priority listings, and exclusive opportunities.
          </p>
        </div>
      </Modal>

      {showChatbot ? (
        /* EXPANDED CHATBOT: unchanged */
        <div className="fixed bottom-5 right-5 w-[360px] max-h-[80vh] z-50 shadow-xl rounded-lg bg-white border">
          <div className="flex items-center justify-between bg-red-600 text-white p-3 rounded-t-lg">
            <span className="font-semibold">Career Assistance</span>
            <button
              onClick={() => setShowChatbot(false)}
              className="text-lg font-bold hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="p-4 max-h-[calc(80vh-60px)] overflow-y-auto">
            <Chatbot />
          </div>
        </div>
      ) : (
        <>
          {/* HALF-CYLINDER DOCK: stuck to bottom-right edge */}
          <button
            type="button"
            onClick={() => setAssistDockOpen((v) => !v)}
            className="fixed bottom-5 right-0 z-50 h-14 w-12 bg-white border border-gray-300 border-r-0 shadow-md rounded-l-full flex items-center justify-center hover:shadow-lg"
            aria-label={assistDockOpen ? "Hide Career Assistance" : "Show Career Assistance"}
            title={assistDockOpen ? "Hide Career Assistance" : "Show Career Assistance"}
          >
            <span
              className={`text-xl leading-none transition-transform ${assistDockOpen ? "" : "rotate-180"}`}
              aria-hidden="true"
            >
              ❯
            </span>
          </button>

          {/* CAREER ASSISTANCE PILL: slides out from the HALF-CYLINDER DOCK */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowChatbot(true);
              setAssistDockOpen(false);
            }}
            aria-hidden={!assistDockOpen}
            className={`fixed bottom-5 right-16 z-50 cursor-pointer flex items-center gap-2 bg-white border shadow-md rounded-full h-14 px-4 py-2 hover:shadow-lg
              transform-gpu transition-all duration-300 ease-out
              ${assistDockOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 pointer-events-none'}`}
          >
            <div className="text-sm font-semibold text-red-600 leading-tight">
              Career Assistance
            </div>
            <img src={chatBotImage} alt="Bot Avatar" className="w-10 h-10 rounded-full border" />
          </div>
        </>
      )}

    </>
  );
};

const UserMainPage = () => {
  return (
    <TabProvider>
      <UserMainPageContent />
    </TabProvider>
  );
};

export default UserMainPage;