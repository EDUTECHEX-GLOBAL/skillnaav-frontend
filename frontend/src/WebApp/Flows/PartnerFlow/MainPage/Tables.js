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
// L2 Status helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise raw DB status strings into a display label.
 * "not_sent" and "not_used" are legacy/stale values — show as "Pending".
 */
const getL2StatusLabel = (status) => {
  switch ((status || "").toLowerCase()) {
    case "not_sent":
    case "not_used":
    case "":
      return "Pending";
    case "generated":
      return "Generated";
    case "sent":
      return "Sent";
    case "started":
      return "In Progress";
    case "submitted":
      return "Submitted";
    case "evaluated":
      return "Evaluated";
    case "passed":
      return "Passed";
    case "rejected":
      return "Rejected";
    case "expired":
      return "Expired";
    default:
      return status;
  }
};

const getL2StatusColor = (status) => {
  switch ((status || "").toLowerCase()) {
    case "sent":
      return "bg-blue-100 text-blue-700";
    case "started":
      return "bg-yellow-100 text-yellow-800";
    case "submitted":
      return "bg-purple-100 text-purple-800";
    case "evaluated":
      return "bg-indigo-100 text-indigo-800";
    case "passed":
      return "bg-green-100 text-green-800";
    case "rejected":
    case "expired":
      return "bg-red-100 text-red-800";
    case "generated":
      return "bg-teal-100 text-teal-700";
    case "not_sent":
    case "not_used":
    default:
      return "bg-gray-100 text-gray-500";
  }
};

/**
 * Statuses where the assignment button should NOT appear.
 * "generated" is intentionally excluded — it means the assessment exists
 * but hasn't been sent yet, so the button should still be shown.
 * Must stay in sync with handleSendAssignment's LOCKED_STATUSES.
 */
