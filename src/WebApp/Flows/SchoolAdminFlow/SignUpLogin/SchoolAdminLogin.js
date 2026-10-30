import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiX } from "react-icons/fi";
import classroomImg from "../../../../assets-webapp/school-dashboard.png";
import SchoolAdminForgotPassword from "./SchoolAdminForgotPassword";
import { GoogleLogin } from "@react-oauth/google";
import axios from "../../../../api/axiosInstance";

const SchoolAdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!credentials.email || !credentials.password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.post("/api/school-admin/login", credentials);

      if (!data.isApproved) {
        setErrorMessage(
          "Your account is not yet approved by the platform administrator.",
        );
        return;
      }

      localStorage.setItem("schoolAdminToken", data.token);
      localStorage.setItem("schoolAdminId", data._id);
      localStorage.setItem("schoolAdminProfile", JSON.stringify(data));
      localStorage.setItem("loginTime", Date.now());

      navigate("/schooladmin/dashboard");
    } catch (error) {
      console.error("Login error:", error.response || error.message);
      setErrorMessage(
        error.response?.data?.message || "Something went wrong during login.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-poppins relative bg-gray-50">
      <div className="w-1/2 hidden md:flex items-center justify-center bg-gray-100">
        <img
          src={classroomImg}
          alt="Classroom"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-4 sm:p-8 min-h-screen py-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white p-5 sm:p-8 rounded-2xl shadow-lg border border-gray-100 min-w-0"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-blue-700">
            School Admin Login
          </h2>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 font-medium text-xs sm:text-sm rounded-md text-center leading-relaxed">
              {errorMessage}
            </div>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="!mt-0 w-full mb-4 p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            onChange={handleChange}
            required
          />

          <div className="relative flex items-center w-full mb-4">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className="!mt-0 w-full p-3 border border-gray-300 rounded-md pr-10 outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center justify-center text-gray-500 hover:text-gray-700 p-1 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          <div className="text-right text-xs sm:text-sm text-blue-600 mb-5">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition text-sm sm:text-base shadow-md hover:shadow-lg"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="flex items-center my-4">
            <hr className="w-full border-gray-200" />
            <span className="px-3 text-xs uppercase tracking-wider text-gray-400 font-medium">OR</span>
            <hr className="w-full border-gray-200" />
          </div>

          <div className="w-full flex justify-center shadow-sm rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-all [&>div]:!w-full [&>div>iframe]:!w-full mb-4">
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
                  const { data } = await axios.post(
                    "/api/school-admin/google-auth",
                    { idToken },
                  );

                  if (!data.isApproved && !data.needsProfileCompletion) {
                    setErrorMessage(
                      "Your account is not yet approved by the platform administrator.",
                    );
                    return;
                  }

                  localStorage.setItem("schoolAdminToken", data.token);
                  localStorage.setItem("schoolAdminId", data._id);
                  localStorage.setItem(
                    "schoolAdminProfile",
                    JSON.stringify(data),
                  );
                  localStorage.setItem("loginTime", Date.now());

                  if (data.needsProfileCompletion) {
                    navigate("/schooladmin/profile", {
                      state: { isGoogleUser: true },
                    });
                  } else {
                    navigate("/schooladmin/dashboard");
                  }
                } catch (error) {
                  console.error(
                    "Google login error:",
                    error.response || error.message,
                  );
                  setErrorMessage(
                    error.response?.data?.message || "Google login failed.",
                  );
                }
              }}
              onError={() => setErrorMessage("Google login failed.")}
            />
          </div>

          <div className="text-center mt-4 text-xs sm:text-sm text-gray-600">
            Don't have an account?
            <button
              type="button"
              onClick={() => navigate("/schooladmin/register")}
              className="ml-1 text-blue-600 font-semibold hover:underline"
            >
              Sign up here
            </button>
          </div>
        </form>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FiX size={22} />
            </button>

            <SchoolAdminForgotPassword
              onClose={() => setShowForgotModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdminLogin;
