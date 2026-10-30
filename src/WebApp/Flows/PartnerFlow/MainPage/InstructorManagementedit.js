//File: InstructorManagementedit.js

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "../../../../api/axiosInstance";
import PhoneInputWithCountry from "./PhoneInputWithCountry";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faEnvelope,
  faStar,
  faShieldAlt,
  faClock,
  faDollarSign,
  faClipboardList,
  faPlus,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

/* ─── Shared style tokens ─── */
const inputCls =
  "!mt-0 w-full min-w-0 max-w-full h-11 rounded-xl border border-slate-200 bg-white/95 px-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 hover:border-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-indigo-50 file:to-sky-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700";
const selectCls =
  "!mt-0 w-full min-w-0 max-w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 hover:border-slate-300 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748b%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[right_0.75rem_center] bg-no-repeat pr-10";
const textareaCls =
  "!mt-0 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 hover:border-slate-300 min-h-[7rem] resize-y";
const labelCls =
  "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

const dayOpts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

const CA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon",
];

const TIMEZONES_US_MX = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "America/Honolulu",
  "America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg",
  "America/Halifax", "America/St_Johns", "America/Regina", "America/Whitehorse",
  "America/Yellowknife", "America/Iqaluit",
];

const sectionThemes = {
  "Personal & Contact": {
    wrap:
      "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/40 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-sky-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-sky-300 after:via-indigo-200 after:to-transparent",
    icon: "text-sky-500 text-[10px]",
  },
  "Professional & Teaching": {
    wrap:
      "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-violet-50/25 to-fuchsia-50/35 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-violet-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-violet-300 after:via-fuchsia-200 after:to-transparent",
    icon: "text-violet-500 text-[10px]",
  },
  Availability: {
    wrap:
      "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-cyan-50/25 to-blue-50/35 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-cyan-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-cyan-300 after:via-blue-200 after:to-transparent",
    icon: "text-cyan-500 text-[10px]",
  },
  "Compensation / Payout": {
    wrap:
      "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/35 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-emerald-300 after:via-teal-200 after:to-transparent",
    icon: "text-emerald-500 text-[10px]",
  },
  "Compliance & Documents": {
    wrap:
      "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-amber-50/25 to-orange-50/35 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-amber-300 after:via-orange-200 after:to-transparent",
    icon: "text-amber-500 text-[10px]",
  },
  Assignment: {
    wrap:
      "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-rose-50/20 to-pink-50/30 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-rose-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-rose-300 after:via-pink-200 after:to-transparent",
    icon: "text-rose-500 text-[10px]",
  },
};

const defaultSectionTheme = {
  wrap:
    "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-indigo-50/20 p-5 shadow-sm shadow-slate-200/60",
  title:
    "text-xs font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-indigo-300 after:to-transparent",
  icon: "text-indigo-500 text-[10px]",
};

/* ─── Form section wrapper ─── */
const FormSection = ({ title, icon, children }) => {
  const theme = sectionThemes[title] || defaultSectionTheme;

  return (
    <div className={`space-y-5 ${theme.wrap} max-w-full min-w-0 overflow-visible relative`}>
      <div className={theme.title}>
        {icon && <FontAwesomeIcon icon={icon} className={theme.icon} />}
        {title}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5 min-w-0">{children}</div>
    </div>
  );
};