const ASSIGNMENT_LOCKED_STATUSES = new Set([
  "sent",
  "started",
  "submitted",
  "evaluated",
  "passed",
  "rejected",
  "expired",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Application date/status helpers (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const formatAppDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const getApplicationStatusText = (status) => {
  const s = (status || "").trim().toLowerCase();
  if (s === "shortlisted") return "Shortlisted";
  if (s === "approved" || s === "selected") return "Approved";
  if (s === "rejected" || s === "declined") return "Rejected";
  if (s === "pending" || !s) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getApplicationStatusColor = (status) => {
  switch ((status || "").trim().toLowerCase()) {
    case "shortlisted":   return "bg-yellow-100 text-yellow-800";
    case "approved":
    case "selected":      return "bg-green-100 text-green-800";
    case "rejected":
    case "declined":      return "bg-red-100 text-red-800";
    default:              return "bg-gray-100 text-gray-800";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ApplicationsTable
// ─────────────────────────────────────────────────────────────────────────────
export const ApplicationsTable = ({ applications = [] }) => (
  <div className="h-[80vh] overflow-auto -mr-6 pr-6 bg-white">
    <table className="min-w-full font-poppins text-sm bg-white">
      <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-20">
        <tr>
          <th className="px-6 py-3 text-center">Name</th>
          <th className="px-6 py-3 text-center">Email</th>
          <th className="px-6 py-3 text-center">Applied Date</th>
          <th className="px-6 py-3 text-center">Resume</th>
          <th className="px-6 py-3 text-center">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 text-center">
        {applications.map((student) => (
          <tr key={student._id} className="hover:bg-gray-50 transition">
            <td className="px-6 py-4">{student.userName || "N/A"}</td>
            <td className="px-6 py-4">{student.userEmail || "N/A"}</td>
            <td className="px-6 py-4">{formatAppDate(student.appliedDate)}</td>
            <td className="px-6 py-4">
              {student.resumeUrl ? (
                <a href={student.resumeUrl} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline">View Resume</a>
              ) : <span className="text-gray-400">—</span>}
            </td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(student.status)}`}>
                {getApplicationStatusText(student.status)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
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
  <button onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
      active ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}>
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

  // ── Stable string dep to prevent re-render loop (Fix: Bug 4) ──────────────
  const candidateIds = useMemo(
    () =>
      uniqueCandidates
        .map((s) => s.student_id)
        .filter(Boolean)
        .sort()
        .join(","),
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

  // ── Counts ──────────────────────────────────────────────────────────────────
  const l1Count = uniqueCandidates.length;
  const l2Count = l2Items.length;
  const l3Count = l3Items.length;
  const offerCount = offerItems.length;

  // Fix Bug 3: All terminal statuses block re-sending, not just "Sent"
  const OFFER_SENT_STATUSES = new Set(["Sent", "Accepted", "Rejected"]);

  // ── L1 bulk selection ───────────────────────────────────────────────────────
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(
        uniqueCandidates
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
  // Fix Bug 2: Accept the offer response data from onSuccess callback
  const handleOfferSuccess = (offerData) => {
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

    // ✅ Statuses where we do NOT trigger the flow (in progress / done)
    // "not_sent", "not_used", "generated", undefined → trigger generate+send
    if (ASSIGNMENT_LOCKED_STATUSES.has(l2Status)) return;

    setSendingMap((prev) => ({ ...prev, [sid]: true }));
    try {
      let assessmentId = item?.l2?.assessmentId ? String(item.l2.assessmentId) : null;

      console.log("▶ [L2] sid:", sid, "status:", l2Status, "existing id:", assessmentId);

      if (!assessmentId) {
        let genRes;
        try {
          genRes = await generateL2Assessment({ internshipId, studentId: sid, partnerId, config: l2Config });
        } catch (genErr) {
          throw new Error(`Generate failed: ${genErr?.response?.data?.message || genErr.message}`);
        }
        assessmentId = genRes?.assessmentId ? String(genRes.assessmentId) : null;
        if (!assessmentId) throw new Error("Generate returned no assessmentId");
      }

      console.log("▶ [L2] sending id:", assessmentId);

      try {
        await sendL2Assessment({ assessmentId, partnerId });
      } catch (sendErr) {
        throw new Error(
          `Send failed (${sendErr?.response?.status}): ${sendErr?.response?.data?.message || sendErr.message}`
        );
      }

      // Refresh table
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
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOfferStatusColor(status)}`}>
        {getOfferStatusText(status)}
      </span>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Tabs ── */}
      <div className="flex gap-2">
        <TabBtn active={activeLevel === "L1"} onClick={() => setActiveLevel("L1")}>Level 1 ({l1Count})</TabBtn>
        <TabBtn active={activeLevel === "L2"} onClick={() => setActiveLevel("L2")}>Level 2 ({l2Count})</TabBtn>
        <TabBtn active={activeLevel === "L3"} onClick={() => setActiveLevel("L3")}>Level 3 ({l3Count})</TabBtn>
        <TabBtn active={activeLevel === "OFFER"} onClick={() => setActiveLevel("OFFER")}>Offer ({offerCount})</TabBtn>
      </div>

      {/* ── Global loading ── */}
      {(isLoadingAll || pipelineLoading) && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      )}

      {/* ══════════════════════════════ LEVEL 1 ══════════════════════════════ */}
      {activeLevel === "L1" && (
        <>
          <button
            className="mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={selectedStudents.length === 0}
            onClick={() => setShowBulkModal(true)}
          >
            Send Offer Letter to Selected ({selectedStudents.length})
          </button>
          <p className="text-sm text-gray-600 mb-2">
            Total Applications: <span className="font-semibold">{l1Count}</span>
          </p>
          <div className="h-[80vh] overflow-auto -mr-6 pr-6 bg-white">
            <table className="min-w-full font-poppins text-sm bg-white">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-3 text-center">
                    <input type="checkbox"
                      checked={selectedStudents.length > 0 &&
                        selectedStudents.length === uniqueCandidates.filter((s) => !OFFER_SENT_STATUSES.has(offerStatuses[s.student_id])).length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-center">Name</th>
                  <th className="px-6 py-3 text-center">Email</th>
                  <th className="px-6 py-3 text-center">Resume</th>
                  <th className="px-6 py-3 text-center">Offer Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {uniqueCandidates.map((student) => {
                  const status = offerStatuses[student.student_id] || "Not Sent";
                  const offerSent = OFFER_SENT_STATUSES.has(status);
                  return (
                    <tr key={student.student_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <input type="checkbox"
                          checked={selectedStudents.includes(student.student_id)}
                          disabled={offerSent}
                          onChange={() => toggleStudentSelect(student.student_id)}
                        />
                      </td>
                      <td className="px-6 py-4">{student.name || "N/A"}</td>
                      <td className="px-6 py-4">{student.email || "N/A"}</td>
                      <td className="px-6 py-4">
                        <a href={student.resumeUrl} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline">View Resume</a>
                      </td>
                      <td className="px-6 py-4">
                        {renderOfferStatusPill(student.student_id)}
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        {!offerSent
                          ? <button onClick={() => handleSendOfferClick(student)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                              Send Offer
                            </button>
                          : <span className="text-sm text-gray-500">{getOfferStatusText(status)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════════════ LEVEL 2 ══════════════════════════════ */}
      {activeLevel === "L2" && (
        <div className="space-y-3">
          {/* Config panel */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
              <div>
                <label className="text-xs text-gray-600">MCQ Count</label>
                <input type="number" className="w-full border rounded px-2 py-1"
                  value={l2Config.questionCount} min={1}
                  onChange={(e) => setL2Config((p) => ({ ...p, questionCount: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Difficulty (1-3)</label>
                <input type="number" className="w-full border rounded px-2 py-1"
                  value={l2Config.difficulty} min={1} max={3}
                  onChange={(e) => setL2Config((p) => ({ ...p, difficulty: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Time (mins)</label>
                <input type="number" className="w-full border rounded px-2 py-1"
                  value={l2Config.timeLimitMinutes} min={1}
                  onChange={(e) => setL2Config((p) => ({ ...p, timeLimitMinutes: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Pass Score</label>
                <input type="number" className="w-full border rounded px-2 py-1"
                  value={l2Config.passScore} min={1} max={100}
                  onChange={(e) => setL2Config((p) => ({ ...p, passScore: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700 flex items-center gap-2">
                  <input type="checkbox" checked={l2Config.allowText}
                    onChange={(e) => setL2Config((p) => ({ ...p, allowText: e.target.checked }))} />
                  Text Answer
                </label>
                <label className="text-xs text-gray-700 flex items-center gap-2">
                  <input type="checkbox" checked={l2Config.allowFileUpload}
                    onChange={(e) => setL2Config((p) => ({ ...p, allowFileUpload: e.target.checked }))} />
                  File Upload
                </label>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Total Level 2 Applications: <span className="font-semibold">{l2Count}</span>
          </p>

          <div className="h-[80vh] overflow-auto -mr-6 pr-6 bg-white">
            <table className="min-w-full font-poppins text-sm bg-white">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-3 text-center">Name</th>
                  <th className="px-6 py-3 text-center">Email</th>
                  <th className="px-6 py-3 text-center">L2 Status</th>
                  <th className="px-6 py-3 text-center">Offer Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {l2Items.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-500" colSpan={5}>
                      No Level 2 candidates yet.
                    </td>
                  </tr>
                ) : (
                  l2Items.map((item) => {
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
                      <tr key={sid} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">{name}</td>
                        <td className="px-6 py-4">{email}</td>

                        {/* ── L2 STATUS PILL ── */}
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getL2StatusColor(l2Status)}`}>
                            {getL2StatusLabel(l2Status)}
                          </span>
                        </td>

                        {/* ── OFFER STATUS ── */}
                        <td className="px-6 py-4">{renderOfferStatusPill(sid)}</td>

                        {/* ── ACTIONS ── */}
                        <td className="px-6 py-4 space-x-2">
                          {/* Assignment button */}
                          {isLocked ? (
                            <span className="px-3 py-1 text-sm rounded bg-green-100 text-green-700">
                              Assignment Sent ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendAssignment(item)}
                              disabled={isSending}
                              className={`px-3 py-1 rounded text-white transition ${
                                isSending ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
                              }`}
                            >
                              {isSending
                                ? "Sending..."
                                : l2Status === "generated"
                                  ? "Send to Student"
                                  : "Send Assignment"}
                            </button>
                          )}

                          {/* Offer button */}
                          {offerStatus === "Not Sent" ? (
                            <button onClick={() => handleSendOfferClick(offerCandidate)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                              Send Offer
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500">{getOfferStatusText(offerStatus)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ LEVEL 3 ══════════════════════════════ */}
      {activeLevel === "L3" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Interviews are scheduled via <b>Google Meet</b> and invites are sent automatically.
          </p>
          <div className="h-[80vh] overflow-auto -mr-6 pr-6 bg-white">
            <table className="min-w-full text-sm bg-white">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-center">Name</th>
                  <th className="px-6 py-3 text-center">Email</th>
                  <th className="px-6 py-3 text-center">Interview Status</th>
                  <th className="px-6 py-3 text-center">Scheduled At</th>
                  <th className="px-6 py-3 text-center">Meeting</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-center">
                {l3Items.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-6 text-gray-500">No candidates in Level 3.</td></tr>
                ) : (
                  l3Items.map((item) => {
                    const l3 = item?.l3 || {};
                    const interview = l3?.interviewId || {};
                    const isScheduled = !!interview?.scheduledAt;
                    const isCompleted = !!interview?.completedAt;
                    const isDecided = ["passed", "rejected"].includes(l3.status);

                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{item.studentId?.name}</td>
                        <td className="px-6 py-4">{item.studentId?.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            l3.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                            l3.status === "completed" ? "bg-purple-100 text-purple-800" :
                            l3.status === "rejected"  ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-700"
                          }`}>{l3.status || "Pending"}</span>
                        </td>
                        <td className="px-6 py-4">
                          {interview?.scheduledAt
                            ? new Date(interview.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {interview?.link
                            ? <a href={interview.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Join</a>
                            : "—"}
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          {!isCompleted && (
                            <button onClick={() => { setScheduleTarget(item); setShowScheduleModal(true); }}
                              className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700">
                              {isScheduled ? "Reschedule" : "Schedule"}
                            </button>
                          )}
                          {isScheduled && !isCompleted && (
                            <button onClick={async () => {
                              await markInterviewCompleted(interview._id);
                              setL3Items(await fetchPipelineByStage(internshipId, "L3"));
                            }} className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">
                              Mark Completed
                            </button>
                          )}
                          {isCompleted && !isDecided && (
                            <>
                              <button onClick={async () => {
                                await completeInterview({ interviewId: interview._id, result: "passed" });
                                setL3Items(await fetchPipelineByStage(internshipId, "L3"));
                              }} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Pass</button>
                              <button onClick={async () => {
                                await completeInterview({ interviewId: interview._id, result: "rejected" });
                                setL3Items(await fetchPipelineByStage(internshipId, "L3"));
                              }} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                            </>
                          )}
                          {l3.status === "rejected" && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Rejected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ OFFER ══════════════════════════════ */}
      {activeLevel === "OFFER" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Candidates who cleared interviews and are eligible for offers.</p>
          <div className="h-[80vh] overflow-auto -mr-6 pr-6 bg-white">
            <table className="min-w-full text-sm bg-white">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-center">Name</th>
                  <th className="px-6 py-3 text-center">Email</th>
                  <th className="px-6 py-3 text-center">Interview Result</th>
                  <th className="px-6 py-3 text-center">Offer Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-center">
                {offerItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-6 text-gray-500">No candidates in Offer stage.</td></tr>
                ) : (
                  offerItems.map((item) => {
                    const sid = String(item?.studentId?._id);
                    const offerStatus = offerStatuses[sid] || "Not Sent";
                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{item.studentId?.name}</td>
                        <td className="px-6 py-4">{item.studentId?.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Passed</span>
                        </td>
                        <td className="px-6 py-4">{renderOfferStatusPill(sid)}</td>
                        <td className="px-6 py-4">
                          {offerStatus === "Not Sent" ? (
                            <button onClick={() => handleSendOfferClick({
                              student_id: sid, name: item.studentId?.name,
                              email: item.studentId?.email, resumeUrl: item?.resumeUrl,
                            })} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                              Send Offer
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500">{getOfferStatusText(offerStatus)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ MODALS ══════════════════════════════ */}
      {showOfferModal && selectedStudent && (
        <Modal isOpen onClose={handleCloseOfferModal} title="Send Offer Letter">
          <SendOfferLetter
            student={{ _id: selectedStudent.student_id, name: selectedStudent.name, email: selectedStudent.email, resumeUrl: selectedStudent.resumeUrl }}
            internshipId={internshipId}
            onSuccess={handleOfferSuccess}
            onCancel={handleCloseOfferModal}
          />
        </Modal>
      )}

      {showBulkModal && (
        <Modal isOpen onClose={() => setShowBulkModal(false)} title={`Send Offers to ${selectedStudents.length} Students`}>
          <BulkSendOffer
            selectedStudents={selectedStudents.map((id) => uniqueCandidates.find((s) => s.student_id === id))}
            internshipId={internshipId}
            onCancel={() => setShowBulkModal(false)}
            onSuccess={handleBulkOfferSuccess}
          />
        </Modal>
      )}

      {showScheduleModal && scheduleTarget && (
        <Modal isOpen onClose={() => setShowScheduleModal(false)} title="Schedule Interview">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Date & Time</label>
              <input type="datetime-local" className="w-full border rounded px-3 py-2"
                value={scheduleForm.scheduledAt}
                onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Duration (minutes)</label>
              <input type="number" min={15} className="w-full border rounded px-3 py-2"
                value={scheduleForm.durationMinutes}
                onChange={(e) => setScheduleForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))} />
            </div>
            <button onClick={() => handleScheduleInterview(scheduleTarget)}
              className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700">
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