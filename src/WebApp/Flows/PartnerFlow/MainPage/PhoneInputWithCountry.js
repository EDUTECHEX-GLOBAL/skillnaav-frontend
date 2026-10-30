import React, { useState, useEffect, useRef, useMemo } from "react";

export const COUNTRIES = [
  { code: "US", name: "United States", dialCode: "+1", minDigits: 10, maxDigits: 10 },
  { code: "CA", name: "Canada", dialCode: "+1", minDigits: 10, maxDigits: 10 },
  { code: "IN", name: "India", dialCode: "+91", minDigits: 10, maxDigits: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", minDigits: 10, maxDigits: 11 },
  { code: "AU", name: "Australia", dialCode: "+61", minDigits: 9, maxDigits: 10 },
  { code: "DE", name: "Germany", dialCode: "+49", minDigits: 10, maxDigits: 12 },
  { code: "FR", name: "France", dialCode: "+33", minDigits: 9, maxDigits: 10 },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", minDigits: 9, maxDigits: 9 },
  { code: "SG", name: "Singapore", dialCode: "+65", minDigits: 8, maxDigits: 8 },
  { code: "NZ", name: "New Zealand", dialCode: "+64", minDigits: 8, maxDigits: 10 },
  { code: "IE", name: "Ireland", dialCode: "+353", minDigits: 9, maxDigits: 9 },
  { code: "MX", name: "Mexico", dialCode: "+52", minDigits: 10, maxDigits: 10 },
  { code: "BR", name: "Brazil", dialCode: "+55", minDigits: 10, maxDigits: 11 },
  { code: "IT", name: "Italy", dialCode: "+39", minDigits: 9, maxDigits: 11 },
  { code: "ES", name: "Spain", dialCode: "+34", minDigits: 9, maxDigits: 9 },
  { code: "NL", name: "Netherlands", dialCode: "+31", minDigits: 9, maxDigits: 9 },
  { code: "SE", name: "Sweden", dialCode: "+46", minDigits: 9, maxDigits: 9 },
  { code: "CH", name: "Switzerland", dialCode: "+41", minDigits: 9, maxDigits: 9 },
  { code: "ZA", name: "South Africa", dialCode: "+27", minDigits: 9, maxDigits: 9 },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", minDigits: 9, maxDigits: 9 },
  { code: "PK", name: "Pakistan", dialCode: "+92", minDigits: 10, maxDigits: 10 },
  { code: "BD", name: "Bangladesh", dialCode: "+880", minDigits: 10, maxDigits: 10 },
  { code: "PH", name: "Philippines", dialCode: "+63", minDigits: 10, maxDigits: 10 },
  { code: "NG", name: "Nigeria", dialCode: "+234", minDigits: 10, maxDigits: 10 },
  { code: "JP", name: "Japan", dialCode: "+81", minDigits: 10, maxDigits: 11 },
  { code: "KR", name: "South Korea", dialCode: "+82", minDigits: 9, maxDigits: 11 },
  { code: "CN", name: "China", dialCode: "+86", minDigits: 11, maxDigits: 11 },
  { code: "MY", name: "Malaysia", dialCode: "+60", minDigits: 9, maxDigits: 10 },
  { code: "ID", name: "Indonesia", dialCode: "+62", minDigits: 10, maxDigits: 12 },
  { code: "VN", name: "Vietnam", dialCode: "+84", minDigits: 9, maxDigits: 10 },
];

export const FlagIcon = ({ code }) => {
  const c = (code || "").toUpperCase();
  if (c === "US") {
    return (
      <svg className="w-5 h-3.5 rounded-xs shrink-0 shadow-xs inline-block" viewBox="0 0 640 480">
        <g fillRule="evenodd">
          <path fill="#bd3d44" d="M0 0h640v480H0z"/>
          <path stroke="#fff" strokeWidth="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"/>
          <path fill="#192f5d" d="M0 0h256v258.5H0z"/>
          <circle cx="128" cy="129" r="80" fill="#fff" fillOpacity=".3"/>
        </g>
      </svg>
    );
  }
  if (c === "CA") {
    return (
      <svg className="w-5 h-3.5 rounded-xs shrink-0 shadow-xs inline-block" viewBox="0 0 640 480">
        <path fill="#d52b1e" d="M0 0h160v480H0zM480 0h160v480H480z"/>
        <path fill="#fff" d="M160 0h320v480H160z"/>
        <path fill="#d52b1e" d="M320 140l20 50 45-15-20 45 40 25-45 10 5 45-45-20-45 20 5-45-45-10 40-25-20-45 45 15z"/>
      </svg>
    );
  }
  if (c === "IN") {
    return (
      <svg className="w-5 h-3.5 rounded-xs shrink-0 shadow-xs inline-block" viewBox="0 0 640 480">
        <path fill="#ff9933" d="M0 0h640v160H0z"/>
        <path fill="#fff" d="M0 160h640v160H0z"/>
        <path fill="#128807" d="M0 320h640v160H0z"/>
        <circle cx="320" cy="240" r="36" fill="none" stroke="#000088" strokeWidth="8"/>
      </svg>
    );
  }
  if (c === "GB") {
    return (
      <svg className="w-5 h-3.5 rounded-xs shrink-0 shadow-xs inline-block" viewBox="0 0 640 480">
        <path fill="#012169" d="M0 0h640v480H0z"/>
        <path stroke="#fff" strokeWidth="60" d="M0 0l640 480M640 0L0 480"/>
        <path stroke="#c8102e" strokeWidth="40" d="M0 0l640 480M640 0L0 480"/>
        <path stroke="#fff" strokeWidth="100" d="M320 0v480M0 240h640"/>
        <path stroke="#c8102e" strokeWidth="60" d="M320 0v480M0 240h640"/>
      </svg>
    );
  }
  if (c === "AU") {
    return (
      <svg className="w-5 h-3.5 rounded-xs shrink-0 shadow-xs inline-block" viewBox="0 0 640 480">
        <path fill="#00008b" d="M0 0h640v480H0z"/>
        <path stroke="#fff" strokeWidth="30" d="M0 0l320 240M320 0L0 240"/>
        <path stroke="#c8102e" strokeWidth="20" d="M0 0l320 240M320 0L0 240"/>
        <path stroke="#fff" strokeWidth="50" d="M160 0v240M0 120h320"/>
        <path stroke="#c8102e" strokeWidth="30" d="M160 0v240M0 120h320"/>
      </svg>
    );
  }
  if (c === "DE") {
    return (
      <svg className="w-5 h-3.5 rounded-xs shrink-0 shadow-xs inline-block" viewBox="0 0 640 480">
        <path fill="#000" d="M0 0h640v160H0z"/>
        <path fill="#d00" d="M0 160h640v160H0z"/>
        <path fill="#ffce00" d="M0 320h640v160H0z"/>
      </svg>
    );
  }
  return (
    <img
      src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
      width="20"
      height="15"
      alt={code}
      className="rounded-xs object-cover shadow-xs shrink-0 inline-block"
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  );
};

export function formatPhoneDigits(digits, country) {
  if (!digits) return "";
  const clean = digits.replace(/\D/g, "");
  
  if (country?.dialCode === "+1") {
    const d = clean.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }

  if (clean.length <= 4) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  if (clean.length <= 10) return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 10)} ${clean.slice(10, 14)}`;
}

export function parsePhoneNumber(val, defaultCountryCode = "US") {
  if (!val || typeof val !== "string") {
    const defaultC = COUNTRIES.find((c) => c.code === defaultCountryCode) || COUNTRIES[0];
    return { country: defaultC, number: "" };
  }

  const trimmed = val.trim();

  if (trimmed.startsWith("+")) {
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (trimmed.startsWith(c.dialCode)) {
        const remaining = trimmed.slice(c.dialCode.length).trim();
        return { country: c, number: remaining };
      }
    }
  }

  const defaultC = COUNTRIES.find((c) => c.code === defaultCountryCode) || COUNTRIES[0];
  return { country: defaultC, number: trimmed };
}

export function validatePhoneInput(phoneVal, selectedCountry) {
  if (!phoneVal || !phoneVal.trim()) {
    return "Phone number is required.";
  }
  const digits = phoneVal.replace(/\D/g, "");
  if (!digits) {
    return "Phone number can only contain digits.";
  }

  const min = selectedCountry?.minDigits || 10;
  const max = selectedCountry?.maxDigits || 15;

  if (selectedCountry?.dialCode === "+1" && digits.length !== 10) {
    return `Please enter a valid 10-digit number for ${selectedCountry.name}, e.g. (123) 456-7890.`;
  }

  if (digits.length < min || digits.length > max) {
    return `Please enter a valid phone number for ${selectedCountry?.name || "selected country"} (${min}${min === max ? "" : `-${max}`} digits).`;
  }

  return "";
}

export default function PhoneInputWithCountry({
  value = "",
  onChange,
  onBlur,
  name = "phone",
  placeholder = "Phone Number",
  defaultCountry = "US",
  required = false,
  disabled = false,
  error = "",
  className = "",
  inputClassName = "",
  buttonClassName = "",
  id,
}) {
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return parsePhoneNumber(value, defaultCountry).country;
  });

  const [phoneNumber, setPhoneNumber] = useState(() => {
    const { number } = parsePhoneNumber(value, defaultCountry);
    return formatPhoneDigits(number, parsePhoneNumber(value, defaultCountry).country);
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const topBoxRef = useRef(null);
  const searchInputRef = useRef(null);
  const [dropdownWidth, setDropdownWidth] = useState(null);

  useEffect(() => {
    const { country, number } = parsePhoneNumber(value, defaultCountry);
    setSelectedCountry((prev) => {
      if (value && value.startsWith("+")) {
        return country;
      }
      return prev || country;
    });
    setPhoneNumber(formatPhoneDigits(number, country));
  }, [value, defaultCountry]);

  // Measure top box width precisely when opened
  useEffect(() => {
    if (isOpen && topBoxRef.current) {
      const rect = topBoxRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setDropdownWidth(Math.round(rect.width));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return COUNTRIES;
    const term = searchTerm.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.dialCode.includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm("");
    const formatted = formatPhoneDigits(phoneNumber, country);
    setPhoneNumber(formatted);

    const fullVal = formatted ? `${country.dialCode} ${formatted}` : "";
    if (onChange) {
      onChange({
        target: {
          name,
          value: fullVal,
          countryCode: country.code,
          dialCode: country.dialCode,
          phoneNumber: formatted,
        },
      });
    }
  };

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const formatted = formatPhoneDigits(rawVal, selectedCountry);
    setPhoneNumber(formatted);

    const fullVal = formatted ? `${selectedCountry.dialCode} ${formatted}` : "";
    if (onChange) {
      onChange({
        target: {
          name,
          value: fullVal,
          countryCode: selectedCountry.code,
          dialCode: selectedCountry.dialCode,
          phoneNumber: formatted,
        },
      });
    }
  };

  const handleInputBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div
      className={`relative w-full min-w-0 ${className}`}
      ref={dropdownRef}
      style={{ boxSizing: "border-box" }}
    >
      {/* Top Input Box */}
      <div
        ref={topBoxRef}
        className="flex items-center w-full min-w-0"
        style={{ boxSizing: "border-box" }}
      >
        {/* Country Code Selector Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-1.5 px-2.5 py-2 bg-white border border-r-0 rounded-l-xl text-sm font-medium text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shrink-0 ${
            error ? "border-rose-400" : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : "cursor-pointer"} ${buttonClassName}`}
          style={{ width: "88px", height: "42px", boxSizing: "border-box" }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <FlagIcon code={selectedCountry.code} />
          <svg
            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs font-semibold text-gray-700 select-none shrink-0">{selectedCountry.dialCode}</span>
        </button>

        {/* Phone Number Input */}
        <input
          type="tel"
          id={id}
          name={name}
          disabled={disabled}
          required={required}
          value={phoneNumber}
          onChange={handlePhoneChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          maxLength={18}
          className={`flex-1 min-w-0 px-3 py-2 bg-white border border-l-0 rounded-r-xl text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 ${
            error ? "border-rose-400" : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""} ${inputClassName}`}
          style={{ height: "42px", boxSizing: "border-box" }}
        />
      </div>

      {/* Down Dropdown Menu - EXACT SAME PIXEL WIDTH AS THE TOP BOX */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: 0,
            width: dropdownWidth ? `${dropdownWidth}px` : "100%",
            maxWidth: dropdownWidth ? `${dropdownWidth}px` : "100%",
            minWidth: 0,
            boxSizing: "border-box",
            maxHeight: "260px",
          }}
        >
          {/* Search Box */}
          <div className="px-2 pb-1.5 border-b border-gray-100 box-border w-full">
            <div className="relative w-full box-border">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search country or code..."
                className="w-full box-border pl-7 pr-2.5 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white"
                style={{ boxSizing: "border-box", height: "32px" }}
              />
              <svg
                className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Country List */}
          <div className="overflow-y-auto mt-1 w-full box-border" style={{ maxHeight: "190px" }}>
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-3 text-xs text-center text-gray-500">No country found</div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code && c.dialCode === selectedCountry.dialCode;
                return (
                  <button
                    key={`${c.code}-${c.dialCode}`}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full box-border flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors hover:bg-cyan-50 ${
                      isSelected ? "bg-cyan-50/80 font-semibold text-cyan-800" : "text-gray-700"
                    }`}
                    style={{ boxSizing: "border-box" }}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <FlagIcon code={c.code} />
                      <span className="truncate text-xs">{c.name}</span>
                    </div>
                    <span className="text-gray-500 font-mono text-xs ml-1.5 shrink-0">{c.dialCode}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
