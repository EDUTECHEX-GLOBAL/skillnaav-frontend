//File: InstructureManagement.js

import axios from "../../../../api/axiosInstance";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PhoneInputWithCountry from "./PhoneInputWithCountry";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faUserCheck,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faShieldAlt,
  faEnvelope,
  faPhone,
  faStar,
  faEllipsisV,
  faEye,
  faPen,
  faTrash,
  faCloudUploadAlt,
  faSpinner,
  faClock,
  faDollarSign,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import InstructureDetailsView from "./InstructureDetailsView";
import InstructorManagementedit from "./InstructorManagementedit";

/* ─── Shared UI tokens (same format as edit modal) ─── */
/* add "!mt-0" for alignment - 25-06-2026 */
const inputCls =
  "!mt-0 w-full min-w-0 max-w-full h-11 rounded-xl border border-slate-200 bg-white/95 px-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 hover:border-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-indigo-50 file:to-sky-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700";
const selectCls =
  "!mt-0 w-full min-w-0 max-w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 hover:border-slate-300 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748b%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2rem_1.2rem] bg-[right_0.75rem_center] bg-no-repeat pr-10";
const textareaCls =
  "!mt-0 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 hover:border-slate-300 min-h-[7rem] resize-y";
const labelCls =
  "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

const sectionThemes = {
  "Personal & Contact": {
    wrap: "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/40 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-sky-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-sky-300 after:via-indigo-200 after:to-transparent",
    icon: "text-sky-500 text-[10px]",
  },
  "Professional & Teaching": {
    wrap: "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-violet-50/25 to-fuchsia-50/35 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-violet-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-violet-300 after:via-fuchsia-200 after:to-transparent",
    icon: "text-violet-500 text-[10px]",
  },
  Availability: {
    wrap: "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-cyan-50/25 to-blue-50/35 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-cyan-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-cyan-300 after:via-blue-200 after:to-transparent",
    icon: "text-cyan-500 text-[10px]",
  },
  "Compensation / Payout": {
    wrap: "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/35 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-emerald-300 after:via-teal-200 after:to-transparent",
    icon: "text-emerald-500 text-[10px]",
  },
  "Compliance & Documents": {
    wrap: "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-amber-50/25 to-orange-50/35 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-amber-300 after:via-orange-200 after:to-transparent",
    icon: "text-amber-500 text-[10px]",
  },
  Assignment: {
    wrap: "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-rose-50/20 to-pink-50/30 p-5 shadow-sm shadow-slate-200/60",
    title:
      "text-xs font-bold text-rose-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-rose-300 after:via-pink-200 after:to-transparent",
    icon: "text-rose-500 text-[10px]",
  },
};

const defaultSectionTheme = {
  wrap: "rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-indigo-50/20 p-5 shadow-sm shadow-slate-200/60",
  title:
    "text-xs font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-indigo-300 after:to-transparent",
  icon: "text-indigo-500 text-[10px]",
};

const dayOpts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const INSTRUCTORS_PER_PAGE = 10;

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

const TIMEZONES_US_MX = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
  "America/St_Johns",
  "America/Regina",
  "America/Whitehorse",
  "America/Yellowknife",
  "America/Iqaluit",
];

