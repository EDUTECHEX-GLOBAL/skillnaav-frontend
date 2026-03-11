import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import InstructureDetailsView from "./InstructureDetailsView";
import InstructorManagementedit from "./InstructorManagementedit";

/* ─── shared tailwind tokens ─── */
const inputCls =
  "w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-600 hover:border-slate-300";
const textareaCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 min-h-[7rem] resize-y";
const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";
const sectionTitleCls =
  "text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-indigo-200 after:to-transparent";

const dayOpts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const INSTRUCTORS_PER_PAGE = 10;

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

const CA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon",
];

const TIMEZONES_US_MX = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "America/Honolulu",
  "America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg",
  "America/Halifax", "America/St_Johns", "America/Regina", "America/Whitehorse",
  "America/Yellowknife", "America/Iqaluit",
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

/* ─── tiny pill badge ─── */
const Badge = ({ children, color = "slate" }) => {
  const map = {
    slate: "bg-slate-100 text-slate-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${map[color] || map.slate}`}>
      {children}
    </span>
  );
};

/* ─── section wrapper inside modal form ─── */
const FormSection = ({ title, icon, children }) => (
  <div className="space-y-5">
    <div className={sectionTitleCls}>
      {icon && <FontAwesomeIcon icon={icon} className="text-indigo-400 text-[10px]" />}
      {title}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">{children}</div>
  </div>
);

