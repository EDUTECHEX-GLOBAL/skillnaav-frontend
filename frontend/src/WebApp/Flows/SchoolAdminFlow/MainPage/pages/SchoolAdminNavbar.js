import React from "react";
import { FaSignOutAlt } from "react-icons/fa";
import logo from "../../../../../assets-webapp/Skillnaav-logo.png"; // adjust based on your path

const SchoolAdminNavbar = ({ onLogout }) => {
  return (
    <header className="bg-white shadow px-6 py-4 flex items-center justify-between border-b font-poppins">
      <div className="flex items-center">
        <img
          src={logo}
          alt="SkillNaav Logo"
          className="h-12 w-auto mr-3" // ✅ Adjust height & spacing
        />
        {/* <span className="text-xl font-bold text-blue-900">School Admin Panel</span> */}
      </div>

      <button
        onClick={onLogout}
        className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        <FaSignOutAlt className="mr-2" />
        Logout
      </button>
    </header>
  );
};

export default SchoolAdminNavbar;
