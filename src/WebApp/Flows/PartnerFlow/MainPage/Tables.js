import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import Modal from "./Modal";
import SendOfferLetter from "./OfferLetter";
import BulkSendOffer from "./BulkSendOffer";
import {
  checkOfferStatuses,
  getOfferStatusText,
  getOfferStatusColor,
} from "./offerUtils";
import {
  fetchPipelineByStage,
  generateL2Assessment,
  sendL2Assessment,
  createInterview,
  scheduleInterview,
  sendInterviewInvite,
  markInterviewCompleted,
  completeInterview,
} from "./pipelineUtils";

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton row — used as loading placeholder
// ─────────────────────────────────────────────────────────────────────────────
const SkeletonRow = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-5 py-4">
        <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-3/4 mx-auto" />
      </td>
    ))}
  </tr>
);

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
const EmptyState = ({ icon, message, sub }) => (
  <tr>
    <td colSpan={99}>
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
        <span className="text-4xl">{icon}</span>
        <p className="text-sm font-semibold text-gray-500">{message}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </td>
  </tr>
);

// ─────────────────────────────────────────────────────────────────────────────
// Count pill
// ─────────────────────────────────────────────────────────────────────────────
const CountPill = ({ count, color = "blue" }) => {
  const colors = {
    blue:   "bg-blue-100 text-blue-700",
    green:  "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-800",
    red:    "bg-red-100 text-red-700",
    gray:   "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${colors[color] || colors.gray}`}>
      {count}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Filter pill button
// ─────────────────────────────────────────────────────────────────────────────
const FilterPill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
      active
        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800"
    }`}
  >
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Table wrapper — sticky header, scrollable body
// ─────────────────────────────────────────────────────────────────────────────
const TableWrapper = ({ children }) => (
  <div className="rounded-xl border border-gray-200 overflow-hidden">
    <div className="overflow-auto max-h-[65vh]">
      <table className="min-w-full font-poppins text-sm bg-white">{children}</table>
    </div>
  </div>
);

const Th = ({ children, className = "" }) => (
  <th className={`px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 z-10 border-b border-gray-200 ${className}`}>
    {children}
  </th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-5 py-3.5 text-sm text-gray-700 align-middle ${className}`}>{children}</td>
);

// ─────────────────────────────────────────────────────────────────────────────
// L2 Status helpers
// ─────────────────────────────────────────────────────────────────────────────
const getL2StatusLabel = (status) => {
  switch ((status || "").toLowerCase()) {
    case "not_sent": case "not_used": case "": return "Pending";
    case "generated":  return "Generated";
    case "sent":       return "Sent";
    case "started":    return "In Progress";
    case "submitted":  return "Submitted";
    case "evaluated":  return "Evaluated";
    case "passed":     return "Passed";
    case "rejected":   return "Rejected";
    case "expired":    return "Expired";
    default:           return status;
  }
};

const getL2StatusColor = (status) => {
  switch ((status || "").toLowerCase()) {
    case "sent":       return "bg-blue-100 text-blue-700 border-blue-200";
    case "started":    return "bg-amber-100 text-amber-800 border-amber-200";
    case "submitted":  return "bg-purple-100 text-purple-800 border-purple-200";
    case "evaluated":  return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "passed":     return "bg-green-100 text-green-800 border-green-200";
    case "rejected": case "expired": return "bg-red-100 text-red-800 border-red-200";
    case "generated":  return "bg-teal-100 text-teal-700 border-teal-200";
    default:           return "bg-gray-100 text-gray-500 border-gray-200";
  }
};

const ASSIGNMENT_LOCKED_STATUSES = new Set([
  "sent", "started", "submitted", "evaluated", "passed", "rejected", "expired",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Application date/status helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatAppDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const APP_STATUS_CONFIG = {
  shortlisted: { label: "Shortlisted", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  approved:    { label: "Approved",    cls: "bg-green-100 text-green-800 border-green-200" },
  selected:    { label: "Approved",    cls: "bg-green-100 text-green-800 border-green-200" },
  accepted:    { label: "Accepted",    cls: "bg-green-100 text-green-800 border-green-200" },
  rejected:    { label: "Rejected",    cls: "bg-red-100 text-red-800 border-red-200" },
  declined:    { label: "Rejected",    cls: "bg-red-100 text-red-800 border-red-200" },
  pending:     { label: "Applied",     cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const getAppStatusConfig = (status) => {
  const key = (status || "").trim().toLowerCase();
  return APP_STATUS_CONFIG[key] || {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Applied",
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  };
};

const StatusPill = ({ label, cls }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
    {label}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// ApplicationsTable
// ─────────────────────────────────────────────────────────────────────────────
export const ApplicationsTable = ({ applications = [] }) => {
  const [filter, setFilter] = useState("all");

  const [appSearch, setAppSearch] = useState("");

  const counts = useMemo(() => {
    const c = { all: applications.length, shortlisted: 0, applied: 0, rejected: 0 };
    applications.forEach((a) => {
      const key = (a.status || "").trim().toLowerCase();
      if (key === "shortlisted") c.shortlisted++;
      else if (key === "rejected" || key === "declined") c.rejected++;
      else c.applied++;
    });
    return c;
  }, [applications]);

  const filtered = useMemo(() => {
    let base = applications;
    if (filter === "shortlisted") base = applications.filter((a) => (a.status || "").toLowerCase() === "shortlisted");
    else if (filter === "rejected") base = applications.filter((a) => ["rejected", "declined"].includes((a.status || "").toLowerCase()));
    else if (filter === "applied")  base = applications.filter((a) => !["shortlisted", "rejected", "declined"].includes((a.status || "").toLowerCase()));
    if (appSearch.trim()) {
      const q = appSearch.trim().toLowerCase();
      base = base.filter((a) =>
        (a.userName || "").toLowerCase().includes(q) ||
        (a.userEmail || "").toLowerCase().includes(q)
      );
    }
    return base;
  }, [applications, filter, appSearch]);

  return (
    <div className="p-5 space-y-4">
      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "shortlisted", label: "Shortlisted", color: "border-l-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
          { key: "applied",     label: "Applied",     color: "border-l-blue-400",  bg: "bg-blue-50",  text: "text-blue-700" },
          { key: "rejected",    label: "Rejected",    color: "border-l-red-400",   bg: "bg-red-50",   text: "text-red-700" },
        ].map(({ key, label, color, bg, text }) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? "all" : key)}
            className={`${bg} border border-transparent border-l-4 ${color} rounded-xl px-4 py-3 text-left transition hover:shadow-sm ${
              filter === key ? "ring-2 ring-offset-1 ring-gray-400" : ""
            }`}
          >
            <p className={`text-2xl font-bold ${text}`}>{counts[key]}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* ── Filter pills + total ── */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
          All <CountPill count={counts.all} color="gray" />
        </FilterPill>
        <FilterPill active={filter === "shortlisted"} onClick={() => setFilter("shortlisted")}>
          Shortlisted <CountPill count={counts.shortlisted} color="yellow" />
        </FilterPill>
        <FilterPill active={filter === "applied"} onClick={() => setFilter("applied")}>
          Applied <CountPill count={counts.applied} color="blue" />
        </FilterPill>
        <FilterPill active={filter === "rejected"} onClick={() => setFilter("rejected")}>
          Rejected <CountPill count={counts.rejected} color="red" />
        </FilterPill>
        <span className="ml-auto text-xs text-gray-400">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of{" "}
          <span className="font-semibold text-gray-700">{counts.all}</span>
        </span>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
        <input
          type="text"
          value={appSearch}
          onChange={(e) => setAppSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white placeholder-gray-400"
        />
        {appSearch && (
          <button onClick={() => setAppSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
        )}
      </div>

      {/* ── Table ── */}
      <TableWrapper>
        <thead>
          <tr>
            <Th>#</Th>
            <Th>Applicant</Th>
            <Th>Email</Th>
            <Th>Applied Date</Th>
            <Th>Resume</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <EmptyState icon="🔍" message={`No ${filter === "all" ? "" : filter + " "}applications`} sub="Try a different filter" />
          ) : (
            filtered.map((student, idx) => {
              const cfg = getAppStatusConfig(student.status);
              return (
                <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                  <Td className="text-gray-400 text-xs w-10">{idx + 1}</Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 text-xs font-bold">
                          {(student.userName || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">{student.userName || "N/A"}</span>
                    </div>
                  </Td>
                  <Td className="text-gray-500">{student.userEmail || "N/A"}</Td>
                  <Td className="text-gray-500 whitespace-nowrap">{formatAppDate(student.appliedDate)}</Td>
                  <Td>
                    {student.resumeUrl ? (
                      <a
                        href={student.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50 transition"
                      >
                        📄 View
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusPill label={cfg.label} cls={cfg.cls} />
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableWrapper>
    </div>
  );
};
ApplicationsTable.propTypes = { applications: PropTypes.array.isRequired };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getPartnerId = () => {
  try {
    const info = JSON.parse(localStorage.getItem("partnerInfo") || "null");
    if (info?._id) return info._id;
  } catch (_) {}
  return localStorage.getItem("partnerId") || null;
};

const TabBtn = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
      active
        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800"
    }`}
  >
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// ShortlistedTable
// ─────────────────────────────────────────────────────────────────────────────
export const ShortlistedTable = ({ candidates, internshipId }) => {
  const partnerId = useMemo(() => getPartnerId(), []);

  const [activeLevel, setActiveLevel] = useState("L1");

  // Offer
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [offerStatuses, setOfferStatuses] = useState({});
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Pipeline
  const [l2Items, setL2Items] = useState([]);
  const [l3Items, setL3Items] = useState([]);
  const [offerItems, setOfferItems] = useState([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [sendingMap, setSendingMap] = useState({});

  // L3 schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: "", durationMinutes: 30 });

  // L1 filter + search
  const [l1Filter, setL1Filter] = useState("all");
  const [l1Search, setL1Search] = useState("");
  const [l2Search, setL2Search] = useState("");
  const [l3Search, setL3Search] = useState("");
  const [offerSearch, setOfferSearch] = useState("");

  // L2 config
  const [l2Config, setL2Config] = useState({
    questionCount: 10,
    difficulty: 2,
    timeLimitMinutes: 20,
    passScore: 70,
    allowText: true,
    allowFileUpload: true,
  });

  // ── Dedup candidates ────────────────────────────────────────────────────────
  const uniqueCandidates = useMemo(() =>
    (candidates || []).filter((s, i, arr) =>
      i === arr.findIndex((x) => x.student_id === s.student_id)
    ), [candidates]);

  const candidateIds = useMemo(() =>
    uniqueCandidates.map((s) => s.student_id).filter(Boolean).sort().join(","),
    [uniqueCandidates]
  );

  // ── Load offer statuses ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!internshipId) return;
      const ids = candidateIds ? candidateIds.split(",") : [];
      if (!ids.length) return;
      setIsLoadingAll(true);
      try {
        const map = await checkOfferStatuses(ids, internshipId);
        setOfferStatuses((prev) => ({ ...prev, ...map }));
      } catch (e) {
        console.error("Offer status load failed:", e);
      } finally {
        setIsLoadingAll(false);
      }
    };
    load();
  }, [internshipId, candidateIds]);

  // ── Load pipeline data when tab changes ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!internshipId) return;
      setPipelineLoading(true);
      try {
        if (activeLevel === "L2") setL2Items(await fetchPipelineByStage(internshipId, "L2"));
        if (activeLevel === "L3") setL3Items(await fetchPipelineByStage(internshipId, "L3"));
        if (activeLevel === "OFFER") setOfferItems(await fetchPipelineByStage(internshipId, "OFFER"));
      } catch (e) {
        console.error("Pipeline load failed:", e);
      } finally {
        setPipelineLoading(false);
      }
    };
    load();
  }, [activeLevel, internshipId]);

  const l1Count    = uniqueCandidates.length;
  const l2Count    = l2Items.length;
  const l3Count    = l3Items.length;
  const offerCount = offerItems.length;

  const OFFER_SENT_STATUSES = new Set(["Sent", "Accepted", "Rejected"]);

  // ── L1 filter counts ────────────────────────────────────────────────────────
  const l1Counts = useMemo(() => {
    const c = { all: l1Count, shortlisted: 0, applied: 0, accepted: 0, rejected: 0 };
    uniqueCandidates.forEach((s) => {
      const st = offerStatuses[s.student_id] || "";
      if (st === "Accepted") c.accepted++;
      else if (st === "Rejected") c.rejected++;
      else if (st === "Sent") c.shortlisted++;
      else c.applied++;
    });
    return c;
  }, [uniqueCandidates, offerStatuses, l1Count]);

  const filteredL1 = useMemo(() => {
    let base = uniqueCandidates;
    if (l1Filter === "accepted")    base = uniqueCandidates.filter((s) => offerStatuses[s.student_id] === "Accepted");
    else if (l1Filter === "rejected")   base = uniqueCandidates.filter((s) => offerStatuses[s.student_id] === "Rejected");
    else if (l1Filter === "shortlisted") base = uniqueCandidates.filter((s) => offerStatuses[s.student_id] === "Sent");
    else if (l1Filter === "applied") base = uniqueCandidates.filter((s) => !OFFER_SENT_STATUSES.has(offerStatuses[s.student_id]));
    if (l1Search.trim()) {
      const q = l1Search.trim().toLowerCase();
      base = base.filter((s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
      );
    }
    return base;
  }, [uniqueCandidates, offerStatuses, l1Filter, l1Search]);

  // ── L1 bulk selection ───────────────────────────────────────────────────────
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(
        filteredL1
          .filter((s) => !OFFER_SENT_STATUSES.has(offerStatuses[s.student_id]))
          .map((s) => s.student_id)
      );
    } else {
      setSelectedStudents([]);
    }
  };

  const toggleStudentSelect = (id) => {
    if (OFFER_SENT_STATUSES.has(offerStatuses[id])) return;
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // ── Offer modal ─────────────────────────────────────────────────────────────
  const handleSendOfferClick = (student) => {
    if (OFFER_SENT_STATUSES.has(offerStatuses[student.student_id])) return;
    setSelectedStudent(student);
    setShowOfferModal(true);
  };

  const handleOfferSuccess = () => {
    if (selectedStudent?.student_id) {
      setOfferStatuses((prev) => ({ ...prev, [selectedStudent.student_id]: "Sent" }));
    }
    setShowOfferModal(false);
    setSelectedStudent(null);
  };

  const handleCloseOfferModal = () => { setShowOfferModal(false); setSelectedStudent(null); };

  const handleBulkOfferSuccess = (sentStudents) => {
    setShowBulkModal(false);
    setSelectedStudents([]);
    setOfferStatuses((prev) => {
      const updated = { ...prev };
      sentStudents.forEach((s) => { if (s?.student_id) updated[s.student_id] = "Sent"; });
      return updated;
    });
  };

  // ── L2: Send Assignment ─────────────────────────────────────────────────────
  const handleSendAssignment = async (item) => {
    const sid = item?.studentId?._id
      ? String(item.studentId._id)
      : item?.studentId ? String(item.studentId) : null;

    if (!sid || sendingMap[sid]) return;
    const l2Status = item?.l2?.status;
    if (ASSIGNMENT_LOCKED_STATUSES.has(l2Status)) return;

    setSendingMap((prev) => ({ ...prev, [sid]: true }));
    try {
      let assessmentId = item?.l2?.assessmentId ? String(item.l2.assessmentId) : null;
      if (!assessmentId) {
        const genRes = await generateL2Assessment({ internshipId, studentId: sid, partnerId, config: l2Config });
        assessmentId = genRes?.assessmentId ? String(genRes.assessmentId) : null;
        if (!assessmentId) throw new Error("Generate returned no assessmentId");
      }
      await sendL2Assessment({ assessmentId, partnerId });
      setL2Items(await fetchPipelineByStage(internshipId, "L2"));
    } catch (err) {
      console.error("❌ [L2] Send assignment failed:", err);
      alert(`Failed to send assignment:\n${err.message}`);
    } finally {
      setSendingMap((prev) => ({ ...prev, [sid]: false }));
    }
  };

  // ── L3: Schedule Interview ──────────────────────────────────────────────────
  const handleScheduleInterview = async (item) => {
    const sid = item?.studentId?._id || item?.studentId;
    let interviewId = item?.l3?.interviewId?._id || item?.l3?.interviewId;
    if (!interviewId) {
      const res = await createInterview({ internshipId, studentId: sid, partnerId });
      interviewId = res.interviewId;
    }
    await scheduleInterview({
      interviewId,
      scheduledAt: scheduleForm.scheduledAt,
      durationMinutes: scheduleForm.durationMinutes,
      studentEmail: item.studentId.email,
      studentName: item.studentId.name,
      internshipTitle: "Internship",
    });
    await sendInterviewInvite(interviewId);
    setL3Items(await fetchPipelineByStage(internshipId, "L3"));
  };

  // ── Offer pill ──────────────────────────────────────────────────────────────
  const renderOfferStatusPill = (sid) => {
    const status = offerStatuses[sid] || "Not Sent";
    return <StatusPill label={getOfferStatusText(status)} cls={getOfferStatusColor(status) + " border"} />;
  };

  const isLoading = isLoadingAll || pipelineLoading;

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 space-y-5">

      {/* ── Pipeline stage tabs ── */}
      <div className="flex flex-wrap gap-2">
        <TabBtn active={activeLevel === "L1"} onClick={() => setActiveLevel("L1")}>
          Shortlisted <CountPill count={l1Count} color="yellow" />
        </TabBtn>
        <TabBtn active={activeLevel === "L2"} onClick={() => setActiveLevel("L2")}>
          Assessment <CountPill count={l2Count} color="purple" />
        </TabBtn>
        <TabBtn active={activeLevel === "L3"} onClick={() => setActiveLevel("L3")}>
          Interview <CountPill count={l3Count} color="blue" />
        </TabBtn>
        <TabBtn active={activeLevel === "OFFER"} onClick={() => setActiveLevel("OFFER")}>
          Offer <CountPill count={offerCount} color="green" />
        </TabBtn>
      </div>

      {/* ── Loading bar ── */}
      {isLoading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Loading pipeline data…
        </div>
      )}

      {/* ════════════════════════════ LEVEL 1 ════════════════════════════ */}
      {activeLevel === "L1" && (
        <div className="space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "shortlisted", label: "Offer Sent",  color: "border-l-amber-400",  bg: "bg-amber-50",  text: "text-amber-700" },
              { key: "applied",     label: "Pending",     color: "border-l-blue-400",   bg: "bg-blue-50",   text: "text-blue-700" },
              { key: "accepted",    label: "Accepted",    color: "border-l-green-400",  bg: "bg-green-50",  text: "text-green-700" },
              { key: "rejected",    label: "Rejected",    color: "border-l-red-400",    bg: "bg-red-50",    text: "text-red-700" },
            ].map(({ key, label, color, bg, text }) => (
              <div key={key} className={`${bg} border-l-4 ${color} rounded-xl px-4 py-3`}>
                <p className={`text-2xl font-bold ${text}`}>{l1Counts[key]}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all",         label: "All",         count: l1Counts.all,         color: "gray" },
              { key: "shortlisted", label: "Offer Sent",  count: l1Counts.shortlisted, color: "yellow" },
              { key: "applied",     label: "Pending",     count: l1Counts.applied,     color: "blue" },
              { key: "accepted",    label: "Accepted",    count: l1Counts.accepted,    color: "green" },
              { key: "rejected",    label: "Rejected",    count: l1Counts.rejected,    color: "red" },
            ].map(({ key, label, count, color }) => (
              <FilterPill key={key} active={l1Filter === key} onClick={() => setL1Filter(key)}>
                {label} <CountPill count={count} color={color} />
              </FilterPill>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {selectedStudents.length > 0 && (
                  <span className="mr-2 font-semibold text-gray-700">{selectedStudents.length} selected</span>
                )}
              </span>
              <button
                disabled={selectedStudents.length === 0}
                onClick={() => setShowBulkModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ✉ Bulk Offer ({selectedStudents.length})
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={l1Search}
              onChange={(e) => setL1Search(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white placeholder-gray-400"
            />
            {l1Search && (
              <button onClick={() => setL1Search("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>

          {/* Table */}
          <TableWrapper>
            <thead>
              <tr>
                <Th className="w-10">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={
                      selectedStudents.length > 0 &&
                      selectedStudents.length ===
                        filteredL1.filter((s) => !OFFER_SENT_STATUSES.has(offerStatuses[s.student_id])).length
                    }
                    onChange={handleSelectAll}
                  />
                </Th>
                <Th>#</Th>
                <Th>Candidate</Th>
                <Th>Email</Th>
                <Th>ATS Score</Th>
                <Th>Resume</Th>
                <Th>Offer Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
              ) : filteredL1.length === 0 ? (
                <EmptyState icon="👤" message="No candidates found" sub="Try a different filter" />
              ) : (
                filteredL1.map((student, idx) => {
                  const status = offerStatuses[student.student_id] || "Not Sent";
                  const offerSent = OFFER_SENT_STATUSES.has(status);
                  return (
                    <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                      <Td>
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedStudents.includes(student.student_id)}
                          disabled={offerSent}
                          onChange={() => toggleStudentSelect(student.student_id)}
                        />
                      </Td>
                      <Td className="text-gray-400 text-xs">{idx + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 text-xs font-bold">
                              {(student.name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800">{student.name || "N/A"}</span>
                        </div>
                      </Td>
                      <Td className="text-gray-500">{student.email || "N/A"}</Td>
                      <Td>
                        {student.ats_score_pct != null ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            student.ats_score_pct >= 70
                              ? "bg-green-100 text-green-700 border-green-200"
                              : student.ats_score_pct >= 50
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          }`}>
                            {student.ats_score_pct}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </Td>
                      <Td>
                        {student.resumeUrl ? (
                          <a
                            href={student.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50 transition"
                          >
                            📄 View
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </Td>
                      <Td>{renderOfferStatusPill(student.student_id)}</Td>
                      <Td>
                        {!offerSent ? (
                          <button
                            onClick={() => handleSendOfferClick(student)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition active:scale-95"
                          >
                            Send Offer
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">{getOfferStatusText(status)}</span>
                        )}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </TableWrapper>
        </div>
      )}

      {/* ════════════════════════════ LEVEL 2 ════════════════════════════ */}
      {activeLevel === "L2" && (
        <div className="space-y-4">

          {/* Config panel */}
          <details className="group">
            <summary className="cursor-pointer px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex items-center gap-2 list-none">
              <span className="group-open:rotate-90 transition-transform text-gray-400 inline-block">▶</span>
              Assessment Configuration
            </summary>
            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "MCQ Count",       key: "questionCount",    type: "number", min: 1 },
                  { label: "Difficulty (1-3)", key: "difficulty",       type: "number", min: 1, max: 3 },
                  { label: "Time (mins)",      key: "timeLimitMinutes", type: "number", min: 1 },
                  { label: "Pass Score (%)",   key: "passScore",        type: "number", min: 1, max: 100 },
                ].map(({ label, key, ...rest }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input
                      {...rest}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={l2Config[key]}
                      onChange={(e) => setL2Config((p) => ({ ...p, [key]: Number(e.target.value) }))}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-3">
                {[
                  { label: "Text Answer",  key: "allowText" },
                  { label: "File Upload",  key: "allowFileUpload" },
                ].map(({ label, key }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={l2Config[key]}
                      onChange={(e) => setL2Config((p) => ({ ...p, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </details>

          {/* Count + Search */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Assessment stage: <span className="font-bold text-gray-800">{l2Count}</span>
            </span>
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
              <input
                type="text"
                value={l2Search}
                onChange={(e) => setL2Search(e.target.value)}
                placeholder="Search name or email…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white placeholder-gray-400"
              />
              {l2Search && (
                <button onClick={() => setL2Search("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
              )}
            </div>
          </div>

          <TableWrapper>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Candidate</Th>
                <Th>Email</Th>
                <Th>Assessment Status</Th>
                <Th>Offer Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : l2Items.filter((item) => {
                  if (!l2Search.trim()) return true;
                  const q = l2Search.trim().toLowerCase();
                  return (item?.studentId?.name || "").toLowerCase().includes(q) ||
                         (item?.studentId?.email || "").toLowerCase().includes(q);
                }).length === 0 ? (
                <EmptyState icon="📋" message="No matching candidates" sub="Try a different search" />
              ) : (
                l2Items.filter((item) => {
                  if (!l2Search.trim()) return true;
                  const q = l2Search.trim().toLowerCase();
                  return (item?.studentId?.name || "").toLowerCase().includes(q) ||
                         (item?.studentId?.email || "").toLowerCase().includes(q);
                }).map((item, idx) => {
                  const sid = item?.studentId?._id
                    ? String(item.studentId._id)
                    : String(item?.studentId);
                  const name = item?.studentId?.name || "—";
                  const email = item?.studentId?.email || "—";
                  const l2Status = item?.l2?.status || "";
                  const offerStatus = offerStatuses[sid] || "Not Sent";
                  const offerCandidate = { student_id: sid, name, email, resumeUrl: item?.resumeUrl };
                  const isSending = !!sendingMap[sid];
                  const isLocked = ASSIGNMENT_LOCKED_STATUSES.has(l2Status);

                  return (
                    <tr key={sid} className="hover:bg-gray-50 transition-colors">
                      <Td className="text-gray-400 text-xs">{idx + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 text-xs font-bold">
                              {name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800">{name}</span>
                        </div>
                      </Td>
                      <Td className="text-gray-500">{email}</Td>
                      <Td>
                        <StatusPill label={getL2StatusLabel(l2Status)} cls={getL2StatusColor(l2Status)} />
                      </Td>
                      <Td>{renderOfferStatusPill(sid)}</Td>
                      <Td>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg border border-green-200">
                              ✓ Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendAssignment(item)}
                              disabled={isSending}
                              className={`px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition active:scale-95 ${
                                isSending ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
                              }`}
                            >
                              {isSending ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Sending…
                                </span>
                              ) : l2Status === "generated" ? "Send to Student" : "Send Assessment"}
                            </button>
                          )}
                          {offerStatus === "Not Sent" ? (
                            <button
                              onClick={() => handleSendOfferClick(offerCandidate)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition active:scale-95"
                            >
                              Send Offer
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">{getOfferStatusText(offerStatus)}</span>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </TableWrapper>
        </div>
      )}

      {/* ════════════════════════════ LEVEL 3 ════════════════════════════ */}
      {activeLevel === "L3" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <span>📅</span>
            Interviews are scheduled via <b>Google Meet</b> — invites are sent automatically.
            <span className="ml-auto font-semibold">{l3Count} candidate{l3Count !== 1 ? "s" : ""}</span>
          </div>

          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={l3Search}
              onChange={(e) => setL3Search(e.target.value)}
              placeholder="Search name or email…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white placeholder-gray-400"
            />
            {l3Search && (
              <button onClick={() => setL3Search("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>

          <TableWrapper>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Candidate</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Scheduled At</Th>
                <Th>Meeting</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : l3Items.filter((item) => {
                  if (!l3Search.trim()) return true;
                  const q = l3Search.trim().toLowerCase();
                  return (item?.studentId?.name || "").toLowerCase().includes(q) ||
                         (item?.studentId?.email || "").toLowerCase().includes(q);
                }).length === 0 ? (
                <EmptyState icon="🎤" message="No matching candidates" sub="Try a different search" />
              ) : (
                l3Items.filter((item) => {
                  if (!l3Search.trim()) return true;
                  const q = l3Search.trim().toLowerCase();
                  return (item?.studentId?.name || "").toLowerCase().includes(q) ||
                         (item?.studentId?.email || "").toLowerCase().includes(q);
                }).map((item, idx) => {
                  const l3 = item?.l3 || {};
                  const interview = l3?.interviewId || {};
                  const isScheduled = !!interview?.scheduledAt;
                  const isCompleted = !!interview?.completedAt;
                  const isDecided = ["passed", "rejected"].includes(l3.status);

                  const statusCls =
                    l3.status === "scheduled"  ? "bg-blue-100 text-blue-800 border-blue-200" :
                    l3.status === "completed"  ? "bg-purple-100 text-purple-800 border-purple-200" :
                    l3.status === "rejected"   ? "bg-red-100 text-red-800 border-red-200" :
                    "bg-gray-100 text-gray-700 border-gray-200";

                  return (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <Td className="text-gray-400 text-xs">{idx + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-xs font-bold">
                              {(item.studentId?.name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800">{item.studentId?.name}</span>
                        </div>
                      </Td>
                      <Td className="text-gray-500">{item.studentId?.email}</Td>
                      <Td>
                        <StatusPill label={l3.status || "Pending"} cls={statusCls} />
                      </Td>
                      <Td className="whitespace-nowrap text-gray-500 text-xs">
                        {interview?.scheduledAt
                          ? new Date(interview.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                          : "—"}
                      </Td>
                      <Td>
                        {interview?.link ? (
                          <a href={interview.link} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50 transition">
                            🎥 Join
                          </a>
                        ) : "—"}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isCompleted && (
                            <button
                              onClick={() => { setScheduleTarget(item); setShowScheduleModal(true); }}
                              className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition active:scale-95"
                            >
                              {isScheduled ? "Reschedule" : "Schedule"}
                            </button>
                          )}
                          {isScheduled && !isCompleted && (
                            <button
                              onClick={async () => {
                                await markInterviewCompleted(interview._id);
                                setL3Items(await fetchPipelineByStage(internshipId, "L3"));
                              }}
                              className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition active:scale-95"
                            >
                              Mark Done
                            </button>
                          )}
                          {isCompleted && !isDecided && (
                            <>
                              <button
                                onClick={async () => {
                                  await completeInterview({ interviewId: interview._id, result: "passed" });
                                  setL3Items(await fetchPipelineByStage(internshipId, "L3"));
                                }}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition active:scale-95"
                              >
                                Pass ✓
                              </button>
                              <button
                                onClick={async () => {
                                  await completeInterview({ interviewId: interview._id, result: "rejected" });
                                  setL3Items(await fetchPipelineByStage(internshipId, "L3"));
                                }}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition active:scale-95"
                              >
                                Reject ✗
                              </button>
                            </>
                          )}
                          {l3.status === "rejected" && (
                            <StatusPill label="Rejected" cls="bg-red-100 text-red-800 border-red-200" />
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </TableWrapper>
        </div>
      )}

      {/* ════════════════════════════ OFFER ════════════════════════════ */}
      {activeLevel === "OFFER" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
            <span>🎉</span>
            Candidates who cleared all stages and are eligible for an offer letter.
            <span className="ml-auto font-semibold">{offerCount} candidate{offerCount !== 1 ? "s" : ""}</span>
          </div>

          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={offerSearch}
              onChange={(e) => setOfferSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-white placeholder-gray-400"
            />
            {offerSearch && (
              <button onClick={() => setOfferSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>

          <TableWrapper>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Candidate</Th>
                <Th>Email</Th>
                <Th>Interview Result</Th>
                <Th>Offer Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : offerItems.filter((item) => {
                  if (!offerSearch.trim()) return true;
                  const q = offerSearch.trim().toLowerCase();
                  return (item?.studentId?.name || "").toLowerCase().includes(q) ||
                         (item?.studentId?.email || "").toLowerCase().includes(q);
                }).length === 0 ? (
                <EmptyState icon="📬" message="No matching candidates" sub="Try a different search" />
              ) : (
                offerItems.filter((item) => {
                  if (!offerSearch.trim()) return true;
                  const q = offerSearch.trim().toLowerCase();
                  return (item?.studentId?.name || "").toLowerCase().includes(q) ||
                         (item?.studentId?.email || "").toLowerCase().includes(q);
                }).map((item, idx) => {
                  const sid = String(item?.studentId?._id);
                  const offerStatus = offerStatuses[sid] || "Not Sent";
                  return (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <Td className="text-gray-400 text-xs">{idx + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 text-xs font-bold">
                              {(item.studentId?.name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800">{item.studentId?.name}</span>
                        </div>
                      </Td>
                      <Td className="text-gray-500">{item.studentId?.email}</Td>
                      <Td>
                        <StatusPill label="Passed" cls="bg-green-100 text-green-800 border-green-200" />
                      </Td>
                      <Td>{renderOfferStatusPill(sid)}</Td>
                      <Td>
                        {offerStatus === "Not Sent" ? (
                          <button
                            onClick={() => handleSendOfferClick({
                              student_id: sid,
                              name: item.studentId?.name,
                              email: item.studentId?.email,
                              resumeUrl: item?.resumeUrl,
                            })}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition active:scale-95"
                          >
                            Send Offer
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">{getOfferStatusText(offerStatus)}</span>
                        )}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </TableWrapper>
        </div>
      )}

      {/* ════════════════════════════ MODALS ════════════════════════════ */}
      {showOfferModal && selectedStudent && (
        <Modal isOpen onClose={handleCloseOfferModal} title="Send Offer Letter">
          <SendOfferLetter
            student={{
              _id: selectedStudent.student_id,
              name: selectedStudent.name,
              email: selectedStudent.email,
              resumeUrl: selectedStudent.resumeUrl,
            }}
            internshipId={internshipId}
            onSuccess={handleOfferSuccess}
            onCancel={handleCloseOfferModal}
          />
        </Modal>
      )}

      {showBulkModal && (
        <Modal
          isOpen
          onClose={() => setShowBulkModal(false)}
          title={`Send Offers to ${selectedStudents.length} Students`}
        >
          <BulkSendOffer
            selectedStudents={selectedStudents
              .map((id) => uniqueCandidates.find((s) => s.student_id === id))
              .filter(Boolean)}
            internshipId={internshipId}
            onCancel={() => setShowBulkModal(false)}
            onSuccess={handleBulkOfferSuccess}
          />
        </Modal>
      )}

      {showScheduleModal && scheduleTarget && (
        <Modal isOpen onClose={() => setShowScheduleModal(false)} title="Schedule Interview">
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date & Time</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={scheduleForm.scheduledAt}
                onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (minutes)</label>
              <input
                type="number"
                min={15}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={scheduleForm.durationMinutes}
                onChange={(e) => setScheduleForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))}
              />
            </div>
            <button
              onClick={() => handleScheduleInterview(scheduleTarget)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition active:scale-95"
            >
              Confirm & Send Invite
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

ShortlistedTable.propTypes = {
  candidates: PropTypes.array.isRequired,
  internshipId: PropTypes.string.isRequired,
};

export default ShortlistedTable;