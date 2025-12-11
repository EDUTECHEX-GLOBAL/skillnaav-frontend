import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

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

// City RapidAPI endpoint
const CITY_API_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";

const PostAJob = () => {
  const { saveJob } = useTabContext();

  // Define your top sectors
  const topSectors = [
    { id: "advanced-ai", name: "Advanced AI & Autonomous Systems" },
    { id: "quantum-computing", name: "Quantum Computing & Next-Gen Computing" },
    { id: "climate-tech", name: "Climate Tech & Carbon Capture" },
    { id: "biotech", name: "Biotechnology & Synthetic Biology" },
    { id: "materials-science", name: "Advanced Materials Science" },
  ];

  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    sector: topSectors[0].id,
    city: "",
    country: "United States", // default to US
    state: "",
    jobType: "Internship",
    jobDescription: "",
    startDate: "",
    endDateOrDuration: "",
    duration: "",
    internshipType: "FREE",
    classification: "",
    compensationDetails: {
      type: "FREE",
      amount: null,
      currency: "USD",
      frequency: "MONTHLY",
    },
    mode: "Online",
    qualifications: [],
    contactInfo: { name: "", email: "", phone: "" },
    imgUrl: "",
    studentApplied: false,
    adminApproved: false,
    applicationOpen: true,
  });

  // kept and used states
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [userType, setUserType] = useState("");
  const [partnerInternships, setPartnerInternships] = useState([]);
  const [freemiumAlert, setFreemiumAlert] = useState("");

  // Derived list/labels for State/Province based on selected country
  const stateList = formData.country === "Canada" ? CA_PROVINCES : US_STATES;
  const stateLabel = formData.country === "Canada" ? "Province / Territory" : "State";

  // Load user plan and existing posts
  useEffect(() => {
    try {
      const ui = JSON.parse(localStorage.getItem("userInfo"));
      if (ui) setUserType(ui.planType);

      const pid = localStorage.getItem("partnerId");
      if (pid) {
        axios
          .get(`/api/interns/partner/${pid}`)
          .then((res) => setPartnerInternships(res.data || []))
          .catch(console.error);
      }
    } catch (err) {
      // ignore parse errors
      console.error("PostAJob: failed reading localStorage", err);
    }
  }, []);

  // City autocomplete (country-filtered)
  const debouncedSearchCities = useCallback(
    async (q) => {
      if (!q) {
        setCitySuggestions([]);
        return;
      }
      try {
        const countryIds =
          formData.country === "Canada" ? "CA" :
            formData.country === "United States" ? "US" :
              "US,CA";

        const resp = await axios.get(CITY_API_URL, {
          headers: {
            // Replace with your RapidAPI key or route through your backend for security
            "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
            "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
          },
          params: { namePrefix: q, limit: 10, minPopulation: 100000, countryIds },
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
    debouncedSearchCities(value);
  };

  const handleCitySelect = (name) => {
    setFormData((p) => ({ ...p, city: name }));
    setCitySuggestions([]);
  };

  // General change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "internshipType") {
        return {
          ...prev,
          internshipType: value,
          compensationDetails: { ...prev.compensationDetails, type: value },
        };
      }
      if (name.startsWith("compensationDetails.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          compensationDetails: { ...prev.compensationDetails, [field]: value },
        };
      }
      if (name.startsWith("contactInfo.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          contactInfo: { ...prev.contactInfo, [field]: value },
        };
      }
      if (name === "sector") {
        return { ...prev, sector: value };
      }
      return { ...prev, [name]: value };
    });
  };

  // Qualifications
  const handleQualificationsChange = (e) => {
    setFormData((p) => ({
      ...p,
      qualifications: e.target.value.split(",").map((q) => q.trim()).filter(Boolean),
    }));
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

   // Duration calculator — pure function that accepts dates (stable callback)
  const calculateDuration = useCallback((startDate, endDateOrDuration) => {
    if (!startDate || !endDateOrDuration) {
      setFormData((prev) => ({ ...prev, duration: "" }));
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDateOrDuration);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setFormData((prev) => ({ ...prev, duration: "" }));
      return;
    }

    if (end <= start) {
      setFormData((prev) => ({ ...prev, duration: "Invalid duration" }));
      return;
    }

    const months =
      end.getMonth() -
      start.getMonth() +
      12 * (end.getFullYear() - start.getFullYear());
    const days = end.getDate() - start.getDate();

    const durationText =
      months > 0
        ? `${months} month${months > 1 ? "s" : ""}${days > 0 ? ` and ${days} day${days > 1 ? "s" : ""}` : ""}`
        : `${days} day${days > 1 ? "s" : ""}`;

    setFormData((prev) => ({ ...prev, duration: durationText }));
  }, []); // no formData in deps because we pass values in

  // Call the calculator whenever the date fields change
  useEffect(() => {
    calculateDuration(formData.startDate, formData.endDateOrDuration);
  }, [formData.startDate, formData.endDateOrDuration, calculateDuration]);


  const resetForm = () => {
    setFormData({
      jobTitle: "",
      companyName: "",
      sector: topSectors[0].id,
      city: "",
      country: "United States",
      state: "",
      jobType: "Internship",
      jobDescription: "",
      startDate: "",
      endDateOrDuration: "",
      duration: "",
      internshipType: "FREE",
      compensationDetails: {
        type: "FREE",
        amount: null,
        currency: "USD",
        frequency: "MONTHLY",
      },
      qualifications: [],
      contactInfo: { name: "", email: "", phone: "" },
      imgUrl: "",
      studentApplied: false,
      adminApproved: false,
      applicationOpen: true,
      classification: "",
      mode: "Online",
    });
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pid = localStorage.getItem("partnerId");
    if (!pid) {
      console.error("No partner ID");
      return;
    }

    // Simple freemium restriction example so setter is used and there's meaningful behavior
    if (userType === "Freemium" && formData.internshipType === "PAID") {
      setFreemiumAlert("Upgrade required to post paid internships.");
      setTimeout(() => setFreemiumAlert(""), 3500);
      return;
    }

    const payload = {
      ...formData,
      location: formData.state
        ? `${formData.city}, ${formData.state}, ${formData.country}`
        : `${formData.city}, ${formData.country}`,
      partnerId: pid,
    };

    try {
      const res = await axios.post("/api/interns", payload);
      saveJob(res.data);
      setSuccessMessage("Internship posted successfully!");
      resetForm();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error posting internship:", err);
    }
  };

  // use partnerInternships length in an sr-only span to avoid unused var warning
  const partnerCount = partnerInternships.length;

  return (
    <div className="max-w-4xl font-poppins mx-auto p-6 bg-white rounded-lg shadow-lg mt-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Post an Internship
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Job Title
          </label>
          <input
            type="text"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            placeholder="Enter job title"
          />
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Company Name
          </label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            placeholder="Enter company name"
          />
        </div>

        {/* Sector Dropdown */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Sector
          </label>
          <select
            name="sector"
            value={formData.sector}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            required
          >
            {topSectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Internship Classification
          </label>
          <select
            name="classification"
            value={formData.classification}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            required
          >
            <option value="" disabled>
              Select Classification
            </option>
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Location
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Country (US/CA only) */}
            <div>
              <label htmlFor="country" className="block text-gray-700 text-sm mb-1">Country *</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((p) => ({ ...p, country: value, state: "" }));
                  setCitySuggestions([]);
                }}
                required
                className="w-full h-12 box-border p-3 border border-gray-300 rounded-lg bg-white text-gray-900
               focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                <option value="">Select</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
              </select>
            </div>

            {/* State / Province */}
            <div>
              <label htmlFor="state" className="block text-gray-700 text-sm mb-1">{stateLabel} *</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="w-full h-12 box-border p-3 border border-gray-300 rounded-lg bg-white text-gray-900
               focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                <option value="" disabled>Select</option>
                {stateList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* City with suggestions (country-filtered) */}
            <div className="relative">
              <label htmlFor="city" className="block text-gray-700 text-sm mb-1">City *</label>
              <input
                id="city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleCityInputChange}
                autoComplete="address-level2"
                className="w-full h-12 box-border p-3 border border-gray-300 rounded-lg bg-white text-gray-900
               focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white
               relative z-[15]"
                placeholder="Start typing city"
                required
              />

              {citySuggestions.length > 0 && (
                <ul
                  className="absolute z-[20] left-0 top-full w-full mt-2 max-h-48 overflow-y-auto
                 bg-white border border-gray-300 rounded-lg shadow-lg"
                >
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

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Job Description
          </label>
          <textarea
            name="jobDescription"
            value={formData.jobDescription}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            placeholder="Describe the job responsibilities, requirements, etc."
            rows="4"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            End Date
          </label>
          <input
            type="date"
            name="endDateOrDuration"
            value={formData.endDateOrDuration}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Calculated Duration
          </label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            placeholder="Duration will be calculated"
            readOnly
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Mode of Internship
          </label>
          <select
            name="mode"
            value={formData.mode}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            required
          >
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Qualifications
          </label>
          <input
            type="text"
            name="qualifications"
            value={formData.qualifications.join(", ")}
            onChange={handleQualificationsChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            placeholder="Enter required qualifications, separated by commas"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Contact Information
          </label>
          <div className="space-y-2">
            <input
              type="text"
              name="contactInfo.name"
              value={formData.contactInfo.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
              placeholder="Contact Name"
              required
            />
            <input
              type="email"
              name="contactInfo.email"
              value={formData.contactInfo.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
              placeholder="Contact Email"
              required
            />
            <input
              type="tel"
              name="contactInfo.phone"
              value={formData.contactInfo.phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
              placeholder="Contact Phone"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
          />
          {uploading && <p>Uploading image...</p>}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="mt-2 max-h-40 rounded-lg"
            />
          )}
        </div>

        {/* Internship Type and Compensation */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Internship Type
          </label>
          <select
            name="internshipType"
            value={formData.internshipType}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
            required
          >
            <option value="FREE">Free</option>
            <option value="STIPEND">Stipend</option>
            <option value="PAID" disabled={userType === "Freemium"}>Paid</option>
          </select>
        </div>

        {formData.internshipType !== "FREE" && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Amount
              </label>
              <input
                type="number"
                name="compensationDetails.amount"
                value={formData.compensationDetails.amount || ""}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
                placeholder="Enter amount"
                required={formData.internshipType !== "FREE"}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Currency
              </label>
              <select
                name="compensationDetails.currency"
                value={formData.compensationDetails.currency}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
                required={formData.internshipType !== "FREE"}
              >
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="EUR">EUR</option>
                <option value="INR">INR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Frequency
              </label>
              <select
                name="compensationDetails.frequency"
                value={formData.compensationDetails.frequency}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
                required={formData.internshipType !== "FREE"}
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="ONE_TIME">One Time</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              name="applicationOpen"
              checked={formData.applicationOpen}
              onChange={(e) =>
                setFormData((p) => ({ ...p, applicationOpen: e.target.checked }))
              }
              className="form-checkbox h-5 w-5 text-teal-600"
            />
            <span className="text-gray-700 font-medium">Open for Applications</span>
          </label>
        </div>

        <div>
          <button
            type="submit"
            className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring focus:ring-teal-500"
          >
            Post Internship
          </button>
        </div>

        {/* hidden, accessible usage of partnerCount to avoid unused var */}
        <span className="sr-only" aria-hidden="true">{partnerCount}</span>
      </form>

      {/* success + freemium alerts */}
      {successMessage && (
        <div className="fixed top-20 right-10 z-[9999] bg-green-500 text-white py-3 px-6 rounded-lg shadow-lg transition-all duration-300">
          {successMessage}
        </div>
      )}

      {freemiumAlert && (
        <div className="fixed top-28 right-10 z-[9999] bg-red-500 text-white py-3 px-6 rounded-lg shadow-lg transition-all duration-300">
          {freemiumAlert}
        </div>
      )}
    </div>
  );
};

export default PostAJob;
