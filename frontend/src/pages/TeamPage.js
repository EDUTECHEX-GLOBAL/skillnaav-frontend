import React from "react";
import Navbar from "../components/Navbar";
import Team from "../components/Team/Team";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";

function TeamPage() {
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
