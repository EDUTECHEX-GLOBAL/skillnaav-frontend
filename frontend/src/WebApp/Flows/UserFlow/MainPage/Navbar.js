import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faSignOutAlt,
  faBell,
  faBars,
  faCrown,
  faAt,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../../../../assets-webapp/Skillnaav-logo.png";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = ({ onToggleSidebar }) => {
  const { handleSelectTab } = useTabContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: "", email: "", profileImage: "" });
  const [planType, setPlanType] = useState("Free");
  const [unreadCount, setUnreadCount] = useState(0);

 useEffect(() => {
  const storedUserInfo = JSON.parse(localStorage.getItem("userInfo"));
  if (storedUserInfo) {
    setUserInfo(storedUserInfo);
    setPlanType(storedUserInfo.planType || "Free");

    const studentId = storedUserInfo._id;

    // Fetch Notifications
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(`/api/notifications/${studentId}`);
        if (data.success) {
          const unread = data.notifications.filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    // Fetch Latest Premium Status
    const fetchPremiumStatus = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("userToken"));
        const { data } = await axios.get(`/api/users/premium-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPlanType(data.planType || "Free");

        // 🔄 Also update localStorage so UI stays in sync
        localStorage.setItem(
          "userInfo",
          JSON.stringify({ ...storedUserInfo, planType: data.planType })
        );
      } catch (err) {
        console.error("Failed to fetch premium status:", err);
      }
    };

    fetchNotifications();
    fetchPremiumStatus();
  }
}, []);


  const handleUserClick = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = async () => {
    const sessionId = localStorage.getItem("sessionId");
    const token = JSON.parse(localStorage.getItem("userToken"));

    if (sessionId && token) {
      try {
        await axios.post(
          "/api/sessions/logout",
          { sessionId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Logout session error:", error.response?.data || error.message);
      }
    }

    localStorage.clear();
    navigate("/user/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const planStyles = {
    "Premium Plus": "bg-gradient-to-r from-orange-400 to-orange-600 text-white",
    "Premium Basic": "bg-gradient-to-r from-purple-500 to-purple-700 text-white",
    Free: "bg-gray-200 text-gray-700",
  };

  return (
    <div className="bg-white font-poppins border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Left: Logo & Toggle */}
        <div className="flex items-center space-x-4">
          <button onClick={onToggleSidebar} className="text-gray-700 md:hidden focus:outline-none">
            <FontAwesomeIcon icon={faBars} className="text-xl" />
          </button>
          <img src={logo} alt="Skillnaav Logo" className="h-12" />
        </div>

        {/* Right: Notification, Profile, Plan */}
        <div className="relative flex items-center space-x-5">
          {/* Notification Icon */}
          <div
            className="relative cursor-pointer group"
            onClick={() => handleSelectTab("notifications")}
          >
            <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-gray-700 hover:text-purple-600 transition" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
            <span className="absolute top-6 -left-3 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
              Notifications
            </span>
          </div>

          {/* Profile Image */}
          <div
            className="relative"
            onClick={handleUserClick}
          >
            {userInfo.profileImage ? (
              <img
                src={userInfo.profileImage}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover cursor-pointer shadow-md border-2 border-purple-300 hover:scale-105 transition-transform"
              />
            ) : (
              <FontAwesomeIcon
                icon={faUser}
                className="w-8 h-8 text-gray-800 cursor-pointer"
              />
            )}
          </div>

          {/* Name & Plan */}
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-gray-800 text-sm font-semibold">{userInfo.name}</span>
            <span className={`text-xs font-semibold rounded-full px-2 py-0.5 mt-1 flex items-center gap-1 ${planStyles[planType]}`}>
              <FontAwesomeIcon icon={faCrown} className="text-[10px]" />
              {planType}
            </span>
          </div>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-16 mt-2 bg-white shadow-xl rounded-xl border border-gray-200 z-50 w-auto min-w-[20rem] max-w-[90vw]"
            >
              {/* Email header styled like the reference */}
              <div className="px-4 py-3 border-b rounded-t-xl bg-white">
                <div className="flex items-center gap-2 text-black">
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <img
                      src={require("../../../../assets-webapp/user-logo.svg").default}
                      alt="User Logo"
                      className="h-7 w-7"
                    />
                  </div>
                  <span
                    className="block text-sm font-medium whitespace-nowrap"
                    title={userInfo.email}
                  >
                    {userInfo.email}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition rounded-b-xl"
              >
                {/* fixed icon slot = w-6 h-6 just like the email row */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                </div>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;