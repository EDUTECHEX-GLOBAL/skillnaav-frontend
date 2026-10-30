import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "../../../../../api/axiosInstance";
import ResponsiveSelect from "../../../../../components/ResponsiveSelect";
import {
  FaSchool, FaMapMarkerAlt, FaCity, FaGlobe, FaUserTie,
  FaEnvelope, FaPhone, FaAddressCard, FaFlag, FaEdit,
  FaLanguage, FaClipboardList
} from "react-icons/fa";

const CANADIAN_PROVINCES = [
  { code: "ON", name: "Ontario" },
  { code: "QC", name: "Quebec" },
  { code: "BC", name: "British Columbia" },
  { code: "AB", name: "Alberta" },
  { code: "MB", name: "Manitoba" },
  { code: "SK", name: "Saskatchewan" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "YT", name: "Yukon" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
];

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
  { code: "DC", name: "District of Columbia" },
  { code: "PR", name: "Puerto Rico" },
  { code: "VI", name: "Virgin Islands" },
  { code: "GU", name: "Guam" },
  { code: "MP", name: "Northern Mariana Islands" },
  { code: "AS", name: "American Samoa" },
];

const SchoolAdminProfile = () => {
  const [formData, setFormData] = useState({
    schoolName: "",
    affiliation: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
    website: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    schoolType: "",
    schoolNumber: "",
    languageOfInstruction: "",
    verificationDoc: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("schoolAdminToken");
      const res = await axios.get("/api/school-admin/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        setFormData((prev) => ({
          ...prev,
          ...res.data,
          country: res.data.country || "Canada",
        }));
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const validateField = (name, value, currentData = formData) => {
    let err = "";
    switch (name) {
      case "schoolName":
        if (!value || value.trim().length < 2) err = "School Name is required (min 2 chars).";
        else if (!/^[a-zA-Z0-9\s\-'.&()]+$/.test(value.trim())) err = "School Name contains invalid characters.";
        break;
      case "city":
        if (!value || value.trim().length < 2) err = "City is required (min 2 chars).";
        else if (!/^[a-zA-Z\s.-]{2,50}$/.test(value.trim())) err = "Valid city name required.";
        break;
      case "province":
        if (!value) err = currentData.country === "USA" ? "State is required." : "Province is required.";
        break;
      case "country":
        if (!value || (value !== "Canada" && value !== "USA" && value !== "United States")) {
          err = "Restricted to Canada and USA.";
        }
        break;
      case "postalCode": {
        const targetCountry = currentData.country;
        const trimmed = (value || "").trim();
        if (!trimmed) err = targetCountry === "USA" ? "ZIP Code is required." : "Postal Code is required.";
        else if (targetCountry === "Canada") {
          if (!/^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/.test(trimmed)) err = "Canadian Postal Code format must be A1A 1A1 (e.g. M5V 3A8).";
        } else if (targetCountry === "USA" || targetCountry === "United States") {
          if (!/^\d{5}(-\d{4})?$/.test(trimmed)) err = "US ZIP Code must be 5 digits (e.g. 90210) or ZIP+4.";
        }
        break;
      }
      case "contactPhone": {
        const digits = (value || "").replace(/\D/g, "");
        if (!digits || digits.length !== 10) {
          err = "Valid 10-digit US/Canada phone number required e.g. (123) 456-7890.";
        }
        break;
      }
      case "contactEmail":
        if (!value || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim())) {
          err = "Valid contact email required.";
        }
        break;
      case "address":
        if (!value || value.trim().length < 5) err = "Full address required (min 5 chars).";
        break;
      default:
        break;
    }
    return err;
  };

  const handleCancel = () => {
    fetchProfile();
    setErrors({});
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;
    if (name === "contactPhone") {
      const digits = value.replace(/\D/g, "");
      const limited = digits.length === 11 && digits.startsWith("1") ? digits.slice(1, 11) : digits.slice(0, 10);
      if (limited.length === 0) updatedValue = "";
      else if (limited.length <= 3) updatedValue = `(${limited}`;
      else if (limited.length <= 6) updatedValue = `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
      else updatedValue = `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6, 10)}`;
    }

    const updatedData = { ...formData, [name]: updatedValue };
    if (name === "country") {
      updatedData.province = "";
    }
    setFormData(updatedData);

    const fieldErr = validateField(name, updatedValue, updatedData);
    setErrors((prev) => {
      const next = { ...prev, [name]: fieldErr };
      if (name === "country" || name === "postalCode") {
        next.postalCode = validateField("postalCode", updatedData.postalCode, updatedData);
      }
      return next;
    });
  };

  const validateAll = () => {
    const newErrors = {};
    const fieldsToValidate = [
      "schoolName",
      "city",
      "province",
      "country",
      "postalCode",
      "contactPhone",
      "contactEmail",
      "address",
    ];

    fieldsToValidate.forEach((f) => {
      const err = validateField(f, formData[f], formData);
      if (err) newErrors[f] = err;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditToggle = () => setIsEditing(true);

  const handleUpdate = async () => {
    setSuccessMsg("");
    setErrorMsg("");
    if (!validateAll()) {
      setErrorMsg("Please fix validation errors before saving.");
      return;
    }
    try {
      const token = localStorage.getItem("schoolAdminToken");
      await axios.put("/api/school-admin/update-profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccessMsg("✅ Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      console.error("Update failed", error);
      setErrorMsg(error.response?.data?.message || "Failed to update profile.");
    }
  };

  const stateOptions = formData.country === "USA" ? US_STATES : CANADIAN_PROVINCES;

  return (
    <div className="p-3 sm:p-6 font-poppins min-w-0">
      {successMsg && (
        <div className="max-w-4xl mx-auto mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-medium text-sm flex items-center justify-between shadow-sm">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900 font-bold ml-3 text-base">&times;</button>
        </div>
      )}
      {errorMsg && (
        <div className="max-w-4xl mx-auto mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium text-sm flex items-center justify-between shadow-sm">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-rose-700 hover:text-rose-900 font-bold ml-3 text-base">&times;</button>
        </div>
      )}
      <motion.div
        className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden min-w-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-400 to-blue-600 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-white text-xl sm:text-2xl font-semibold leading-tight">{formData.schoolName || "School Profile"}</h2>
              <p className="text-white text-xs sm:text-sm opacity-90">School Admin ({formData.country === "USA" ? "United States" : "Canada"})</p>
            </div>
          </div>
          {!isEditing ? (
            <motion.button
              onClick={handleEditToggle}
              className="bg-white text-blue-600 font-medium px-4 py-2 rounded-md shadow hover:bg-gray-100 flex items-center text-sm"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
            >
              <FaEdit className="mr-2" /> Edit Profile
            </motion.button>
          ) : (
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={handleCancel}
                className="bg-white text-red-500 font-medium px-4 py-2 rounded-md shadow hover:bg-gray-100 text-sm"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleUpdate}
                className="bg-white text-green-600 font-medium px-4 py-2 rounded-md shadow hover:bg-gray-100 text-sm"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
              >
                Update
              </motion.button>
            </div>
          )}
        </div>

        {/* Info */}
        <motion.div className="p-4 sm:p-6 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <InfoSection title="Personal Information">
            <IconInput icon={<FaSchool />} label="School Name" name="schoolName" value={formData.schoolName} editable={isEditing} onChange={handleChange} error={errors.schoolName} required />
            <IconInput icon={<FaFlag />} label="Affiliation" name="affiliation" value={formData.affiliation} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaClipboardList />} label="School Type" name="schoolType" value={formData.schoolType} editable={isEditing} onChange={handleChange} options={["Public", "Catholic", "Private", "Charter"]} />
            <IconInput icon={<FaClipboardList />} label="School Number" name="schoolNumber" value={formData.schoolNumber} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaLanguage />} label="Language of Instruction" name="languageOfInstruction" value={formData.languageOfInstruction} editable={isEditing} onChange={handleChange} options={["English", "French", "Bilingual"]} />
            <IconInput icon={<FaGlobe />} label="Website" name="website" value={formData.website} editable={isEditing} onChange={handleChange} placeholder="https://www.example.com" />
          </InfoSection>

          <InfoSection title="Location Details">
            <IconInput
              icon={<FaGlobe />}
              label="Country"
              name="country"
              value={formData.country}
              editable={isEditing}
              onChange={handleChange}
              error={errors.country}
              options={["Canada", "USA"]}
              required
            />
            <IconInput
              icon={<FaMapMarkerAlt />}
              label={formData.country === "USA" ? "State" : "Province"}
              name="province"
              value={formData.province}
              editable={isEditing}
              onChange={handleChange}
              error={errors.province}
              options={stateOptions.map((s) => s.name)}
              required
            />
            <IconInput
              icon={<FaCity />}
              label="City"
              name="city"
              value={formData.city}
              editable={isEditing}
              onChange={handleChange}
              error={errors.city}
              required
            />
            <IconInput
              icon={<FaAddressCard />}
              label={formData.country === "USA" ? "ZIP Code" : "Postal Code"}
              name="postalCode"
              value={formData.postalCode}
              editable={isEditing}
              onChange={handleChange}
              error={errors.postalCode}
              placeholder={formData.country === "USA" ? "e.g., 90210" : "e.g., M5V 3A8"}
              required
            />
          </InfoSection>

          <InfoSection title="Contact Information">
            <IconInput icon={<FaUserTie />} label="Contact Person" name="contactPerson" value={formData.contactPerson} editable={isEditing} onChange={handleChange} error={errors.contactPerson} required />
            <IconInput icon={<FaEnvelope />} label="Contact Email" name="contactEmail" value={formData.contactEmail} editable={isEditing} onChange={handleChange} error={errors.contactEmail} required />
            <IconInput icon={<FaPhone />} label="Contact Phone" name="contactPhone" value={formData.contactPhone} editable={isEditing} onChange={handleChange} error={errors.contactPhone} placeholder="(123) 456-7890" required />
          </InfoSection>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Address {isEditing && <span className="text-red-500">*</span>}</h3>
            {isEditing ? (
              <div>
                <textarea
                  name="address"
                  rows="2"
                  value={formData.address || ""}
                  onChange={handleChange}
                  className={`w-full p-2 border ${errors.address ? "border-red-500 ring-1 ring-red-300" : "border-gray-300"} rounded-md text-sm outline-none bg-white`}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
            ) : (
              <p className="bg-gray-50 p-2 border border-gray-300 rounded-md text-sm text-gray-800 leading-relaxed">{formData.address || "—"}</p>
            )}
          </div>

          {/* Verification Document (read-only display) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Verification Document</h3>
            {formData.verificationDoc ? (
              <a
                href={formData.verificationDoc}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline text-sm hover:text-blue-800"
              >
                View Uploaded Document
              </a>
            ) : (
              <p className="text-sm text-gray-500">No document uploaded.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const InfoSection = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-700 mb-3">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

const IconInput = ({ icon, label, name, value, editable, onChange, error, placeholder, type = "text", required, options }) => (
  <div className="w-full min-w-0">
    <div className="flex items-center space-x-2 w-full min-w-0">
      <span className="text-gray-600 shrink-0">{icon}</span>
      {editable ? (
        options && options.length > 0 ? (
          <ResponsiveSelect
            name={name}
            value={value || ""}
            onChange={onChange}
            options={options}
            placeholder={`Select ${label}`}
            error={Boolean(error)}
            className="flex-1 min-w-0"
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value || ""}
            onChange={onChange}
            placeholder={placeholder || label}
            maxLength={name === "contactPhone" ? 14 : undefined}
            className={`flex-1 min-w-0 w-full p-2 border ${error ? "border-red-500 ring-1 ring-red-300" : "border-gray-300"} rounded-md text-sm outline-none bg-white truncate`}
          />
        )
      ) : (
        <div className="flex-1 min-w-0 w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-800 truncate">
          {value || "—"}
        </div>
      )}
    </div>
    {editable && error && <p className="text-red-500 text-xs mt-1 ml-6">{error}</p>}
  </div>
);

export default SchoolAdminProfile;
