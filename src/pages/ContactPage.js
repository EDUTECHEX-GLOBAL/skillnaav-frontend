import React from "react";
import Navbar from "../components/Navbar";
import Contact from "../components/Contact"; // assuming you already have this component
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";

function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Skillnaav | Contact Us</title>
        <meta
          name="description"
          content="Get in touch with the Skillnaav team. We're here to help with your internship and hiring needs."
        />
      </Helmet>
      <Navbar />
      <div className="pt-20 px-[20px] lg:px-20 mx-auto">
        <Contact />
      </div>
      <Footer />
    </>
  );
}

export default ContactPage;
