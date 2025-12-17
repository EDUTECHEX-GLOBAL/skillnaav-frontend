// InstructureDetailsView.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

// ✅ ADD: helper to read partner JWT from localStorage (same logic as InstructureManagement.jsx)
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

const sectionTitleCls = "text-sm font-semibold text-gray-900 uppercase";

const toUrl = (f) => {
    if (!f) return null;
    if (typeof f === "string") return f;
    if (typeof f === "object") return f.url || f.path || f.location || null;
    return null;
};

const Field = ({ label, value }) => {
    const empty =
        value == null ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "string" && value.trim() === "");
    if (empty) return null;
    return (
        <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 uppercase">{label}</div>
            <div className="text-sm text-gray-900 mt-0.5">{value}</div>
        </div>
    );
};

const join = (arr) => (Array.isArray(arr) && arr.length ? arr.join(", ") : null);
const yesno = (b) => (b === true ? "Yes" : b === false ? "No" : null);

export default function InstructureDetailsView({
    open,
    item,
    onClose,
    autoDeletePrompt = false,   // optional: open already asking to delete
    onDeleted,                  // optional: parent callback to remove the row
    confirmOnly = false,        // NEW: render only the delete confirmation (no details panel)
}) {
    const [confirmStage, setConfirmStage] = useState(0); // 0:none, 1:first ask, 2:final ask
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (open && (autoDeletePrompt || confirmOnly)) setConfirmStage(1);
    }, [open, autoDeletePrompt, confirmOnly]);

    // NEW: reset delete confirmation when closing or when opening in plain "view" mode
    useEffect(() => {
        // if the modal is closed, always clear any leftover confirm state
        if (!open) {
            setConfirmStage(0);
            setDeleting(false);
            return;
        }
        // if the modal is open but we're *not* in any delete mode, ensure confirm is cleared
        if (open && !autoDeletePrompt && !confirmOnly) {
            setConfirmStage(0);
        }
    }, [open, item, autoDeletePrompt, confirmOnly]);

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => {
            if (e.key === "Escape") {
                // If a confirm dialog is showing, close just that; otherwise close the details modal
                if (confirmStage > 0) {
                    setConfirmStage(0);
                } else {
                    onClose?.();
                }
            }
            if (e.key === "Enter" && confirmStage === 2 && !deleting) {
                // On the final confirm screen, Enter = delete
                doDelete();
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, confirmStage, deleting, onClose]);

    const doDelete = async () => {
        const id = item?._id || item?.id;
        if (!id) {
            alert("Missing instructor id.");
            return;
        }

        // ✅ ADD: token check before calling API
        const token = getPartnerToken();
        if (!token) {
            alert("Session expired. Please login again.");
            return;
        }

        try {
            setDeleting(true);

            // ✅ FIX: send Authorization header
            await axios.delete(`/api/instructors/${id}`, {
                headers: authHeaders(),
            });

            setDeleting(false);
            setConfirmStage(0);
            onDeleted?.(id);
            onClose?.();
            if (!onDeleted) window.location.reload(); // fallback so list reflects deletion
        } catch (err) {
            console.error("Delete failed:", err);
            setDeleting(false);

            // ✅ Better message for 401
            if (err?.response?.status === 401) {
                alert("Unauthorized. Please login again (token missing/expired).");
                return;
            }

            alert(err?.response?.data?.message || "Failed to delete instructor.");
        }
    };
    if (!open || !item) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${confirmOnly ? "" : "bg-black/50"}`}
            role="dialog"
            aria-modal="true"
        >
            {!confirmOnly && (
                <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">


                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white">
                        <h2 className="text-lg font-semibold">
                            Instructor Details
                        </h2>
                        <div className="flex flex-col items-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-red-500 hover:text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>


                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-8">
                        {/* Personal & Contact */}
                        <section>
                            <div className={sectionTitleCls + " mb-4"}>Personal & Contact</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Field label="First Name" value={item.firstName} />
                                <Field label="Last Name" value={item.lastName} />
                                <Field
                                    label="Email"
                                    value={
                                        item.email ? (
                                            <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">
                                                {item.email}
                                            </a>
                                        ) : null
                                    }
                                />
                                <Field
                                    label="Mobile"
                                    value={
                                        item.phone ? (
                                            <a href={`tel:${item.phone}`} className="text-blue-600 hover:underline">
                                                {item.phone}
                                            </a>
                                        ) : null
                                    }
                                />
                                <Field
                                    label="Alternate Phone"
                                    value={
                                        item.altPhone ? (
                                            <a href={`tel:${item.altPhone}`} className="text-blue-600 hover:underline">
                                                {item.altPhone}
                                            </a>
                                        ) : null
                                    }
                                />
                                <Field label="Country" value={item.country} />
                                <Field label="State / Province" value={item.state} />
                                <Field label="City" value={item.city} />
                                <Field label="Postal Code" value={item.postalCode} />
                                <Field label="Address Line 1" value={item.address1} />
                                <Field label="Address Line 2" value={item.address2} />
                            </div>
                        </section>

                        {/* Professional & Teaching */}
                        <section>
                            <div className={sectionTitleCls + " mb-4"}>Professional & Teaching</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Field label="Highest Qualification" value={item.qualification} />
                                <Field
                                    label="Years of Experience"
                                    value={item.experienceYears != null ? String(item.experienceYears) : null}
                                />
                                <Field label="Current/Recent Organization" value={item.organization} />
                                <Field label="Teaching Specializations" value={join(item.specializations)} />
                                <Field label="Skills / Technologies" value={join(item.skills)} />
                                <Field label="Languages" value={join(item.languages)} />
                                <Field label="Teaching Mode" value={item.teachingMode} />
                                <Field label="Short Bio / Summary" value={item.bio} />
                            </div>
                        </section>

                        {/* Availability */}
                        <section>
                            <div className={sectionTitleCls + " mb-4"}>Availability</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Field label="Weekdays" value={join(item.availableDays)} />
                                <Field label="Start Time" value={item.availableStart} />
                                <Field label="End Time" value={item.availableEnd} />
                                <Field label="Timezone" value={item.timezone} />

                                <Field
                                    label="Preferable Time Slots (24 Hours format)"
                                    value={
                                        Array.isArray(item.preferableSlots) && item.preferableSlots.length
                                            ? (
                                                <ul className="list-disc list-inside space-y-1">
                                                    {item.preferableSlots.map((slot, idx) => (
                                                        <li key={idx}>
                                                            {slot?.start && slot?.end
                                                                ? `${slot.start} - ${slot.end}`
                                                                : (slot?.start || slot?.end || null)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )
                                            : null
                                    }
                                />
                            </div>
                        </section>

                        {/* Compensation / Payout */}
                        <section>
                            <div className={sectionTitleCls + " mb-4"}>Compensation / Payout</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Field label="Rate Type" value={item.rateType} />
                                <Field
                                    label="Expected Rate"
                                    value={
                                        item.expectedRate != null
                                            ? `${item.currency ? item.currency + " " : ""}${item.expectedRate}`
                                            : null
                                    }
                                />
                                <Field label="Currency" value={item.currency} />
                                <Field label="Payout Method" value={item.payoutMethod} />
                                <Field label="Payout Identifier" value={item.payoutIdentifier} />
                            </div>
                        </section>

                        {/* Compliance & Documents */}
                        <section>
                            <div className={sectionTitleCls + " mb-4"}>Compliance & Documents</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Field
                                    label="Background Check"
                                    value={
                                        typeof item.backgroundCheck === "boolean"
                                            ? (item.backgroundCheck ? "Yes" : "No")
                                            : (item.backgroundCheck || null)
                                    }
                                />
                                <Field label="NDA Signed" value={yesno(item.ndaSigned)} />
                                <Field label="Agreed to Terms" value={yesno(item.agreeToTerms)} />
                                <Field
                                    label="Resume"
                                    value={
                                        toUrl(item.resume) ? (
                                            <a
                                                href={toUrl(item.resume)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Open Resume
                                            </a>
                                        ) : null
                                    }
                                />
                                <Field
                                    label="Profile Photo"
                                    value={
                                        toUrl(item.photo) ? (
                                            <a
                                                href={toUrl(item.photo)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Open Photo
                                            </a>
                                        ) : null
                                    }
                                />

                                <Field
                                    label="Certificates"
                                    value={
                                        Array.isArray(item.certificates) && item.certificates.length ? (
                                            <ul className="list-disc list-inside space-y-1">
                                                {item.certificates.map((c, idx) => {
                                                    const url = toUrl(c);
                                                    const name =
                                                        (typeof c === "object" && c?.originalName) || `Certificate ${idx + 1}`;
                                                    return (
                                                        <li key={idx}>
                                                            {url ? (
                                                                <a
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-blue-600 hover:underline"
                                                                >
                                                                    {name}
                                                                </a>
                                                            ) : (
                                                                name
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : null
                                    }
                                />

                            </div>
                        </section>

                        {/* Assignment */}
                        <section>
                            <div className={sectionTitleCls + " mb-4"}>Assignment</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Field label="Assigned Internship" value={item.assignInternship} />
                                <Field label="Notes" value={item.notes} />
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {/* Delete: confirmation #1 */}
            {confirmStage === 1 && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl p-6">
                        <h3 className="text-base font-semibold text-gray-900">Are you sure?</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure that you want to delete this user?
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmStage(2)}
                                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">
                                Yes
                            </button>

                            <button
                                type="button"
                                onClick={() => (confirmOnly ? onClose?.() : setConfirmStage(0))}
                                className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete: confirmation #2 (final) */}
            {confirmStage === 2 && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl p-6">
                        <h3 className="text-base font-semibold text-gray-900">Confirm one last time</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            This action cannot be undone. Do you still want to delete this user?
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={doDelete}
                                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Yes"}
                            </button>

                            {/* CHANGE THIS onClick */}
                            <button
                                type="button"
                                onClick={() => (confirmOnly ? onClose?.() : setConfirmStage(1))}
                                className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                disabled={deleting}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}   