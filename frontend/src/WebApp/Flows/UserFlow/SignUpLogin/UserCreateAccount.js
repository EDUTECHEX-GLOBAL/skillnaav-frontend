// File: UnifiedUserRegistration.js

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { FcGoogle } from "react-icons/fc";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// NOTE: You'll need to define your Firebase config and imports here
// import { auth, googleAuthProvider, signInWithPopup } from "../../../../config/Firebase"; 

// --- Location constants and GeoDB config (US/CA only) from UserProfileForm.js ---
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const CA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon"
];

const GEODB_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";
const GEODB_KEY = process.env.REACT_APP_GEODB_KEY || ""; // Replace with your actual key setup

// Example university suggestions
const universitySuggestions = [
  "Harvard University", "Stanford University", "University of California",
  "Massachusetts Institute of Technology", "Oxford University",
];

const UnifiedUserRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // States for OTP resend logic (from UserCreateAccount.js)
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);
  const [canResend, setCanResend] = useState(false);

  // States for UserProfileForm.js city/university suggestions
  const [filteredUniversitySuggestions, setFilteredUniversitySuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const cityTimerRef = useRef(null);
  const cityAbortRef = useRef(null);

  // --- UNIFIED STATE MANAGEMENT ---
  const [formData, setFormData] = useState({
    // Step 1: Account
    name: "", email: "", password: "", confirmPassword: "",
    // Step 2: Profile Form
    universityName: "", dob: null, educationLevel: "", fieldOfStudy: "",
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

    // University suggestion filtering (from UserProfileForm.js)
    if (name === "universityName") {
      const suggestions = universitySuggestions.filter((university) =>
        university.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUniversitySuggestions(suggestions);
    }
  };

  const handleDateChange = (date) => {
    const updatedDate = date ? new Date(date) : null;
    if (updatedDate) updatedDate.setHours(0, 0, 0, 0);
    setFormData((prevData) => ({ ...prevData, dob: updatedDate }));
  };

  const handleUniversitySuggestionClick = (suggestion) => {
    setFormData((prevData) => ({ ...prevData, universityName: suggestion }));
    setFilteredUniversitySuggestions([]);
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
      });

      if (verifyRes.data.success) {
        setCurrentStep(2); // Move to Profile Form
        setErrorMessage("");
      } else {
        setErrorMessage("Invalid OTP. Try again.");
        setCanResend(true); // Optional: Allow immediate resend after failed attempt
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
    const { universityName, dob, educationLevel, fieldOfStudy, country, state, city, zip, address } = formData;
    return Boolean(universityName && dob && educationLevel && fieldOfStudy && country && state && city && zip && address);
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
    // 1. Client-side validation for Step 3 fields
    if (!validateStep3()) {
        setErrorMessage("Please fill the desired field, LinkedIn URL, and upload a profile picture.");
        return;
    }

    setErrorMessage(""); // Clear previous errors
    // Assuming you have a setLoading state in your component
    // setLoading(true); 

    try {
        const formDataToSend = new FormData();

        // 2. Critical Fields Check (Before submission, for robust UI)
        const requiredFieldsForAPI = [
            "name", "email", "password", "universityName", "dob",
            "educationLevel", "fieldOfStudy", "country", "state", "city", "zip", "address",
            "desiredField", "linkedin",
        ];
        
        if (!requiredFieldsForAPI.every((field) => Boolean(formData[field]))) {
             setErrorMessage("Internal data error: Missing critical information from previous steps. Please go back and review.");
             // setLoading(false);
             return;
        }


        // 3. Append all fields to FormData
        Object.entries(formData).forEach(([key, value]) => {
            // Skip the file handle (will be appended separately)
            if (key === "profilePic") return; 
            
            // Handle Date of Birth: Convert Date object to ISO string
            if (key === "dob" && value instanceof Date) {
                formDataToSend.append(key, value.toISOString());
                return;
            }

            // Handle comma-separated string fields
            if (["skills", "interests", "preferredLocations"].includes(key)) {
                const normalizedValue = (value || "").split(",")
                                                    .map((v) => v.trim())
                                                    .filter(v => v)
                                                    .join(",");
                formDataToSend.append(key, normalizedValue);
                return;
            }
            
            // Handle all other fields (name, email, password, location, education, etc.)
            // IMPORTANT: This block includes 'password' and 'confirmPassword'.
            // If the backend at line 165 checks for confirmPassword, we must send it here.
            if (value !== null && value !== undefined) {
                formDataToSend.append(key, value);
            }
        });
        
        // --- NOTE on 'confirmPassword' ---
        // Since we removed the specific exclusion for 'confirmPassword' from the loop 
        // (i.e., we let it be appended like any other field), the backend will now
        // receive it, satisfying the requirement at line 165 of the controller.
        // The check below is now redundant but kept for demonstration:
        
        /* // BACKEND SPECIFIC HACK (REDUNDANT BUT SHOWN FOR CONTEXT):
        // If you were manually removing 'confirmPassword' earlier, this explicit append 
        // would be necessary to satisfy the server's validation check before it's hashed.
        if (!formDataToSend.has("confirmPassword") && formData.confirmPassword) {
             formDataToSend.append("confirmPassword", formData.confirmPassword);
        }
        */


        // 4. Append profile picture separately
        formDataToSend.append("profileImage", formData.profilePic);

        // 5. API Call
        const response = await axios.post("/api/users/register", formDataToSend, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        // 6. Success Action
        if (response.status === 201) {
            // setLoading(false);
            // After successful registration, navigate to the login page
            navigate("/user/login"); 
        }
    } catch (error) {
        console.error("Registration error:", error);
        // setLoading(false);
        setErrorMessage(
            error.response?.data?.error || "Registration failed. Please check your inputs and try again."
        );
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
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, city: value }));

    if (cityTimerRef.current) clearTimeout(cityTimerRef.current);
    if (!value || !formData.country) {
      setCitySuggestions([]);
      if (cityAbortRef.current) cityAbortRef.current.abort();
      return;
    }

    cityTimerRef.current = setTimeout(async () => {
      try {
        if (cityAbortRef.current) cityAbortRef.current.abort();
        cityAbortRef.current = new AbortController();

        const countryIds = formData.country === "Canada" ? "CA" : formData.country === "United States" ? "US" : "US,CA";

        const url = new URL(GEODB_URL);
        url.searchParams.set("namePrefix", value);
        url.searchParams.set("limit", "10");
        url.searchParams.set("minPopulation", "100000");
        url.searchParams.set("countryIds", countryIds);

        const resp = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": GEODB_KEY,
            "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
          },
          signal: cityAbortRef.current.signal,
        });

        if (!resp.ok) throw new Error(`GeoDB error: ${resp.status}`);
        const json = await resp.json();
        setCitySuggestions(json?.data ?? []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error(err);
      }
    }, 300);
  };

  const handleCitySelect = (c) => {
    const regionName = c?.region || c?.regionCode || "";
    const normalizedRegion = stateList.includes(regionName) ? regionName : formData.state;

    setFormData((prev) => ({
      ...prev,
      city: c?.name || "",
      state: normalizedRegion,
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
            <div className="w-full h-12 p-3 bg-[#F9F0FF] border-b border-[#E6C4FB]">
              <h2 className="text-lg font-bold text-gray-700">BASIC INFORMATION</h2>
            </div>
            {/* University Name */}
            <div className="relative">
              <label htmlFor="universityName" className="block text-sm font-medium text-gray-700">University Name</label>
              <input id="universityName" type="text" name="universityName" value={formData.universityName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Enter your University Name" autoComplete="off" required />
              {filteredUniversitySuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {filteredUniversitySuggestions.map((suggestion, index) => (
                    <li key={index} onClick={() => handleUniversitySuggestionClick(suggestion)} className="cursor-pointer px-4 py-2 hover:bg-purple-100">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Date of Birth */}
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
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
                        <li key={c.id || c.wikiDataId || `${c.name}-${c.region}`} onClick={() => handleCitySelect(c)} className="cursor-pointer px-4 py-2 hover:bg-purple-100">
                          {c.name}{c.region ? `, ${c.region}` : ""}
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
            
            {/* EDUCATIONAL INFORMATION */}
            <div className="w-full h-12 p-3 bg-[#F9F0FF] border-b border-[#E6C4FB]">
              <h2 className="text-lg font-bold text-gray-700">EDUCATIONAL INFORMATION</h2>
            </div>
            {/* Education Level Radios */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Current level of education</label>
              <div className="mt-2 space-y-2">
                {["highschool", "undergraduate", "graduate"].map((level) => (
                  <div key={level} className="flex items-center">
                    <input type="radio" id={level} name="educationLevel" value={level} checked={formData.educationLevel === level} onChange={handleChange} className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500" required />
                    <label htmlFor={level} className="ml-3 mt-4 block text-sm text-gray-700">{level.charAt(0).toUpperCase() + level.slice(1)}</label>
                  </div>
                ))}
              </div>
            </div>
            {/* Field of Study Select */}
            <div>
              <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700">Field of Study</label>
              <select name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" required>
                <option value="">Select Your Field</option>
                <option value="space">Space Internships</option>
                <option value="aero">Aeronautical Internships</option>
                <option value="tech">Tech Internships</option>
                <option value="research">Research Internships</option>
                <option value="education">Education Internships</option>
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
                <option value="space">Space Internships</option>
                <option value="aero">Aeronautical Internships</option>
                <option value="tech">Tech Internships</option>
                <option value="research">Research Internships</option>
                <option value="education">Education Internships</option>
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
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
          {/* Replace with actual image path or placeholder */}
          <div className="w-full h-full bg-purple-50 flex items-center justify-center">
                       </div>
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
          
          {(currentStep === 1 || currentStep === 1.5) && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedUserRegistration;