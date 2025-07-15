import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignOutAlt, faBell, faBars } from "@fortawesome/free-solid-svg-icons";
import logo from "../../../../assets-webapp/Skillnaav-logo.png";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = ({ onToggleSidebar }) => {
  const { selectedTab, handleSelectTab } = useTabContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: "", email: "", profileImage: "" });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (storedUserInfo) {
      setUserInfo(storedUserInfo);
      const studentId = storedUserInfo._id;

      const fetchNotifications = async () => {
        try {
          const { data } = await axios.get(`/api/notifications/${studentId}`);
          if (data.success) {
            setNotifications(data.notifications);
            const unread = data.notifications.filter((n) => !n.isRead).length;
            setUnreadCount(unread);
          }
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
      };

      fetchNotifications();
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
        console.log("✅ Logout session recorded successfully");
      } catch (error) {
        console.error("❌ Failed to record logout session:", error.response?.data || error.message);
      }
    }

    localStorage.removeItem("sessionId");
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
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

  return (
    <div className="bg-white font-poppins text-gray-800 pr-4 pl-0 py-4 border-b border-gray-300 sticky top-0 z-50 w-full">
      <div className="flex justify-between items-center">
        {/* === Left section: Hamburger + Logo === */}
        <div className="flex items-center space-x-4">
          <button onClick={onToggleSidebar} className="md:hidden text-gray-700 focus:outline-none">
            <FontAwesomeIcon icon={faBars} className="text-2xl" />
          </button>

          <img
            src={logo}
            alt="Skillnaav Logo"
            className="h-14 object-contain"
          />
        </div>

        {/* === Right section: Notification + Profile === */}
        <div className="relative flex items-center space-x-4">
          {/* Notification */}
          <div className="relative cursor-pointer" onClick={() => handleSelectTab("notifications")}>
            <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Profile Image or Icon */}
          {userInfo.profileImage ? (
            <img
              src={userInfo.profileImage}
              alt="User Profile"
              className="w-8 h-8 rounded-full object-cover cursor-pointer"
              onClick={handleUserClick}
            />
          ) : (
            <FontAwesomeIcon
              icon={faUser}
              className="w-8 h-8 text-gray-800 cursor-pointer"
              onClick={handleUserClick}
            />
          )}

          {/* User Name */}
          {userInfo.name && (
            <span className="text-gray-800 text-sm font-medium hidden sm:block">{userInfo.name}</span>
          )}

          {/* Dropdown */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-12 w-48 bg-white shadow-lg rounded-md py-2 border border-gray-300"
            >
              {userInfo.email && (
                <div className="px-4 py-2 text-sm text-gray-800">{userInfo.email}</div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-100"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
