import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../../../api/axiosInstance";
import ResponsiveSelect from "../../../../components/ResponsiveSelect";

const CustomSelect = (props) => <ResponsiveSelect {...props} />;

export const formatUsCaPhone = (input = "") => {
  if (!input) return "";
  let digits = String(input).replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

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

const SchoolAdminProfileForm = () => {
  const location = useLocation();
  const initialRegisterData = location.state || {};
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    schoolName: initialRegisterData.schoolName || "",
    schoolType: "",
    schoolNumber: "",
    address: "",
    affiliation: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
    website: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    languageOfInstruction: "",
    verificationDoc: null,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value, currentFormData = formData) => {
    let error = "";

    switch (name) {
      case "schoolName":
        if (!value || value.trim().length < 2) {
          error = "School Name is required (minimum 2 characters).";
        } else if (!/^[a-zA-Z0-9\s\-'.&()]+$/.test(value.trim())) {
          error = "School Name contains invalid characters.";
        }
        break;

      case "schoolType":
        if (!value) {
          error = "Please select a School Type.";
        }
        break;

      case "country":
        if (!value || (value !== "Canada" && value !== "USA" && value !== "United States")) {
          error = "Country selection is required (Canada or USA).";
        }
        break;

      case "province":
        if (!value) {
          error = currentFormData.country === "USA" ? "Please select a State." : "Please select a Province.";
        }
        break;

      case "city":
        if (!value || value.trim().length < 2) {
          error = "City name is required (minimum 2 characters).";
        } else if (!/^[a-zA-Z\s.-]{2,50}$/.test(value.trim())) {
          error = "City contains invalid characters.";
        }
        break;

      case "postalCode": {
        const trimmed = (value || "").trim();
        const selectedCountry = currentFormData.country;
        if (!trimmed) {
          error = selectedCountry === "USA" ? "ZIP code is required." : "Postal code is required.";
        } else if (selectedCountry === "Canada") {
          const caPostalRegex = /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/;
          if (!caPostalRegex.test(trimmed)) {
            error = "Invalid Canadian Postal Code (e.g. M5V 3A8).";
          }
        } else if (selectedCountry === "USA" || selectedCountry === "United States") {
          const usZipRegex = /^\d{5}(-\d{4})?$/;
          if (!usZipRegex.test(trimmed)) {
            error = "Invalid US ZIP code (e.g. 90210 or 90210-1234).";
          }
        }
        break;
      }

      case "contactPerson":
        if (!value || value.trim().length < 2) {
          error = "Contact person name is required.";
        }
        break;

      case "contactEmail":
        if (!value || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim())) {
          error = "Please enter a valid email address.";
        }
        break;

      case "contactPhone": {
        const digits = (value || "").replace(/\D/g, "");
        if (!digits || digits.length !== 10) {
          error = "Please enter a valid 10-digit US/Canada phone number.";
        }
        break;
      }

      case "address":
        if (!value || value.trim().length < 5) {
          error = "Full address is required (minimum 5 characters).";
        }
        break;

      case "languageOfInstruction":
        if (!value) {
          error = "Please select Language of Instruction.";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "verificationDoc") {
      setFormData({ ...formData, [name]: files[0] });
      return;
    }

    let updatedValue = value;
    if (name === "contactPhone") {
      updatedValue = formatUsCaPhone(value);
    }

    const updatedFormData = { ...formData, [name]: updatedValue };

    if (name === "country") {
      updatedFormData.province = "";
    }

    setTouched((prev) => ({ ...prev, [name]: true }));

    const fieldError = validateField(name, updatedValue, updatedFormData);
    setErrors((prev) => {
      const nextErrors = { ...prev, [name]: fieldError };
      if (name === "country" || name === "postalCode") {
        nextErrors.postalCode = validateField("postalCode", updatedFormData.postalCode, updatedFormData);
      }
      return nextErrors;
    });
  };

  const validateAll = () => {
    const fieldsToValidate = [
      "schoolName",
      "schoolType",
      "country",
      "province",
      "city",
      "postalCode",
      "address",
      "languageOfInstruction",
      "contactPerson",
      "contactEmail",
      "contactPhone",
    ];

    const newErrors = {};
    const newTouched = {};

    fieldsToValidate.forEach((field) => {
      newTouched[field] = true;
      const err = validateField(field, formData[field], formData);
      if (err) newErrors[field] = err;
    });

    setTouched(newTouched);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      alert("Please fix the validation errors before submitting.");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    try {
      const response = await axios.post("/api/school-admin/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Profile completed successfully!");
      const { token, user } = response.data;
      if (token) localStorage.setItem("schoolAdminToken", token);
      if (user) localStorage.setItem("schoolAdminUser", JSON.stringify(user));
      navigate("/school-admin/dashboard");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to submit profile.";
      console.error("Error submitting profile:", error);
      alert(message);
    }
  };

  const inputStyle = (fieldName) =>
    `w-full p-3 border rounded-md text-sm outline-none transition ${
      errors[fieldName]
        ? "border-red-500 ring-1 ring-red-300"
        : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
    }`;

  const stateOptions = formData.country === "USA" ? US_STATES : CANADIAN_PROVINCES;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-3 sm:p-6 font-poppins">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-xl w-full max-w-4xl p-4 sm:p-8"
      >
        <h2 className="text-xl sm:text-3xl font-bold text-blue-700 mb-6 text-center">
          School Profile Details ({formData.country === "USA" ? "United States" : "Canada"})
        </h2>

        {/* Institution Details */}
        <div className="w-full min-w-0 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
            Institution Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="schoolName"
                placeholder="School Name"
                value={formData.schoolName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputStyle("schoolName")}
                required
              />
              {errors.schoolName && <p className="text-red-500 text-xs mt-1">{errors.schoolName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Type <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                name="schoolType"
                value={formData.schoolType}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputStyle("schoolType")}
                required
              >
                <option value="">Select School Type</option>
                <option value="Public">Public</option>
                <option value="Catholic">Catholic</option>
                <option value="Private">Private</option>
                <option value="Charter">Charter</option>
              </CustomSelect>
              {errors.schoolType && <p className="text-red-500 text-xs mt-1">{errors.schoolType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Number</label>
              <input
                type="text"
                name="schoolNumber"
                placeholder="School Number (if applicable)"
                value={formData.schoolNumber}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation</label>
              <input
                type="text"
                name="affiliation"
                placeholder="Affiliation (e.g., TDSB)"
                value={formData.affiliation}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="w-full min-w-0 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
            Location Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                name="country"
                value={formData.country}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputStyle("country")}
                required
              >
                <option value="Canada">Canada</option>
                <option value="USA">USA</option>
              </CustomSelect>
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.country === "USA" ? "State" : "Province"} <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                name="province"
                value={formData.province}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputStyle("province")}
                required
              >
                <option value="">
                  {formData.country === "USA" ? "Select State" : "Select Province"}
                </option>
                {stateOptions.map((item) => (
                  <option key={item.code} value={item.name}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </CustomSelect>
              {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                placeholder="City (e.g. Toronto)"
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputStyle("city")}
                required
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.country === "USA" ? "ZIP Code" : "Postal Code"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="postalCode"
                placeholder={formData.country === "USA" ? "ZIP Code (e.g., 90210)" : "Postal Code (e.g., M5V 2T6)"}
                value={formData.postalCode}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputStyle("postalCode")}
                required
              />
              {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
              <input
                type="url"
                name="website"
                placeholder="https://www.example.com"
                value={formData.website}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Full Address */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Full Address <span className="text-red-500">*</span>
          </h3>
          <textarea
            name="address"
            placeholder="Street, Area, Landmark"
            value={formData.address}
            onChange={handleChange}
            onBlur={handleBlur}
            className={inputStyle("address")}
            rows={3}
            required
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        {/* Language of Instruction */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Language of Instruction <span className="text-red-500">*</span>
          </h3>
          <div className="w-full sm:w-1/2">
            <CustomSelect
              name="languageOfInstruction"
              value={formData.languageOfInstruction}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputStyle("languageOfInstruction")}
              required
            >
              <option value="">Select Language</option>
              <option value="English">English</option>
              <option value="French">French</option>
              <option value="Bilingual">Bilingual (English/French)</option>
            </CustomSelect>
            {errors.languageOfInstruction && (
              <p className="text-red-500 text-xs mt-1">{errors.languageOfInstruction}</p>
            )}
          </div>
        </div>

        {/* Contact Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
            Contact Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contactPerson"
                placeholder="Contact Person Name"
                value={formData.contactPerson}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputStyle("contactPerson")}
                required
              />
              {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="contactEmail"
                placeholder="Contact Email"
                value={formData.contactEmail}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputStyle("contactEmail")}
                required
              />
              {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="contactPhone"
                placeholder="(123) 456-7890"
                value={formData.contactPhone}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={14}
                inputMode="numeric"
                className={inputStyle("contactPhone")}
                required
              />
              {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
            </div>
          </div>
        </div>

        {/* Upload Verification Doc */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Upload Verification Document (optional)
          </h3>
          <input
            type="file"
            name="verificationDoc"
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-md w-full text-sm"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-md font-semibold transition shadow-md hover:shadow-lg"
        >
          Submit Profile
        </button>
      </form>
    </div>
  );
};

export default SchoolAdminProfileForm;
