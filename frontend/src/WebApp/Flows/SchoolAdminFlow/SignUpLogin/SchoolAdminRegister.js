import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import registrationImg from "../../../../assets-webapp/school-reg.png"; // Update this path

const SchoolAdminRegister = () => {
  const [formData, setFormData] = useState({
    schoolName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  // Navigate with form data
  navigate("/schooladmin/profile", { state: formData });
};


  return (
    <div className="min-h-screen flex font-poppins bg-gray-100">
      {/* Left Image */}
      <div className="hidden md:block md:w-1/2">
        <img
          src={registrationImg}
          alt="Charts and Registration"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Right Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <form
          className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200"
          onSubmit={handleSubmit}
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">
            School Admin Registration
          </h2>

          {/* School Name */}
          <input
            type="text"
            name="schoolName"
            placeholder="School / University Name"
            className="w-full mb-4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={handleChange}
            required
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full mb-4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={handleChange}
            required
          />

          {/* Password */}
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="absolute top-1/2 right-4 transform -translate-x-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye  size={20}/>}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative mb-6">
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="absolute top-1/2 right-4 transform -translate-x-1/2 text-gray-500"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <FaEyeSlash size={20} /> : <FaEye size={20}/>}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition"
          >
            Register
          </button>

          {/* Sign In Redirect */}
          <div className="text-center mt-4 text-sm text-gray-600">
            Already have an account?
            <button
              type="button"
              onClick={() => navigate("/schooladmin/login")}
              className="ml-1 text-blue-600 font-semibold hover:underline"
            >
              Sign in here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolAdminRegister;
