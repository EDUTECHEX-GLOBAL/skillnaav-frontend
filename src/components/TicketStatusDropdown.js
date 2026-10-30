import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown } from "react-icons/fa";

export default function TicketStatusDropdown({
  status,
  onChange,
  disabled = false,
  statColor,
  ringColor = "orange-400",
  options = [
    { value: "open", label: "Open" },
    { value: "in-progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
  ],
  width = "w-[115px]",
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

  const currentOption = options.find((o) => o.value === status) || {
    value: status || "open",
    label:
      status === "in-progress"
        ? "In Progress"
        : status === "resolved"
        ? "Resolved"
        : status === "closed"
        ? "Closed"
        : "Open",
  };

  const ringClass =
    ringColor === "indigo-500"
      ? "focus:ring-indigo-500"
      : "focus:ring-orange-400";

  return (
    <div ref={containerRef} className={`relative inline-block ${width}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full text-xs font-semibold px-2.5 py-1 rounded-full border border-current border-opacity-20 flex items-center justify-between gap-1 focus:outline-none focus:ring-2 ${ringClass} cursor-pointer transition-colors ${
          statColor ? statColor(status) : "bg-gray-100 text-gray-800"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="truncate">{currentOption.label}</span>
        <FaChevronDown
          className={`w-2.5 h-2.5 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-semibold block transition-colors truncate ${
                status === opt.value
                  ? statColor
                    ? statColor(opt.value)
                    : "bg-blue-100 text-blue-800"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
