// StipendDetailsModal.jsx
import React, { useState } from "react";

const VALID_CURRENCIES = ["USD", "CAD", "EUR", "GBP"];

const StipendDetailsModal = ({ visible, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    bankAccountName: "",
    bankAccountNumber: "",
    ifscOrSwift: "",
    preferredCurrency: "USD",
    notes: ""
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    let error = "";
    const val = (value || "").trim();

    switch (name) {
      case "bankAccountName":
        if (!val) {
          error = "Account Holder Name is required.";
        } else if (val.length < 2 || val.length > 60) {
          error = "Name must be between 2 and 60 characters.";
        } else if (!/^[a-zA-Z\s.'-]+$/.test(val)) {
          error = "Name can only contain letters and standard punctuation.";
        }
        break;

      case "bankAccountNumber":
        if (!val) {
          error = "Bank Account Number is required.";
        } else if (!/^\d+$/.test(val)) {
          error = "Bank Account Number can only contain numeric digits.";
        } else if (val.length < 6 || val.length > 20) {
          error = "Bank Account Number must be between 6 and 20 digits.";
        } else if (/^0+$/.test(val)) {
          error = "Please enter a valid Bank Account Number (cannot be all zeros).";
        }
        break;

      case "ifscOrSwift": {
        const upper = val.toUpperCase();
        if (!upper) {
          error = "IFSC / SWIFT / Routing Code is required.";
        } else if (!/^[A-Z0-9]{8,12}$/.test(upper)) {
          error = "Code must be 8 to 12 alphanumeric characters (e.g. SWIFT or Routing code).";
        }
        break;
      }

      case "preferredCurrency":
        if (!val || !VALID_CURRENCIES.includes(val)) {
          error = "Please select a valid currency.";
        }
        break;

      case "notes":
        if (val.length > 250) {
          error = "Notes cannot exceed 250 characters.";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "bankAccountNumber") {
      const hasInvalidChars = /[^\d\s-]/.test(value);
      formattedValue = value.replace(/\D/g, "").slice(0, 20);

      setTouched((prev) => ({ ...prev, [name]: true }));
      setForm((prev) => ({ ...prev, [name]: formattedValue }));

      if (hasInvalidChars) {
        setErrors((prev) => ({ ...prev, [name]: "Bank Account Number can only contain numeric digits." }));
        return;
      }
      const fieldError = validateField(name, formattedValue);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
      return;
    } else if (name === "ifscOrSwift") {
      // Auto-uppercase, remove special chars, limit to 12 chars
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    } else if (name === "bankAccountName") {
      formattedValue = value.slice(0, 60);
    } else if (name === "notes") {
      formattedValue = value.slice(0, 250);
    }

    setForm((prev) => ({ ...prev, [name]: formattedValue }));

    if (touched[name]) {
      const fieldError = validateField(name, formattedValue);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    setTouched({
      bankAccountName: true,
      bankAccountNumber: true,
      ifscOrSwift: true,
      preferredCurrency: true,
      notes: true
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    onSubmit({
      ...form,
      bankAccountName: form.bankAccountName.trim(),
      bankAccountNumber: form.bankAccountNumber.trim(),
      ifscOrSwift: form.ifscOrSwift.trim().toUpperCase(),
      notes: form.notes.trim()
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-2xl max-w-md w-full relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Enter Stipend Payment Details
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          Please provide accurate bank details to receive your internship stipend.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Account Holder Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              name="bankAccountName"
              type="text"
              placeholder="e.g. John Doe"
              maxLength={60}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition ${
                errors.bankAccountName
                  ? "border-red-500 bg-red-50/50 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
              value={form.bankAccountName}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.bankAccountName && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.bankAccountName}</p>
            )}
          </div>

          {/* Bank Account Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Bank Account Number <span className="text-red-500">*</span>
            </label>
            <input
              name="bankAccountNumber"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="6 to 20 numeric digits (e.g. 1234567890)"
              maxLength={20}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition font-mono ${
                errors.bankAccountNumber
                  ? "border-red-500 bg-red-50/50 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
              value={form.bankAccountNumber}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.bankAccountNumber && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.bankAccountNumber}</p>
            )}
          </div>

          {/* IFSC / SWIFT / Routing Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              IFSC / SWIFT / Routing Code <span className="text-red-500">*</span>
            </label>
            <input
              name="ifscOrSwift"
              type="text"
              placeholder="8 to 12 alphanumeric characters"
              maxLength={12}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition font-mono uppercase ${
                errors.ifscOrSwift
                  ? "border-red-500 bg-red-50/50 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
              value={form.ifscOrSwift}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.ifscOrSwift && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.ifscOrSwift}</p>
            )}
          </div>

          {/* Preferred Currency */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Preferred Currency <span className="text-red-500">*</span>
            </label>
            <select
              name="preferredCurrency"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
              value={form.preferredCurrency}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="USD">USD ($)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              placeholder="Branch address or routing instructions (optional, max 250 chars)"
              maxLength={250}
              rows={2}
              className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
              value={form.notes}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.notes && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.notes}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold transition shadow-sm hover:shadow-md hover:shadow-indigo-200"
          >
            Send Details
          </button>
        </form>
      </div>
    </div>
  );
};

export default StipendDetailsModal;
