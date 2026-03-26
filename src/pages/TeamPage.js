import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { SetSkillNaavData } from "../redux/rootSlice";
import Navbar from "../components/Navbar";
import Team from "../components/Team/Team";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";

function TeamPage() {
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
        <title>Skillnaav | Our Team</title>
        <meta
          name="description"
          content="Meet the Skillnaav team — innovators, developers, and creators working to transform the internship discovery process."
        />
      </Helmet>
      <Navbar />
      <div className="pt-20 px-[20px] lg:px-20 mx-auto">
        <Team />
      </div>
      <Footer />
    </>
  );
}

export default TeamPage;