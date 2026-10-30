import React, { useState, useEffect, useRef } from "react";
import { Skeleton, Modal } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BodyContent from "./BodyContent";
import { TabProvider, useTabContext } from "./UserHomePageContext/HomePageContext";
import axios from "../../../../api/axiosInstance";

import Chatbot from "../../../../components/Chatbot";
import UserTextChatbot from "../../../../components/UserTextChatbot";
import UserAgeGateConsent from "../SignUpLogin/UserProfileBuilding/UserAgeGateConsent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import PendingApprovalCard from './PendingApprovalCard';
import StudentAIAvatar from "../../../../components/StudentAIAvatar";
const UserMainPageContent = () => {
  const { handleSelectTab, selectedTab } = useTabContext();

  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);           // mobile
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(
    window.innerWidth >= 1024,
  ); // desktop
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  // Chatbot widget state
  const [activeChat, setActiveChat] = useState(null); // 'text' | 'video' | null
  const [assistantBubbleHidden] = useState(false);
  const [showReverifyModal, setShowReverifyModal] = useState(false);
  const [reverifySaving, setReverifySaving] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const popupTimerRef = useRef(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-close mobile sidebar when selected tab changes or closeSidebar fired
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [selectedTab, isMobile]);

  useEffect(() => {
    const handleClose = () => setIsSidebarOpen(false);
    window.addEventListener("closeSidebar", handleClose);
    return () => window.removeEventListener("closeSidebar", handleClose);
  }, []);

  // Let other floating controls move out of the assistant preview's space.
  useEffect(() => {
    const previewVisible = !assistantBubbleHidden;
    window.__skillnaavAssistantPreviewVisible = previewVisible;
    window.dispatchEvent(new CustomEvent("skillnaav-assistant-preview", { detail: { visible: previewVisible } }));
  }, [assistantBubbleHidden]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        let token = localStorage.getItem("userToken");
        if (!token) {
          token = sessionStorage.getItem("userToken");
          if (token) localStorage.setItem("userToken", token);
          if (!token) {
            navigate("/user/login");
            return;
          }
        }

        const [profileRes, consentRes] = await Promise.all([
          axios.get("/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/user-age-gate-consent", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUserInfo(profileRes.data);

        // Keep localStorage synced so Navbar (and other components) see fresh data like planType
        const existingUserInfo = JSON.parse(localStorage.getItem("studentInfo") || localStorage.getItem("userInfo") || "{}");
        const updatedUserInfo = { ...existingUserInfo, ...profileRes.data };
        localStorage.setItem("studentInfo", JSON.stringify(updatedUserInfo));
        window.dispatchEvent(new Event("userInfoUpdated"));

        const reverifyRequested = !!consentRes.data?.data?.reverificationRequested;
        setIsApproved(reverifyRequested ? false : profileRes.data.adminApproved);

        if (reverifyRequested) setShowReverifyModal(true);

        const openTab = searchParams.get("openTab");
        if (openTab) handleSelectTab(openTab);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        localStorage.removeItem("userToken");
        localStorage.removeItem("studentInfo");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("sessionId");
        navigate("/user/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, [searchParams, navigate, handleSelectTab]);

  useEffect(() => {
    if (!userInfo || userInfo.isPremium || popupDismissed) return;
    const initialDelay = setTimeout(() => {
      setShowUpgradePopup(true);
      popupTimerRef.current = setTimeout(() => setShowUpgradePopup(false), 10000);
    }, 60000);
    return () => {
      clearTimeout(initialDelay);
      clearTimeout(popupTimerRef.current);
    };
  }, [userInfo, popupDismissed]);

  const handleDismissPopup = () => {
    setShowUpgradePopup(false);
    setPopupDismissed(true);
    clearTimeout(popupTimerRef.current);
  };

  useEffect(() => {
    const handleOpenTextChat = () => {
      setActiveChat('text');
    };
    window.addEventListener('open-text-chat', handleOpenTextChat);
    return () => window.removeEventListener('open-text-chat', handleOpenTextChat);
  }, []);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  const handleReverifyComplete = async (payload) => {
    try {
      let token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      if (!token) { navigate("/user/login"); return; }
      setReverifySaving(true);
      const fd = new FormData();
      fd.append("ageCategory", "OVER_18");
      fd.append("ageGateCompleted", "true");
      fd.append("ageVerificationPhoto", payload.ageVerificationPhoto);
      await axios.post("/api/user-age-gate-consent", fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setShowReverifyModal(false);
      setIsApproved(false);
    } catch (err) {
      console.error("Reverification upload failed:", err);
    } finally {
      setReverifySaving(false);
    }
  };

  if (loading) {
    return <div className="p-6"><Skeleton active /></div>;
  }

  return (
    <>
      <div className="flex flex-col h-screen font-poppins bg-gray-50">
        {/* Navbar */}
        <Navbar onToggleSidebar={handleToggleSidebar} onCloseSidebar={handleCloseSidebar} />

        {/* Layout: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            isMobile={isMobile}
            onClose={handleCloseSidebar}
            isDesktopOpen={isDesktopSidebarOpen}
          />

          {/* Desktop chevron toggle button at sidebar boundary */}
          {selectedTab !== "assessment" && (
            <button
              onClick={() => setIsDesktopSidebarOpen((prev) => !prev)}
              aria-label={isDesktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              className="hidden md:flex items-center justify-center absolute top-4 z-40
    w-6 h-6 rounded-full bg-white border border-gray-300 shadow-md
    hover:bg-purple-50 hover:border-purple-400 transition-all duration-300"
              style={{ left: isDesktopSidebarOpen ? "244px" : "44px" }}
            >
              <FontAwesomeIcon
                icon={isDesktopSidebarOpen ? faChevronLeft : faChevronRight}
                className="text-purple-600 text-xs"
              />
            </button>
          )}

          {/* Main content */}
          <main
            id="main-scroll-container"
            className={`flex-1 p-2 sm:p-4 md:pl-6 pb-28 sm:pb-36 relative ${
              !isApproved ? 'overflow-hidden' : 'overflow-y-auto'
            }`}
          >
            {/* Blur + block when not approved */}
            {!isApproved && (
              <div
                className="absolute inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto"
                style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.75)' }}
              >
                <PendingApprovalCard userInfo={userInfo} />
              </div>
            )}

            {/* Always render content underneath so blur shows something */}
            <div
  className={!isApproved ? 'pointer-events-none select-none overflow-hidden h-full' : 'h-full'}
  style={!isApproved ? { position: 'fixed', width: '100%' } : {}}
>
  <BodyContent />
</div>
          </main>
        </div>
      </div>

      {/* Upgrade popup */}
      {showUpgradePopup && isApproved && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-purple-300 shadow-xl rounded-xl p-4 max-w-xs">
          <button
            onClick={handleDismissPopup}
            className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-lg font-bold"
          >
            ×
          </button>
          <p className="text-sm text-gray-700 font-medium">
            Upgrade to Premium to apply for unlimited jobs, get priority listings, and exclusive opportunities.
          </p>
          <button
            onClick={() => {
              handleDismissPopup();
              handleSelectTab("premium");
            }}
            className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 rounded-lg"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Reverify Modal */}
      {showReverifyModal && (
        <UserAgeGateConsent 
          open={showReverifyModal} 
          mode="REVERIFY_OVER18" 
          onComplete={handleReverifyComplete} 
          saving={reverifySaving} 
          userEmail={userInfo?.email}
        />
      )}

      {/* Unified AI Video Assistant Widget — only visible once approved */}
      {selectedTab !== "assessment" && !assistantBubbleHidden && isApproved && activeChat !== 'text' && (
        <Chatbot />
      )}

      {/* Text Chatbot — only visible once approved */}
      {activeChat === 'text' && isApproved && (
        <UserTextChatbot onClose={() => setActiveChat(null)} />
      )}

      {/* Student AI Avatar Presenter & Guide */}
      <StudentAIAvatar
        studentInfo={userInfo}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        isMobile={isMobile}
      />
    </>
  );
};

const UserMainPage = () => (
  <TabProvider>
    <UserMainPageContent />
  </TabProvider>
);

export default UserMainPage;
