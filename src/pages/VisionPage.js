// src/pages/VisionPage.js
import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { SetSkillNaavData } from "../redux/rootSlice"; // ✅ correct name & path
import Navbar from "../components/Navbar";
import Vision from "../components/Vision";
import Footer from "../components/Footer";

const VisionPage = () => {
  const dispatch = useDispatch();
  const { skillnaavData } = useSelector((state) => state.root);

 useEffect(() => {
  if (!skillnaavData || !skillnaavData.visionhead) {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE}/api/skillnaav/get-skillnaav-data`
        );

        dispatch(SetSkillNaavData(response.data));
      } catch (error) {
        console.error("Failed to fetch skillnaav data:", error);
      }
    };

    fetchData();
  }
}, [dispatch, skillnaavData]);
  return (
    <div className="font-inter">
      <Helmet>
        <title>Our Vision - SkillNaav</title>
        <meta
          name="description"
          content="Discover SkillNaav's vision and mission to empower students, partners, and admins through internships, learning opportunities, and advanced AI-driven solutions."
        />
      </Helmet>

      <Navbar />

      <div className="pt-20">
        <Vision />
      </div>

      <Footer />
    </div>
  );
};

export default VisionPage;