// File: UserCreateAccount.js

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { FcGoogle } from "react-icons/fc";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import loginImage from "../../../../assets-webapp/login-image.png";
import { GoogleLogin } from "@react-oauth/google";
import { COUNTRIES, US_STATES, CA_PROVINCES } from "../../../../constants/locations";
import UserAgeGateConsentModal from "./UserProfileBuilding/UserAgeGateConsentModal";


const UnifiedUserRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAgeGateModal, setShowAgeGateModal] = useState(false);

  // States for OTP resend logic (from UserCreateAccount.js)
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);
  const [canResend, setCanResend] = useState(false);

  // States for UserProfileForm.js city/university suggestions

  const [citySuggestions, setCitySuggestions] = useState([]);
  const cityTimerRef = useRef(null);
  const cityAbortRef = useRef(null);

  const [filteredInstitutionSuggestions, setFilteredInstitutionSuggestions] =
    useState([]);

  const institutionTimerRef = useRef(null);


  // --- UNIFIED STATE MANAGEMENT ---
  const [formData, setFormData] = useState({
    // Step 1: Account
    name: "", email: "", password: "", confirmPassword: "",
    // Step 2: Profile Form
    institutionName: "", dob: null, educationLevel: "", grade: "", fieldOfStudy: "",
    country: "", state: "", city: "", zip: "", address: "",
    // Step 3: Professional/Picture
    desiredField: "", linkedin: "", portfolio: "", skills: "", interests: "",
    preferredLocations: "", profilePic: null,
  });

  // 🕒 Countdown timer for resend (from UserCreateAccount.js)
  useEffect(() => {
    let timer;
    const otpSent = currentStep > 1; // Assume OTP is sent if past step 1
    if (otpSent && !canResend && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [currentStep, resendTimer, canResend]);

  // Cleanup timers/requests when component unmounts (from UserProfileForm.js)
  useEffect(() => {
    return () => {
      if (cityTimerRef.current) clearTimeout(cityTimerRef.current);
      if (cityAbortRef.current) cityAbortRef.current.abort();
    };
  }, []);

  // Function to update any field in the unified state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));


  };
  const handleInstitutionInputChange = (e) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      institutionName: value,
    }));

    if (institutionTimerRef.current)
      clearTimeout(institutionTimerRef.current);

    // 🛑 High school → manual entry only
    if (formData.educationLevel === "highschool") {
      setFilteredInstitutionSuggestions([]);
      return;
    }

    // Guards
    if (!value || value.trim().length < 2 || !formData.country) {
      setFilteredInstitutionSuggestions([]);
      return;
    }

    institutionTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/locations/universities?country=${encodeURIComponent(
            formData.country
          )}&query=${encodeURIComponent(value.trim())}`
        );

        if (!res.ok) return;

        const data = await res.json();
        setFilteredInstitutionSuggestions(data);
      } catch (err) {
        console.error("Institution fetch error:", err);
      }
    }, 400);
  };


  const handleDateChange = (date) => {
    const updatedDate = date ? new Date(date) : null;
    if (updatedDate) updatedDate.setHours(0, 0, 0, 0);
    setFormData((prevData) => ({ ...prevData, dob: updatedDate }));
  };



  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.type.startsWith("image/")) {
      alert("Please upload an image file (JPEG, PNG, JPG)");
      return;
    }
    setFormData({ ...formData, profilePic: file });
  };

  // --- Step 1: Account & OTP Submission (Modified from UserCreateAccount.js) ---
  const validateStep1 = () => {
    // Simplified validation (integrate Formik/Yup for full validation)
    const { name, email, password, confirmPassword } = formData;
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill all required fields.");
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords must match.");
      return false;
    }
    // Simple email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Invalid email format.");
      return false;
    }
    // You would include the password strength regex here if not using Yup

    return true;
  };

  const handleStep1Submit = async () => {
    if (!validateStep1()) return;

    try {
      // Check email existence
      const checkRes = await axios.get(`/api/users/check-email?email=${formData.email}`);
      if (checkRes.data.exists) {
        setErrorMessage("Email already registered.");
        return;
      }

      // Send OTP
      await axios.post("/api/users/send-verification-code", { email: formData.email });

      setCurrentStep(1.5); // Move to OTP verification state
      setErrorMessage("");
      setResendTimer(30);
      setCanResend(false);
    } catch (error) {
      setErrorMessage("Failed to send OTP. Try again.");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setErrorMessage("Please enter the OTP.");
      return;
    }

    try {
      const verifyRes = await axios.post("/api/users/verify-code", {
        email: formData.email,
        otp,
        password: formData.password,
      });

      if (verifyRes.data.success) {
        localStorage.setItem("userToken", verifyRes.data.token);
        setErrorMessage("");

        // ✅ NEW: open age gate popup (don’t go to step 2 yet)
        setShowAgeGateModal(true);

        // ❌ REMOVE this line:
        // setCurrentStep(2);
      } else {
        setErrorMessage("Invalid OTP. Try again.");
        setCanResend(true);
      }
    } catch (err) {
      setErrorMessage("OTP verification failed.");
    }
  };


  const handleResendOTP = async () => {
    try {
      setResending(true);
      await axios.post("/api/users/send-verification-code", { email: formData.email });

      setErrorMessage("");
      setResending(false);
      setCanResend(false);
      setResendTimer(30);
    } catch (err) {
      setErrorMessage("Failed to resend OTP. Please try again later.");
      setResending(false);
    }
  };

  // --- Step 2: Profile Form Submission (Modified from UserProfileForm.js) ---
  const validateStep2 = () => {
    const {
      educationLevel,
      grade,
      institutionName,
      country,
      state,
      city,
      zip,
      address,
    } = formData;

    // High school → grade required
    if (educationLevel === "highschool") {
      return Boolean(
        grade &&
        institutionName &&
        country &&
        state &&
        city &&
        zip &&
        address
      );
    }

    // College / Graduate
    return Boolean(
      institutionName &&
      educationLevel &&
      country &&
      state &&
      city &&
      zip &&
      address
    );
  };



  const handleStep2Submit = (e) => {
    e.preventDefault(); // Stop form default submission
    if (!validateStep2()) {
      setErrorMessage("Please fill all required fields for your profile.");
      return;
    }
    setErrorMessage("");
    setCurrentStep(3); // Move to Professional/Picture step
  };

  // --- Step 3: Professional/Picture Submission (Modified from UserProfilePicture.js) ---
  // File: UnifiedUserRegistration.js

  // ... (existing imports and component definition)

  // --- Step 3: Professional/Picture Submission (Updated) ---

  const validateStep3 = () => {
    // Only validate the fields introduced in Step 3 that are REQUIRED
    const { desiredField, linkedin, profilePic } = formData;
    return Boolean(desiredField && linkedin && profilePic);
  };

  const handleStep3Submit = async () => {
    if (!validateStep3()) {
      setErrorMessage("Please fill the required fields.");
      return;
    }

    try {
      const fd = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        // 🔐 Skip auth-only fields
        if (key === "password" || key === "confirmPassword") return;

        // ✅ FIX 1: institutionName → universityName
        if (key === "institutionName") {
          fd.append("universityName", value);
          return;
        }

        // ✅ FIX 2: grade → currentGrade
        if (key === "grade") {
          fd.append("currentGrade", value);
          return;
        }

        // DOB → ISO string
        if (key === "dob" && value instanceof Date) {
          fd.append("dob", value.toISOString());
          return;
        }

        // Arrays → comma-separated string
        if (["skills", "interests", "preferredLocations"].includes(key)) {
          const list = value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          fd.append(key, list.join(","));
          return;
        }

        // zip → postalCode
        if (key === "zip") {
          fd.append("postalCode", value);
          return;
        }

        // Skip raw file field
        if (key !== "profilePic") {
          fd.append(key, value);
        }
      });

      // File field
      if (formData.profilePic) {
        fd.append("profileImage", formData.profilePic);
      }

      const res = await axios.put("/api/users/profile", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      navigate("/user/login", {
        state: { message: "Registration successful. Please log in." }
      });

    } catch (err) {
      console.error(err);
      setErrorMessage("Registration failed. Try again.");
    }
  };



  // --- Location/City Logic (from UserProfileForm.js) ---
  const stateList =
    formData.country === "Canada"
      ? CA_PROVINCES
      : formData.country === "United States"
        ? US_STATES
        : [];

  const stateLabel =
    formData.country === "Canada"
      ? "Province / Territory"
      : formData.country === "United States"
        ? "State"
        : "State / Province";

  const zipLabel =
    formData.country === "Canada"
      ? "Postal Code"
      : formData.country === "United States"
        ? "ZIP Code"
        : "ZIP / Postal Code";

  const handleCountryChange = (value) => {
    // Reset state & city when country changes
    setFormData((prev) => ({ ...prev, country: value, state: "", city: "" }));
    setCitySuggestions([]);
  };

  const handleCityInputChange = (e) => {
    const value = e.target.value;

    setFormData((prev) => ({ ...prev, city: value }));

    // Clear previous debounce
    if (cityTimerRef.current) clearTimeout(cityTimerRef.current);

    // ✅ HARD GUARDS
    if (!formData.country) {
      setCitySuggestions([]);
      return;
    }

    if (!value || value.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }

    cityTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/locations/cities?country=${encodeURIComponent(
            formData.country
          )}&query=${encodeURIComponent(value.trim())}`
        );

        if (!res.ok) return; // silently ignore 400s

        const data = await res.json();
        setCitySuggestions(data);
      } catch (err) {
        console.error("City fetch error:", err);
      }
    }, 400);
  };


  const handleCitySelect = (c) => {
    setFormData((prev) => ({
      ...prev,
      city: c.city,
      state: c.state,
    }));
    setCitySuggestions([]);
  };


  // Placeholder for Google Sign-In (requires Firebase setup)
  const handleGoogleSignIn = async () => {
    setErrorMessage("Google Sign-In functionality needs to be integrated with this single component's flow.");
    // In a full implementation, this would save the Google user's basic info
    // and immediately jump to the start of the UserProfileForm (Step 2).
  };

  // --- RENDERING LOGIC (The UI) ---

  const renderStep = () => {
    // Step 1: Account Creation
    if (currentStep === 1) {
      return (
        <>
          <h1 className="text-2xl font-semibold mb-6 text-center">Create an account</h1>
          {/* Account Form */}
          <div className="mb-4">
            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
          </div>
          <div className="mb-4">
            <input type="email" name="email" placeholder="Gmail Address" value={formData.email} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
          </div>
          <div className="mb-4 relative">
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3">
              {showPassword ? (<EyeIcon className="h-5 w-5 mt-4 text-gray-500" />) : (<EyeSlashIcon className="h-5 w-5 mt-4 text-gray-500" />)}
            </button>
          </div>
          <div className="mb-4 relative">
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3">
              {showConfirmPassword ? (<EyeIcon className="h-5 w-5 mt-4 text-gray-500" />) : (<EyeSlashIcon className="h-5 w-5 mt-4 text-gray-500" />)}
            </button>
          </div>
          <button type="button" onClick={handleStep1Submit} className="w-full bg-purple-500 text-white p-3 rounded-lg hover:bg-purple-600 mb-4">
            Send OTP
          </button>
        </>
      );
    }

    // Step 1.5: OTP Verification
    if (currentStep === 1.5) {
      return (
        <div>
          <h1 className="text-2xl font-semibold mb-6 text-center">Verify Your Email</h1>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Enter the 6-digit code sent to your Gmail:
          </label>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full mb-4 p-3 border border-gray-300 rounded-lg"
            placeholder="Enter OTP"
          />
          <button onClick={handleVerifyOTP} className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 mb-4">
            Verify & Continue
          </button>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handleResendOTP}
              disabled={!canResend || resending}
              className={`text-sm font-medium ${canResend ? "text-blue-500 hover:underline" : "text-gray-400 cursor-not-allowed"}`}
            >
              {resending ? "Resending..." : canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
            </button>
            <button onClick={() => setCurrentStep(1)} className="text-sm text-gray-600 hover:text-blue-500">
              Change Details
            </button>
          </div>
        </div>
      );
    }

    // Step 2: User Profile Form
    if (currentStep === 2) {
      return (
        <form onSubmit={handleStep2Submit} className="w-full max-w-xl p-8 space-y-6 bg-white shadow-md rounded-lg">
          <div className="space-y-4">
            {/* <div className="w-full h-12 p-3 bg-[#F9F0FF] border-b border-[#E6C4FB]">
              <h2 className="text-lg font-bold text-gray-700">BASIC INFORMATION</h2>
            </div> */}

            {/* EDUCATIONAL INFORMATION */}
            <div className="w-full h-12 p-3 bg-[#F9F0FF] border-b border-[#E6C4FB]">
              <h2 className="text-lg font-bold text-gray-700">EDUCATION</h2>
            </div>

            {/* Education Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current level of education *
              </label>

              <div className="mt-3 flex flex-wrap items-center gap-x-10 gap-y-3">
                {["highschool", "undergraduate", "graduate"].map((level) => (
                  <label
                    key={level}
                    htmlFor={level}
                    className="inline-flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      id={level}
                      name="educationLevel"
                      value={level}
                      checked={formData.educationLevel === level}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          educationLevel: e.target.value,
                          grade: "",
                          institutionName: "",
                        }))
                      }
                      className="h-4 w-4 m-0 text-purple-600"
                      required
                    />
                    <span className="text-sm text-gray-700 leading-none">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                  </label>
                ))}
              </div>

            </div>

            {/* Grade (ONLY for High School) */}
            {formData.educationLevel === "highschool" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Grade *
                </label>

                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Grade</option>
                  {[8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={`Grade ${g}`}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Institution Name — only after education level */}
            {formData.educationLevel && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">
                  {formData.educationLevel === "highschool"
                    ? "School Name *"
                    : "College / University Name *"}
                </label>

                <input
                  type="text"
                  name="institutionName"
                  value={formData.institutionName}
                  onChange={handleInstitutionInputChange}
                  placeholder={
                    formData.educationLevel === "highschool"
                      ? "Enter your school name"
                      : "Search college or university"
                  }
                  autoComplete="off"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />

                {/* University suggestions ONLY for non-highschool */}
                {formData.educationLevel !== "highschool" &&
                  filteredInstitutionSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {filteredInstitutionSuggestions.map((u, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              institutionName: u.name,
                            }));
                            setFilteredInstitutionSuggestions([]);
                          }}
                          className="cursor-pointer px-4 py-2 hover:bg-purple-100"
                        >
                          {u.name}
                          {u.state && (
                            <span className="text-xs text-gray-500 ml-2">
                              {u.state}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            )}

            {/* Date of Birth */}
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth *</label>
              <DatePicker selected={formData.dob} onChange={handleDateChange} dateFormat="dd/MM/yyyy" maxDate={new Date()} showYearDropdown showMonthDropdown dropdownMode="select" placeholderText="DD/MM/YYYY" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
            </div>

            {/* LOCATION */}
            <div className="space-y-4">
              <div className="w-full h-12 p-3 bg-[#F9F0FF] border-b border-[#E6C4FB]">
                <h2 className="text-lg font-bold text-gray-700">LOCATION</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country (US/CA only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country *</label>
                  <select name="country" value={formData.country} onChange={(e) => handleCountryChange(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" required>
                    <option value="">Select</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
                {/* State / Province */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">{stateLabel} *</label>
                  <select name="state" value={formData.state} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100" disabled={!formData.country} required>
                    <option value="">Select</option>
                    {stateList.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                {/* City with suggestions */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleCityInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100" disabled={!formData.country} placeholder="Start typing city" autoComplete="off" required />
                  {citySuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {citySuggestions.map((c) => (
                        <li
                          key={`${c.city}-${c.state}`}
                          onClick={() => handleCitySelect(c)}
                          className="cursor-pointer px-4 py-2 hover:bg-purple-100"
                        >
                          {c.city}, {c.state}
                        </li>
                      ))}

                    </ul>
                  )}
                </div>
                {/* ZIP / Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">{zipLabel} *</label>
                  <input type="text" name="zip" value={formData.zip} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder={formData.country === "Canada" ? "e.g., K1A 0B1" : "e.g., 94105"} autoComplete="postal-code" required />
                </div>
                {/* Full Address */}
                <div className="md:col-span-2 md:col-start-1">
                  <label className="block text-sm font-medium text-gray-700">Address *</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Street address, Apt/Suite (City is above), State/Province" autoComplete="street-address" required />
                </div>
              </div>
            </div>

            {/* Field of Study Select */}
            <div>
              <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700">Field of Study *</label>
              <select name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" required>
                <option value="">Select Your Field</option>
                <option value="Space">Space Internships</option>
                <option value="Aeronautical">Aeronautical Internships</option>
                <option value="Tech">Tech Internships</option>
                <option value="Research">Research Internships</option>
                <option value="Education">Education Internships</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between mt-6 space-x-4">
            <button type="button" onClick={() => setCurrentStep(1.5)} className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              Back
            </button>
            <button type="submit" disabled={!validateStep2()} className="bg-purple-500 text-white w-full px-6 py-3 rounded-md hover:bg-purple-600 disabled:bg-gray-400">
              Continue
            </button>
          </div>
        </form>
      );
    }

    // Step 3: User Profile Picture/Professional
    if (currentStep === 3) {
      return (
        <div className="w-full max-w-xl p-8 space-y-6 bg-white shadow-md rounded-lg">
          <div className="space-y-4">
            <div className="w-full h-12 p-3 bg-purple-100 border-b border-purple-300">
              <h2 className="text-lg font-bold text-gray-700">PROFESSIONAL INFORMATION</h2>
            </div>
            {/* Desired Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Desired field of Internship/Job *</label>
              <select name="desiredField" value={formData.desiredField} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                <option value="">Select Your Field</option>
                <option value="Space">Space Internships</option>
                <option value="Aeronautical">Aeronautical Internships</option>
                <option value="Tech">Tech Internships</option>
                <option value="Research">Research Internships</option>
                <option value="Education">Education Internships</option>
              </select>
            </div>

            <div className="w-full h-12 p-3 bg-purple-100 border-b border-purple-300">
              <h2 className="text-lg font-bold text-gray-700">UPLOAD PROFILE INFORMATION</h2>
            </div>

            <div className="space-y-4">
              {/* LinkedIn Profile Input */}
              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">LinkedIn Profile *</label>
                <input id="linkedin" type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} required className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Enter your LinkedIn profile" />
              </div>
              {/* Portfolio Website Input (Optional) */}
              <div>
                <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700">Portfolio Website (Optional)</label>
                <input id="portfolio" type="text" name="portfolio" value={formData.portfolio} onChange={handleChange} className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Enter your Portfolio URL" />
              </div>
              {/* Skills Input */}
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
                <input id="skills" type="text" name="skills" value={formData.skills} onChange={handleChange} className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="e.g. React, Python, SQL" />
              </div>
              {/* Interests Input */}
              <div>
                <label htmlFor="interests" className="block text-sm font-medium text-gray-700">Interests (comma separated)</label>
                <input id="interests" type="text" name="interests" value={formData.interests} onChange={handleChange} className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="e.g. AI, Robotics, Data Science" />
              </div>
              {/* Preferred Locations Input */}
              <div>
                <label htmlFor="preferredLocations" className="block text-sm font-medium text-gray-700">Preferred Locations (comma separated)</label>
                <input id="preferredLocations" type="text" name="preferredLocations" value={formData.preferredLocations} onChange={handleChange} className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="e.g. Hyderabad, Remote, Bangalore" />
              </div>
              {/* Profile Image Input */}
              <div>
                <label htmlFor="profilePic" className="block text-sm font-medium text-gray-700">Profile Image *</label>
                <input id="profilePic" type="file" name="profilePic" onChange={handleFileChange} accept="image/*" className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                {formData.profilePic && <p className="text-xs mt-1 text-gray-500">File selected: {formData.profilePic.name}</p>}
              </div>
            </div>

            {/* Button Section with Back and Submit Buttons */}
            <div className="flex justify-between space-x-4">
              <button type="button" onClick={() => setCurrentStep(2)} className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                Back
              </button>
              <button type="button" onClick={handleStep3Submit} disabled={!validateStep3()} className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${validateStep3() ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-300 cursor-not-allowed"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}>
                Submit
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen font-poppins bg-gray-100 lg:bg-white">
      {/* Side Image (only visible on step 1/1.5, similar to original UserCreateAccount.js) */}
      {(currentStep === 1 || currentStep === 1.5) && (
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-purple-50">
          <img
            src={loginImage}
            alt="Skillnaav Login Illustration"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      )}

      <div className="flex flex-col items-center justify-center p-8 w-full lg:w-1/2 bg-white mx-auto">
        <div className={`w-full max-w-md ${currentStep !== 1 && currentStep !== 1.5 ? 'max-w-xl' : ''} flex flex-col justify-center min-h-screen lg:min-h-full`}>

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 border border-red-400 rounded">
              {errorMessage}
            </div>
          )}

          {renderStep()}

          <UserAgeGateConsentModal
            open={showAgeGateModal}
            onComplete={(payload) => {
              // Save age/consent info into formData (minimal, safe)
              setFormData((prev) => ({ ...prev, ...payload }));

              // Close popup and continue normal flow
              setShowAgeGateModal(false);
              setCurrentStep(2);
            }}
          />

          {(currentStep === 1 || currentStep === 1.5) && (
            <>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    const idToken = credentialResponse.credential;

                    const res = await axios.post("/api/users/google-auth", { idToken });

                    // store in correct key
                    localStorage.setItem("userToken", res.data.token);

                    // If profile already completed → go directly
                    if (!res.data.needsProfileCompletion) {
                      navigate("/user/login");
                      return;
                    }


                    // Prefill fields for step 2
                    setFormData((prev) => ({
                      ...prev,
                      name: res.data.name,
                      email: res.data.email,
                    }));

                    // Go to step 2
                    setCurrentStep(2);

                  } catch (error) {
                    console.error(error);
                    setErrorMessage("Google Sign-In failed.");
                  }
                }}
              />


              <p className="text-center text-gray-500 font-medium text-base">
                Already have an account?{" "}
                <Link to="/user/login" className="text-blue-500 hover:underline">
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

export default UnifiedUserRegistration;