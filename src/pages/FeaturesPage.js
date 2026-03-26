import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { SetSkillNaavData } from "../redux/rootSlice";
import Navbar from "../components/Navbar";
import Features from "../components/Features";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";

function FeaturesPage() {
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