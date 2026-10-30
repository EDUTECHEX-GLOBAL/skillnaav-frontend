import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Carousel } from "antd";
import { useNavigate } from "react-router-dom";
import HeroImage from "../assets/app_mockup.png";
import BlueArrow from "../assets/blue-button.svg";
import Google from "../assets/Google.svg";
import Slack from "../assets/Slack.svg";
import Trustpilot from "../assets/Trustpilot.svg";
import Cnn from "../assets/CNN.svg";
import Clutch from "../assets/Clutch.svg";
import { useSelector } from "react-redux";


const Gradient = "/Gradient.webp";

const Discover = () => {
  const { skillnaavData } = useSelector((state) => state.root);
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate("/choose-role");
  };

  // Add this useEffect at the top of the Discover component
useEffect(() => {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = "/Gradient.webp";
  link.type = "image/webp";
  link.setAttribute("fetchpriority", "high");
  document.head.appendChild(link);
  return () => document.head.removeChild(link);
}, []);
  // ✅ Extract data — will be null/undefined until API loads
  const discover = skillnaavData?.discover?.[0];
  const discovercompimg = skillnaavData?.discovercompimg || [];
  const {
    discoverheading,
    discoversubheading,
    tryforfreebtn,
    viewpricebtn,
    imgUrl,
  } = discover || {};

  const renderCompanyImages = () => {
    const companies = discovercompimg.length
      ? discovercompimg.slice(0, 5)
      : [
          { src: Google, alt: "Google" },
          { src: Slack, alt: "Slack" },
          { src: Trustpilot, alt: "Trustpilot" },
          { src: Cnn, alt: "CNN" },
          { src: Clutch, alt: "Clutch" },
        ];

    return (
      <Carousel autoplay dots={false}>
        {companies.map((company, index) => (
          <div key={index}>
            <img
              src={company.imageUrl || company.src}
              alt={company.alt || `company ${index + 1}`}
              className="w-24 h-24 object-contain mx-auto"
            />
          </div>
        ))}
      </Carousel>
    );
  };

  return (
    <div id="discover" className="pt-20 lg:pt-24 scroll-mt-28 lg:scroll-mt-32">
      <div className="px-6 sm:px-10 lg:px-20 xl:px-32 text-center">

        {/* ✅ Skeleton shown while API loads, real content after */}
        {!discover ? (
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto mb-4" />
            <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto mb-6" />
            <div className="flex justify-center gap-4">
              <div className="h-12 bg-blue-200 rounded w-32" />
              <div className="h-12 bg-gray-200 rounded w-32 border" />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl sm:text-4xl font-medium text-gray-900 lg:text-5xl xl:text-6xl lg:leading-snug">
              {discoverheading}
            </h1>
            <p className="pt-4 sm:pt-6 text-base sm:text-lg text-gray-700 lg:text-lg xl:text-xl lg:leading-7">
              {discoversubheading}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-6 sm:pt-8">
              <button
                className="bg-blue-600 text-white w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-4 rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer"
                onClick={handleButtonClick}
              >
                {tryforfreebtn}
              </button>
              <button className="text-blue-600 font-medium flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-4 rounded-md border border-blue-600 hover:bg-blue-100 transition duration-200">
                <a href="#pricing">{viewpricebtn}</a>
                <span>
                  <img src={BlueArrow} alt="Learn More" />
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ✅ Gradient background & relative image layout */}
      <div className="relative flex flex-col items-center w-full mt-6 sm:mt-8">
        <div className="w-full relative h-[480px] sm:h-[580px] lg:h-[680px] xl:h-[760px] overflow-hidden rounded-b-xl">

          {/* Gradient background */}
          <img
            src={Gradient}
            alt=""
            fetchpriority="high"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Hero Image mockup */}
          <div className="absolute top-4 sm:top-6 lg:top-8 inset-x-0 flex justify-center px-4">
            <img
              src={imgUrl || HeroImage}
              alt="Hero"
              className="max-h-[220px] sm:max-h-[320px] lg:max-h-[400px] xl:max-h-[460px] object-contain drop-shadow-xl"
            />
          </div>

          {/* Companies */}
          <div className="absolute bottom-3 sm:bottom-5 lg:bottom-8 inset-x-0 flex flex-col items-center">
            <div className="w-full px-4 sm:px-8 lg:px-20 xl:px-32 text-center text-white">
              <p className="text-base sm:text-lg lg:text-xl mb-3 block font-semibold drop-shadow-md">
                Navigate to the Best Companies
              </p>
              {renderCompanyImages()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Discover;