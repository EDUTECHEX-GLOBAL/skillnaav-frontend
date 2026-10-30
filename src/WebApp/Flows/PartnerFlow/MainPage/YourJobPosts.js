import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "../../../../api/axiosInstance";
import Modal from "react-modal";
import defaultCompanyLogo from "../../../../assets/default-company-logo.png";
import PhoneInputWithCountry from "./PhoneInputWithCountry";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faLocationDot,
  faBriefcase,
  faMagnifyingGlass,
  faCircleCheck,
  faCircleXmark,
  faCircle,
  faMoneyBillWave,
  faHandHoldingDollar,
  faGraduationCap,
  faBullseye,
  faGlobe,
  faMapPin,
  faShuffle,
  faLaptopHouse,
  faClock,
  faCoins,
  faCalendarDay,
  faCalendarCheck,
  faCalendarPlus,
  faCalendarDays,
  faIndustry,
  faFileLines,
  faListCheck,
  faCheck,
  faGift,
  faStar,
  faReceipt,
  faCircleDot,
  faAddressCard,
  faUser,
  faEnvelope,
  faPhone,
  faPenToSquare,
  faArrowLeft,
  faFloppyDisk,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faArrowUpAZ,
  faArrowDownZA,
  faLayerGroup,
  faCircleInfo,
  faSliders,
  faEllipsisVertical,
  faTrash,
  faArrowsRotate,
} from "@fortawesome/free-solid-svg-icons";

Modal.setAppElement("#root");

