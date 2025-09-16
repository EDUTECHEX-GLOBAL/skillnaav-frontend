import React from "react";
import Navbar from "../components/Navbar";
import Pricing from "../components/Pricing";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";

function PricingPage() {
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
