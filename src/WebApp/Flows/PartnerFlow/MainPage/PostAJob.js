//File: PostAJob.js

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "../../../../api/axiosInstance";
import defaultCompanyLogo from "../../../../assets/default-company-logo.png";
import PhoneInputWithCountry from "./PhoneInputWithCountry";

import { useTabContext } from "./UserHomePageContext/HomePageContext";

const SuccessModal = ({ onOk }) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center"
    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl flex flex-col items-center px-10 py-10 max-w-sm w-full mx-4"
      style={{
        animation: "successModalIn 0.35s cubic-bezier(.34,1.56,.64,1) both",
      }}
    >
      {/* Animated circle + tick */}
      <div className="relative flex items-center justify-center mb-6">
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="#10b981"
            strokeWidth="4"
            fill="#ecfdf5"
            style={{ animation: "circleIn 0.45s ease both" }}
          />
          <polyline
            points="28,50 42,64 68,34"
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{
              strokeDasharray: 60,
              strokeDashoffset: 0,
              animation: "tickDraw 0.45s 0.3s ease both",
            }}
          />
        </svg>
      </div>
      <h2
        className="text-xl font-bold text-gray-800 mb-1 text-center"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Internship Posted!
      </h2>
      <p
        className="text-sm text-gray-500 mb-7 text-center"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Your internship has been submitted successfully and is pending admin
        approval.
      </p>
      <button
        onClick={onOk}
        className="w-full py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 active:scale-95 transition-all"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        OK — View My Posts
      </button>
    </div>
    <style>{`
      @keyframes successModalIn {
        from { opacity: 0; transform: scale(0.8) translateY(30px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes tickDraw {
        from { stroke-dashoffset: 60; opacity: 0; }
        to   { stroke-dashoffset: 0;  opacity: 1; }
      }
      @keyframes circleIn {
        from { opacity: 0; transform: scale(0.6); transform-origin: center; }
        to   { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </div>
);

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const CA_PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
];

// ─── Custom Select Component ──────────────────────────────────────────────────
const CustomSelect = ({
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  disabled = false,
  required = false,
  className = "",
  style = {},
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open]);

  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef} style={style}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`!mt-0 !m-0 w-full !h-12 !px-4 !py-2.5 text-sm !border !border-gray-300 !rounded-lg !bg-white text-gray-900 flex items-center justify-between text-left transition-all box-border ${className} ${
          disabled
            ? "!bg-gray-100 !text-gray-400 cursor-not-allowed"
            : "cursor-pointer hover:!border-gray-400"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
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
          className={`h-4 w-4 text-gray-400 ml-2 flex-shrink-0 transition-transform duration-200 ${
            open ? "transform rotate-180 text-teal-600" : ""
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

      {/* Hidden input for form submission / required validation */}
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
        <ul className="absolute z-[9999] left-0 right-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-y-auto py-1 text-sm divide-y divide-gray-50 dropdown-scrollbar">
          {placeholder && (
            <li
              onClick={() => handleSelect("")}
              className="px-3.5 py-2.5 hover:bg-teal-50 hover:text-teal-700 cursor-pointer text-gray-400 select-none text-sm"
            >
              {placeholder}
            </li>
          )}
          {normalizedOptions.map((opt) => (
            <li
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`px-3.5 py-2.5 hover:bg-teal-50 hover:text-teal-700 cursor-pointer select-none transition-colors text-sm flex items-center justify-between ${
                opt.value === value
                  ? "bg-teal-50 text-teal-800 font-semibold"
                  : "text-gray-700"
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && (
                <svg
                  className="w-4 h-4 text-teal-600 shrink-0 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Custom Date Picker Component (Matches Top Box Width Exactly) ─────────────
const CustomDatePicker = ({
  name,
  value = "",
  onChange,
  min = "",
  max = "",
  placeholder = "dd-mm-yyyy",
  required = false,
  disabled = false,
  className = "",
  style = {},
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const parsedDate = useMemo(() => {
    if (!value) return null;
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }, [value]);

  const [viewDate, setViewDate] = useState(() => {
    if (parsedDate)
      return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
    if (min) {
      const [y, m] = min.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  useEffect(() => {
    if (parsedDate) {
      setViewDate(
        new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1)
      );
    }
  }, [parsedDate]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const days = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      monthOffset: -1,
      dateStr: "",
      disabled: true,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    let isDisabled = false;
    if (min && dateStr < min) isDisabled = true;
    if (max && dateStr > max) isDisabled = true;

    days.push({
      day: d,
      monthOffset: 0,
      dateStr,
      disabled: isDisabled,
    });
  }

  const remainingCells = 42 - days.length;
  for (let d = 1; d <= remainingCells && days.length < 35; d++) {
    days.push({
      day: d,
      monthOffset: 1,
      dateStr: "",
      disabled: true,
    });
  }

  const handleSelectDay = (dateStr) => {
    if (!dateStr) return;
    onChange?.({ target: { name, value: dateStr } });
    setOpen(false);
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (min && todayStr < min) return;
    if (max && todayStr > max) return;
    onChange?.({ target: { name, value: todayStr } });
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.({ target: { name, value: "" } });
    setOpen(false);
  };

  const displayLabel = useMemo(() => {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return value;
    return `${d}-${m}-${y}`;
  }, [value]);

  return (
    <div className="relative w-full min-w-0" ref={containerRef} style={style}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`!mt-0 !m-0 w-full !h-12 !px-4 !py-2.5 text-sm !border rounded-lg bg-white flex items-center justify-between text-left transition-all box-border min-w-0 ${
          disabled
            ? "!bg-gray-100 !text-gray-400 cursor-not-allowed border-gray-300"
            : open
              ? "!border-teal-500 ring-2 ring-teal-500/20 text-gray-900 cursor-pointer"
              : "!border-gray-300 hover:!border-gray-400 text-gray-900 cursor-pointer"
        } ${className}`}
      >
        <span
          className={`truncate ${
            !displayLabel
              ? "text-gray-400 font-normal"
              : "text-gray-800 font-medium"
          }`}
        >
          {displayLabel || placeholder}
        </span>
        <svg
          className={`h-4 w-4 ml-2 flex-shrink-0 transition-colors ${
            open ? "text-teal-600" : "text-gray-400"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Hidden input for form submission / required checking */}
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
        <div className="absolute z-[9999] top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3.5 w-[280px] max-w-[calc(100vw-32px)] box-border text-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
            <span className="font-bold text-gray-800 text-sm">
              {monthNames[currentMonth]}, {currentYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-xs font-bold"
                aria-label="Previous Month"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-xs font-bold"
                aria-label="Next Month"
              >
                ▼
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="text-[11px] font-bold text-gray-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map((item, idx) => {
              if (item.monthOffset !== 0) {
                return (
                  <div
                    key={idx}
                    className="text-xs text-gray-300 py-1.5 select-none"
                  >
                    {item.day}
                  </div>
                );
              }

              const isSelected = item.dateStr === value;
              const isToday =
                item.dateStr === new Date().toISOString().split("T")[0];

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => handleSelectDay(item.dateStr)}
                  className={`py-1.5 text-xs rounded-lg font-medium transition-all select-none ${
                    item.disabled
                      ? "text-gray-300 cursor-not-allowed bg-transparent"
                      : isSelected
                        ? "bg-teal-600 text-white font-bold shadow-sm"
                        : isToday
                          ? "border border-teal-500 text-teal-700 font-bold hover:bg-teal-50"
                          : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 text-xs font-semibold">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-teal-600 hover:text-teal-700 px-2 py-1 rounded hover:bg-teal-50 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PostAJob = () => {
  const { saveJob, handleSelectTab } = useTabContext();

  const topSectors = [
    { id: "advanced-ai", name: "Advanced AI & Autonomous Systems" },
    { id: "quantum-computing", name: "Quantum Computing & Next-Gen Computing" },
    { id: "climate-tech", name: "Climate Tech & Carbon Capture" },
    { id: "biotech", name: "Biotechnology & Synthetic Biology" },
    { id: "materials-science", name: "Advanced Materials Science" },
    { id: "space-exploration", name: "Space Exploration & Commercial Space" },
    {
      id: "neurotechnology",
      name: "Neurotechnology & Brain-Computer Interfaces",
    },
    { id: "precision-agriculture", name: "Precision Agriculture & AgriTech" },
    {
      id: "advanced-robotics",
      name: "Advanced Robotics & Human-Machine Collaboration",
    },
    { id: "renewable-energy", name: "Renewable Energy & Grid Innovation" },
    {
      id: "architecture-built-environment",
      name: "Architecture & Built Environment",
    },
  ];

  const validateCompanyName = (name) => {
    if (!name || !name.trim()) return ""; // empty allowed
    const trimmed = name.trim();
    if (trimmed.length < 2) return "Company Name must be at least 2 characters.";
    if (trimmed.length > 60) return "Company Name cannot exceed 60 characters.";
    if (!/^[a-zA-Z0-9\s&.',-]+$/.test(trimmed))
      return "Company Name can only contain letters, numbers, spaces, and & . , - '";
    if (/[&.',-]{2,}/.test(trimmed))
      return "Company Name cannot have consecutive special characters.";
    if ((trimmed.match(/[a-zA-Z]/g) || []).length < 2)
      return "Company Name must contain at least 2 letters.";
    return "";
  };

  const validateJobTitle = (title) => {
    if (!title || !title.trim()) return ""; // empty allowed
    const trimmed = title.trim();
    if (trimmed.length < 2) return "Job Title must be at least 2 characters.";
    if (trimmed.length > 60) return "Job Title cannot exceed 60 characters.";
    if (!/^[a-zA-Z0-9\s&.',-]+$/.test(trimmed))
      return "Job Title can only contain letters, numbers, spaces, and & . , - '";
    if (/[&.',-]{2,}/.test(trimmed))
      return "Job Title cannot have consecutive special characters.";
    if ((trimmed.match(/[a-zA-Z]/g) || []).length < 2)
      return "Job Title must contain at least 2 letters.";
    return "";
  };

  const validateCity = (city) => {
    if (!city || !city.trim()) {
      return "City is required.";
    }
    const trimmed = city.trim();
    if (trimmed.length < 2) {
      return "City must be at least 2 characters.";
    }
    if (trimmed.length > 50) {
      return "City cannot exceed 50 characters.";
    }
    const validLettersRegex = /^[a-zA-Z\s.'-]+$/;
    if (!validLettersRegex.test(trimmed)) {
      return "City can only contain letters, spaces, periods, and hyphens.";
    }
    if (/[.'-]{2,}/.test(trimmed)) {
      return "City cannot contain consecutive special characters.";
    }
    const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < 2) {
      return "City must contain at least 2 letters.";
    }
    return "";
  };

  const validateContactName = (name) => {
    if (!name || !name.trim()) {
      return "Contact Name is required.";
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      return "Contact Name must be at least 2 characters.";
    }
    if (trimmed.length > 50) {
      return "Contact Name cannot exceed 50 characters.";
    }
    const validNameRegex = /^[a-zA-Z\s.'-]+$/;
    if (!validNameRegex.test(trimmed)) {
      return "Contact Name can only contain alphabetic letters and spaces.";
    }
    if (/[.'-]{2,}/.test(trimmed)) {
      return "Contact Name cannot contain consecutive special characters.";
    }
    const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < 2) {
      return "Contact Name must contain at least 2 letters.";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (!email || !email.trim()) {
      return "Contact Email is required.";
    }
    const trimmed = email.trim();
    if (trimmed.length > 80) {
      return "Contact Email cannot exceed 80 characters.";
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address with a valid domain (e.g. name@example.com).";
    }
    return "";
  };

  const formatPhoneNumber = (value) => {
    const digits = (value || "").replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const validatePhone = (phone) => {
    if (!phone || !phone.trim()) {
      return "Contact Phone is required.";
    }
    const trimmed = phone.trim();
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (!digitsOnly) {
      return "Contact Phone can only contain numbers.";
    }
    if (digitsOnly.length < 9 || digitsOnly.length > 15) {
      return "Contact Phone must be a valid phone number (e.g. 10 digits for US/CA/IN).";
    }
    return "";
  };

  const [formData, setFormData] = useState({
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
    compensationDetails: {
      type: "",
      amount: null,
      currency: "",
      frequency: "",
    },
    mode: "",
    qualifications: [],
    contactInfo: { name: "", email: "", phone: "" },
    imgUrl: "",
    studentApplied: false,
    adminApproved: false,
    applicationOpen: true,
  });

  const [fieldErrors, setFieldErrors] = useState({
    jobTitle: "",
    companyName: "",
    city: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [touched, setTouched] = useState({
    jobTitle: false,
    companyName: false,
    city: false,
    contactName: false,
    contactEmail: false,
    contactPhone: false,
  });

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userType, setUserType] = useState("");
  const [freemiumAlert, setFreemiumAlert] = useState("");
  const cityDebounceRef = useRef(null);

  const stateList = formData.country === "Canada" ? CA_PROVINCES : US_STATES;
  const stateLabel =
    formData.country === "Canada" ? "Province / Territory" : "State";
  const [qualInput, setQualInput] = useState("");
  const [qualError, setQualError] = useState("");

  const validateQualification = (val) => {
    if (!val || !val.trim()) {
      return "Please enter a skill or qualification.";
    }
    const trimmed = val.trim();
    if (trimmed.length < 2) {
      return "Qualification must be at least 2 characters.";
    }
    if (trimmed.length > 50) {
      return "Qualification cannot exceed 50 characters.";
    }
    // Only letters and spaces allowed
    const validLettersRegex = /^[a-zA-Z\s]+$/;
    if (!validLettersRegex.test(trimmed)) {
      return "Qualifications can only contain alphabetic letters and spaces (no numbers or symbols).";
    }
    // Check duplicate (case-insensitive)
    const isDuplicate = formData.qualifications.some(
      (q) => q.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isDuplicate) {
      return `"${trimmed}" is already added.`;
    }
    return "";
  };

  useEffect(() => {
    try {
      const ui =
        JSON.parse(localStorage.getItem("partnerInfo")) ||
        JSON.parse(localStorage.getItem("userInfo"));
      if (ui) setUserType(ui.planType);
    } catch (err) {
      console.error("PostAJob: failed reading localStorage", err);
    }
  }, []);

  const searchCities = useCallback(
    async (q) => {
      if (!q || q.trim().length < 2) {
        setCitySuggestions([]);
        return;
      }
      try {
        const countryIds =
          formData.country === "Canada"
            ? "CA"
            : formData.country === "United States"
              ? "US"
              : "US,CA";

        const resp = await axios.get("/api/cities", {
          params: {
            namePrefix: q.trim(),
            limit: 10,
            minPopulation: 100000,
            countryIds,
          },
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
    const clean = e.target.value.replace(/[^a-zA-Z\s.'-]/g, "");
    setFormData((p) => ({ ...p, city: clean }));
    setTouched((prev) => ({ ...prev, city: true }));
    setFieldErrors((prev) => ({
      ...prev,
      city: validateCity(clean),
    }));
    clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(() => searchCities(clean), 300);
  };

  const handleCitySelect = (name) => {
    setFormData((p) => ({ ...p, city: name }));
    setTouched((prev) => ({ ...prev, city: true }));
    setFieldErrors((prev) => ({
      ...prev,
      city: validateCity(name),
    }));
    setCitySuggestions([]);
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "companyName") {
      setFieldErrors((prev) => ({
        ...prev,
        companyName: validateCompanyName(formData.companyName),
      }));
    }
    if (field === "jobTitle") {
      setFieldErrors((prev) => ({
        ...prev,
        jobTitle: validateJobTitle(formData.jobTitle),
      }));
    }
    if (field === "city") {
      setFieldErrors((prev) => ({
        ...prev,
        city: validateCity(formData.city),
      }));
    }
    if (field === "contactName") {
      setFieldErrors((prev) => ({
        ...prev,
        contactName: validateContactName(formData.contactInfo.name),
      }));
    }
    if (field === "contactEmail") {
      setFieldErrors((prev) => ({
        ...prev,
        contactEmail: validateEmail(formData.contactInfo.email),
      }));
    }
    if (field === "contactPhone") {
      setFieldErrors((prev) => ({
        ...prev,
        contactPhone: validatePhone(formData.contactInfo.phone),
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "companyName") {
      setFieldErrors((prev) => ({
        ...prev,
        companyName: validateCompanyName(value),
      }));
      setTouched((prev) => ({ ...prev, companyName: true }));
    }
    if (name === "jobTitle") {
      setFieldErrors((prev) => ({
        ...prev,
        jobTitle: validateJobTitle(value),
      }));
      setTouched((prev) => ({ ...prev, jobTitle: true }));
    }
    if (name === "contactInfo.name") {
      setFieldErrors((prev) => ({
        ...prev,
        contactName: validateContactName(value),
      }));
      setTouched((prev) => ({ ...prev, contactName: true }));
    }
    if (name === "contactInfo.email") {
      setFieldErrors((prev) => ({
        ...prev,
        contactEmail: validateEmail(value),
      }));
      setTouched((prev) => ({ ...prev, contactEmail: true }));
    }
    if (name === "contactInfo.phone") {
      setFieldErrors((prev) => ({
        ...prev,
        contactPhone: validatePhone(value),
      }));
      setTouched((prev) => ({ ...prev, contactPhone: true }));
    }

    setFormData((prev) => {
      if (name === "internshipType") {
        return {
          ...prev,
          internshipType: value,
          compensationDetails: {
            ...prev.compensationDetails,
            type: value,
            frequency: value === "FREE" ? "" : "ONE_TIME",
            ...(value === "FREE" && { amount: null, currency: "" }),
          },
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

  const calculateDuration = useCallback((startDate, endDateOrDuration) => {
    if (!startDate || !endDateOrDuration) {
      setFormData((prev) => ({ ...prev, duration: "" }));
      return;
    }
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
    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;
    const durationText =
      months > 0
        ? `${months} month${months > 1 ? "s" : ""}${days > 0 ? ` and ${days} day${days > 1 ? "s" : ""}` : ""}`
        : `${totalDays} day${totalDays > 1 ? "s" : ""}`;
    setFormData((prev) => ({ ...prev, duration: durationText }));
  }, []);

  const addQualification = () => {
    const val = qualInput.trim();
    if (!val) return;

    const error = validateQualification(val);
    if (error) {
      setQualError(error);
      setTimeout(() => setQualError(""), 5000);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, val],
    }));
    setQualInput("");
    setQualError("");
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
      compensationDetails: {
        type: "",
        amount: null,
        currency: "",
        frequency: "",
      },
      mode: "",
      qualifications: [],
      contactInfo: { name: "", email: "", phone: "" },
      imgUrl: "",
      studentApplied: false,
      adminApproved: false,
      applicationOpen: true,
    });
    setFieldErrors({
      jobTitle: "",
      companyName: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    });
    setTouched({
      jobTitle: false,
      companyName: false,
      contactName: false,
      contactEmail: false,
      contactPhone: false,
    });
    setQualInput("");
    setQualError("");
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pid = localStorage.getItem("partnerId");
    if (!pid) {
      console.error("No partner ID");
      return;
    }

    const jobTitleErr = validateJobTitle(formData.jobTitle);
    const companyNameErr = validateCompanyName(formData.companyName);
    const cityErr = validateCity(formData.city);
    const contactNameErr = validateContactName(formData.contactInfo?.name);
    const contactEmailErr = validateEmail(formData.contactInfo?.email);
    const contactPhoneErr = validatePhone(formData.contactInfo?.phone);

    if (jobTitleErr || companyNameErr || cityErr || contactNameErr || contactEmailErr || contactPhoneErr) {
      setTouched({
        jobTitle: true,
        companyName: true,
        city: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
      });
      setFieldErrors({
        jobTitle: jobTitleErr,
        companyName: companyNameErr,
        city: cityErr,
        contactName: contactNameErr,
        contactEmail: contactEmailErr,
        contactPhone: contactPhoneErr,
      });
      setErrorMessage(
        jobTitleErr || companyNameErr || cityErr || contactNameErr || contactEmailErr || contactPhoneErr
      );
      setTimeout(() => setErrorMessage(""), 6000);
      return;
    }

    if (userType === "Freemium" && formData.internshipType === "PAID") {
      setFreemiumAlert("Upgrade required to post paid internships.");
      setTimeout(() => setFreemiumAlert(""), 3500);
      return;
    }

    if (formData.startDate && formData.endDateOrDuration) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDateOrDuration);
      const minEndDate = new Date(start);
      minEndDate.setMonth(minEndDate.getMonth() + 1);
      
      if (end < minEndDate) {
        setErrorMessage("End date must be at least 1 month after the start date.");
        setTimeout(() => setErrorMessage(""), 6000);
        return;
      }
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (
      formData.contactInfo?.email &&
      !emailRegex.test(formData.contactInfo.email.trim())
    ) {
      setErrorMessage(
        "Please enter a valid contact email address with a valid domain (e.g. .com, .in).",
      );
      setTimeout(() => setErrorMessage(""), 6000);
      return;
    }

    const payload = {
      ...formData,
      imgUrl: formData.imgUrl || defaultCompanyLogo,
      internshipMode: (formData.mode || "ONLINE").toUpperCase(),
      location: formData.state
        ? `${formData.city}, ${formData.state}, ${formData.country}`
        : `${formData.city}, ${formData.country}`,
      partnerId: pid,
      qualifications:
        typeof formData.qualifications === "string"
          ? formData.qualifications
              .split(",")
              .map((q) => q.trim())
              .filter(Boolean)
          : formData.qualifications,
    };

    try {
      const res = await axios.post("/api/interns", payload);
      saveJob(res.data);
      resetForm();
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error posting internship:", err);
      let errMsg = "Failed to post internship. Please try again.";

      const backendMsg = err.response?.data?.message || "";
      const backendErr = err.response?.data?.error || "";
      const combinedError = `${backendMsg} ${backendErr}`.trim();

      if (
        combinedError.includes(
          "Freemium partners can post up to 2 internships only",
        )
      ) {
        errMsg =
          "You have reached the free limit of 2 internships. Please upgrade your subscription to post more.";
      } else if (combinedError.includes("validation failed")) {
        const errorPart = combinedError.split("validation failed: ")[1];
        if (errorPart) {
          const rawFields = errorPart
            .split(",")
            .map((part) => part.split(":")[0].trim());
          const friendlyNames = {
            "compensationDetails.type": "Compensation Type",
            internshipType: "Internship Type",
            jobTitle: "Job Title",
            companyName: "Company Name",
            sector: "Sector",
            city: "City",
            state: "State",
            country: "Country",
            classification: "Classification",
          };
          const cleanFields = rawFields.map((f) => friendlyNames[f] || f);
          errMsg = `Please fill in all required fields: ${cleanFields.join(", ")}`;
        } else {
          errMsg = "Please fill in all required fields.";
        }
      } else if (combinedError) {
        errMsg = combinedError;
      }

      setErrorMessage(errMsg);
      setTimeout(() => setErrorMessage(""), 6000);
    }
  };

  const inputCls =
    "!mt-0 !m-0 w-full !h-12 !px-4 !py-2.5 text-sm !border !border-gray-300 !rounded-lg !bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:!ring-2 focus:!ring-teal-500 focus:!border-teal-500 transition box-border";
  const locationInputCls =
    "!mt-0 !m-0 w-full !h-12 !px-4 !py-2.5 text-sm !border !border-gray-300 !rounded-lg !bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:!ring-2 focus:!ring-teal-500 focus:!border-teal-500 transition box-border";

  return (
    <div className="max-w-4xl font-poppins mx-auto p-6 bg-white rounded-lg shadow-lg mt-8">
      {/* Remove mb-40 for remove the excess margin for scrolling in the above div - 02-09-2026 */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Post an Internship
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Job Title
          </label>
          {/*Add the style attribute for alignment - 04-08-2026 */}
          <input
            type="text"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            onBlur={() => handleBlur("jobTitle")}
            maxLength={60}
            className={`${inputCls} ${touched.jobTitle && fieldErrors.jobTitle ? "!border-rose-400 focus:!ring-rose-400/20 focus:!border-rose-500" : ""}`}
            placeholder="Enter job title"
            style={{ marginTop: "0px" }}
          />
          {touched.jobTitle && fieldErrors.jobTitle && (
            <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {fieldErrors.jobTitle}
            </p>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Company Name
          </label>
          {/*Add the style attribute for alignment - 04-08-2026 */}
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            onBlur={() => handleBlur("companyName")}
            maxLength={60}
            className={`${inputCls} ${touched.companyName && fieldErrors.companyName ? "!border-rose-400 focus:!ring-rose-400/20 focus:!border-rose-500" : ""}`}
            style={{ marginTop: "0px" }}
            placeholder="Enter company name"
          />
          {touched.companyName && fieldErrors.companyName && (
            <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {fieldErrors.companyName}
            </p>
          )}
        </div>

        {/* Sector */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Sector</label>
          <CustomSelect
            name="sector"
            value={formData.sector}
            onChange={handleChange}
            required
            placeholder="Select a Sector"
            options={topSectors.map((s) => ({ value: s.id, label: s.name }))}
            className={inputCls}
          />
        </div>

        {/* Classification */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Internship Classification
          </label>
          <CustomSelect
            name="classification"
            value={formData.classification}
            onChange={handleChange}
            required
            placeholder="Select Classification"
            options={["Basic", "Intermediate", "Advanced"]}
            className={inputCls}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Location
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="flex flex-col gap-1 w-full min-w-0">
              <label htmlFor="country" className="block text-gray-700 text-sm">
                Country *
              </label>
              <CustomSelect
                name="country"
                value={formData.country}
                onChange={(e) => {
                  setFormData((p) => ({
                    ...p,
                    country: e.target.value,
                    state: "",
                  }));
                  setCitySuggestions([]);
                }}
                required
                placeholder="Select Country"
                options={["United States", "Canada"]}
                className={locationInputCls}
              />
            </div>

            <div className="flex flex-col gap-1 w-full min-w-0">
              <label htmlFor="state" className="block text-gray-700 text-sm">
                {stateLabel} *
              </label>
              <CustomSelect
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                placeholder={`Select ${stateLabel}`}
                options={stateList}
                className={locationInputCls}
              />
            </div>

            <div className="relative flex flex-col gap-1 w-full min-w-0">
              <label htmlFor="city" className="block text-gray-700 text-sm">
                City *
              </label>
              <input
                id="city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleCityInputChange}
                onBlur={() => handleBlur("city")}
                autoComplete="address-level2"
                required
                placeholder="Start typing city"
                className={`${locationInputCls} relative z-[15] ${
                  touched.city && fieldErrors.city
                    ? "!border-rose-400 focus:!ring-rose-400"
                    : ""
                }`}
              />
              {touched.city && fieldErrors.city && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {fieldErrors.city}
                </p>
              )}
              {citySuggestions.length > 0 && (
                <ul className="absolute z-[20] left-0 top-full w-full mt-2 max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                  {citySuggestions.map((city) => (
                    <li
                      key={city.wikiDataId || city.id || city.name}
                      className="px-4 py-2 cursor-pointer hover:bg-teal-50 hover:text-teal-700 text-sm"
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
          <label className="block text-gray-700 font-medium mb-2">
            Job Description
          </label>
          {/*Add the style attribute for alignment - 04-08-2026 */}
          <textarea
            name="jobDescription"
            value={formData.jobDescription}
            onChange={handleChange}
            required
            rows="4"
            className={inputCls}
            style={{ marginTop: "0px" }}
            placeholder="Describe the job responsibilities, requirements, etc."
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Start Date
          </label>
          <CustomDatePicker
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            End Date
          </label>
          <CustomDatePicker
            name="endDateOrDuration"
            value={formData.endDateOrDuration}
            onChange={handleChange}
            required
            min={
              formData.startDate
                ? (() => {
                    const d = new Date(formData.startDate);
                    d.setMonth(d.getMonth() + 1);
                    return d.toISOString().split("T")[0];
                  })()
                : new Date().toISOString().split("T")[0]
            }
          />
        </div>

        {/* Calculated Duration */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Calculated Duration
          </label>
          {/*Add the style attribute for alignment - 04-08-2026 */}
          <input
            type="text"
            name="duration"
            value={formData.duration}
            readOnly
            placeholder="Duration will be calculated"
            className={inputCls}
            style={{ marginTop: "0px" }}
          />
        </div>

        {/* Mode */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Mode of Internship
          </label>
          <CustomSelect
            name="mode"
            value={formData.mode}
            onChange={handleChange}
            required
            placeholder="Select Mode"
            options={["Online", "Offline", "Hybrid"]}
            className={inputCls}
          />
        </div>

        {/* Qualifications */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Qualifications & Skills
          </label>
          <div
            className={`flex flex-wrap gap-2 items-center min-h-[48px] p-2 border rounded-lg bg-white focus-within:ring focus-within:ring-teal-500 cursor-text ${
              qualError ? "!border-rose-400 focus-within:!ring-rose-400/20" : "!border-gray-300"
            }`}
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
            {/* Add !mt-0 for decrease the margin-top between label and input - 02-09-2026 */}
            <input
              id="qualInput"
              type="text"
              value={qualInput}
              onChange={(e) => {
                const clean = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                setQualInput(clean);
                if (qualError) setQualError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addQualification();
                }
              }}
              placeholder={
                formData.qualifications.length === 0
                  ? "Type a skill (e.g. Geometry, Algebra) and press Enter..."
                  : "Add another skill..."
              }
              className="!mt-0 flex-1 min-w-[160px] outline-none bg-transparent text-sm py-1 px-1"
            />
            <button
              type="button"
              onClick={addQualification}
              className="text-sm px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 font-medium"
            >
              + Add
            </button>
          </div>
          {qualError ? (
            <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {qualError}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              Press Enter or click Add. Qualifications can only contain letters and spaces.
            </p>
          )}
        </div>

        {/* Contact Information */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Contact Information
          </label>
          <div className="space-y-2">
            <div>
              {/* Add !mt-0 for decrease the margin-top between label and input - 02-09-2026 */}
              <input
                type="text"
                name="contactInfo.name"
                value={formData.contactInfo.name}
                onChange={handleChange}
                onBlur={() => handleBlur("contactName")}
                maxLength={50}
                required
                className={`${inputCls} !mt-0 ${
                  touched.contactName && fieldErrors.contactName
                    ? "!border-rose-400 focus:!ring-rose-400/20 focus:!border-rose-500"
                    : ""
                }`}
                placeholder="Contact Name"
              />
              {touched.contactName && fieldErrors.contactName && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {fieldErrors.contactName}
                </p>
              )}
            </div>
            <div>
              <input
                type="email"
                name="contactInfo.email"
                value={formData.contactInfo.email}
                onChange={handleChange}
                onBlur={() => handleBlur("contactEmail")}
                maxLength={80}
                required
                className={`${inputCls} !mt-0 ${
                  touched.contactEmail && fieldErrors.contactEmail
                    ? "!border-rose-400 focus:!ring-rose-400/20 focus:!border-rose-500"
                    : ""
                }`}
                placeholder="Contact Email (e.g. name@example.com)"
              />
              {touched.contactEmail && fieldErrors.contactEmail && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {fieldErrors.contactEmail}
                </p>
              )}
            </div>
            <div>
              <PhoneInputWithCountry
                name="contactInfo.phone"
                value={formData.contactInfo.phone}
                onChange={(e) => {
                  handleChange({ target: { name: "contactInfo.phone", value: e.target.value } });
                }}
                onBlur={() => handleBlur("contactPhone")}
                required
                error={touched.contactPhone && fieldErrors.contactPhone}
              />
              {touched.contactPhone && fieldErrors.contactPhone && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {fieldErrors.contactPhone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Upload Image */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Upload Image
          </label>
          {/*Add the style attribute for alignment - 04-08-2026 
          Add !mt-0 for decrease the margin top - 02-09-2026
          */}
          <input
            type="file"
            accept="image/*, image/svg+xml, .svg"
            onChange={handleFileUpload}
            className={`${inputCls} !mt-0`}
            style={{ padding: "4px" }}
          />
          {uploading && (
            <p className="text-sm text-gray-500 mt-1">Uploading image...</p>
          )}
          <img
            src={previewUrl || formData.imgUrl || defaultCompanyLogo}
            alt="Internship preview"
            className="mt-2 h-24 w-24 rounded-lg object-cover border border-gray-200"
          />
        </div>

        {/* Internship Type — select (Free/Stipend) + Paid radio */}
        <div>
          <label className="block text-gray-700 font-medium mb-3">
            Internship Type
          </label>

          {/* Hidden input for form validation — fires if no type is selected */}
          <input
            type="text"
            value={formData.internshipType}
            required
            readOnly
            tabIndex={-1}
            style={{
              position: "absolute",
              opacity: 0,
              height: 0,
              width: 0,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />

          {/* CustomSelect for Free / Stipend */}
          <CustomSelect
            value={
              formData.internshipType === "PAID" ? "" : formData.internshipType
            }
            onChange={handleChange}
            name="internshipType"
            placeholder="Select Internship Type"
            options={[
              { value: "FREE", label: "Free" },
              { value: "STIPEND", label: "Stipend" },
            ]}
            className={inputCls}
          />

          {/* Description banner for Free or Stipend */}
          {(formData.internshipType === "FREE" ||
            formData.internshipType === "STIPEND") && (
            <div
              className={`mt-3 px-4 py-3 rounded-xl border flex items-start gap-2 ${
                formData.internshipType === "STIPEND"
                  ? "bg-emerald-50/60 border-emerald-100"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <p
                className={`text-sm leading-tight ${
                  formData.internshipType === "STIPEND"
                    ? "text-emerald-700"
                    : "text-slate-600"
                }`}
              >
                {formData.internshipType === "STIPEND" ? (
                  <>
                    <strong>Stipend:</strong> Students receive a stipend from
                    your organization during the internship.
                  </>
                ) : (
                  <>
                    <strong>Free:</strong> Students join without paying any fee
                    and do not receive a stipend.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Paid radio option */}
          <div className="mt-4">
            <label
              className={`flex h-11 items-center px-3 border rounded-lg transition-all ${
                userType === "Freemium"
                  ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                  : formData.internshipType === "PAID"
                    ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500 cursor-pointer"
                    : "border-gray-300 hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="internshipTypeRadio"
                value="PAID"
                disabled={userType === "Freemium"}
                checked={formData.internshipType === "PAID"}
                onChange={(e) =>
                  handleChange({
                    target: { name: "internshipType", value: e.target.value },
                  })
                }
                className="m-0 h-5 w-5 shrink-0 self-center text-teal-600 focus:ring-teal-500 border-gray-300 disabled:cursor-not-allowed cursor-pointer"
              />
              <span className="ml-3 flex items-center gap-2 font-medium leading-none text-gray-800">
                <span className="leading-none">Paid</span>
                {userType === "Freemium" && (
                  <span className="text-xs text-red-500 mt-0.5">
                    (Upgrade required)
                  </span>
                )}
              </span>
            </label>
          </div>

          {/* Description banner for Paid */}
          {formData.internshipType === "PAID" && (
            <div className="mt-3 px-4 py-3 bg-orange-50/60 rounded-xl border border-orange-100 flex items-start gap-2">
              <p className="text-sm text-orange-700 leading-tight">
                <strong>Paid:</strong> Students pay a fee to enroll in this
                internship program.
              </p>
            </div>
          )}
        </div>

        {/* Compensation Details — shown only for STIPEND or PAID */}
        {(formData.internshipType === "STIPEND" ||
          formData.internshipType === "PAID") && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Amount
              </label>
              {/*Add the style attribute for alignment - 04-08-2026 */}
              <input
                type="number"
                name="compensationDetails.amount"
                value={formData.compensationDetails.amount || ""}
                onChange={handleChange}
                required
                min="0"
                className={inputCls}
                style={{ marginTop: "0px" }}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Currency
              </label>
              <CustomSelect
                name="compensationDetails.currency"
                value={formData.compensationDetails.currency}
                onChange={handleChange}
                required
                placeholder="Select Currency"
                options={["USD", "CAD", "EUR", "GBP"]}
                className={inputCls}
              />
            </div>

            {/* Frequency is always One Time — hidden */}
            <input
              type="hidden"
              name="compensationDetails.frequency"
              value="ONE_TIME"
            />
          </div>
        )}

        {/* Open for Applications */}
        <div>
          <label className="inline-flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="applicationOpen"
              checked={formData.applicationOpen}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  applicationOpen: e.target.checked,
                }))
              }
              className="form-checkbox h-5 w-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
            />
            <span className="text-gray-700 font-medium text-sm">
              Open for Applications
            </span>
          </label>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring focus:ring-teal-500"
          >
            Post Internship
          </button>
        </div>
      </form>
      {/* Success modal */}
      {showSuccessModal && (
        <SuccessModal
          onOk={() => {
            setShowSuccessModal(false);
            handleSelectTab("your-job-posts");
          }}
        />
      )}
      {/* Freemium upgrade alert */}
      {freemiumAlert && (
        <div className="fixed top-5 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-orange-500 text-white py-3 px-5 rounded-xl shadow-2xl transition-all duration-300 flex items-center justify-between gap-3 text-sm font-medium">
          <span>{freemiumAlert}</span>
          <button
            type="button"
            onClick={() => setFreemiumAlert("")}
            className="text-white/80 hover:text-white font-bold ml-2 text-base leading-none"
          >
            ×
          </button>
        </div>
      )}
      {/* Error toast */}
      {errorMessage && (
        <div className="fixed top-5 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-red-600 text-white py-3 px-5 rounded-xl shadow-2xl transition-all duration-300 flex items-center justify-between gap-3 text-sm font-medium">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-white/80 hover:text-white font-bold ml-2 text-base leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default PostAJob;