const getPartnerToken = () => {
  const direct =
    localStorage.getItem("partnerToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("partnerJwt");
  if (direct) return direct;
  try {
    const raw =
      localStorage.getItem("partnerInfo") ||
      localStorage.getItem("partner") ||
      localStorage.getItem("partnerData");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj?.token || obj?.partnerToken || obj?.jwt || null;
  } catch {
    return null;
  }
};

const authHeaders = () => {
  const token = getPartnerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ─── badge ─── */
const Badge = ({ children, color = "slate" }) => {
  const map = {
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
    indigo: "bg-indigo-50 text-indigo-600 border border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border border-amber-100",
    rose: "bg-rose-50 text-rose-600 border border-rose-100",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${map[color] || map.slate}`}
    >
      {children}
    </span>
  );
};

/* ─── section wrapper ─── */
const FormSection = ({ title, icon, children }) => {
  const theme = sectionThemes[title] || defaultSectionTheme;

  return (
    <div className={`space-y-5 ${theme.wrap} max-w-full min-w-0 overflow-visible relative`}>
      <div className={theme.title}>
        {icon && <FontAwesomeIcon icon={icon} className={theme.icon} />}
        {title}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5 min-w-0">
        {children}
      </div>
    </div>
  );
};

/* ─── field wrapper ─── */
const Field = ({ label, required, span = 1, children }) => (
  <div
    className={`flex flex-col justify-start min-w-0 w-full ${span === 2 ? "md:col-span-2" : span === 3 ? "md:col-span-3" : ""}`}
  >
    <label className={labelCls}>
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

/* ─── Custom Select (prevents OS native popup overflow on mobile) ─── */
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
        type="text"
        name={name}
        value={value || ""}
        required={required}
        className="sr-only"
        tabIndex={-1}
        readOnly
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
        <div className="absolute z-[9999] left-0 right-0 w-full top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 box-border min-w-0 max-w-full">
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
      className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[3px] animate-fadeIn"
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

const InstructureManagement = () => {
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rateType, setRateType] = useState("");
  const [currency, setCurrency] = useState("");
  const [country, setCountry] = useState("");
  const [stateProv, setStateProv] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [altPhoneValue, setAltPhoneValue] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [tz, setTz] = useState("");
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [qualification, setQualification] = useState("");
  const [teachingMode, setTeachingMode] = useState("");
  const [backgroundCheck, setBackgroundCheck] = useState("");
  const [photoPreview, setPhotoPreview] = useState({
    open: false,
    src: "",
    alt: "",
  });
  const [otpOpen, setOtpOpen] = useState(false);
  const [availStart, setAvailStart] = useState("");
  const [availEnd, setAvailEnd] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pendingFormData, setPendingFormData] = useState(null);
  const [prefSlots, setPrefSlots] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  //25-09-2026
  const [fieldErrors, setFieldErrors] = useState({});

  const [modalAlert, setModalAlert] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const showModalAlert = (message, title = "Success", type = "success") => {
    setModalAlert({
      open: true,
      title,
      message,
      type,
    });
  };

  const alert = (msg) => showModalAlert(msg, "Error", "error");

  const [assignPopup, setAssignPopup] = useState({
    open: false,
    type: "success",
    made: 0,
    assignments: [],
    error: "",
  });

  const [assignStatus, setAssignStatus] = useState({
    open: false,
    type: "success",
    made: 0,
    assignments: [],
    error: "",
  });

  const formRef = useRef(null);
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const prefStartRefs = useRef([]);
  const prefEndRefs = useRef([]);
  const cityRef = useRef(null);
  const postalRef = useRef(null);
  const address1Ref = useRef(null);
  const address2Ref = useRef(null);
  const payoutRef = useRef(null); //25-09-2026
  const payoutIdentifierRef = useRef(null);
  const skillsRef = useRef(null);
  const languagesRef = useRef(null);

  const avatarInitials = (i) => {
    const a = [i?.firstName, i?.lastName]
      .filter(Boolean)
      .map((s) => (s || "").trim()[0]?.toUpperCase())
      .join("");
    return a || (i?.email?.[0] || "?").toUpperCase();
  };

  const openPhoto = (src, alt = "") =>
    setPhotoPreview({ open: true, src, alt });
  const closePhoto = () => setPhotoPreview({ open: false, src: "", alt: "" });

  const addPrefSlot = () =>
    setPrefSlots((prev) => [...prev, { start: "", end: "" }]);
  const updatePrefSlot = (idx, field, value) =>
    setPrefSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  const removePrefSlot = (idx) =>
    setPrefSlots((prev) => prev.filter((_, i) => i !== idx));

  useEffect(() => {
    if (country === "Canada") {
      if (
        payoutMethod &&
        !["EFT (CA Bank)", "Interac e-Transfer", "PayPal"].includes(
          payoutMethod,
        )
      )
        setPayoutMethod("");
    } else if (country === "United States") {
      if (
        payoutMethod &&
        !["ACH (US Bank)", "Zelle", "PayPal"].includes(payoutMethod)
      )
        setPayoutMethod("");
    }
  }, [country, payoutMethod]);

  useEffect(() => {
    const fetchInstructors = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/instructors", {
          params: { limit: 200 },
          headers: authHeaders(),
        });
        const raw = Array.isArray(data)
          ? data
          : data?.items ||
            data?.data ||
            data?.results ||
            data?.docs ||
            data?.instructors ||
            [];
        const items = Array.isArray(raw)
          ? raw
          : raw?.items || raw?.results || raw?.docs || raw?.instructors || [];
        setInstructors(items.map((d) => ({ id: d._id || d.id, ...d })));
      } catch (err) {
        console.error("fetchInstructors error:", err);
        const status = err?.response?.status;
        const msg =
          err?.response?.data?.message ||
          (status === 401
            ? "Session expired. Please login again."
            : status === 403
              ? "You don't have permission to view instructors."
              : "Failed to load instructors.");
        alert(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructors();
  }, []);

  useEffect(() => {
    if (!photoPreview.open) return;
    const onKey = (e) => e.key === "Escape" && closePhoto();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photoPreview.open]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenuId]);

  useEffect(() => {
    if (typeof document !== "undefined" && document.body) {
      setPortalTarget(document.body);
    }
  }, []);

  const stateList = country === "Canada" ? CA_PROVINCES : US_STATES;
  const stateLabel = country === "Canada" ? "Province / Territory" : "State";
  const postalLabel = country === "Canada" ? "Postal Code" : "ZIP Code";
  const phonePlaceholder =
    country === "Canada" ? "+1 (416) 555-1234" : "+1 (555) 555-1234";
  const cityPlaceholder =
    country === "Canada" ? "e.g., Toronto" : "e.g., San Jose";
  const address1Placeholder = "Street address, suite, unit";

  const payIdPlaceholder =
    payoutMethod === "ACH (US Bank)"
      ? "Routing & last-4 (e.g., 111000025 | ****1234)"
      : payoutMethod === "Zelle"
        ? "Zelle email or phone"
        : payoutMethod === "EFT (CA Bank)"
          ? "Transit|Institution|Account"
          : payoutMethod === "Interac e-Transfer"
            ? "Interac e-Transfer email"
            : "PayPal email";

  async function createInstructorWithFormData(fd) {
    const { data } = await axios.post("/api/instructors", fd, {
      headers: { ...authHeaders() },
    });
    return data;
  }

  const handleResumeAutofill = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await axios.post("/api/resume/parse", formData);
      const data = res.data;

      const form = formRef.current;
      if (!form) return;

      if (data.name) {
        const parts = data.name.trim().split(/\s+/);
        if (form.elements["firstName"])
          form.elements["firstName"].value = parts[0] || "";
        if (form.elements["lastName"])
          form.elements["lastName"].value = parts.slice(1).join(" ") || "";
      }
      if (data.email && form.elements["email"])
        form.elements["email"].value = data.email;
      if (data.phone) {
        setPhoneValue(data.phone);
      }
      if (data.linkedin && form.elements["linkedIn"])
        form.elements["linkedIn"].value = data.linkedin;
      if (data.portfolio && form.elements["portfolio"])
        form.elements["portfolio"].value = data.portfolio;
      if (data.summary && form.elements["bio"])
        form.elements["bio"].value = data.summary;

      if (data.education && data.education.length > 0) {
        const edu = data.education[0];
        if (form.elements["major"] && edu.degree)
          form.elements["major"].value = edu.degree;
      }

      if (data.skills && Array.isArray(data.skills)) {
        const skillsStr = data.skills.join(", ");
        if (form.elements["skills"]) form.elements["skills"].value = skillsStr;
      }

      if (data.languages && Array.isArray(data.languages)) {
        const spokenLangs = data.languages
          .map((l) => (typeof l === "object" ? l.language : l))
          .filter(Boolean);
        if (form.elements["languages"] && spokenLangs.length > 0) {
          form.elements["languages"].value = spokenLangs.join(", ");
        }
      }

      // Auto-attach the uploaded file to the required Resume/CV file input field
      if (form.elements["resume"]) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        form.elements["resume"].files = dataTransfer.files;
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse resume automatically. Please fill manually.");
    } finally {
      setIsExtracting(false);
      e.target.value = null;
    }
  };

  //add the below validations functions - 25-09-2026
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

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

  const validateCity = (value) => {
    return /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,49}$/.test(value.trim());
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

  const validatePostalCode = (value, country) => {
    const postalCode = (value || "").trim().toUpperCase();
    if (!postalCode) return false;

    if (country === "Canada") {
      return /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/.test(postalCode);
    }

    if (country === "United States") {
      return /^\d{5}(-\d{4})?$/.test(postalCode);
    }

    return (
      /^\d{5}(-\d{4})?$/.test(postalCode) ||
      /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/.test(postalCode)
    );
  };

  // 26-09-2026: character allow-lists per list-type field. Previously this
  // function only checked item length, so strings made up entirely of
  // symbols (e.g. "$*()((" ) passed validation because length rules were
  // satisfied even though no letters/numbers were present.
  const LIST_FIELD_PATTERNS = {
    "Spoken Languages": /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]*$/,
    "Skills / Technologies": /^[A-Za-z0-9À-ÿ][A-Za-zÀ-ÿ0-9\s+#./&-]*$/,
  };

  const validateListField = (value, fieldName) => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (items.length === 0) {
      return `${fieldName} is required.`;
    }

    const pattern = LIST_FIELD_PATTERNS[fieldName];

    for (const item of items) {
      if (item.length < 2) {
        return `Please enter valid ${fieldName.toLowerCase()}.`;
      }

      if (item.length > 50) {
        return `${fieldName} entries must be 50 characters or less.`;
      }

      // Reject entries that are only/mostly symbols (e.g. "$*()((" or "%%%55")
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

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!method) {
      if (input.includes("@") && !emailRegex.test(input)) {
        return "Please enter a valid email address with a valid domain (e.g., name@example.com).";
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
        return "Enter a valid Zelle email (e.g., name@example.com) or 10-digit phone number.";
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
        return "Enter a valid Interac e-Transfer email (e.g., name@example.com) or phone number.";
      }
    }

    if (method === "PayPal") {
      if (!emailRegex.test(input)) {
        return "Please enter a valid PayPal email address with a valid domain (e.g., name@example.com).";
      }
    }

    return "";
  };

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
      return "Please enter a valid Internship Title or ID (e.g., MERN Bootcamp – 2025 Summer or INT-1024).";
    }

    const validPattern = /^[a-zA-Z0-9\s\-_.():/&,#'"–—]+$/;
    if (!validPattern.test(input)) {
      return "Internship Title or ID contains invalid special characters.";
    }

    return "";
  };

  // 26-09-2026: maps each wizard step to the fieldErrors keys that belong to
  // it, so the Next/Submit buttons can be disabled while that step still has
  // an outstanding validation error instead of only checking on click.
  const stepFieldsMap = {
    1: ["firstName", "lastName", "email", "phone", "altPhone", "city", "postalCode"],
    2: ["skills", "languages"],
    3: [],
    4: ["payoutIdentifier"],
    5: ["assignInternship"],
  };

  const currentStepHasErrors = (stepFieldsMap[currentStep] || []).some(
    (f) => Boolean(fieldErrors[f]),
  );
  const formHasAnyErrors = Object.values(fieldErrors).some((msg) => Boolean(msg));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;

    try {
      const fd = new FormData(form);
      const firstName = (fd.get("firstName") || "").trim();
      const lastName = (fd.get("lastName") || "").trim();
      const email = (fd.get("email") || "").trim();
      const phone = (fd.get("phone") || "").trim();
      const altPhone = (fd.get("altPhone") || "").trim();
      const countryValue = (fd.get("country") || "").trim();
      const stateValue = (fd.get("state") || "").trim();
      const city = (fd.get("city") || "").trim();
      const postalCode = (fd.get("postalCode") || "").trim();
      const address1 = (fd.get("address1") || "").trim();

      // ── Step 1 Validation ──
      const firstNameErr = validateName(firstName, "First Name");
      if (firstNameErr) {
        setCurrentStep(1);
        setFieldError("firstName", firstNameErr);
        alert(firstNameErr);
        setSubmitting(false);
        return;
      }
      const lastNameErr = validateName(lastName, "Last Name");
      if (lastNameErr) {
        setCurrentStep(1);
        setFieldError("lastName", lastNameErr);
        alert(lastNameErr);
        setSubmitting(false);
        return;
      }
      if (!email) {
        setCurrentStep(1);
        setFieldError("email", "Email is required.");
        alert("Please enter Email in Step 1 (Personal & Contact).");
        setSubmitting(false);
        return;
      }
      const emailError = validateEmail(email);
      if (emailError) {
        setCurrentStep(1);
        setFieldError("email", emailError);
        alert(emailError);
        setSubmitting(false);
        return;
      }
      const digitsPhone = phone ? phone.replace(/\D/g, "") : "";
      if (!digitsPhone || digitsPhone.length < 9 || digitsPhone.length > 15) {
        setCurrentStep(1);
        setFieldError("phone", "Mobile must be a valid phone number (minimum 10 digits).");
        showModalAlert("Please enter a valid Mobile Number in Step 1 (Personal & Contact).", "Validation Error", "error");
        setSubmitting(false);
        return;
      }
      const digitsAltPhone = altPhone ? altPhone.replace(/\D/g, "") : "";
      if (digitsAltPhone && (digitsAltPhone.length < 9 || digitsAltPhone.length > 15)) {
        setCurrentStep(1);
        setFieldError("altPhone", "Alternate Phone must be a valid phone number.");
        showModalAlert("Please enter a valid Alternate Phone Number in Step 1.", "Validation Error", "error");
        setSubmitting(false);
        return;
      }
      if (!countryValue) {
        setCurrentStep(1);
        showModalAlert("Please select a Country in Step 1 (Personal & Contact).", "Validation Error", "error");
        setSubmitting(false);
        return;
      }
      if (!stateValue) {
        setCurrentStep(1);
        alert("Please select a State / Province in Step 1 (Personal & Contact).");
        setSubmitting(false);
        return;
      }
      if (!city) {
        setCurrentStep(1);
        setFieldError("city", "City is required.");
        alert("Please enter City in Step 1 (Personal & Contact).");
        setSubmitting(false);
        return;
      }
      if (!validateCity(city)) {
        setCurrentStep(1);
        const message = "Enter a valid city name using letters, spaces, hyphens, or apostrophes.";
        setFieldError("city", message);
        alert(message);
        setSubmitting(false);
        return;
      }
      if (!postalCode) {
        setCurrentStep(1);
        setFieldError("postalCode", "Postal Code / ZIP is required.");
        alert("Please enter Postal Code / ZIP in Step 1 (Personal & Contact).");
        setSubmitting(false);
        return;
      }
      if (!validatePostalCode(postalCode, countryValue)) {
        setCurrentStep(1);
        const message =
          countryValue === "Canada"
            ? "Enter a valid Canadian postal code, for example M5V 3L9."
            : "Enter a valid US ZIP code, for example 95113 or 95113-1234.";
        setFieldError("postalCode", message);
        alert(message);
        setSubmitting(false);
        return;
      }
      if (!address1) {
        setCurrentStep(1);
        setFieldError("address1", "Address Line 1 is required.");
        alert("Please enter Address Line 1 in Step 1 (Personal & Contact).");
        setSubmitting(false);
        return;
      }

      // ── Step 2 Validation ──
      const qualificationVal = (fd.get("qualification") || qualification || "").trim();
      const expYearsVal = (fd.get("experienceYears") || "").trim();
      const skills = (fd.get("skills") || "").trim();
      const languages = (fd.get("languages") || "").trim();
      const teachingModeVal = (fd.get("teachingMode") || teachingMode || "").trim();

      if (!skills) {
        setCurrentStep(2);
        setFieldError("skills", "Skills / Technologies is required.");
        alert("Please enter Skills / Technologies in Step 2 (Professional & Teaching).");
        setSubmitting(false);
        return;
      }

      const skillsError = validateListField(skills, "Skills / Technologies");
      if (skillsError) {
        setCurrentStep(2);
        setFieldError("skills", skillsError);
        alert(skillsError);
        setSubmitting(false);
        return;
      }

      if (!languages) {
        setCurrentStep(2);
        setFieldError("languages", "Spoken Languages is required.");
        alert("Please enter Spoken Languages in Step 2 (Professional & Teaching).");
        setSubmitting(false);
        return;
      }

      const languagesError = validateListField(languages, "Spoken Languages");
      if (languagesError) {
        setCurrentStep(2);
        setFieldError("languages", languagesError);
        alert(languagesError);
        setSubmitting(false);
        return;
      }

      if (!teachingModeVal) {
        setCurrentStep(2);
        alert("Please select a Teaching Mode in Step 2 (Professional & Teaching).");
        setSubmitting(false);
        return;
      }

      // ── Step 3 Validation ──
      const availableDays = fd.getAll("availableDays");
      const start = fd.get("availableStart");
      const end = fd.get("availableEnd");

      if (availableDays.length === 0 || !start || !end) {
        setCurrentStep(3);
        alert("Please select available days, start time, and end time in Step 3 (Availability).");
        setSubmitting(false);
        return;
      }

      if (start && end && end <= start) {
        setCurrentStep(3);
        alert("End Time must be AFTER Start Time.");
        setSubmitting(false);
        return;
      }

      for (let i = 0; i < (prefSlots || []).length; i++) {
        const s = prefSlots[i];
        if (!s.start || !s.end) {
          setCurrentStep(3);
          alert(`Slot ${i + 1}: Please fill in both Start and End times.`);
          setSubmitting(false);
          return;
        }
        if (!(s.start < s.end)) {
          setCurrentStep(3);
          alert(`Slot ${i + 1}: End Time must be after Start Time.`);
          setSubmitting(false);
          return;
        }
        if (start && s.start < start) {
          setCurrentStep(3);
          alert(`Slot ${i + 1}: Start must be on or after overall Start (${start}).`);
          setSubmitting(false);
          return;
        }
        if (end && s.end > end) {
          setCurrentStep(3);
          alert(`Slot ${i + 1}: End must be on or before overall End (${end}).`);
          setSubmitting(false);
          return;
        }
      }

      const cleanedSlots = (prefSlots || []).map((s) => ({ start: s.start, end: s.end }));

      // ── Step 4 Validation ──
      const payoutMethodValue = (fd.get("payoutMethod") || "").trim();
      const payoutIdentifier = (fd.get("payoutIdentifier") || "").trim();
      if (payoutMethodValue) {
        const payoutError = validatePayoutIdentifier(payoutIdentifier, payoutMethodValue);
        if (payoutError) {
          setCurrentStep(4);
          setFieldError("payoutIdentifier", payoutError);
          alert(payoutError);
          setSubmitting(false);
          return;
        }
      }

      // ── Step 5 Validation ──
      const resume = fd.get("resume");
      const photo = fd.get("photo");
      const certificates = fd.getAll("certificates");
      const ndaSigned = fd.get("ndaSigned") === "on";
      const agreeToTerms = fd.get("agreeToTerms") === "on";

      if (!resume || !(resume instanceof File) || resume.size === 0) {
        setCurrentStep(5);
        alert("Please upload a resume / CV file in Step 5 (Compliance & Documents).");
        setSubmitting(false);
        return;
      }

      if (!agreeToTerms) {
        setCurrentStep(5);
        alert("Please check 'I confirm all details are accurate' before saving.");
        setSubmitting(false);
        return;
      }

      const assignInternshipVal = (fd.get("assignInternship") || "").trim();
      const assignErr = validateAssignInternship(assignInternshipVal);
      if (assignErr) {
        setCurrentStep(5);
        setFieldError("assignInternship", assignErr);
        showModalAlert(assignErr, "Validation Error", "error");
        setSubmitting(false);
        return;
      }

      const payload = {
        firstName,
        lastName,
        email,
        phone: (phone || "").replace(/\D/g, ""),
        altPhone: (fd.get("altPhone") || "").replace(/\D/g, ""),
        country: countryValue,
        state: stateValue,
        city,
        postalCode,
        address1,
        address2: fd.get("address2") || "",
        qualification: qualificationVal,
        experienceYears: expYearsVal ? Number(expYearsVal) : null,
        organization: fd.get("organization") || "",
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
        teachingMode: teachingModeVal,
        bio: fd.get("bio") || "",
        availableDays,
        availableStart: start,
        availableEnd: end,
        timezone: fd.get("timezone") || "",
        preferableSlots: cleanedSlots,
        rateType: fd.get("rateType") || "",
        expectedRate: fd.get("expectedRate") ? Number(fd.get("expectedRate")) : null,
        currency: fd.get("currency") || "",
        payoutMethod: payoutMethodValue,
        payoutIdentifier,
        backgroundCheck: fd.get("backgroundCheck") || "Pending",
        ndaSigned,
        agreeToTerms,
        assignInternship: fd.get("assignInternship") || "",
        notes: fd.get("notes") || "",
      };

      const formData = new FormData();
      formData.append(
        "payload",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );
      formData.append("resume", resume);
      if (photo instanceof File && photo.size) formData.append("photo", photo);
      certificates.forEach((file) => {
        if (file instanceof File && file.size) formData.append("certificates", file);
      });

      const cleanEmail = email.trim();
      await axios.post(
        "/api/instructors/otp/start",
        { email: cleanEmail },
        { headers: authHeaders() },
      );

      setPendingFormData(formData);
      setOtpEmail(cleanEmail);
      setOtpCode("");
      setOtpOpen(true);
    } catch (err) {
      console.error("Start OTP failed:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to start OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignInstructor = async () => {
    try {
      setIsAssigning(true);
      const { data } = await axios.post(
        "/api/instructors/auto-assign",
        {},
        { headers: authHeaders() },
      );

      setIsAssigning(false);

      setAssignPopup({
        open: true,
        type: "success",
        made: Number(data.assignments_made || 0),
        assignments: Array.isArray(data.assignments) ? data.assignments : [],
        error: "",
      });
    } catch (err) {
      console.error("Assign Instructor failed:", err);
      setIsAssigning(false);

      setAssignPopup({
        open: true,
        type: "error",
        made: 0,
        assignments: [],
        error:
          err?.response?.status === 401
            ? "Session expired. Please log in again."
            : err?.response?.data?.message ||
              "Assign Instructor failed. Check server logs.",
      });
    }
  };

  const filteredInstructors = instructors.filter((i) => {
    const hay = [
      i.firstName,
      i.lastName,
      i.email,
      i.phone,
      ...(i.specializations || []),
      ...(i.skills || []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInstructors.length / INSTRUCTORS_PER_PAGE),
  );
  const hasMore = page < totalPages;
  const paginatedInstructors = filteredInstructors.slice(
    (page - 1) * INSTRUCTORS_PER_PAGE,
    page * INSTRUCTORS_PER_PAGE,
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/70">
      <div className="space-y-5 sm:space-y-7">
        {/* ── Top Bar ── */}
        <div className="rounded-[28px] border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-sm shadow-slate-200/60 px-4 sm:px-6 py-5 sm:py-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-5">
          <div className="min-w-0">
            <h1 className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">
              Instructor Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {filteredInstructors.length} instructor
              {filteredInstructors.length !== 1 && "s"} registered
            </p>
          </div>

          <div className="w-full lg:w-auto grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setViewing(null);
                setCountry("");
                setStateProv("");
                setQualification("");
                setTeachingMode("");
                setRateType("");
                setCurrency("");
                setBackgroundCheck("");
                setIsAddOpen(true);
                setCurrentStep(1);
              }}
              className="w-full min-w-0 justify-center inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shadow-lg shadow-violet-200/70 hover:from-indigo-700 hover:via-violet-700 hover:to-fuchsia-700 active:scale-[0.98] transition-all duration-150"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              Add Instructor
            </button>

            <button
              type="button"
              onClick={handleAssignInstructor}
              disabled={isAssigning}
              className="w-full min-w-0 justify-center inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shadow-lg shadow-amber-200/70 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-70 disabled:cursor-wait"
            >
              <FontAwesomeIcon icon={faUserCheck} className="text-xs" />
              {isAssigning ? "Assigning..." : "Auto-Assign"}
            </button>
          </div>
        </div>

        {/* ── Auto-Assign Status Card ── */}
        {assignStatus.open && (
          <div
            className={`rounded-[28px] border overflow-hidden shadow-sm shadow-slate-200/60 ${
              assignStatus.type === "success"
                ? "bg-white border-slate-200/70"
                : "bg-rose-50/70 border-rose-200/70"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 sm:px-7 py-4 sm:py-5 border-b border-slate-100 bg-white/70">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    assignStatus.type === "success"
                      ? "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600"
                      : "bg-gradient-to-br from-rose-100 to-orange-50 text-rose-600"
                  }`}
                >
                  <FontAwesomeIcon icon={faUserCheck} className="text-sm" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Auto-Assign Status
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5 break-words">
                    {assignStatus.type === "success"
                      ? `Assigned ${assignStatus.made} session${
                          assignStatus.made === 1 ? "" : "s"
                        } successfully.`
                      : assignStatus.error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAssignStatus({
                    open: false,
                    type: "success",
                    made: 0,
                    assignments: [],
                    error: "",
                  })
                }
                className="self-end sm:self-auto w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {assignStatus.type === "success" && (
              <div className="px-4 sm:px-7 py-5 sm:py-6">
                {assignStatus.assignments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assignStatus.assignments.map((row, idx) => {
                      const updatedCount = Number(row.sessionsUpdated || 0);

                      return (
                        <div
                          key={`${row.instructorId || "inst"}-${idx}`}
                          className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4"
                        >
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Instructor Name
                          </div>

                          <div className="text-sm font-semibold text-slate-800 break-all mt-1">
                            {row.instructorName || "—"}
                          </div>

                          <div className="mt-3 inline-flex max-w-full items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {updatedCount} session
                            {updatedCount === 1 ? "" : "s"} updated
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
                    Auto-assign completed, but there are no assignment rows to
                    display.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Details View ── */}
        {!isAddOpen && (
          <InstructureDetailsView
            open={Boolean(viewing)}
            item={viewing}
            onClose={() => setViewing(null)}
            autoDeletePrompt={Boolean(viewing?.__askDelete)}
            confirmOnly={Boolean(viewing?.__confirmOnly)}
            onDeleted={(id) =>
              setInstructors((prev) =>
                prev.filter((x) => (x._id || x.id) !== id),
              )
            }
          />
        )}

        {/* ═══ ADD INSTRUCTOR MODAL ═══ */}
        {isAddOpen &&
          portalTarget &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/45 backdrop-blur-[3px] overflow-y-auto"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl sm:rounded-[28px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] flex flex-col overflow-hidden border border-slate-200/70 my-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-7 py-3.5 sm:py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Register New Instructor
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fill in the details below to add a new instructor
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                {/* Body */}
                {/* ── Stepper ── */}
                {/* Mobile Stepper Header (< sm) */}
                <div className="flex sm:hidden items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      {currentStep}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {[
                          "Personal",
                          "Professional",
                          "Availability",
                          "Compensation",
                          "Compliance",
                        ][currentStep - 1]}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        (Step {currentStep} of 5)
                      </span>
                    </div>
                  </div>
                  <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Desktop Stepper (sm+) */}
                <div className="hidden sm:block px-7 py-3.5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between max-w-2xl mx-auto gap-2">
                    {[
                      { step: 1, label: "Personal" },
                      { step: 2, label: "Professional" },
                      { step: 3, label: "Availability" },
                      { step: 4, label: "Compensation" },
                      { step: 5, label: "Compliance" },
                    ].map((s, idx) => (
                      <div
                        key={s.step}
                        className={`flex items-center ${idx < 4 ? "flex-1" : ""}`}
                      >
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                              currentStep === s.step
                                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                                : currentStep > s.step
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white border-2 border-slate-200 text-slate-400"
                            }`}
                          >
                            {currentStep > s.step ? "✓" : s.step}
                          </div>
                          <span
                            className={`text-[10px] uppercase tracking-wider font-semibold text-center whitespace-nowrap ${currentStep === s.step ? "text-violet-700 font-bold" : "text-slate-400"}`}
                          >
                            {s.label}
                          </span>
                        </div>
                        {idx < 4 && (
                          <div
                            className={`flex-1 h-0.5 mx-2 rounded-full min-w-[8px] ${currentStep > s.step ? "bg-emerald-400" : "bg-slate-200"}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="p-3 sm:p-7 overflow-y-auto flex-1 min-h-[400px] bg-gradient-to-b from-slate-50/70 via-white to-slate-50/60"
                  id="wizard-scroll-container"
                >
                  <form
                    noValidate
                    autoComplete="off"
                    onSubmit={handleSubmit}
                    className="space-y-6 sm:space-y-7 w-full max-w-full"
                    ref={formRef}
                  >
                    {/* ── Personal & Contact ── */}
                    <div
                      className={
                        currentStep === 1 ? "block animate-fade-in" : "hidden"
                      }
                    >
                      <FormSection title="Personal & Contact" icon={faEnvelope}>
                        {/* Autofill from Resume */}
                        <div className="col-span-1 md:col-span-3 mb-4 bg-violet-50/50 rounded-2xl border border-violet-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-bold text-violet-900 flex items-center gap-2">
                              <FontAwesomeIcon
                                icon={faCloudUploadAlt}
                                className="text-violet-500"
                              />
                              Autofill from Resume
                            </h4>
                            <p className="text-xs text-violet-600/80 mt-1">
                              Upload a PDF or DOCX file to automatically
                              populate these fields.
                            </p>
                          </div>
                          <label
                            className={`relative inline-block ${isExtracting ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                          >
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleResumeAutofill}
                              disabled={isExtracting}
                              className="sr-only"
                            />
                            <div className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-md shadow-violet-200 hover:bg-violet-700 transition-all flex items-center gap-2 whitespace-nowrap">
                              {isExtracting ? (
                                <>
                                  <FontAwesomeIcon icon={faSpinner} spin />
                                  Parsing...
                                </>
                              ) : (
                                "Choose File"
                              )}
                            </div>
                          </label>
                        </div>

                        <Field label="First Name" required>
                          <input
                            name="firstName"
                            required
                            ref={firstNameRef}
                            className={`${inputCls} ${
                              fieldErrors.firstName
                                ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                                : ""
                            }`}
                            placeholder="e.g., Priya"
                            maxLength={50}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^a-zA-Z0-9À-ÿ\s.'-]/g, "");
                              const formatted = capitalizeFirstLetter(clean);
                              e.target.value = formatted;
                              e.currentTarget.setCustomValidity("");
                              if (!formatted.trim()) {
                                clearFieldError("firstName");
                                return;
                              }
                              const error = validateName(formatted, "First Name");
                              if (error) {
                                setFieldError("firstName", error);
                              } else {
                                clearFieldError("firstName");
                              }
                            }}
                            onBlur={(e) => {
                              const formatted = capitalizeFirstLetter(e.target.value.trim());
                              e.target.value = formatted;
                              if (!formatted) {
                                setFieldError("firstName", "First Name is required.");
                                return;
                              }
                              const error = validateName(formatted, "First Name");
                              if (error) {
                                setFieldError("firstName", error);
                              } else {
                                clearFieldError("firstName");
                              }
                            }}
                          />
                          {fieldErrors.firstName && (
                            <p className="mt-1 text-xs text-red-600">
                              {fieldErrors.firstName}
                            </p>
                          )}
                        </Field>

                        <Field label="Last Name" required>
                          <input
                            name="lastName"
                            required
                            ref={lastNameRef}
                            className={`${inputCls} ${
                              fieldErrors.lastName
                                ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                                : ""
                            }`}
                            placeholder="e.g., Sharma"
                            maxLength={50}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^a-zA-Z0-9À-ÿ\s.'-]/g, "");
                              const formatted = capitalizeFirstLetter(clean);
                              e.target.value = formatted;
                              e.currentTarget.setCustomValidity("");
                              if (!formatted.trim()) {
                                clearFieldError("lastName");
                                return;
                              }
                              const error = validateName(formatted, "Last Name");
                              if (error) {
                                setFieldError("lastName", error);
                              } else {
                                clearFieldError("lastName");
                              }
                            }}
                            onBlur={(e) => {
                              const formatted = capitalizeFirstLetter(e.target.value.trim());
                              e.target.value = formatted;
                              if (!formatted) {
                                setFieldError("lastName", "Last Name is required.");
                                return;
                              }
                              const error = validateName(formatted, "Last Name");
                              if (error) {
                                setFieldError("lastName", error);
                              } else {
                                clearFieldError("lastName");
                              }
                            }}
                          />
                          {fieldErrors.lastName && (
                            <p className="mt-1 text-xs text-red-600">
                              {fieldErrors.lastName}
                            </p>
                          )}
                        </Field>

                        <Field label="Email" required>
                          <input
                            type="email"
                            name="email"
                            required
                            ref={emailRef}
                            className={`${inputCls} ${
                              fieldErrors.email
                                ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                                : ""
                            }`}
                            placeholder="name@example.com"
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              e.currentTarget.setCustomValidity("");
                              if (!value) {
                                clearFieldError("email");
                                return;
                              }
                              const error = validateEmail(value);
                              if (error) {
                                setFieldError("email", error);
                              } else {
                                clearFieldError("email");
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (!value) {
                                setFieldError("email", "Email is required.");
                                return;
                              }
                              const error = validateEmail(value);
                              if (error) {
                                setFieldError("email", error);
                              } else {
                                clearFieldError("email");
                              }
                            }}
                          />
                          {fieldErrors.email && (
                            <p className="mt-1 text-xs text-red-600">
                              {fieldErrors.email}
                            </p>
                          )}
                        </Field>

                        {/* <Field label="Mobile" required>
                          <input
                            name="phone"
                            required
                            className={inputCls}
                            placeholder={phonePlaceholder}
                          />
                        </Field>

                        <Field label="Alternate Phone">
                          <input
                            name="altPhone"
                            className={inputCls}
                            placeholder={phonePlaceholder}
                          />
                        </Field> */}
                        {/* Phone and Alt Phone with Country Selector */}
                        <Field label="Mobile" required>
                          <PhoneInputWithCountry
                            name="phone"
                            required
                            value={phoneValue}
                            onChange={(e) => {
                              setPhoneValue(e.target.value);
                              const digits = e.target.value.replace(/\D/g, "");
                              if (digits.length >= 9) {
                                clearFieldError("phone");
                              }
                            }}
                            onBlur={() => {
                              const digits = (phoneValue || "").replace(/\D/g, "");
                              if (!digits) {
                                setFieldError("phone", "Mobile number is required.");
                              } else if (digits.length < 9 || digits.length > 15) {
                                setFieldError("phone", "Mobile must be a valid phone number (minimum 10 digits).");
                              } else {
                                clearFieldError("phone");
                              }
                            }}
                            error={Boolean(fieldErrors.phone)}
                          />
                          <input type="hidden" name="phone" value={phoneValue} />
                          {fieldErrors.phone && (
                            <p className="mt-1 text-xs text-red-600">
                              {fieldErrors.phone}
                            </p>
                          )}
                        </Field>

                        <Field label="Alternate Phone">
                          <PhoneInputWithCountry
                            name="altPhone"
                            value={altPhoneValue}
                            onChange={(e) => {
                              setAltPhoneValue(e.target.value);
                              const digits = e.target.value.replace(/\D/g, "");
                              if (!digits || digits.length >= 9) {
                                clearFieldError("altPhone");
                              }
                            }}
                            onBlur={() => {
                              const digits = (altPhoneValue || "").replace(/\D/g, "");
                              if (digits && (digits.length < 9 || digits.length > 15)) {
                                setFieldError("altPhone", "Alternate Phone must be a valid phone number.");
                              } else {
                                clearFieldError("altPhone");
                              }
                            }}
                            error={Boolean(fieldErrors.altPhone)}
                          />
                          <input type="hidden" name="altPhone" value={altPhoneValue} />
                          {fieldErrors.altPhone && (
                            <p className="mt-1 text-xs text-red-600">
                              {fieldErrors.altPhone}
                            </p>
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

                              if (cityRef.current) cityRef.current.value = "";
                              if (postalRef.current)
                                postalRef.current.value = "";
                              if (address1Ref.current)
                                address1Ref.current.value = "";
                              if (address2Ref.current)
                                address2Ref.current.value = "";

                              clearFieldError("city");
                              clearFieldError("postalCode");
                              clearFieldError("payoutIdentifier");
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
                            onChange={(e) => setStateProv(e.target.value)}
                          />
                        </Field>

                        <Field label="City" required>
                          <input
                            name="city"
                            required
                            ref={cityRef}
                            className={`${inputCls} ${
                              fieldErrors.city
                                ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                                : ""
                            }`}
                            placeholder={cityPlaceholder}
                            onChange={(e) => {
                              const value = e.target.value.trim();

                              e.currentTarget.setCustomValidity("");

                              if (!value) {
                                clearFieldError("city");
                                return;
                              }

                              if (value.length >= 2 && !validateCity(value)) {
                                setFieldError(
                                  "city",
                                  "Enter a valid city name using letters, spaces, hyphens, or apostrophes.",
                                );
                              } else {
                                clearFieldError("city");
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();

                              if (!value) {
                                setFieldError("city", "City is required.");
                                return;
                              }

                              if (!validateCity(value)) {
                                setFieldError(
                                  "city",
                                  "Enter a valid city name using letters, spaces, hyphens, or apostrophes.",
                                );
                              } else {
                                clearFieldError("city");
                              }
                            }}
                          />

                          {fieldErrors.city && (
                            <p className="mt-1 text-xs text-red-600">
                              {fieldErrors.city}
                            </p>
                          )}
                        </Field>

                        <Field label={postalLabel} required>
                          <input
                            name="postalCode"
                            required
                            ref={postalRef}
                            className={`${inputCls} ${
                              fieldErrors.postalCode
                                ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                                : ""
                            }`}
                            placeholder={
                              country === "Canada" ? "M5V 3L9" : "95113"
                            }
                            maxLength={country === "Canada" ? 7 : 10}
                            onChange={(e) => {
                              let value = e.target.value;

                              if (country === "Canada") {
                                value = value
                                  .replace(/[^a-zA-Z0-9]/g, "")
                                  .slice(0, 6)
                                  .toUpperCase();

                                if (value.length > 3) {
                                  value = `${value.slice(0, 3)} ${value.slice(3)}`;
                                }
                              } else {
                                value = value.replace(/\D/g, "").slice(0, 9);

                                if (value.length > 5) {
                                  value = `${value.slice(0, 5)}-${value.slice(5)}`;
                                }
                              }

                              e.target.value = value;
                              e.currentTarget.setCustomValidity("");

                              if (!value) {
                                clearFieldError("postalCode");
                                return;
                              }

                              if (
                                country === "Canada" &&
                                value.length === 7 &&
                                !validatePostalCode(value, country)
                              ) {
                                setFieldError(
                                  "postalCode",
                                  "Enter a valid Canadian postal code, for example M5V 3L9.",
                                );
                              } else if (
                                (country === "United States" || !country) &&
                                (value.length === 5 || value.length === 10) &&
                                !validatePostalCode(value, country)
                              ) {
                                setFieldError(
                                  "postalCode",
                                  "Enter a valid US ZIP code, for example 95113 or 95113-1234.",
                                );
                              } else {
                                clearFieldError("postalCode");
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();

                              if (!value) {
                                setFieldError(
                                  "postalCode",
                                  `${postalLabel} is required.`,
                                );
                                return;
                              }

                              if (!validatePostalCode(value, country)) {
                                setFieldError(
                                  "postalCode",
                                  country === "Canada"
                                    ? "Enter a valid Canadian postal code, for example M5V 3L9."
                                    : "Enter a valid US ZIP code, for example 95113 or 95113-1234.",
                                );
                              } else {
                                clearFieldError("postalCode");
                              }
                            }}
                          />

                          {fieldErrors.postalCode && (
                            <p className="mt-1 text-xs text-red-600">
                              {fieldErrors.postalCode}
                            </p>
                          )}

                          {!fieldErrors.postalCode && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              {/* {country === "Canada"
                                ? "Format: A1A 1A1"
                                : "Format: 12345 or 12345-6789"} */}
                            </p>
                          )}
                        </Field>

                        <Field label="Address Line 1" required span={2}>
                          <input
                            name="address1"
                            required
                            ref={address1Ref}
                            className={inputCls}
                            placeholder={address1Placeholder}
                          />
                        </Field>

                        <Field label="Address Line 2">
                          <input
                            name="address2"
                            ref={address2Ref}
                            className={inputCls}
                            placeholder="Optional"
                          />
                        </Field>
                      </FormSection>
                    </div>

                    {/* ── Professional & Teaching ── */}
                    <div
                      className={
                        currentStep === 2 ? "block animate-fade-in" : "hidden"
                      }
                    >
                      <FormSection
                        title="Professional & Teaching"
                        icon={faStar}
                      >
                        <Field label="Highest Qualification">
                          <CustomSelect
                            name="qualification"
                            value={qualification}
                            placeholder="Select"
                            options={[
                              { value: "Diploma", label: "Diploma" },
                              { value: "Bachelor", label: "Bachelor" },
                              { value: "Master", label: "Master" },
                              { value: "PhD", label: "PhD" },
                              { value: "Other", label: "Other" },
                            ]}
                            onChange={(e) => setQualification(e.target.value)}
                          />
                        </Field>

                        <Field label="Years of Experience">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            name="experienceYears"
                            className={inputCls}
                            placeholder="e.g., 3"
                          />
                        </Field>

                        <Field label="Current / Recent Organization">
                          <input
                            name="organization"
                            className={inputCls}
                            placeholder="Company / Institute"
                          />
                        </Field>

                        <Field label="Skills / Technologies" required>
                          <input
                            name="skills"
                            autoComplete="off"
                            spellCheck="false"
                            required
                            ref={skillsRef}
                            className={`${inputCls} ${
                              fieldErrors.skills
                                ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                                : ""
                            }`}
                            placeholder="e.g., MongoDB, Node.js"
                            onChange={(e) => {
                              const value = e.target.value.trim();

                              e.currentTarget.setCustomValidity("");

                              if (!value) {
                                clearFieldError("skills");
                                return;
                              }

                              const error = validateListField(
                                value,
                                "Skills / Technologies",
                              );

                              if (error) {
                                setFieldError("skills", error);
                              } else {
                                clearFieldError("skills");
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();

                              if (!value) {
                                setFieldError(
                                  "skills",
                                  "Skills / Technologies is required.",
                                );
                                return;
                              }

                              const error = validateListField(
                                value,
                                "Skills / Technologies",
                              );

                              if (error) {
                                setFieldError("skills", error);
                              } else {
                                clearFieldError("skills");
                              }
                            }}
                          />

                          {fieldErrors.skills && (
                            <p className="mt-1 text-xs text-red-600">
                              {fieldErrors.skills}
                            </p>
                          )}

                          {!fieldErrors.skills && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Enter skills separated by commas.
                            </p>
                          )}
                        </Field>

                        <Field label="Spoken Languages" required>
                          <input
                            name="languages"
                            autoComplete="off"
                            spellCheck="false"
                            required
                            ref={languagesRef}
                            className={`${inputCls} ${
                              fieldErrors.languages
                                ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                                : ""
                            }`}
                            placeholder="e.g., English, Spanish"
                            onChange={(e) => {
                              const value = e.target.value.trim();

                              e.currentTarget.setCustomValidity("");

                              if (!value) {
                                clearFieldError("languages");
                                return;
                              }

                              const error = validateListField(
                                value,
                                "Spoken Languages",
                              );

                              if (error) {
                                setFieldError("languages", error);
                              } else {
                                clearFieldError("languages");
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();

                              if (!value) {
                                setFieldError(
                                  "languages",
                                  "Spoken Languages is required.",
                                );
                                return;
                              }

                              const error = validateListField(
                                value,
                                "Spoken Languages",
                              );

                              if (error) {
                                setFieldError("languages", error);
                              } else {
                                clearFieldError("languages");
                              }
                            }}
                          />

                          {fieldErrors.languages && (
                            <p className="mt-1 text-xs text-red-600">
                              {fieldErrors.languages}
                            </p>
                          )}

                          {!fieldErrors.languages && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Enter languages separated by commas.
                            </p>
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
                            onChange={(e) => setTeachingMode(e.target.value)}
                          />
                        </Field>

                        <Field label="Short Bio / Summary" span={3}>
                          <textarea
                            name="bio"
                            rows={3}
                            className={textareaCls}
                            placeholder="Brief profile to show on your site"
                          />
                        </Field>
                      </FormSection>
                    </div>

                    {/* ── Availability ── */}
                    <div
                      className={
                        currentStep === 3 ? "block animate-fade-in" : "hidden"
                      }
                    >
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
                            {dayOpts.map((d) => (
                              <label
                                key={d}
                                className="relative block cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  name="availableDays"
                                  value={d}
                                  className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                  onChange={(e) => {
                                    const formEl = e.currentTarget.form;
                                    if (!formEl) return;
                                    const boxes = formEl.querySelectorAll(
                                      'input[name="availableDays"]',
                                    );
                                    const anyChecked = Array.from(boxes).some(
                                      (b) => b.checked,
                                    );
                                    boxes.forEach((b) =>
                                      b.setCustomValidity(""),
                                    );
                                    if (!anyChecked)
                                      e.currentTarget.setCustomValidity(
                                        "Select at least one weekday.",
                                      );
                                  }}
                                />
                                <span className="flex h-11 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 shadow-sm transition-all duration-150 peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-600 peer-checked:text-white peer-checked:border-blue-500 peer-checked:shadow-md peer-checked:shadow-cyan-200/70 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400 hover:border-cyan-300">
                                  {d}
                                </span>
                              </label>
                            ))}
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
                              startRef.current?.setCustomValidity("");
                              (prefStartRefs.current || []).forEach((el) =>
                                el?.setCustomValidity(""),
                              );
                              (prefEndRefs.current || []).forEach((el) =>
                                el?.setCustomValidity(""),
                              );
                            }}
                          />
                        </Field>

                        <Field label="End Time (24h)" required>
                          <CustomTimePicker
                            name="availableEnd"
                            inputRef={endRef}
                            required
                            value={availEnd}
                            onChange={(e) => {
                              setAvailEnd(e.target.value);
                              endRef.current?.setCustomValidity("");
                              (prefStartRefs.current || []).forEach((el) =>
                                el?.setCustomValidity(""),
                              );
                              (prefEndRefs.current || []).forEach((el) =>
                                el?.setCustomValidity(""),
                              );
                            }}
                          />
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
                              <FontAwesomeIcon
                                icon={faPlus}
                                className="text-[10px]"
                              />{" "}
                              Add Slot
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-400 mt-1">
                            Must fall within your overall start &amp; end times.
                          </p>

                          <div className="mt-3 space-y-3">
                            {prefSlots.length === 0 ? (
                              <div className="text-xs text-slate-500 italic py-3 text-center border border-dashed border-cyan-200 bg-white/70 rounded-xl">
                                No preferable slots added. Set times above, then
                                click "Add Slot."
                              </div>
                            ) : (
                              prefSlots.map((s, idx) => (
                                <div
                                  key={idx}
                                  className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end bg-gradient-to-r from-white to-cyan-50/50 rounded-2xl p-3 border border-cyan-100 shadow-sm"
                                >
                                  <div className="md:col-span-3">
                                    <label className={labelCls}>
                                      Slot {idx + 1}: Start
                                    </label>
                                    <CustomTimePicker
                                      value={s.start}
                                      inputRef={(el) =>
                                        (prefStartRefs.current[idx] = el)
                                      }
                                      onChange={(e) => {
                                        prefStartRefs.current[
                                          idx
                                        ]?.setCustomValidity("");
                                        prefEndRefs.current[
                                          idx
                                        ]?.setCustomValidity("");
                                        updatePrefSlot(
                                          idx,
                                          "start",
                                          e.target.value,
                                        );
                                      }}
                                    />
                                  </div>

                                  <div className="md:col-span-3">
                                    <label className={labelCls}>
                                      Slot {idx + 1}: End
                                    </label>
                                    <CustomTimePicker
                                      value={s.end}
                                      inputRef={(el) =>
                                        (prefEndRefs.current[idx] = el)
                                      }
                                      onChange={(e) => {
                                        prefEndRefs.current[
                                          idx
                                        ]?.setCustomValidity("");
                                        prefStartRefs.current[
                                          idx
                                        ]?.setCustomValidity("");
                                        updatePrefSlot(
                                          idx,
                                          "end",
                                          e.target.value,
                                        );
                                      }}
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
                    <div
                      className={
                        currentStep === 4 ? "block animate-fade-in" : "hidden"
                      }
                    >
                      <FormSection
                        title="Compensation / Payout"
                        icon={faDollarSign}
                      >
                        <Field label="Rate Type">
                          <CustomSelect
                            name="rateType"
                            value={rateType}
                            placeholder="Select"
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
                            placeholder="e.g., 1500"
                          />
                        </Field>

                        <Field label="Currency">
                          <CustomSelect
                            name="currency"
                            value={currency}
                            placeholder="Select"
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
                            placeholder={country ? "Select" : "Select country first"}
                            disabled={
                              country !== "United States" &&
                              country !== "Canada"
                            }
                            options={(country === "Canada"
                              ? ["EFT (CA Bank)", "Interac e-Transfer", "PayPal"]
                              : country === "United States"
                              ? ["ACH (US Bank)", "Zelle", "PayPal"]
                              : []
                            ).map((m) => ({ value: m, label: m }))}
                            onChange={(e) => {
                              setPayoutMethod(e.target.value);

                              if (payoutIdentifierRef.current) {
                                payoutIdentifierRef.current.value = "";
                              }

                              clearFieldError("payoutIdentifier");
                            }}
                          />
                        </Field>

                        <Field label="Payout Identifier" span={2}>
                          <input
                            name="payoutIdentifier"
                            required={Boolean(payoutMethod)}
                            ref={payoutIdentifierRef}
                            className={`${inputCls} ${
                              fieldErrors.payoutIdentifier
                                ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                                : ""
                            }`}
                            placeholder={payIdPlaceholder}
                            onChange={(e) => {
                              const value = e.target.value.trim();

                              e.currentTarget.setCustomValidity("");

                              if (!value) {
                                clearFieldError("payoutIdentifier");
                                return;
                              }

                              const error = validatePayoutIdentifier(
                                value,
                                payoutMethod,
                              );

                              if (error) {
                                setFieldError("payoutIdentifier", error);
                              } else {
                                clearFieldError("payoutIdentifier");
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();

                              if (!value) {
                                if (payoutMethod) {
                                  setFieldError(
                                    "payoutIdentifier",
                                    "Payout Identifier is required.",
                                  );
                                }
                                return;
                              }

                              const error = validatePayoutIdentifier(
                                value,
                                payoutMethod,
                              );

                              if (error) {
                                setFieldError("payoutIdentifier", error);
                              } else {
                                clearFieldError("payoutIdentifier");
                              }
                            }}
                          />

                          {fieldErrors.payoutIdentifier && (
                            <p className="mt-1 text-xs text-red-600">
                              {fieldErrors.payoutIdentifier}
                            </p>
                          )}

                          {!fieldErrors.payoutIdentifier && payoutMethod && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              {payoutMethod === "ACH (US Bank)" &&
                                "Format: Routing Number | Last 4 digits"}

                              {payoutMethod === "Zelle" &&
                                "Enter your Zelle email or phone number."}

                              {payoutMethod === "EFT (CA Bank)" &&
                                "Format: Transit | Institution | Account"}

                              {payoutMethod === "Interac e-Transfer" &&
                                "Enter your Interac e-Transfer email."}

                              {payoutMethod === "PayPal" &&
                                "Enter your PayPal email."}
                            </p>
                          )}
                        </Field>
                      </FormSection>
                    </div>

                    {/* ── Compliance & Documents ── */}
                    <div
                      className={
                        currentStep === 5 ? "block animate-fade-in" : "hidden"
                      }
                    >
                      <FormSection
                        title="Compliance & Documents"
                        icon={faShieldAlt}
                      >
                        <Field label="Resume / CV" required>
                          <input
                            type="file"
                            name="resume"
                            required
                            className={inputCls}
                            accept=".pdf,.doc,.docx"
                          />
                        </Field>

                        <Field label="Profile Photo">
                          <input
                            type="file"
                            name="photo"
                            className={inputCls}
                            accept="image/*"
                          />
                        </Field>

                        <Field label="Certificates">
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
                            placeholder="Select"
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
                              required
                              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-sm text-slate-600 group-hover:text-slate-800">
                              I confirm all details are accurate{" "}
                              <span className="text-rose-500">*</span>
                            </span>
                          </label>
                        </div>
                      </FormSection>
                    </div>

                    {/* ── Assignment ── */}
                    <div
                      className={
                        currentStep === 5 ? "block animate-fade-in" : "hidden"
                      }
                    >
                      <FormSection title="Assignment" icon={faClipboardList}>
                        <Field label="Assign to Internship (title or ID)">
                          <input
                            name="assignInternship"
                            className={`${inputCls} ${
                              fieldErrors.assignInternship
                                ? "!border-rose-400 focus:!ring-rose-400/20 focus:!border-rose-500"
                                : ""
                            }`}
                            placeholder="e.g., MERN Bootcamp – 2025 Summer"
                            maxLength={100}
                            onChange={(e) => {
                              const error = validateAssignInternship(e.target.value);
                              if (error) {
                                setFieldError("assignInternship", error);
                              } else {
                                clearFieldError("assignInternship");
                              }
                            }}
                            onBlur={(e) => {
                              const error = validateAssignInternship(e.target.value);
                              if (error) {
                                setFieldError("assignInternship", error);
                              } else {
                                clearFieldError("assignInternship");
                              }
                            }}
                          />
                          {fieldErrors.assignInternship && (
                            <p className="mt-1 text-xs text-red-600 font-medium">
                              {fieldErrors.assignInternship}
                            </p>
                          )}
                        </Field>

                        <Field label="Notes" span={3}>
                          <textarea
                            name="notes"
                            rows={3}
                            className={textareaCls}
                            placeholder="Internal notes"
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
                          document
                            .getElementById("wizard-scroll-container")
                            ?.scrollTo(0, 0);
                        }}
                        disabled={currentStep === 1}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${currentStep === 1 ? "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border border-slate-200" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"}`}
                      >
                        Back
                      </button>

                      <div className="flex items-center gap-3">
                        {currentStep < 5 && (
                          <button
                            type="button"
                            disabled={currentStepHasErrors}
                            title={
                              currentStepHasErrors
                                ? "Fix the highlighted field(s) before continuing"
                                : undefined
                            }
                            onClick={() => {
                              const container = document.getElementById(
                                "wizard-scroll-container",
                              );
                              if (!container) return;
                              const visibleStep = container.querySelector(
                                ".block.animate-fade-in",
                              );
                              if (!visibleStep) return;

                              const inputs = visibleStep.querySelectorAll(
                                "input, select, textarea",
                              );
                              let isValid = true;
                              for (const input of inputs) {
                                if (!input.checkValidity()) {
                                  input.reportValidity();
                                  isValid = false;
                                  break;
                                }
                              }

                              if (isValid && firstNameRef.current?.value) {
                                const err = validateName(
                                  firstNameRef.current.value,
                                  "First Name",
                                );
                                if (err) {
                                  firstNameRef.current.setCustomValidity(err);
                                  firstNameRef.current.reportValidity();
                                  setFieldError("firstName", err);
                                  isValid = false;
                                }
                              }
                              if (isValid && lastNameRef.current?.value) {
                                const err = validateName(
                                  lastNameRef.current.value,
                                  "Last Name",
                                );
                                if (err) {
                                  lastNameRef.current.setCustomValidity(err);
                                  lastNameRef.current.reportValidity();
                                  setFieldError("lastName", err);
                                  isValid = false;
                                }
                              }
                              if (isValid && emailRef.current?.value) {
                                const emailErr = validateEmail(emailRef.current.value);
                                if (emailErr) {
                                  emailRef.current.setCustomValidity(emailErr);
                                  emailRef.current.reportValidity();
                                  isValid = false;
                                }
                              }
                              if (isValid && cityRef.current?.value) {
                                if (!validateCity(cityRef.current.value)) {
                                  cityRef.current.setCustomValidity(
                                    "Enter a valid city name.",
                                  );
                                  cityRef.current.reportValidity();
                                  isValid = false;
                                }
                              }
                              if (isValid && postalRef.current?.value) {
                                if (
                                  !validatePostalCode(
                                    postalRef.current.value,
                                    country,
                                  )
                                ) {
                                  postalRef.current.setCustomValidity(
                                    "Invalid postal/ZIP code.",
                                  );
                                  postalRef.current.reportValidity();
                                  isValid = false;
                                }
                              }
                              if (isValid && skillsRef.current?.value) {
                                const err = validateListField(
                                  skillsRef.current.value,
                                  "Skills / Technologies",
                                );
                                if (err) {
                                  skillsRef.current.setCustomValidity(err);
                                  skillsRef.current.reportValidity();
                                  isValid = false;
                                }
                              }
                              if (isValid && languagesRef.current?.value) {
                                const err = validateListField(
                                  languagesRef.current.value,
                                  "Spoken Languages",
                                );
                                if (err) {
                                  languagesRef.current.setCustomValidity(err);
                                  languagesRef.current.reportValidity();
                                  isValid = false;
                                }
                              }
                              if (
                                isValid &&
                                payoutIdentifierRef.current?.value
                              ) {
                                const err = validatePayoutIdentifier(
                                  payoutIdentifierRef.current.value,
                                  payoutMethod,
                                );
                                if (err) {
                                  payoutIdentifierRef.current.setCustomValidity(
                                    err,
                                  );
                                  payoutIdentifierRef.current.reportValidity();
                                  isValid = false;
                                }
                              }

                              // belt-and-braces: also block on any tracked
                              // fieldErrors for this step even if a listener
                              // above missed something
                              if (
                                isValid &&
                                (stepFieldsMap[currentStep] || []).some(
                                  (f) => fieldErrors[f],
                                )
                              ) {
                                isValid = false;
                              }

                              if (isValid) {
                                setCurrentStep((s) => Math.min(5, s + 1));
                                container.scrollTo(0, 0);
                              }
                            }}
                            className={`px-7 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all active:scale-95 ${
                              currentStepHasErrors
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none active:scale-100"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                          >
                            Next
                          </button>
                        )}
                        {currentStep === 5 && (
                          <button
                            type="submit"
                            disabled={submitting || otpOpen || formHasAnyErrors}
                            title={
                              formHasAnyErrors
                                ? "Fix the highlighted field(s) before saving"
                                : undefined
                            }
                            className="inline-flex items-center gap-2.5 px-7 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-200/70 hover:from-indigo-700 hover:via-violet-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                          >
                            {submitting ? "Saving..." : "Save Instructor"}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>,
            portalTarget,
          )}

        {/* ═══ OTP MODAL ═══ */}
        {otpOpen &&
          portalTarget &&
          createPortal(
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[3px]">
              <div className="bg-white rounded-2xl sm:rounded-[28px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] w-full max-w-sm p-6 sm:p-7 border border-slate-200/70 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 flex items-center justify-center mb-5 shadow-sm">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="text-violet-600 text-xl"
                  />
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Verify Email
                </h3>

                <p className="text-sm text-slate-500 mb-5">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-slate-700">
                    {otpEmail}
                  </span>
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otpCode.length === 6 && !isVerifying) {
                      e.preventDefault();
                      document.getElementById("verify-save-btn")?.click();
                    }
                  }}
                  className={`${inputCls} text-center text-lg tracking-[0.35em] font-bold mb-5`}
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={() => {
                      setOtpOpen(false);
                      setOtpCode("");
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium bg-white hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    id="verify-save-btn"
                    type="button"
                    disabled={isVerifying || otpCode.length < 6}
                    onClick={async () => {
                      try {
                        setIsVerifying(true);
                        await axios.post(
                          "/api/instructors/otp/verify",
                          { email: otpEmail, otp: otpCode },
                          { headers: authHeaders() },
                        );
                        const data =
                          await createInstructorWithFormData(pendingFormData);
                        const normalized = { id: data._id || data.id, ...data };
                        setInstructors((prev) => [normalized, ...prev]);
                        setIsAddOpen(false);
                        setOtpOpen(false);
                        setOtpCode("");
                        setPendingFormData(null);
                        setPrefSlots([]);
                        showModalAlert("Instructor created successfully!", "Success", "success");
                      } catch (err) {
                        console.error("Verify OTP or Create failed:", err);
                        showModalAlert(
                          err?.response?.data?.message ||
                            "Invalid or expired OTP. Please try again.",
                          "Error",
                          "error",
                        );
                      } finally {
                        setIsVerifying(false);
                      }
                    }}
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
                        await axios.post(
                          "/api/instructors/otp/start",
                          { email: otpEmail },
                          { headers: authHeaders() },
                        );
                        showModalAlert(`A new verification code has been sent to ${otpEmail}.`, "Verification Code Sent", "info");
                      } catch (err) {
                        showModalAlert(err?.response?.data?.message || "Failed to resend OTP.", "Error", "error");
                      } finally {
                        setIsResending(false);
                      }
                    }}
                  >
                    {isResending ? "Sending new code..." : "Didn't receive a code? Resend"}
                  </button>
                </div>
              </div>
            </div>,
            portalTarget,
          )}

        {/* ═══ EDIT MODAL ═══ */}
        {editing && (
          <InstructorManagementedit
            open={Boolean(editing)}
            item={editing}
            onClose={() => setEditing(null)}
            onSaved={(updated) => {
              const updatedId = updated?._id || updated?.id;
              if (!updatedId) {
                setEditing(null);
                return;
              }
              setInstructors((prev) =>
                prev.map((x) =>
                  (x._id || x.id) === updatedId ? { ...x, ...updated } : x,
                ),
              );
              setEditing(null);
              showModalAlert("Instructor updated successfully.", "Success", "success");
            }}
          />
        )}

        {/* ═══ PHOTO PREVIEW ═══ */}
        {photoPreview.open && (
          <div
            className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={closePhoto}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closePhoto}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 text-white text-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>

              <img
                src={photoPreview.src}
                alt={photoPreview.alt || "Instructor photo"}
                className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* ═══ AUTO-ASSIGN STATUS POPUP ═══ */}
        {assignPopup.open &&
          portalTarget &&
          createPortal(
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[3px]"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white rounded-[28px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] w-full max-w-2xl border border-slate-200/70 overflow-hidden">
                <div className="flex items-center justify-between px-7 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        assignPopup.type === "success"
                          ? "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600"
                          : "bg-gradient-to-br from-rose-100 to-orange-50 text-rose-600"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={
                          assignPopup.type === "success" ? faUserCheck : faTimes
                        }
                        className="text-sm"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900">
                        {assignPopup.type === "success"
                          ? "Auto-Assign Complete"
                          : "Auto-Assign Failed"}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {assignPopup.type === "success"
                          ? `Assigned ${assignPopup.made} session${
                              assignPopup.made === 1 ? "" : "s"
                            }`
                          : assignPopup.error}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setAssignPopup({
                        open: false,
                        type: "success",
                        made: 0,
                        assignments: [],
                        error: "",
                      })
                    }
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="p-7">
                  {assignPopup.type === "success" ? (
                    assignPopup.assignments.length > 0 ? (
                      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {assignPopup.assignments.map((row, idx) => {
                          const updatedCount = Number(row.sessionsUpdated || 0);
                          return (
                            <div
                              key={`${row.instructorId || "inst"}-${idx}`}
                              className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4"
                            >
                              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Instructor Name
                              </div>

                              <div className="text-sm font-semibold text-slate-800 break-all mt-1">
                                {row.instructorName || "—"}
                              </div>

                              <div className="mt-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  {updatedCount} session
                                  {updatedCount === 1 ? "" : "s"} updated
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
                        Auto-assign completed, but there are no assignment rows
                        to display.
                      </div>
                    )
                  ) : (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-5 text-sm text-rose-700">
                      {assignPopup.error}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setAssignPopup({
                          open: false,
                          type: "success",
                          made: 0,
                          assignments: [],
                          error: "",
                        })
                      }
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-violet-200/70 transition-all"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            portalTarget,
          )}

        {/* ═══ CENTERED ALERT / SUCCESS MODAL ═══ */}
        {modalAlert.open &&
          portalTarget &&
          createPortal(
            <CenteredAlertModal
              open={modalAlert.open}
              title={modalAlert.title}
              message={modalAlert.message}
              type={modalAlert.type}
              onOk={() => setModalAlert((prev) => ({ ...prev, open: false }))}
            />,
            portalTarget,
          )}

        {/* ═══════════ INSTRUCTOR LIST ═══════════ */}
        <div className="bg-white rounded-[28px] shadow-[0_18px_45px_-18px_rgba(15,23,42,0.18)] border border-slate-200/70 flex flex-col overflow-hidden">
          {/* List header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 bg-white/90">
            <h2 className="text-base font-bold text-slate-900">
              Your Instructors
            </h2>

            <div className="relative w-full max-w-xs">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none z-10"
              />
              {/*Add the "!mt-0" style for alignment - 04-08-2026 */}
              <input
                className="w-full !mt-0 !m-0 !pl-10 !pr-4 !h-10 !rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition search-input"
                placeholder="Search by name, email, skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List body */}
          <div className="flex-1 p-5 sm:p-6 bg-slate-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-slate-600">
                  Loading instructors...
                </p>
              </div>
            ) : filteredInstructors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="text-slate-300 text-xl"
                  />
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  No instructors found
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your search or add a new instructor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-5">
                {paginatedInstructors.map((i) => {
                  const id = i._id || i.id;
                  const allSkills = [
                    ...(i.specializations || []),
                    ...(i.skills || []),
                  ];
                  return (
                    <div
                      key={id}
                      className="group relative rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-300/80 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 p-5 flex flex-col justify-between gap-4"
                    >
                      {/* Top section: Avatar + Info */}
                      <div>
                        <div className="flex items-start gap-3.5">
                          {i?.photo?.url ? (
                            <img
                              src={i.photo.url}
                              alt={`${i.firstName || ""} ${i.lastName || ""}`}
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-100 shadow-sm flex-shrink-0 cursor-zoom-in transition-transform hover:scale-105"
                              loading="lazy"
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                openPhoto(
                                  i.photo.url,
                                  `${i.firstName || ""} ${i.lastName || ""}`,
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  openPhoto(
                                    i.photo.url,
                                    `${i.firstName || ""} ${i.lastName || ""}`,
                                  );
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md shadow-indigo-200/50 ring-2 ring-white">
                              {avatarInitials(i)}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 text-base tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                              {i.firstName} {i.lastName}
                            </h3>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {i.teachingMode && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {i.teachingMode}
                                </span>
                              )}

                              {i.qualification && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200/60 truncate max-w-[140px]">
                                  {i.qualification}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contact details */}
                        <div className="space-y-1.5 mt-3.5 pt-3.5 border-t border-slate-100">
                          {i.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon={faEnvelope} className="text-[10px]" />
                              </span>
                              <span className="truncate">{i.email}</span>
                            </div>
                          )}

                          {i.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon={faPhone} className="text-[10px]" />
                              </span>
                              <span>{i.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Skills / Badges */}
                        {allSkills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100/70">
                            {(i.specializations || []).slice(0, 2).map((sp) => (
                              <span
                                key={sp}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80"
                              >
                                {sp}
                              </span>
                            ))}
                            {(i.skills || []).slice(0, 2).map((sk) => (
                              <span
                                key={sk}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-100/80"
                              >
                                {sk}
                              </span>
                            ))}
                            {allSkills.length > 4 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                                +{allSkills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddOpen(false);
                            setViewing(i);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-indigo-600 bg-indigo-50/80 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all shadow-xs whitespace-nowrap"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-[10px] shrink-0" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsAddOpen(false);
                            setViewing(null);
                            setEditing(i);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-amber-600 bg-amber-50/80 border border-amber-100 hover:bg-amber-100 hover:border-amber-200 transition-all shadow-xs whitespace-nowrap"
                        >
                          <FontAwesomeIcon icon={faPen} className="text-[10px] shrink-0" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsAddOpen(false);
                            setViewing({
                              ...i,
                              __askDelete: true,
                              __confirmOnly: true,
                            });
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-rose-600 bg-rose-50/80 border border-rose-100 hover:bg-rose-100 hover:border-rose-200 transition-all shadow-xs whitespace-nowrap"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-[10px] shrink-0" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredInstructors.length > 0 && (
            <div className="flex justify-center items-center gap-1.5 px-6 py-5 border-t border-slate-100 bg-white">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-150 ${
                      pageNum === page
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-violet-200/70"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={!hasMore}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructureManagement;
