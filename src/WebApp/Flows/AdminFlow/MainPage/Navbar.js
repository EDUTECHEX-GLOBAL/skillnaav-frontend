import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faUser,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import logo from "../../../../assets-webapp/Skillnaav-logo.png";

const Navbar = ({ onToggleSidebar, showMenuToggle }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const nav = useNavigate();

  useEffect(() => {
    const handler = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-[90px] bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between shadow-sm shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger only */}
        <button
          onClick={onToggleSidebar}
          className={`${showMenuToggle ? "flex" : "hidden"} w-10 h-10 rounded-full border border-gray-200 bg-white text-teal-600 hover:bg-teal-50 transition items-center justify-center shadow-sm`}
        >
          <FontAwesomeIcon icon={faBars} className="text-lg" />
        </button>

        {/* Logo */}
        <img
          src={logo}
          alt="Skillnaav"
          className="h-11 object-contain"
        />
      </div>

      {/* Right */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faUser} className="text-gray-700 text-lg" />
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-44 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
            <button
              onClick={() => {
                localStorage.removeItem("userInfo");
                sessionStorage.removeItem("adminSelectedTab");
                nav("/admin/login");
              }}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
