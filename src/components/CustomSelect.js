import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';

// Validation helper: strictly allow only numbers and colon, formatted as HH:mm (24-hour)
const sanitizeTimeInput = (raw) => {
  let clean = raw.replace(/[^0-9:]/g, '');

  if (!clean) return '';

  if (!clean.includes(':')) {
    if (clean.length > 2) {
      clean = clean.slice(0, 2) + ':' + clean.slice(2, 4);
    }
  }

  const parts = clean.split(':');
  let h = parts[0]?.slice(0, 2) || '';
  let m = parts.slice(1).join('').slice(0, 2);

  if (h.length === 2) {
    const numH = parseInt(h, 10);
    if (numH > 23) h = '23';
  }

  if (m.length === 2) {
    const numM = parseInt(m, 10);
    if (numM > 59) m = '59';
  }

  if (parts.length > 1) {
    return `${h}:${m}`.slice(0, 5);
  }
  return h.slice(0, 2);
};

export default function CustomSelect({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select or type time (e.g. 09:30)',
  isOptionDisabled = null,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(sanitizeTimeInput(value || ''));
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Auto-scroll to selected item when opened
  useEffect(() => {
    if (isOpen && listRef.current && inputValue) {
      setTimeout(() => {
        const activeEl = listRef.current?.querySelector('[data-selected="true"]');
        if (activeEl) {
          activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 50);
    }
  }, [isOpen, inputValue]);

  const handleInputChange = (e) => {
    const raw = e.target.value;
    const sanitized = sanitizeTimeInput(raw);
    setInputValue(sanitized);
    if (onChange) {
      onChange({ target: { value: sanitized } });
    }
  };

  const handleKeyDown = (e) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape', ':'];
    if (allowedKeys.includes(e.key) || (e.ctrlKey || e.metaKey)) {
      return;
    }
    // Block if not a digit 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleSelect = (optionValue) => {
    if (disabled) return;
    setInputValue(optionValue);
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { value: optionValue } });
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    if (onChange) {
      onChange({ target: { value: '' } });
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Top Box Input (Numbers-only typing + Clickable for dropdown) */}
      <div
        className={`w-full flex items-center justify-between px-3.5 py-2 bg-white border ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-300'
        } rounded-lg shadow-sm transition duration-150 ${
          disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'hover:border-indigo-400'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={inputValue}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsOpen(true)}
          maxLength={5}
          className="w-full bg-transparent text-sm text-gray-900 font-medium placeholder-gray-400 outline-none border-none p-0 focus:ring-0 focus:outline-none"
        />

        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              title="Clear"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none p-0.5"
          >
            <FiChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Box - Matches the exact width of the top box (w-full) */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-1.5 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] max-h-56 overflow-y-auto overscroll-contain p-1 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-200 animate-in fade-in zoom-in-95 duration-100"
        >
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            const isSelected = inputValue === optVal;
            const isDisabled =
              (typeof opt === 'object' && opt.disabled) ||
              (isOptionDisabled && isOptionDisabled(optVal));

            return (
              <button
                key={optVal}
                type="button"
                data-selected={isSelected}
                disabled={isDisabled}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => !isDisabled && handleSelect(optVal)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400'
                    : isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-indigo-50/80 hover:text-indigo-600 font-medium'
                }`}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
