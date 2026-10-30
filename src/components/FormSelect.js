import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown } from "react-icons/fa";

export default function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  focusRingColor = "blue-500",
  className = "",
  buttonClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          buttonClassName ||
          `w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-${focusRingColor} bg-white flex items-center justify-between text-left`
        }
      >
        <span className="truncate text-gray-900 block flex-1">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FaChevronDown
          className={`w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 w-full max-w-full overflow-x-hidden bg-white rounded-lg shadow-xl border border-gray-200 z-[100] max-h-60 overflow-y-auto py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange({ target: { value: opt.value } });
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors truncate block ${
                value === opt.value
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={opt.label}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
