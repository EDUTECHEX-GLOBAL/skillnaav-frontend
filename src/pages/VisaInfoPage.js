// src/pages/VisaInfoPage.js
import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axiosInstance";
import { SetSkillNaavData, HideLoading } from "../redux/rootSlice";

function VisaInfoPage() {
  const dispatch = useDispatch();
  const { skillnaavData } = useSelector((state) => state.root);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/skillnaav/get-skillnaav-data");
        dispatch(SetSkillNaavData(response.data));
      } catch (err) {
        console.error("Failed to load skillnaav data on VisaInfoPage:", err);
      } finally {
        dispatch(HideLoading());
      }
    };

    if (!skillnaavData || Object.keys(skillnaavData).length === 0) {
      fetchData();
    } else {
      dispatch(HideLoading());
    }
  }, [skillnaavData, dispatch]);

  return (
    <div className="font-inter min-h-screen flex flex-col justify-between">
      <Helmet>
        <title>Visa & Immigration Information - Skill Naav</title>
        <meta
          name="description"
          content="Learn about visa guidelines, international student work authorization (CPT, OPT, J-1), and immigration information for internships with Skill Naav."
        />
        <link rel="canonical" href="https://www.skillnaav.com/visa" />
      </Helmet>

      <Navbar />

      <main className="pt-28 pb-16 px-5 lg:px-20 max-w-5xl mx-auto w-full flex-grow">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 lg:p-12 shadow-sm">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Resource Center
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Visa & Immigration Information
          </h1>
          <p className="text-gray-600 text-base lg:text-lg leading-relaxed mb-6">
            Skill Naav supports international students and global talent in navigating work authorization,
            practical training (CPT / OPT / STEM OPT), exchange visitor visas (J-1), and global internship compliance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                CPT & OPT Guidance
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Step-by-step guidance on aligning internship roles with academic degree requirements and obtaining institutional authorization.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Employer & Partner Compliance
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Standardized verification documentation and mentorship agreements for host companies sponsoring student learning plans.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Have specific visa questions?
              </h3>
              <p className="text-gray-600 text-sm">
                Our immigration advisors and support team are ready to assist you.
              </p>
            </div>
            <a
              href="/contact"
              className="inline-block bg-[#451E5D] hover:bg-[#2c3b4e] text-white font-medium px-6 py-3 rounded-lg text-center transition duration-300 shrink-0"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default VisaInfoPage;
