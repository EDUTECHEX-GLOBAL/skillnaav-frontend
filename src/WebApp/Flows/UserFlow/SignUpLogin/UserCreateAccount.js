import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "../../../../api/axiosInstance";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import loginImage from "../../../../assets-webapp/login-image.png";
import { GoogleLogin } from "@react-oauth/google";
import { US_STATES, CA_PROVINCES } from "../../../../constants/locations";
import UserAgeGateConsent from "./UserProfileBuilding/UserAgeGateConsent";
import { isValidEmail } from "../../../../utils/validation";

// ---------------------------------------------------------------------------
// Session storage keys — used to resume registration after a page refresh.
// We only persist non-sensitive fields (never password, never confirmPassword).
// ---------------------------------------------------------------------------
const SESSION_KEY_STEP = "reg_step";
const SESSION_KEY_FORMDATA = "reg_formdata";

const clearRegistrationSession = () => {
  sessionStorage.removeItem(SESSION_KEY_STEP);
  sessionStorage.removeItem(SESSION_KEY_FORMDATA);
};

// ... custom dropdown ...


// ---------------------------------------------------------------------------
// Custom Mobile-Safe Dropdown Component
// ---------------------------------------------------------------------------
const CustomDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  disabled = false,
  className = "",
  name,
  required = false,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const normalizedOptions = options.map((opt) =>
    typeof opt === "object" ? opt : { value: opt, label: opt }
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  const handleSelect = (val) => {
    onChange({
      target: {
        name,
        value: val,
      },
    });
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`mt-1 w-full h-11 px-3.5 flex items-center justify-between text-left text-base sm:text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "cursor-pointer hover:border-gray-400"
        } ${className}`}
      >
        <span
          className={`truncate ${
            !selectedOption
              ? "text-gray-400 font-normal"
              : "text-gray-800 font-medium"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 ml-2 flex-shrink-0 transition-transform duration-200 ${
            open ? "transform rotate-180 text-purple-600" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Hidden input to ensure required validation / form semantics if needed */}
      <input
        type="text"
        name={name}
        value={value || ""}
        required={required}
        readOnly
        className="sr-only"
        tabIndex={-1}
      />

      {open && (
        <ul className="absolute z-[9999] left-0 right-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-y-auto py-1 text-base sm:text-sm divide-y divide-gray-50 animate-in fade-in zoom-in-95 duration-100">
          {placeholder && (
            <li
              onClick={() => handleSelect("")}
              className="px-3.5 py-2.5 hover:bg-purple-50 hover:text-purple-700 cursor-pointer text-gray-400 select-none text-sm"
            >
              {placeholder}
            </li>
          )}
          {normalizedOptions.map((opt) => (
            <li
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`px-3.5 py-2.5 hover:bg-purple-50 hover:text-purple-700 cursor-pointer select-none transition-colors text-sm ${
                opt.value === value
                  ? "bg-purple-100 text-purple-800 font-semibold"
                  : "text-gray-700"
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const UnifiedUserRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialise step from sessionStorage so a refresh lands on the right screen
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem(SESSION_KEY_STEP);
    return saved ? parseFloat(saved) : 1;
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAgeGateModal, setShowAgeGateModal] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [resuming, setResuming] = useState(false);

  // OTP resend
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);
  const [canResend, setCanResend] = useState(false);

  //OTP & Verify otp loading effect - 25-09-2026
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // City / university suggestion state
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [filteredInstitutionSuggestions, setFilteredInstitutionSuggestions] =
    useState([]);
  const cityTimerRef = useRef(null);
  const cityAbortRef = useRef(null);
  const institutionTimerRef = useRef(null);

  // --- UNIFIED FORM STATE ---
  // Restore non-sensitive fields from sessionStorage when the page is refreshed
  const [formData, setFormData] = useState(() => {
    const defaults = {
      name: "",
      email: location.state?.email || "",
      password: "",
      confirmPassword: "",
      institutionName: "",
      dob: null,
      educationLevel: "",
      grade: "",
      fieldOfStudy: "",
      country: "",
      state: "",
      city: "",
      zip: "",
      address: "",
      desiredField: "",
      linkedin: "",
      portfolio: "",
      skills: "",
      interests: "",
      preferredLocations: "",
      profilePic: null,
    };
    try {
      const saved = sessionStorage.getItem(SESSION_KEY_FORMDATA);
      if (!saved) return defaults;
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        email: location.state?.email || parsed.email || "",
        // dob is serialised as an ISO string — restore to Date object
        dob: parsed.dob ? new Date(parsed.dob) : null,
        // File objects cannot be serialised — always reset
        profilePic: null,
        // Never restore password fields from storage
        password: "",
        confirmPassword: "",
      };
    } catch {
      return defaults;
    }
  });

  // --- PERSIST step + formData to sessionStorage on every change ---
  // This is what makes refresh-resume work.
  useEffect(() => {
    if (currentStep === 1) {
      // Nothing to persist yet — user hasn't verified email
      return;
    }
    sessionStorage.setItem(SESSION_KEY_STEP, String(currentStep));
  }, [currentStep]);

  useEffect(() => {
    if (currentStep <= 1) return;
    try {
      const { password, confirmPassword, profilePic, ...safeFields } = formData;
      sessionStorage.setItem(SESSION_KEY_FORMDATA, JSON.stringify(safeFields));
    } catch {
      /* storage full — ignore */
    }
  }, [formData, currentStep]);

  // --- ON MOUNT: detect an incomplete registration and resume it ---
  // This handles the case where a user refreshes mid-registration.
  // If there is a token but the profile is incomplete, figure out
  // which step they were on and jump back there automatically.
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return; // fresh visitor — nothing to resume

    // If sessionStorage already knows the step, trust it (set above)
    const savedStep = sessionStorage.getItem(SESSION_KEY_STEP);
    if (savedStep && parseFloat(savedStep) > 1) return;

    // Otherwise ask the server what is missing from the profile
    const resume = async () => {
      try {
        setResuming(true);
        const res = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data;

        const profileComplete =
          user.universityName &&
          user.dob &&
          user.educationLevel &&
          user.fieldOfStudy &&
          user.country &&
          user.desiredField &&
          user.linkedin &&
          user.profileImage;

        if (profileComplete) {
          // Registration was already completed — send to login
          clearRegistrationSession();
          navigate("/user/login");
          return;
        }

        // Profile is incomplete — check age gate consent
        const consentRes = await axios.get("/api/user-age-gate-consent", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const hasConsent = !!consentRes.data?.data?.ageGateCompleted;

        if (!hasConsent) {
          // Stalled right after OTP — need to complete age gate
          setCurrentStep(1.5);
          setShowAgeGateModal(true);
        } else if (!user.educationLevel) {
          // Completed age gate but not Step 2
          setCurrentStep(2);
        } else {
          // Completed Step 2 but not Step 3
          setCurrentStep(3);
        }

        // Pre-fill whatever the server already knows
        setFormData((prev) => ({
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
          institutionName: user.universityName || prev.institutionName,
          dob: user.dob ? new Date(user.dob) : prev.dob,
          educationLevel: user.educationLevel || prev.educationLevel,
          fieldOfStudy: user.fieldOfStudy || prev.fieldOfStudy,
          desiredField: user.desiredField || prev.desiredField,
          linkedin: user.linkedin || prev.linkedin,
          country: user.country || prev.country,
          state: user.state || prev.state,
          city: user.city || prev.city,
          zip: user.postalCode || prev.zip,
          address: user.address || prev.address,
        }));
      } catch (err) {
        // Token invalid / expired — clear everything and start fresh
        localStorage.removeItem("userToken");
        clearRegistrationSession();
        setCurrentStep(1);
      } finally {
        setResuming(false);
      }
    };

    resume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🕒 Countdown timer for OTP resend — only active on step 1.5
  useEffect(() => {
    if (currentStep !== 1.5) return;
    if (canResend || resendTimer === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [currentStep, resendTimer, canResend]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    const cityTimer = cityTimerRef.current;
    const cityAbort = cityAbortRef.current;
    return () => {
      if (cityTimer) clearTimeout(cityTimer);
      if (cityAbort) cityAbort.abort();
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

    if (institutionTimerRef.current) clearTimeout(institutionTimerRef.current);

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
        const { data } = await axios.get("/api/locations/universities", {
          params: {
            country: formData.country,
            query: value.trim(),
          },
        });

        setFilteredInstitutionSuggestions(
          Array.isArray(data) ? data : data?.data || [],
        );
      } catch (err) {
        console.error("Institution fetch error:", err);
        setFilteredInstitutionSuggestions([]);
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
    const { name, email, password, confirmPassword } = formData;
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill all required fields.");
      return false;
    }
    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address with a valid domain (e.g. .com, .in).");
      return false;
    }
    // Password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
    const passwordStrengthRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,}$/;
    if (!passwordStrengthRegex.test(password)) {
      setErrorMessage(
        "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character (@$!%*?&^#).",
      );
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords must match.");
      return false;
    }
    return true;
  };

  const handleStep1Submit = async () => {
    if (!validateStep1()) return;

    try {
      // 25-09-2026
      setSendingOtp(true);
      setErrorMessage("");

      // Check email existence
      const checkRes = await axios.get(
        `/api/users/check-email?email=${formData.email}`,
      );
      if (checkRes.data.exists) {
        setErrorMessage(checkRes.data.message || "Email already registered.");
        return;
      }

      // Send OTP
      await axios.post("/api/users/send-verification-code", {
        email: formData.email,
      });

      setCurrentStep(1.5); // Move to OTP verification state
      setErrorMessage("");
      setResendTimer(30);
      setCanResend(false);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to send OTP. Try again.",
      );
    } finally {
      setSendingOtp(false); // 25-09-2026
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setErrorMessage("Please enter the OTP.");
      return;
    }

    try {
      //25-09-2026
      setVerifyingOtp(true);
      setErrorMessage("");

      const verifyRes = await axios.post("/api/users/verify-code", {
        email: formData.email,
        otp,
        password: formData.password,
        // ✅ FIX: send name so the user record is created with a name immediately
        name: formData.name,
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
    } finally {
      setVerifyingOtp(false); // 25-09-2026
    }
  };

  const handleAgeGateComplete = async (payload) => {
    try {
      setSavingConsent(true);

      const token = localStorage.getItem("userToken");

      // ✅ If OVER_18 flow sends a captured photo file, send multipart/form-data
      const hasPhotoFile = payload?.ageVerificationPhoto instanceof File;

      if (hasPhotoFile) {
        const fd = new FormData();

        // append normal fields
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (key === "ageVerificationPhoto") return;

          // FormData stores booleans as strings
          if (typeof value === "boolean") {
            fd.append(key, value ? "true" : "false");
          } else {
            fd.append(key, value);
          }
        });

        // append file
        fd.append("ageVerificationPhoto", payload.ageVerificationPhoto);

        await axios.post("/api/user-age-gate-consent", fd, {
          headers: {
            Authorization: `Bearer ${token}`,
            // ✅ Let axios/browser set boundary automatically
            // DO NOT manually set Content-Type with boundary
          },
        });
      } else {
        // ✅ Under-18 normal JSON save (same as before)
        await axios.post("/api/user-age-gate-consent", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // ✅ After saving consent, go to Education/Profile form (Step 2)
      setShowAgeGateModal(false);
      setCurrentStep(2);
      setErrorMessage("");
    } catch (err) {
      console.error("Consent save failed:", err);
      setErrorMessage("Failed to save consent. Please try again.");
    } finally {
      setSavingConsent(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResending(true);
      await axios.post("/api/users/send-verification-code", {
        email: formData.email,
      });

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

    if (educationLevel === "highschool") {
      if (
        !grade ||
        !institutionName ||
        !country ||
        !state ||
        !city ||
        !zip ||
        !address
      ) {
        return false;
      }
    } else {
      if (
        !institutionName ||
        !educationLevel ||
        !country ||
        !state ||
        !city ||
        !zip ||
        !address
      ) {
        return false;
      }
    }

    return validatePostalCode(zip, country);
  };
  //add this below two functions for zipcode validations - 25-09-2026
  const validatePostalCode = (zip, country) => {
    if (!zip) return false;

    if (country === "United States") {
      return /^\d{5}$/.test(zip);
    }

    if (country === "Canada") {
      return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(zip);
    }

    return /^\d{5}$/.test(zip) || /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(zip);
  };

  const handlePostalCodeChange = (e) => {
    let value = e.target.value;

    if (formData.country === "United States") {
      value = value.replace(/\D/g, "").slice(0, 5);
    } else if (formData.country === "Canada") {
      value = value
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 6)
        .toUpperCase();

      if (value.length > 3) {
        value = `${value.slice(0, 3)} ${value.slice(3)}`;
      }
    }

    setFormData((prev) => ({
      ...prev,
      zip: value,
    }));
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

      await axios.put("/api/users/profile", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      // ✅ Registration fully complete — wipe session so a refresh never re-triggers this flow
      clearRegistrationSession();
      // localStorage.removeItem("userToken"); // Removed to allow access to user-main-page

      navigate("/user-main-page");
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
    setFormData((prev) => ({
      ...prev,
      country: value,
      state: "",
      city: "",
      Zip: "",
    }));
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
        const { data } = await axios.get("/api/locations/cities", {
          params: {
            country: formData.country,
            query: value.trim(),
          },
        });

        setCitySuggestions(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error("City fetch error:", err);
        setCitySuggestions([]);
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
  // --- RENDERING LOGIC (The UI) ---

  const renderStep = () => {
    // Step 1: Account Creation
    if (currentStep === 1) {
      return (
        <div className="w-full space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">
            Create an account
          </h1>
          {/* Account Form */}
          <div className="space-y-4">
            <div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="!mt-0 w-full h-11 px-3.5 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Gmail Address"
                value={formData.email}
                onChange={handleChange}
                className="!mt-0 w-full h-11 px-3.5 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
            </div>
            <div className="relative flex items-center w-full">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="!mt-0 w-full h-11 pl-3.5 pr-11 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="relative flex items-center w-full">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="!mt-0 w-full h-11 pl-3.5 pr-11 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none p-1"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStep1Submit}
            className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-medium text-base rounded-lg transition-colors shadow-sm mt-2"
          >
            {sendingOtp ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Sending OTP...
              </span>
            ) : (
              "Send OTP"
            )}
          </button>
        </div>
      );
    }

    // Step 1.5: OTP Verification
    if (currentStep === 1.5) {
      return (
        <div className="w-full space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-gray-800">
            Verify Your Email
          </h1>
          <p className="text-sm text-gray-600 text-center mb-4">
            Enter the 6-digit code sent to your Gmail:
          </p>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full h-12 text-center tracking-widest text-xl font-bold border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            placeholder="000000"
          />
          <button
            onClick={handleVerifyOTP}
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-medium text-base rounded-lg transition-colors shadow-sm"
          >
            {verifyingOtp ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Verifying...
              </span>
            ) : (
              "Verify & Continue"
            )}
          </button>
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleResendOTP}
              disabled={!canResend || resending}
              className={`text-sm font-medium ${canResend ? "text-blue-500 hover:underline cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
            >
              {resending
                ? "Resending..."
                : canResend
                  ? "Resend OTP"
                  : `Resend in ${resendTimer}s`}
            </button>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-sm font-medium text-gray-600 hover:text-blue-500 cursor-pointer"
            >
              Change Details
            </button>
          </div>
        </div>
      );
    }

    // Step 2: User Profile Form
    if (currentStep === 2) {
      return (
        <form
          onSubmit={handleStep2Submit}
          className="w-full max-w-xl p-4 sm:p-8 space-y-6 bg-white shadow-sm sm:shadow-md rounded-xl sm:rounded-lg"
        >
          <div className="space-y-4">
            {/* EDUCATIONAL INFORMATION */}
            <div className="w-full h-12 p-3 bg-[#F9F0FF] border-b border-[#E6C4FB]">
              <h2 className="text-lg font-bold text-gray-700">EDUCATION</h2>
            </div>

            {/* Education Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current level of education *
              </label>

              <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-x-8 gap-y-3">
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

                <CustomDropdown
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  placeholder="Select Grade"
                  required
                  options={[8, 9, 10, 11, 12].map((g) => ({
                    value: `Grade ${g}`,
                    label: `Grade ${g}`,
                  }))}
                />
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
                  className="mt-1 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />

                {/* University suggestions ONLY for non-highschool */}
                {formData.educationLevel !== "highschool" &&
                  filteredInstitutionSuggestions.length > 0 && (
                    <ul className="absolute z-[9999] w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
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
                          className="cursor-pointer px-4 py-2 hover:bg-purple-100 text-sm"
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
            <div className="[&>.react-datepicker-wrapper]:w-full">
              <label
                htmlFor="dob"
                className="block text-sm font-medium text-gray-700"
              >
                Date of Birth *
              </label>
              <DatePicker
                selected={formData.dob}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                maxDate={new Date()}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                placeholderText="DD/MM/YYYY"
                className="mt-1 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white"
                required
              />
            </div>

            {/* LOCATION */}
            <div className="space-y-4">
              <div className="w-full h-12 p-3 bg-[#F9F0FF] border-b border-[#E6C4FB]">
                <h2 className="text-lg font-bold text-gray-700">LOCATION</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
                {/* Country (US/CA only) */}
                <div className="w-full min-w-0">
                  <label className="block text-sm font-medium text-gray-700">
                    Country *
                  </label>
                  <CustomDropdown
                    name="country"
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    placeholder="Select Country"
                    required
                    options={[
                      { value: "United States", label: "United States" },
                      { value: "Canada", label: "Canada" },
                    ]}
                  />
                </div>
                {/* State / Province */}
                <div className="w-full min-w-0">
                  <label className="block text-sm font-medium text-gray-700">
                    {stateLabel} *
                  </label>
                  <CustomDropdown
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={!formData.country}
                    placeholder={
                      formData.country
                        ? `Select ${stateLabel}`
                        : "Select country first"
                    }
                    required
                    options={stateList.map((s) => ({ value: s, label: s }))}
                  />
                </div>
                {/* City with suggestions */}
                <div className="relative w-full min-w-0">
                  <label className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleCityInputChange}
                    className="mt-1 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 bg-white"
                    disabled={!formData.country}
                    placeholder="Start typing city"
                    autoComplete="off"
                    required
                  />
                  {citySuggestions.length > 0 && (
                    <ul className="absolute z-[9999] left-0 top-full w-full bg-white border border-gray-300 rounded-md shadow-xl mt-1 max-h-48 overflow-y-auto">
                      {citySuggestions.map((c) => (
                        <li
                          key={`${c.city}-${c.state}`}
                          onClick={() => handleCitySelect(c)}
                          className="cursor-pointer px-4 py-2 hover:bg-purple-100 text-sm"
                        >
                          {c.city}, {c.state}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* ZIP / Postal Code */}
                <div className="w-full min-w-0">
                  <label className="block text-sm font-medium text-gray-700">
                    {zipLabel} *
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handlePostalCodeChange}
                    maxLength={formData.country === "Canada" ? 7 : 5}
                    className="mt-1 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white"
                    placeholder={
                      formData.country === "Canada"
                        ? "e.g., K1A 0B1"
                        : "e.g., 94105"
                    }
                    autoComplete="postal-code"
                    required
                  />
                  {formData.zip &&
                    !validatePostalCode(formData.zip, formData.country) && (
                      <p className="mt-1 text-xs text-red-600">
                        {formData.country === "Canada"
                          ? "Please enter a valid Canadian postal code, for example A1A 1A1."
                          : "Please enter a valid 5-digit US ZIP code, for example 12345."}
                      </p>
                    )}
                </div>
                {/* Full Address */}
                <div className="w-full min-w-0 md:col-span-2 md:col-start-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white"
                    placeholder="Street address, Apt/Suite (City is above), State/Province"
                    autoComplete="street-address"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Field of Study Select */}
            <div className="w-full min-w-0">
              <label
                htmlFor="fieldOfStudy"
                className="block text-sm font-medium text-gray-700"
              >
                Field of Study *
              </label>
              <CustomDropdown
                name="fieldOfStudy"
                value={formData.fieldOfStudy}
                onChange={handleChange}
                placeholder="Select Your Field"
                required
                options={[
                  { value: "Space", label: "Space Internships" },
                  { value: "Aeronautical", label: "Aeronautical Internships" },
                  { value: "Tech", label: "Tech Internships" },
                  { value: "Research", label: "Research Internships" },
                  { value: "Education", label: "Education Internships" },
                ]}
              />
            </div>
          </div>
          <div className="flex justify-between mt-6 space-x-4">
            {/* ✅ FIX: OTP is already verified; going back to 1.5 would confuse the user.
                Back is disabled at this point — the account has already been created. */}
            <button
              type="button"
              disabled
              title="You cannot go back — your account has already been created"
              className="w-full py-2 px-4 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!validateStep2()}
              className="bg-purple-500 text-white w-full px-6 py-3 rounded-md hover:bg-purple-600 disabled:bg-gray-400"
            >
              Continue
            </button>
          </div>
        </form>
      );
    }

    // Step 3: User Profile Picture/Professional
    if (currentStep === 3) {
      return (
        <div className="w-full max-w-xl p-4 sm:p-8 space-y-6 bg-white shadow-sm sm:shadow-md rounded-xl sm:rounded-lg overflow-visible">
          <div className="space-y-4">
            <div className="w-full h-12 p-3 bg-purple-100 border-b border-purple-300">
              <h2 className="text-lg font-bold text-gray-700">
                PROFESSIONAL INFORMATION
              </h2>
            </div>
            {/* Desired Field */}
            <div className="w-full min-w-0">
              <label className="block text-sm font-medium text-gray-700">
                Desired field of Internship/Job *
              </label>
              <CustomDropdown
                name="desiredField"
                value={formData.desiredField}
                onChange={handleChange}
                placeholder="Select Your Field"
                required
                options={[
                  { value: "Space", label: "Space Internships" },
                  { value: "Aeronautical", label: "Aeronautical Internships" },
                  { value: "Tech", label: "Tech Internships" },
                  { value: "Research", label: "Research Internships" },
                  { value: "Education", label: "Education Internships" },
                ]}
              />
            </div>

            <div className="w-full h-12 p-3 bg-purple-100 border-b border-purple-300">
              <h2 className="text-lg font-bold text-gray-700">
                UPLOAD PROFILE INFORMATION
              </h2>
            </div>

            <div className="space-y-4">
              {/* LinkedIn Profile Input */}
              <div className="w-full min-w-0">
                <label
                  htmlFor="linkedin"
                  className="block text-sm font-medium text-gray-700"
                >
                  LinkedIn Profile *
                </label>
                <input
                  id="linkedin"
                  type="text"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  required
                  className="mt-2 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white"
                  placeholder="Enter your LinkedIn profile"
                />
              </div>
              {/* Portfolio Website Input (Optional) */}
              <div className="w-full min-w-0">
                <label
                  htmlFor="portfolio"
                  className="block text-sm font-medium text-gray-700"
                >
                  Portfolio Website (Optional)
                </label>
                <input
                  id="portfolio"
                  type="text"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  className="mt-2 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white"
                  placeholder="Enter your Portfolio URL"
                />
              </div>
              {/* Skills Input */}
              <div className="w-full min-w-0">
                <label
                  htmlFor="skills"
                  className="block text-sm font-medium text-gray-700"
                >
                  Skills (comma separated)
                </label>
                <input
                  id="skills"
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  className="mt-2 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white"
                  placeholder="e.g. React, Python, SQL"
                />
              </div>
              {/* Interests Input */}
              <div className="w-full min-w-0">
                <label
                  htmlFor="interests"
                  className="block text-sm font-medium text-gray-700"
                >
                  Interests (comma separated)
                </label>
                <input
                  id="interests"
                  type="text"
                  name="interests"
                  value={formData.interests}
                  onChange={handleChange}
                  className="mt-2 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white"
                  placeholder="e.g. AI, Robotics, Data Science"
                />
              </div>
              {/* Preferred Locations Input */}
              <div className="w-full min-w-0">
                <label
                  htmlFor="preferredLocations"
                  className="block text-sm font-medium text-gray-700"
                >
                  Preferred Locations (comma separated)
                </label>
                <input
                  id="preferredLocations"
                  type="text"
                  name="preferredLocations"
                  value={formData.preferredLocations}
                  onChange={handleChange}
                  className="mt-2 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white"
                  placeholder="e.g. Hyderabad, Remote, Bangalore"
                />
              </div>
              {/* Profile Image Input */}
              <div className="w-full min-w-0">
                <label
                  htmlFor="profilePic"
                  className="block text-sm font-medium text-gray-700"
                >
                  Profile Image *
                </label>
                <input
                  id="profilePic"
                  type="file"
                  name="profilePic"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="mt-2 block w-full text-base sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white"
                  required
                />
                {formData.profilePic && (
                  <p className="text-xs mt-1 text-gray-500">
                    File selected: {formData.profilePic.name}
                  </p>
                )}
              </div>
            </div>

            {/* Button Section with Back and Submit Buttons */}
            <div className="flex justify-between space-x-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleStep3Submit}
                disabled={!validateStep3()}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${validateStep3() ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-300 cursor-not-allowed"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen font-poppins bg-white sm:bg-gray-50 flex flex-col xl:flex-row justify-center">
      {/* ✅ Full-screen resume spinner — shown while we check for an incomplete registration */}
      {resuming && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500">Resuming your registration…</p>
        </div>
      )}

      {/* Side Image (only visible on step 1/1.5 on desktop) */}
      {(currentStep === 1 || currentStep === 1.5) && (
        <div className="hidden xl:flex xl:w-1/2 items-center justify-center">
          <img
            src={loginImage}
            alt="Skillnaav Login Illustration"
            className="w-full h-full object-contain max-w-[830px] max-h-[900px] p-6 ml-6 shadow-lg"
          />
        </div>
      )}

      <div
        className={`w-full ${
          currentStep === 1 || currentStep === 1.5 ? "xl:w-1/2" : "max-w-2xl"
        } flex flex-col justify-center items-center py-4 sm:py-6 px-3 sm:px-6 md:px-8 mx-auto`}
      >
        <div
          className={`w-full ${
            currentStep === 1 || currentStep === 1.5 ? "max-w-md" : "max-w-xl"
          } flex flex-col justify-center`}
        >
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 border border-red-400 rounded">
              {errorMessage}
            </div>
          )}

          {renderStep()}

          <UserAgeGateConsent
            open={showAgeGateModal}
            saving={savingConsent}
            onComplete={handleAgeGateComplete}
            userEmail={formData.email}
          />

          {(currentStep === 1 || currentStep === 1.5) && (
            <div className="w-full space-y-3 mt-4">
              <div className="flex items-center my-3">
                <hr className="w-full border-gray-200" />
                <span className="px-3 text-xs uppercase tracking-wider text-gray-400 font-medium whitespace-nowrap">OR</span>
                <hr className="w-full border-gray-200" />
              </div>

              <div className="w-full flex justify-center shadow-sm rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-all [&>div]:!w-full [&>div>iframe]:!w-full">
                <GoogleLogin
                  text="signup_with"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="100%"
                  logo_alignment="left"
                  onSuccess={async (credentialResponse) => {
                    try {
                      const idToken = credentialResponse.credential;

                      const res = await axios.post("/api/users/google-auth", {
                        idToken,
                      });

                      localStorage.setItem("userToken", res.data.token);

                      // If profile already completed → go directly to login
                      if (!res.data.needsProfileCompletion) {
                        navigate("/user/login");
                        return;
                      }

                      // Prefill fields for later steps
                      setFormData((prev) => ({
                        ...prev,
                        name: res.data.name,
                        email: res.data.email,
                      }));

                      // ✅ FIX: Google users must complete age gate before reaching step 2
                      setShowAgeGateModal(true);
                    } catch (error) {
                      console.error("Google Auth error:", error);
                      setErrorMessage(
                        error.response?.data?.message ||
                          "Unable to sign in with Google. Please try again.",
                      );
                    }
                  }}
                  onError={() =>
                    setErrorMessage(
                      "Unable to sign in with Google. Please try again.",
                    )
                  }
                />
              </div>

              <p className="text-center text-gray-600 text-xs sm:text-sm pt-2">
                Already have an account?{" "}
                <Link
                  to="/user/login"
                  className="text-purple-600 hover:text-purple-700 font-semibold ml-1 hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedUserRegistration;
//note the changes
