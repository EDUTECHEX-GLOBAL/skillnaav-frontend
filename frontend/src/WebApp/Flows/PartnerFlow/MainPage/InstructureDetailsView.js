// InstructureDetailsView.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faEnvelope,
    faPhone,
    faStar,
    faShieldAlt,
    faClock,
    faDollarSign,
    faClipboardList,
    faExclamationTriangle,
    faTrash,
    faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";

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

const sectionTitleCls =
    "text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-indigo-200 after:to-transparent";

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
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 hover:border-indigo-100 transition-colors duration-150">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
            <div className="text-sm text-slate-800 mt-1 leading-relaxed">{value}</div>
        </div>
    );
};

const join = (arr) => (Array.isArray(arr) && arr.length ? arr.join(", ") : null);
const yesno = (b) => (b === true ? "Yes" : b === false ? "No" : null);

/* ─── Small badge for boolean fields ─── */
const StatusBadge = ({ value, trueLabel = "Yes", falseLabel = "No" }) => {
    if (value === true)
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                {trueLabel}
            </span>
        );
    if (value === false)
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                {falseLabel}
            </span>
        );
    return null;
};

/* ─── Link styled for the new theme ─── */
const StyledLink = ({ href, children, external = false }) => (
    <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="inline-flex items-center gap-1.5 text-indigo-600 font-medium hover:text-indigo-700 hover:underline underline-offset-2 transition-colors"
    >
        {children}
        {external && <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[9px] opacity-60" />}
    </a>
);

/* ─── Section wrapper ─── */
const Section = ({ title, icon, children }) => (
    <section>
        <div className={sectionTitleCls + " mb-4"}>
            {icon && <FontAwesomeIcon icon={icon} className="text-indigo-400 text-[10px]" />}
            {title}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>
    </section>
);

export default function InstructureDetailsView({
    open,
    item,
    onClose,
    autoDeletePrompt = false,
    onDeleted,
    confirmOnly = false,
}) {
    const [confirmStage, setConfirmStage] = useState(0);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (open && (autoDeletePrompt || confirmOnly)) setConfirmStage(1);
    }, [open, autoDeletePrompt, confirmOnly]);

    useEffect(() => {
        if (!open) {
            setConfirmStage(0);
            setDeleting(false);
            return;
        }
        if (open && !autoDeletePrompt && !confirmOnly) {
            setConfirmStage(0);
        }
    }, [open, item, autoDeletePrompt, confirmOnly]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                if (confirmStage > 0) setConfirmStage(0);
                else onClose?.();
            }
            if (e.key === "Enter" && confirmStage === 2 && !deleting) doDelete();
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
        const token = getPartnerToken();
        if (!token) {
            alert("Session expired. Please login again.");
            return;
        }
        try {
            setDeleting(true);
            await axios.delete(`/api/instructors/${id}`, { headers: authHeaders() });
            setDeleting(false);
            setConfirmStage(0);
            onDeleted?.(id);
            onClose?.();
            if (!onDeleted) window.location.reload();
        } catch (err) {
            console.error("Delete failed:", err);
            setDeleting(false);
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
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${confirmOnly ? "" : "bg-black/40 backdrop-blur-sm"}`}
            role="dialog"
            aria-modal="true"
        >
            {!confirmOnly && (
                <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/60">

                    {/* ── Header ── */}
                    <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Instructor Details</h2>
                            {(item.firstName || item.lastName) && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {item.firstName} {item.lastName}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="p-7 overflow-y-auto flex-1 min-h-0 space-y-10">

                        {/* Personal & Contact */}
                        <Section title="Personal & Contact" icon={faEnvelope}>
                            <Field label="First Name" value={item.firstName} />
                            <Field label="Last Name" value={item.lastName} />
                            <Field
                                label="Email"
                                value={item.email ? <StyledLink href={`mailto:${item.email}`}>{item.email}</StyledLink> : null}
                            />
                            <Field
                                label="Mobile"
                                value={item.phone ? <StyledLink href={`tel:${item.phone}`}>{item.phone}</StyledLink> : null}
                            />
                            <Field
                                label="Alternate Phone"
                                value={item.altPhone ? <StyledLink href={`tel:${item.altPhone}`}>{item.altPhone}</StyledLink> : null}
                            />
                            <Field label="Country" value={item.country} />
                            <Field label="State / Province" value={item.state} />
                            <Field label="City" value={item.city} />
                            <Field label="Postal Code" value={item.postalCode} />
                            <Field label="Address Line 1" value={item.address1} />
                            <Field label="Address Line 2" value={item.address2} />
                        </Section>

                        {/* Professional & Teaching */}
                        <Section title="Professional & Teaching" icon={faStar}>
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
                        </Section>

                        {/* Availability */}
                        <Section title="Availability" icon={faClock}>
                            <Field label="Weekdays" value={join(item.availableDays)} />
                            <Field label="Start Time" value={item.availableStart} />
                            <Field label="End Time" value={item.availableEnd} />
                            <Field label="Timezone" value={item.timezone} />
                            <Field
                                label="Preferable Time Slots (24h)"
                                value={
                                    Array.isArray(item.preferableSlots) && item.preferableSlots.length ? (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {item.preferableSlots.map((slot, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold border border-indigo-100"
                                                >
                                                    {slot?.start && slot?.end
                                                        ? `${slot.start} – ${slot.end}`
                                                        : slot?.start || slot?.end || "—"}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null
                                }
                            />
                        </Section>

                        {/* Compensation / Payout */}
                        <Section title="Compensation / Payout" icon={faDollarSign}>
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
                        </Section>

                        {/* Compliance & Documents */}
                        <Section title="Compliance & Documents" icon={faShieldAlt}>
                            <Field
                                label="Background Check"
                                value={
                                    typeof item.backgroundCheck === "boolean" ? (
                                        <StatusBadge value={item.backgroundCheck} trueLabel="Cleared" falseLabel="Pending" />
                                    ) : item.backgroundCheck ? (
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.backgroundCheck === "Cleared"
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : item.backgroundCheck === "Pending"
                                                        ? "bg-amber-50 text-amber-600"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
                                        >
                                            {item.backgroundCheck}
                                        </span>
                                    ) : null
                                }
                            />
                            <Field
                                label="NDA Signed"
                                value={item.ndaSigned != null ? <StatusBadge value={item.ndaSigned} /> : null}
                            />
                            <Field
                                label="Agreed to Terms"
                                value={item.agreeToTerms != null ? <StatusBadge value={item.agreeToTerms} /> : null}
                            />
                            <Field
                                label="Resume"
                                value={
                                    toUrl(item.resume) ? (
                                        <StyledLink href={toUrl(item.resume)} external>
                                            Open Resume
                                        </StyledLink>
                                    ) : null
                                }
                            />
                            <Field
                                label="Profile Photo"
                                value={
                                    toUrl(item.photo) ? (
                                        <StyledLink href={toUrl(item.photo)} external>
                                            Open Photo
                                        </StyledLink>
                                    ) : null
                                }
                            />
                            <Field
                                label="Certificates"
                                value={
                                    Array.isArray(item.certificates) && item.certificates.length ? (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {item.certificates.map((c, idx) => {
                                                const url = toUrl(c);
                                                const name =
                                                    (typeof c === "object" && c?.originalName) || `Certificate ${idx + 1}`;
                                                return url ? (
                                                    <StyledLink key={idx} href={url} external>
                                                        {name}
                                                    </StyledLink>
                                                ) : (
                                                    <span key={idx} className="text-sm text-slate-600">{name}</span>
                                                );
                                            })}
                                        </div>
                                    ) : null
                                }
                            />
                        </Section>

                        {/* Assignment */}
                        <Section title="Assignment" icon={faClipboardList}>
                            <Field label="Assigned Internship" value={item.assignInternship} />
                            <Field label="Notes" value={item.notes} />
                        </Section>
                    </div>
                </div>
            )}

            {/* ═══  Delete Confirmation #1  ═══ */}
            {confirmStage === 1 && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-7 border border-slate-200/60">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-5">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-rose-500 text-lg" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Are you sure?</h3>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                            Are you sure that you want to delete this instructor? This will remove all their associated data.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => (confirmOnly ? onClose?.() : setConfirmStage(0))}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmStage(2)}
                                className="px-5 py-2.5 text-sm rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══  Delete Confirmation #2 (final)  ═══ */}
            {confirmStage === 2 && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-7 border border-rose-200/60">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-5">
                            <FontAwesomeIcon icon={faTrash} className="text-rose-600 text-lg" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Confirm one last time</h3>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                            This action <span className="font-semibold text-rose-600">cannot be undone</span>. Do you still want to permanently delete this instructor?
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => (confirmOnly ? onClose?.() : setConfirmStage(1))}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                                disabled={deleting}
                            >
                                Go Back
                            </button>
                            <button
                                type="button"
                                onClick={doDelete}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-lg shadow-rose-200 disabled:opacity-50 transition-all"
                                disabled={deleting}
                            >
                                <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                                {deleting ? "Deleting..." : "Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}