/* ─── Field wrapper ─── */
const Field = ({ label, required, span = 1, children }) => (
  <div className={`min-w-0 w-full ${span === 2 ? "md:col-span-2" : span === 3 ? "md:col-span-3" : ""}`}>
    <label className={labelCls}>
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

/* ─── Custom Select Component ─── */
const CustomSelect = ({
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  disabled = false,
  required = false,
  className = "",
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
    <div className="relative w-full min-w-0" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`!mt-0 w-full min-w-0 max-w-full h-11 rounded-xl border bg-white px-4 text-sm flex items-center justify-between text-left transition-all duration-200 shadow-sm ${
          disabled
            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
            : open
              ? "border-violet-400 ring-4 ring-violet-500/10 cursor-pointer"
              : "border-slate-200 text-slate-800 hover:border-slate-300 cursor-pointer"
        } ${className}`}
      >
        <span
          className={`truncate ${
            !selectedOption || !selectedOption.value
              ? "text-slate-400 font-normal"
              : "text-slate-800 font-medium"
          }`}
        >
          {selectedOption && selectedOption.value ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 ml-2 flex-shrink-0 transition-transform duration-200 ${
            open ? "transform rotate-180 text-violet-600" : ""
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

      {/* Hidden input for form data serialization & validation */}
      <input
        type="hidden"
        name={name}
        value={value || ""}
        required={required}
      />

      {open && (
        <ul
          className="absolute z-[9999] left-0 right-0 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-40 overflow-y-auto py-1 text-sm divide-y divide-slate-50 overscroll-contain dropdown-scrollbar"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#94a3b8 #f1f5f9",
          }}
        >
          {placeholder && (
            <li
              onClick={() => handleSelect("")}
              className="px-4 py-2 hover:bg-violet-50 hover:text-violet-700 cursor-pointer text-slate-400 select-none text-xs sm:text-sm"
            >
              {placeholder}
            </li>
          )}
          {normalizedOptions.map((opt) => (
            <li
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`px-4 py-2 hover:bg-violet-50 hover:text-violet-700 cursor-pointer select-none transition-colors text-xs sm:text-sm flex items-center justify-between ${
                opt.value === value
                  ? "bg-violet-50 text-violet-800 font-semibold"
                  : "text-slate-700"
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && (
                <span className="text-violet-600 font-bold text-xs shrink-0 ml-2">✓</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ─── Custom Time Picker Component (prevents OS native popup overflow on mobile) ─── */
const CustomTimePicker = ({
  name,
  value = "",
  onChange,
  placeholder = "--:--",
  required = false,
  disabled = false,
  className = "",
  inputRef,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  const [selectedHour, selectedMinute] = value ? value.split(":") : ["", ""];

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

  const handleHourSelect = (h) => {
    const min = selectedMinute || "00";
    const newVal = `${h}:${min}`;
    onChange?.({ target: { name, value: newVal } });
  };

  const handleMinuteSelect = (m) => {
    const hr = selectedHour || "09";
    const newVal = `${hr}:${m}`;
    onChange?.({ target: { name, value: newVal } });
    setOpen(false);
  };

  return (
    <div className="relative w-full min-w-0" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`!mt-0 w-full min-w-0 max-w-full h-11 rounded-xl border bg-white px-4 text-sm flex items-center justify-between text-left transition-all duration-200 shadow-sm ${
          disabled
            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
            : open
              ? "border-violet-400 ring-4 ring-violet-500/10 cursor-pointer"
              : "border-slate-200 text-slate-800 hover:border-slate-300 cursor-pointer"
        } ${className}`}
      >
        <span
          className={`truncate ${
            !value ? "text-slate-400 font-normal" : "text-slate-800 font-medium"
          }`}
        >
          {value || placeholder}
        </span>
        <svg
          className={`h-4 w-4 ml-2 flex-shrink-0 transition-colors ${
            open ? "text-violet-600" : "text-slate-400"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Hidden input for form data serialization & validity validation */}
      <input
        type="text"
        name={name}
        value={value || ""}
        required={required}
        ref={inputRef}
        readOnly
        className="sr-only"
        tabIndex={-1}
      />

      {open && (
        <div className="absolute z-[9999] left-0 mt-1.5 w-60 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl p-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs font-semibold text-slate-500">
            <span>Select Time (24h)</span>
            {value && (
              <span className="text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded-md">
                {value}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider mb-1">
                Hour
              </div>
              <div className="max-h-40 overflow-y-auto dropdown-scrollbar space-y-1 pr-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={`w-full py-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                      selectedHour === h
                        ? "bg-violet-600 text-white shadow-sm font-bold"
                        : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider mb-1">
                Min
              </div>
              <div className="max-h-40 overflow-y-auto dropdown-scrollbar space-y-1 pr-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={`w-full py-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                      selectedMinute === m
                        ? "bg-violet-600 text-white shadow-sm font-bold"
                        : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CenteredAlertModal = ({
  open,
  title = "Success",
  message,
  type = "success",
  onOk,
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[3px] animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl sm:rounded-[28px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] w-full max-w-sm p-6 sm:p-7 border border-slate-200/70 text-center flex flex-col items-center animate-scaleIn">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${
            type === "success"
              ? "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600"
              : type === "error"
              ? "bg-gradient-to-br from-rose-100 to-red-100 text-rose-600"
              : "bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 text-violet-600"
          }`}
        >
          {type === "success" ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : type === "error" ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {title}
        </h3>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {message}
        </p>

        <button
          type="button"
          onClick={onOk}
          className={`w-full py-3 rounded-xl text-white text-sm font-semibold shadow-md transition-all active:scale-95 ${
            type === "success"
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
              : type === "error"
              ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
              : "bg-violet-600 hover:bg-violet-700 shadow-violet-200"
          }`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default function InstructorManagementedit({ open, item, onClose, onSaved }) {
  const authCfg = () => {
    const token =
      localStorage.getItem("partnerToken") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("partnerToken");
    const cfg = { withCredentials: true };
    if (token) cfg.headers = { Authorization: `Bearer ${token}` };
    return cfg;
  };

  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pendingFormData, setPendingFormData] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [modalAlert, setModalAlert] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const showModalAlert = (message, title = "Notice", type = "info") => {
    setModalAlert({
      open: true,
      title,
      message,
      type,
    });
  };

  const toCSV = (arr) =>
    Array.isArray(arr) ? arr.join(", ") : typeof arr === "string" ? arr : "";

  const [fieldErrors, setFieldErrors] = useState({});

  const setFieldError = (field, message) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const itemId = useMemo(() => item?._id || item?.id, [item]);

  const initialCountry = item?.country === "Canada" ? "Canada" : "United States";
  const [country, setCountry] = useState(initialCountry);
  const [firstName, setFirstName] = useState(item?.firstName || "");
  const [lastName, setLastName] = useState(item?.lastName || "");
  const [email, setEmail] = useState(item?.email || "");
  const [stateProv, setStateProv] = useState(item?.state || "");
  const [city, setCity] = useState(item?.city || "");
  const [postalCode, setPostalCode] = useState(item?.postalCode || "");
  const [address1, setAddress1] = useState(item?.address1 || "");
  const [address2, setAddress2] = useState(item?.address2 || "");

  const [phoneValue, setPhoneValue] = useState(item?.phone || "");
  const [altPhoneValue, setAltPhoneValue] = useState(item?.altPhone || "");

  const [qualification, setQualification] = useState(item?.qualification || "");
  const [experienceYears, setExperienceYears] = useState(item?.experienceYears ?? "");
  const [organization, setOrganization] = useState(item?.organization || "");
  const [skills, setSkills] = useState(toCSV(item?.skills));
  const [languages, setLanguages] = useState(toCSV(item?.languages));
  const [teachingMode, setTeachingMode] = useState(item?.teachingMode || "Online");
  const [bio, setBio] = useState(item?.bio || "");

  const [availStart, setAvailStart] = useState(item?.availableStart || "");
  const [availEnd, setAvailEnd] = useState(item?.availableEnd || "");
  const [tz, setTz] = useState(item?.timezone || "America/Los_Angeles");

  const [rateType, setRateType] = useState(item?.rateType || "Hourly");
  const [expectedRate, setExpectedRate] = useState(item?.expectedRate ?? "");
  const [currency, setCurrency] = useState(
    item?.currency || (initialCountry === "Canada" ? "CAD" : "USD")
  );
  const [payoutMethod, setPayoutMethod] = useState(() => {
    const us = ["ACH (US Bank)", "Zelle", "PayPal"];
    const ca = ["EFT (CA Bank)", "Interac e-Transfer", "PayPal"];
    const m = item?.payoutMethod;
    if (!m) return "";
    if (initialCountry === "Canada") return ca.includes(m) ? m : "";
    return us.includes(m) ? m : "";
  });
  const [payoutId, setPayoutId] = useState(item?.payoutIdentifier || "");

  const [backgroundCheck, setBackgroundCheck] = useState(item?.backgroundCheck || "Pending");
  const [assignInternship, setAssignInternship] = useState(item?.assignInternship || "");
  const [notes, setNotes] = useState(item?.notes || "");

  const [prefSlots, setPrefSlots] = useState(
    Array.isArray(item?.preferableSlots)
      ? item.preferableSlots.map((s) => ({ start: s.start || "", end: s.end || "" }))
      : []
  );

  useEffect(() => {
    if (item) {
      setFirstName(item.firstName || "");
      setLastName(item.lastName || "");
      setEmail(item.email || "");
      const c = item.country === "Canada" ? "Canada" : "United States";
      setCountry(c);
      setStateProv(item.state || "");
      setCity(item.city || "");
      setPostalCode(item.postalCode || "");
      setAddress1(item.address1 || "");
      setAddress2(item.address2 || "");
      setPhoneValue(item.phone || "");
      setAltPhoneValue(item.altPhone || "");
      setQualification(item.qualification || "");
      setExperienceYears(item.experienceYears ?? "");
      setOrganization(item.organization || "");
      setSkills(toCSV(item.skills));
      setLanguages(toCSV(item.languages));
      setTeachingMode(item.teachingMode || "Online");
      setBio(item.bio || "");
      setAvailStart(item.availableStart || "");
      setAvailEnd(item.availableEnd || "");
      setTz(item.timezone || "America/Los_Angeles");
      setRateType(item.rateType || "Hourly");
      setExpectedRate(item.expectedRate ?? "");
      setCurrency(item.currency || (c === "Canada" ? "CAD" : "USD"));
      setPayoutMethod(item.payoutMethod || "");
      setPayoutId(item.payoutIdentifier || "");
      setBackgroundCheck(item.backgroundCheck || "Pending");
      setAssignInternship(item.assignInternship || "");
      setNotes(item.notes || "");
      setPrefSlots(
        Array.isArray(item.preferableSlots)
          ? item.preferableSlots.map((s) => ({ start: s.start || "", end: s.end || "" }))
          : []
      );
      setFieldErrors({});
    }
  }, [item]);

  useEffect(() => {
    setCurrency((c) => {
      if (country === "Canada" && c === "USD") return "CAD";
      if (country === "United States" && c === "CAD") return "USD";
      return c;
    });
  }, [country]);

  useEffect(() => {
    if (typeof document !== "undefined" && document.body) {
      setPortalTarget(document.body);
    }
  }, []);

  useEffect(() => {
    const us = ["ACH (US Bank)", "Zelle", "PayPal"];
    const ca = ["EFT (CA Bank)", "Interac e-Transfer", "PayPal"];
    if (country === "Canada" && payoutMethod && !ca.includes(payoutMethod)) setPayoutMethod("");
    else if (country === "United States" && payoutMethod && !us.includes(payoutMethod)) setPayoutMethod("");
  }, [country, payoutMethod]);

  const addPrefSlot = () => setPrefSlots((p) => [...p, { start: "", end: "" }]);
  const updatePrefSlot = (idx, field, value) =>
    setPrefSlots((p) => p.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  const removePrefSlot = (idx) => setPrefSlots((p) => p.filter((_, i) => i !== idx));

  const startRef = useRef(null);
  const endRef = useRef(null);
  const prefStartRefs = useRef([]);
  const prefEndRefs = useRef([]);

  const stateList = country === "Canada" ? CA_PROVINCES : US_STATES;
  const stateLabel = country === "Canada" ? "Province / Territory" : "State";
  const postalLabel = country === "Canada" ? "Postal Code" : "ZIP Code";
  const cityPlaceholder = country === "Canada" ? "e.g., Toronto" : "e.g., San Jose";
  const address1Placeholder = "Street address, suite, unit";

  const payIdPlaceholder =
    payoutMethod === "ACH (US Bank)"
      ? "Routing & last-4 (e.g., 111000025 | ****1234)"
      : payoutMethod === "Zelle"
        ? "Zelle email or phone"
        : payoutMethod === "EFT (CA Bank)"
          ? "Transit|Institution|Account (e.g., 12345|004|0012345)"
          : payoutMethod === "Interac e-Transfer"
            ? "Email or mobile number"
            : "PayPal email";

  const capitalizeFirstLetter = (value) => {
    if (!value) return "";
    return value
      .split(" ")
      .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
      .join(" ");
  };

  const validateName = (value, fieldLabel = "Name") => {
    const input = (value || "").trim();
    if (!input) {
      return `${fieldLabel} is required.`;
    }
    if (input.length < 2) {
      return `${fieldLabel} must be at least 2 characters.`;
    }
    if (input.length > 50) {
      return `${fieldLabel} cannot exceed 50 characters.`;
    }
    const validLettersRegex = /^[a-zA-Z0-9À-ÿ\s.'-]+$/;
    if (!validLettersRegex.test(input)) {
      return `${fieldLabel} can only contain letters, numbers, spaces, hyphens, periods, and apostrophes.`;
    }
    if (/[.'-]{2,}/.test(input)) {
      return `${fieldLabel} cannot contain consecutive special characters.`;
    }
    const alphanumericCount = (input.match(/[a-zA-Z0-9À-ÿ]/g) || []).length;
    if (alphanumericCount < 2) {
      return `${fieldLabel} must contain at least 2 characters.`;
    }
    return "";
  };

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const validateEmail = (value) => {
    const input = (value || "").trim();
    if (!input) {
      return "Email is required.";
    }
    if (!emailRegex.test(input)) {
      return "Please enter a valid email address with a valid domain (e.g. .com, .in).";
    }
    return "";
  };

  const validatePhone = (value, isRequired = true, fieldLabel = "Mobile") => {
    const digits = (value || "").replace(/\D/g, "");
    if (!digits) {
      return isRequired ? `${fieldLabel} number is required.` : "";
    }
    if (digits.length < 10 || digits.length > 15) {
      return `${fieldLabel} must be a valid phone number (10 to 15 digits).`;
    }
    return "";
  };

  const validateCity = (value) => {
    const input = (value || "").trim();
    if (!input) return "City is required.";
    if (input.length < 2) return "City must be at least 2 characters.";
    if (input.length > 50) return "City cannot exceed 50 characters.";
    if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,49}$/.test(input)) {
      return "Enter a valid city name using letters, spaces, hyphens, or apostrophes.";
    }
    return "";
  };

  const validatePostalCode = (value, countryName) => {
    const postal = (value || "").trim().toUpperCase();
    if (!postal) return `${countryName === "Canada" ? "Postal" : "ZIP"} Code is required.`;

    if (countryName === "Canada") {
      if (!/^[A-Z]\d[A-Z] ?\d[A-Z]\d$/.test(postal)) {
        return "Enter a valid Canadian postal code, for example M5V 3L9.";
      }
      return "";
    }

    if (countryName === "United States") {
      if (!/^\d{5}(-\d{4})?$/.test(postal)) {
        return "Enter a valid US ZIP code, for example 95113 or 95113-1234.";
      }
      return "";
    }

    if (!/^\d{5}(-\d{4})?$/.test(postal) && !/^[A-Z]\d[A-Z] ?\d[A-Z]\d$/.test(postal)) {
      return "Enter a valid postal or ZIP code.";
    }
    return "";
  };

  const validateAddress = (value, isRequired = true, fieldLabel = "Address Line 1") => {
    const input = (value || "").trim();
    if (!input) {
      return isRequired ? `${fieldLabel} is required.` : "";
    }
    if (input.length < 3) {
      return `${fieldLabel} must be at least 3 characters.`;
    }
    if (input.length > 120) {
      return `${fieldLabel} cannot exceed 120 characters.`;
    }
    const alphanumericCount = (input.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphanumericCount < 2) {
      return `Please enter a valid ${fieldLabel.toLowerCase()}.`;
    }
    const validPattern = /^[a-zA-Z0-9\s,.'#\-/–—()&]+$/;
    if (!validPattern.test(input)) {
      return `${fieldLabel} contains invalid special characters.`;
    }
    return "";
  };

  const LIST_FIELD_PATTERNS = {
    "Spoken Languages": /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]*$/,
    "Skills / Technologies": /^[A-Za-z0-9À-ÿ][A-Za-zÀ-ÿ0-9\s+#./&-]*$/,
  };

  const validateListField = (value, fieldName, isRequired = true) => {
    const items = (value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (items.length === 0) {
      return isRequired ? `${fieldName} is required.` : "";
    }

    const pattern = LIST_FIELD_PATTERNS[fieldName];

    for (const item of items) {
      if (item.length < 2) {
        return `Please enter valid ${fieldName.toLowerCase()}.`;
      }

      if (item.length > 50) {
        return `${fieldName} entries must be 50 characters or less.`;
      }

      if (pattern && !pattern.test(item)) {
        return fieldName === "Spoken Languages"
          ? "Enter valid language names using letters only (e.g., English, Spanish)."
          : "Enter valid skills using letters, numbers, and common symbols only (+, #, ., /, &, -).";
      }
    }

    return "";
  };

  const validatePayoutIdentifier = (value, method) => {
    const input = (value || "").trim();

    if (!input) {
      return method ? "Payout Identifier is required." : "";
    }

    if (!method) {
      if (input.includes("@") && !emailRegex.test(input)) {
        return "Please enter a valid email address with a valid domain (e.g. name@example.com).";
      }
      return "Please select a Preferred Payout Method first.";
    }

    if (method === "ACH (US Bank)") {
      if (!/^\d{9}\s*\|\s*(\*{0,4})?\d{4}$/.test(input)) {
        return "Use the format: 111000025 | ****1234";
      }
    }

    if (method === "Zelle") {
      const isEmail = emailRegex.test(input);
      const isPhone = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(input) || /^\d{10,15}$/.test(input.replace(/\D/g, ""));
      if (!isEmail && !isPhone) {
        return "Enter a valid Zelle email (e.g. name@example.com) or 10-digit phone number.";
      }
    }

    if (method === "EFT (CA Bank)") {
      const parts = input.split("|").map((part) => part.trim());
      if (
        parts.length !== 3 ||
        !/^\d+$/.test(parts[0]) ||
        !/^\d+$/.test(parts[1]) ||
        !/^\d+$/.test(parts[2])
      ) {
        return "Use the format: Transit | Institution | Account (e.g. 12345 | 004 | 0012345)";
      }
    }

    if (method === "Interac e-Transfer") {
      const isEmail = emailRegex.test(input);
      const isPhone = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(input) || /^\d{10,15}$/.test(input.replace(/\D/g, ""));
      if (!isEmail && !isPhone) {
        return "Enter a valid Interac e-Transfer email (e.g. name@example.com) or phone number.";
      }
    }

    if (method === "PayPal") {
      if (!emailRegex.test(input)) {
        return "Please enter a valid PayPal email address with a valid domain (e.g. name@example.com).";
      }
    }

    return "";
  };

  const validateAssignInternship = (value) => {
    const input = (value || "").trim();
    if (!input) return "";

    if (input.length < 2) {
      return "Internship Title or ID must be at least 2 characters.";
    }
    if (input.length > 100) {
      return "Internship Title or ID cannot exceed 100 characters.";
    }

    const alphanumericCount = (input.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphanumericCount < 2) {
      return "Please enter a valid Internship Title or ID (e.g. MERN Bootcamp – 2025 Summer or INT-1024).";
    }

    const validPattern = /^[a-zA-Z0-9\s\-_.():/&,#'"–—]+$/;
    if (!validPattern.test(input)) {
      return "Internship Title or ID contains invalid special characters.";
    }

    return "";
  };

  const validateCurrentStep = (step) => {
    const errors = {};
    if (step === 1) {
      const fnErr = validateName(firstName, "First Name");
      if (fnErr) errors.firstName = fnErr;

      const lnErr = validateName(lastName, "Last Name");
      if (lnErr) errors.lastName = lnErr;

      const emErr = validateEmail(email);
      if (emErr) errors.email = emErr;

      const phErr = validatePhone(phoneValue, true, "Mobile");
      if (phErr) errors.phone = phErr;

      const altErr = validatePhone(altPhoneValue, false, "Alternate Phone");
      if (altErr) errors.altPhone = altErr;

      if (!country) errors.country = "Country is required.";
      if (!stateProv) errors.state = `${stateLabel} is required.`;

      const cErr = validateCity(city);
      if (cErr) errors.city = cErr;

      const zErr = validatePostalCode(postalCode, country);
      if (zErr) errors.postalCode = zErr;

      const a1Err = validateAddress(address1, true, "Address Line 1");
      if (a1Err) errors.address1 = a1Err;

      const a2Err = validateAddress(address2, false, "Address Line 2");
      if (a2Err) errors.address2 = a2Err;
    } else if (step === 2) {
      if (!qualification) errors.qualification = "Highest Qualification is required.";
      const skErr = validateListField(skills, "Skills / Technologies", true);
      if (skErr) errors.skills = skErr;

      const lgErr = validateListField(languages, "Spoken Languages", false);
      if (lgErr) errors.languages = lgErr;

      if (!teachingMode) errors.teachingMode = "Teaching Mode is required.";
    } else if (step === 3) {
      if (!availStart) errors.availableStart = "Start Time is required.";
      if (!availEnd) errors.availableEnd = "End Time is required.";
      else if (availEnd <= availStart) errors.availableEnd = "End Time must be AFTER Start Time.";
    } else if (step === 4) {
      if (payoutMethod) {
        const pErr = validatePayoutIdentifier(payoutId, payoutMethod);
        if (pErr) errors.payoutIdentifier = pErr;
      }
    } else if (step === 5) {
      if (assignInternship) {
        const aiErr = validateAssignInternship(assignInternship);
        if (aiErr) errors.assignInternship = aiErr;
      }
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  /* ─── Submit Step 1: validate & trigger OTP ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemId) return;

    // Validate all 5 steps
    for (let s = 1; s <= 5; s++) {
      if (!validateCurrentStep(s)) {
        setCurrentStep(s);
        showModalAlert(`Please resolve the errors in Step ${s} before saving.`, "Validation Error", "error");
        return;
      }
    }

    setSubmitting(true);

    const form = e.currentTarget;
    try {
      const fd = new FormData(form);
      const availableDays = fd.getAll("availableDays");

      if (availableDays.length === 0) {
        setCurrentStep(3);
        showModalAlert("Please select at least one weekday.", "Validation Error", "error");
        setSubmitting(false);
        return;
      }

      if (availStart && availEnd && availEnd <= availStart) {
        setCurrentStep(3);
        showModalAlert("End Time must be AFTER Start Time.", "Validation Error", "error");
        setSubmitting(false);
        return;
      }

      for (let i = 0; i < (prefSlots || []).length; i++) {
        const s = prefSlots[i];
        if (!s.start || !s.end) {
          setCurrentStep(3);
          showModalAlert(`Slot ${i + 1}: Please fill in both Start and End times.`, "Validation Error", "error");
          setSubmitting(false);
          return;
        }
        if (!(s.start < s.end)) {
          setCurrentStep(3);
          showModalAlert(`Preferable Slot ${i + 1}: End must be after Start.`, "Validation Error", "error");
          setSubmitting(false);
          return;
        }
        if (availStart && s.start < availStart) {
          setCurrentStep(3);
          showModalAlert(`Slot ${i + 1}: Start must be ≥ overall Start (${availStart}).`, "Validation Error", "error");
          setSubmitting(false);
          return;
        }
        if (availEnd && s.end > availEnd) {
          setCurrentStep(3);
          showModalAlert(`Slot ${i + 1}: End must be ≤ overall End (${availEnd}).`, "Validation Error", "error");
          setSubmitting(false);
          return;
        }
      }

      const cleanedSlots = (prefSlots || []).map((s) => ({ start: s.start, end: s.end }));

      const sorted = cleanedSlots
        .map((s, idx) => ({ ...s, __idx: idx }))
        .sort((a, b) => a.start.localeCompare(b.start));

      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].start < sorted[i - 1].end) {
          setCurrentStep(3);
          showModalAlert("Preferable Time Slots cannot overlap.", "Validation Error", "error");
          setSubmitting(false);
          return;
        }
      }

      const ndaSigned = fd.get("ndaSigned") === "on";
      const agreeToTerms = fd.get("agreeToTerms") === "on";

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phoneValue.trim(),
        altPhone: altPhoneValue.trim(),
        country,
        state: stateProv,
        city: city.trim(),
        postalCode: postalCode.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        qualification,
        experienceYears: experienceYears !== "" ? Number(experienceYears) : null,
        organization: organization.trim(),
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
        teachingMode,
        bio: bio.trim(),
        availableDays,
        availableStart: availStart || "",
        availableEnd: availEnd || "",
        timezone: tz,
        preferableSlots: cleanedSlots,
        rateType,
        expectedRate: expectedRate !== "" ? Number(expectedRate) : null,
        currency,
        payoutMethod,
        payoutIdentifier: payoutId.trim(),
        backgroundCheck,
        ndaSigned,
        agreeToTerms,
        assignInternship: assignInternship.trim(),
        notes: notes.trim(),
      };

      const resume = fd.get("resume");
      const photo = fd.get("photo");
      const certs = fd.getAll("certificates");

      const formData = new FormData();
      formData.append(
        "payload",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );

      if (resume instanceof File && resume.size) formData.append("resume", resume);
      if (photo instanceof File && photo.size) formData.append("photo", photo);
      (certs || [])
        .filter((f) => f && f.size)
        .forEach((file) => formData.append("certificates", file));

      const emailForOtp = payload.email;
      if (!emailForOtp) {
        showModalAlert("Email is required to send OTP.", "Error", "error");
        setSubmitting(false);
        return;
      }

      await axios.post("/api/instructors/otp/start", { email: emailForOtp }, authCfg());

      setPendingFormData(formData);
      setPendingId(itemId);
      setOtpEmail(emailForOtp);
      setOtpOpen(true);
    } catch (err) {
      console.error("Edit start failed:", err);
      showModalAlert(err?.response?.data?.message || "Failed to start OTP for update.", "Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Submit Step 2: verify OTP then PUT ─── */
  const doVerifyAndSave = async () => {
    if (!pendingId || !pendingFormData) return;

    try {
      setIsVerifying(true);
      await axios.post(
        "/api/instructors/otp/verify",
        { email: otpEmail, otp: otpCode },
        authCfg()
      );

      const { data } = await axios.put(
        `/api/instructors/${pendingId}`,
        pendingFormData,
        authCfg()
      );

      onSaved?.(data);
      setOtpOpen(false);
      setOtpCode("");
      setPendingFormData(null);
      setPendingId(null);
    } catch (err) {
      console.error("Verify/Save failed:", err);
      showModalAlert(err?.response?.data?.message || "Invalid OTP or update failed.", "Error", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!open || !portalTarget) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[28px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] flex flex-col overflow-hidden border border-slate-200/70">
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Instructor Details</h2>
            {(item?.firstName || item?.lastName) && (
              <p className="text-xs text-slate-400 mt-0.5">
                {item.firstName} {item.lastName}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* ── Body ── */}
        <div id="wizard-scroll-container" className="p-7 overflow-y-auto flex-1 min-h-[400px]">
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-7" noValidate>
            {/* ── Personal & Contact ── */}
            <div className={currentStep === 1 ? 'block animate-fade-in' : 'hidden'}>
              <FormSection title="Personal & Contact" icon={faEnvelope}>
                <Field label="First Name" required>
                  <input
                    name="firstName"
                    required
                    className={`${inputCls} ${
                      fieldErrors.firstName ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={firstName}
                    placeholder="e.g., Priya"
                    maxLength={50}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^a-zA-Z0-9À-ÿ\s.'-]/g, "");
                      const formatted = capitalizeFirstLetter(clean);
                      setFirstName(formatted);
                      if (!formatted.trim()) {
                        clearFieldError("firstName");
                      } else {
                        const error = validateName(formatted, "First Name");
                        if (error) setFieldError("firstName", error);
                        else clearFieldError("firstName");
                      }
                    }}
                    onBlur={(e) => {
                      const formatted = capitalizeFirstLetter(e.target.value.trim());
                      setFirstName(formatted);
                      const error = validateName(formatted, "First Name");
                      if (error) setFieldError("firstName", error);
                      else clearFieldError("firstName");
                    }}
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                  )}
                </Field>

                <Field label="Last Name" required>
                  <input
                    name="lastName"
                    required
                    className={`${inputCls} ${
                      fieldErrors.lastName ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={lastName}
                    placeholder="e.g., Sharma"
                    maxLength={50}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^a-zA-Z0-9À-ÿ\s.'-]/g, "");
                      const formatted = capitalizeFirstLetter(clean);
                      setLastName(formatted);
                      if (!formatted.trim()) {
                        clearFieldError("lastName");
                      } else {
                        const error = validateName(formatted, "Last Name");
                        if (error) setFieldError("lastName", error);
                        else clearFieldError("lastName");
                      }
                    }}
                    onBlur={(e) => {
                      const formatted = capitalizeFirstLetter(e.target.value.trim());
                      setLastName(formatted);
                      const error = validateName(formatted, "Last Name");
                      if (error) setFieldError("lastName", error);
                      else clearFieldError("lastName");
                    }}
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                  )}
                </Field>

                <Field label="Email" required>
                  <input
                    type="email"
                    name="email"
                    required
                    className={`${inputCls} ${
                      fieldErrors.email ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={email}
                    placeholder="name@example.com"
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setEmail(val);
                      if (!val) {
                        clearFieldError("email");
                      } else {
                        const error = validateEmail(val);
                        if (error) setFieldError("email", error);
                        else clearFieldError("email");
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      const error = validateEmail(val);
                      if (error) setFieldError("email", error);
                      else clearFieldError("email");
                    }}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                  )}
                </Field>

                <Field label="Mobile" required>
                  <PhoneInputWithCountry
                    name="phone"
                    required
                    value={phoneValue}
                    onChange={(e) => {
                      setPhoneValue(e.target.value);
                      const digits = (e.target.value || "").replace(/\D/g, "");
                      if (digits.length >= 10) clearFieldError("phone");
                    }}
                    onBlur={() => {
                      const err = validatePhone(phoneValue, true, "Mobile");
                      if (err) setFieldError("phone", err);
                      else clearFieldError("phone");
                    }}
                    error={Boolean(fieldErrors.phone)}
                  />
                  <input type="hidden" name="phone" value={phoneValue} />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                  )}
                </Field>

                <Field label="Alternate Phone">
                  <PhoneInputWithCountry
                    name="altPhone"
                    value={altPhoneValue}
                    onChange={(e) => {
                      setAltPhoneValue(e.target.value);
                      const digits = (e.target.value || "").replace(/\D/g, "");
                      if (!digits || digits.length >= 10) clearFieldError("altPhone");
                    }}
                    onBlur={() => {
                      const err = validatePhone(altPhoneValue, false, "Alternate Phone");
                      if (err) setFieldError("altPhone", err);
                      else clearFieldError("altPhone");
                    }}
                    error={Boolean(fieldErrors.altPhone)}
                  />
                  <input type="hidden" name="altPhone" value={altPhoneValue} />
                  {fieldErrors.altPhone && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.altPhone}</p>
                  )}
                </Field>

                <Field label="Country" required>
                  <CustomSelect
                    name="country"
                    required
                    value={country}
                    placeholder="Select"
                    options={[
                      { value: "United States", label: "United States" },
                      { value: "Canada", label: "Canada" },
                    ]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCountry(val);
                      setStateProv("");
                      setCity("");
                      setPostalCode("");
                      setAddress1("");
                      setAddress2("");
                      clearFieldError("city");
                      clearFieldError("postalCode");
                    }}
                  />
                </Field>

                <Field label={stateLabel} required>
                  <CustomSelect
                    name="state"
                    required
                    disabled={!country}
                    value={stateProv}
                    placeholder={country ? `Select ${stateLabel}` : "Select country first"}
                    options={stateList.map((s) => ({ value: s, label: s }))}
                    onChange={(e) => {
                      setStateProv(e.target.value);
                      clearFieldError("state");
                    }}
                  />
                  {fieldErrors.state && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.state}</p>
                  )}
                </Field>

                <Field label="City" required>
                  <input
                    name="city"
                    required
                    className={`${inputCls} ${
                      fieldErrors.city ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={city}
                    placeholder={cityPlaceholder}
                    maxLength={50}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s.'-]/g, "");
                      setCity(clean);
                      if (!clean.trim()) {
                        clearFieldError("city");
                      } else if (clean.trim().length >= 2) {
                        const err = validateCity(clean);
                        if (err) setFieldError("city", err);
                        else clearFieldError("city");
                      } else {
                        clearFieldError("city");
                      }
                    }}
                    onBlur={(e) => {
                      const err = validateCity(e.target.value);
                      if (err) setFieldError("city", err);
                      else clearFieldError("city");
                    }}
                  />
                  {fieldErrors.city && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>
                  )}
                </Field>

                <Field label={postalLabel} required>
                  <input
                    name="postalCode"
                    required
                    className={`${inputCls} ${
                      fieldErrors.postalCode ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={postalCode}
                    placeholder={country === "Canada" ? "M5V 3L9" : "95113"}
                    maxLength={country === "Canada" ? 7 : 10}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (country === "Canada") {
                        val = val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
                        if (val.length > 3) {
                          val = `${val.slice(0, 3)} ${val.slice(3)}`;
                        }
                      } else {
                        val = val.replace(/\D/g, "").slice(0, 9);
                        if (val.length > 5) {
                          val = `${val.slice(0, 5)}-${val.slice(5)}`;
                        }
                      }
                      setPostalCode(val);
                      if (!val) {
                        clearFieldError("postalCode");
                      } else {
                        const err = validatePostalCode(val, country);
                        if (!err) clearFieldError("postalCode");
                      }
                    }}
                    onBlur={(e) => {
                      const err = validatePostalCode(e.target.value, country);
                      if (err) setFieldError("postalCode", err);
                      else clearFieldError("postalCode");
                    }}
                  />
                  {fieldErrors.postalCode && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.postalCode}</p>
                  )}
                </Field>

                <Field label="Address Line 1" required span={2}>
                  <input
                    name="address1"
                    required
                    className={`${inputCls} ${
                      fieldErrors.address1 ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={address1}
                    placeholder={address1Placeholder}
                    maxLength={120}
                    onChange={(e) => {
                      setAddress1(e.target.value);
                      if (!e.target.value.trim()) {
                        clearFieldError("address1");
                      } else {
                        const err = validateAddress(e.target.value, true, "Address Line 1");
                        if (err) setFieldError("address1", err);
                        else clearFieldError("address1");
                      }
                    }}
                    onBlur={(e) => {
                      const err = validateAddress(e.target.value, true, "Address Line 1");
                      if (err) setFieldError("address1", err);
                      else clearFieldError("address1");
                    }}
                  />
                  {fieldErrors.address1 && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.address1}</p>
                  )}
                </Field>

                <Field label="Address Line 2">
                  <input
                    name="address2"
                    className={`${inputCls} ${
                      fieldErrors.address2 ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={address2}
                    placeholder="Optional"
                    maxLength={120}
                    onChange={(e) => {
                      setAddress2(e.target.value);
                      if (!e.target.value.trim()) {
                        clearFieldError("address2");
                      } else {
                        const err = validateAddress(e.target.value, false, "Address Line 2");
                        if (err) setFieldError("address2", err);
                        else clearFieldError("address2");
                      }
                    }}
                    onBlur={(e) => {
                      const err = validateAddress(e.target.value, false, "Address Line 2");
                      if (err) setFieldError("address2", err);
                      else clearFieldError("address2");
                    }}
                  />
                  {fieldErrors.address2 && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.address2}</p>
                  )}
                </Field>
              </FormSection>
            </div>

            {/* ── Professional & Teaching ── */}
            <div className={currentStep === 2 ? 'block animate-fade-in' : 'hidden'}>
              <FormSection title="Professional & Teaching" icon={faStar}>
                <Field label="Highest Qualification" required>
                  <CustomSelect
                    name="qualification"
                    required
                    value={qualification}
                    placeholder="Select"
                    options={[
                      { value: "Diploma", label: "Diploma" },
                      { value: "Bachelor", label: "Bachelor" },
                      { value: "Master", label: "Master" },
                      { value: "PhD", label: "PhD" },
                      { value: "Other", label: "Other" },
                    ]}
                    onChange={(e) => {
                      setQualification(e.target.value);
                      clearFieldError("qualification");
                    }}
                  />
                  {fieldErrors.qualification && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.qualification}</p>
                  )}
                </Field>

                <Field label="Years of Experience">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    name="experienceYears"
                    className={inputCls}
                    value={experienceYears}
                    placeholder="e.g., 3"
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </Field>

                <Field label="Current / Recent Organization">
                  <input
                    name="organization"
                    className={inputCls}
                    value={organization}
                    maxLength={100}
                    placeholder="Company / Institute"
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </Field>

                <Field label="Skills / Technologies" required>
                  <input
                    name="skills"
                    autoComplete="off"
                    spellCheck="false"
                    required
                    className={`${inputCls} ${
                      fieldErrors.skills ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={skills}
                    placeholder="e.g., MongoDB, Node.js, AWS (comma-separated)"
                    onChange={(e) => {
                      setSkills(e.target.value);
                      if (!e.target.value.trim()) {
                        clearFieldError("skills");
                      } else {
                        const err = validateListField(e.target.value, "Skills / Technologies", true);
                        if (err) setFieldError("skills", err);
                        else clearFieldError("skills");
                      }
                    }}
                    onBlur={(e) => {
                      const err = validateListField(e.target.value, "Skills / Technologies", true);
                      if (err) setFieldError("skills", err);
                      else clearFieldError("skills");
                    }}
                  />
                  {fieldErrors.skills && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.skills}</p>
                  )}
                </Field>

                <Field label="Spoken Languages">
                  <input
                    name="languages"
                    autoComplete="off"
                    spellCheck="false"
                    className={`${inputCls} ${
                      fieldErrors.languages ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={languages}
                    placeholder="e.g., English, Spanish (comma-separated)"
                    onChange={(e) => {
                      setLanguages(e.target.value);
                      if (!e.target.value.trim()) {
                        clearFieldError("languages");
                      } else {
                        const err = validateListField(e.target.value, "Spoken Languages", false);
                        if (err) setFieldError("languages", err);
                        else clearFieldError("languages");
                      }
                    }}
                    onBlur={(e) => {
                      const err = validateListField(e.target.value, "Spoken Languages", false);
                      if (err) setFieldError("languages", err);
                      else clearFieldError("languages");
                    }}
                  />
                  {fieldErrors.languages && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.languages}</p>
                  )}
                </Field>

                <Field label="Teaching Mode" required>
                  <CustomSelect
                    name="teachingMode"
                    required
                    value={teachingMode}
                    placeholder="Select"
                    options={[
                      { value: "Online", label: "Online" },
                      { value: "Offline", label: "Offline" },
                      { value: "Hybrid", label: "Hybrid" },
                    ]}
                    onChange={(e) => {
                      setTeachingMode(e.target.value);
                      clearFieldError("teachingMode");
                    }}
                  />
                  {fieldErrors.teachingMode && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.teachingMode}</p>
                  )}
                </Field>

                <Field label="Short Bio / Summary" span={3}>
                  <textarea
                    name="bio"
                    rows={3}
                    className={textareaCls}
                    value={bio}
                    maxLength={1000}
                    placeholder="Brief profile to show on your site"
                    onChange={(e) => setBio(e.target.value)}
                  />
                </Field>
              </FormSection>
            </div>

            {/* ── Availability ── */}
            <div className={currentStep === 3 ? 'block animate-fade-in' : 'hidden'}>
              <FormSection title="Availability" icon={faClock}>
                <div className="md:col-span-3">
                  <label className={labelCls}>
                    Weekdays <span className="text-rose-500">*</span>
                  </label>

                  <div
                    role="group"
                    aria-label="Weekdays"
                    className="mt-2 grid grid-cols-4 sm:grid-cols-7 gap-2"
                  >
                    {dayOpts.map((d) => {
                      const checked = Array.isArray(item?.availableDays)
                        ? item.availableDays.includes(d)
                        : false;

                      return (
                        <label key={d} className="relative block cursor-pointer">
                          <input
                            type="checkbox"
                            name="availableDays"
                            value={d}
                            defaultChecked={checked}
                            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                          <span className="flex h-11 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 shadow-sm transition-all duration-150 peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-600 peer-checked:text-white peer-checked:border-blue-500 peer-checked:shadow-md peer-checked:shadow-cyan-200/70 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400 hover:border-cyan-300">
                            {d}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <Field label="Start Time (24h)" required>
                  <CustomTimePicker
                    name="availableStart"
                    inputRef={startRef}
                    required
                    value={availStart}
                    onChange={(e) => {
                      setAvailStart(e.target.value);
                      clearFieldError("availableStart");
                    }}
                  />
                  {fieldErrors.availableStart && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.availableStart}</p>
                  )}
                </Field>

                <Field label="End Time (24h)" required>
                  <CustomTimePicker
                    name="availableEnd"
                    inputRef={endRef}
                    required
                    value={availEnd}
                    onChange={(e) => {
                      setAvailEnd(e.target.value);
                      clearFieldError("availableEnd");
                    }}
                  />
                  {fieldErrors.availableEnd && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.availableEnd}</p>
                  )}
                </Field>

                <Field label="Timezone">
                  <CustomSelect
                    name="timezone"
                    value={tz}
                    placeholder="Select timezone"
                    options={TIMEZONES_US_MX.map((z) => ({ value: z, label: z }))}
                    onChange={(e) => setTz(e.target.value)}
                  />
                </Field>

                <div className="md:col-span-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Preferable Time Slots{" "}
                      <span className="text-slate-400 font-normal normal-case">
                        (optional)
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={addPrefSlot}
                      disabled={!availStart || !availEnd}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 text-blue-700 text-xs font-semibold border border-cyan-100 hover:from-cyan-100 hover:to-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> Add Slot
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1">
                    Must fall within your overall start &amp; end times.
                  </p>

                  <div className="mt-3 space-y-3">
                    {prefSlots.length === 0 ? (
                      <div className="text-xs text-slate-500 italic py-3 text-center border border-dashed border-cyan-200 bg-white/70 rounded-xl">
                        No preferable slots added. Set times above, then click "Add Slot."
                      </div>
                    ) : (
                      prefSlots.map((s, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end bg-gradient-to-r from-white to-cyan-50/50 rounded-2xl p-3 border border-cyan-100 shadow-sm"
                        >
                          <div className="md:col-span-3">
                            <label className={labelCls}>Slot {idx + 1}: Start</label>
                            <CustomTimePicker
                              value={s.start}
                              inputRef={(el) => (prefStartRefs.current[idx] = el)}
                              onChange={(e) => updatePrefSlot(idx, "start", e.target.value)}
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className={labelCls}>Slot {idx + 1}: End</label>
                            <CustomTimePicker
                              value={s.end}
                              inputRef={(el) => (prefEndRefs.current[idx] = el)}
                              onChange={(e) => updatePrefSlot(idx, "end", e.target.value)}
                            />
                          </div>

                          <div className="md:col-span-1">
                            <button
                              type="button"
                              onClick={() => removePrefSlot(idx)}
                              className="w-full h-11 rounded-xl border border-rose-200 text-rose-600 bg-white text-sm font-medium hover:bg-rose-50 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </FormSection>
            </div>

            {/* ── Compensation / Payout ── */}
            <div className={currentStep === 4 ? 'block animate-fade-in' : 'hidden'}>
              <FormSection title="Compensation / Payout" icon={faDollarSign}>
                <Field label="Rate Type">
                  <CustomSelect
                    name="rateType"
                    value={rateType}
                    options={[
                      { value: "Hourly", label: "Hourly" },
                      { value: "Per Session", label: "Per Session" },
                      { value: "Fixed", label: "Fixed" },
                    ]}
                    onChange={(e) => setRateType(e.target.value)}
                  />
                </Field>

                <Field label="Expected Rate">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="expectedRate"
                    className={inputCls}
                    value={expectedRate}
                    placeholder="e.g., 1500"
                    onChange={(e) => setExpectedRate(e.target.value)}
                  />
                </Field>

                <Field label="Currency">
                  <CustomSelect
                    name="currency"
                    value={currency}
                    options={[
                      { value: "USD", label: "USD" },
                      { value: "CAD", label: "CAD" },
                      { value: "EUR", label: "EUR" },
                    ]}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </Field>

                <Field label="Preferred Payout Method">
                  <CustomSelect
                    name="payoutMethod"
                    value={payoutMethod}
                    placeholder="Select payout method"
                    options={(country === "Canada"
                      ? ["EFT (CA Bank)", "Interac e-Transfer", "PayPal"]
                      : ["ACH (US Bank)", "Zelle", "PayPal"]
                    ).map((m) => ({ value: m, label: m }))}
                    onChange={(e) => {
                      setPayoutMethod(e.target.value);
                      clearFieldError("payoutIdentifier");
                    }}
                  />
                </Field>

                <Field label="Payout Identifier" span={2}>
                  <input
                    name="payoutIdentifier"
                    className={`${inputCls} ${
                      fieldErrors.payoutIdentifier ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={payoutId}
                    placeholder={payIdPlaceholder}
                    required={Boolean(payoutMethod)}
                    onChange={(e) => {
                      setPayoutId(e.target.value);
                      if (!e.target.value.trim()) {
                        if (payoutMethod) setFieldError("payoutIdentifier", "Payout Identifier is required.");
                        else clearFieldError("payoutIdentifier");
                      } else {
                        const err = validatePayoutIdentifier(e.target.value, payoutMethod);
                        if (err) setFieldError("payoutIdentifier", err);
                        else clearFieldError("payoutIdentifier");
                      }
                    }}
                    onBlur={(e) => {
                      const err = validatePayoutIdentifier(e.target.value, payoutMethod);
                      if (err) setFieldError("payoutIdentifier", err);
                      else clearFieldError("payoutIdentifier");
                    }}
                  />
                  {fieldErrors.payoutIdentifier && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.payoutIdentifier}</p>
                  )}
                  {payoutMethod && !fieldErrors.payoutIdentifier && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {payoutMethod === "ACH (US Bank)" && "Format: Routing Number | Last 4 digits"}
                      {payoutMethod === "Zelle" && "Enter your Zelle email or phone number."}
                      {payoutMethod === "EFT (CA Bank)" && "Format: Transit | Institution | Account"}
                      {payoutMethod === "Interac e-Transfer" && "Enter your Interac e-Transfer email."}
                      {payoutMethod === "PayPal" && "Enter your PayPal email."}
                    </p>
                  )}
                </Field>
              </FormSection>
            </div>

            {/* ── Compliance & Documents ── */}
            <div className={currentStep === 5 ? 'block animate-fade-in' : 'hidden'}>
              <FormSection title="Compliance & Documents" icon={faShieldAlt}>
                <Field label="Resume / CV (upload to replace)">
                  <input
                    type="file"
                    name="resume"
                    className={inputCls}
                    accept=".pdf,.doc,.docx"
                  />
                </Field>

                <Field label="Profile Photo (upload to replace)">
                  <input
                    type="file"
                    name="photo"
                    className={inputCls}
                    accept="image/*"
                  />
                </Field>

                <Field label="Certificates (upload to add)">
                  <input
                    type="file"
                    name="certificates"
                    className={inputCls}
                    accept=".pdf,.png,.jpg,.jpeg"
                    multiple
                  />
                </Field>

                <Field label="Background Check">
                  <CustomSelect
                    name="backgroundCheck"
                    value={backgroundCheck}
                    options={[
                      { value: "Pending", label: "Pending" },
                      { value: "Cleared", label: "Cleared" },
                      { value: "Not Required", label: "Not Required" },
                    ]}
                    onChange={(e) => setBackgroundCheck(e.target.value)}
                  />
                </Field>

                <div className="md:col-span-2 flex items-center gap-6">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="ndaSigned"
                      defaultChecked={!!item?.ndaSigned}
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-800">
                      NDA signed
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      defaultChecked={!!item?.agreeToTerms}
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-800">
                      I confirm all details are accurate
                    </span>
                  </label>
                </div>
              </FormSection>
            </div>

            {/* ── Assignment ── */}
            <div className={currentStep === 5 ? 'block animate-fade-in' : 'hidden'}>
              <FormSection title="Assignment" icon={faClipboardList}>
                <Field label="Assign to Internship (title or ID)">
                  <input
                    name="assignInternship"
                    className={`${inputCls} ${
                      fieldErrors.assignInternship ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : ""
                    }`}
                    value={assignInternship}
                    placeholder="e.g., MERN Bootcamp – 2025 Summer"
                    maxLength={100}
                    onChange={(e) => {
                      setAssignInternship(e.target.value);
                      if (!e.target.value.trim()) {
                        clearFieldError("assignInternship");
                      } else {
                        const err = validateAssignInternship(e.target.value);
                        if (err) setFieldError("assignInternship", err);
                        else clearFieldError("assignInternship");
                      }
                    }}
                    onBlur={(e) => {
                      const err = validateAssignInternship(e.target.value);
                      if (err) setFieldError("assignInternship", err);
                      else clearFieldError("assignInternship");
                    }}
                  />
                  {fieldErrors.assignInternship && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.assignInternship}</p>
                  )}
                </Field>

                <Field label="Notes" span={3}>
                  <textarea
                    name="notes"
                    rows={3}
                    className={textareaCls}
                    value={notes}
                    maxLength={1000}
                    placeholder="Internal notes"
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
              </FormSection>
            </div>

            {/* Wizard Footer */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-100 mt-8">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep((s) => Math.max(1, s - 1));
                  document.getElementById('wizard-scroll-container')?.scrollTo(0, 0);
                }}
                disabled={currentStep === 1}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  currentStep === 1
                    ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border border-slate-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                }`}
              >
                Back
              </button>

              <div className="flex items-center gap-3">
                {currentStep < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!validateCurrentStep(currentStep)) {
                        return;
                      }
                      if (currentStep === 3) {
                        const container = document.getElementById('wizard-scroll-container');
                        const boxes = container?.querySelectorAll('input[name="availableDays"]');
                        const anyChecked = Array.from(boxes || []).some((b) => b.checked);
                        if (!anyChecked) {
                          showModalAlert("Please select at least one weekday.", "Validation Error", "error");
                          return;
                        }
                        for (let i = 0; i < prefSlots.length; i++) {
                          const s = prefSlots[i];
                          if (s.start && s.end) {
                            if (!(s.start < s.end)) {
                              showModalAlert(`Slot ${i + 1}: End Time must be after Start Time.`, "Validation Error", "error");
                              return;
                            }
                            if (availStart && s.start < availStart) {
                              showModalAlert(`Slot ${i + 1}: Start Time must be ≥ overall Start (${availStart}).`, "Validation Error", "error");
                              return;
                            }
                            if (availEnd && s.end > availEnd) {
                              showModalAlert(`Slot ${i + 1}: End Time must be ≤ overall End (${availEnd}).`, "Validation Error", "error");
                              return;
                            }
                          }
                        }
                      }
                      setCurrentStep((s) => Math.min(5, s + 1));
                      document.getElementById('wizard-scroll-container')?.scrollTo(0, 0);
                    }}
                    className="px-7 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm shadow-md hover:bg-slate-800 active:scale-95 transition-all"
                  >
                    Next
                  </button>
                )}
                {currentStep === 5 && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2.5 px-7 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-200/70 hover:from-indigo-700 hover:via-violet-700 hover:to-fuchsia-700 disabled:opacity-50 active:scale-[0.98] transition-all duration-150"
                  >
                    {submitting ? "Saving..." : "Save Instructor"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ═══ OTP MODAL ═══ */}
      {otpOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 backdrop-blur-[3px]">
          <div className="bg-white rounded-[28px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] w-full max-w-sm p-7 border border-slate-200/70">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 flex items-center justify-center mb-5 shadow-sm">
              <FontAwesomeIcon icon={faEnvelope} className="text-violet-600 text-xl" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Verify Email</h3>

            <p className="text-sm text-slate-500 mb-5">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-700">{otpEmail}</span>
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otpCode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtpCode(v);
              }}
              className={`${inputCls} text-center text-lg tracking-[0.35em] font-bold mb-5`}
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOtpOpen(false);
                  setOtpCode("");
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isVerifying || otpCode.length < 6}
                onClick={doVerifyAndSave}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-violet-200/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                    Verifying...
                  </span>
                ) : (
                  "Verify & Save"
                )}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                disabled={isResending || isVerifying}
                className="text-xs text-violet-700 font-medium hover:underline disabled:opacity-50"
                onClick={async () => {
                  try {
                    setIsResending(true);
                    await axios.post("/api/instructors/otp/start", { email: otpEmail }, authCfg());
                    showModalAlert(`A new verification code has been sent to ${otpEmail}.`, "Verification Code Sent", "info");
                  } catch (err) {
                    showModalAlert(err?.response?.data?.message || "Failed to resend OTP. Please try again.", "Error", "error");
                  } finally {
                    setIsResending(false);
                  }
                }}
              >
                {isResending ? "Sending new code..." : "Didn't receive a code? Resend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CENTERED ALERT / MODAL ═══ */}
      {modalAlert.open && (
        <CenteredAlertModal
          open={modalAlert.open}
          title={modalAlert.title}
          message={modalAlert.message}
          type={modalAlert.type}
          onOk={() => setModalAlert((prev) => ({ ...prev, open: false }))}
        />
      )}
    </div>,
    portalTarget
  );
}
