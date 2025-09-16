import React from "react";
import Navbar from "../components/Navbar";
import Faqs from "../components/Faq";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";

function FaqPage() {
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
