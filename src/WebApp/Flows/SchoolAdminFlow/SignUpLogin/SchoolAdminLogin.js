import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import classroomImg from "../../../../assets-webapp/school-dashboard.png";
import SchoolAdminForgotPassword from "./SchoolAdminForgotPassword";

const SchoolAdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [showForgotModal, setShowForgotModal] = useState(false);

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

    const { data } = await axios.post(
      "/api/school-admin/login",
      credentials,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!data.isApproved) {
      setErrorMessage(
        "Your account is not yet approved by the platform administrator."
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
      error.response?.data?.message || "Something went wrong during login."
    );
  } finally {
    setLoading(false);
  }
};




 return (
    <div className="min-h-screen flex font-poppins relative">
      {/* Left Image */}
      <div className="w-1/2 hidden md:flex items-center justify-center bg-gray-100">
        <img src={classroomImg} alt="Classroom" className="h-full w-full object-cover" />
      </div>

      {/* Right Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-3xl font-bold text-center mb-6 text-blue-700">
            School Admin Login
          </h2>

          {errorMessage && (
            <div className="mb-4 text-red-600 font-medium text-sm text-center">
              {errorMessage}
            </div>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full mb-4 p-3 border border-gray-300 rounded-md"
            onChange={handleChange}
            required
          />

          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-md pr-10"
              onChange={handleChange}
              required
            />
            <div
              className="absolute top-1/2 right-3 transform -translate-x-1/2 cursor-pointer text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </div>
          </div>

          {/* Forgot Password link */}
          <div className="text-right text-sm text-blue-600 mb-4 cursor-pointer hover:underline">
            <button type="button" onClick={() => setShowForgotModal(true)}>
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-center mt-4 text-sm text-gray-600">
            Don’t have an account?
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <SchoolAdminForgotPassword onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
};

export default SchoolAdminLogin;
