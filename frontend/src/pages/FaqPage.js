import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { SetSkillNaavData } from "../redux/rootSlice";
import Navbar from "../components/Navbar";
import Faqs from "../components/Faq";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";

function FaqPage() {
  const dispatch = useDispatch();
  const { skillnaavData } = useSelector((state) => state.root);

  useEffect(() => {
    if (!skillnaavData || !skillnaavData.faq) {
      const fetchData = async () => {
        try {
          const response = await axios.get("/api/skillnaav/get-skillnaav-data");
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
        <title>Skillnaav | FAQs</title>
        <meta
          name="description"
          content="Find answers to frequently asked questions about Skillnaav, internships, and how our platform works."
        />
      </Helmet>
      <Navbar />
      <div className="pt-20 px-[20px] lg:px-20 mx-auto">
        <Faqs />
      </div>
      <Footer />
    </>
  );
}

export default FaqPage;