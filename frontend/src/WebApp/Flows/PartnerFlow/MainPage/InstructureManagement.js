//File: InstructureManagement.jsx

import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faPlus, faUserCheck } from "@fortawesome/free-solid-svg-icons";
import InstructureDetailsView from "./InstructureDetailsView";
import InstructorManagementedit from "./InstructorManagementedit";

// ─── Design tokens ────────────────────────────────────────────────────────────
const inputCls =
    "w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 placeholder-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-150 " +
    "file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:text-violet-700 file:text-xs file:font-semibold file:px-3 file:py-2 file:cursor-pointer";

const textareaCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-150 min-h-[8rem]";

const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

const sectionCardCls =
    "bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5";

const sectionTitleCls =
    "flex items-center gap-2.5 text-sm font-bold text-slate-700 uppercase tracking-widest";

const sectionDotCls = "w-2 h-2 rounded-full bg-violet-500 flex-shrink-0";

const dayOpts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const INSTRUCTORS_PER_PAGE = 10;

// ─── Data ─────────────────────────────────────────────────────────────────────
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

const TIMEZONES_US_MX = [
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Phoenix", "America/Anchorage", "America/Honolulu",
    "America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg",
    "America/Halifax", "America/St_Johns", "America/Regina", "America/Whitehorse",
    "America/Yellowknife", "America/Iqaluit"
];

