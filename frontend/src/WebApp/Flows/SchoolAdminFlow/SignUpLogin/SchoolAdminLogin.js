import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import classroomImg from "../../../../assets-webapp/school-dashboard.png";

const SchoolAdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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

    const response = await fetch("/api/school-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok) {
      if (!data.isApproved) {
        // ❌ Show warning but don't log in or store token
        setErrorMessage("Your account is not yet approved by the platform administrator.");
        return;
      }

      // ✅ Approved → proceed with login
      localStorage.setItem("schoolAdminToken", data.token);
      localStorage.setItem("schoolAdminProfile", JSON.stringify(data));
      navigate("/schooladmin/dashboard");
    } else {
      setErrorMessage(data.message || "Login failed. Please try again.");
    }
  } catch (error) {
    console.error("Login error:", error);
    setErrorMessage("Something went wrong during login.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex font-poppins">
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

          {/* Password with eye toggle */}
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
              className="absolute top-1/2 right-3 transform -translate-x-1/2 cursor-pointer text-gray-500 "
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </div>
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
    </div>
  );
};

export default SchoolAdminLogin;
