import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faBuilding,
  faLocationDot,
  faBriefcase,
  faMagnifyingGlass,
  faCircleCheck,
  faCircleXmark,
  faCircle,
  faMoneyBillWave,
  faHandHoldingDollar,
  faGraduationCap,
  faBullseye,
  faGlobe,
  faMapPin,
  faShuffle,
  faLaptopHouse,
  faClock,
  faCoins,
  faCalendarDay,
  faCalendarCheck,
  faCalendarPlus,
  faCalendarDays,
  faIndustry,
  faFileLines,
  faListCheck,
  faCheck,
  faGift,
  faStar,
  faReceipt,
  faCircleDot,
  faAddressCard,
  faUser,
  faEnvelope,
  faPhone,
  faPenToSquare,
  faArrowLeft,
  faFloppyDisk,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faArrowUpAZ,
  faArrowDownZA,
  faLayerGroup,
  faCircleInfo,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";

Modal.setAppElement("#root");

// ─── Sector display labels ────────────────────────────────────────────────────
const SECTOR_LABELS = {
  "advanced-ai": "Advanced AI & Autonomous Systems",
  "quantum-computing": "Quantum Computing & Next-Gen Computing",
  "climate-tech": "Climate Tech & Carbon Capture",
  "biotech": "Biotechnology & Synthetic Biology",
  "materials-science": "Advanced Materials Science",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

// ─── StatusPill ───────────────────────────────────────────────────────────────
const StatusPill = ({ adminReviewed, adminApproved, className = "" }) => {
  const cfg = adminReviewed
    ? { bg: "bg-yellow-100 text-yellow-800 border border-yellow-200", icon: faMagnifyingGlass, label: "In Review" }
    : adminApproved
      ? { bg: "bg-green-100 text-green-800 border border-green-200", icon: faCircleCheck, label: "Approved" }
      : { bg: "bg-red-100 text-red-700 border border-red-200", icon: faCircleXmark, label: "Not Approved" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${className}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <FontAwesomeIcon icon={cfg.icon} className="text-[10px]" />
      {cfg.label}
    </span>
  );
};

// ─── ModePill ─────────────────────────────────────────────────────────────────
const ModePill = ({ mode }) => {
  const cfg =
    mode === "ONLINE"
      ? { cls: "bg-teal-50 text-teal-700 border border-teal-200", icon: faGlobe, label: "Online" }
      : mode === "OFFLINE"
        ? { cls: "bg-orange-50 text-orange-700 border border-orange-200", icon: faMapPin, label: "Offline" }
        : { cls: "bg-purple-50 text-purple-700 border border-purple-200", icon: faShuffle, label: "Hybrid" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <FontAwesomeIcon icon={cfg.icon} className="text-[10px]" />
      {cfg.label}
    </span>
  );
};

// ─── TypePill ─────────────────────────────────────────────────────────────────
const TypePill = ({ type }) => {
  const cfg =
    type === "PAID"
      ? { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: faMoneyBillWave, label: "Paid" }
      : type === "STIPEND"
        ? { cls: "bg-blue-50 text-blue-700 border-blue-200", icon: faHandHoldingDollar, label: "Stipend" }
        : { cls: "bg-gray-50 text-gray-500 border-gray-200", icon: faGraduationCap, label: "Free" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <FontAwesomeIcon icon={cfg.icon} className="text-[10px]" />
      {cfg.label}
    </span>
  );
};

// ─── CompLabel ────────────────────────────────────────────────────────────────
const CompLabel = ({ i }) => {
  if (i.internshipType === "FREE") return <span className="text-gray-500">Unpaid / Free</span>;
  const c = i.compensationDetails;
  const text = c?.amount
    ? `${c.amount} ${c.currency} / ${(c.frequency || "").toLowerCase()}`
    : "Amount not specified";
  return (
    <span className={i.internshipType === "PAID" ? "text-green-700" : "text-blue-700"}>
      {text}
    </span>
  );
};

// ─── DetailRow ────────────────────────────────────────────────────────────────
const DetailRow = ({ icon, label, children }) => (
  <div>
    <p
      className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1 flex items-center gap-1.5"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {icon && <FontAwesomeIcon icon={icon} className="text-indigo-400 text-[11px]" />}
      {label}
    </p>
    <div className="text-sm text-gray-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {children || "—"}
    </div>
  </div>
);

// ─── SectionLabel (view modal sections) ──────────────────────────────────────
const SectionLabel = ({ icon, children }) => (
  <p
    className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2 flex items-center gap-1.5"
    style={{ fontFamily: "'Poppins', sans-serif" }}
  >
    {icon && <FontAwesomeIcon icon={icon} className="text-gray-300" />}
    {children}
  </p>
);

// ─── FormSectionLabel (edit modal sections) ───────────────────────────────────
const FormSectionLabel = ({ icon, children }) => (
  <p
    className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-1.5"
    style={{ fontFamily: "'Poppins', sans-serif" }}
  >
    {icon && <FontAwesomeIcon icon={icon} className="text-gray-300" />}
    {children}
  </p>
);

// ─── DateInput ────────────────────────────────────────────────────────────────
const DateInput = ({ label, value, onChange }) => {
  const displayVal = value ? String(value).slice(0, 10) : "";
  return (
    <div>
      <label
        className="block text-xs font-semibold text-gray-600 mb-1"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
          <FontAwesomeIcon icon={faCalendarDays} className="text-sm" />
        </span>
        <input
          type="date"
          value={displayVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                     bg-white text-gray-700 cursor-pointer"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW MODAL BODY
// ═══════════════════════════════════════════════════════════════════════════════
const ViewModalBody = ({ internship: i, onEdit, onClose }) => (
  <>
    {/* ── Gradient hero header ── */}
    <div className="flex-shrink-0 relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 pt-6 pb-14 rounded-t-2xl">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full
          bg-white/20 text-white hover:bg-white/40 transition font-bold"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>

      <div className="flex items-start gap-4 pr-10">
        {i.imgUrl ? (
          <img
            src={i.imgUrl}
            alt={i.companyName}
            width="56"
            height="56"
            loading="eager"
            fetchpriority="high"
            className="w-14 h-14 rounded-xl object-contain bg-white p-1 shadow"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow">
            <FontAwesomeIcon icon={faBuilding} className="text-2xl text-white/80" />
          </div>
        )}
        <div className="min-w-0">
          <h2
            className="text-xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {i.jobTitle}
          </h2>
          <p
            className="text-indigo-100 text-sm mt-0.5 font-medium flex items-center gap-1.5"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FontAwesomeIcon icon={faBriefcase} className="text-[10px] opacity-70" />
            {i.companyName}
          </p>
          <p
            className="text-indigo-200 text-xs mt-0.5 flex items-center gap-1"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
            {i.location || [i.city, i.state, i.country].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>

      {/* ── Floating badge strip ── */}
      <div className="absolute -bottom-5 left-6 right-6 flex flex-wrap items-center gap-2 z-10">
        <StatusPill adminReviewed={i.adminReviewed} adminApproved={i.adminApproved} />

        {/* Open / Closed */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${i.applicationOpen
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <FontAwesomeIcon
            icon={faCircle}
            className={`text-[6px] ${i.applicationOpen ? "text-teal-500" : "text-gray-400"}`}
          />
          {i.applicationOpen ? "Open" : "Closed"}
        </span>

        <TypePill type={i.internshipType} />

        {i.classification && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border bg-purple-50 text-purple-700 border-purple-200"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FontAwesomeIcon icon={faBullseye} className="text-[10px]" />
            {i.classification}
          </span>
        )}
      </div>
    </div>

    {/* ── Scrollable body ── */}
    <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-10 pb-4 space-y-5 bg-white">

      {/* Key facts grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
        <DetailRow icon={faLaptopHouse} label="Mode"><ModePill mode={i.internshipMode} /></DetailRow>
        <DetailRow icon={faClock} label="Duration">{i.duration}</DetailRow>
        <DetailRow icon={faCoins} label="Compensation"><CompLabel i={i} /></DetailRow>
        <DetailRow icon={faCalendarDay} label="Start Date">{fmtDate(i.startDate)}</DetailRow>
        <DetailRow icon={faCalendarCheck} label="End / Duration">{i.endDateOrDuration}</DetailRow>
        <DetailRow icon={faCalendarPlus} label="Posted">{fmtDate(i.createdAt)}</DetailRow>
        <div className="col-span-2 sm:col-span-3">
          <DetailRow icon={faIndustry} label="Sector">{SECTOR_LABELS[i.sector] || i.sector}</DetailRow>
        </div>
      </div>

      {/* Job Description */}
      <div>
        <SectionLabel icon={faFileLines}>Job Description</SectionLabel>
        <p
          className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {i.jobDescription || "No description provided."}
        </p>
      </div>

      {/* Qualifications */}
      {i.qualifications?.length > 0 && (
        <div>
          <SectionLabel icon={faListCheck}>Qualifications</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(i.qualifications) ? i.qualifications : [i.qualifications])
              .filter(Boolean)
              .map((q, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs rounded-full font-medium"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <FontAwesomeIcon icon={faCheck} className="text-[9px] text-indigo-400" />
                  {q}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      {i.compensationDetails?.benefits?.length > 0 && (
        <div>
          <SectionLabel icon={faGift}>Benefits</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {i.compensationDetails.benefits.map((b, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-100 text-green-700 text-xs rounded-full"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <FontAwesomeIcon icon={faStar} className="text-[9px] text-green-400" />
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Additional Costs */}
      {i.compensationDetails?.additionalCosts?.length > 0 && (
        <div>
          <SectionLabel icon={faReceipt}>Additional Costs</SectionLabel>
          <div className="space-y-1">
            {i.compensationDetails.additionalCosts.map((c, idx) => (
              <p
                key={idx}
                className="text-sm text-gray-600 flex items-center gap-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <FontAwesomeIcon icon={faCircleDot} className="text-[8px] text-gray-400" />
                {c.description}: {c.amount} {c.currency}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <SectionLabel icon={faAddressCard}>Contact</SectionLabel>
        <div className="space-y-2 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {i.contactInfo?.name && (
            <p className="flex items-center gap-2.5">
              <FontAwesomeIcon icon={faUser} className="w-4 text-center text-indigo-300 text-xs" />
              <span className="font-medium text-gray-800">{i.contactInfo.name}</span>
            </p>
          )}
          {i.contactInfo?.email && (
            <p className="flex items-center gap-2.5">
              <FontAwesomeIcon icon={faEnvelope} className="w-4 text-center text-indigo-300 text-xs" />
              <a href={`mailto:${i.contactInfo.email}`} className="text-indigo-600 hover:underline">
                {i.contactInfo.email}
              </a>
            </p>
          )}
          {i.contactInfo?.phone && (
            <p className="flex items-center gap-2.5">
              <FontAwesomeIcon icon={faPhone} className="w-4 text-center text-indigo-300 text-xs" />
              <a href={`tel:${i.contactInfo.phone}`} className="text-indigo-600 hover:underline">
                {i.contactInfo.phone}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>

    {/* ── Sticky footer ── */}
    <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-t bg-white rounded-b-2xl">
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition font-medium"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <FontAwesomeIcon icon={faXmark} className="text-xs" />
        Close
      </button>
      <button
        onClick={onEdit}
        className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <FontAwesomeIcon icon={faPenToSquare} />
        Edit Posting
      </button>
    </div>
  </>
);

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT MODAL BODY
// ═══════════════════════════════════════════════════════════════════════════════
const EditModalBody = ({ internship: si, updateField, onSave, onBack, onClose }) => (
  <>
    {/* Sticky header */}
    <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b rounded-t-2xl bg-white">
      <div>
        <h2
          className="text-base font-semibold text-gray-800 flex items-center gap-2"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <FontAwesomeIcon icon={faPenToSquare} className="text-indigo-400" />
          Edit Internship
        </h2>
        <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {si.jobTitle} · {si.companyName}
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
      >
        <FontAwesomeIcon icon={faXmark} className="text-sm" />
      </button>
    </div>

    {/* Scrollable form */}
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">

      <FormSectionLabel icon={faCircleInfo}>Basic Info</FormSectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Job Title", field: "jobTitle", type: "text" },
          { label: "Company Name", field: "companyName", type: "text" },
          { label: "Location", field: "location", type: "text" },
        ].map(({ label, field, type }) => (
          <div key={field}>
            <label
              className="block text-xs font-semibold text-gray-600 mb-1"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {label}
            </label>

            <input
              type={type}
              value={si[field] || ""}
              onChange={(e) => updateField(field, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
          </div>
        ))}

        {/* Sector */}
        <div>
          <label
            className="block text-xs font-semibold text-gray-600 mb-1"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Sector
          </label>

          <select
            value={si.sector || ""}
            onChange={(e) => updateField("sector", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {Object.entries(SECTOR_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FormSectionLabel icon={faCalendarDays}>Schedule</FormSectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DateInput
          label="Start Date"
          value={si.startDate ? String(si.startDate).slice(0, 10) : ""}
          onChange={(val) => updateField("startDate", val)}
        />
        <DateInput
          label="End Date"
          value={
            si.endDateOrDuration && /^\d{4}-\d{2}-\d{2}/.test(si.endDateOrDuration)
              ? String(si.endDateOrDuration).slice(0, 10)
              : ""
          }
          onChange={(val) => updateField("endDateOrDuration", val)}
        />
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Duration (label)</label>
          <input
            type="text"
            value={si.duration || ""}
            onChange={(e) => updateField("duration", e.target.value)}
            placeholder="e.g. 3 months"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          />
        </div>
      </div>

      <FormSectionLabel icon={faSliders}>Format & Classification</FormSectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Mode</label>
          <select
            value={si.internshipMode || ""}
            onChange={(e) => updateField("internshipMode", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Classification</label>
          <select
            value={si.classification || ""}
            onChange={(e) => updateField("classification", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <option value="">Select</option>
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Type (read-only)</label>
          <input
            type="text"
            readOnly
            value={si.internshipType === "PAID" ? "Paid" : si.internshipType === "STIPEND" ? "Stipend" : "Free"}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-0 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          />
        </div>
      </div>

      {si.internshipType !== "FREE" && (
        <>
          <FormSectionLabel icon={faCoins}>Compensation</FormSectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Amount</label>
              <input
                type="number"
                placeholder="0"
                value={si.compensationDetails?.amount || ""}
                onChange={(e) => updateField("compensationDetails.amount", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-0 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Currency</label>
              <select
                value={si.compensationDetails?.currency || "USD"}
                onChange={(e) => updateField("compensationDetails.currency", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {["USD", "CAD", "EUR", "INR", "GBP"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Frequency</label>
              <select
                value={si.compensationDetails?.frequency || "MONTHLY"}
                onChange={(e) => updateField("compensationDetails.frequency", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="ONE_TIME">One-time</option>
              </select>
            </div>
          </div>
        </>
      )}

      <FormSectionLabel icon={faFileLines}>Description</FormSectionLabel>
      <textarea
        rows={4}
        value={si.jobDescription || ""}
        onChange={(e) => updateField("jobDescription", e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      />

      <FormSectionLabel icon={faListCheck}>Qualifications</FormSectionLabel>
      <div>
        <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Comma-separated list</p>
        <textarea
          rows={2}
          value={Array.isArray(si.qualifications) ? si.qualifications.join(", ") : si.qualifications || ""}
          onChange={(e) => updateField("qualifications", e.target.value.split(",").map((q) => q.trim()).filter(Boolean))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        />
      </div>

      <FormSectionLabel icon={faAddressCard}>Contact</FormSectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Name", field: "contactInfo.name", type: "text" },
          { label: "Email", field: "contactInfo.email", type: "email" },
          { label: "Phone", field: "contactInfo.phone", type: "text" },
        ].map(({ label, field, type }) => (
          <div key={field}>
            <label className="block text-xs font-semibold text-gray-600 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {label}
            </label>
            <input
              type={type}
              value={si.contactInfo?.[field.split(".")[1]] || ""}
              onChange={(e) => updateField(field, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
          </div>
        ))}
      </div>

      <div className="h-2" />
    </div>

    {/* Sticky footer */}
    <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-t bg-white rounded-b-2xl">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition font-medium"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
        Back
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition font-medium"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <FontAwesomeIcon icon={faXmark} className="text-xs" />
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          Save Changes
        </button>
      </div>
    </div>
  </>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const YourJobPosts = () => {
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");

  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 12;

  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortCriteria, setSortCriteria] = useState("jobTitle");
  const [sortDirection, setSortDirection] = useState("asc");

  const [searchQuery, setSearchQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const debounceRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const partnerId = localStorage.getItem("partnerId");

  const fetchInternships = useCallback(
    async (page, query, sort, order, isFirst = false) => {
      if (!partnerId) return;
      isFirst ? setLoading(true) : setIsSearching(true);
      try {
        const response = await axios.get(`/api/interns/partner/${partnerId}`, {
          params: { page, limit: applicationsPerPage, search: query, sort, order },
        });
        setInternships(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.total || 0);
        setCommittedQuery(query);
      } catch (error) {
        console.error("Error fetching internships:", error);
        setInternships([]);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [partnerId]
  );

  useEffect(() => {
    fetchInternships(1, "", sortCriteria, sortDirection, true);
    isInitialLoadRef.current = false;
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isInitialLoadRef.current) return;
    fetchInternships(currentPage, committedQuery, sortCriteria, sortDirection);
  }, [currentPage]); // eslint-disable-line

  useEffect(() => {
    if (isInitialLoadRef.current) return;
    setCurrentPage(1);
    fetchInternships(1, committedQuery, sortCriteria, sortDirection);
  }, [sortCriteria, sortDirection]); // eslint-disable-line

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchInternships(1, q, sortCriteria, sortDirection);
    }, 350);
  };

  const clearSearch = () => {
    setSearchQuery("");
    clearTimeout(debounceRef.current);
    setCurrentPage(1);
    fetchInternships(1, "", sortCriteria, sortDirection);
  };

  const openViewModal = (internship) => {
    setSelectedInternship(internship);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => { setSelectedInternship(null); setModalMode("view"); }, 200);
  };

  const updateField = (field, value) => {
    setSelectedInternship((prev) => {
      const keys = field.split(".");
      let updated = { ...prev };
      let cur = updated;
      keys.forEach((key, idx) => {
        if (idx === keys.length - 1) {
          cur[key] = value;
        } else {
          cur[key] = { ...cur[key] };
          cur = cur[key];
        }
      });
      return updated;
    });
  };

  const handleUpdateJob = async () => {
    if (!selectedInternship) return;
    const payload = { ...selectedInternship, adminApproved: false };
    try {
      const response = await axios.put(`/api/interns/${payload._id}`, payload);
      setInternships((prev) => prev.map((i) => i._id === payload._id ? response.data : i));
      setModalMode("view");
    } catch (error) {
      console.error("Error updating internship:", error);
    }
  };

  return (
    <div className="p-6 rounded-lg shadow-md min-h-screen" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Search + Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
          </span>
          <input
            type="text"
            placeholder="Search by Organization, Role, or Company"
            value={searchQuery}
            onChange={handleSearchChange}
            className="p-2 pl-9 pr-8 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          />
          {isSearching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isSearching && searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={faXmark} className="text-sm" />
            </button>
          )}
        </div>
        <select
          value={sortCriteria}
          onChange={(e) => setSortCriteria(e.target.value)}
          className="p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-40 flex-shrink-0"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >

          <option value="jobTitle">Sort by Title</option>
          <option value="companyName">Sort by Company</option>
          <option value="createdAt">Sort by Date</option>
        </select>
        <button
          onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
          className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-100 font-medium w-24 justify-center flex-shrink-0"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <FontAwesomeIcon icon={sortDirection === "asc" ? faArrowUpAZ : faArrowDownZA} className="text-xs" />
          {sortDirection === "asc" ? "Asc" : "Desc"}
        </button>
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5 min-h-[20px]" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {!loading && totalCount > 0 && (
          <>
            <FontAwesomeIcon icon={faLayerGroup} className="text-gray-300" />
            {totalCount} result{totalCount !== 1 ? "s" : ""}
            {committedQuery && <> for "<em className="text-gray-600">{committedQuery}</em>"</>}
          </>
        )}
      </p>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col animate-pulse">
              <div className="mb-4 w-full h-32 bg-gray-100 rounded-lg" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="flex gap-2 mb-4">
                <div className="h-5 bg-gray-100 rounded-full w-16" />
                <div className="h-5 bg-gray-100 rounded-full w-12" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
              <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between">
                <div className="h-6 bg-gray-100 rounded-full w-20" />
                <div className="h-6 bg-gray-200 rounded-lg w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : internships.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FontAwesomeIcon icon={faBriefcase} className="text-4xl mb-3 opacity-30" />
          <p className="text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>No internships found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {internships.map((internship) => (
            <div
              key={internship._id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100
                   hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex flex-col"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {/* Logo / Image */}
              {internship.imgUrl ? (
                <div className="mb-4 w-full h-32 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                  <img
                    src={internship.imgUrl}
                    alt={internship.jobTitle}
                    className="max-h-28 max-w-full object-contain p-2"
                    width="200"
                    height="112"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="mb-4 w-full h-32 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                  <FontAwesomeIcon icon={faBuilding} className="text-4xl text-indigo-200" />
                </div>
              )}

              {/* Title + Company */}
              <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-0.5">
                {internship.jobTitle}
              </h3>
              <p className="text-xs font-medium text-indigo-500 mb-3 flex items-center gap-1">
                <FontAwesomeIcon icon={faBriefcase} className="text-[9px] text-indigo-300" />
                {internship.companyName}
                <span className="text-gray-300 mx-0.5">·</span>
                <FontAwesomeIcon icon={faLocationDot} className="text-[9px] text-gray-300" />
                <span className="text-gray-400 font-normal">{internship.location}</span>
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <ModePill mode={internship.internshipMode} />
                <TypePill type={internship.internshipType} />
                {internship.classification && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                    <FontAwesomeIcon icon={faBullseye} className="text-[9px]" />
                    {internship.classification}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-1.5 mb-4">
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faClock} className="text-gray-300 w-3.5 text-center" />
                  <span className="font-semibold text-gray-700">Duration:</span>{" "}{internship.duration || "—"}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCoins} className="text-gray-300 w-3.5 text-center" />
                  <span className="font-semibold text-gray-700">Compensation:</span>{" "}<CompLabel i={internship} />
                </p>
                {internship.sector && (
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faIndustry} className="text-gray-300 w-3.5 text-center" />
                    <span className="font-semibold text-gray-700">Sector:</span>{" "}
                    <span className="text-indigo-600">{SECTOR_LABELS[internship.sector] || internship.sector}</span>
                  </p>
                )}
              </div>

              {/* Card footer */}
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                <StatusPill adminReviewed={internship.adminReviewed} adminApproved={internship.adminApproved} />
                <button
                  onClick={() => openViewModal(internship)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold
                       rounded-lg hover:bg-indigo-700 active:scale-95 transition-all duration-150"
                >
                  View Details
                  <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-5 min-h-[40px]">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || isSearching || loading}  // ✅ also disable during loading
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 transition"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Previous
        </button>
        <span className="text-sm text-gray-600 font-medium min-w-[100px] text-center">
          {loading ? "" : `Page ${currentPage} of ${totalPages}`}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || isSearching || loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 transition"
        >
          Next
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
        </button>
      </div>

      {/* ─── Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel={modalMode === "view" ? "Internship Details" : "Edit Internship"}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[999]"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
          style={{ maxHeight: "90vh", fontFamily: "'Poppins', sans-serif" }}
        >
          {selectedInternship && (
            modalMode === "view" ? (
              <ViewModalBody
                internship={selectedInternship}
                onEdit={() => setModalMode("edit")}
                onClose={closeModal}
              />
            ) : (
              <EditModalBody
                internship={selectedInternship}
                updateField={updateField}
                onSave={handleUpdateJob}
                onBack={() => setModalMode("view")}
                onClose={closeModal}
              />
            )
          )}
        </div>
      </Modal>
    </div>
  );
};

export default YourJobPosts;