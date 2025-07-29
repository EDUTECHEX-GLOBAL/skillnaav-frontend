import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useNavigate } from "react-router-dom";
import { auth, googleAuthProvider, signInWithPopup } from "../../../../config/Firebase";
import * as Yup from "yup";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import createAccountImage from "../../../../assets-webapp/login-image.png";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string().required("Required"),
  email: Yup.string()
  .email("Invalid email format")
  .required("Required"),

  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(/[A-Z]/, "At least one uppercase letter")
    .matches(/[a-z]/, "At least one lowercase letter")
    .matches(/[0-9]/, "At least one number")
    .matches(/[!@#$%^&*-_=+]/, "At least one special character")
    .required("Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Required"),
});

const UserCreateAccount = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false); // ⭐
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState(""); // ⭐

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Step 1: Check if email already exists
      const response = await axios.get(`/api/users/check-email?email=${values.email}`);
      if (response.data.exists) {
        setErrorMessage("Email already registered.");
        setSubmitting(false);
        return;
      }

      // Step 2: Send verification OTP
      await axios.post("/api/users/send-verification-code", {
        email: values.email,
      });

      setOtpSent(true); // ⭐ show OTP input
      setErrorMessage(""); // Clear old errors
      setSubmitting(false);
      localStorage.setItem("pendingUserData", JSON.stringify(values)); // save form data
    } catch (error) {
      setErrorMessage("Failed to send OTP. Try again.");
      setSubmitting(false);
    }
  };

  // ⭐ Handle OTP verification
  const handleVerifyOTP = async () => {
    try {
      const values = JSON.parse(localStorage.getItem("pendingUserData"));
      const verifyRes = await axios.post("/api/users/verify-code", {
        email: values.email,
        otp,
      });

      if (verifyRes.data.success) {
        localStorage.removeItem("pendingUserData");
        navigate("/user-profile-form", { state: { userData: values } });
      } else {
        setErrorMessage("Invalid OTP. Try again.");
      }
    } catch (err) {
      setErrorMessage("OTP verification failed.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      googleAuthProvider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      if (user) {
        const idToken = await user.getIdToken();
        navigate("/google-user-profileform", {
          state: {
            userData: {
              name: user.displayName,
              email: user.email,
              googleId: user.uid,
              token: idToken,
            },
          },
        });
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error.message);
      setErrorMessage("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen font-poppins">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
        <img
          src={createAccountImage}
          alt="Create Account"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      <div className="flex flex-col items-center justify-center p-8 w-full lg:w-1/2 bg-white">
        <div className="w-full max-w-md flex flex-col justify-center min-h-screen lg:min-h-full">
          <h1 className="text-2xl font-semibold mb-6 text-center">
            Create an account
          </h1>

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 border border-red-400 rounded">
              {errorMessage}
            </div>
          )}

          {!otpSent ? ( // ⭐ Step 1: Form before OTP
            <Formik
              initialValues={{
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="mb-4">
                    <Field
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="mb-4">
                    <Field
                      type="email"
                      name="email"
                      placeholder="Gmail Address"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="mb-4 relative">
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3"
                    >
                      {showPassword ? <EyeIcon className="h-5 w-5 mt-4 text-gray-500" /> : <EyeSlashIcon className="h-5 w-5 mt-4 text-gray-500" />}
                    </button>
                    <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="mb-4 relative">
                    <Field
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3"
                    >
                      {showConfirmPassword ? <EyeIcon className="h-5 w-5 mt-4 text-gray-500" /> : <EyeSlashIcon className="h-5 w-5 mt-4 text-gray-500" />}
                    </button>
                    <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-purple-${isSubmitting ? "300" : "500"} text-white p-3 rounded-lg hover:bg-purple-${isSubmitting ? "300" : "600"} mb-4`}
                  >
                    Send OTP
                  </button>
                </Form>
              )}
            </Formik>
          ) : ( // ⭐ Step 2: OTP Verification
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Enter the 6-digit code sent to your Gmail:</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full mb-4 p-3 border border-gray-300 rounded-lg"
                placeholder="Enter OTP"
              />
              <button
                onClick={handleVerifyOTP}
                className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 mb-4"
              >
                Verify & Continue
              </button>
              <button
                onClick={() => setOtpSent(false)}
                className="text-blue-500 hover:underline text-sm"
              >
                Change Email
              </button>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 mb-4 flex items-center justify-center space-x-2"
          >
            <FcGoogle className="h-5 w-5" />
            <span>Sign up with Google</span>
          </button>

          <p className="text-center text-gray-500 font-medium text-base">
            Already have an account?{" "}
            <Link to="/user/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserCreateAccount;
