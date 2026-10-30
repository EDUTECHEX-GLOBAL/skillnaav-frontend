import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export default function ResponsiveSelect({
  value = "",
  onChange,
  options = [],
  placeholder = "Select...",
  name = "",
  disabled = false,
  className = "",
  error = false,
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse children <option> elements if provided, or use options array
  const parsedOptions = React.useMemo(() => {
    if (options && options.length > 0) {
      return options.map((opt) =>
        typeof opt === "object" && opt !== null
          ? { value: opt.value, label: opt.label || opt.name || opt.value }
          : { value: opt, label: String(opt) }
      );
    }
    if (children) {
      const childArray = React.Children.toArray(children);
      return childArray
        .filter((child) => React.isValidElement(child) && child.type === "option")
        .map((child) => ({
          value: child.props.value !== undefined ? child.props.value : child.props.children,
          label: child.props.children || child.props.value || "",
        }));
    }
    return [];
  }, [options, children]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
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

  const selectedOption = parsedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  const displayLabel = selectedOption
    ? selectedOption.label
    : placeholder;

  const handleSelect = (optValue) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      onChange({
        target: {
          name: name || "",
          value: optValue,
        },
      });
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-full min-w-0 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full max-w-full min-w-0 flex items-center justify-between px-3.5 py-2.5 bg-white border ${
          error
            ? "border-red-500 ring-1 ring-red-300"
            : isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-gray-300 hover:border-gray-400"
        } rounded-lg text-sm text-left transition duration-150 ${
          disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"
        }`}
      >
        <span
          className={`truncate mr-2 ${
            !selectedOption || selectedOption.value === ""
              ? "text-gray-400"
              : "text-gray-800 font-medium"
          }`}
        >
          {displayLabel || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Overlay - Constrained 100% to Trigger Width */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] max-h-56 overflow-y-auto overscroll-contain p-1 space-y-0.5">
          {parsedOptions.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={`${opt.value}-${idx}`}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                  isSelected
                    ? "bg-indigo-600 text-white font-semibold shadow-sm"
                    : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