// ─── Auth helpers ─────────────────────────────────────────────────────────────
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
    } catch { return null; }
};
const authHeaders = () => {
    const token = getPartnerToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Small shared atoms ───────────────────────────────────────────────────────
const Field = ({ label, children, span = 1 }) => (
    <div className={span > 1 ? `md:col-span-${span}` : ""}>
        {label && <label className={labelCls}>{label}</label>}
        {children}
    </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
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
            .map(s => (s || "").trim()[0]?.toUpperCase())
            .join("");
        return a || (i?.email?.[0] || "?").toUpperCase();
    };

    const openPhoto = (src, alt = "") => setPhotoPreview({ open: true, src, alt });
    const closePhoto = () => setPhotoPreview({ open: false, src: "", alt: "" });

    const addPrefSlot = () => setPrefSlots((prev) => [...prev, { start: "", end: "" }]);
    const updatePrefSlot = (idx, field, value) =>
        setPrefSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    const removePrefSlot = (idx) =>
        setPrefSlots((prev) => prev.filter((_, i) => i !== idx));

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
                    : (data?.items || data?.data || data?.results || data?.docs || data?.instructors || []);
                const items = Array.isArray(raw)
                    ? raw
                    : (raw?.items || raw?.results || raw?.docs || raw?.instructors || []);
                setInstructors(items.map((d) => ({ id: d._id || d.id, ...d })));
            } catch (err) {
                console.error("fetchInstructors error:", err);
                const status = err?.response?.status;
                const msg =
                    err?.response?.data?.message ||
                    (status === 401 ? "Session expired. Please login again."
                        : status === 403 ? "You don't have permission to view instructors."
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

    const stateList = country === "Canada" ? CA_PROVINCES : US_STATES;
    const stateLabel = country === "Canada" ? "Province / Territory" : "State";
    const postalLabel = country === "Canada" ? "Postal Code" : "ZIP Code";
    const phonePlaceholder = country === "Canada" ? "+1 (416) 555-1234" : "+1 (555) 555-1234";
    const cityPlaceholder = country === "Canada" ? "e.g., Toronto" : "e.g., San Jose";
    const payIdPlaceholder =
        payoutMethod === "ACH (US Bank)" ? "Routing & last-4 (e.g., 111000025 | ****1234)"
            : payoutMethod === "Zelle" ? "Zelle email or phone"
                : payoutMethod === "EFT (CA Bank)" ? "Transit|Institution|Account (e.g., 12345|004|0012345)"
                    : payoutMethod === "Interac e-Transfer" ? "Email or mobile number"
                        : "PayPal email";

    async function createInstructorWithFormData(fd) {
        const { data } = await axios.post("/api/instructors", fd, { headers: authHeaders() });
        return data;
    }

    const handleSubmit = async (e) => {
        setSubmitting(true);
        const form = e.currentTarget;
        [...form.querySelectorAll('input[name="availableDays"]')]
            .forEach(el => el.setCustomValidity(""));
        if (!form.checkValidity()) { form.reportValidity(); setSubmitting(false); return; }
        e.preventDefault();
        try {
            const fd = new FormData(e.target);
            const availableDays = fd.getAll("availableDays");
            if (availableDays.length === 0) {
                const firstBox = e.currentTarget.querySelector('input[name="availableDays"]');
                if (firstBox) { firstBox.setCustomValidity("Select at least one weekday."); firstBox.reportValidity(); }
                setSubmitting(false); return;
            }
            startRef.current?.setCustomValidity("");
            endRef.current?.setCustomValidity("");
            (prefStartRefs.current || []).forEach(el => el?.setCustomValidity(""));
            (prefEndRefs.current || []).forEach(el => el?.setCustomValidity(""));
            const start = fd.get("availableStart");
            const end = fd.get("availableEnd");
            if (start && end && end <= start) {
                endRef.current?.setCustomValidity("End Time must be AFTER Start Time (24-hour HH:MM).");
                endRef.current?.reportValidity();
                setSubmitting(false); return;
            }
            const cleanedSlots = (prefSlots || []).filter(s => s.start && s.end).map(s => ({ start: s.start, end: s.end }));
            for (let i = 0; i < cleanedSlots.length; i++) {
                const s = cleanedSlots[i];
                if (!(s.start < s.end)) { prefEndRefs.current[i]?.setCustomValidity("End Time must be after Start Time."); prefEndRefs.current[i]?.reportValidity(); setSubmitting(false); return; }
                if (start && s.start < start) { prefStartRefs.current[i]?.setCustomValidity(`Slot ${i + 1}: Start must be on or AFTER overall Start (${start}).`); prefStartRefs.current[i]?.reportValidity(); setSubmitting(false); return; }
                if (end && s.end > end) { prefEndRefs.current[i]?.setCustomValidity(`Slot ${i + 1}: End must be on or BEFORE overall End (${end}).`); prefEndRefs.current[i]?.reportValidity(); setSubmitting(false); return; }
            }
            const sortedSlots = [...cleanedSlots].sort((a, b) => a.start.localeCompare(b.start));
            for (let i = 1; i < sortedSlots.length; i++) {
                if (sortedSlots[i].start < sortedSlots[i - 1].end) {
                    const laterIdx = cleanedSlots.findIndex(s => s.start === sortedSlots[i].start);
                    prefStartRefs.current[laterIdx]?.setCustomValidity("Time slots cannot overlap.");
                    prefStartRefs.current[laterIdx]?.reportValidity();
                    setSubmitting(false); return;
                }
            }
            const resume = fd.get("resume");
            const photo = fd.get("photo");
            const certificates = fd.getAll("certificates");
            const ndaSigned = fd.get("ndaSigned") === "on";
            const agreeToTerms = fd.get("agreeToTerms") === "on";
            const payload = {
                firstName: fd.get("firstName"), lastName: fd.get("lastName"), email: fd.get("email"),
                phone: fd.get("phone"), altPhone: fd.get("altPhone"), country: fd.get("country"),
                state: fd.get("state"), city: fd.get("city"), postalCode: fd.get("postalCode"),
                address1: fd.get("address1"), address2: fd.get("address2"),
                qualification: fd.get("qualification"),
                experienceYears: fd.get("experienceYears") ? Number(fd.get("experienceYears")) : null,
                organization: fd.get("organization"),
                specializations: (fd.get("specializations") || "").split(",").map(s => s.trim()).filter(Boolean),
                skills: (fd.get("skills") || "").split(",").map(s => s.trim()).filter(Boolean),
                languages: (fd.get("languages") || "").split(",").map(s => s.trim()).filter(Boolean),
                teachingMode: fd.get("teachingMode"), bio: fd.get("bio"),
                availableDays, availableStart: fd.get("availableStart"), availableEnd: fd.get("availableEnd"),
                timezone: fd.get("timezone"), preferableSlots: cleanedSlots,
                rateType: fd.get("rateType"),
                expectedRate: fd.get("expectedRate") ? Number(fd.get("expectedRate")) : null,
                currency: fd.get("currency"), payoutMethod: fd.get("payoutMethod"),
                payoutIdentifier: fd.get("payoutIdentifier"),
                backgroundCheck: fd.get("backgroundCheck") || "Pending",
                ndaSigned, agreeToTerms, assignInternship: fd.get("assignInternship"), notes: fd.get("notes"),
            };
            const formData = new FormData();
            formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
            formData.append("resume", resume);
            if (photo instanceof File && photo.size) formData.append("photo", photo);
            certificates.forEach(file => formData.append("certificates", file));
            try {
                const email = (payload.email || "").trim();
                if (!email) { alert("Email is required."); setSubmitting(false); return; }
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
            const { data } = await axios.post("/api/ai/assign-instructors", { partnerId }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const made = data.assignments_made || 0;
            const lines = (data.assignments || []).map(r => `Internship ${r.internshipId} → ${r.sessionsUpdated} session(s)`).join("\n");
            alert(`Assigned ${made} session${made === 1 ? "" : "s"}.\n${lines}`);
        } catch (err) {
            console.error("Assign Instructor failed:", err);
            alert(err?.response?.status === 401 ? "Session expired. Please log in again." : "Assign Instructor failed. Check server logs.");
        }
    };

    const filteredInstructors = instructors.filter((i) => {
        const hay = [i.firstName, i.lastName, i.email, i.phone, ...(i.specializations || []), ...(i.skills || [])].join(" ").toLowerCase();
        return hay.includes(search.toLowerCase());
    });
    const totalPages = Math.max(1, Math.ceil(filteredInstructors.length / INSTRUCTORS_PER_PAGE));
    const hasMore = page < totalPages;
    const paginatedInstructors = filteredInstructors.slice((page - 1) * INSTRUCTORS_PER_PAGE, page * INSTRUCTORS_PER_PAGE);

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

    // ─── Colour helpers for mode badges
    const modeBadge = (mode) => {
        if (!mode) return "bg-slate-100 text-slate-500";
        if (mode === "Online") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
        if (mode === "Offline") return "bg-amber-50 text-amber-700 border border-amber-200";
        return "bg-violet-50 text-violet-700 border border-violet-200";
    };

    // ─── JSX ──────────────────────────────────────────────────────────────────
    return (
        <div className="w-full min-h-screen bg-slate-50 flex flex-col">

            {/* ── Page Header ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-7">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Instructor Management
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">Register, manage and assign your instructors</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setViewing(null); setCountry(""); setStateProv(""); setQualification("");
                            setTeachingMode(""); setRateType(""); setCurrency(""); setBackgroundCheck("");
                            setIsAddOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-md shadow-violet-200 transition-all duration-150 active:scale-95"
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-xs" />
                        Add Instructor
                    </button>

                    <button
                        type="button"
                        onClick={handleAssignInstructor}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-md shadow-amber-200 transition-all duration-150 active:scale-95"
                    >
                        <FontAwesomeIcon icon={faUserCheck} className="text-xs" />
                        Assign Instructor
                    </button>
                </div>
            </div>

            {/* ── Details view (outside modal) ───────────────────────────────── */}
            {!isAddOpen && (
                <InstructureDetailsView
                    open={Boolean(viewing)}
                    item={viewing}
                    onClose={() => setViewing(null)}
                    autoDeletePrompt={Boolean(viewing?.__askDelete)}
                    confirmOnly={Boolean(viewing?.__confirmOnly)}
                    onDeleted={(id) => setInstructors(prev => prev.filter(x => (x._id || x.id) !== id))}
                />
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ADD INSTRUCTOR MODAL
            ══════════════════════════════════════════════════════════════════ */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <div className="bg-slate-50 w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/60">

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-7 py-5 bg-white border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faPlus} className="text-violet-600 text-xs" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Register New Instructor</h2>
                                    <p className="text-xs text-slate-400">Fill in the details below — you can edit later</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-lg font-medium transition-all"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-7 overflow-y-auto flex-1 min-h-0">
                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* ── Personal & Contact ─────────────────────── */}
                                <div className={sectionCardCls}>
                                    <div className={sectionTitleCls}>
                                        <span className={sectionDotCls} />
                                        Personal &amp; Contact
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <Field label="First Name *">
                                            <input name="firstName" required className={inputCls} placeholder="e.g., Priya" />
                                        </Field>
                                        <Field label="Last Name *">
                                            <input name="lastName" required className={inputCls} placeholder="e.g., Sharma" />
                                        </Field>
                                        <Field label="Email *">
                                            <input type="email" name="email" required className={inputCls} placeholder="name@example.com" />
                                        </Field>
                                        <Field label="Mobile *">
                                            <input name="phone" required className={inputCls} placeholder={phonePlaceholder} />
                                        </Field>
                                        <Field label="Alternate Phone">
                                            <input name="altPhone" className={inputCls} placeholder={phonePlaceholder} />
                                        </Field>
                                        <Field label="Country *">
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
                                                <option value="" disabled={country !== ""}>Select country</option>
                                                <option>United States</option>
                                                <option>Canada</option>
                                            </select>
                                        </Field>
                                        <Field label={`${stateLabel} *`}>
                                            <select name="state" required disabled={!country} className={inputCls} value={stateProv} onChange={e => setStateProv(e.target.value)}>
                                                <option value="" disabled hidden>Select</option>
                                                {stateList.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="City *">
                                            <input name="city" required ref={cityRef} className={inputCls} placeholder={cityPlaceholder} />
                                        </Field>
                                        <Field label={`${postalLabel} *`}>
                                            <input name="postalCode" required ref={postalRef} className={inputCls} placeholder={country === "Canada" ? "M5V 3L9" : "95113"} />
                                        </Field>
                                        <Field label="Address Line 1 *">
                                            <input name="address1" required ref={address1Ref} className={inputCls} placeholder="Street address, suite, unit" />
                                        </Field>
                                        <Field label="Address Line 2">
                                            <input name="address2" ref={address2Ref} className={inputCls} placeholder="Optional" />
                                        </Field>
                                    </div>
                                </div>

                                {/* ── Professional & Teaching ────────────────── */}
                                <div className={sectionCardCls}>
                                    <div className={sectionTitleCls}>
                                        <span className={sectionDotCls} />
                                        Professional &amp; Teaching
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <Field label="Highest Qualification">
                                            <select name="qualification" className={inputCls} value={qualification} onChange={e => setQualification(e.target.value)}>
                                                <option value="" disabled={qualification !== ""}>Select</option>
                                                {["Diploma", "Bachelor", "Master", "PhD", "Other"].map(q => <option key={q}>{q}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="Years of Experience">
                                            <input type="number" min="0" step="0.5" name="experienceYears" className={inputCls} placeholder="e.g., 3" />
                                        </Field>
                                        <Field label="Current / Recent Organization">
                                            <input name="organization" className={inputCls} placeholder="Company or Institute" />
                                        </Field>
                                        <div className="md:col-span-3">
                                            <Field label="Teaching Specializations (comma-separated)">
                                                <input name="specializations" className={inputCls} placeholder="e.g., React, Data Structures, Python" />
                                            </Field>
                                        </div>
                                        <div className="md:col-span-3">
                                            <Field label="Skills / Technologies (comma-separated)">
                                                <input name="skills" className={inputCls} placeholder="e.g., MongoDB, Node.js, AWS" />
                                            </Field>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Field label="Languages (comma-separated)">
                                                <input name="languages" className={inputCls} placeholder="e.g., English, Spanish" />
                                            </Field>
                                        </div>
                                        <Field label="Teaching Mode">
                                            <select name="teachingMode" className={inputCls} value={teachingMode} onChange={e => setTeachingMode(e.target.value)}>
                                                <option value="" disabled={teachingMode !== ""}>Select</option>
                                                {["Online", "Offline", "Hybrid"].map(m => <option key={m}>{m}</option>)}
                                            </select>
                                        </Field>
                                        <div className="md:col-span-3">
                                            <Field label="Short Bio / Summary">
                                                <textarea name="bio" rows={3} className={textareaCls} placeholder="Brief profile to show on your site" />
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Availability ───────────────────────────── */}
                                <div className={sectionCardCls}>
                                    <div className={sectionTitleCls}>
                                        <span className={sectionDotCls} />
                                        Availability
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                        {/* Weekdays */}
                                        <div className="md:col-span-3">
                                            <label className={labelCls}>Weekdays *</label>
                                            <div role="group" aria-label="Weekdays" className="grid grid-cols-7 gap-2 mt-1">
                                                {dayOpts.map(d => (
                                                    <label key={d} className="relative block">
                                                        <input
                                                            type="checkbox" name="availableDays" value={d}
                                                            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                            onChange={e => {
                                                                const formEl = e.currentTarget.form;
                                                                if (!formEl) return;
                                                                const boxes = formEl.querySelectorAll('input[name="availableDays"]');
                                                                const anyChecked = Array.from(boxes).some(b => b.checked);
                                                                boxes.forEach(b => b.setCustomValidity(""));
                                                                if (!anyChecked) e.currentTarget.setCustomValidity("Select at least one weekday.");
                                                            }}
                                                        />
                                                        <span className="flex h-11 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 cursor-pointer transition-all peer-checked:bg-violet-600 peer-checked:text-white peer-checked:border-violet-600 peer-focus:ring-2 peer-focus:ring-violet-400 hover:border-violet-300">
                                                            {d}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Start / End */}
                                        <Field label="Start Time * (24 h)">
                                            <input
                                                type="time" name="availableStart" className={inputCls} ref={startRef} step="60"
                                                title="24-hour HH:MM" required value={availStart}
                                                onChange={e => {
                                                    setAvailStart(e.target.value);
                                                    startRef.current?.setCustomValidity("");
                                                    (prefStartRefs.current || []).forEach(el => el?.setCustomValidity(""));
                                                    (prefEndRefs.current || []).forEach(el => el?.setCustomValidity(""));
                                                }}
                                            />
                                        </Field>
                                        <Field label="End Time * (24 h)">
                                            <input
                                                type="time" name="availableEnd" className={inputCls} ref={endRef} step="60"
                                                title="24-hour HH:MM" required value={availEnd}
                                                onChange={e => {
                                                    setAvailEnd(e.target.value);
                                                    endRef.current?.setCustomValidity("");
                                                    (prefStartRefs.current || []).forEach(el => el?.setCustomValidity(""));
                                                    (prefEndRefs.current || []).forEach(el => el?.setCustomValidity(""));
                                                }}
                                            />
                                        </Field>

                                        {/* Preferable slots */}
                                        <div className="md:col-span-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <span className={labelCls + " mb-0"}>Preferable Time Slots</span>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        Must fall within your overall start–end window
                                                    </p>
                                                </div>
                                                <button
                                                    type="button" onClick={addPrefSlot} disabled={!availStart || !availEnd}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                                >
                                                    <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                                                    Add Slot
                                                </button>
                                            </div>

                                            {prefSlots.length === 0 ? (
                                                <div className="text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                                                    No preferable slots yet — set start &amp; end time first, then click <strong>Add Slot</strong>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {prefSlots.map((s, idx) => (
                                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end bg-slate-50 border border-slate-100 rounded-xl p-3">
                                                            <div className="md:col-span-3">
                                                                <Field label={`Slot ${idx + 1}: Start (24 h)`}>
                                                                    <input
                                                                        type="time" value={s.start} step="60" className={inputCls}
                                                                        ref={el => (prefStartRefs.current[idx] = el)}
                                                                        onChange={e => { prefStartRefs.current[idx]?.setCustomValidity(""); prefEndRefs.current[idx]?.setCustomValidity(""); updatePrefSlot(idx, "start", e.target.value); }}
                                                                    />
                                                                </Field>
                                                            </div>
                                                            <div className="md:col-span-3">
                                                                <Field label={`Slot ${idx + 1}: End (24 h)`}>
                                                                    <input
                                                                        type="time" value={s.end} step="60" className={inputCls}
                                                                        ref={el => (prefEndRefs.current[idx] = el)}
                                                                        onChange={e => { prefEndRefs.current[idx]?.setCustomValidity(""); prefStartRefs.current[idx]?.setCustomValidity(""); updatePrefSlot(idx, "end", e.target.value); }}
                                                                    />
                                                                </Field>
                                                            </div>
                                                            <div className="md:col-span-1 flex items-end">
                                                                <button
                                                                    type="button" onClick={() => removePrefSlot(idx)}
                                                                    className="w-full h-11 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-sm font-semibold transition-all"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Timezone */}
                                        <Field label="Timezone">
                                            <select name="timezone" className={inputCls} value={tz} onChange={e => setTz(e.target.value)}>
                                                <option value="" disabled={tz !== ""}>Select timezone</option>
                                                {TIMEZONES_US_MX.map(z => <option key={z} value={z}>{z}</option>)}
                                            </select>
                                        </Field>
                                    </div>
                                </div>

                                {/* ── Compensation ───────────────────────────── */}
                                <div className={sectionCardCls}>
                                    <div className={sectionTitleCls}>
                                        <span className={sectionDotCls} />
                                        Compensation &amp; Payout
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <Field label="Rate Type">
                                            <select name="rateType" className={inputCls} value={rateType} onChange={e => setRateType(e.target.value)}>
                                                <option value="" disabled={rateType !== ""}>Select</option>
                                                {["Hourly", "Per Session", "Fixed"].map(r => <option key={r}>{r}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="Expected Rate">
                                            <input type="number" min="0" step="0.01" name="expectedRate" className={inputCls} placeholder="e.g., 1500" />
                                        </Field>
                                        <Field label="Currency">
                                            <select name="currency" className={inputCls} value={currency} onChange={e => setCurrency(e.target.value)}>
                                                <option value="" disabled={currency !== ""}>Select</option>
                                                {["USD", "CAD", "EUR"].map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="Preferred Payout Method">
                                            <select name="payoutMethod" className={inputCls} value={payoutMethod} onChange={e => setPayoutMethod(e.target.value)} disabled={country !== "United States" && country !== "Canada"}>
                                                <option value="" disabled>{country ? "Select" : "Select country first"}</option>
                                                {country === "Canada" && (<><option>EFT (CA Bank)</option><option>Interac e-Transfer</option><option>PayPal</option></>)}
                                                {country === "United States" && (<><option>ACH (US Bank)</option><option>Zelle</option><option>PayPal</option></>)}
                                            </select>
                                        </Field>
                                        <div className="md:col-span-2">
                                            <Field label="Payout Identifier">
                                                <input name="payoutIdentifier" className={inputCls} placeholder={payIdPlaceholder} />
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Compliance & Documents ─────────────────── */}
                                <div className={sectionCardCls}>
                                    <div className={sectionTitleCls}>
                                        <span className={sectionDotCls} />
                                        Compliance &amp; Documents
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <Field label="Resume / CV *">
                                            <input type="file" name="resume" required className={inputCls} accept=".pdf,.doc,.docx" />
                                        </Field>
                                        <Field label="Profile Photo">
                                            <input type="file" name="photo" className={inputCls} accept="image/*" />
                                        </Field>
                                        <Field label="Certificates">
                                            <input type="file" name="certificates" className={inputCls} accept=".pdf,.png,.jpg,.jpeg" multiple />
                                        </Field>
                                        <Field label="Background Check">
                                            <select name="backgroundCheck" className={inputCls} value={backgroundCheck} onChange={e => setBackgroundCheck(e.target.value)}>
                                                <option value="" disabled={backgroundCheck !== ""}>Select</option>
                                                {["Pending", "Cleared", "Not Required"].map(b => <option key={b}>{b}</option>)}
                                            </select>
                                        </Field>
                                        <div className="md:col-span-2 flex items-center gap-6 pt-1">
                                            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                                                <input type="checkbox" name="ndaSigned" className="w-4 h-4 accent-violet-600 rounded" />
                                                <span className="text-sm text-slate-700 font-medium">NDA signed</span>
                                            </label>
                                            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                                                <input type="checkbox" name="agreeToTerms" required className="w-4 h-4 accent-violet-600 rounded" />
                                                <span className="text-sm text-slate-700 font-medium">I confirm all details are accurate *</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Assignment ─────────────────────────────── */}
                                <div className={sectionCardCls}>
                                    <div className={sectionTitleCls}>
                                        <span className={sectionDotCls} />
                                        Assignment
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <Field label="Assign to Internship (title or ID)">
                                            <input name="assignInternship" className={inputCls} placeholder="e.g., MERN Bootcamp – 2025 Summer" />
                                        </Field>
                                        <div className="md:col-span-3">
                                            <Field label="Internal Notes">
                                                <textarea name="notes" rows={3} className={textareaCls} placeholder="Any notes for your team" />
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Submit ─────────────────────────────────── */}
                                <div className="flex items-center gap-4 pt-1">
                                    <button
                                        type="submit" disabled={submitting || otpOpen}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-violet-200 transition-all duration-150 disabled:opacity-50 active:scale-95"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="text-xs" />
                                        {submitting ? "Saving…" : "Save Instructor"}
                                    </button>
                                    <span className="text-xs text-slate-400">You can edit or assign later from the list.</span>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                OTP MODAL
            ══════════════════════════════════════════════════════════════════ */}
            {otpOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 border border-slate-100">
                        <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 text-center mb-1">Verify Email</h3>
                        <p className="text-sm text-slate-500 text-center mb-5">
                            A 6-digit code was sent to<br />
                            <span className="font-semibold text-slate-800">{otpEmail}</span>
                        </p>
                        <input
                            type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                            value={otpCode} onChange={e => setOtpCode(e.target.value)}
                            className="w-full h-12 text-center text-2xl font-bold tracking-[0.4em] rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 mb-4 text-slate-900"
                        />
                        <div className="flex gap-3">
                            <button
                                type="button" onClick={() => setOtpOpen(false)}
                                className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await axios.post("/api/instructors/otp/verify", { email: otpEmail, otp: otpCode }, { headers: authHeaders() });
                                        const data = await createInstructorWithFormData(pendingFormData);
                                        setInstructors(prev => [{ id: data._id || data.id, ...data }, ...prev]);
                                        setIsAddOpen(false); setOtpOpen(false); setOtpCode(""); setPendingFormData(null); setPrefSlots([]);
                                        alert("Instructor created successfully.");
                                    } catch (err) {
                                        console.error("Verify OTP or Create failed:", err);
                                        alert(err?.response?.data?.message || "Invalid OTP or create failed.");
                                    }
                                }}
                                className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition active:scale-95"
                            >
                                Verify &amp; Save
                            </button>
                        </div>
                        <button
                            type="button"
                            className="mt-4 w-full text-sm text-violet-600 hover:text-violet-800 font-medium transition"
                            onClick={async () => {
                                try {
                                    await axios.post("/api/instructors/otp/start", { email: otpEmail }, { headers: authHeaders() });
                                    alert("OTP resent.");
                                } catch { alert("Failed to resend OTP."); }
                            }}
                        >
                            Didn't receive it? Resend code →
                        </button>
                    </div>
                </div>
            )}

            {/* ── Edit modal ─────────────────────────────────────────────────── */}
            {editing && (
                <InstructorManagementedit
                    open={Boolean(editing)} item={editing} onClose={() => setEditing(null)}
                    onSaved={(updated) => {
                        const updatedId = updated?._id || updated?.id;
                        if (!updatedId) { setEditing(null); return; }
                        setInstructors(prev => prev.map(x => ((x._id || x.id) === updatedId) ? { ...x, ...updated } : x));
                        setEditing(null);
                        alert("Instructor updated successfully.");
                    }}
                />
            )}

            {/* ── Full-photo preview ─────────────────────────────────────────── */}
            {photoPreview.open && (
                <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closePhoto} role="dialog" aria-modal="true">
                    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={closePhoto} className="absolute -top-10 right-0 text-white/80 hover:text-white text-4xl leading-none" aria-label="Close">×</button>
                        <img src={photoPreview.src} alt={photoPreview.alt || "Instructor photo"} className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                INSTRUCTOR LIST CARD
            ══════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col flex-1">

                {/* List header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Your Instructors</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{filteredInstructors.length} instructor{filteredInstructors.length !== 1 ? "s" : ""} found</p>
                    </div>
                    <div className="relative w-full max-w-xs">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5 pointer-events-none" />
                        <input
                            className="w-full h-10 rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                            placeholder="Search by name, skill, email…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* List body */}
                <div className="flex-1">
                    {filteredInstructors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                <FontAwesomeIcon icon={faSearch} className="text-slate-300 text-2xl" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">No instructors yet</p>
                            <p className="text-xs text-slate-400 mt-1">Click <strong>Add Instructor</strong> to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {paginatedInstructors.map(i => (
                                <div
                                    key={i._id || i.id}
                                    className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm p-4 transition-all duration-150"
                                >
                                    {/* Avatar + info */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        {i?.photo?.url ? (
                                            <img
                                                src={i.photo.url}
                                                alt={`${i.firstName || ""} ${i.lastName || ""}`}
                                                className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-sm flex-shrink-0 cursor-zoom-in"
                                                loading="lazy" title="Click to enlarge" role="button" tabIndex={0}
                                                onClick={() => openPhoto(i.photo.url, `${i.firstName || ""} ${i.lastName || ""}`)}
                                                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") openPhoto(i.photo.url, `${i.firstName || ""} ${i.lastName || ""}`); }}
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                                                {avatarInitials(i)}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-slate-900 text-sm">{i.firstName} {i.lastName}</span>
                                                {i.teachingMode && (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${modeBadge(i.teachingMode)}`}>
                                                        {i.teachingMode}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5 truncate">
                                                {i.email}{i.phone ? ` • ${i.phone}` : ""}
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {(i.specializations || []).slice(0, 3).map(s => (
                                                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 font-medium">{s}</span>
                                                ))}
                                                {(i.skills || []).slice(0, 2).map(s => (
                                                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => { setIsAddOpen(false); setViewing(i); }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition"
                                        >
                                            View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setIsAddOpen(false); setViewing(null); setEditing(i); }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setIsAddOpen(false); setViewing({ ...i, __askDelete: true, __confirmOnly: true }); }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {filteredInstructors.length > 0 && (
                    <div className="flex justify-center items-center gap-1.5 mt-7 flex-wrap">
                        <button
                            onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
                            className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                            <button
                                key={n} onClick={() => setPage(n)}
                                className={`w-9 h-9 text-sm rounded-xl font-semibold transition ${n === page ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            >
                                {n}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={!hasMore}
                            className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstructureManagement;
