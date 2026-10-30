// src/pages/PrivacyPage.js
import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axiosInstance";
import { SetSkillNaavData, HideLoading } from "../redux/rootSlice";

function PrivacyPage() {
  const dispatch = useDispatch();
  const { skillnaavData } = useSelector((state) => state.root);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/skillnaav/get-skillnaav-data");
        dispatch(SetSkillNaavData(response.data));
      } catch (err) {
        console.error("Failed to load skillnaav data on PrivacyPage:", err);
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
        <title>Privacy Policy - Skill Naav</title>
        <meta
          name="description"
          content="Learn about how Skill Naav collects, uses, protects, and handles personal data and privacy across our educational, internship, and partner platforms."
        />
        <link rel="canonical" href="https://www.skillnaav.com/privacy" />
      </Helmet>

      <Navbar />

      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-20 max-w-5xl mx-auto w-full flex-grow">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/80 rounded-2xl p-6 sm:p-10 lg:p-12 shadow-sm mb-10">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            Legal & Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-3xl">
            Effective Date: January 1, 2024 &bull; Last Updated: October 2024
          </p>
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed mt-4">
            At <strong>Skill Naav</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), we are dedicated to safeguarding your personal privacy and protecting the integrity of your personal information across all our student, partner, institution, and administrative services.
          </p>
        </div>

        {/* Content sections */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-10 lg:p-12 space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">1.</span> Information We Collect
            </h2>
            <p>
              When you register for an account, apply for internships, take skill assessments, or interact with our platform, we may collect:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li><strong>Personal Identifiers:</strong> Name, email address, phone number, physical address, and date of birth.</li>
              <li><strong>Academic & Career Records:</strong> University affiliation, major, resume, qualifications, transcripts, and skill assessment results.</li>
              <li><strong>Verification Information:</strong> Student ID verification, guardian consent records (for minors), and identity confirmation.</li>
              <li><strong>Technical Data:</strong> IP address, device details, browser type, cookies, and system interaction logs.</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">2.</span> How We Use Your Information
            </h2>
            <p>
              We utilize collected data solely for legitimate educational and platform purposes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li>Facilitating internship applications, partner matching, and hiring pipelines.</li>
              <li>Generating and administering personalized skill assessments and interview feedback.</li>
              <li>Issuing verified credentials and digital completion certificates.</li>
              <li>Maintaining platform security, fraud prevention, and regulatory compliance.</li>
              <li>Providing support, system notifications, and essential service updates.</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">3.</span> Privacy for Minors & Students
            </h2>
            <p>
              In compliance with COPPA (Children&apos;s Online Privacy Protection Act) and applicable provincial and federal regulations in the United States and Canada:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li>Users under the age of 18 require parental or legal guardian consent before their profile and applications are shared with prospective internship partners.</li>
              <li>We never sell student personal data to third parties for advertising or marketing purposes.</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">4.</span> Data Sharing & Third-Party Services
            </h2>
            <p>
              We only share personal data with verified third parties when required for platform functionality:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li><strong>Partner Companies:</strong> Sharing candidate profiles and assessment scores only when candidates apply for internship openings.</li>
              <li><strong>Cloud & Security Infrastructure:</strong> Secure cloud hosting, database encryption, and transactional email providers operating under strict confidentiality.</li>
              <li><strong>Legal Compliance:</strong> When strictly required by law, subpoena, or valid regulatory process.</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">5.</span> Data Security & Retention
            </h2>
            <p>
              We implement industry-standard administrative, physical, and technical security measures—including TLS encryption in transit and AES encryption at rest—to guard your sensitive data. Personal information is retained only as long as necessary to fulfill the educational purposes outlined in this policy or satisfy statutory retention rules.
            </p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">6.</span> Your Rights & Choices
            </h2>
            <p>
              Depending on your jurisdiction (including rights under CCPA, PIPEDA, and GDPR), you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li>Access, review, or request a copy of the personal data we hold about you.</li>
              <li>Request correction or deletion of inaccurate personal information.</li>
              <li>Withdraw consent for optional data processing at any time.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact our Data Protection team at{" "}
              <a href="mailto:info@skillnaav.com" className="text-[#451E5D] font-medium underline hover:text-purple-900">
                info@skillnaav.com
              </a>.
            </p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-[#451E5D]">7.</span> Contact Us
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, please reach out to us:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 text-sm text-gray-800 space-y-1">
              <p className="font-semibold text-gray-900">SkillNaav Privacy & Compliance Office</p>
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

export default PrivacyPage;
