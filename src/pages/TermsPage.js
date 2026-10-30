// src/pages/TermsPage.js
import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axiosInstance";
import { SetSkillNaavData, HideLoading } from "../redux/rootSlice";

function TermsPage() {
  const dispatch = useDispatch();
  const { skillnaavData } = useSelector((state) => state.root);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/skillnaav/get-skillnaav-data");
        dispatch(SetSkillNaavData(response.data));
      } catch (err) {
        console.error("Failed to load skillnaav data on TermsPage:", err);
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
    <div className="font-inter min-h-screen flex flex-col justify-between bg-[#FBFBFE]">
      <Helmet>
        <title>Terms and Conditions - Skill Naav</title>
        <meta
          name="description"
          content="Review the Terms and Conditions and Terms of Service governing use of the Skill Naav platform, internships, assessments, and partner portals."
        />
        <link rel="canonical" href="https://www.skillnaav.com/terms" />
      </Helmet>

      <Navbar />

      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-20 max-w-5xl mx-auto w-full flex-grow">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-100/80 rounded-2xl p-6 sm:p-10 lg:p-12 shadow-sm mb-10">
          <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            Terms of Service
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Terms and Conditions
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-3xl">
            Effective Date: January 1, 2024 &bull; Last Updated: October 2024
          </p>
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed mt-4">
            Welcome to <strong>Skill Naav</strong>. By accessing or using our websites, software, APIs, mobile interfaces, or related services (collectively, the &ldquo;Platform&rdquo;), you agree to be bound by these Terms and Conditions.
          </p>
        </div>

        {/* Content sections */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-10 lg:p-12 space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">1.</span> Account Registration & Eligibility
            </h2>
            <p>
              To access certain features of Skill Naav, you must create an account as a Student, Partner, School Administrator, or System Admin:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li>You agree to provide true, accurate, and up-to-date information during the registration process.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</li>
              <li>Students under 18 must obtain valid parental/guardian consent prior to participating in internship matching and partner communications.</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">2.</span> Platform Use & Acceptable Behavior
            </h2>
            <p>
              Users must conduct themselves professionally and adhere to the following standards:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li>Do not cheat, submit fraudulent answers, or bypass proctoring tools during skill assessments.</li>
              <li>Do not upload false resumes, fraudulent credentials, or defamatory or infringing content.</li>
              <li>Do not attempt to reverse engineer, scrape, probe, or compromise platform security.</li>
              <li>Partners must offer legitimate learning, training, or internship opportunities in compliance with applicable employment and labor laws.</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">3.</span> Assessments & Certifications
            </h2>
            <p>
              Skill Naav provides automated skill assessments, AI evaluations, and verifiable completion certificates:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li>Assessment results and badges represent performance at the time of completion and do not guarantee employment or specific academic credit unless expressly affirmed by your institution.</li>
              <li>Certificates issued via Skill Naav can be verified using the unique Certificate ID on our verification portal.</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">4.</span> Intellectual Property Rights
            </h2>
            <p>
              All trademarks, software, logos, content, assessment questions, and graphical designs on Skill Naav are the property of Skill Naav or its licensors and are protected by international intellectual property laws. You may not reproduce or distribute any platform content without prior written authorization.
            </p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">5.</span> Disclaimers & Limitation of Liability
            </h2>
            <p>
              The platform and all educational resources are provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. Skill Naav disclaims all warranties of any kind, whether express or implied. In no event shall Skill Naav be liable for indirect, incidental, special, or consequential damages resulting from your use of the platform.
            </p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">6.</span> Termination & Modifications
            </h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms or compromise platform integrity. We may update these Terms periodically; your continued use of Skill Naav following changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">7.</span> Contact & Inquiries
            </h2>
            <p>
              For any questions regarding these Terms and Conditions, please contact us:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 text-sm text-gray-800 space-y-1">
              <p className="font-semibold text-gray-900">SkillNaav Legal Department</p>
              <p>Email: <a href="mailto:info@skillnaav.com" className="text-[#451E5D] underline">info@skillnaav.com</a></p>
              <p>Website: <a href="https://www.skillnaav.com" className="text-[#451E5D] underline">https://www.skillnaav.com</a></p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default TermsPage;
