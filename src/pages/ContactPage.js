import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Features from "../components/Features";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axiosInstance";
import { SetSkillNaavData, HideLoading } from "../redux/rootSlice";

function FeaturesPage() {
  const dispatch = useDispatch();
  const { skillnaavData } = useSelector((state) => state.root);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/skillnaav/get-skillnaav-data");
        dispatch(SetSkillNaavData(response.data));
        dispatch(HideLoading());
      } catch (err) {
        console.error("Failed to load skillnaav data on FeaturesPage:", err);
        dispatch(HideLoading());
      }
    };

    if (!skillnaavData) fetchData();
  }, [skillnaavData, dispatch]);

  return (
    <>
      <Helmet>
        <title>Skillnaav | Features</title>
        <meta
          name="description"
          content="Explore the powerful features of Skillnaav that make internship discovery smarter and easier."
        />
      </Helmet>
      <Navbar />
      <div className="pt-20 px-[20px] lg:px-20 mx-auto">
        <Features />
      </div>
      <Footer />
    </>
  );
}

export default FeaturesPage;
