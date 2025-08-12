import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignOutAlt, faBars } from "@fortawesome/free-solid-svg-icons";
import logo from "../../../../assets-webapp/Skillnaav-logo.png";
import { useTabContext } from "./UserHomePageContext/HomePageContext";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onToggleSidebar }) => {
  const { fine } = useTabContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", planType: "" });
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

        <button onClick={handleUserClick} className="focus:outline-none">
          <FontAwesomeIcon icon={faUser} className="w-6 h-6 text-gray-800" />
        </button>

        {isDropdownOpen && (
  <div
    ref={dropdownRef}
    className="absolute right-0 top-10 mt-2 bg-white shadow-xl rounded-xl border border-gray-200 z-50 w-auto min-w-[20rem] max-w-[90vw]"
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
    </header>
  );
};

export default Navbar;
