import React, { useState, useEffect, useRef } from 'react';
import { FiClock, FiChevronDown, FiX } from 'react-icons/fi';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Validation helper: strictly allow only numbers and colon, formatted as HH:mm (24-hour)
const sanitizeTimeInput = (raw) => {
  // Remove all non-digit and non-colon characters (blocks letters like 'sss', special characters, etc.)
  let clean = raw.replace(/[^0-9:]/g, '');

  if (!clean) return '';

  // If typed without colon (e.g., "0930" or "930")
  if (!clean.includes(':')) {
    if (clean.length > 2) {
      clean = clean.slice(0, 2) + ':' + clean.slice(2, 4);
    }
  }

  const parts = clean.split(':');
  let h = parts[0]?.slice(0, 2) || '';
  let m = parts.slice(1).join('').slice(0, 2);

  // Validate Hours (00 - 23)
  if (h.length === 2) {
    const numH = parseInt(h, 10);
    if (numH > 23) h = '23';
  }

  // Validate Minutes (00 - 59)
  if (m.length === 2) {
    const numM = parseInt(m, 10);
    if (numM > 59) m = '59';
  }

  if (parts.length > 1) {
    return `${h}:${m}`.slice(0, 5);
  }
  return h.slice(0, 2);
};

export default function CustomTimePicker({
  name,
  value = '',
  onChange,
  placeholder = 'HH:mm (e.g. 09:00)',
  required = false,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [typedValue, setTypedValue] = useState(value || '');
  const containerRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);
  const inputRef = useRef(null);

  // Parse initial value "HH:mm"
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');

  useEffect(() => {
    const sanitized = sanitizeTimeInput(value || '');
    setTypedValue(sanitized);
    if (sanitized && sanitized.includes(':')) {
      const [h, m] = sanitized.split(':');
      setSelectedHour(h || '');
      setSelectedMinute(m || '');
    } else {
      setSelectedHour('');
      setSelectedMinute('');
    }
  }, [value]);

  // Handle outside click to close dropdown
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

  // Scroll to selected items when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hourListRef.current && selectedHour) {
          const activeHourEl = hourListRef.current.querySelector('[data-selected="true"]');
          if (activeHourEl) {
            activeHourEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
        if (minuteListRef.current && selectedMinute) {
          const activeMinuteEl = minuteListRef.current.querySelector('[data-selected="true"]');
          if (activeMinuteEl) {
            activeMinuteEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }, 50);
    }
  }, [isOpen, selectedHour, selectedMinute]);

  const updateTime = (hour, minute) => {
    const h = hour !== undefined ? hour : (selectedHour || '09');
    const m = minute !== undefined ? minute : (selectedMinute || '00');
    
    setSelectedHour(h);
    setSelectedMinute(m);

    const formattedTime = `${h}:${m}`;
    setTypedValue(formattedTime);
    if (onChange) {
      onChange({
        target: {
          name,
          value: formattedTime
        }
      });
    }
  };

  const handleHourSelect = (h) => {
    updateTime(h, selectedMinute || '00');
  };

  const handleMinuteSelect = (m) => {
    updateTime(selectedHour || '09', m);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    const sanitized = sanitizeTimeInput(raw);
    setTypedValue(sanitized);

    if (sanitized.includes(':')) {
      const [h, m] = sanitized.split(':');
      if (h.length === 2) setSelectedHour(h);
      if (m && m.length === 2) setSelectedMinute(m);
    }

    if (onChange) {
      onChange({
        target: {
          name,
          value: sanitized
        }
      });
    }
  };

  // Block non-numeric characters on keydown (except backspace, delete, tab, arrows, colon)
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

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedHour('');
    setSelectedMinute('');
    setTypedValue('');
    if (onChange) {
      onChange({
        target: {
          name,
          value: ''
        }
      });
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Top Box Input (Allows numbers-only typing & clicking) */}
      <div
        className={`w-full flex items-center justify-between px-3.5 py-2 bg-white border ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-300'
        } rounded-lg shadow-sm transition duration-150 ${
          disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'hover:border-indigo-400'
        }`}
      >
        <div className="flex items-center gap-2.5 w-full min-w-0">
          <FiClock className={`text-base flex-shrink-0 ${isOpen ? 'text-indigo-600' : 'text-gray-400'}`} />
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            name={name}
            value={typedValue}
            disabled={disabled}
            placeholder={placeholder}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => !disabled && setIsOpen(true)}
            required={required}
            maxLength={5}
            className="w-full bg-transparent text-sm text-gray-900 font-medium placeholder-gray-400 outline-none border-none p-0 focus:ring-0 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {typedValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              title="Clear time"
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

      {/* Dropdown Box - Exactly matches the top box width (w-full) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="bg-indigo-50/70 border-b border-indigo-100/80 px-3 py-2 flex items-center justify-between">
            <div className="grid grid-cols-2 w-full text-center text-xs font-semibold text-indigo-900 tracking-wider uppercase">
              <span>Hour</span>
              <span>Minute</span>
            </div>
          </div>

          {/* 2-Column Time Selector */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 h-48">
            {/* Hours Column */}
            <div
              ref={hourListRef}
              className="overflow-y-auto overscroll-contain p-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-200"
            >
              {HOURS.map((h) => {
                const isSelected = selectedHour === h;
                return (
                  <button
                    key={h}
                    type="button"
                    data-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleHourSelect(h)}
                    className={`w-full text-center py-1.5 px-2 rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-gray-700 hover:bg-indigo-50/80 hover:text-indigo-600 font-medium'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>

            {/* Minutes Column */}
            <div
              ref={minuteListRef}
              className="overflow-y-auto overscroll-contain p-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-200"
            >
              {MINUTES.map((m) => {
                const isSelected = selectedMinute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    data-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleMinuteSelect(m)}
                    className={`w-full text-center py-1.5 px-2 rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-gray-700 hover:bg-indigo-50/80 hover:text-indigo-600 font-medium'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 flex items-center justify-between">
            <div className="text-xs text-gray-500 font-medium">
              {selectedHour && selectedMinute ? (
                <span className="text-indigo-600 font-semibold">
                  Selected: {selectedHour}:{selectedMinute}
                </span>
              ) : (
                'Select or type numbers'
              )}
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
