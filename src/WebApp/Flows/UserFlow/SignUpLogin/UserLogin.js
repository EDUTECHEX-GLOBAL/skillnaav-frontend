// File: UserLogin.js

import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import loginImage from "../../../../assets-webapp/login-image.png";
import Loading from "../../../Warnings/Loading/Loading";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import ForgotPasswordModal from "../SignUpLogin/UserforgotPassword";
import { GoogleLogin } from "@react-oauth/google";
import axios from "../../../../api/axiosInstance";
import { isValidEmail } from "../../../../utils/validation";

const validationSchema = Yup.object({
  email: Yup.string()
    .required("Email is required")
    .test(
      "valid-email-domain",
      "Please enter a valid email address with a valid domain (e.g. .com, .in)",
      (val) => isValidEmail(val)
    ),
  password: Yup.string().required("Password is required"),
});

const UserLogin = () => {
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

      const { data } = await axios.post("/api/users/login", values, config);

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      localStorage.removeItem("userToken");
      localStorage.removeItem("studentInfo");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("sessionId");
      localStorage.setItem("userToken", data.token);

      localStorage.setItem("studentInfo", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        profileImage: data.profileImage,
        isPremium: data.isPremium,
        planType: data.planType,
        premiumExpiration: data.premiumExpiration ?? null, // ✅ FIX: was missing — Navbar reads this from localStorage on load
        adminApproved: data.adminApproved,
        status: data.status,
      }));

      if (data.schoolAdminId) {
        localStorage.setItem("schoolAdminId", data.schoolAdminId);
      }

      const sessionRes = await axios.post(
        "/api/sessions/login",
        {},
        {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        }
      );

      if (sessionRes?.data?.sessionId) {
        localStorage.setItem("sessionId", sessionRes.data.sessionId);
      }

      localStorage.setItem("loginTime", Date.now());

      setLoading(false);
      navigate("/user-main-page");
    } catch (err) {
      console.error("Login error:", err.response || err.message);
      setError(err.response?.data?.message || "Something went wrong");
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row min-h-screen font-poppins bg-white">
      {/* Left Section (Image) */}
      <div className="hidden xl:flex xl:w-1/2 items-center justify-center">
        <img
          src={loginImage}
          alt="login"
          className="w-full h-full object-contain max-w-[830px] max-h-[900px] p-6 ml-6 shadow-lg"
        />
      </div>

      {/* Right Section (Form) */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 w-full xl:w-1/2 min-h-screen xl:min-h-full">
        <div className="w-full max-w-sm flex flex-col justify-center">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-1.5">
              Dear Student, Welcome!
            </h1>
            <p className="text-sm text-gray-500">
              Please sign in to your account
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm px-4 py-2.5 mb-4 text-center rounded-lg shadow-sm">
              {error}
            </div>
          )}

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
                <Form className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Email Address
                    </label>
                    <Field
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      className={`!mt-0 w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-all placeholder:text-gray-400 ${
                        touched.email && errors.email
                          ? "!border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                      }`}
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-xs mt-1 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Password
                    </label>
                    <div className="relative flex items-center w-full">
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        className={`!mt-0 w-full px-3.5 py-2.5 pr-10 text-sm bg-white border rounded-lg focus:outline-none transition-all placeholder:text-gray-400 ${
                          touched.password && errors.password
                            ? "!border-red-500 focus:ring-2 focus:ring-red-200"
                            : "border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                        }`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-600 p-1 focus:outline-none transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <FontAwesomeIcon
                          icon={showPassword ? faEyeSlash : faEye}
                          size="sm"
                        />
                      </button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-xs mt-1 font-medium"
                    />
                  </div>

                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="text-xs font-medium text-purple-600 hover:text-purple-700 transition duration-150 ease-in-out hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-purple-700 active:scale-[0.99] transition-all duration-200 shadow-sm disabled:opacity-70 mt-1"
                  >
                    Sign In
                  </button>
                </Form>
              )}
            </Formik>
          )}

          <div className="flex items-center my-4">
            <hr className="w-full border-gray-200" />
            <span className="px-3 text-xs text-gray-400 font-medium uppercase tracking-wider">OR</span>
            <hr className="w-full border-gray-200" />
          </div>

          <div className="w-full flex justify-center shadow-sm rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-all [&>div]:!w-full [&>div>iframe]:!w-full">
            <GoogleLogin
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="100%"
              logo_alignment="left"
              onSuccess={async (credentialResponse) => {
                try {
                  const idToken = credentialResponse.credential;

                  const res = await axios.post("/api/users/google-auth", { idToken });

                  localStorage.setItem("userToken", res.data.token);

                  localStorage.setItem("studentInfo", JSON.stringify({
                    _id: res.data._id,
                    name: res.data.name,
                    email: res.data.email,
                    profileImage: res.data.profileImage,
                    isGoogleUser: res.data.isGoogleUser,

                    // IMPORTANT
                    adminApproved: res.data.adminApproved,
                    status: res.data.status,
                    isActive: res.data.isActive,

                    isPremium: res.data.isPremium ?? false,
                    planType: res.data.planType ?? "Free",
                    premiumExpiration: res.data.premiumExpiration ?? null,
                  }));

                  localStorage.setItem("loginTime", Date.now());

                  if (res.data.needsProfileCompletion) {
                    navigate("/user-create-account");
                  } else {
                    navigate("/user-main-page");
                  }

                } catch (err) {
                  console.error("Google Auth error:", err);
                  setError(
                    err.response?.data?.message ||
                      "Unable to sign in with Google. Please try again.",
                  );
                }
              }}
              onError={() =>
                setError("Unable to sign in with Google. Please try again.")
              }
            />
          </div>

          <div className="flex justify-center mt-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Don't have an account?{" "}
              <Link 
                to="/user-create-account" 
                onClick={() => {
                  localStorage.removeItem("userToken");
                  localStorage.removeItem("studentInfo");
                  sessionStorage.removeItem("reg_step");
                  sessionStorage.removeItem("reg_formdata");
                }}
                className="text-purple-600 hover:text-purple-700 font-semibold ml-1 hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default UserLogin;
//push changes
