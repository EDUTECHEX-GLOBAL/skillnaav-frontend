// src/pages/VisionPage.js
import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Navbar from "../components/Navbar";
import Vision from "../components/Vision";
import Footer from "../components/Footer";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axiosInstance";
import { SetSkillNaavData, HideLoading } from "../redux/rootSlice";

const VisionPage = () => {
  const dispatch = useDispatch();
  const { skillnaavData } = useSelector((state) => state.root);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/skillnaav/get-skillnaav-data");
        dispatch(SetSkillNaavData(response.data));
      } catch (err) {
        console.error("Failed to load skillnaav data on VisionPage:", err);
      } finally {
        dispatch(HideLoading());
      }
    };

    if (!skillnaavData || Object.keys(skillnaavData).length === 0) {
      fetchData();
    } else {
      dispatch(HideLoading());
    }
  }, [skillnaavData, dispatch]);

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
