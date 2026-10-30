import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom"; // 🔥 add useLocation
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import axios from "../../../../api/axiosInstance";
import partner2Image from "../../../../assets-webapp/partner2_img.jpg";
import { GoogleLogin } from "@react-oauth/google"; // 🔥 NEW

// --- VALIDATION SCHEMAS ---

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

const nameRegex = /^[a-zA-Z\s'-]+$/;
const universityNameRegex = /^[a-zA-Z0-9\s&.,'-]+$/;
const institutionIdRegex = /^[a-zA-Z0-9/-]+$/;

// Step 1: Account Creation
const step1ValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .max(50, "Full Name must not exceed 50 characters")
    .matches(nameRegex, "Full Name can only contain letters, spaces, hyphens, and apostrophes")
    .required("Full Name is Required"),
  email: Yup.string()
    .required("Email is Required")
    .test(
      "valid-email-domain",
      "Please enter a valid email address with a valid domain (e.g. .com, .in)",
      (val) => isValidEmailDomain(val)
    ),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(/[A-Z]/, "Must contain an uppercase letter")
    .matches(/[a-z]/, "Must contain a lowercase letter")
    .matches(/[0-9]/, "Must contain a number")
    .matches(/[!@#$%^&*-_=+]/, "Must contain a special character")
    .required("Password is Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is Required"),
});

// Step 2 (Final Step): Institutional Info & Profile Picture
const step2ValidationSchema = Yup.object({
  universityName: Yup.string()
    .trim()
    .max(100, "University/Company name must not exceed 100 characters")
    .matches(
      universityNameRegex,
      "University/Company name can only contain letters, numbers, spaces, and basic punctuation (& . , - ')"
    )
    .required("University/Company Name is Required"),
  institutionId: Yup.string()
    .trim()
    .max(30, "Institutional ID must not exceed 30 characters")
    .matches(
      institutionIdRegex,
      "Institutional ID can only contain alphanumeric characters, hyphens (-), and slashes (/)"
    )
    .required("Institutional ID is Required"),
});


const PartnerSignUpFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 🔥 NEW: Track whether the partner came via Google signup
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);

  // Timer state for Resend OTP button
  const [resendTimer, setResendTimer] = useState(0);

  // Consolidated form data state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
    universityName: "",
    institutionId: "",
    profileImageFile: null,
    profileImageUrl: null,
    // 🔥 NEW: Store token from Google signup to authenticate the complete-profile call
    token: null,
  });

  // --- TIMER EFFECT ---
  useEffect(() => {
    let timerId;
    if (resendTimer > 0) {
      timerId = setInterval(() => {
        setResendTimer((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [resendTimer, step]);

  const startResendTimer = () => {
    setResendTimer(60);
  };

  const location = useLocation();

  useEffect(() => {
    const state = location.state;
    if (state?.googleSignup) {
      setIsGoogleSignup(true);
      setFormData((prev) => ({
        ...prev,
        name: state.name || "",
        email: state.email || "",
        token: state.token || null,
      }));
      setStep(2);
    } else if (state?.email) {
      setFormData((prev) => ({
        ...prev,
        email: state.email,
      }));
    }
  }, [location.state]);
  // --- STEP 1: ACCOUNT & OTP LOGIC ---

  const handleStep1Submit = async (values, { setSubmitting }) => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const check = await axios.post("/api/partners/check-email", {
        email: values.email.trim(),
      });

      if (check.data.exists) {
        setErrorMessage(check.data.message || "Partner already registered.");
        setSubmitting(false);
        return;
      }

      await axios.post("/api/partners/send-verification-code", {
        email: values.email.trim(),
      });

      setFormData((prev) => ({
        ...prev,
        ...values,
        otp: "",
      }));
      setStep(1.5);
      startResendTimer();

    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  // RESEND OTP
  const resendOtp = async () => {
    if (resendTimer > 0) return;

    setErrorMessage("");
    setSuccessMessage("");
    try {
      await axios.post("/api/partners/send-verification-code", {
        email: formData.email,
      });
      startResendTimer();
      setSuccessMessage("New verification code sent to your email.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to resend OTP.");
    }
  };

  // VERIFY OTP
  const verifyOtpAndProceed = async (values, { setSubmitting }) => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const verify = await axios.post("/api/partners/verify-otp", {
        email: formData.email,
        otp: values.otp,
      });

      if (verify.data.success) {
        setFormData((prev) => ({ ...prev, otp: values.otp }));
        setStep(2);
      }
    } catch (error) {
      setErrorMessage("Invalid or expired OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🔥 NEW: Google Sign-Up handler
  // On success: creates partner account via Google, then skips OTP and goes straight to Step 2
  const handleGoogleSignup = async (credentialResponse) => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const idToken = credentialResponse.credential;

      const res = await axios.post("/api/partners/google-auth", { idToken });

      // Pre-fill name and email from Google, save token for the complete-profile call
      setFormData((prev) => ({
        ...prev,
        name: res.data.name,
        email: res.data.email,
        token: res.data.token,
      }));

      setIsGoogleSignup(true);

      // If profile is already complete (returning Google partner), go to main page
      if (!res.data.needsProfileCompletion) {
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
        navigate("/partner-main-page");
        return;
      }

      // 🔥 New Google partner — skip OTP (email already verified by Google), go to Step 2
      setStep(2);

    } catch (err) {
      console.error(err);
      setErrorMessage("Google sign-up failed. Please try again.");
    }
  };

  // --- STEP 2 (FINAL): INSTITUTIONAL INFO & PICTURE LOGIC ---

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profileImageFile: file,
        profileImageUrl: URL.createObjectURL(file),
      }));
    }
  };

  const showRegistrationSuccess = () => {
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate("/partner/login");
  };

  const handleStep2Submit = async (values, { setSubmitting }) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.profileImageFile) {
      setErrorMessage("Profile picture is required.");
      setSubmitting(false);
      return;
    }

    try {
      const finalFormData = new FormData();
      finalFormData.append("universityName", values.universityName.trim());
      finalFormData.append("institutionId", values.institutionId.trim());
      finalFormData.append("profileImage", formData.profileImageFile);

      if (isGoogleSignup) {
        // 🔥 Google signup path — call complete-profile endpoint with Bearer token
        const response = await axios.post(
          "/api/partners/complete-profile",
          finalFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${formData.token}`,
            },
          }
        );

        // Save everything to localStorage after profile is complete
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("adminApproved", response.data.adminApproved);
        localStorage.setItem("partnerId", response.data._id);
        localStorage.setItem("partnerInfo", JSON.stringify({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          profileImage: response.data.profileImage,
          isGoogleUser: response.data.isGoogleUser,
          universityName: response.data.universityName,
          institutionId: response.data.institutionId,
          isPremium: response.data.isPremium ?? false,
          planType: response.data.planType ?? "Freemium",
          premiumExpiration: response.data.premiumExpiration ?? null,
          adminApproved: response.data.adminApproved,
          status: response.data.status,
        }));
        localStorage.setItem("loginTime", Date.now().toString());

        showRegistrationSuccess();

      } else {
        // Normal signup path — call register endpoint with all fields
        finalFormData.append("name", formData.name.trim());
        finalFormData.append("email", formData.email.trim());
        finalFormData.append("password", formData.password);
        finalFormData.append("confirmPassword", formData.password);

        const response = await axios.post(
          "/api/partners/register",
          finalFormData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (response.status === 201) {
          showRegistrationSuccess();
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };


  // --- RENDERING STEPS ---

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          // STEP 1: Account Creation Form
          <Formik
            initialValues={{
              name: formData.name,
              email: formData.email,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
            }}
            enableReinitialize
            validationSchema={step1ValidationSchema}
            onSubmit={handleStep1Submit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-3">
                {/* Name */}
                <div>
                  <Field
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    maxLength={50}
                    className="!mt-0 w-full py-2.5 px-3.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition box-border"
                  />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Email */}
                <div>
                  <Field
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="!mt-0 w-full py-2.5 px-3.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition box-border"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Password */}
                <div>
                  <div className="relative flex items-center w-full">
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      className="!mt-0 w-full py-2.5 px-3.5 pr-11 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition box-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeIcon className="h-4 w-4" />
                      ) : (
                        <EyeSlashIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="relative flex items-center w-full">
                    <Field
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      className="!mt-0 w-full py-2.5 px-3.5 pr-11 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition box-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="h-4 w-4" />
                      ) : (
                        <EyeSlashIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-500 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors duration-300 shadow-sm disabled:bg-teal-300"
                >
                  Send Verification Code
                </button>

                {/* 🔥 Google Sign-Up — shown only on Step 1 */}
                <div className="flex items-center my-3.5">
                  <hr className="w-full border-gray-200" />
                  <span className="px-3 text-xs text-gray-400 font-medium uppercase">OR</span>
                  <hr className="w-full border-gray-200" />
                </div>

                <div className="w-full flex justify-center shadow-sm rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition [&>div]:!w-full [&>div>iframe]:!w-full">
                  <GoogleLogin
                    text="signup_with"
                    shape="rectangular"
                    theme="outline"
                    size="large"
                    width="100%"
                    logo_alignment="left"
                    onSuccess={handleGoogleSignup}
                    onError={() => setErrorMessage("Google sign-up failed")}
                  />
                </div>
              </Form>
            )}
          </Formik>
        );

      case 1.5:
        return (
          // STEP 1.5: OTP Verification
          <Formik
            initialValues={{ otp: formData.otp }}
            onSubmit={verifyOtpAndProceed}
          >
            {({ isSubmitting, values, handleChange }) => (
              <Form className="space-y-3">
                <p className="text-center text-xs sm:text-sm text-gray-600 mb-2">
                  A verification code has been sent to <strong>{formData.email}</strong>.
                </p>
                <div>
                  <input
                    type="text"
                    name="otp"
                    value={values.otp}
                    onChange={handleChange}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                    className="!mt-0 w-full py-2.5 px-3.5 border border-gray-300 rounded-lg text-center tracking-widest text-base focus:ring-2 focus:ring-teal-500 focus:outline-none box-border"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-500 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors duration-300 shadow-sm disabled:bg-teal-300"
                >
                  Verify OTP & Continue
                </button>

                {/* RESEND OTP BUTTON */}
                <div className="mt-3 text-center">
                  {resendTimer > 0 ? (
                    <p className="text-gray-500 text-xs">Resend available in <strong>{resendTimer}</strong>s</p>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={isSubmitting}
                      className="text-teal-600 text-xs font-semibold hover:underline disabled:text-gray-400"
                    >
                      Resend Verification Code
                    </button>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        );

      case 2:
        return (
          // STEP 2 (FINAL): Institutional Info & Profile Picture
          <Formik
            initialValues={{ universityName: formData.universityName, institutionId: formData.institutionId }}
            validationSchema={step2ValidationSchema}
            onSubmit={handleStep2Submit}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-3">
                <h2 className="text-xs sm:text-sm font-semibold text-gray-700 bg-purple-50 border border-purple-200 py-2 px-3 rounded-lg text-center">
                  INSTITUTIONAL INFO & PROFILE PICTURE
                </h2>

                {/* Display Name for context */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1"> Name </label>
                  <p className="block w-full px-3.5 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">{formData.name}</p>
                </div>

                {/* University or Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1"> University or Company name </label>
                  <Field
                    type="text"
                    name="universityName"
                    maxLength={100}
                    placeholder="Tesla Inc"
                    className="!mt-0 w-full border border-gray-300 rounded-lg py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm box-border"
                  />
                  <ErrorMessage name="universityName" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Institutional ID */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1"> Institutional ID </label>
                  <Field
                    type="text"
                    name="institutionId"
                    maxLength={30}
                    placeholder="XXXXXXXXXX"
                    className="!mt-0 w-full border border-gray-300 rounded-lg py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm box-border"
                  />
                  <ErrorMessage name="institutionId" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Profile Picture */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1"> Profile picture </label>
                  <div className="flex justify-center items-center w-full">
                    <label htmlFor="profile-picture" className="flex flex-col items-center justify-center w-20 h-20 bg-gray-50 rounded-full shadow-sm cursor-pointer hover:bg-gray-100 transition duration-200 border border-gray-200">
                      {formData.profileImageUrl ? (
                        <img src={formData.profileImageUrl} alt="Profile Preview" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5v14" />
                        </svg>
                      )}
                      <input id="profile-picture" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  {!formData.profileImageFile && <div className="text-red-500 text-xs text-center mt-1">Profile Picture is required.</div>}
                </div>

                {/* Final Submit Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-center text-white transition duration-200 disabled:bg-purple-300 ${(values.universityName && values.institutionId && formData.profileImageFile)
                      ? "bg-purple-600 hover:bg-purple-700 shadow-sm"
                      : "bg-purple-300 cursor-not-allowed"
                      }`}
                    disabled={isSubmitting || !formData.profileImageFile}
                  >
                    Complete Registration
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        );

      default:
        return null;
    }
  };


  return (
    <div className="flex flex-col xl:flex-row min-h-screen font-poppins bg-white">
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-success-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✓
            </div>
            <h2 id="registration-success-title" className="mt-4 text-lg font-bold text-gray-900">
              Registration successful!
            </h2>
            <p className="mt-1.5 text-sm text-gray-600">
              Your account has been created. You will now be redirected to login.
            </p>
            <button
              type="button"
              onClick={handleSuccessModalClose}
              className="mt-5 w-full rounded-lg bg-teal-600 py-2.5 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none"
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}
      {/* Image Side */}
      <div className="hidden xl:flex xl:w-1/2 items-center justify-center">
        <img src={partner2Image} alt="Create Account" className="w-full h-full object-contain max-w-[830px] max-h-[900px] p-6 ml-6 shadow-lg" />
      </div>

      {/* Form Side */}
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center p-6 sm:p-8 w-full xl:w-1/2 bg-white">
        <div className="w-full max-w-[380px] flex flex-col justify-center py-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-3 text-center text-gray-800">
            {step === 1 ? "Create an Account" : step === 1.5 ? "Verify OTP" : "Finalize Profile"}
          </h1>

          {/* Success Message Display */}
          {successMessage && (
            <div className="mb-3 p-2.5 bg-green-50 text-green-700 border border-green-200 text-xs sm:text-sm rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-3 p-2.5 bg-red-50 text-red-600 border border-red-200 text-xs sm:text-sm rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Step Progress Indicator */}
          <div className="flex justify-between items-center mb-4 w-32 mx-auto">
            <div className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full transition ${step >= 1 ? 'bg-teal-500 text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <div className="h-0.5 flex-1 bg-gray-200 mx-2" />
            <div className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full transition ${step >= 2 ? 'bg-teal-500 text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>2</div>
          </div>

          {/* Render Current Step Content */}
          {renderStepContent()}

          {/* Back Buttons */}
          {step === 1.5 && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setSuccessMessage("");
                setStep(1);
              }}
              className="mt-3 text-center text-xs font-semibold text-teal-600 hover:underline"
            >
              &larr; Back to Account Details
            </button>
          )}
          {/* 🔥 On Google signup, Step 2 back button is hidden (no OTP step was shown) */}
          {step === 2 && !isGoogleSignup && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setSuccessMessage("");
                setStep(1.5);
              }}
              className="mt-3 text-center text-xs font-semibold text-teal-600 hover:underline"
            >
              &larr; Back to OTP Verification
            </button>
          )}

          {/* Login Link — only on Step 1 */}
          {step === 1 && (
            <p className="text-center text-gray-600 font-poppins font-medium text-xs sm:text-sm mt-3.5">
              Already have an account?{" "}
              <Link
                to="/partner/login"
                className="text-teal-600 hover:text-teal-700 hover:underline font-semibold ml-1"
              >
                Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerSignUpFlow;
