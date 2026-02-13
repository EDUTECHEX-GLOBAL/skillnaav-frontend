import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import axios from "axios";
// Assuming partner2Image is available, or you can remove/replace it
import partner2Image from "../../../../assets-webapp/partner2_img.jpg";

// --- VALIDATION SCHEMAS ---

// Step 1: Account Creation
const step1ValidationSchema = Yup.object({
  name: Yup.string().required("Full Name is Required"),
  email: Yup.string().email("Invalid email address").required("Email is Required"),
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

// Step 2 (Now the Final Step): Institutional Info & Profile Picture
const step2ValidationSchema = Yup.object({
  universityName: Yup.string().required("University/Company Name is Required"),
  institutionId: Yup.string().required("Institutional ID is Required"),
});


const PartnerSignUpFlow = () => {
  const navigate = useNavigate();
  // Step count adjusted: 1, 1.5 (OTP), 2 (Final Step)
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timer state for Resend OTP button
  const [resendTimer, setResendTimer] = useState(0);

  // Consolidated form data state (REMOVED: dob, educationLevel, fieldOfStudy)
  const [formData, setFormData] = useState({
    // Step 1 data
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "", // For verification

    // Step 2 data (Now Final Step Data)
    universityName: "",
    institutionId: "",
    profileImageFile: null,
    profileImageUrl: null,
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
  }

  // --- STEP 1: ACCOUNT & OTP LOGIC ---

  const handleStep1Submit = async (values, { setSubmitting }) => {
    setErrorMessage("");
    try {
      // 1. Check if partner is already registered
      const check = await axios.post("/api/partners/check-email", {
        email: values.email.trim(),
      });

      if (check.data.exists) {
        setErrorMessage("Partner already registered.");
        setSubmitting(false);
        return;
      }

      // 2. Send verification code
      await axios.post("/api/partners/send-verification-code", {
        email: values.email.trim(),
      });

      // 3. Update form data, move to OTP sub-step, and start timer
      setFormData(prev => ({
        ...prev,
        ...values,
        otp: ""
      }));
      setStep(1.5); // Move to OTP verification sub-step
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
    try {
      await axios.post("/api/partners/send-verification-code", {
        email: formData.email,
      });
      startResendTimer();
      setErrorMessage("New verification code sent to your email.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to resend OTP.");
    }
  };


  // VERIFY OTP (Now proceeds directly to Step 2/Final Step)
  const verifyOtpAndProceed = async (values, { setSubmitting }) => {
    setErrorMessage("");
    try {
      const verify = await axios.post("/api/partners/verify-otp", {
        email: formData.email,
        otp: values.otp,
      });

      if (verify.data.success) {
        setFormData(prev => ({ ...prev, otp: values.otp }));
        setStep(2); // MOVED DIRECTLY TO THE FINAL STEP (STEP 2)
      }
    } catch (error) {
      setErrorMessage("Invalid or expired OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- STEP 2 (FINAL): INSTITUTIONAL INFO & PICTURE LOGIC ---

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImageFile: file,
        profileImageUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleStep2Submit = async (values, { setSubmitting }) => {
    setErrorMessage("");

    // Collect ALL data from the state (Step 1) and merge with the current step's values (Step 2/Final)
    const finalData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      // Removed: dob, educationLevel, fieldOfStudy
      universityName: values.universityName,
      institutionId: values.institutionId,
      profileImageFile: formData.profileImageFile
    };

    if (!finalData.profileImageFile) {
      setErrorMessage("Profile picture is required.");
      setSubmitting(false);
      return;
    }

    try {
      const finalFormData = new FormData();

      finalFormData.append("name", finalData.name);
      finalFormData.append("email", finalData.email);
      finalFormData.append("password", finalData.password);
      finalFormData.append("confirmPassword", finalData.password);
      finalFormData.append("universityName", finalData.universityName);
      finalFormData.append("institutionId", finalData.institutionId);
      finalFormData.append("profileImage", finalData.profileImageFile);

      // Submit the data to your backend/database
      const response = await axios.post(
        "/api/partners/register",
        finalFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.status === 201) {
        alert("Registration successful! Redirecting to login.");
        navigate("/partner/login");
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
            initialValues={{ name: formData.name, email: formData.email, password: formData.password, confirmPassword: formData.confirmPassword }}
            validationSchema={step1ValidationSchema}
            onSubmit={handleStep1Submit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <Field type="text" name="name" placeholder="Full Name" className="w-full p-3 border border-gray-300 rounded-lg" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />

                <Field type="email" name="email" placeholder="Email" className="w-full p-3 border border-gray-300 rounded-lg" />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />

                <div className="relative">
                  <Field
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2"
                  >
                    {showPassword ? (<EyeIcon className="h-5 w-5 text-gray-500" />) : (<EyeSlashIcon className="h-5 w-5 text-gray-500" />)}
                  </button>
                  <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="relative">
                  <Field
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2"
                  >
                    {showConfirmPassword ? (<EyeIcon className="h-5 w-5 text-gray-500" />) : (<EyeSlashIcon className="h-5 w-5 text-gray-500" />)}
                  </button>
                  <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-500 text-white p-4 rounded-lg hover:bg-teal-600 transition-colors duration-300 shadow-md disabled:bg-teal-300"
                >
                  Send Verification Code
                </button>
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
              <Form>
                <p className="text-center text-sm text-gray-600 mb-4">
                  A verification code has been sent to **{formData.email}**.
                </p>
                <div className="mb-4">
                  <input
                    type="text"
                    name="otp"
                    value={values.otp}
                    onChange={handleChange}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                    className="w-full p-3 border border-gray-300 rounded-lg text-center tracking-widest text-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-500 text-white p-4 rounded-lg hover:bg-teal-600 transition-colors duration-300 shadow-md disabled:bg-teal-300"
                >
                  Verify OTP & Continue
                </button>

                {/* RESEND OTP BUTTON */}
                <div className="mt-4 text-center">
                  {resendTimer > 0 ? (
                    <p className="text-gray-500 text-sm">Resend available in **{resendTimer}** seconds</p>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={isSubmitting}
                      className="text-teal-500 font-medium hover:underline disabled:text-gray-400"
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
            validationSchema={step2ValidationSchema} // Renamed from step3ValidationSchema
            onSubmit={handleStep2Submit}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-700 bg-purple-100 p-3 rounded-md">
                  INSTITUTIONAL INFO & PROFILE PICTURE
                </h2>

                {/* Display Name for context */}
                <div>
                  <label className="block text-sm font-medium text-gray-700"> Name </label>
                  <p className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">{formData.name}</p>
                </div>


                {/* University or Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2"> University or Company name </label>
                  <Field type="text" name="universityName" placeholder="Tesla Inc" className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-200" />
                  <ErrorMessage name="universityName" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Institutional ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2"> Institutional ID </label>
                  <Field type="text" name="institutionId" placeholder="XXXXXXXXXX" className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-200" />
                  <ErrorMessage name="institutionId" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Profile Picture */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2"> Profile picture </label>
                  <div className="flex justify-center items-center w-full">
                    <label htmlFor="profile-picture" className="flex flex-col items-center justify-center w-24 h-24 bg-gray-50 rounded-full shadow-sm cursor-pointer hover:bg-gray-100 transition duration-200">
                      {formData.profileImageUrl ? (
                        <img src={formData.profileImageUrl} alt="Profile Preview" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5v14" />
                        </svg>
                      )}
                      <input id="profile-picture" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  {!formData.profileImageFile && <div className="text-red-500 text-sm text-center mt-2">Profile Picture is required.</div>}
                </div>

                {/* Final Submit Button */}
                <div>
                  <button
                    type="submit"
                    className={`w-full py-3 rounded-md font-semibold text-center text-white transition duration-200 disabled:bg-purple-300 ${(values.universityName && values.institutionId && formData.profileImageFile)
                        ? "bg-purple-400 hover:bg-purple-700"
                        : "bg-purple-100 cursor-not-allowed"
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
    <div className="flex flex-col lg:flex-row min-h-screen font-poppins">
      {/* Image Side */}
      <div className="hidden md:flex md:w-full lg:w-1/2 items-center justify-center">
        <img src={partner2Image} alt="Create Account" className="w-full h-full object-contain max-w-[830px] max-h-[900px] p-6 ml-6 shadow-lg" />
        {/* <div className="text-gray-500 text-lg">Partner Sign Up Steps Visual (Replace with Image)</div> */}
      </div>

      {/* Form Side */}
      <div className="flex flex-col items-center justify-center p-8 w-full lg:w-1/2 bg-white">
        <div className="w-full max-w-md flex flex-col justify-center min-h-screen lg:min-h-full">
          <h1 className="text-2xl font-semibold mb-6 text-center">
            {step === 1 ? "Create an Account" : step === 1.5 ? "Verify OTP" : "Finalize Profile"}
          </h1>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 border border-red-400 rounded">
              {errorMessage}
            </div>
          )}

          {/* Step Progress Indicator (Adjusted for 2 main steps) */}
          <div className="flex justify-between mb-6 w-1/2 mx-auto">
            <div className={`p-2 rounded-full ${step >= 1 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <div className={`p-2 rounded-full ${step >= 2 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          </div>

          {/* Render Current Step Content */}
          {renderStepContent()}

          {/* Back Button for multi-step flow */}
          {step === 1.5 && (
            <button
              type="button"
              onClick={() => setStep(1)} // Back from OTP step to Step 1 (Account Creation)
              className="mt-4 p-2 text-center text-teal-500 hover:underline"
            >
              &larr; Back to Account Details
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1.5)} // Back from Final Step to Step 1.5 (OTP)
              className="mt-4 p-2 text-center text-teal-500 hover:underline"
            >
              &larr; Back to OTP Verification
            </button>
          )}


          {/* Login Link - Only show on the first or final step for clarity */}
          {(step === 1 || step === 2) && (
            <>
              <div className="flex items-center my-4">
                <hr className="w-full border-t border-gray-300" />
                <span className="px-3 text-gray-500">OR</span>
                <hr className="w-full border-t border-gray-300" />
              </div>

              <p className="text-center text-gray-500 font-poppins font-medium text-base leading-6">
                Already have an account?{" "}
                <Link
                  to="/partner/login"
                  className="text-teal-500 hover:underline font-semibold"
                >
                  Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerSignUpFlow;