// InstructorManagementedit.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

/**
 * Edit modal for Instructor details with OTP verification.
 * Props:
 *  - open: boolean
 *  - item: instructor object (must include _id or id)
 *  - onClose: function()
 *  - onSaved: function(updatedDocFromServer)
 *
 * Backend endpoints:
 *  - Start OTP:   POST /api/instructors/otp/start { email }
 *  - Verify OTP:  POST /api/instructors/otp/verify { email, otp }
 *  - Update doc:  PUT  /api/instructors/:id    with multipart/form-data:
 *        - "payload": Blob(JSON.stringify(payload), "application/json")
 *        - optional files: resume, photo, certificates[] (to replace/add)
 */

// === Style tokens (kept identical to Add form) ===
const inputCls =
  "w-full h-11 rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2.5";
const textareaCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[8rem]";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";
const sectionTitleCls = "text-sm font-semibold text-gray-900 uppercase";
const dayOpts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// === Regions & Timezones (kept same constants/names as Add form) ===
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const CA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon"
];

// Note: The Add form named this TIMEZONES_US_MX, keep the same name for parity.
const TIMEZONES_US_MX = [
  // US
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "America/Honolulu",
  // CA
  "America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg",
  "America/Halifax", "America/St_Johns", "America/Regina", "America/Whitehorse",
  "America/Yellowknife", "America/Iqaluit"
];

