import { FaBars, FaSignOutAlt } from "react-icons/fa";
import logo from "../../../../../assets-webapp/Skillnaav-logo.png";  // Adjust the path as necessary

const SchoolAdminNavbar = ({ onLogout, onToggleSidebar }) => {
  return (
    <header className="bg-white shadow px-4 py-4 flex items-center justify-between border-b font-poppins">
      <div className="flex items-center">
        {/* Hamburger for mobile */}
        <button
          onClick={onToggleSidebar}
          className="text-gray-600 md:hidden mr-4"
        >
          <FaBars className="text-xl" />
        </button>

        <img src={logo} alt="SkillNaav Logo" className="h-10 w-auto" />
      </div>

      <button
        onClick={onLogout}
        className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
      >
        <FaSignOutAlt className="mr-2" />
        Logout
      </button>
    </header>
  );
};
export default SchoolAdminNavbar;
