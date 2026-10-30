import React, { useState, useEffect, useRef } from "react";
import axios from "../../../../api/axiosInstance";
import LevelThree from "./LevelThree";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { US_STATES, CA_PROVINCES } from "../../../../constants/locations";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import FormSelect from "../../../../components/FormSelect";
import {
  validatePostalCode,
  getPostalCodeErrorMessage,
  formatPostalCodeInput,
} from "../../../../utils/validation";

const ProfileForm = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    universityName: "",
    dob: "",
    educationLevel: "",
    fieldOfStudy: "",
    desiredField: "",
    linkedin: "",
    portfolio: "",
    financialStatus: "",
    state: "",
    country: "",
    city: "",
    postalCode: "",
    address: "",
    currentGrade: "",
    gradePercentage: "",
    profileImage: "",
    skills: "",
    interests: "",
    preferredLocations: "",
  });

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [filteredInstitutionSuggestions, setFilteredInstitutionSuggestions] =
    useState([]);
  const cityTimerRef = useRef(null);
  const cityAbortRef = useRef(null);
  const institutionTimerRef = useRef(null);

  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLevel1Open, setIsLevel1Open] = useState(true);
  const [isLevel2Open, setIsLevel2Open] = useState(false);
  const [isLevel3Open, setIsLevel3Open] = useState(false);
  const [createLevelThree, setCreateLevelThree] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [tempUser, setTempUser] = useState({});
  //Add this for loading effect for save changes button - 11-08-2026
  const [isSaving, setIsSaving] = useState(false);
  const [urlErrors, setUrlErrors] = useState({ linkedin: "", portfolio: "" });
  const [postalCodeError, setPostalCodeError] = useState("");

  const stateList =
    tempUser.country === "Canada"
      ? CA_PROVINCES
      : tempUser.country === "United States"
        ? US_STATES
        : [];

  const stateLabel =
    tempUser.country === "Canada"
      ? "Province / Territory"
      : tempUser.country === "United States"
        ? "State"
        : "State / Province";

  const zipLabel =
    tempUser.country === "Canada"
      ? "Postal Code"
      : tempUser.country === "United States"
        ? "ZIP Code"
        : "ZIP / Postal Code";

  const educationLevels = [
    { value: "", label: "Select Education Level" },
    { value: "highschool", label: "High School" },
    { value: "undergraduate", label: "Undergraduate" },
    { value: "graduate", label: "Graduate" },
  ];

  const gradeOptions = [
    { value: "", label: "Select Grade" },
    ...Array.from({ length: 5 }, (_, i) => {
      const grade = i + 8;
      return { value: `Grade ${grade}`, label: `Grade ${grade}` };
    }),
  ];

  const fieldOptions = [
    { value: "", label: "Select Your Field" },
    { value: "Space", label: "Space Internships" },
    { value: "Aeronautical", label: "Aeronautical Internships" },
    { value: "Tech", label: "Tech Internships" },
    { value: "Research", label: "Research Internships" },
    { value: "Education", label: "Education Internships" },
  ];

  const isValidDate = (date) => {
    if (!date || typeof date !== "string") return false;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) {
          setErrorMessage("Please log in again.");
          return;
        }

        const { data } = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formattedData = {
          ...data,
          dob: isValidDate(data.dob) ? new Date(data.dob) : "",
          skills: Array.isArray(data.skills)
            ? data.skills.join(", ")
            : data.skills || "",
          interests: Array.isArray(data.interests)
            ? data.interests.join(", ")
            : data.interests || "",
          preferredLocations: Array.isArray(data.preferredLocations)
            ? data.preferredLocations.join(", ")
            : data.preferredLocations || "",
          universityName: data.universityName || data.institutionName || "",
          currentGrade: data.currentGrade || data.grade || "",
          postalCode: data.postalCode || data.zip || "",
        };

        setUser(formattedData);
        setTempUser(formattedData);
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load profile.");
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const cityTimer = cityTimerRef.current;
    const cityAbort = cityAbortRef.current;
    const institutionTimer = institutionTimerRef.current;

    return () => {
      if (cityTimer) clearTimeout(cityTimer);
      if (cityAbort) cityAbort.abort();
      if (institutionTimer) clearTimeout(institutionTimer);
    };
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
    setTempUser({ ...user });
    setPostalCodeError("");
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setTempUser({ ...user });
    setPostalCodeError("");
    setCitySuggestions([]);
    setFilteredInstitutionSuggestions([]);
  };

  const handlePostalCodeChange = (e) => {
    const rawVal = e.target.value;
    const formatted = formatPostalCodeInput(rawVal, tempUser.country);
    setTempUser((prev) => ({ ...prev, postalCode: formatted }));

    if (postalCodeError) {
      if (!formatted || validatePostalCode(formatted, tempUser.country)) {
        setPostalCodeError("");
      } else {
        setPostalCodeError(getPostalCodeErrorMessage(formatted, tempUser.country));
      }
    }
  };

  const handlePostalCodeBlur = () => {
    if (tempUser.postalCode && tempUser.postalCode.trim()) {
      const err = getPostalCodeErrorMessage(tempUser.postalCode, tempUser.country);
      setPostalCodeError(err);
    } else {
      setPostalCodeError("");
    }
  };

  const handleTempChange = (e) => {
    const { name, value } = e.target;
    // ✅ FIX: Use functional update with spread to avoid stale state
    setTempUser((prev) => {
      const updated = { ...prev, [name]: value };
      // Clear currentGrade when education level changes away from highschool
      if (name === "educationLevel" && value !== "highschool") {
        updated.currentGrade = "";
      }
      return updated;
    });
  };

  const handleDateChange = (date) => {
    const updatedDate = date ? new Date(date) : null;
    if (updatedDate) updatedDate.setHours(0, 0, 0, 0);
    setTempUser((prev) => ({ ...prev, dob: updatedDate }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPEG, PNG, JPG)");
      return;
    }

    setTempUser((prev) => ({ ...prev, profileImage: file }));
  };

  const handleInstitutionInputChange = (e) => {
    const value = e.target.value;

    setTempUser((prev) => ({ ...prev, universityName: value }));

    if (institutionTimerRef.current) clearTimeout(institutionTimerRef.current);

    if (tempUser.educationLevel === "highschool") {
      setFilteredInstitutionSuggestions([]);
      return;
    }

    if (!value || value.trim().length < 2 || !tempUser.country) {
      setFilteredInstitutionSuggestions([]);
      return;
    }

    institutionTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/locations/universities?country=${encodeURIComponent(
            tempUser.country,
          )}&query=${encodeURIComponent(value.trim())}`,
        );

        if (!res.ok) return;

        const data = await res.json();
        setFilteredInstitutionSuggestions(data);
      } catch (err) {
        console.error("Institution fetch error:", err);
      }
    }, 400);
  };

  const handleCityInputChange = (e) => {
    const value = e.target.value;

    setTempUser((prev) => ({ ...prev, city: value }));

    if (cityTimerRef.current) clearTimeout(cityTimerRef.current);

    if (!tempUser.country) {
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
            tempUser.country,
          )}&query=${encodeURIComponent(value.trim())}`,
        );

        if (!res.ok) return;

        const data = await res.json();
        setCitySuggestions(data);
      } catch (err) {
        console.error("City fetch error:", err);
      }
    }, 400);
  };

  const handleCitySelect = (c) => {
    setTempUser((prev) => ({
      ...prev,
      city: c.city,
      state: c.state,
    }));
    setCitySuggestions([]);
  };

  const handleCountryChange = (value) => {
    setTempUser((prev) => {
      const remappedCode = formatPostalCodeInput(prev.postalCode || "", value);
      return {
        ...prev,
        country: value,
        state: "",
        city: "",
        universityName: "",
        postalCode: remappedCode,
      };
    });

    if (tempUser.postalCode && tempUser.postalCode.trim()) {
      const remappedCode = formatPostalCodeInput(tempUser.postalCode, value);
      const err = getPostalCodeErrorMessage(remappedCode, value);
      setPostalCodeError(err);
    } else {
      setPostalCodeError("");
    }

    setCitySuggestions([]);
    setFilteredInstitutionSuggestions([]);
  };

  const handleUpdateProfile = async () => {
    //for save loading effect - 11-08-2026
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage("");

    // Validate LinkedIn and Portfolio URLs
    const isValidUrl = (val) => {
      if (!val || !val.trim()) return true; // empty is allowed
      try {
        const url = new URL(val.trim());
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    };

    const newUrlErrors = {
      linkedin: !isValidUrl(tempUser.linkedin) ? "Please enter a valid URL (e.g. https://linkedin.com/in/username)" : "",
      portfolio: !isValidUrl(tempUser.portfolio) ? "Please enter a valid URL (e.g. https://yourportfolio.com)" : "",
    };
    setUrlErrors(newUrlErrors);

    // Validate Postal / ZIP Code according to Country
    let zipErr = "";
    if (tempUser.postalCode && tempUser.postalCode.trim()) {
      zipErr = getPostalCodeErrorMessage(tempUser.postalCode, tempUser.country);
      setPostalCodeError(zipErr);
    } else {
      setPostalCodeError("");
    }

    if (newUrlErrors.linkedin || newUrlErrors.portfolio || zipErr) {
      if (zipErr) {
        setIsLevel2Open(true);
      }
      setIsSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        setErrorMessage("Please log in again.");
        return;
      }

      const formData = new FormData();

      Object.entries(tempUser).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        if (key === "profileImage" && typeof value === "object") return;

        if (["skills", "interests", "preferredLocations"].includes(key)) {
          const list = value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          formData.append(key, list.join(","));
          return;
        }

        if (key === "dob" && value instanceof Date) {
          formData.append("dob", value.toISOString());
          return;
        }

        formData.append(key, value);
      });

      if (tempUser.profileImage && typeof tempUser.profileImage === "object") {
        formData.append("profileImage", tempUser.profileImage);
      }

      await axios.put("/api/users/profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const { data: updatedUser } = await axios.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedUpdatedUser = {
        ...updatedUser,
        dob: isValidDate(updatedUser.dob) ? new Date(updatedUser.dob) : "",
        skills: Array.isArray(updatedUser.skills)
          ? updatedUser.skills.join(", ")
          : updatedUser.skills || "",
        interests: Array.isArray(updatedUser.interests)
          ? updatedUser.interests.join(", ")
          : updatedUser.interests || "",
        preferredLocations: Array.isArray(updatedUser.preferredLocations)
          ? updatedUser.preferredLocations.join(", ")
          : updatedUser.preferredLocations || "",
        universityName:
          updatedUser.universityName || updatedUser.institutionName || "",
        currentGrade: updatedUser.currentGrade || updatedUser.grade || "",
        postalCode: updatedUser.postalCode || updatedUser.zip || "",
      };

      setUser(formattedUpdatedUser);
      setTempUser(formattedUpdatedUser); // ✅ FIX: sync tempUser too, otherwise Cancel after save shows stale data

      // ✅ FIX: Store the full updated profile in localStorage (not just updatedUser which
      //    lacks isPremium/planType fields that Navbar reads). Merge with existing stored
      //    premium fields so they are never wiped on a profile save.
      const existingStored = (() => {
        try {
          return (
            JSON.parse(localStorage.getItem("studentInfo")) ||
            JSON.parse(localStorage.getItem("userInfo")) ||
            {}
          );
        } catch {
          return {};
        }
      })();
      localStorage.setItem(
        "studentInfo",
        JSON.stringify({
          ...existingStored,
          ...updatedUser,
          // Never overwrite premium fields from a profile-update response
          isPremium: existingStored.isPremium ?? updatedUser.isPremium,
          planType: existingStored.planType ?? updatedUser.planType ?? "Free",
          premiumExpiration:
            existingStored.premiumExpiration ?? updatedUser.premiumExpiration,
        }),
      );

      // ✅ FIX: Dispatch "userInfoUpdated" (what Navbar actually listens for after our fix),
      //    AND the native "storage" event for any other listeners.
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("userInfoUpdated"));

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);

      setCitySuggestions([]);
      setFilteredInstitutionSuggestions([]);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Profile update failed.");
    } finally {
      //Add this for save loading effect - 11-08-2026
      setIsSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    if (typeof date === "string") {
      const d = new Date(date);
      return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return "";
  };

  const getDisplayValue = (value, options) => {
    if (!value) return "";
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  // ✅ FIX: Use tempUser.educationLevel in edit mode for conditional rendering,
  //    and user.educationLevel in view mode — previously both always used user.educationLevel
  //    which meant grade/school fields showed stale values while editing.
  const activeEducationLevel = isEditing
    ? tempUser.educationLevel
    : user.educationLevel;

  return (
    <div className="w-full flex justify-center font-poppins py-2 sm:py-4">
      <div className="w-full max-w-4xl bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        {/* Header with Edit Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Your Profile</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-0.5">
              {isEditing
                ? "Edit your personal and academic details"
                : "View your personal and academic details"}
            </p>
          </div>

          {!isEditing ? (
            <button
              onClick={handleEditClick}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium shadow-sm transition duration-200 shrink-0 whitespace-nowrap self-start sm:self-auto"
            >
              <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCancelClick}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition duration-200 whitespace-nowrap"
              >
                <XMarkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={isSaving}
                className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium shadow-sm transition duration-200 whitespace-nowrap ${
                  isSaving
                    ? "bg-green-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                }`}
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 border border-green-200 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Profile Level 1 */}
        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex justify-between items-center p-4 bg-blue-50 cursor-pointer hover:bg-blue-100"
            onClick={() => setIsLevel1Open(!isLevel1Open)}
          >
            <h3 className="text-xl font-semibold text-gray-800">
              Personal & Academic Information
            </h3>
            <span className="text-gray-600">{isLevel1Open ? "▲" : "▼"}</span>
          </div>

          {isLevel1Open && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={tempUser.name}
                      onChange={handleTempChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                      {user.name || "Not provided"}
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  {/*Add the "break-words" style to the email - 04-08-2026 */}
                  <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                    {user.email}
                  </div>
                </div>

                {/* LinkedIn Profile */}
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-gray-700">
                    LinkedIn Profile
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        type="url"
                        name="linkedin"
                        value={tempUser.linkedin}
                        onChange={(e) => {
                          handleTempChange(e);
                          if (urlErrors.linkedin) setUrlErrors(prev => ({ ...prev, linkedin: "" }));
                        }}
                        className={`w-full border px-3 py-2 rounded-lg box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          urlErrors.linkedin ? "border-rose-400 focus:ring-rose-400" : "border-gray-300"
                        }`}
                        placeholder="https://linkedin.com/in/username"
                      />
                      {urlErrors.linkedin && (
                        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {urlErrors.linkedin}
                        </p>
                      )}
                    </>
                  ) : (
                    /*Add the "break-words" style to the linkedIn profile - 04-08-2026 */
                    <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                      {user.linkedin ? (
                        <a
                          href={user.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {user.linkedin}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </div>
                  )}
                </div>

                {/* Portfolio */}
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-gray-700">
                    Portfolio
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        type="url"
                        name="portfolio"
                        value={tempUser.portfolio}
                        onChange={(e) => {
                          handleTempChange(e);
                          if (urlErrors.portfolio) setUrlErrors(prev => ({ ...prev, portfolio: "" }));
                        }}
                        className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          urlErrors.portfolio ? "border-rose-400 focus:ring-rose-400" : "border-gray-300"
                        }`}
                        placeholder="https://yourportfolio.com"
                      />
                      {urlErrors.portfolio && (
                        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {urlErrors.portfolio}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                      {user.portfolio ? (
                        <a
                          href={user.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {user.portfolio}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Education Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Current level of education
                </label>
                {isEditing ? (
                  <FormSelect
                    value={tempUser.educationLevel || ""}
                    onChange={(e) =>
                      handleTempChange({
                        target: { name: "educationLevel", value: e.target.value },
                      })
                    }
                    options={educationLevels}
                    placeholder="Select Education Level"
                    focusRingColor="blue-500"
                  />
                ) : (
                  <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                    {getDisplayValue(user.educationLevel, educationLevels)}
                  </div>
                )}
              </div>

              {/* ✅ FIX: Use activeEducationLevel so grade/school fields react to edits instantly */}
              {activeEducationLevel === "highschool" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Current Grade
                  </label>
                  {isEditing ? (
                    <FormSelect
                      value={tempUser.currentGrade || ""}
                      onChange={(e) =>
                        handleTempChange({
                          target: { name: "currentGrade", value: e.target.value },
                        })
                      }
                      options={gradeOptions}
                      placeholder="Select Grade"
                      focusRingColor="blue-500"
                    />
                  ) : (
                    <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                      {user.currentGrade || "Not provided"}
                    </div>
                  )}
                </div>
              )}

              {activeEducationLevel && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {activeEducationLevel === "highschool"
                      ? "School Name"
                      : "College / University Name"}
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        name="universityName"
                        value={tempUser.universityName}
                        onChange={handleInstitutionInputChange}
                        placeholder={
                          tempUser.educationLevel === "highschool"
                            ? "Enter your school name"
                            : "Search college or university"
                        }
                        autoComplete="off"
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {tempUser.educationLevel !== "highschool" &&
                        filteredInstitutionSuggestions.length > 0 && (
                          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                            {filteredInstitutionSuggestions.map((u, index) => (
                              <li
                                key={index}
                                onClick={() => {
                                  setTempUser((prev) => ({
                                    ...prev,
                                    universityName: u.name,
                                  }));
                                  setFilteredInstitutionSuggestions([]);
                                }}
                                className="cursor-pointer px-4 py-2 hover:bg-blue-50"
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
                  ) : (
                    <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                      {user.universityName || "Not provided"}
                    </div>
                  )}
                </div>
              )}

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                {isEditing ? (
                  <DatePicker
                    selected={tempUser.dob}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    maxDate={new Date()}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    placeholderText="DD/MM/YYYY"
                    wrapperClassName="w-full"
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                    {formatDate(user.dob) || "Not provided"}
                  </div>
                )}
              </div>

              {/* Field of Study */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Field of Study
                </label>
                {isEditing ? (
                  <FormSelect
                    value={tempUser.fieldOfStudy || ""}
                    onChange={(e) =>
                      handleTempChange({
                        target: { name: "fieldOfStudy", value: e.target.value },
                      })
                    }
                    options={fieldOptions}
                    placeholder="Select Your Field"
                    focusRingColor="blue-500"
                  />
                ) : (
                  <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                    {getDisplayValue(user.fieldOfStudy, fieldOptions)}
                  </div>
                )}
              </div>

              {/* Desired Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Desired field of Internship/Job
                </label>
                {isEditing ? (
                  <FormSelect
                    value={tempUser.desiredField || ""}
                    onChange={(e) =>
                      handleTempChange({
                        target: { name: "desiredField", value: e.target.value },
                      })
                    }
                    options={fieldOptions}
                    placeholder="Select Your Field"
                    focusRingColor="blue-500"
                  />
                ) : (
                  <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                    {getDisplayValue(user.desiredField, fieldOptions)}
                  </div>
                )}
              </div>

              {/* Skills, Interests, Preferred Locations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-gray-700">
                    Skills
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="skills"
                      value={tempUser.skills}
                      onChange={handleTempChange}
                      placeholder="e.g. React, Python, SQL"
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg min-h-[42px] break-words overflow-hidden">
                      {user.skills || "Not provided"}
                    </div>
                  )}
                </div>

                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-gray-700">
                    Interests
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="interests"
                      value={tempUser.interests}
                      onChange={handleTempChange}
                      placeholder="e.g. AI, Robotics, Data Science"
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg min-h-[42px] break-words overflow-hidden">
                      {user.interests || "Not provided"}
                    </div>
                  )}
                </div>

                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-gray-700">
                    Preferred Locations
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="preferredLocations"
                      value={tempUser.preferredLocations}
                      onChange={handleTempChange}
                      placeholder="e.g. Hyderabad, Remote, Bangalore"
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg min-h-[42px] break-words overflow-hidden">
                      {user.preferredLocations || "Not provided"}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Image */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Profile Image
                </label>
                <div className="flex items-center gap-6">
                  {(user.profileImage || tempUser.profileImage) && (
                    <img
                      src={
                        typeof (isEditing
                          ? tempUser.profileImage
                          : user.profileImage) === "object"
                          ? URL.createObjectURL(
                              isEditing
                                ? tempUser.profileImage
                                : user.profileImage,
                            )
                          : isEditing
                            ? tempUser.profileImage
                            : user.profileImage
                      }
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                    />
                  )}
                  {isEditing && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload a new profile image (JPEG, PNG, JPG)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Level 2 */}
        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex justify-between items-center p-4 bg-blue-50 cursor-pointer hover:bg-blue-100"
            onClick={() => setIsLevel2Open(!isLevel2Open)}
          >
            <h3 className="text-xl font-semibold text-gray-800">
              Location & Additional Information
            </h3>
            <span className="text-gray-600">{isLevel2Open ? "▲" : "▼"}</span>
          </div>

          {isLevel2Open && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-gray-700">
                    Financial Status
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="financialStatus"
                      value={tempUser.financialStatus}
                      onChange={handleTempChange}
                      placeholder="e.g. Need financial aid"
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                      {user.financialStatus || "Not provided"}
                    </div>
                  )}
                </div>

                {/* ✅ FIX: Use activeEducationLevel here too for consistency */}
                {activeEducationLevel !== "highschool" && (
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-medium text-gray-700">
                      Grade Percentage
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="gradePercentage"
                        value={tempUser.gradePercentage}
                        onChange={handleTempChange}
                        placeholder="e.g. 85% or 3.5 GPA"
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                        {user.gradePercentage || "Not provided"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700">
                  Location Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-medium text-gray-700">
                      Country
                    </label>
                    {isEditing ? (
                      <FormSelect
                        value={tempUser.country || ""}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        options={[
                          { value: "", label: "Select Country" },
                          { value: "United States", label: "United States" },
                          { value: "Canada", label: "Canada" },
                        ]}
                        placeholder="Select Country"
                        focusRingColor="blue-500"
                      />
                    ) : (
                      <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                        {user.country || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-medium text-gray-700">
                      {stateLabel}
                    </label>
                    {isEditing ? (
                      <FormSelect
                        value={tempUser.state || ""}
                        onChange={(e) =>
                          handleTempChange({
                            target: { name: "state", value: e.target.value },
                          })
                        }
                        options={[
                          { value: "", label: "Select State" },
                          ...stateList.map((s) => ({ value: s, label: s })),
                        ]}
                        placeholder="Select State"
                        focusRingColor="blue-500"
                      />
                    ) : (
                      <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                        {user.state || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-medium text-gray-700">
                      City
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          name="city"
                          value={tempUser.city}
                          onChange={handleCityInputChange}
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          disabled={!tempUser.country}
                          placeholder="Start typing city"
                          autoComplete="off"
                        />
                        {citySuggestions.length > 0 && (
                          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                            {citySuggestions.map((c) => (
                              <li
                                key={`${c.city}-${c.state}`}
                                onClick={() => handleCitySelect(c)}
                                className="cursor-pointer px-4 py-2 hover:bg-blue-50"
                              >
                                {c.city}, {c.state}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                        {user.city || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 min-w-0">
                    <label className="text-sm font-medium text-gray-700">
                      {zipLabel}
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          name="postalCode"
                          value={tempUser.postalCode || ""}
                          onChange={handlePostalCodeChange}
                          onBlur={handlePostalCodeBlur}
                          maxLength={
                            tempUser.country === "Canada"
                              ? 7
                              : tempUser.country === "United States"
                              ? 10
                              : 10
                          }
                          className={`w-full border px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                            postalCodeError
                              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                          }`}
                          placeholder={
                            tempUser.country === "Canada"
                              ? "e.g., K1A 0B1"
                              : "e.g., 94105 or 94105-1234"
                          }
                          autoComplete="postal-code"
                        />
                        {postalCodeError && (
                          <p className="text-xs text-red-500 mt-1 font-normal">
                            {postalCodeError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg break-words overflow-hidden">
                        {user.postalCode || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2 min-w-0">
                    <label className="text-sm font-medium text-gray-700">
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={tempUser.address}
                        onChange={handleTempChange}
                        rows={3}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Street address, Apt/Suite (City is above), State/Province"
                        autoComplete="street-address"
                      />
                    ) : (
                      <div className="border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg min-h-[84px] break-words overflow-hidden">
                        {user.address || "Not provided"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Level 3 */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex justify-between items-center p-4 bg-blue-50 cursor-pointer hover:bg-blue-100"
            onClick={() => setIsLevel3Open(!isLevel3Open)}
          >
            <h3 className="text-xl font-semibold text-gray-800">
              Profile Level 3
            </h3>
            <span className="text-gray-600">{isLevel3Open ? "▲" : "▼"}</span>
          </div>

          {isLevel3Open && createLevelThree && (
            <div className="p-6">
              <LevelThree
                profileData={user}
                setCreateLevelThree={setCreateLevelThree}
                handleProfileData={handleUpdateProfile}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
//changes
