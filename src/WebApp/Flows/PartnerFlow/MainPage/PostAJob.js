//File: PostAJob.js

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "../../../../api/axiosInstance";
import defaultCompanyLogo from "../../../../assets/default-company-logo.png";

import { useTabContext } from "./UserHomePageContext/HomePageContext";

// --- US states & Canada provinces/territories ---
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

const PostAJob = () => {
  const { saveJob } = useTabContext();

  // Sector options — values match backend enum exactly
  const topSectors = [
    { id: "advanced-ai",       name: "Advanced AI & Autonomous Systems" },
    { id: "quantum-computing", name: "Quantum Computing & Next-Gen Computing" },
    { id: "climate-tech",      name: "Climate Tech & Carbon Capture" },
    { id: "biotech",           name: "Biotechnology & Synthetic Biology" },
    { id: "materials-science", name: "Advanced Materials Science" },
  ];

  // All dropdown fields default to "" so their placeholder option shows on load
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    sector: "",         // enum: advanced-ai | quantum-computing | climate-tech | biotech | materials-science
    city: "",
    country: "",        // enum: "United States" | "Canada"
    state: "",
    jobType: "Internship",
    jobDescription: "",
    startDate: "",
    endDateOrDuration: "",
    duration: "",
    internshipType: "", // enum: FREE | STIPEND | PAID
    classification: "", // enum: Basic | Intermediate | Advanced
    compensationDetails: {
      type: "",
      amount: null,
      currency: "",     // enum: USD | CAD | EUR | INR | GBP
      frequency: "",    // enum: MONTHLY | WEEKLY | ONE_TIME
    },
    mode: "",           // sent as .toUpperCase() → ONLINE | OFFLINE | HYBRID
    qualifications: [],
    contactInfo: { name: "", email: "", phone: "" },
    imgUrl: "",
    studentApplied: false,
    adminApproved: false,
    applicationOpen: true,
  });

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [userType, setUserType] = useState("");
  const [freemiumAlert, setFreemiumAlert] = useState("");
  const cityDebounceRef = useRef(null);

  // Derived list/labels for State/Province based on selected country
  const stateList = formData.country === "Canada" ? CA_PROVINCES : US_STATES;
  const stateLabel = formData.country === "Canada" ? "Province / Territory" : "State";
  const [qualInput, setQualInput] = useState("");

  useEffect(() => {
    try {
      const ui = (JSON.parse(localStorage.getItem("partnerInfo")) || JSON.parse(localStorage.getItem("userInfo")));
      if (ui) {
        setUserType(ui.planType);
      }
    } catch (err) {
      console.error("PostAJob: failed reading localStorage", err);
    }
  }, []);

  // City search — calls backend proxy /api/cities (API key stays server-side)
  const searchCities = useCallback(
    async (q) => {
      if (!q || q.trim().length < 2) { setCitySuggestions([]); return; }
      try {
        const countryIds =
          formData.country === "Canada" ? "CA" :
          formData.country === "United States" ? "US" : "US,CA";

        const resp = await axios.get("/api/cities", {
          params: { namePrefix: q.trim(), limit: 10, minPopulation: 100000, countryIds },
        });
        setCitySuggestions(resp.data?.data || []);
      } catch (err) {
        console.error("City lookup failed:", err);
        setCitySuggestions([]);
      }
    },
    [formData.country],
  );

  const handleCityInputChange = (e) => {
    const { value } = e.target;
    setFormData((p) => ({ ...p, city: value }));
    clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(() => searchCities(value), 300);
  };

  const handleCitySelect = (name) => {
    setFormData((p) => ({ ...p, city: name }));
    setCitySuggestions([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "internshipType") {
        return {
          ...prev,
          internshipType: value,
          compensationDetails: {
            ...prev.compensationDetails,
            type: value,
            // Reset amount/currency/frequency when switching to FREE
            ...(value === "FREE" && { amount: null, currency: "", frequency: "" }),
          },
        };
      }
      if (name.startsWith("compensationDetails.")) {
        const field = name.split(".")[1];
        return { ...prev, compensationDetails: { ...prev.compensationDetails, [field]: value } };
      }
      if (name.startsWith("contactInfo.")) {
        const field = name.split(".")[1];
        return { ...prev, contactInfo: { ...prev.contactInfo, [field]: value } };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
    try {
      const data = new FormData();
      data.append("image", file);
      const res = await axios.post("/api/upload/job-image", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        setFormData((prev) => ({ ...prev, imgUrl: res.data.imageUrl }));
      } else {
        console.error("Upload failed:", res?.data?.message || "no message");
      }
    } catch (err) {
      console.error("Image upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  // Duration calc — uses total day diff (avoids negative-day bug)
  const calculateDuration = useCallback((startDate, endDateOrDuration) => {
  if (!startDate || !endDateOrDuration) {
    setFormData((prev) => ({ ...prev, duration: "" }));
    return;
  }

  // Prevent timezone issues
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDateOrDuration + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    setFormData((prev) => ({ ...prev, duration: "" }));
    return;
  }

  if (end < start) {
    setFormData((prev) => ({ ...prev, duration: "Invalid duration" }));
    return;
  }

  const totalDays = Math.floor(
    (end - start) / (1000 * 60 * 60 * 24)
  );

  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;

  const durationText =
    months > 0
      ? `${months} month${months > 1 ? "s" : ""}${
          days > 0 ? ` and ${days} day${days > 1 ? "s" : ""}` : ""
        }`
      : `${totalDays} day${totalDays > 1 ? "s" : ""}`;

  setFormData((prev) => ({
    ...prev,
    duration: durationText,
  }));
}, []);

{/* Qualifications — tag input */}


const addQualification = () => {
  const val = qualInput.trim();
  if (!val) return;
  setFormData((prev) => ({
    ...prev,
    qualifications: [...prev.qualifications, val],
  }));
  setQualInput("");
};

const removeQualification = (index) => {
  setFormData((prev) => ({
    ...prev,
    qualifications: prev.qualifications.filter((_, i) => i !== index),
  }));
};
  useEffect(() => {
    calculateDuration(formData.startDate, formData.endDateOrDuration);
  }, [formData.startDate, formData.endDateOrDuration, calculateDuration]);

  // All dropdowns reset to "" so placeholders reappear after submit
  const resetForm = () => {
    setFormData({
      jobTitle: "",
      companyName: "",
      sector: "",
      city: "",
      country: "",
      state: "",
      jobType: "Internship",
      jobDescription: "",
      startDate: "",
      endDateOrDuration: "",
      duration: "",
      internshipType: "",
      classification: "",
      compensationDetails: { type: "", amount: null, currency: "", frequency: "" },
      mode: "",
      qualifications: [],
      contactInfo: { name: "", email: "", phone: "" },
      imgUrl: "",
      studentApplied: false,
      adminApproved: false,
      applicationOpen: true,
    });
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pid = localStorage.getItem("partnerId");
    if (!pid) { console.error("No partner ID"); return; }

    if (userType === "Freemium" && formData.internshipType === "PAID") {
      setFreemiumAlert("Upgrade required to post paid internships.");
      setTimeout(() => setFreemiumAlert(""), 3500);
      return;
    }

    const payload = {
      ...formData,
      imgUrl: formData.imgUrl || defaultCompanyLogo,
      internshipMode: (formData.mode || "ONLINE").toUpperCase(), // ONLINE | OFFLINE | HYBRID
      location: formData.state
        ? `${formData.city}, ${formData.state}, ${formData.country}`
        : `${formData.city}, ${formData.country}`,
      partnerId: pid,
      qualifications: typeof formData.qualifications === 'string' 
        ? formData.qualifications.split(",").map(q => q.trim()).filter(Boolean)
        : formData.qualifications,
    };

    try {
      const res = await axios.post("/api/interns", payload);
      saveJob(res.data);
      setSuccessMessage("Internship posted successfully!");
      resetForm();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error posting internship:", err);
      setErrorMessage("Failed to post internship. Please try again.");
      setTimeout(() => setErrorMessage(""), 3500);
    }
  };

  const inputCls = "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500";
  const locationInputCls = "!mt-0 w-full h-12 box-border p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white";

  return (
    <div className="max-w-4xl font-poppins mx-auto p-6 bg-white rounded-lg shadow-lg mt-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Post an Internship</h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Job Title */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Job Title</label>
          <input type="text" name="jobTitle" value={formData.jobTitle}
            onChange={handleChange} required className={inputCls} placeholder="Enter job title" />
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Company Name</label>
          <input type="text" name="companyName" value={formData.companyName}
            onChange={handleChange} required className={inputCls} placeholder="Enter company name" />
        </div>

        {/* Sector — value matches backend enum (e.g. "advanced-ai") */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Sector</label>
          <select name="sector" value={formData.sector} onChange={handleChange} required className={inputCls}>
            <option value="" disabled>Select a Sector</option>
            {topSectors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Classification — value matches backend enum: Basic | Intermediate | Advanced */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Internship Classification</label>
          <select name="classification" value={formData.classification} onChange={handleChange} required className={inputCls}>
            <option value="" disabled>Select Classification</option>
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Location</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

            {/* Country — value matches backend enum: "United States" | "Canada" */}
            <div className="flex flex-col gap-1">
              <label htmlFor="country" className="block text-gray-700 text-sm">Country *</label>
              <select
                id="country" name="country" value={formData.country}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, country: e.target.value, state: "" }));
                  setCitySuggestions([]);
                }}
                required className={locationInputCls}
              >
                <option value="" disabled>Select Country</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
              </select>
            </div>

            {/* State / Province */}
            <div className="flex flex-col gap-1">
              <label htmlFor="state" className="block text-gray-700 text-sm">{stateLabel} *</label>
              <select id="state" name="state" value={formData.state}
                onChange={handleChange} required className={locationInputCls}>
                <option value="" disabled>Select {stateLabel}</option>
                {stateList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* City — autocomplete via /api/cities */}
            <div className="relative flex flex-col gap-1">
              <label htmlFor="city" className="block text-gray-700 text-sm">City *</label>
              <input
                id="city" type="text" name="city" value={formData.city}
                onChange={handleCityInputChange} autoComplete="address-level2"
                required placeholder="Start typing city"
                className={`${locationInputCls} relative z-[15]`}
              />
              {citySuggestions.length > 0 && (
                <ul className="absolute z-[20] left-0 top-full w-full mt-2 max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                  {citySuggestions.map((city) => (
                    <li
                      key={city.wikiDataId || city.id || city.name}
                      className="px-4 py-2 cursor-pointer hover:bg-teal-50 hover:text-teal-700"
                      onClick={() => handleCitySelect(city.name)}
                    >
                      {city.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Job Description</label>
          <textarea name="jobDescription" value={formData.jobDescription}
            onChange={handleChange} required rows="4" className={inputCls}
            placeholder="Describe the job responsibilities, requirements, etc." />
        </div>

        {/* Start Date — min = today */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Start Date</label>
          <input type="date" name="startDate" value={formData.startDate}
            onChange={handleChange} required
            min={new Date().toISOString().split("T")[0]}
            className={inputCls} />
        </div>

        {/* End Date — min = startDate */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">End Date</label>
          <input type="date" name="endDateOrDuration" value={formData.endDateOrDuration}
            onChange={handleChange} required
            min={formData.startDate || new Date().toISOString().split("T")[0]}
            className={inputCls} />
        </div>

        {/* Calculated Duration (read-only) */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Calculated Duration</label>
          <input type="text" name="duration" value={formData.duration}
            readOnly placeholder="Duration will be calculated" className={inputCls} />
        </div>

        {/* Mode — value sent as .toUpperCase() → ONLINE | OFFLINE | HYBRID */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Mode of Internship</label>
          <select name="mode" value={formData.mode} onChange={handleChange} required className={inputCls}>
            <option value="" disabled>Select Mode</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* Qualifications */}
        <div>
  <label className="block text-gray-700 font-medium mb-2">Qualifications</label>
  <div
    className="flex flex-wrap gap-2 items-center min-h-[48px] p-2 border border-gray-300 rounded-lg bg-white focus-within:ring focus-within:ring-teal-500 cursor-text"
    onClick={() => document.getElementById("qualInput").focus()}
  >
    {formData.qualifications.map((q, i) => (
      <span
        key={i}
        className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-sm px-3 py-1 rounded-full border border-teal-200"
      >
        {q}
        <button
          type="button"
          onClick={() => removeQualification(i)}
          className="ml-1 text-teal-500 hover:text-red-500 leading-none"
          aria-label={`Remove ${q}`}
        >
          ×
        </button>
      </span>
    ))}
    <input
      id="qualInput"
      type="text"
      value={qualInput}
      onChange={(e) => setQualInput(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addQualification(); } }}
      placeholder={formData.qualifications.length === 0 ? "Type a skill and press Enter or Add..." : "Add another..."}
      className="flex-1 min-w-[160px] outline-none bg-transparent text-sm py-1 px-1"
    />
    <button
      type="button"
      onClick={addQualification}
      className="text-sm px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300"
    >
      + Add
    </button>
  </div>
  <p className="text-xs text-gray-400 mt-1">Press Enter or click Add. Click × to remove a skill.</p>
</div>

        {/* Contact Information */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Contact Information</label>
          <div className="space-y-2">
            <input type="text" name="contactInfo.name" value={formData.contactInfo.name}
              onChange={handleChange} required className={inputCls} placeholder="Contact Name" />
            <input type="email" name="contactInfo.email" value={formData.contactInfo.email}
              onChange={handleChange} required className={inputCls} placeholder="Contact Email" />
            <input type="tel" name="contactInfo.phone" value={formData.contactInfo.phone}
              onChange={handleChange} required className={inputCls} placeholder="Contact Phone" />
          </div>
        </div>

        {/* Upload Image */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleFileUpload} className={inputCls} />
          {uploading && <p className="text-sm text-gray-500 mt-1">Uploading image...</p>}
          <img
            src={previewUrl || formData.imgUrl || defaultCompanyLogo}
            alt="Internship preview"
            className="mt-2 h-24 w-24 rounded-lg object-cover border border-gray-200"
          />
        </div>

        {/* Internship Type — value matches backend enum: FREE | STIPEND | PAID */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Internship Type</label>
          <select name="internshipType" value={formData.internshipType} onChange={handleChange} required className={inputCls}>
            <option value="" disabled>Select Internship Type</option>
            <option value="FREE">Free</option>
            <option value="STIPEND">Stipend</option>
            <option value="PAID" disabled={userType === "Freemium"}>
              Paid{userType === "Freemium" ? " (Upgrade required)" : ""}
            </option>
          </select>
        </div>

        {/* Compensation Details — shown only for STIPEND or PAID */}
        {(formData.internshipType === "STIPEND" || formData.internshipType === "PAID") && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Amount</label>
              <input type="number" name="compensationDetails.amount"
                value={formData.compensationDetails.amount || ""}
                onChange={handleChange} required min="0" className={inputCls} placeholder="Enter amount" />
            </div>

            {/* Currency — value matches backend enum: USD | CAD | EUR | INR | GBP */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Currency</label>
              <select name="compensationDetails.currency"
                value={formData.compensationDetails.currency}
                onChange={handleChange} required className={inputCls}>
                <option value="" disabled>Select Currency</option>
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="EUR">EUR</option>
                <option value="INR">INR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            {/* Frequency — value matches backend enum: MONTHLY | WEEKLY | ONE_TIME */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Frequency</label>
              <select name="compensationDetails.frequency"
                value={formData.compensationDetails.frequency}
                onChange={handleChange} required className={inputCls}>
                <option value="" disabled>Select Frequency</option>
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="ONE_TIME">One Time</option>
              </select>
            </div>
          </div>
        )}

        {/* Open for Applications */}
        <div>
          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" name="applicationOpen" checked={formData.applicationOpen}
              onChange={(e) => setFormData((p) => ({ ...p, applicationOpen: e.target.checked }))}
              className="form-checkbox h-5 w-5 text-teal-600" />
            <span className="text-gray-700 font-medium">Open for Applications</span>
          </label>
        </div>

        {/* Submit */}
        <div>
          <button type="submit"
            className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring focus:ring-teal-500">
            Post Internship
          </button>
        </div>

      </form>

      {/* Success toast */}
      {successMessage && (
        <div className="fixed top-20 right-10 z-[9999] bg-green-500 text-white py-3 px-6 rounded-lg shadow-lg transition-all duration-300">
          {successMessage}
        </div>
      )}

      {/* Freemium upgrade alert */}
      {freemiumAlert && (
        <div className="fixed top-28 right-10 z-[9999] bg-orange-500 text-white py-3 px-6 rounded-lg shadow-lg transition-all duration-300">
          {freemiumAlert}
        </div>
      )}

      {/* Error toast */}
      {errorMessage && (
        <div className="fixed top-36 right-10 z-[9999] bg-red-600 text-white py-3 px-6 rounded-lg shadow-lg transition-all duration-300">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default PostAJob;
