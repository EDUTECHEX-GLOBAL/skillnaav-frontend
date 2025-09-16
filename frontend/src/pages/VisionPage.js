// src/pages/VisionPage.js
import React from "react";
import { Helmet } from "react-helmet";
import Navbar from "../components/Navbar";
import Vision from "../components/Vision";
import Footer from "../components/Footer";

const VisionPage = () => {
  return (
    <div className="font-inter">
      <Helmet>
        <title>Our Vision - SkillNaav</title>
        <meta
          name="description"
          content="Discover SkillNaav's vision and mission to empower students, partners, and admins through internships, learning opportunities, and advanced AI-driven solutions."
        />
      </Helmet>

      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div className="pt-20">
        <Vision />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default VisionPage;
