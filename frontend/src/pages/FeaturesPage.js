import React from "react";
import Navbar from "../components/Navbar";
import Features from "../components/Features";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";

function FeaturesPage() {
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
