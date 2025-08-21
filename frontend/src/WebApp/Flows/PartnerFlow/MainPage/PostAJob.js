import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

import { useTabContext } from "./UserHomePageContext/HomePageContext";

const COUNTRY_API_URL = "https://restcountries.com/v3.1/all";
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
    sector: topSectors[0].id,      // ← new sector field
    city: "",
    country: "",
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
    mode: "Online",
    qualifications: [],
    contactInfo: { name: "", email: "", phone: "" },
    imgUrl: "",
    studentApplied: false,
    adminApproved: false,
    applicationOpen: true,
  });

  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [userType, setUserType] = useState("");
  const [partnerInternships, setPartnerInternships] = useState([]);
  const [freemiumAlert, setFreemiumAlert] = useState("");

  // Load user plan and existing posts
  useEffect(() => {
    const ui = JSON.parse(localStorage.getItem("userInfo"));
    if (ui) setUserType(ui.planType);

    const pid = localStorage.getItem("partnerId");
    if (pid) {
      axios
        .get(`/api/interns/partner/${pid}`)
        .then((res) => setPartnerInternships(res.data || []))
        .catch(console.error);
    }
  }, []);

  // Fetch countries
  useEffect(() => {
    axios
      .get(COUNTRY_API_URL)
      .then((res) => setCountries(res.data))
      .catch(console.error);
  }, []);

  // Country autocomplete
  const debouncedSearchCountries = useCallback(
    (q) => {
      if (!q) return setCountrySuggestions([]);
      setCountrySuggestions(
        countries.filter((c) =>
          c.name.common.toLowerCase().includes(q.toLowerCase()),
        ),
      );
    },
    [countries],
  );
  const handleCountryInputChange = (e) => {
    const { value } = e.target;
    setFormData((p) => ({ ...p, country: value }));
    debouncedSearchCountries(value);
    setCitySuggestions([]);
  };

  // City autocomplete
  const debouncedSearchCities = useCallback(
    async (q) => {
      if (!q) return setCitySuggestions([]);
      try {
        const resp = await axios.get(CITY_API_URL, {
          headers: {
            "X-RapidAPI-Key": "...",
            "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
          },
          params: { namePrefix: q, limit: 10, minPopulation: 100000 },
        });
        setCitySuggestions(resp.data.data);
      } catch (err) {
        console.error(err);
      }
    },
    [],
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
    setFormData((p) => {
      if (name === "internshipType") {
        return {
          ...p,
          internshipType: value,
          compensationDetails: { ...p.compensationDetails, type: value },
        };
      }
      if (name.startsWith("compensationDetails.")) {
        const field = name.split(".")[1];
        return {
          ...p,
          compensationDetails: { ...p.compensationDetails, [field]: value },
        };
      }
      if (name.startsWith("contactInfo.")) {
        const field = name.split(".")[1];
        return {
          ...p,
          contactInfo: { ...p.contactInfo, [field]: value },
        };
      }
      // New: sector dropdown
      if (name === "sector") {
        return { ...p, sector: value };
      }
      return { ...p, [name]: value };
    });
  };

  // Qualifications
  const handleQualificationsChange = (e) => {
    setFormData((p) => ({
      ...p,
      qualifications: e.target.value.split(",").map((q) => q.trim()),
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
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

      if (res.data.success) {
        setFormData(prev => ({ ...prev, imgUrl: res.data.imageUrl }));
      } else {
        console.error("Upload failed:", res.data.message);
      }
    } catch (err) {
      console.error("S3 upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const calculateDuration = useCallback(() => {
    const { startDate, endDateOrDuration } = formData;

    if (!startDate || !endDateOrDuration) {
      setFormData((prev) => ({ ...prev, duration: "" }));
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDateOrDuration);

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
        ? `${months} month${months > 1 ? "s" : ""}${days > 0 ? ` and ${days} day${days > 1 ? "s" : ""}` : ""
        }`
        : `${days} day${days > 1 ? "s" : ""}`;

    setFormData((prev) => ({ ...prev, duration: durationText }));
  }, [formData.startDate, formData.endDateOrDuration]);

  useEffect(() => {
    calculateDuration();
  }, [formData.startDate, formData.endDateOrDuration, calculateDuration]);

  const resetForm = () => {
    setFormData({
      jobTitle: "",
      companyName: "",
      city: "",
      country: "",
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
      contactInfo: {
        name: "",
        email: "",
        phone: "",
      },
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
    if (!pid) return console.error("No partner ID");

    // Freemium restrictions (unchanged)…

    const payload = {
      ...formData,
      location: `${formData.city}, ${formData.country}`,
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
            Location
          </label>
          <div className="flex space-x-4">
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleCountryInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
              placeholder="Start typing country name"
              list="country-suggestions"
              required
            />
            <datalist id="country-suggestions">
              {countrySuggestions.map((country) => (
                <option key={country.cca3} value={country.name.common}>
                  {country.name.common}
                </option>
              ))}
            </datalist>

            <div className="relative">
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleCityInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-teal-500"
                placeholder="Start typing city"
                required
              />

              {citySuggestions.length > 0 && (
                <ul className="absolute z-10 w-full max-h-48 mt-2 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                  {citySuggestions.map((city) => (
                    <li
                      key={city.id}
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
          ></textarea>
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
      </form>
    </div>
  );
};

export default PostAJob;
