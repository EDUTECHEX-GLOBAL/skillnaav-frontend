import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignOutAlt, faBars } from "@fortawesome/free-solid-svg-icons";
import logo from "../../../../assets-webapp/Skillnaav-logo.png";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onToggleSidebar }) => {
  const { fine } = useTabContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", planType: "", profileImage: "" });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (storedUserInfo) {
      setUserInfo(storedUserInfo);
    }
  }, []);

  const handleUserClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/partner/login");
  };

  // Close dropdown if clicking outside
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
    <header className="bg-white font-poppins text-gray-800 py-5 px-4 border-b border-gray-300 sticky top-0 z-50 flex justify-between items-center">
      {/* Left Section: Logo + Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-gray-700 focus:outline-none"
        >
          <FontAwesomeIcon icon={faBars} className="text-xl" />
        </button>
        <img src={logo} alt="Skillnaav Logo" className="h-14 object-contain" />
      </div>

      {/* Right Section: User info + Dropdown */}
      <div className="relative flex items-center ml-auto">
        {userInfo.name && (
          <div className="flex flex-col items-end mr-3">
            <span className="text-gray-800 text-sm">{userInfo.name}</span>

            {userInfo.planType && (
              <span
                className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                  userInfo.planType === "Freemium"
                    ? "bg-gray-200 text-gray-700"
                    : userInfo.planType === "Premium Basic"
                    ? "bg-purple-200 text-purple-800"
                    : userInfo.planType === "Premium Plus"
                    ? "bg-orange-200 text-orange-800"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {userInfo.planType}
              </span>
            )}
          </div>
        )}

        {/* Profile Image / Fallback Icon */}
        <button onClick={handleUserClick} className="focus:outline-none ml-2">
          {userInfo.profileImage ? (
            <img
              src={userInfo.profileImage}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-gray-300"
            />
          ) : (
            <FontAwesomeIcon icon={faUser} className="w-6 h-6 text-gray-800" />
          )}
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 top-10 mt-2 bg-white shadow-xl rounded-xl border border-gray-200 z-50 w-auto min-w-[20rem] max-w-[90vw]"
          >
            {/* Email / Profile Header */}
            <div className="px-4 py-3 border-b rounded-t-xl bg-white">
              <div className="flex items-center gap-3 text-black">
                <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-300">
                  {userInfo.profileImage ? (
                    <img
                      src={userInfo.profileImage}
                      alt="User"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUser} className="text-gray-600 w-full h-full p-3" />
                  )}
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
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
              </div>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