export default function InstructorManagementedit({ open, item, onClose, onSaved }) {
  const [submitting, setSubmitting] = useState(false);

  // OTP state
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pendingFormData, setPendingFormData] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const itemId = useMemo(() => item?._id || item?.id, [item]);

  // Country / Region UI
  const initialCountry = (item?.country === "Canada" ? "Canada" : "United States");
  const [country, setCountry] = useState(initialCountry);
  const [stateProv, setStateProv] = useState(item?.state || "");

  // Currency & payout, mirror Add form logic
  const [currency, setCurrency] = useState(item?.currency || (initialCountry === "Canada" ? "CAD" : "USD"));
  useEffect(() => {
    setCurrency((c) => {
      if (country === "Canada" && c === "USD") return "CAD";
      if (country === "United States" && c === "CAD") return "USD";
      return c;
    });
  }, [country]);

  const [payoutMethod, setPayoutMethod] = useState(() => {
    const us = ["ACH (US Bank)", "Zelle", "PayPal"];
    const ca = ["EFT (CA Bank)", "Interac e-Transfer", "PayPal"];
    const m = item?.payoutMethod;
    if (initialCountry === "Canada") return ca.includes(m) ? m : "EFT (CA Bank)";
    return us.includes(m) ? m : "ACH (US Bank)";
  });

  useEffect(() => {
    const us = ["ACH (US Bank)", "Zelle", "PayPal"];
    const ca = ["EFT (CA Bank)", "Interac e-Transfer", "PayPal"];
    if (country === "Canada" && !ca.includes(payoutMethod)) setPayoutMethod("EFT (CA Bank)");
    else if (country === "United States" && !us.includes(payoutMethod)) setPayoutMethod("ACH (US Bank)");
  }, [country, payoutMethod]);

  // Availability (match Add form behavior & validations)
  const [availStart, setAvailStart] = useState(item?.availableStart || "");
  const [availEnd, setAvailEnd] = useState(item?.availableEnd || "");
  const [tz, setTz] = useState(item?.timezone || "America/Los_Angeles");

  // Preferable time slots
  const [prefSlots, setPrefSlots] = useState(
    Array.isArray(item?.preferableSlots)
      ? item.preferableSlots.map(s => ({ start: s.start || "", end: s.end || "" }))
      : []
  );

  const addPrefSlot = () => setPrefSlots((p) => [...p, { start: "", end: "" }]);
  const updatePrefSlot = (idx, field, value) =>
    setPrefSlots((p) => p.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  const removePrefSlot = (idx) => setPrefSlots((p) => p.filter((_, i) => i !== idx));

  // Refs for native validity bubbles
  const startRef = useRef(null);
  const endRef = useRef(null);
  const prefStartRefs = useRef([]);
  const prefEndRefs = useRef([]);

  // Derived UI strings
  const stateList = country === "Canada" ? CA_PROVINCES : US_STATES;
  const stateLabel = country === "Canada" ? "Province / Territory" : "State";
  const postalLabel = country === "Canada" ? "Postal Code" : "ZIP Code";
  const phonePlaceholder = country === "Canada" ? "+1 (416) 555-1234" : "+1 (555) 555-1234";
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

  // CSV helpers to pre-fill text inputs for arrays
  const toCSV = (arr) => Array.isArray(arr) ? arr.join(", ") : (typeof arr === "string" ? arr : "");
  const initialSpecializations = toCSV(item?.specializations);
  const initialSkills = toCSV(item?.skills);
  const initialLanguages = toCSV(item?.languages);

  // --- Submit (Step 1): validate & trigger OTP ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemId) return;

    setSubmitting(true);

    // Clear stale validity
    [...e.currentTarget.querySelectorAll('input[name="availableDays"]')].forEach(el => el.setCustomValidity(""));
    startRef.current?.setCustomValidity("");
    endRef.current?.setCustomValidity("");
    (prefStartRefs.current || []).forEach((el) => el?.setCustomValidity(""));
    (prefEndRefs.current || []).forEach((el) => el?.setCustomValidity(""));

    // Native validation first
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      setSubmitting(false);
      return;
    }

    try {
      const fd = new FormData(form);

      // Enforce: at least one weekday
      const availableDays = fd.getAll("availableDays");
      if (availableDays.length === 0) {
        const firstBox = form.querySelector('input[name="availableDays"]');
        if (firstBox) {
          firstBox.setCustomValidity("Select at least one weekday.");
          firstBox.reportValidity();
        }
        setSubmitting(false);
        return;
      }

      // Time window validity
      const start = fd.get("availableStart");
      const end = fd.get("availableEnd");
      if (start && end && end <= start) {
        endRef.current?.setCustomValidity("Availability window invalid: End Time must be AFTER Start Time (24-hour HH:MM).");
        endRef.current?.reportValidity();
        setSubmitting(false);
        return;
      }

      // Clean & validate preferable slots
      const cleanedSlots = (prefSlots || [])
        .filter((s) => s.start && s.end)
        .map((s) => ({ start: s.start, end: s.end }));

      for (let i = 0; i < cleanedSlots.length; i++) {
        const s = cleanedSlots[i];
        if (!(s.start < s.end)) {
          const endEl = prefEndRefs.current[i];
          endEl?.setCustomValidity("End Time must be after Start Time for this slot.");
          endEl?.reportValidity();
          setSubmitting(false);
          return;
        }
        if (start && s.start < start) {
          const stEl = prefStartRefs.current[i];
          stEl?.setCustomValidity(`Slot ${i + 1}: Start Time must be on or AFTER overall Start Time (${start}).`);
          stEl?.reportValidity();
          setSubmitting(false);
          return;
        }
        if (end && s.end > end) {
          const enEl = prefEndRefs.current[i];
          enEl?.setCustomValidity(`Slot ${i + 1}: End Time must be on or BEFORE overall End Time (${end}).`);
          enEl?.reportValidity();
          setSubmitting(false);
          return;
        }
      }

      // No overlaps (stable indices)
      const sorted = cleanedSlots
        .map((s, idx) => ({ ...s, __idx: idx }))
        .sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].start < sorted[i - 1].end) {
          const laterIdx = sorted[i].__idx;
          const laterEl = prefStartRefs.current[laterIdx];
          laterEl?.setCustomValidity("Preferable Time Slots cannot overlap. Adjust this slot (24-hour HH:MM).");
          laterEl?.reportValidity();
          setSubmitting(false);
          return;
        }
      }

      // Build payload (mirror Add form fields 1:1)
      const ndaSigned = fd.get("ndaSigned") === "on";
      const agreeToTerms = fd.get("agreeToTerms") === "on"; // present in Edit for parity (not required)

      const payload = {
        firstName: fd.get("firstName") || "",
        lastName: fd.get("lastName") || "",
        email: (fd.get("email") || "").trim(),
        phone: fd.get("phone") || "",
        altPhone: fd.get("altPhone") || "",
        country,
        state: fd.get("state") || "",
        city: fd.get("city") || "",
        postalCode: fd.get("postalCode") || "",
        address1: fd.get("address1") || "",
        address2: fd.get("address2") || "",

        qualification: fd.get("qualification") || "",
        experienceYears: fd.get("experienceYears") ? Number(fd.get("experienceYears")) : null,
        organization: fd.get("organization") || "",
        specializations: (fd.get("specializations") || "").split(",").map(s => s.trim()).filter(Boolean),
        skills: (fd.get("skills") || "").split(",").map(s => s.trim()).filter(Boolean),
        languages: (fd.get("languages") || "").split(",").map(s => s.trim()).filter(Boolean),
        teachingMode: fd.get("teachingMode") || "Online",
        bio: fd.get("bio") || "",

        availableDays,
        availableStart: start || "",
        availableEnd: end || "",
        timezone: fd.get("timezone") || tz,

        preferableSlots: cleanedSlots,

        rateType: fd.get("rateType") || "Hourly",
        expectedRate: fd.get("expectedRate") ? Number(fd.get("expectedRate")) : null,
        currency,
        payoutMethod,
        payoutIdentifier: fd.get("payoutIdentifier") || "",

        backgroundCheck: fd.get("backgroundCheck") || "Pending",
        ndaSigned,
        agreeToTerms,

        assignInternship: fd.get("assignInternship") || "",
        notes: fd.get("notes") || "",
      };

      // Files: replace/add if provided
      const resume = fd.get("resume");
      const photo = fd.get("photo");
      const certs = fd.getAll("certificates");

      const formData = new FormData();
      formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      if (resume instanceof File && resume.size) formData.append("resume", resume);
      if (photo instanceof File && photo.size) formData.append("photo", photo);
      (certs || []).filter(f => f && f.size).forEach((file) => formData.append("certificates", file));

      const emailForOtp = payload.email;
      if (!emailForOtp) {
        alert("Email is required to send OTP.");
        setSubmitting(false);
        return;
      }

      // Start OTP
      await axios.post("/api/instructors/otp/start", { email: emailForOtp });

      setPendingFormData(formData);
      setPendingId(itemId);
      setOtpEmail(emailForOtp);
      setOtpOpen(true);
    } catch (err) {
      console.error("Edit start failed:", err);
      alert(err?.response?.data?.message || "Failed to start OTP for update.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Submit (Step 2): verify OTP then PUT update ---
  const doVerifyAndSave = async () => {
    if (!pendingId || !pendingFormData) return;
    try {
      await axios.post("/api/instructors/otp/verify", { email: otpEmail, otp: otpCode });
      const { data } = await axios.put(`/api/instructors/${pendingId}`, pendingFormData);
      onSaved?.(data);

      // reset OTP UI
      setOtpOpen(false);
      setOtpCode("");
      setPendingFormData(null);
      setPendingId(null);
    } catch (err) {
      console.error("Verify/Save failed:", err);
      alert(err?.response?.data?.message || "Invalid OTP or update failed.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white">
          <h2 className="text-lg font-semibold">Edit Instructor Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-red-500 hover:text-white"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* Personal & Contact */}
            <div className="space-y-3">
              <div className={`${sectionTitleCls} mb-7`}>Personal & Contact</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>First Name *</label></div>
                    <input name="firstName" required className={inputCls + " mt-4"} defaultValue={item?.firstName || ""} placeholder="e.g., Priya" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Last Name *</label></div>
                    <input name="lastName" required className={inputCls + " mt-4"} defaultValue={item?.lastName || ""} placeholder="e.g., Sharma" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Email *</label></div>
                    <input type="email" name="email" required className={inputCls + " mt-4"} defaultValue={item?.email || ""} placeholder="name@example.com" />
                  </div>
                </div>

                <div className="flex flex-col mt-4">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Mobile *</label></div>
                    <input name="phone" required className={inputCls + " mt-4"} defaultValue={item?.phone || ""} placeholder={phonePlaceholder} />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Alternate Phone</label></div>
                    <input name="altPhone" className={inputCls + " mt-4"} defaultValue={item?.altPhone || ""} placeholder={phonePlaceholder} />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Country *</label></div>
                    <select
                      name="country"
                      required
                      className={inputCls + " mt-4"}
                      value={country}
                      onChange={(e) => { setCountry(e.target.value); setStateProv(""); }}
                    >
                      <option>United States</option>
                      <option>Canada</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col mt-4">
                  <div className="relative">
                    <div className="absolute -top-2 left-0">
                      <label className={labelCls}>{stateLabel} *</label>
                    </div>
                    <select
                      name="state"
                      className={inputCls + " mt-4"}
                      value={stateProv}
                      onChange={(e) => setStateProv(e.target.value)}
                    >
                      {stateList.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>City</label></div>
                    <input name="city" className={inputCls + " mt-4"} defaultValue={item?.city || ""} placeholder={cityPlaceholder} />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>{postalLabel}</label></div>
                    <input name="postalCode" className={inputCls + " mt-4"} defaultValue={item?.postalCode || ""} placeholder={country === "Canada" ? "M5V 3L9" : "95113"} />
                  </div>
                </div>

                <div className="flex flex-col mt-4">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Address Line 1</label></div>
                    <input name="address1" className={inputCls + " mt-4"} defaultValue={item?.address1 || ""} placeholder={address1Placeholder} />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Address Line 2</label></div>
                    <input name="address2" className={inputCls + " mt-4"} defaultValue={item?.address2 || ""} placeholder="Optional" />
                  </div>
                </div>
              </div>
            </div>

            {/* Professional & Teaching */}
            <div className="space-y-4">
              <div className={`${sectionTitleCls} mb-7`}>Professional & Teaching</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Highest Qualification</label></div>
                    <select name="qualification" className={inputCls + " mt-4"} defaultValue={item?.qualification || ""}>
                      <option value="" disabled>Select</option>
                      <option>Diploma</option><option>Bachelor</option><option>Master</option><option>PhD</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Years of Experience</label></div>
                    <input type="number" min="0" step="0.5" name="experienceYears" className={inputCls + " mt-4"} defaultValue={item?.experienceYears ?? ""} placeholder="e.g., 3" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Current/Recent Organization</label></div>
                    <input name="organization" className={inputCls + " mt-4"} defaultValue={item?.organization || ""} placeholder="Company/Institute" />
                  </div>
                </div>
                <div className="flex flex-col mt-6 md:col-span-3">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Teaching Specializations (comma-separated)</label></div>
                    <input name="specializations" className={inputCls + " mt-4"} defaultValue={initialSpecializations} placeholder="e.g., React, Data Structures, Python" />
                  </div>
                </div>
                <div className="flex flex-col mt-6 md:col-span-3">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Skills / Technologies (comma-separated)</label></div>
                    <input name="skills" className={inputCls + " mt-4"} defaultValue={initialSkills} placeholder="e.g., MongoDB, Node.js, AWS" />
                  </div>
                </div>
                <div className="flex flex-col mt-6 md:col-span-2">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Languages (comma-separated)</label></div>
                    <input name="languages" className={inputCls + " mt-4"} defaultValue={initialLanguages} placeholder="e.g., English, Spanish" />
                  </div>
                </div>
                <div className="flex flex-col mt-6">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Teaching Mode</label></div>
                    <select name="teachingMode" className={inputCls + " mt-4"} defaultValue={item?.teachingMode || "Online"}>
                      <option>Online</option><option>Offline</option><option>Hybrid</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col mt-6 md:col-span-3">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Short Bio / Summary</label></div>
                    <textarea name="bio" rows={3} className={textareaCls + " mt-4"} defaultValue={item?.bio || ""} placeholder="Brief profile to show on your site" />
                  </div>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <div className={`${sectionTitleCls} mb-7`}>Availability</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* Weekdays (checkbox names must match Add form) */}
                <div className="flex flex-col md:col-span-3">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Weekdays *</label></div>
                    <div role="group" aria-label="Weekdays" className="mt-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                      {dayOpts.map((d) => {
                        const checked = Array.isArray(item?.availableDays) ? item.availableDays.includes(d) : false;
                        return (
                          <label key={d} className="relative block">
                            <input
                              type="checkbox"
                              name="availableDays"
                              value={d}
                              defaultChecked={checked}
                              className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              onChange={(e) => {
                                const formEl = e.currentTarget.form;
                                if (!formEl) return;
                                const boxes = formEl.querySelectorAll('input[name="availableDays"]');
                                const anyChecked = Array.from(boxes).some(b => b.checked);
                                boxes.forEach(b => b.setCustomValidity(""));
                                if (!anyChecked) {
                                  e.currentTarget.setCustomValidity("Select at least one weekday.");
                                }
                              }}
                            />
                            <span className="flex h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 peer-checked:bg-teal-600 peer-checked:text-white peer-checked:border-teal-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500">
                              {d}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Start Time */}
                <div className="flex flex-col mt-5">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Start Time * <span className="text-sm text-gray-400 font-normal">(24 Hours Format)</span></label></div>
                    <input
                      type="time"
                      name="availableStart"
                      className={inputCls + " mt-4"}
                      ref={startRef}
                      step="60"
                      title="Use 24-hour time (HH:MM)"
                      required
                      value={availStart}
                      onChange={(e) => {
                        setAvailStart(e.target.value);
                        startRef.current?.setCustomValidity("");
                        (prefStartRefs.current || []).forEach((el) => el?.setCustomValidity(""));
                        (prefEndRefs.current || []).forEach((el) => el?.setCustomValidity(""));
                      }}
                    />
                  </div>
                </div>

                {/* End Time */}
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>End Time * <span className="text-sm text-gray-400 font-normal">(24 Hours Format)</span></label></div>
                    <input
                      type="time"
                      name="availableEnd"
                      className={inputCls + " mt-4"}
                      ref={endRef}
                      step="60"
                      title="Use 24-hour time (HH:MM)"
                      required
                      value={availEnd}
                      onChange={(e) => {
                        setAvailEnd(e.target.value);
                        endRef.current?.setCustomValidity("");
                        (prefStartRefs.current || []).forEach((el) => el?.setCustomValidity(""));
                        (prefEndRefs.current || []).forEach((el) => el?.setCustomValidity(""));
                      }}
                    />
                  </div>
                </div>

                {/* Preferable Time Slots */}
                <div className="flex flex-col md:col-span-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className={sectionTitleCls}>Preferable Time Slots (optional)</div>
                    <button
                      type="button"
                      onClick={addPrefSlot}
                      disabled={!availStart || !availEnd}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm font-semibold shadow hover:from-teal-600 hover:to-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      + Add Slot
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    Add slots within your overall <strong>Start Time</strong> and <strong>End Time</strong>.
                  </p>

                  <div className="mt-3 space-y-3">
                    {prefSlots.length === 0 ? (
                      <div className="text-xs text-gray-500">No preferable slots added.</div>
                    ) : (
                      prefSlots.map((s, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                          <div className="md:col-span-3 mt-4">
                            <div className="relative">
                              <div className="absolute -top-2 left-0"><label className={labelCls}>Slot {idx + 1}: Start Time <span className="text-sm text-gray-400 font-normal">(24 Hours)</span></label></div>
                              <input
                                type="time"
                                value={s.start}
                                onChange={(e) => {
                                  (prefStartRefs.current[idx])?.setCustomValidity("");
                                  (prefEndRefs.current[idx])?.setCustomValidity("");
                                  updatePrefSlot(idx, "start", e.target.value);
                                }}
                                className={inputCls + " mt-4"}
                                ref={(el) => (prefStartRefs.current[idx] = el)}
                                step="60"
                                title="Use 24-hour time (HH:MM)"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <div className="relative">
                              <div className="absolute -top-2 left-0"><label className={labelCls}>Slot {idx + 1}: End Time <span className="text-sm text-gray-400 font-normal">(24 Hours)</span></label></div>
                              <input
                                type="time"
                                value={s.end}
                                onChange={(e) => {
                                  (prefEndRefs.current[idx])?.setCustomValidity("");
                                  (prefStartRefs.current[idx])?.setCustomValidity("");
                                  updatePrefSlot(idx, "end", e.target.value);
                                }}
                                className={inputCls + " mt-4"}
                                ref={(el) => (prefEndRefs.current[idx] = el)}
                                step="60"
                                title="Use 24-hour time (HH:MM)"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-1">
                            <button type="button" onClick={() => removePrefSlot(idx)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Timezone */}
                <div className="flex flex-col mt-6">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Timezone</label></div>
                    <select name="timezone" className={inputCls + " mt-4"} value={tz} onChange={(e) => setTz(e.target.value)}>
                      {TIMEZONES_US_MX.map((z) => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Compensation / Payout */}
            <div className="space-y-3">
              <div className={`${sectionTitleCls} mb-7`}>Compensation / Payout</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Rate Type</label></div>
                    <select name="rateType" className={inputCls + " mt-4"} defaultValue={item?.rateType || "Hourly"}>
                      <option>Hourly</option><option>Per Session</option><option>Fixed</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Expected Rate</label></div>
                    <input type="number" min="0" step="0.01" name="expectedRate" className={inputCls + " mt-4"} defaultValue={item?.expectedRate ?? ""} placeholder="e.g., 1500" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Currency</label></div>
                    <select name="currency" className={inputCls + " mt-4"} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option>USD</option><option>CAD</option><option>EUR</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col mt-6">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Preferred Payout Method</label></div>
                    <select name="payoutMethod" className={inputCls + " mt-4"} value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
                      {country === "Canada" ? (
                        <>
                          <option>EFT (CA Bank)</option>
                          <option>Interac e-Transfer</option>
                          <option>PayPal</option>
                        </>
                      ) : (
                        <>
                          <option>ACH (US Bank)</option>
                          <option>Zelle</option>
                          <option>PayPal</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col mt-6 md:col-span-2">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Payout Identifier</label></div>
                    <input name="payoutIdentifier" className={inputCls + " mt-4"} defaultValue={item?.payoutIdentifier || ""} placeholder={payIdPlaceholder} />
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance & Documents */}
            <div className="space-y-3">
              <div className={`${sectionTitleCls} mb-7`}>Compliance & Documents</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Resume / CV (upload to replace)</label></div>
                    <input type="file" name="resume" className={inputCls + " mt-4"} accept=".pdf,.doc,.docx" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Profile Photo (upload to replace)</label></div>
                    <input type="file" name="photo" className={inputCls + " mt-4"} accept="image/*" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Certificates (upload to add)</label></div>
                    <input type="file" name="certificates" className={inputCls + " mt-4"} accept=".pdf,.png,.jpg,.jpeg" multiple />
                  </div>
                </div>
                <div className="flex flex-col mt-6">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Background Check</label></div>
                    <select name="backgroundCheck" className={inputCls + " mt-4"} defaultValue={item?.backgroundCheck || "Pending"}>
                      <option>Pending</option><option>Cleared</option><option>Not Required</option>
                    </select>
                  </div>
                </div>

                {/* Keep BOTH checkboxes to mirror Add form fields exactly */}
                <div className="md:col-span-2 flex items-center gap-6 mt-6">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="ndaSigned" defaultChecked={!!item?.ndaSigned} />
                    <span className="text-sm text-gray-700">NDA signed</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="agreeToTerms" defaultChecked={!!item?.agreeToTerms} />
                    <span className="text-sm text-gray-700">I confirm all details are accurate</span>
                  </label>
                  <span className="text-xs text-gray-500">Saving will require OTP verification via email.</span>
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="space-y-3">
              <div className={`${sectionTitleCls} mb-7`}>Assignment</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Assign to Internship (title or ID)</label></div>
                    <input name="assignInternship" className={inputCls + " mt-4"} defaultValue={item?.assignInternship || ""} placeholder="e.g., MERN Bootcamp – 2025 Summer" />
                  </div>
                </div>
                <div className="flex flex-col mt-6 md:col-span-3">
                  <div className="relative">
                    <div className="absolute -top-2 left-0"><label className={labelCls}>Notes</label></div>
                    <textarea name="notes" rows={3} className={textareaCls + " mt-4"} defaultValue={item?.notes || ""} placeholder="Internal notes" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || otpOpen}
                className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:from-teal-600 hover:to-cyan-700 disabled:opacity-60"
              >
                <span>{submitting ? "Validating..." : "Save Changes"}</span>
              </button>
              <span className="text-xs text-gray-500">You’ll receive an OTP to confirm the update.</span>
            </div>
          </form>
        </div>
      </div>

      {/* OTP Modal */}
      {otpOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Verify Email</h3>
            <p className="text-sm text-gray-600 mb-4">
              We have sent a 6-digit code to: <span className="font-medium">{otpEmail}</span>.
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
              className="w-full h-11 rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setOtpOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">
                Cancel
              </button>
              <button type="button" onClick={doVerifyAndSave} className="px-4 py-2 rounded-lg bg-teal-600 text-white">
                Verify & Save
              </button>
            </div>

            <div className="mt-3">
              <button
                type="button"
                className="text-sm text-teal-700 underline"
                onClick={async () => {
                  try {
                    await axios.post("/api/instructors/otp/start", { email: otpEmail });
                    alert("OTP resent.");
                  } catch {
                    alert("Failed to resend OTP.");
                  }
                }}
              >
                Resend code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}