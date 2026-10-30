import React, { useState } from "react";
import SkillNaavLogo from "../assets/skillnaav_logo-250w.png";
import Menu from "../assets/Menu.svg";
import Close from "../assets/close.png";

const navLinks = [
  { name: "Discover", href: "/" }, // homepage
  { name: "Vision", href: "/vision" },   // keep inside home
  { name: "Features", href: "/features" },
  { name: "Team", href: "/team" },
  { name: "Pricing", href: "/pricing" },
  { name: "FAQs", href: "/faqs" },
  { name: "Contact", href: "/contact" },
];


const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white z-50 border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-16 w-full max-w-7xl mx-auto py-3">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <a href="/" aria-label="Home" className="flex-shrink-0">
            <img
              className="w-[130px] lg:w-[140px] xl:w-[150px]"
              src={SkillNaavLogo}
              alt="SkillNaav Logo"
            />
          </a>
          <div className="hidden lg:flex items-center gap-x-3 lg:gap-x-4 xl:gap-x-7 ml-2 xl:ml-6">
            {navLinks.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-[#36485C] font-medium text-sm xl:text-base hover:text-[#451E5D] transition duration-300 whitespace-nowrap"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-x-4 flex-shrink-0">
          <a
            href="/contact"
            className="hidden lg:inline-flex items-center justify-center font-medium text-white bg-[#451E5D] hover:bg-[#2c3b4e] px-4 py-2 rounded-md transition duration-300 whitespace-nowrap text-sm xl:text-base"
          >
            Request Call Back
          </a>
          <div className="lg:hidden flex items-center" onClick={toggleMenu}>
            <img
              src={menuOpen ? Close : Menu}
              alt="Menu Button"
              width={30}
              height={30}
              className="cursor-pointer transition-transform duration-300 transform hover:scale-110"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          } fixed top-0 left-0 w-full h-[100dvh] bg-white flex flex-col justify-start items-center gap-6 z-50 transition-transform duration-300 ease-in-out overflow-y-auto pb-10`}
        >
          <div className="flex justify-between items-center w-full px-4 sm:px-6 py-3 border-b border-gray-100">
            <a href="/" aria-label="Home" onClick={toggleMenu}>
              <img
                className="w-[130px] lg:w-[140px] xl:w-[150px]"
                src={SkillNaavLogo}
                alt="SkillNaav Logo"
              />
            </a>
            <img
              src={Close}
              alt="Close Menu"
              onClick={toggleMenu}
              width={30}
              height={30}
              className="cursor-pointer transition-transform duration-300 transform hover:scale-110"
            />
          </div>
          <div className="flex flex-col items-center gap-6 mt-6">
            {navLinks.map((item, index) => (
              <a
                key={index}
                href={item.href}
                onClick={toggleMenu}
                className="text-[#36485C] font-medium text-2xl transition duration-300 transform hover:scale-105"
              >
                {item.name}
              </a>
            ))}
            <a href="/contact" onClick={toggleMenu}>
              <div className="font-medium text-white bg-[#451E5D] hover:bg-[#2c3b4e] px-6 py-3 rounded-md transition duration-300 text-xl whitespace-nowrap">
                Request Call Back
              </div>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
