import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import axios from "../../../../api/axiosInstance";
import Loading from "../../../Warnings/Loading/Loading";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import partner2Image from "../../../../assets-webapp/partner2_img.jpg";
import ForgotPasswordModal from "../SignUpLogin/PartnerforgotPassword";
import { GoogleLogin } from "@react-oauth/google"; // 🔥 NEW

const isValidEmailDomain = (email) => {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!basicRegex.test(trimmed)) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase();

  const invalidDomainTypos = [
    "gmail.co", "yahoo.co", "hotmail.co", "outlook.co", "icloud.co",
    "gmail.c", "yahoo.c", "hotmail.c", "outlook.c", "icloud.c",
    "gmail.cm", "yahoo.cm", "hotmail.cm", "outlook.cm",
    "gmail.om", "yahoo.om", "hotmail.om", "outlook.om",
    "gmail.con", "yahoo.con", "hotmail.con", "outlook.con",
  ];
  if (invalidDomainTypos.includes(domain)) return false;

  const domainParts = domain.split(".");
  if (domainParts.some((p) => p.length === 0)) return false;
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;

  return true;
};

const validationSchema = Yup.object({
  email: Yup.string()
    .required("Email is required")
    .test(
      "valid-email-domain",
      "Please enter a valid email address with a valid domain (e.g. .com, .in)",
      (val) => isValidEmailDomain(val)
    ),
  password: Yup.string().required("Password is required"),
});

const PartnerLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    setError("");
    setLoading(true);
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const { data } = await axios.post("/api/partners/login", values, config);
  
      // Save token and adminApproved status to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("adminApproved", data.adminApproved);
      localStorage.setItem("partnerId", data._id);
      localStorage.setItem("partnerInfo", JSON.stringify(data));
      localStorage.setItem("loginTime", Date.now().toString());
      
      setLoading(false);
      navigate("/partner-main-page");
    } catch (err) {
      setLoading(false);
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Something went wrong"
      );
      setSubmitting(false);
    }
  };

  // 🔥 NEW: Google Login handler
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;

      const res = await axios.post("/api/partners/google-auth", { idToken });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("adminApproved", res.data.adminApproved);
      localStorage.setItem("partnerId", res.data._id);
      localStorage.setItem("partnerInfo", JSON.stringify({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        profileImage: res.data.profileImage,
        isGoogleUser: res.data.isGoogleUser,
        universityName: res.data.universityName,
        institutionId: res.data.institutionId,
        isPremium: res.data.isPremium ?? false,
        planType: res.data.planType ?? "Freemium",
        premiumExpiration: res.data.premiumExpiration ?? null,
        adminApproved: res.data.adminApproved,
        status: res.data.status,
      }));
      localStorage.setItem("loginTime", Date.now().toString());

      // 🔥 If Google partner hasn't filled institutional info yet, redirect to complete profile
 if (res.data.needsProfileCompletion) {
  navigate("/partner-create-account", {
    state: {                              // 🔥 ADD state
      googleSignup: true,
      name: res.data.name,
      email: res.data.email,
      token: res.data.token,
    }
  });
} else {
  navigate("/partner-main-page");
}
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Google login failed. Please try again.");
    }
  };
  
  return (
    <div className="flex flex-col xl:flex-row min-h-screen font-poppins bg-white">
      {/* Left Section */}
      <div className="hidden xl:flex xl:w-1/2 items-center justify-center">
        <img
          src={partner2Image}
          alt="Create Account"
          className="w-full h-full object-contain max-w-[830px] max-h-[900px] p-6 ml-6 shadow-lg"
        />
      </div>

      {/* Right Section */}
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center p-6 sm:p-8 w-full xl:w-1/2">
        <div className="w-full max-w-[380px] flex flex-col justify-center py-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-1.5 text-center text-gray-800">
            Dear Partner, Welcome Back!
          </h1>
          <h2 className="text-sm font-normal mb-5 text-center text-gray-500">
            Please sign in to your account
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 text-xs sm:text-sm p-2.5 mb-3 text-center rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <Loading />
          ) : (
            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={validationSchema}
              validateOnChange={true}
              validateOnBlur={true}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-3">
                  {/* Email Field */}
                  <div>
                    <Field
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      className={`!mt-0 w-full py-2.5 px-3.5 text-sm border rounded-lg focus:outline-none transition box-border ${
                        touched.email && errors.email
                          ? "!border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-gray-300 focus:ring-2 focus:ring-teal-500"
                      }`}
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-xs mt-1.5 font-medium"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="relative flex items-center w-full">
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        className={`!mt-0 w-full py-2.5 px-3.5 pr-11 text-sm border rounded-lg focus:outline-none transition box-border ${
                          touched.password && errors.password
                            ? "!border-red-500 focus:ring-2 focus:ring-red-200"
                            : "border-gray-300 focus:ring-2 focus:ring-teal-500"
                        }`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-600 p-1 focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <FontAwesomeIcon
                          icon={showPassword ? faEyeSlash : faEye}
                          className="text-sm"
                        />
                      </button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  {/* Remember Me & Forgot Password in one clean row */}
                  <div className="flex items-center justify-between pt-1 pb-0.5 text-xs sm:text-sm">
                    <label
                      htmlFor="rememberMe"
                      className="flex items-center gap-1.5 cursor-pointer text-gray-600 select-none"
                    >
                      <Field
                        type="checkbox"
                        name="rememberMe"
                        id="rememberMe"
                        className="form-checkbox h-3.5 w-3.5 text-teal-500 rounded transition duration-150 ease-in-out cursor-pointer"
                      />
                      <span className="text-xs text-gray-600">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700 transition duration-150 ease-in-out"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-teal-500 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors duration-300 shadow-sm"
                  >
                    Sign In
                  </button>
                </Form>
              )}
            </Formik>
          )}

          {/* Divider */}
          <div className="flex items-center my-4">
            <hr className="w-full border-gray-200" />
            <span className="px-3 text-xs text-gray-400 font-medium">OR</span>
            <hr className="w-full border-gray-200" />
          </div>

          {/* 🔥 Google Login Button */}
          <div className="w-full flex justify-center shadow-sm rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition [&>div]:!w-full [&>div>iframe]:!w-full">
            <GoogleLogin
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="100%"
              logo_alignment="left"
              onSuccess={handleGoogleLogin}
              onError={() => setError("Google login failed")}
            />
          </div>

          {/* Sign Up */}
          <p className="text-center text-xs sm:text-sm text-gray-600 mt-3.5">
            Don't have an account?{" "}
            <Link
              to="/partner-create-account"
              className="text-teal-600 hover:text-teal-700 font-semibold ml-1"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default PartnerLogin;