// ─── Custom Sort Dropdown Component ──────────────────────────────────────────
const SortDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const options = [
    { value: "jobTitle", label: "Sort by Title" },
    { value: "companyName", label: "Sort by Company" },
    { value: "createdAt", label: "Sort by Date" },
  ];

  const currentLabel =
    options.find((o) => o.value === value)?.label || "Sort by Title";

  return (
    <div
      className="relative flex-1 sm:flex-initial w-full sm:w-40"
      ref={ref}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-10 w-full px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 flex items-center justify-between gap-1.5 transition box-border"
        style={{ fontFamily: "'Poppins', sans-serif" }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{currentLabel}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-xs text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-40 overflow-hidden"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-left transition ${
                  isSelected
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-xs text-indigo-600 shrink-0 ml-1"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Custom Dropdown for Edit Modal (Constrained strictly to input width) ─────
const CustomSelectModal = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  const normalizedOptions = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === "object" && opt !== null
          ? opt
          : { value: opt, label: opt }
      ),
    [options]
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  return (
    <div className={`relative w-full min-w-0 ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="!mt-0 !m-0 w-full h-[40px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer transition-all box-border min-w-0 overflow-hidden"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <span
          className={`truncate pr-2 min-w-0 flex-1 ${
            !selectedOption
              ? "text-gray-400 font-normal"
              : "text-gray-800 font-medium"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`h-3 w-3 text-gray-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          className="absolute z-[9999] left-0 right-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto py-1 text-sm divide-y divide-gray-50 dropdown-scrollbar box-border"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {placeholder && (
            <li
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer text-gray-400 select-none text-xs sm:text-sm truncate"
            >
              {placeholder}
            </li>
          )}
          {normalizedOptions.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer select-none transition-colors text-xs sm:text-sm flex items-center justify-between min-w-0 ${
                opt.value === value
                  ? "bg-indigo-50 text-indigo-800 font-semibold"
                  : "text-gray-700"
              }`}
              title={opt.label}
            >
              <span className="truncate pr-2 min-w-0 flex-1">{opt.label}</span>
              {opt.value === value && (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1 text-xs"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Sector display labels ────────────────────────────────────────────────────
const SECTOR_LABELS = {
  "advanced-ai": "Advanced AI & Autonomous Systems",
  "quantum-computing": "Quantum Computing & Next-Gen Computing",
  "climate-tech": "Climate Tech & Carbon Capture",
  biotech: "Biotechnology & Synthetic Biology",
  "materials-science": "Advanced Materials Science",
  "space-exploration": "Space Exploration & Commercial Space",
  neurotechnology: "Neurotechnology & Brain-Computer Interfaces",
  "precision-agriculture": "Precision Agriculture & AgriTech",
  "advanced-robotics": "Advanced Robotics & Human-Machine Collaboration",
  "renewable-energy": "Renewable Energy & Grid Innovation",
  "architecture-built-environment": "Architecture & Built Environment",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const isDateString = (v) => /^\d{4}-\d{2}-\d{2}/.test(String(v || ""));

// ─── StatusPill ───────────────────────────────────────────────────────────────
const StatusPill = ({
  adminStatus,
  adminReviewed,
  adminApproved,
  className = "",
}) => {
  // Derive display state from adminStatus (new field) with fallback to legacy booleans
  const status =
    adminStatus ||
    (adminApproved ? "approved" : adminReviewed ? "in_review" : "pending");

  const cfg =
    status === "approved"
      ? {
          bg: "bg-green-100 text-green-800 border border-green-200",
          icon: faCircleCheck,
          label: "Approved",
        }
      : status === "rejected"
        ? {
            bg: "bg-red-100 text-red-700 border border-red-200",
            icon: faCircleXmark,
            label: "Rejected",
          }
        : status === "in_review"
          ? {
              bg: "bg-yellow-100 text-yellow-800 border border-yellow-200",
              icon: faMagnifyingGlass,
              label: "In Review",
            }
          : {
              bg: "bg-gray-100 text-gray-500 border border-gray-200",
              icon: faCircle,
              label: "Pending",
            };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${className}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <FontAwesomeIcon icon={cfg.icon} className="text-[10px]" />
      {cfg.label}
    </span>
  );
};

// ─── ModePill ─────────────────────────────────────────────────────────────────
const ModePill = ({ mode }) => {
  const cfg =
    mode === "ONLINE"
      ? {
          cls: "bg-teal-50 text-teal-700 border border-teal-200",
          icon: faGlobe,
          label: "Online",
        }
      : mode === "OFFLINE"
        ? {
            cls: "bg-orange-50 text-orange-700 border border-orange-200",
            icon: faMapPin,
            label: "Offline",
          }
        : {
            cls: "bg-purple-50 text-purple-700 border border-purple-200",
            icon: faShuffle,
            label: "Hybrid",
          };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <FontAwesomeIcon icon={cfg.icon} className="text-[10px]" />
      {cfg.label}
    </span>
  );
};

// ─── TypePill ─────────────────────────────────────────────────────────────────
const TypePill = ({ type }) => {
  const cfg =
    type === "PAID"
      ? {
          cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: faMoneyBillWave,
          label: "Paid",
        }
      : type === "STIPEND"
        ? {
            cls: "bg-blue-50 text-blue-700 border-blue-200",
            icon: faHandHoldingDollar,
            label: "Stipend",
          }
        : {
            cls: "bg-gray-50 text-gray-500 border-gray-200",
            icon: faGraduationCap,
            label: "Free",
          };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <FontAwesomeIcon icon={cfg.icon} className="text-[10px]" />
      {cfg.label}
    </span>
  );
};

// ─── CompLabel ────────────────────────────────────────────────────────────────
const CompLabel = ({ i }) => {
  if (i.internshipType === "FREE")
    return <span className="text-gray-500">Unpaid / Free</span>;
  const c = i.compensationDetails;
  const text = c?.amount
    ? `${c.amount} ${c.currency} / ${(c.frequency || "").toLowerCase()}`
    : "Amount not specified";
  return (
    <span
      className={
        i.internshipType === "PAID" ? "text-green-700" : "text-blue-700"
      }
    >
      {text}
    </span>
  );
};

// ─── DetailRow ────────────────────────────────────────────────────────────────
const DetailRow = ({ icon, label, children }) => (
  <div>
    <p
      className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1 flex items-center gap-1.5"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {icon && (
        <FontAwesomeIcon icon={icon} className="text-indigo-400 text-[11px]" />
      )}
      {label}
    </p>
    <div
      className="text-sm text-gray-800"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {children || "—"}
    </div>
  </div>
);

// ─── SectionLabel (view modal sections) ──────────────────────────────────────
const SectionLabel = ({ icon, children }) => (
  <p
    className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2 flex items-center gap-1.5"
    style={{ fontFamily: "'Poppins', sans-serif" }}
  >
    {icon && <FontAwesomeIcon icon={icon} className="text-gray-300" />}
    {children}
  </p>
);

// ─── FormSectionLabel (edit modal sections) ───────────────────────────────────
const FormSectionLabel = ({ icon, children }) => (
  <p
    className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-1.5"
    style={{ fontFamily: "'Poppins', sans-serif" }}
  >
    {icon && <FontAwesomeIcon icon={icon} className="text-gray-300" />}
    {children}
  </p>
);

// ─── Custom DateInput (Constrained strictly to modal box width) ───────────────
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DateInput = ({ label, value, onChange, minDate = "" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const parsedDate = useMemo(() => {
    if (!value) return null;
    const str = String(value).slice(0, 10);
    const d = new Date(str + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [viewDate, setViewDate] = useState(() => parsedDate || new Date());

  useEffect(() => {
    if (parsedDate) setViewDate(parsedDate);
  }, [parsedDate]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
    setOpen(false);
  };

  const handleSetToday = (e) => {
    e.stopPropagation();
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setViewDate(now);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  const formatDisplay = (val) => {
    if (!val) return "";
    const s = String(val).slice(0, 10);
    const parts = s.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return s;
  };

  const selectedDateStr = value ? String(value).slice(0, 10) : "";

  return (
    <div className="relative w-full min-w-0" ref={ref}>
      <label
        className="block text-xs font-semibold text-gray-600 mb-1"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {label}
      </label>
      <div
        onClick={() => setOpen((prev) => !prev)}
        className={`!mt-0 !m-0 w-full h-[40px] px-3 py-2 border rounded-lg text-sm bg-white flex items-center justify-between cursor-pointer transition box-border min-w-0 ${
          open
            ? "border-indigo-500 ring-2 ring-indigo-500/20 text-gray-900"
            : "border-gray-200 text-gray-700 hover:border-gray-300"
        }`}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
          <FontAwesomeIcon
            icon={faCalendarDays}
            className="text-indigo-400 text-sm shrink-0"
          />
          <span
            className={`truncate ${
              selectedDateStr
                ? "text-gray-800 font-medium"
                : "text-gray-400 font-normal"
            }`}
          >
            {selectedDateStr ? formatDisplay(selectedDateStr) : "DD-MM-YYYY"}
          </span>
        </div>
        <FontAwesomeIcon
          icon={faCalendarDay}
          className="text-gray-400 text-xs shrink-0 ml-1"
        />
      </div>

      {open && (
        <div
          className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-[280px] max-w-[calc(100vw-32px)] top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 z-[9999] animate-fadeIn box-border"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100 px-0.5">
            <span className="text-xs font-bold text-gray-800 truncate">
              {MONTH_NAMES[month]}, {year}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 text-xs"
                title="Previous Month"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 text-xs"
                title="Next Month"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {DAY_NAMES.map((d) => (
              <span
                key={d}
                className="text-[10px] font-semibold text-gray-400 py-0.5"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {/* Prev month fill */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span
                key={`prev-${i}`}
                className="text-[10px] text-gray-300 py-1 select-none flex items-center justify-center"
              >
                {daysInPrevMonth - firstDayOfWeek + i + 1}
              </span>
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const isSelected = selectedDateStr === dateStr;
              const isDisabled = Boolean(minDate && dateStr < minDate);

              return (
                <button
                  key={d}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && handleSelectDay(d)}
                  className={`w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    isDisabled
                      ? "opacity-30 cursor-not-allowed bg-transparent text-gray-300"
                      : isSelected
                        ? "bg-indigo-600 text-white font-bold shadow-sm"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-gray-100 px-0.5">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const QualTagInput = ({ qualifications, onChange }) => {
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");

  const validateSkill = (val) => {
    if (!val || !val.trim()) return "Please enter a skill or qualification.";
    const trimmed = val.trim();
    if (trimmed.length < 2) return "Qualification must be at least 2 characters.";
    if (trimmed.length > 50) return "Qualification cannot exceed 50 characters.";
    const validLettersRegex = /^[a-zA-Z\s]+$/;
    if (!validLettersRegex.test(trimmed)) {
      return "Qualifications can only contain alphabetic letters and spaces (no numbers or symbols).";
    }
    if (qualifications.some((q) => q.toLowerCase() === trimmed.toLowerCase())) {
      return `"${trimmed}" is already added.`;
    }
    return "";
  };

  const addTag = () => {
    const val = inputVal.trim();
    if (!val) return;
    const err = validateSkill(val);
    if (err) {
      setError(err);
      setTimeout(() => setError(""), 4000);
      return;
    }
    onChange([...qualifications, val]);
    setInputVal("");
    setError("");
  };

  const removeTag = (idx) => {
    onChange(qualifications.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* Tag chips */}
      {qualifications.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {qualifications.map((q, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs rounded-full font-medium"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <FontAwesomeIcon
                icon={faCheck}
                className="text-[9px] text-indigo-400"
              />
              {q}
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="ml-0.5 text-indigo-300 hover:text-red-400 transition-colors leading-none"
                aria-label={`Remove ${q}`}
              >
                <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => {
            const clean = e.target.value.replace(/[^a-zA-Z\s]/g, "");
            setInputVal(clean);
            if (error) setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={
            qualifications.length === 0
              ? "Type a skill (e.g. Geometry, Algebra) and press Enter..."
              : "Add another skill..."
          }
          className={`!mt-0 flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            error
              ? "border-rose-400 focus:ring-rose-400"
              : "border-gray-200 focus:ring-indigo-400"
          }`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        />
        <button
          type="button"
          onClick={addTag}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition font-medium flex-shrink-0"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
          Add
        </button>
      </div>
      {error ? (
        <p
          className="text-xs text-rose-500 mt-1 font-medium"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {error}
        </p>
      ) : (
        <p
          className="text-xs text-gray-400 mt-1"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Press Enter or click Add. Qualifications can only contain letters and spaces.
        </p>
      )}
    </div>
  );
};
// ═══════════════════════════════════════════════════════════════════════════════
// VIEW MODAL BODY
// ═══════════════════════════════════════════════════════════════════════════════
const ViewModalBody = ({ internship: i, onEdit, onClose }) => (
  <>
    {/* ── Gradient hero header ── */}
    <div className="flex-shrink-0 relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden min-w-0">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full
          bg-white/20 text-white hover:bg-white/40 transition font-bold z-10"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>

      <div className="flex items-start gap-4 pr-10 min-w-0">
        <img
          src={i.imgUrl || defaultCompanyLogo}
          alt={i.companyName}
          width="56"
          height="56"
          loading="eager"
          fetchPriority="high"
          className="w-14 h-14 rounded-xl object-contain bg-white p-1 shadow shrink-0"
        />
        <div className="min-w-0 flex-1 overflow-hidden">
          <h2
            className="text-xl font-bold text-white leading-tight break-all [overflow-wrap:anywhere]"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {i.jobTitle}
          </h2>
          <p
            className="text-indigo-100 text-sm mt-0.5 font-medium flex items-center gap-1.5 min-w-0 break-all [overflow-wrap:anywhere]"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FontAwesomeIcon
              icon={faBriefcase}
              className="text-[10px] opacity-70 shrink-0"
            />
            <span className="min-w-0 break-all [overflow-wrap:anywhere]">{i.companyName}</span>
          </p>
          <p
            className="text-indigo-200 text-xs mt-0.5 flex items-center gap-1 min-w-0 break-all [overflow-wrap:anywhere]"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FontAwesomeIcon icon={faLocationDot} className="text-[10px] shrink-0" />
            <span className="min-w-0 break-all [overflow-wrap:anywhere]">
              {i.location || [i.city, i.state, i.country].filter(Boolean).join(", ")}
            </span>
          </p>
        </div>
      </div>

      {/* ── Badge strip inside hero header ── */}
      <div className="mt-4 flex flex-wrap items-center gap-2 min-w-0 max-w-full">
        <StatusPill
          adminStatus={i.adminStatus}
          adminReviewed={i.adminReviewed}
          adminApproved={i.adminApproved}
          className="shadow-sm shrink-0"
        />

        {/* Open / Closed */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border shrink-0 ${
            i.applicationOpen
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
          }`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <FontAwesomeIcon
            icon={faCircle}
            className={`text-[6px] ${i.applicationOpen ? "text-teal-500" : "text-gray-400"}`}
          />
          {i.applicationOpen ? "Open" : "Closed"}
        </span>

        <TypePill type={i.internshipType} className="shrink-0" />

        {i.classification && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border bg-purple-50 text-purple-700 border-purple-200 shrink-0"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FontAwesomeIcon icon={faBullseye} className="text-[10px]" />
            {i.classification}
          </span>
        )}
      </div>
    </div>

    {/* ── Scrollable body ── */}
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5 bg-white">
      {/* Rejection reason banner */}
      {(i.adminStatus === "rejected" ||
        (!i.adminStatus && !i.adminApproved && i.adminReviewed)) &&
        i.rejectionReason && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <FontAwesomeIcon
              icon={faCircleXmark}
              className="text-red-400 mt-0.5 flex-shrink-0"
            />
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Rejection Reason
              </p>
              <p
                className="text-sm text-red-700"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {i.rejectionReason}
              </p>
            </div>
          </div>
        )}

      {/* Key facts grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
        <DetailRow icon={faLaptopHouse} label="Mode">
          <ModePill mode={i.internshipMode} />
        </DetailRow>
        <DetailRow icon={faClock} label="Duration">
          {i.duration}
        </DetailRow>
        <DetailRow icon={faCoins} label="Compensation">
          <CompLabel i={i} />
        </DetailRow>
        <DetailRow icon={faCalendarDay} label="Start Date">
          {fmtDate(i.startDate)}
        </DetailRow>
        <DetailRow icon={faCalendarCheck} label="End / Duration">
          {isDateString(i.endDateOrDuration)
            ? fmtDate(i.endDateOrDuration)
            : i.endDateOrDuration}
        </DetailRow>
        <DetailRow icon={faCalendarPlus} label="Posted">
          {fmtDate(i.createdAt)}
        </DetailRow>
        <div className="col-span-2 sm:col-span-3">
          <DetailRow icon={faIndustry} label="Sector">
            {SECTOR_LABELS[i.sector] || i.sector}
          </DetailRow>
        </div>
      </div>

      {/* Job Description */}
      <div>
        <SectionLabel icon={faFileLines}>Job Description</SectionLabel>
        <p
          className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100 break-words [overflow-wrap:anywhere]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {i.jobDescription || "No description provided."}
        </p>
      </div>

      {/* Qualifications */}
      {i.qualifications?.length > 0 && (
        <div>
          <SectionLabel icon={faListCheck}>Qualifications</SectionLabel>
          <div className="flex flex-wrap gap-2 max-w-full">
            {(Array.isArray(i.qualifications)
              ? i.qualifications
              : [i.qualifications]
            )
              .filter(Boolean)
              .map((q, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs rounded-full font-medium break-all [overflow-wrap:anywhere] max-w-full"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-[9px] text-indigo-400 shrink-0"
                  />
                  <span className="break-all [overflow-wrap:anywhere]">{q}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      {i.compensationDetails?.benefits?.length > 0 && (
        <div>
          <SectionLabel icon={faGift}>Benefits</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {i.compensationDetails.benefits.map((b, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-100 text-green-700 text-xs rounded-full"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <FontAwesomeIcon
                  icon={faStar}
                  className="text-[9px] text-green-400"
                />
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Additional Costs */}
      {i.compensationDetails?.additionalCosts?.length > 0 && (
        <div>
          <SectionLabel icon={faReceipt}>Additional Costs</SectionLabel>
          <div className="space-y-1">
            {i.compensationDetails.additionalCosts.map((c, idx) => (
              <p
                key={idx}
                className="text-sm text-gray-600 flex items-center gap-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <FontAwesomeIcon
                  icon={faCircleDot}
                  className="text-[8px] text-gray-400"
                />
                {c.description}: {c.amount} {c.currency}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <SectionLabel icon={faAddressCard}>Contact</SectionLabel>
        <div
          className="space-y-2 text-sm"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {i.contactInfo?.name && (
            <p className="flex items-center gap-2.5">
              <FontAwesomeIcon
                icon={faUser}
                className="w-4 text-center text-indigo-300 text-xs"
              />
              <span className="font-medium text-gray-800">
                {i.contactInfo.name}
              </span>
            </p>
          )}
          {i.contactInfo?.email && (
            <p className="flex items-center gap-2.5">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="w-4 text-center text-indigo-300 text-xs"
              />
              <a
                href={`mailto:${i.contactInfo.email}`}
                className="text-indigo-600 hover:underline"
              >
                {i.contactInfo.email}
              </a>
            </p>
          )}
          {i.contactInfo?.phone && (
            <p className="flex items-center gap-2.5">
              <FontAwesomeIcon
                icon={faPhone}
                className="w-4 text-center text-indigo-300 text-xs"
              />
              <a
                href={`tel:${i.contactInfo.phone}`}
                className="text-indigo-600 hover:underline"
              >
                {i.contactInfo.phone}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>

    {/* ── Sticky footer ── */}
    <div className="flex-shrink-0 flex justify-end items-center px-6 py-4 border-t bg-white rounded-b-2xl">
      <button
        onClick={onEdit}
        className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <FontAwesomeIcon icon={faPenToSquare} />
        Edit Posting
      </button>
    </div>
  </>
);

// ─── Field Validation Helpers ────────────────────────────────────────────────
const validateCompanyName = (name) => {
  if (!name || !name.trim()) return "Company Name is required.";
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Company Name must be at least 2 characters.";
  if (trimmed.length > 60) return "Company Name cannot exceed 60 characters.";
  const validCharsRegex = /^[a-zA-Z0-9\s&.',-]+$/;
  if (!validCharsRegex.test(trimmed))
    return "Company Name can only contain letters, numbers, spaces, and & . , - '";
  if (/[&.',-]{2,}/.test(trimmed))
    return "Company Name cannot have consecutive special characters.";
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 2) return "Company Name must contain at least 2 letters.";
  return null;
};

const validateJobTitle = (title) => {
  if (!title || !title.trim()) return "Job Title is required.";
  const trimmed = title.trim();
  if (trimmed.length < 2) return "Job Title must be at least 2 characters.";
  if (trimmed.length > 60) return "Job Title cannot exceed 60 characters.";
  const validCharsRegex = /^[a-zA-Z0-9\s&.',-]+$/;
  if (!validCharsRegex.test(trimmed))
    return "Job Title can only contain letters, numbers, spaces, and & . , - '";
  if (/[&.',-]{2,}/.test(trimmed))
    return "Job Title cannot have consecutive special characters.";
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 2) return "Job Title must contain at least 2 letters.";
  return null;
};

const validateLocation = (location, mode = "ONLINE") => {
  if (!location || !location.trim()) {
    const isOfflineOrHybrid =
      mode && ["OFFLINE", "HYBRID"].includes(String(mode).toUpperCase());
    if (isOfflineOrHybrid) {
      return "Location is required for Offline/Hybrid internships.";
    }
    return "";
  }
  const trimmed = location.trim();
  if (trimmed.length < 2) return "Location must be at least 2 characters.";
  if (trimmed.length > 80) return "Location cannot exceed 80 characters.";
  const validCharsRegex = /^[a-zA-Z0-9\s,.'/-]+$/;
  if (!validCharsRegex.test(trimmed)) {
    return "Location can only contain letters, numbers, spaces, commas, periods, and hyphens.";
  }
  if (/[,.'/-]{2,}/.test(trimmed)) {
    return "Location cannot have consecutive special characters.";
  }
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 2) return "Location must contain at least 2 letters.";
  return null;
};

const validateContactName = (name) => {
  if (!name || !name.trim()) return "Contact Name is required.";
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Contact Name must be at least 2 characters.";
  if (trimmed.length > 50) return "Contact Name cannot exceed 50 characters.";
  const validNameRegex = /^[a-zA-Z\s.'-]+$/;
  if (!validNameRegex.test(trimmed)) {
    return "Contact Name can only contain alphabetic letters and spaces.";
  }
  if (/[.'-]{2,}/.test(trimmed)) {
    return "Contact Name cannot contain consecutive special characters.";
  }
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 2) return "Contact Name must contain at least 2 letters.";
  return null;
};

const validateEmail = (email) => {
  if (!email || !email.trim()) return "Contact Email is required.";
  const trimmed = email.trim();
  if (trimmed.length > 80) return "Contact Email cannot exceed 80 characters.";
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return "Please enter a valid email address with a valid domain (e.g. name@example.com).";
  }
  return null;
};

const formatPhoneNumber = (value) => {
  const digits = (value || "").replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const validatePhone = (phone) => {
  if (!phone || !phone.trim()) return "Contact Phone is required.";
  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (!digitsOnly) {
    return "Contact Phone can only contain numbers.";
  }
  if (digitsOnly.length < 9 || digitsOnly.length > 15) {
    return "Contact Phone must be a valid phone number (e.g. 10 digits for US/CA/IN).";
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT MODAL BODY
// ═══════════════════════════════════════════════════════════════════════════════
const EditModalBody = ({
  internship: si,
  updateField,
  onSave,
  onBack,
  onClose,
}) => {
  const logoInputRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");

  const isFreemium = useMemo(() => {
    try {
      const info =
        JSON.parse(localStorage.getItem("partnerInfo")) ||
        JSON.parse(localStorage.getItem("userInfo")) ||
        {};
      return (info.planType || "Freemium") === "Freemium";
    } catch {
      return true;
    }
  }, []);

  const [fieldErrors, setFieldErrors] = useState({
    jobTitle: "",
    companyName: "",
    location: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [touched, setTouched] = useState({
    jobTitle: false,
    companyName: false,
    location: false,
    contactName: false,
    contactEmail: false,
    contactPhone: false,
  });

  const minStartDate = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const minEndDate = useMemo(() => {
    if (!si.startDate) return minStartDate;
    const s = new Date(String(si.startDate).slice(0, 10) + "T00:00:00");
    if (isNaN(s.getTime())) return minStartDate;
    const m = new Date(s);
    m.setMonth(m.getMonth() + 1);
    const yyyy = m.getFullYear();
    const mm = String(m.getMonth() + 1).padStart(2, "0");
    const dd = String(m.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [si.startDate, minStartDate]);

  const handleSaveClick = () => {
    const companyErr = validateCompanyName(si.companyName || "");
    const titleErr = validateJobTitle(si.jobTitle || "");
    const locationErr = validateLocation(si.location || "", si.internshipMode || "ONLINE");
    const nameErr = si.contactInfo?.name ? validateContactName(si.contactInfo.name) : "";
    const emailErr = si.contactInfo?.email ? validateEmail(si.contactInfo.email) : "";
    const phoneErr = si.contactInfo?.phone ? validatePhone(si.contactInfo.phone) : "";

    let dateErr = "";
    if (si.startDate && si.endDateOrDuration) {
      const s = new Date(String(si.startDate).slice(0, 10) + "T00:00:00");
      const e = new Date(String(si.endDateOrDuration).slice(0, 10) + "T00:00:00");
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const minEnd = new Date(s);
        minEnd.setMonth(minEnd.getMonth() + 1);
        if (e < minEnd) {
          dateErr = "Internship duration must be at least 1 month. Please select an End Date at least 1 month after Start Date.";
        }
      }
    }

    setTouched({
      jobTitle: true,
      companyName: true,
      location: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
    });

    setFieldErrors({
      companyName: companyErr || "",
      jobTitle: titleErr || "",
      location: locationErr || "",
      contactName: nameErr || "",
      contactEmail: emailErr || "",
      contactPhone: phoneErr || "",
    });

    const firstErr = companyErr || titleErr || locationErr || dateErr || nameErr || emailErr || phoneErr;
    if (firstErr) {
      setErrorMessage(firstErr);
      setTimeout(() => setErrorMessage(""), 6000);
      return;
    }

    if (isFreemium && si.internshipType === "PAID") {
      setErrorMessage("Freemium partners cannot post or update paid internships. Please upgrade your plan to enable paid postings.");
      setTimeout(() => setErrorMessage(""), 6000);
      return;
    }

    onSave();
  };

  useEffect(() => {
    const startVal = si.startDate;
    const endVal = si.endDateOrDuration;

    if (
      startVal &&
      endVal &&
      /^\d{4}-\d{2}-\d{2}/.test(String(startVal)) &&
      /^\d{4}-\d{2}-\d{2}/.test(String(endVal))
    ) {
      const s = new Date(String(startVal).slice(0, 10) + "T00:00:00");
      const e = new Date(String(endVal).slice(0, 10) + "T00:00:00");
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const minEnd = new Date(s);
        minEnd.setMonth(minEnd.getMonth() + 1);
        if (e < minEnd) {
          if (si.duration !== "Min 1 month required") {
            updateField("duration", "Min 1 month required");
          }
          return;
        }
        let m =
          (e.getFullYear() - s.getFullYear()) * 12 +
          (e.getMonth() - s.getMonth());
        let d = e.getDate() - s.getDate();
        if (d < 0) {
          m -= 1;
          const prev = new Date(e.getFullYear(), e.getMonth(), 0);
          d += prev.getDate();
        }
        const parts = [];
        if (m > 0) parts.push(`${m} month${m > 1 ? "s" : ""}`);
        if (d > 0) parts.push(`${d} day${d > 1 ? "s" : ""}`);
        const calcDuration = parts.length > 0 ? parts.join(" ") : "0 days";

        if (si.duration !== calcDuration) {
          updateField("duration", calcDuration);
        }
      }
    }
  }, [si.startDate, si.endDateOrDuration, si.duration, updateField]);

  const handleTypeChange = (value) => {
    if (isFreemium && value === "PAID") {
      setErrorMessage("Freemium partners cannot select Paid internships. Please upgrade to Premium.");
      setTimeout(() => setErrorMessage(""), 6000);
      return;
    }
    updateField("internshipType", value);
    updateField("compensationDetails.type", value);
    if (value === "FREE") {
      updateField("compensationDetails.amount", null);
      updateField("compensationDetails.currency", "");
      updateField("compensationDetails.frequency", "");
    } else {
      if (!si.compensationDetails?.currency)
        updateField("compensationDetails.currency", "USD");
      if (!si.compensationDetails?.frequency)
        updateField("compensationDetails.frequency", "MONTHLY");
    }
  };

  const handleDateChange = (field, value) => {
    updateField(field, value);

    const startVal = field === "startDate" ? value : si.startDate;
    let endVal = field === "endDateOrDuration" ? value : si.endDateOrDuration;

    if (
      startVal &&
      endVal &&
      /^\d{4}-\d{2}-\d{2}/.test(String(startVal)) &&
      /^\d{4}-\d{2}-\d{2}/.test(String(endVal))
    ) {
      const s = new Date(String(startVal).slice(0, 10) + "T00:00:00");
      const e = new Date(String(endVal).slice(0, 10) + "T00:00:00");
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const minEnd = new Date(s);
        minEnd.setMonth(minEnd.getMonth() + 1);

        if (e < minEnd) {
          updateField("duration", "Min 1 month required");
          return;
        }
        let m =
          (e.getFullYear() - s.getFullYear()) * 12 +
          (e.getMonth() - s.getMonth());
        let d = e.getDate() - s.getDate();
        if (d < 0) {
          m -= 1;
          const prev = new Date(e.getFullYear(), e.getMonth(), 0);
          d += prev.getDate();
        }
        const parts = [];
        if (m > 0) parts.push(`${m} month${m > 1 ? "s" : ""}`);
        if (d > 0) parts.push(`${d} day${d > 1 ? "s" : ""}`);
        updateField("duration", parts.length > 0 ? parts.join(" ") : "0 days");
      }
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateField("imgUrl", ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Sticky header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b rounded-t-2xl bg-white">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden flex-1">
          {/* Clickable logo / profile pic with edit overlay */}
          <div
            className="relative w-12 h-12 flex-shrink-0 cursor-pointer group"
            onClick={() => logoInputRef.current && logoInputRef.current.click()}
            title="Change company logo"
          >
            <img
              src={si.imgUrl || defaultCompanyLogo}
              alt="Company Logo"
              className="w-12 h-12 rounded-xl object-contain bg-gray-50 border border-gray-200 p-1 shadow-sm"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <FontAwesomeIcon
                icon={faPenToSquare}
                className="text-white text-sm"
              />
            </div>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />

          <div className="min-w-0 overflow-hidden flex-1">
            <h2
              className="text-base font-semibold text-gray-800 flex items-center gap-2 truncate"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Edit Internship
            </h2>
            <p
              className="text-xs text-gray-400 mt-0.5 truncate"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {si.jobTitle} · {si.companyName}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
        >
          <FontAwesomeIcon icon={faXmark} className="text-sm" />
        </button>
      </div>

      {/* Error alert toast in modal */}
      {errorMessage && (
        <div className="mx-6 mt-3 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-between gap-2 shadow-sm">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-rose-500 hover:text-rose-700 font-bold text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Scrollable form */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
        <FormSectionLabel icon={faCircleInfo}>Basic Info</FormSectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Job Title */}
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Job Title
            </label>
            <input
              type="text"
              value={si.jobTitle || ""}
              maxLength={60}
              placeholder="e.g. Frontend Developer"
              onChange={(e) => {
                const clean = e.target.value.replace(/[^a-zA-Z0-9\s&.',-]/g, "");
                updateField("jobTitle", clean);
                setTouched((p) => ({ ...p, jobTitle: true }));
                setFieldErrors((p) => ({
                  ...p,
                  jobTitle: validateJobTitle(clean) || "",
                }));
              }}
              onBlur={() => {
                setTouched((p) => ({ ...p, jobTitle: true }));
                setFieldErrors((p) => ({
                  ...p,
                  jobTitle: validateJobTitle(si.jobTitle || "") || "",
                }));
              }}
              className={`!mt-0 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                touched.jobTitle && fieldErrors.jobTitle
                  ? "border-rose-400 focus:ring-rose-400"
                  : "border-gray-200 focus:ring-indigo-400"
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
            {touched.jobTitle && fieldErrors.jobTitle && (
              <p
                className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
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
                {fieldErrors.jobTitle}
              </p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Company Name
            </label>
            <input
              type="text"
              value={si.companyName || ""}
              maxLength={60}
              placeholder="e.g. SkillNaav Inc."
              onChange={(e) => {
                const clean = e.target.value.replace(/[^a-zA-Z0-9\s&.',-]/g, "");
                updateField("companyName", clean);
                setTouched((p) => ({ ...p, companyName: true }));
                setFieldErrors((p) => ({
                  ...p,
                  companyName: validateCompanyName(clean) || "",
                }));
              }}
              onBlur={() => {
                setTouched((p) => ({ ...p, companyName: true }));
                setFieldErrors((p) => ({
                  ...p,
                  companyName: validateCompanyName(si.companyName || "") || "",
                }));
              }}
              className={`!mt-0 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                touched.companyName && fieldErrors.companyName
                  ? "border-rose-400 focus:ring-rose-400"
                  : "border-gray-200 focus:ring-indigo-400"
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
            {touched.companyName && fieldErrors.companyName && (
              <p
                className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
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
                {fieldErrors.companyName}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Location {si.internshipMode && ["OFFLINE", "HYBRID"].includes(String(si.internshipMode).toUpperCase()) && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              value={si.location || ""}
              maxLength={80}
              placeholder="e.g. San Francisco, CA"
              onChange={(e) => {
                const clean = e.target.value.replace(/[^a-zA-Z0-9\s,.'/-]/g, "");
                updateField("location", clean);
                setTouched((p) => ({ ...p, location: true }));
                setFieldErrors((p) => ({
                  ...p,
                  location: validateLocation(clean, si.internshipMode || "ONLINE") || "",
                }));
              }}
              onBlur={() => {
                setTouched((p) => ({ ...p, location: true }));
                setFieldErrors((p) => ({
                  ...p,
                  location: validateLocation(si.location || "", si.internshipMode || "ONLINE") || "",
                }));
              }}
              className={`!mt-0 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                touched.location && fieldErrors.location
                  ? "border-rose-400 focus:ring-rose-400"
                  : "border-gray-200 focus:ring-indigo-400"
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
            {touched.location && fieldErrors.location && (
              <p
                className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
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
                {fieldErrors.location}
              </p>
            )}
          </div>

          {/* Sector */}
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Sector
            </label>
            <CustomSelectModal
              value={si.sector || ""}
              onChange={(val) => updateField("sector", val)}
              placeholder="Select Sector"
              options={Object.entries(SECTOR_LABELS).map(([val, label]) => ({
                value: val,
                label,
              }))}
            />
          </div>
        </div>

        <FormSectionLabel icon={faCalendarDays}>Schedule</FormSectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DateInput
            label="Start Date"
            minDate={minStartDate}
            value={si.startDate ? String(si.startDate).slice(0, 10) : ""}
            onChange={(val) => handleDateChange("startDate", val)}
          />
          <DateInput
            label="End Date"
            minDate={minEndDate}
            value={
              si.endDateOrDuration &&
              /^\d{4}-\d{2}-\d{2}/.test(si.endDateOrDuration)
                ? String(si.endDateOrDuration).slice(0, 10)
                : ""
            }
            onChange={(val) => handleDateChange("endDateOrDuration", val)}
          />
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Duration <span className="text-gray-400 font-normal">(Min 1 month)</span>
            </label>
            <input
              type="text"
              readOnly
              value={si.duration || ""}
              placeholder="Auto-calculated"
              className="!mt-0 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none font-medium"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
          </div>
        </div>

        <FormSectionLabel icon={faSliders}>
          Format & Classification
        </FormSectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Mode
            </label>
            <CustomSelectModal
              value={si.internshipMode || "ONLINE"}
              onChange={(val) => updateField("internshipMode", val)}
              options={[
                { value: "ONLINE", label: "Online" },
                { value: "OFFLINE", label: "Offline" },
                { value: "HYBRID", label: "Hybrid" },
              ]}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Classification
            </label>
            <CustomSelectModal
              value={si.classification || ""}
              onChange={(val) => updateField("classification", val)}
              placeholder="Select"
              options={[
                { value: "Basic", label: "Basic" },
                { value: "Intermediate", label: "Intermediate" },
                { value: "Advanced", label: "Advanced" },
              ]}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Type
            </label>
            <CustomSelectModal
              value={si.internshipType || "FREE"}
              onChange={(val) => handleTypeChange(val)}
              options={
                isFreemium
                  ? [
                      { value: "FREE", label: "Free" },
                      { value: "STIPEND", label: "Stipend" },
                    ]
                  : [
                      { value: "FREE", label: "Free" },
                      { value: "STIPEND", label: "Stipend" },
                      { value: "PAID", label: "Paid" },
                    ]
              }
            />
          </div>
        </div>

        {si.internshipType !== "FREE" && (
          <>
            <FormSectionLabel icon={faCoins}>Compensation</FormSectionLabel>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  className="block text-xs font-semibold text-gray-600 mb-1"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Amount
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={si.compensationDetails?.amount || ""}
                  onChange={(e) =>
                    updateField(
                      "compensationDetails.amount",
                      Number(e.target.value),
                    )
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-0 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold text-gray-600 mb-1"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Currency
                </label>
                <CustomSelectModal
                  value={si.compensationDetails?.currency || "USD"}
                  onChange={(val) =>
                    updateField("compensationDetails.currency", val)
                  }
                  options={["USD", "CAD", "EUR", "GBP"]}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold text-gray-600 mb-1"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Frequency
                </label>
                <CustomSelectModal
                  value={si.compensationDetails?.frequency || "MONTHLY"}
                  onChange={(val) =>
                    updateField("compensationDetails.frequency", val)
                  }
                  options={[
                    { value: "MONTHLY", label: "Monthly" },
                    { value: "WEEKLY", label: "Weekly" },
                    { value: "ONE_TIME", label: "One-time" },
                  ]}
                />
              </div>
            </div>
          </>
        )}

        <FormSectionLabel icon={faFileLines}>Description</FormSectionLabel>
        <textarea
          rows={4}
          value={si.jobDescription || ""}
          onChange={(e) => updateField("jobDescription", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        />

        <FormSectionLabel icon={faListCheck}>Qualifications</FormSectionLabel>
        <QualTagInput
          qualifications={
            Array.isArray(si.qualifications) ? si.qualifications : []
          }
          onChange={(updated) => updateField("qualifications", updated)}
        />

        <FormSectionLabel icon={faAddressCard}>Contact Information</FormSectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Contact Name */}
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Name
            </label>
            <input
              type="text"
              value={si.contactInfo?.name || ""}
              maxLength={50}
              placeholder="Contact Name"
              onChange={(e) => {
                const clean = e.target.value.replace(/[^a-zA-Z\s.'-]/g, "");
                updateField("contactInfo.name", clean);
                setTouched((p) => ({ ...p, contactName: true }));
                setFieldErrors((p) => ({
                  ...p,
                  contactName: validateContactName(clean) || "",
                }));
              }}
              onBlur={() => {
                setTouched((p) => ({ ...p, contactName: true }));
                setFieldErrors((p) => ({
                  ...p,
                  contactName:
                    validateContactName(si.contactInfo?.name || "") || "",
                }));
              }}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                touched.contactName && fieldErrors.contactName
                  ? "border-rose-400 focus:ring-rose-400/20 focus:border-rose-500"
                  : "border-gray-200 focus:ring-indigo-400"
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
            {touched.contactName && fieldErrors.contactName && (
              <p
                className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
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

          {/* Contact Email */}
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Email
            </label>
            <input
              type="email"
              value={si.contactInfo?.email || ""}
              maxLength={80}
              placeholder="name@example.com"
              onChange={(e) => {
                const clean = e.target.value.replace(/[^\w.@+-]/g, "");
                updateField("contactInfo.email", clean);
                setTouched((p) => ({ ...p, contactEmail: true }));
                setFieldErrors((p) => ({
                  ...p,
                  contactEmail: validateEmail(clean) || "",
                }));
              }}
              onBlur={() => {
                setTouched((p) => ({ ...p, contactEmail: true }));
                setFieldErrors((p) => ({
                  ...p,
                  contactEmail:
                    validateEmail(si.contactInfo?.email || "") || "",
                }));
              }}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                touched.contactEmail && fieldErrors.contactEmail
                  ? "border-rose-400 focus:ring-rose-400/20 focus:border-rose-500"
                  : "border-gray-200 focus:ring-indigo-400"
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
            {touched.contactEmail && fieldErrors.contactEmail && (
              <p
                className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
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

          {/* Contact Phone */}
          <div>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Phone
            </label>
            <PhoneInputWithCountry
              name="contactInfo.phone"
              value={si.contactInfo?.phone || ""}
              onChange={(e) => {
                updateField("contactInfo.phone", e.target.value);
                setTouched((p) => ({ ...p, contactPhone: true }));
                setFieldErrors((p) => ({
                  ...p,
                  contactPhone: validatePhone(e.target.value) || "",
                }));
              }}
              onBlur={() => {
                setTouched((p) => ({ ...p, contactPhone: true }));
                setFieldErrors((p) => ({
                  ...p,
                  contactPhone: validatePhone(si.contactInfo?.phone || "") || "",
                }));
              }}
              error={touched.contactPhone && fieldErrors.contactPhone}
            />
            {touched.contactPhone && fieldErrors.contactPhone && (
              <p
                className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
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

        <div className="h-2" />
      </div>

      {/* Sticky footer */}
      <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-t bg-white rounded-b-2xl">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition font-medium"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Back
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveClick}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FontAwesomeIcon icon={faFloppyDisk} />
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const YourJobPosts = () => {
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 12;

  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortCriteria, setSortCriteria] = useState("jobTitle");
  const [sortDirection, setSortDirection] = useState("asc");

  const [searchQuery, setSearchQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const debounceRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const partnerId = localStorage.getItem("partnerId");

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleDeleteJob = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await axios.delete(`/api/interns/${id}`, {
        params: { deletedBy: "partner" },
      });
      setInternships((prev) => prev.filter((i) => i._id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error deleting job post:", error);
    }
  };

  const fetchInternships = useCallback(
    async (page, query, sort, order, isFirst = false) => {
      if (!partnerId) return;
      isFirst ? setLoading(true) : setIsSearching(true);
      try {
        const response = await axios.get(`/api/interns/partner/${partnerId}`, {
          params: {
            page,
            limit: applicationsPerPage,
            search: query,
            sort,
            order,
          },
        });
        setInternships(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.total || 0);
        setCommittedQuery(query);
      } catch (error) {
        console.error("Error fetching internships:", error);
        setInternships([]);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [partnerId],
  );

  useEffect(() => {
    if (
      !selectedInternship?.startDate ||
      !selectedInternship?.endDateOrDuration
    ) {
      return;
    }

    const parseDate = (d) => {
      const s = String(d);
      return new Date(s.includes("T") ? s : s + "T00:00:00");
    };

    const start = parseDate(selectedInternship.startDate);
    const end = parseDate(selectedInternship.endDateOrDuration);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      updateField("duration", "");
      return;
    }

    if (end < start) {
      updateField("duration", "Invalid duration");
      return;
    }

    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;

    let duration = "";

    if (months > 0) {
      duration = `${months} month${months > 1 ? "s" : ""}`;

      if (days > 0) {
        duration += ` and ${days} day${days > 1 ? "s" : ""}`;
      }
    } else {
      duration = `${totalDays} day${totalDays > 1 ? "s" : ""}`;
    }

    updateField("duration", duration);
  }, [selectedInternship?.startDate, selectedInternship?.endDateOrDuration]);

  useEffect(() => {
    fetchInternships(1, "", sortCriteria, sortDirection, true);
    isInitialLoadRef.current = false;
  }, []); // eslint-disable-line

  // ── Auto-refresh every 30 s so admin approval status updates automatically ──
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!partnerId) return;
      try {
        const response = await axios.get(`/api/interns/partner/${partnerId}`, {
          params: {
            page: currentPage,
            limit: applicationsPerPage,
            search: committedQuery,
            sort: sortCriteria,
            order: sortDirection,
          },
        });
        setInternships(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.total || 0);
      } catch (_) {
        /* silent — do not show errors for background poll */
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [partnerId, currentPage, committedQuery, sortCriteria, sortDirection]); // eslint-disable-line

  useEffect(() => {
    if (isInitialLoadRef.current) return;
    fetchInternships(currentPage, committedQuery, sortCriteria, sortDirection);
  }, [currentPage]); // eslint-disable-line

  useEffect(() => {
    if (isInitialLoadRef.current) return;
    setCurrentPage(1);
    fetchInternships(1, committedQuery, sortCriteria, sortDirection);
  }, [sortCriteria, sortDirection]); // eslint-disable-line

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchInternships(1, q, sortCriteria, sortDirection);
    }, 350);
  };

  const clearSearch = () => {
    setSearchQuery("");
    clearTimeout(debounceRef.current);
    setCurrentPage(1);
    fetchInternships(1, "", sortCriteria, sortDirection);
  };

  const openViewModal = (internship) => {
    setSelectedInternship(internship);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedInternship(null);
      setModalMode("view");
    }, 200);
  };

  const updateField = (field, value) => {
    setSelectedInternship((prev) => {
      const keys = field.split(".");
      let updated = { ...prev };
      let cur = updated;
      keys.forEach((key, idx) => {
        if (idx === keys.length - 1) {
          cur[key] = value;
        } else {
          cur[key] = { ...cur[key] };
          cur = cur[key];
        }
      });
      return updated;
    });
  };

  const handleUpdateJob = async () => {
    if (!selectedInternship) return;

    // Send only the editable fields — never let the frontend decide adminApproved/adminStatus.
    // The backend PUT route always resets to "pending" on partner edits.
    const {
      _id,
      jobTitle,
      companyName,
      location,
      jobDescription,
      startDate,
      endDateOrDuration,
      duration,
      sector,
      classification,
      internshipMode,
      internshipType,
      compensationDetails,
      qualifications,
      contactInfo,
      imgUrl,
      applicationOpen,
      country,
      state,
      city,
    } = selectedInternship;

    const payload = {
      jobTitle,
      companyName,
      location,
      jobDescription,
      startDate,
      endDateOrDuration,
      duration,
      sector,
      classification,
      internshipMode,
      internshipType,
      compensationDetails,
      qualifications,
      contactInfo,
      imgUrl,
      applicationOpen,
      country,
      state,
      city,
    };

    const companyErr = validateCompanyName(companyName);
    if (companyErr) {
      alert(companyErr);
      return;
    }

    const titleErr = validateJobTitle(jobTitle);
    if (titleErr) {
      alert(titleErr);
      return;
    }

    if (contactInfo?.name) {
      const nameErr = validateContactName(contactInfo.name);
      if (nameErr) {
        alert(nameErr);
        return;
      }
    }

    if (contactInfo?.email) {
      const emailErr = validateEmail(contactInfo.email);
      if (emailErr) {
        alert(emailErr);
        return;
      }
    }

    if (contactInfo?.phone) {
      const phoneErr = validatePhone(contactInfo.phone);
      if (phoneErr) {
        alert(phoneErr);
        return;
      }
    }

    if (
      startDate &&
      endDateOrDuration &&
      /^\d{4}-\d{2}-\d{2}/.test(String(startDate)) &&
      /^\d{4}-\d{2}-\d{2}/.test(String(endDateOrDuration))
    ) {
      const start = new Date(String(startDate).slice(0, 10) + "T00:00:00");
      const end = new Date(String(endDateOrDuration).slice(0, 10) + "T00:00:00");
      const minEndDate = new Date(start);
      minEndDate.setMonth(minEndDate.getMonth() + 1);

      if (end < minEndDate) {
        alert("Internship duration must be at least 1 month. Please select an End Date at least 1 month after the Start Date.");
        return;
      }
    }

    try {
      const response = await axios.put(`/api/interns/${_id}`, payload);
      // Update local list with the response (which has adminStatus: "pending" from backend)
      setInternships((prev) =>
        prev.map((i) => (i._id === _id ? response.data : i)),
      );
      // Also update the selected internship so the view modal reflects pending status
      setSelectedInternship(response.data);
      setModalMode("view");
    } catch (error) {
      console.error("Error updating internship:", error);
      alert(error.response?.data?.message || "Error updating internship post");
    }
  };

  return (
    <div
      className="p-4 sm:p-6 rounded-lg shadow-md"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Search + Sort Row */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4 w-full">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 flex items-center">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
          </span>
          {/*Add "!mt-0" style to input class for alignment - 04-08-2026 */}
          <input
            type="text"
            placeholder="Search by Organization, Role, or Company"
            value={searchQuery}
            onChange={handleSearchChange}
            className="!mt-0 !m-0 !pl-10 !pr-9 border border-gray-300 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 h-10 box-border bg-white text-gray-800 placeholder-gray-400 search-input"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          />
          {isSearching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isSearching && searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <FontAwesomeIcon icon={faXmark} className="text-sm" />
            </button>
          )}
        </div>

        {/* Controls group */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 w-full lg:w-auto">
          <SortDropdown
            value={sortCriteria}
            onChange={setSortCriteria}
          />
          <button
            onClick={() =>
              setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
            }
            className="h-10 flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-100 font-medium w-full sm:w-24 flex-1 sm:flex-initial justify-center box-border whitespace-nowrap"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FontAwesomeIcon
              icon={sortDirection === "asc" ? faArrowUpAZ : faArrowDownZA}
              className="text-xs"
            />
            {sortDirection === "asc" ? "Asc" : "Desc"}
          </button>

          {/* Manual refresh button */}
          <button
            title="Refresh status"
            onClick={async () => {
              setIsRefreshing(true);
              await fetchInternships(
                currentPage,
                committedQuery,
                sortCriteria,
                sortDirection,
              );
              setIsRefreshing(false);
            }}
            className="h-10 flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-medium w-full sm:w-auto flex-1 sm:flex-initial justify-center box-border whitespace-nowrap"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className={`text-xs ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Result count */}
      <p
        className="text-xs text-gray-400 mb-3 flex items-center gap-1.5 min-h-[20px]"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {!loading && totalCount > 0 && (
          <>
            <FontAwesomeIcon icon={faLayerGroup} className="text-gray-300" />
            {totalCount} result{totalCount !== 1 ? "s" : ""}
            {committedQuery && (
              <>
                {" "}
                for "<em className="text-gray-600">{committedQuery}</em>"
              </>
            )}
          </>
        )}
      </p>

      {/* Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center w-full">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p
            className="text-sm font-semibold text-gray-600"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Loading your job posts...
          </p>
        </div>
      ) : internships.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FontAwesomeIcon
            icon={faBriefcase}
            className="text-4xl mb-3 opacity-30"
          />
          <p
            className="text-sm"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            No internships found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {internships.map((internship) => (
            <div
              key={internship._id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100
                   hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex flex-col relative overflow-hidden min-w-0"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {/* Three Dots Menu */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(
                      openMenuId === internship._id ? null : internship._id,
                    );
                  }}
                  className="p-2 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all"
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>

                {openMenuId === internship._id && (
                  <div
                    className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        handleDeleteJob(internship._id);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      Delete Post
                    </button>
                  </div>
                )}
              </div>

              {/* Logo / Image */}
              <div className="mb-4 w-full h-32 flex items-center justify-center overflow-hidden">
                <img
                  src={internship.imgUrl || defaultCompanyLogo}
                  alt={internship.jobTitle}
                  className="max-h-28 max-w-full object-contain p-2"
                  width="200"
                  height="112"
                  loading="lazy"
                />
              </div>

              {/* Title + Company */}
              <h3
                className="text-[15px] font-bold text-gray-900 leading-snug mb-0.5 truncate pr-8"
                title={internship.jobTitle}
              >
                {internship.jobTitle}
              </h3>
              <div className="flex flex-col gap-1 mb-3 min-w-0 pr-8">
                <div className="text-xs font-medium text-indigo-500 flex items-center gap-1 min-w-0">
                  <FontAwesomeIcon
                    icon={faBriefcase}
                    className="text-[9px] text-indigo-300 shrink-0"
                  />
                  <span className="truncate min-w-0" title={internship.companyName}>{internship.companyName}</span>
                  <span className="text-gray-300 mx-0.5 shrink-0">·</span>
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="text-[9px] text-gray-300 shrink-0"
                  />
                  <span className="text-gray-400 font-normal truncate min-w-0" title={internship.location}>
                    {internship.location}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 truncate min-w-0" title={`ID: ${internship._id}`}>
                  ID: {internship._id}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <ModePill mode={internship.internshipMode} />
                <TypePill type={internship.internshipType} />
                {internship.classification && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                    <FontAwesomeIcon icon={faBullseye} className="text-[9px]" />
                    {internship.classification}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-1.5 mb-4 min-w-0">
                <p className="text-xs text-gray-600 flex items-center gap-1.5 min-w-0">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="text-gray-300 w-3.5 text-center shrink-0"
                  />
                  <span className="font-semibold text-gray-700 shrink-0">Duration:</span>{" "}
                  <span className="truncate min-w-0" title={internship.duration || "—"}>
                    {internship.duration || "—"}
                  </span>
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5 min-w-0">
                  <FontAwesomeIcon
                    icon={faCoins}
                    className="text-gray-300 w-3.5 text-center shrink-0"
                  />
                  <span className="font-semibold text-gray-700 shrink-0">
                    Compensation:
                  </span>{" "}
                  <span className="truncate min-w-0">
                    <CompLabel i={internship} />
                  </span>
                </p>
                {internship.sector && (
                  <p className="text-xs text-gray-600 flex items-center gap-1.5 min-w-0">
                    <FontAwesomeIcon
                      icon={faIndustry}
                      className="text-gray-300 w-3.5 text-center shrink-0"
                    />
                    <span className="font-semibold text-gray-700 shrink-0">Sector:</span>{" "}
                    <span className="text-indigo-600 truncate min-w-0" title={SECTOR_LABELS[internship.sector] || internship.sector}>
                      {SECTOR_LABELS[internship.sector] || internship.sector}
                    </span>
                  </p>
                )}
              </div>

              {/* Card footer */}
              <div className="mt-auto flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 gap-2">
                <StatusPill
                  adminStatus={internship.adminStatus}
                  adminReviewed={internship.adminReviewed}
                  adminApproved={internship.adminApproved}
                />
                <button
                  onClick={() => openViewModal(internship)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold
                       rounded-lg hover:bg-indigo-700 active:scale-95 transition-all duration-150 shrink-0"
                >
                  View Details
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-[10px]"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center px-2 sm:px-4 py-6">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-white p-1 sm:p-1.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50 max-w-full overflow-x-auto scrollbar-none">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isSearching || loading}
              aria-label="Previous page"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50/50 shrink-0"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              <span className="hidden sm:inline">Previous</span>
            </button>

            {(() => {
              if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
              if (currentPage <= 3) return [1, 2, 3, 4, "...", totalPages];
              if (currentPage >= totalPages - 2) return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
              return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
            })().map((p, idx) =>
              p === "..." ? (
                <div
                  key={`ellipsis-${idx}`}
                  className="w-7 sm:w-10 h-9 sm:h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 text-xs sm:text-sm font-semibold select-none shrink-0"
                >
                  ...
                </div>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  disabled={isSearching || loading}
                  className={`w-8 sm:w-10 h-9 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                    currentPage === p
                      ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isSearching || loading}
              aria-label="Next page"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50/50 shrink-0"
            >
              <span className="hidden sm:inline">Next</span>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel={
          modalMode === "view" ? "Internship Details" : "Edit Internship"
        }
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[999]"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
          style={{ maxHeight: "90vh", fontFamily: "'Poppins', sans-serif" }}
        >
          {selectedInternship &&
            (modalMode === "view" ? (
              <ViewModalBody
                internship={selectedInternship}
                onEdit={() => setModalMode("edit")}
                onClose={closeModal}
              />
            ) : (
              <EditModalBody
                internship={selectedInternship}
                updateField={updateField}
                onSave={handleUpdateJob}
                onBack={() => setModalMode("view")}
                onClose={closeModal}
              />
            ))}
        </div>
      </Modal>

      {/* ─── Delete Confirmation Modal ─── */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center w-full max-w-sm mx-auto"
            style={{
              fontFamily: "'Poppins', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-50 mb-4">
              <FontAwesomeIcon
                icon={faTrash}
                className="text-red-500 w-6 h-6 sm:w-7 sm:h-7"
              />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1 text-center">
              Move to Bin?
            </h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Are you sure you want to move this job post to the Bin?
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors text-sm shadow-md"
              >
                OK, Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YourJobPosts;
