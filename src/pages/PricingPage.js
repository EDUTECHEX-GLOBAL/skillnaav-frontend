import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Pricing from "../components/Pricing";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axiosInstance"; // ✅ FIXED
import { SetSkillNaavData, HideLoading } from "../redux/rootSlice";

function PricingPage() {
  const dispatch = useDispatch();
  const { skillnaavData } = useSelector((state) => state.root);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/skillnaav/get-skillnaav-data");
        dispatch(SetSkillNaavData(response.data));
      } catch (err) {
        console.error("Failed to load skillnaav data on PricingPage:", err);
      } finally {
        dispatch(HideLoading()); // ✅ always runs
      }
    };

    if (!skillnaavData || Object.keys(skillnaavData).length === 0) {
      fetchData();
    } else {
      dispatch(HideLoading());
    }
  }, [skillnaavData, dispatch]);

  return (
    <>
      <Helmet>
        <title>Skillnaav | Pricing</title>
        <meta
          name="description"
          content="Check out Skillnaav's flexible pricing plans."
        />
      </Helmet>
      <Navbar />
      <div className="pt-20 px-[20px] lg:px-20 mx-auto">
        <Pricing />
      </div>
      <Footer />
    </>
  );
}

export default PricingPage;