/* ─── field wrapper ─── */
const Field = ({ label, required, span = 1, children }) => (
  <div className={span === 2 ? "md:col-span-2" : span === 3 ? "md:col-span-3" : ""}>
    <label className={labelCls}>
      {label} {required && <span className="text-rose-400">*</span>}
    </label>
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */

const InstructureManagement = () => {
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rateType, setRateType] = useState("");
  const [currency, setCurrency] = useState("");
  const [country, setCountry] = useState("");
  const [stateProv, setStateProv] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("ACH (US Bank)");
  const [tz, setTz] = useState("");
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [qualification, setQualification] = useState("");
  const [teachingMode, setTeachingMode] = useState("");
  const [backgroundCheck, setBackgroundCheck] = useState("");
  const [photoPreview, setPhotoPreview] = useState({ open: false, src: "", alt: "" });
  const [otpOpen, setOtpOpen] = useState(false);
  const [availStart, setAvailStart] = useState("");
  const [availEnd, setAvailEnd] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pendingFormData, setPendingFormData] = useState(null);
  const [prefSlots, setPrefSlots] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  const startRef = useRef(null);
  const endRef = useRef(null);
  const prefStartRefs = useRef([]);
  const prefEndRefs = useRef([]);
  const cityRef = useRef(null);
  const postalRef = useRef(null);
  const address1Ref = useRef(null);
  const address2Ref = useRef(null);

  const avatarInitials = (i) => {
    const a = [i?.firstName, i?.lastName]
      .filter(Boolean)
      .map((s) => (s || "").trim()[0]?.toUpperCase())
      .join("");
    return a || (i?.email?.[0] || "?").toUpperCase();
  };

  const openPhoto = (src, alt = "") => setPhotoPreview({ open: true, src, alt });
  const closePhoto = () => setPhotoPreview({ open: false, src: "", alt: "" });

  const addPrefSlot = () => setPrefSlots((prev) => [...prev, { start: "", end: "" }]);
  const updatePrefSlot = (idx, field, value) =>
    setPrefSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  const removePrefSlot = (idx) => setPrefSlots((prev) => prev.filter((_, i) => i !== idx));

  useEffect(() => {
    if (country === "Canada") {
      if (!["EFT (CA Bank)", "Interac e-Transfer", "PayPal"].includes(payoutMethod))
        setPayoutMethod("EFT (CA Bank)");
    } else if (country === "United States") {
      if (!["ACH (US Bank)", "Zelle", "PayPal"].includes(payoutMethod))
        setPayoutMethod("ACH (US Bank)");
    }
  }, [country, payoutMethod]);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const { data } = await axios.get("/api/instructors", {
          params: { limit: 200 },
          headers: authHeaders(),
        });
        const raw = Array.isArray(data)
          ? data
          : data?.items || data?.data || data?.results || data?.docs || data?.instructors || [];
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

  // Close action menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenuId]);

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
          ? "Transit|Institution|Account"
          : payoutMethod === "Interac e-Transfer"
            ? "Email or mobile number"
            : "PayPal email";

  async function createInstructorWithFormData(fd) {
    const { data } = await axios.post("/api/instructors", fd, { headers: { ...authHeaders() } });
    return data;
  }

  /* ─── submit handler (unchanged logic) ─── */
  const handleSubmit = async (e) => {
    setSubmitting(true);
    const form = e.currentTarget;
    [...form.querySelectorAll('input[name="availableDays"]')].forEach((el) =>
      el.setCustomValidity("")
    );
    if (!form.checkValidity()) {
      form.reportValidity();
      setSubmitting(false);
      return;
    }
    e.preventDefault();

    try {
      const fd = new FormData(e.target);
      const availableDays = fd.getAll("availableDays");
      if (availableDays.length === 0) {
        const firstBox = e.currentTarget.querySelector('input[name="availableDays"]');
        if (firstBox) {
          firstBox.setCustomValidity("Select at least one weekday.");
          firstBox.reportValidity();
        }
        setSubmitting(false);
        return;
      }
      startRef.current?.setCustomValidity("");
      endRef.current?.setCustomValidity("");
      (prefStartRefs.current || []).forEach((el) => el?.setCustomValidity(""));
      (prefEndRefs.current || []).forEach((el) => el?.setCustomValidity(""));

      const start = fd.get("availableStart");
      const end = fd.get("availableEnd");
      if (start && end && end <= start) {
        endRef.current?.setCustomValidity("End Time must be AFTER Start Time.");
        endRef.current?.reportValidity();
        setSubmitting(false);
        return;
      }

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
          stEl?.setCustomValidity(`Slot ${i + 1}: Start must be on or after overall Start (${start}).`);
          stEl?.reportValidity();
          setSubmitting(false);
          return;
        }
        if (end && s.end > end) {
          const enEl = prefEndRefs.current[i];
          enEl?.setCustomValidity(`Slot ${i + 1}: End must be on or before overall End (${end}).`);
          enEl?.reportValidity();
          setSubmitting(false);
          return;
        }
      }

      const sortedSlots = [...cleanedSlots].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < sortedSlots.length; i++) {
        if (sortedSlots[i].start < sortedSlots[i - 1].end) {
          const laterStart = sortedSlots[i].start;
          const laterIdx = cleanedSlots.findIndex((s) => s.start === laterStart);
          const laterEl = prefStartRefs.current[laterIdx];
          laterEl?.setCustomValidity("Preferable Time Slots cannot overlap.");
          laterEl?.reportValidity();
          setSubmitting(false);
          return;
        }
      }

      const certificates = fd.getAll("certificates");
      const resume = fd.get("resume");
      const photo = fd.get("photo");
      const ndaSigned = fd.get("ndaSigned") === "on";
      const agreeToTerms = fd.get("agreeToTerms") === "on";

      const payload = {
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        altPhone: fd.get("altPhone"),
        country: fd.get("country"),
        state: fd.get("state"),
        city: fd.get("city"),
        postalCode: fd.get("postalCode"),
        address1: fd.get("address1"),
        address2: fd.get("address2"),
        qualification: fd.get("qualification"),
        experienceYears: fd.get("experienceYears") ? Number(fd.get("experienceYears")) : null,
        organization: fd.get("organization"),
        specializations: (fd.get("specializations") || "").split(",").map((s) => s.trim()).filter(Boolean),
        skills: (fd.get("skills") || "").split(",").map((s) => s.trim()).filter(Boolean),
        languages: (fd.get("languages") || "").split(",").map((s) => s.trim()).filter(Boolean),
        teachingMode: fd.get("teachingMode"),
        bio: fd.get("bio"),
        availableDays,
        availableStart: fd.get("availableStart"),
        availableEnd: fd.get("availableEnd"),
        timezone: fd.get("timezone"),
        preferableSlots: cleanedSlots,
        rateType: fd.get("rateType"),
        expectedRate: fd.get("expectedRate") ? Number(fd.get("expectedRate")) : null,
        currency: fd.get("currency"),
        payoutMethod: fd.get("payoutMethod"),
        payoutIdentifier: fd.get("payoutIdentifier"),
        backgroundCheck: fd.get("backgroundCheck") || "Pending",
        ndaSigned,
        agreeToTerms,
        assignInternship: fd.get("assignInternship"),
        notes: fd.get("notes"),
      };

      const formData = new FormData();
      formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      formData.append("resume", resume);
      if (photo instanceof File && photo.size) formData.append("photo", photo);
      certificates.forEach((file) => formData.append("certificates", file));

      try {
        const email = (payload.email || "").trim();
        if (!email) {
          alert("Email is required for OTP verification.");
          setSubmitting(false);
          return;
        }
        await axios.post("/api/instructors/otp/start", { email }, { headers: authHeaders() });
        setPendingFormData(formData);
        setOtpEmail(email);
        setOtpOpen(true);
        return;
      } catch (err) {
        console.error("Start OTP failed:", err);
        alert(err?.response?.data?.message || "Failed to start OTP.");
      }
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Something went wrong while saving the instructor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignInstructor = async () => {
    try {
      const partnerId = localStorage.getItem("partnerId") || undefined;
      const { data } = await axios.post(
        "/api/ai/assign-instructors",
        { partnerId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const made = data.assignments_made || 0;
      const lines = (data.assignments || [])
        .map((r) => `Internship ${r.internshipId} → ${r.sessionsUpdated} session(s)`)
        .join("\n");
      alert(`Assigned ${made} session${made === 1 ? "" : "s"}.\n${lines}`);
    } catch (err) {
      console.error("Assign Instructor failed:", err);
      alert(
        err?.response?.status === 401
          ? "Session expired. Please log in again."
          : "Assign Instructor failed. Check server logs."
      );
    }
  };

  const filteredInstructors = instructors.filter((i) => {
    const hay = [i.firstName, i.lastName, i.email, i.phone, ...(i.specializations || []), ...(i.skills || [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filteredInstructors.length / INSTRUCTORS_PER_PAGE));
  const hasMore = page < totalPages;
  const paginatedInstructors = filteredInstructors.slice(
    (page - 1) * INSTRUCTORS_PER_PAGE,
    page * INSTRUCTORS_PER_PAGE
  );

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  /* ═══════════════════  RENDER  ═══════════════════ */
  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-50/80">

      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Instructor Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredInstructors.length} instructor{filteredInstructors.length !== 1 && "s"} registered
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setViewing(null);
              setCountry(""); setStateProv(""); setQualification(""); setTeachingMode("");
              setRateType(""); setCurrency(""); setBackgroundCheck("");
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Instructor
          </button>

          <button
            type="button"
            onClick={handleAssignInstructor}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold shadow-lg shadow-amber-200 hover:bg-amber-600 active:scale-[0.98] transition-all duration-150"
          >
            <FontAwesomeIcon icon={faUserCheck} className="text-xs" />
            Auto-Assign
          </button>
        </div>
      </div>

      {/* ── Details View ── */}
      {!isAddOpen && (
        <InstructureDetailsView
          open={Boolean(viewing)}
          item={viewing}
          onClose={() => setViewing(null)}
          autoDeletePrompt={Boolean(viewing?.__askDelete)}
          confirmOnly={Boolean(viewing?.__confirmOnly)}
          onDeleted={(id) => setInstructors((prev) => prev.filter((x) => (x._id || x.id) !== id))}
        />
      )}

      {/* ═══  ADD INSTRUCTOR MODAL  ═══ */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/60">

            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Register New Instructor</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details below to add a new instructor</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-7 overflow-y-auto flex-1 min-h-0">
              <form onSubmit={handleSubmit} className="space-y-10">

                {/* ── Personal & Contact ── */}
                <FormSection title="Personal & Contact" icon={faEnvelope}>
                  <Field label="First Name" required>
                    <input name="firstName" required className={inputCls} placeholder="e.g., Priya" />
                  </Field>
                  <Field label="Last Name" required>
                    <input name="lastName" required className={inputCls} placeholder="e.g., Sharma" />
                  </Field>
                  <Field label="Email" required>
                    <input type="email" name="email" required className={inputCls} placeholder="name@example.com" />
                  </Field>
                  <Field label="Mobile" required>
                    <input name="phone" required className={inputCls} placeholder={phonePlaceholder} />
                  </Field>
                  <Field label="Alternate Phone">
                    <input name="altPhone" className={inputCls} placeholder={phonePlaceholder} />
                  </Field>
                  <Field label="Country" required>
                    <select
                      name="country" required className={inputCls} value={country}
                      onChange={(e) => {
                        setCountry(e.target.value); setStateProv("");
                        if (cityRef.current) cityRef.current.value = "";
                        if (postalRef.current) postalRef.current.value = "";
                        if (address1Ref.current) address1Ref.current.value = "";
                        if (address2Ref.current) address2Ref.current.value = "";
                      }}
                    >
                      <option value="" disabled={country !== ""}>Select</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </Field>
                  <Field label={stateLabel} required>
                    <select
                      name="state" required disabled={!country} className={inputCls}
                      value={stateProv} onChange={(e) => setStateProv(e.target.value)}
                    >
                      <option value="" disabled hidden>Select</option>
                      {stateList.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="City" required>
                    <input name="city" required ref={cityRef} className={inputCls} placeholder={cityPlaceholder} />
                  </Field>
                  <Field label={postalLabel} required>
                    <input name="postalCode" required ref={postalRef} className={inputCls} placeholder={country === "Canada" ? "M5V 3L9" : "95113"} />
                  </Field>
                  <Field label="Address Line 1" required span={2}>
                    <input name="address1" required ref={address1Ref} className={inputCls} placeholder={address1Placeholder} />
                  </Field>
                  <Field label="Address Line 2">
                    <input name="address2" ref={address2Ref} className={inputCls} placeholder="Optional" />
                  </Field>
                </FormSection>

                {/* ── Professional & Teaching ── */}
                <FormSection title="Professional & Teaching" icon={faStar}>
                  <Field label="Highest Qualification">
                    <select name="qualification" className={inputCls} value={qualification} onChange={(e) => setQualification(e.target.value)}>
                      <option value="" disabled={qualification !== ""}>Select</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor">Bachelor</option>
                      <option value="Master">Master</option>
                      <option value="PhD">PhD</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                  <Field label="Years of Experience">
                    <input type="number" min="0" step="0.5" name="experienceYears" className={inputCls} placeholder="e.g., 3" />
                  </Field>
                  <Field label="Current / Recent Organization">
                    <input name="organization" className={inputCls} placeholder="Company / Institute" />
                  </Field>
                  <Field label="Teaching Specializations" span={3}>
                    <input name="specializations" className={inputCls} placeholder="e.g., React, Data Structures, Python (comma-separated)" />
                  </Field>
                  <Field label="Skills / Technologies" span={3}>
                    <input name="skills" className={inputCls} placeholder="e.g., MongoDB, Node.js, AWS (comma-separated)" />
                  </Field>
                  <Field label="Languages" span={2}>
                    <input name="languages" className={inputCls} placeholder="e.g., English, Spanish (comma-separated)" />
                  </Field>
                  <Field label="Teaching Mode">
                    <select name="teachingMode" className={inputCls} value={teachingMode} onChange={(e) => setTeachingMode(e.target.value)}>
                      <option value="" disabled={teachingMode !== ""}>Select</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </Field>
                  <Field label="Short Bio / Summary" span={3}>
                    <textarea name="bio" rows={3} className={textareaCls} placeholder="Brief profile to show on your site" />
                  </Field>
                </FormSection>

                {/* ── Availability ── */}
                <FormSection title="Availability">
                  {/* Weekdays */}
                  <div className="md:col-span-3">
                    <label className={labelCls}>Weekdays <span className="text-rose-400">*</span></label>
                    <div role="group" aria-label="Weekdays" className="mt-2 grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {dayOpts.map((d) => (
                        <label key={d} className="relative block cursor-pointer">
                          <input
                            type="checkbox" name="availableDays" value={d}
                            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            onChange={(e) => {
                              const formEl = e.currentTarget.form;
                              if (!formEl) return;
                              const boxes = formEl.querySelectorAll('input[name="availableDays"]');
                              const anyChecked = Array.from(boxes).some((b) => b.checked);
                              boxes.forEach((b) => b.setCustomValidity(""));
                              if (!anyChecked) e.currentTarget.setCustomValidity("Select at least one weekday.");
                            }}
                          />
                          <span className="flex h-11 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 transition-all duration-150 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 peer-checked:shadow-md peer-checked:shadow-indigo-200 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400 hover:border-indigo-300">
                            {d}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Field label="Start Time (24h)" required>
                    <input
                      type="time" name="availableStart" className={inputCls} ref={startRef} step="60" required
                      value={availStart}
                      onChange={(e) => {
                        setAvailStart(e.target.value);
                        startRef.current?.setCustomValidity("");
                        (prefStartRefs.current || []).forEach((el) => el?.setCustomValidity(""));
                        (prefEndRefs.current || []).forEach((el) => el?.setCustomValidity(""));
                      }}
                    />
                  </Field>
                  <Field label="End Time (24h)" required>
                    <input
                      type="time" name="availableEnd" className={inputCls} ref={endRef} step="60" required
                      value={availEnd}
                      onChange={(e) => {
                        setAvailEnd(e.target.value);
                        endRef.current?.setCustomValidity("");
                        (prefStartRefs.current || []).forEach((el) => el?.setCustomValidity(""));
                        (prefEndRefs.current || []).forEach((el) => el?.setCustomValidity(""));
                      }}
                    />
                  </Field>
                  <Field label="Timezone">
                    <select name="timezone" className={inputCls} value={tz} onChange={(e) => setTz(e.target.value)}>
                      <option value="" disabled={tz !== ""}>Select</option>
                      {TIMEZONES_US_MX.map((z) => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </Field>

                  {/* Preferable Time Slots */}
                  <div className="md:col-span-3 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Preferable Time Slots <span className="text-slate-400 font-normal normal-case">(optional)</span>
                      </span>
                      <button
                        type="button" onClick={addPrefSlot} disabled={!availStart || !availEnd}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> Add Slot
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Must fall within your overall start &amp; end times.</p>

                    <div className="mt-3 space-y-3">
                      {prefSlots.length === 0 ? (
                        <div className="text-xs text-slate-400 italic py-3 text-center border border-dashed border-slate-200 rounded-xl">
                          No slots added yet. Set start &amp; end times above, then click "Add Slot."
                        </div>
                      ) : (
                        prefSlots.map((s, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <div className="md:col-span-3">
                              <label className={labelCls}>Slot {idx + 1}: Start</label>
                              <input
                                type="time" value={s.start}
                                onChange={(e) => { prefStartRefs.current[idx]?.setCustomValidity(""); prefEndRefs.current[idx]?.setCustomValidity(""); updatePrefSlot(idx, "start", e.target.value); }}
                                className={inputCls} ref={(el) => (prefStartRefs.current[idx] = el)} step="60"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className={labelCls}>Slot {idx + 1}: End</label>
                              <input
                                type="time" value={s.end}
                                onChange={(e) => { prefEndRefs.current[idx]?.setCustomValidity(""); prefStartRefs.current[idx]?.setCustomValidity(""); updatePrefSlot(idx, "end", e.target.value); }}
                                className={inputCls} ref={(el) => (prefEndRefs.current[idx] = el)} step="60"
                              />
                            </div>
                            <div className="md:col-span-1">
                              <button type="button" onClick={() => removePrefSlot(idx)} className="w-full h-11 rounded-xl border border-rose-200 text-rose-500 text-sm font-medium hover:bg-rose-50 transition-colors">
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </FormSection>

                {/* ── Compensation / Payout ── */}
                <FormSection title="Compensation / Payout">
                  <Field label="Rate Type">
                    <select name="rateType" className={inputCls} value={rateType} onChange={(e) => setRateType(e.target.value)}>
                      <option value="" disabled={rateType !== ""}>Select</option>
                      <option value="Hourly">Hourly</option>
                      <option value="Per Session">Per Session</option>
                      <option value="Fixed">Fixed</option>
                    </select>
                  </Field>
                  <Field label="Expected Rate">
                    <input type="number" min="0" step="0.01" name="expectedRate" className={inputCls} placeholder="e.g., 1500" />
                  </Field>
                  <Field label="Currency">
                    <select name="currency" className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="" disabled={currency !== ""}>Select</option>
                      <option value="USD">USD</option>
                      <option value="CAD">CAD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </Field>
                  <Field label="Preferred Payout Method">
                    <select
                      name="payoutMethod" className={inputCls} value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      disabled={country !== "United States" && country !== "Canada"}
                    >
                      <option value="" disabled>{country ? "Select" : "Select country first"}</option>
                      {country === "Canada" && (<><option>EFT (CA Bank)</option><option>Interac e-Transfer</option><option>PayPal</option></>)}
                      {country === "United States" && (<><option>ACH (US Bank)</option><option>Zelle</option><option>PayPal</option></>)}
                    </select>
                  </Field>
                  <Field label="Payout Identifier" span={2}>
                    <input name="payoutIdentifier" className={inputCls} placeholder={payIdPlaceholder} />
                  </Field>
                </FormSection>

                {/* ── Compliance & Documents ── */}
                <FormSection title="Compliance & Documents" icon={faShieldAlt}>
                  <Field label="Resume / CV" required>
                    <input type="file" name="resume" required className={inputCls} accept=".pdf,.doc,.docx" />
                  </Field>
                  <Field label="Profile Photo">
                    <input type="file" name="photo" className={inputCls} accept="image/*" />
                  </Field>
                  <Field label="Certificates">
                    <input type="file" name="certificates" className={inputCls} accept=".pdf,.png,.jpg,.jpeg" multiple />
                  </Field>
                  <Field label="Background Check">
                    <select name="backgroundCheck" className={inputCls} value={backgroundCheck} onChange={(e) => setBackgroundCheck(e.target.value)}>
                      <option value="" disabled={backgroundCheck !== ""}>Select</option>
                      <option value="Pending">Pending</option>
                      <option value="Cleared">Cleared</option>
                      <option value="Not Required">Not Required</option>
                    </select>
                  </Field>
                  <div className="md:col-span-2 flex items-center gap-6">
                    <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" name="ndaSigned" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">NDA signed</span>
                    </label>
                    <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" name="agreeToTerms" required className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">I confirm all details are accurate <span className="text-rose-400">*</span></span>
                    </label>
                  </div>
                </FormSection>

                {/* ── Assignment ── */}
                <FormSection title="Assignment">
                  <Field label="Assign to Internship (title or ID)">
                    <input name="assignInternship" className={inputCls} placeholder="e.g., MERN Bootcamp – 2025 Summer" />
                  </Field>
                  <Field label="Notes" span={3}>
                    <textarea name="notes" rows={3} className={textareaCls} placeholder="Internal notes" />
                  </Field>
                </FormSection>

                {/* Submit */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="submit" disabled={submitting || otpOpen}
                    className="inline-flex items-center gap-2.5 px-7 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98] transition-all duration-150"
                  >
                    <FontAwesomeIcon icon={faCloudUploadAlt} />
                    {submitting ? "Saving..." : "Save Instructor"}
                  </button>
                  <span className="text-xs text-slate-400">You can edit or assign later from the list below.</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══  OTP MODAL  ═══ */}
      {otpOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 border border-slate-200/60">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
              <FontAwesomeIcon icon={faEnvelope} className="text-indigo-500 text-xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Verify Email</h3>
            <p className="text-sm text-slate-500 mb-5">
              We sent a 6-digit code to <span className="font-semibold text-slate-700">{otpEmail}</span>
            </p>
            <input
              type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit OTP"
              value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
              className={inputCls + " text-center text-lg tracking-[0.35em] font-bold mb-5"}
            />
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setOtpOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await axios.post("/api/instructors/otp/verify", { email: otpEmail, otp: otpCode }, { headers: authHeaders() });
                    const data = await createInstructorWithFormData(pendingFormData);
                    const normalized = { id: data._id || data.id, ...data };
                    setInstructors((prev) => [normalized, ...prev]);
                    setIsAddOpen(false);
                    setOtpOpen(false); setOtpCode(""); setPendingFormData(null); setPrefSlots([]);
                    alert("Instructor created successfully.");
                  } catch (err) {
                    console.error("Verify OTP or Create failed:", err);
                    alert(err?.response?.data?.message || "Invalid OTP or create failed.");
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                Verify &amp; Save
              </button>
            </div>
            <div className="mt-4 text-center">
              <button type="button" className="text-xs text-indigo-600 font-medium hover:underline"
                onClick={async () => {
                  try { await axios.post("/api/instructors/otp/start", { email: otpEmail }, { headers: authHeaders() }); alert("OTP resent."); }
                  catch { alert("Failed to resend OTP."); }
                }}
              >
                Didn't receive a code? Resend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══  EDIT MODAL  ═══ */}
      {editing && (
        <InstructorManagementedit
          open={Boolean(editing)} item={editing} onClose={() => setEditing(null)}
          onSaved={(updated) => {
            const updatedId = updated?._id || updated?.id;
            if (!updatedId) { setEditing(null); return; }
            setInstructors((prev) => prev.map((x) => (x._id || x.id) === updatedId ? { ...x, ...updated } : x));
            setEditing(null);
            alert("Instructor updated successfully.");
          }}
        />
      )}

      {/* ═══  PHOTO PREVIEW  ═══ */}
      {photoPreview.open && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={closePhoto} role="dialog" aria-modal="true">
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={closePhoto} className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 text-white text-lg flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="Close">
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={photoPreview.src} alt={photoPreview.alt || "Instructor photo"} className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* ═══════════  INSTRUCTOR LIST  ═══════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col flex-1 overflow-hidden">

        {/* List header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Your Instructors</h2>
          <div className="relative w-full max-w-xs">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 mt-2 text-slate-400 text-sm" />
            <input
              className={inputCls + " pl-10 !h-10 !rounded-xl bg-slate-50 border-slate-200"}
              placeholder="Search by name, email, skills..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List body */}
        <div className="flex-1 p-5">
          {filteredInstructors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faSearch} className="text-slate-300 text-xl" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No instructors found</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Instructor" to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedInstructors.map((i) => {
                const id = i._id || i.id;
                return (
                  <div
                    key={id}
                    className="group relative border border-slate-100 rounded-2xl p-5 flex items-center justify-between gap-5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Avatar */}
                      {i?.photo?.url ? (
                        <img
                          src={i.photo.url} alt={`${i.firstName || ""} ${i.lastName || ""}`}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md flex-shrink-0 cursor-zoom-in transition-transform hover:scale-105"
                          loading="lazy" role="button" tabIndex={0}
                          onClick={() => openPhoto(i.photo.url, `${i.firstName || ""} ${i.lastName || ""}`)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openPhoto(i.photo.url, `${i.firstName || ""} ${i.lastName || ""}`); }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md">
                          {avatarInitials(i)}
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {i.firstName} {i.lastName}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          {i.email && (
                            <span className="flex items-center gap-1 truncate">
                              <FontAwesomeIcon icon={faEnvelope} className="text-slate-300 text-[10px]" />
                              {i.email}
                            </span>
                          )}
                          {i.phone && (
                            <span className="hidden sm:flex items-center gap-1">
                              <FontAwesomeIcon icon={faPhone} className="text-slate-300 text-[10px]" />
                              {i.phone}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(i.specializations || []).slice(0, 3).map((sp) => (
                            <Badge key={sp} color="indigo">{sp}</Badge>
                          ))}
                          {(i.skills || []).slice(0, 2).map((sk) => (
                            <Badge key={sk} color="emerald">{sk}</Badge>
                          ))}
                          {((i.specializations?.length || 0) + (i.skills?.length || 0)) > 5 && (
                            <Badge color="slate">+{(i.specializations?.length || 0) + (i.skills?.length || 0) - 5} more</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions — 3-dot menu on mobile, buttons on desktop */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Desktop actions */}
                      <div className="hidden lg:flex items-center gap-2">
                        <button type="button" onClick={() => { setIsAddOpen(false); setViewing(i); }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-[10px]" /> View
                        </button>
                        <button type="button" onClick={() => { setIsAddOpen(false); setViewing(null); setEditing(i); }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
                        >
                          <FontAwesomeIcon icon={faPen} className="text-[10px]" /> Edit
                        </button>
                        <button type="button" onClick={() => { setIsAddOpen(false); setViewing({ ...i, __askDelete: true, __confirmOnly: true }); }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-[10px]" /> Delete
                        </button>
                      </div>

                      {/* Mobile 3-dot menu */}
                      <div className="relative lg:hidden">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === id ? null : id); }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                          <FontAwesomeIcon icon={faEllipsisV} />
                        </button>
                        {openMenuId === id && (
                          <div className="absolute right-0 top-11 z-20 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in slide-in-from-top-2">
                            <button onClick={() => { setOpenMenuId(null); setIsAddOpen(false); setViewing(i); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                              <FontAwesomeIcon icon={faEye} className="text-xs text-indigo-500" /> View
                            </button>
                            <button onClick={() => { setOpenMenuId(null); setIsAddOpen(false); setViewing(null); setEditing(i); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                              <FontAwesomeIcon icon={faPen} className="text-xs text-amber-500" /> Edit
                            </button>
                            <button onClick={() => { setOpenMenuId(null); setIsAddOpen(false); setViewing({ ...i, __askDelete: true, __confirmOnly: true }); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                              <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredInstructors.length > 0 && (
          <div className="flex justify-center items-center gap-1.5 px-6 py-5 border-t border-slate-100">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum} onClick={() => setPage(pageNum)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-150 ${pageNum === page
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={!hasMore}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructureManagement;