// InstructureManagement.jsx
import axios from "axios";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faPlus, faUserCheck } from "@fortawesome/free-solid-svg-icons";
import InstructureDetailsView from "./InstructureDetailsView";

const inputCls =
    "w-full h-11 rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2.5";
const textareaCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[8rem]";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";
const sectionTitleCls = "text-sm font-semibold text-gray-900 uppercase";

const dayOpts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ADD: US/MX regions & timezones
const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
    "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

// ADD: Canada provinces & territories
const CA_PROVINCES = [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon"
];

// US / CA timezones
const TIMEZONES_US_MX = [
    // US
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "America/Honolulu",
    // CA
    "America/Toronto",
    "America/Vancouver",
    "America/Edmonton",
    "America/Winnipeg",
    "America/Halifax",
    "America/St_Johns",
    "America/Regina",
    "America/Whitehorse",
    "America/Yellowknife",
    "America/Iqaluit"
];

const InstructureManagement = () => {
    const [submitting, setSubmitting] = useState(false);
    // add right after: const [submitting, setSubmitting] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [instructors, setInstructors] = useState([]);   // local display list
    const [search, setSearch] = useState("");             // search box control

    // ADD: minimal UI state for US/MX behavior
    const [country, setCountry] = useState("United States");
    const [stateProv, setStateProv] = useState("");
    const [payoutMethod, setPayoutMethod] = useState("ACH (US Bank)");
    const [tz, setTz] = useState("America/Los_Angeles");
    const [viewing, setViewing] = useState(null);

    // ADD near the top inside the component
    const [otpOpen, setOtpOpen] = useState(false);
    const [otpEmail, setOtpEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [pendingFormData, setPendingFormData] = useState(null); // holds the prepared FormData

    // Keep payout method valid for the selected country
    useEffect(() => {
        if (country === "Canada") {
            if (!["EFT (CA Bank)", "Interac e-Transfer", "PayPal"].includes(payoutMethod)) {
                setPayoutMethod("EFT (CA Bank)");
            }
        } else if (country === "United States") {
            if (!["ACH (US Bank)", "Zelle", "PayPal"].includes(payoutMethod)) {
                setPayoutMethod("ACH (US Bank)");
            }
        }
    }, [country, payoutMethod]); // run only when country changes

    // Fetch instructors from backend when component mounts
    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                const { data } = await axios.get("/api/instructors", { params: { limit: 200 } });

                const raw = Array.isArray(data)
                    ? data
                    : (data?.items || data?.data || data?.results || data?.docs || data?.instructors || []);
                const items = Array.isArray(raw)
                    ? raw
                    : (raw?.items || raw?.results || raw?.docs || raw?.instructors || []);

                const normalized = items.map((d) => ({ id: d._id || d.id, ...d }));
                setInstructors(normalized);
            } catch (err) {
                console.error("Failed to fetch instructors:", err);
                setInstructors([]);
            }
        };

        fetchInstructors();
    }, []);

    // ADD: computed labels/placeholders
    const stateList =
        country === "Canada" ? CA_PROVINCES : US_STATES;

    const stateLabel =
        country === "Canada" ? "Province / Territory" : "State";

    const postalLabel =
        country === "Canada" ? "Postal Code" : "ZIP Code";

    const phonePlaceholder =
        country === "Canada" ? "+1 (416) 555-1234" : "+1 (555) 555-1234";

    const cityPlaceholder =
        country === "Canada" ? "e.g., Toronto" : "e.g., San Jose";

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

    // --- ADD: helper to do the actual create POST (same endpoint you already use) ---
    async function createInstructorWithFormData(fd) {
        const { data } = await axios.post("/api/instructors", fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const fd = new FormData(e.target);

            // basic time validation
            const start = fd.get("availableStart");
            const end = fd.get("availableEnd");
            if (start && end && end <= start) {
                alert("End Time must be after Start Time.");
                setSubmitting(false);
                return;
            }

            // multi-value fields
            const availableDays = fd.getAll("availableDays");     // ["Mon","Tue",...]
            const certificates = fd.getAll("certificates");       // [File, File, ...]

            // files
            const resume = fd.get("resume"); // required
            const photo = fd.get("photo");   // optional

            // booleans
            const ndaSigned = fd.get("ndaSigned") === "on";
            const agreeToTerms = fd.get("agreeToTerms") === "on";

            // build payload for API + local list
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
                experienceYears: fd.get("experienceYears")
                    ? Number(fd.get("experienceYears"))
                    : null,
                organization: fd.get("organization"),
                specializations: (fd.get("specializations") || "")
                    .split(",").map(s => s.trim()).filter(Boolean),
                skills: (fd.get("skills") || "")
                    .split(",").map(s => s.trim()).filter(Boolean),
                languages: (fd.get("languages") || "")
                    .split(",").map(s => s.trim()).filter(Boolean),
                teachingMode: fd.get("teachingMode"),
                bio: fd.get("bio"),

                availableDays,
                availableStart: fd.get("availableStart"),
                availableEnd: fd.get("availableEnd"),
                timezone: fd.get("timezone"),

                rateType: fd.get("rateType"),
                expectedRate: fd.get("expectedRate")
                    ? Number(fd.get("expectedRate"))
                    : null,
                currency: fd.get("currency"),
                payoutMethod: fd.get("payoutMethod"),
                payoutIdentifier: fd.get("payoutIdentifier"),

                backgroundCheck: fd.get("backgroundCheck"),
                ndaSigned,
                agreeToTerms,

                assignInternship: fd.get("assignInternship"),
                notes: fd.get("notes"),
            };

            // ready for real API with files (keep commented until your endpoint exists)
            const formData = new FormData();
            formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
            formData.append("resume", resume);
            if (photo instanceof File && photo.size) formData.append("photo", photo);
            certificates.forEach((file) => formData.append("certificates", file));

            // --- OTP START FLOW (replaces the direct POST above) ---
            try {
                const email = (payload.email || "").trim();
                if (!email) {
                    alert("Email is required for OTP verification.");
                    setSubmitting(false);
                    return;
                }

                // 1) Ask backend to send OTP
                await axios.post("/api/instructors/otp/start", { email });

                // 2) Freeze the exact payload being verified, then open OTP modal
                setPendingFormData(formData);
                setOtpEmail(email);
                setOtpOpen(true);

                // IMPORTANT: stop here; the actual create will happen from the OTP modal
                return;
            } catch (err) {
                console.error("Start OTP failed:", err);
                alert(err?.response?.data?.message || "Failed to start OTP.");
                // fall through to finally { setSubmitting(false) }
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

            // Point directly to your FastAPI service on :8003
            const PY_API = process.env.REACT_APP_PY_API || "http://127.0.0.1:8003";

            const { data } = await axios.post(
                `${PY_API}/assign-instructors`,
                { partnerId }
            );

            const made = data.assignments_made || 0;
            const lines = (data.assignments || [])
                .map((r) => `Internship ${r.internshipId} → ${r.sessionsUpdated} session(s)`)
                .join("\n");

            alert(`Assigned ${made} session${made === 1 ? "" : "s"}.\n${lines}`);
        } catch (err) {
            console.error("Assign Instructor failed:", err);
            alert("Assign Instructor failed. Check server logs.");
        }
    };

    // FIXED
    const filteredInstructors = instructors.filter((i) => {
        const hay = [
            i.firstName, i.lastName, i.email, i.phone,
            ...(i.specializations || []),
            ...(i.skills || []),
        ].join(" ").toLowerCase();
        return hay.includes(search.toLowerCase());
    });

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Instructor Management</h1>

                {/* Right-side buttons: Add Instructor + Assign Instructor */}
                <div className="flex items-center gap-3">
                    {/* UPDATED COLORS */}
                    <button
                        type="button"
                        onClick={() => { setViewing(null); setIsAddOpen(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow hover:from-indigo-700 hover:to-blue-700"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Add Instructor</span>
                    </button>

                    {/* UPDATED COLORS + ICON */}
                    <button
                        type="button"
                        onClick={handleAssignInstructor}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow hover:from-amber-600 hover:to-orange-700"
                    >
                        <FontAwesomeIcon icon={faUserCheck} />
                        <span>Assign Instructor</span>
                    </button>
                </div>
            </div>

            {!isAddOpen && (
                <InstructureDetailsView
                    open={Boolean(viewing)}
                    item={viewing}
                    onClose={() => setViewing(null)}
                    autoDeletePrompt={Boolean(viewing?.__askDelete)}
                    confirmOnly={Boolean(viewing?.__confirmOnly)}
                    onDeleted={(id) =>
                        setInstructors((prev) => prev.filter((x) => (x._id || x.id) !== id))
                    }
                />
            )}

            {/* Add Instructor Modal */}
            {isAddOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white">
                            <h2 className="text-lg font-semibold">Register New Instructor</h2>
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(false)}
                                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-red-500 hover:text-white"
                            >
                                Close
                            </button>
                        </div>

                        {/* Modal Body — your original form unchanged */}
                        <div className="p-6 overflow-y-auto flex-1 min-h-0">
                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* Personal & Contact */}
                                <div className="space-y-3">
                                    <div className={`${sectionTitleCls} mb-7`}>Personal & Contact</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>First Name *</label>
                                                </div>
                                                <input
                                                    name="firstName"
                                                    required
                                                    className={inputCls + " mt-4"} // add top margin so input doesn’t overlap label
                                                    placeholder="e.g., Priya" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Last Name *</label>
                                                </div>
                                                <input
                                                    name="lastName"
                                                    required
                                                    className={inputCls + " mt-4"}
                                                    placeholder="e.g., Sharma" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Email *</label>
                                                </div>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    required
                                                    className={inputCls + " mt-4"}
                                                    placeholder="name@example.com" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col mt-4">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Mobile *</label>
                                                </div>
                                                <input
                                                    name="phone"
                                                    required
                                                    className={inputCls + " mt-4"}
                                                    placeholder={phonePlaceholder} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Alternate Phone</label>
                                                </div>
                                                <input
                                                    name="altPhone"
                                                    className={inputCls + " mt-4"}
                                                    placeholder={phonePlaceholder} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Country *</label>
                                                </div>
                                                <select
                                                    name="country"
                                                    required
                                                    className={inputCls + " mt-4"}
                                                    value={country}
                                                    onChange={(e) => { setCountry(e.target.value); setStateProv(""); }}>
                                                    <option>United States</option>
                                                    <option>Canada</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col mt-4">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>{stateLabel}</label>
                                                </div>
                                                <select
                                                    name="state"
                                                    className={inputCls + " mt-4"}
                                                    value={stateProv}
                                                    onChange={(e) => setStateProv(e.target.value)}>
                                                    <option value="">Select</option>
                                                    {stateList.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>City</label>
                                                </div>
                                                <input name="city" className={inputCls + " mt-4"} placeholder={cityPlaceholder} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>{postalLabel}</label>
                                                </div>
                                                <input
                                                    name="postalCode"
                                                    className={inputCls + " mt-4"}
                                                    placeholder={country === "Canada" ? "M5V 3L9" : "95113"} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col mt-4">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Address Line 1</label>
                                                </div>
                                                <input name="address1" className={inputCls + " mt-4"} placeholder={address1Placeholder} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Address Line 2</label>
                                                </div>
                                                <input name="address2" className={inputCls + " mt-4"} placeholder="Optional" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional & Teaching */}
                                <div className="space-y-4">
                                    <div className={`${sectionTitleCls} mb-7`}>Professional & Teaching</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                                        {/* Highest Qualification */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Highest Qualification</label>
                                                </div>
                                                <select name="qualification" className={inputCls + " mt-4"} defaultValue="">
                                                    <option value="" disabled>Select</option>
                                                    <option>Diploma</option>
                                                    <option>Bachelor</option>
                                                    <option>Master</option>
                                                    <option>PhD</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Years of Experience */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Years of Experience</label>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    name="experienceYears"
                                                    className={inputCls + " mt-4"}
                                                    placeholder="e.g., 3"
                                                />
                                            </div>
                                        </div>

                                        {/* Current/Recent Organization */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Current/Recent Organization</label>
                                                </div>
                                                <input
                                                    name="organization"
                                                    className={inputCls + " mt-4"}
                                                    placeholder="Company/Institute"
                                                />
                                            </div>
                                        </div>


                                        {/* Teaching Specializations */}
                                        <div className="flex flex-col mt-6 md:col-span-3">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Teaching Specializations (comma-separated)</label>
                                                </div>
                                                <input
                                                    name="specializations"
                                                    className={inputCls + " mt-4"}
                                                    placeholder="e.g., React, Data Structures, Python"
                                                />
                                            </div>
                                        </div>

                                        {/* Skills / Technologies */}
                                        <div className="flex flex-col mt-6 md:col-span-3">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Skills / Technologies (comma-separated)</label>
                                                </div>
                                                <input
                                                    name="skills"
                                                    className={inputCls + " mt-4"}
                                                    placeholder="e.g., MongoDB, Node.js, AWS"
                                                />
                                            </div>
                                        </div>

                                        {/* Languages */}
                                        <div className="flex flex-col mt-6 md:col-span-2">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Languages (comma-separated)</label>
                                                </div>
                                                <input
                                                    name="languages"
                                                    className={inputCls + " mt-4"}
                                                    placeholder="e.g., English, Spanish"
                                                />
                                            </div>
                                        </div>

                                        {/* Teaching Mode */}
                                        <div className="flex flex-col mt-6">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Teaching Mode</label>
                                                </div>
                                                <select name="teachingMode" className={inputCls + " mt-4"} defaultValue="Online">
                                                    <option>Online</option>
                                                    <option>Offline</option>
                                                    <option>Hybrid</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Short Bio */}
                                        <div className="flex flex-col mt-6 md:col-span-3">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Short Bio / Summary</label>
                                                </div>
                                                <textarea
                                                    name="bio"
                                                    rows={3}
                                                    className={textareaCls + " mt-4"}
                                                    placeholder="Brief profile to show on your site"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Availability */}
                                <div className="space-y-3">
                                    <div className={`${sectionTitleCls} mb-7`}>Availability</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                                        {/* Weekdays */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Weekdays</label>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {dayOpts.map((d) => (
                                                        <label
                                                            key={d}
                                                            className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg"
                                                        >
                                                            <input type="checkbox" name="availableDays" value={d} />
                                                            <span className="text-sm">{d}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Start Time */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Start Time</label>
                                                </div>
                                                <input
                                                    type="time"
                                                    name="availableStart"
                                                    className={inputCls + " mt-4"}
                                                />
                                            </div>
                                        </div>

                                        {/* End Time */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>End Time</label>
                                                </div>
                                                <input
                                                    type="time"
                                                    name="availableEnd"
                                                    className={inputCls + " mt-4"}
                                                />
                                            </div>
                                        </div>

                                        {/* Timezone */}
                                        <div className="flex flex-col mt-6">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Timezone</label>
                                                </div>
                                                <select
                                                    name="timezone"
                                                    className={inputCls + " mt-4"}
                                                    value={tz}
                                                    onChange={(e) => setTz(e.target.value)}
                                                >
                                                    {TIMEZONES_US_MX.map((z) => (
                                                        <option key={z} value={z}>{z}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Compensation / Payout */}
                                <div className="space-y-3">
                                    <div className={`${sectionTitleCls} mb-7`}>Compensation / Payout</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                                        {/* Rate Type */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Rate Type</label>
                                                </div>
                                                <select name="rateType" className={inputCls + " mt-4"} defaultValue="Hourly">
                                                    <option>Hourly</option>
                                                    <option>Per Session</option>
                                                    <option>Fixed</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Expected Rate */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Expected Rate</label>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    name="expectedRate"
                                                    className={inputCls + " mt-4"}
                                                    placeholder="e.g., 1500"
                                                />
                                            </div>
                                        </div>

                                        {/* Currency */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Currency</label>
                                                </div>
                                                <select
                                                    name="currency"
                                                    className={inputCls + " mt-4"}
                                                    defaultValue={country === "Canada" ? "CAD" : "USD"}>
                                                    <option>USD</option>
                                                    <option>CAD</option>
                                                    <option>EUR</option>
                                                </select>

                                            </div>
                                        </div>

                                        {/* Preferred Payout Method */}
                                        <div className="flex flex-col mt-6">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Preferred Payout Method</label>
                                                </div>
                                                <select
                                                    name="payoutMethod"
                                                    className={inputCls + " mt-4"}
                                                    value={payoutMethod}
                                                    onChange={(e) => setPayoutMethod(e.target.value)}
                                                >
                                                    {country === "Canada" ? (
                                                        <>
                                                            <option>EFT (CA Bank)</option>
                                                            <option>Interac e-Transfer</option>
                                                            <option>PayPal</option>
                                                        </>
                                                    ) : country === "United States" ? (
                                                        <>
                                                            <option>ACH (US Bank)</option>
                                                            <option>Zelle</option>
                                                            <option>PayPal</option>
                                                        </>
                                                    ) : (
                                                        // India
                                                        <>
                                                            <option>NEFT/IMPS (IN Bank)</option>
                                                            <option>UPI (VPA)</option>
                                                            <option>Paytm Wallet</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Payout Identifier */}
                                        <div className="flex flex-col mt-6 md:col-span-2">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Payout Identifier</label>
                                                </div>
                                                <input
                                                    name="payoutIdentifier"
                                                    className={inputCls + " mt-4"}
                                                    placeholder={payIdPlaceholder}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Compliance & Documents */}
                                <div className="space-y-3">
                                    <div className={`${sectionTitleCls} mb-7`}>Compliance & Documents</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                                        {/* Resume */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Resume / CV *</label>
                                                </div>
                                                <input
                                                    type="file"
                                                    name="resume"
                                                    required
                                                    className={inputCls + " mt-4"}
                                                    accept=".pdf,.doc,.docx"
                                                />
                                            </div>
                                        </div>

                                        {/* Profile Photo */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Profile Photo</label>
                                                </div>
                                                <input
                                                    type="file"
                                                    name="photo"
                                                    className={inputCls + " mt-4"}
                                                    accept="image/*"
                                                />
                                            </div>
                                        </div>

                                        {/* Certificates */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Certificates</label>
                                                </div>
                                                <input
                                                    type="file"
                                                    name="certificates"
                                                    className={inputCls + " mt-4"}
                                                    accept=".pdf,.png,.jpg,.jpeg"
                                                    multiple
                                                />
                                            </div>
                                        </div>

                                        {/* Background Check */}
                                        <div className="flex flex-col mt-6">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Background Check</label>
                                                </div>
                                                <select
                                                    name="backgroundCheck"
                                                    className={inputCls + " mt-4"}
                                                    defaultValue="Pending"
                                                >
                                                    <option>Pending</option>
                                                    <option>Cleared</option>
                                                    <option>Not Required</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* NDA + Terms */}
                                        <div className="md:col-span-2 flex items-center gap-6 mt-6">
                                            <label className="inline-flex items-center gap-2">
                                                <input type="checkbox" name="ndaSigned" />
                                                <span className="text-sm text-gray-700">NDA signed</span>
                                            </label>
                                            <label className="inline-flex items-center gap-2">
                                                <input type="checkbox" name="agreeToTerms" required />
                                                <span className="text-sm text-gray-700">
                                                    I confirm all details are accurate *
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Assignment */}
                                <div className="space-y-3">
                                    <div className={`${sectionTitleCls} mb-7`}>Assignment</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                                        {/* Assign to Internship */}
                                        <div className="flex flex-col">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Assign to Internship (title or ID)</label>
                                                </div>
                                                <input
                                                    name="assignInternship"
                                                    className={inputCls + " mt-4"}
                                                    placeholder="e.g., MERN Bootcamp – 2025 Summer"
                                                />
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div className="flex flex-col mt-6 md:col-span-3">
                                            <div className="relative">
                                                <div className="absolute -top-2 left-0">
                                                    <label className={labelCls}>Notes</label>
                                                </div>
                                                <textarea
                                                    name="notes"
                                                    rows={3}
                                                    className={textareaCls + " mt-4"}
                                                    placeholder="Internal notes"
                                                />
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
                                        <FontAwesomeIcon icon={faPlus} />
                                        <span>{submitting ? "Saving..." : "Save Instructor"}</span>
                                    </button>
                                    <span className="text-xs text-gray-500">You can edit or assign later from the list below.</span>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {otpOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-semibold mb-2">Verify Email</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            We have sent a 6-digit code to your Mail ID: <span className="font-medium">{otpEmail}</span>.
                        </p>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
                        />

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setOtpOpen(false)}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        // 1) Verify OTP
                                        await axios.post("/api/instructors/otp/verify", {
                                            email: otpEmail,
                                            otp: otpCode,
                                        });

                                        // 2) Create with frozen FormData
                                        const data = await createInstructorWithFormData(pendingFormData);

                                        // 3) Update list & close the Add modal so the new instructor is visible immediately
                                        const normalized = { id: data._id || data.id, ...data };
                                        setInstructors((prev) => [normalized, ...prev]);
                                        setIsAddOpen(false);

                                        // 4) Reset OTP UI
                                        setOtpOpen(false);
                                        setOtpCode("");
                                        setPendingFormData(null);

                                        alert("Instructor created successfully.");
                                    } catch (err) {
                                        console.error("Verify OTP or Create failed:", err);
                                        alert(err?.response?.data?.message || "Invalid OTP or create failed.");
                                    }
                                }}
                                className="px-4 py-2 rounded-lg bg-teal-600 text-white"
                            >
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
                                    } catch (e) {
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

            <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Your Instructors</h2>
                    <div className="relative w-full max-w-xs">
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="absolute left-3 top-[65%] -translate-y-1/2 text-gray-400 h-4 w-4"
                        />
                        <input
                            className={`${inputCls} pl-10`}
                            placeholder="Search instructors..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {filteredInstructors.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No instructors yet. Click <strong>Add Instructor</strong> to create one.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {filteredInstructors.map((i) => (
                            <div key={i._id || i.id} className="border rounded-xl p-4 flex items-start justify-between gap-4">
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        {i.firstName} {i.lastName}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {i.email} • {i.phone}
                                    </div>
                                    {i.specializations?.length ? (
                                        <div className="text-xs text-gray-500 mt-1">
                                            <span className="font-medium">Specializations:</span> {i.specializations.join(", ")}
                                        </div>
                                    ) : null}
                                    {i.skills?.length ? (
                                        <div className="text-xs text-gray-500">
                                            <span className="font-medium">Skills:</span> {i.skills.join(", ")}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="text-right">
                                    <span
                                        onClick={() => { setIsAddOpen(false); setViewing(i); }}
                                        className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer">
                                        View details
                                    </span>

                                    {/* NEW: red delete link in the list row */}
                                    <button
                                        type="button"
                                        onClick={() => { setIsAddOpen(false); setViewing({ ...i, __askDelete: true, __confirmOnly: true }); }}
                                        className="mt-1 block text-sm font-semibold text-red-600 hover:underline">
                                        Delete Instructor
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstructureManagement;