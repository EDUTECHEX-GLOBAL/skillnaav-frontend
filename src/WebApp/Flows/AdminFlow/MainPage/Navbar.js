// Navbar.js
import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faUser,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const Navbar = ({ toggleSidebar }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const nav = useNavigate();

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="flex items-center justify-between bg-white p-4 border-b sticky top-0 z-20">
      {/* mobile hamburger */}
      <button
        className="lg:hidden text-2xl text-gray-700"
        onClick={toggleSidebar}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>

      {/* Empty placeholder to align user icon to right */}
      <div className="flex-1" />

      <div className="relative" ref={ref}>
        <button onClick={() => setOpen((v) => !v)}>
          <FontAwesomeIcon icon={faUser} className="text-xl text-gray-700" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg">
            <button
              onClick={() => {
                localStorage.removeItem("userInfo");
                nav("/admin/login");
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
