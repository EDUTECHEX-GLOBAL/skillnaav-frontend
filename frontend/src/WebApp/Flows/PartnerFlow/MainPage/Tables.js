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
  completeInterview,          // ✅ ADD THIS
} from "./pipelineUtils";






// --- Applications UI helpers ---
const formatAppDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
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
    case "shortlisted":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
    case "selected":
      return "bg-green-100 text-green-800";
    case "rejected":
    case "declined":
      return "bg-red-100 text-red-800";
    case "pending":
    default:
      return "bg-gray-100 text-gray-800";
  }
};


// ApplicationsTable (unchanged except safe default)
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
        {applications.map((student) => {
          const statusText = getApplicationStatusText(student.status);
          const statusCls = getApplicationStatusColor(student.status);

          return (
            <tr key={student._id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4">{student.userName || "N/A"}</td>
              <td className="px-6 py-4">{student.userEmail || "N/A"}</td>
              <td className="px-6 py-4">{formatAppDate(student.appliedDate)}</td>
              <td className="px-6 py-4">
                {student.resumeUrl ? (
                  <a
                    href={student.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Resume
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCls}`}>
                  {statusText}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

ApplicationsTable.propTypes = {
  applications: PropTypes.array.isRequired,
};

const getPartnerId = () => {
  try {
    const partnerInfo = JSON.parse(localStorage.getItem("partnerInfo") || "null");
    if (partnerInfo?._id) return partnerInfo._id;
  } catch (e) { }
  return localStorage.getItem("partnerId") || null;
};

const TabBtn = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${active ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
  >
    {children}
  </button>
);

// ShortlistedTable with L1/L2/L3
export const ShortlistedTable = ({ candidates, internshipId }) => {
  const partnerId = useMemo(() => getPartnerId(), []);

  const [activeLevel, setActiveLevel] = useState("L1"); // L1 | L2 | L3
  

  // Offer status (shared across all levels)
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [offerStatuses, setOfferStatuses] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState({});
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // L2/L3 pipeline data
  const [l2Items, setL2Items] = useState([]);
  const [l3Items, setL3Items] = useState([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [sendingMap, setSendingMap] = useState({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [offerItems, setOfferItems] = useState([]);


  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: "",
    durationMinutes: 30,
  });



  // L2 config UI
  const [l2Config, setL2Config] = useState({
    questionCount: 10,
    difficulty: 2,
    timeLimitMinutes: 20,
    passScore: 70,
    allowText: true,
    allowFileUpload: true,
  });

  // L3 link
  const [interviewLink, setInterviewLink] = useState("");


  // ✅ Deduplicate by student_id (safer than email)
  const uniqueCandidates = useMemo(() => {
    return (candidates || []).filter(
      (student, index, self) =>
        index === self.findIndex((s) => s.student_id === student.student_id)
    );
  }, [candidates]);

  // =========================
  // Application Counts
  // =========================
  const l1Count = useMemo(() => uniqueCandidates.length, [uniqueCandidates]);
  const l2Count = useMemo(() => l2Items.length, [l2Items]);
  const l3Count = useMemo(() => l3Items.length, [l3Items]);
  const offerCount = useMemo(() => offerItems.length, [offerItems]);


  // Fetch offer statuses for Level 1 candidates (same as your current logic)
 useEffect(() => {
  const loadPipeline = async () => {
    if (!internshipId) return;

    setPipelineLoading(true);
    try {
      if (activeLevel === "L2") {
        const items = await fetchPipelineByStage(internshipId, "L2");
        setL2Items(items);
      }

      if (activeLevel === "L3") {
        const items = await fetchPipelineByStage(internshipId, "L3");
        setL3Items(items);
      }

      if (activeLevel === "OFFER") {
        const items = await fetchPipelineByStage(internshipId, "OFFER");
        setOfferItems(items); // ✅ THIS WAS MISSING
      }
    } catch (e) {
      console.error("Pipeline load failed:", e);
    } finally {
      setPipelineLoading(false);
    }
  };

  loadPipeline();
}, [activeLevel, internshipId]);


  // Load pipeline L2/L3 when tab changes
  useEffect(() => {
    const loadPipeline = async () => {
      if (!internshipId) return;
      if (activeLevel === "L1") return;

      setPipelineLoading(true);
      try {
        if (activeLevel === "L2") {
          const items = await fetchPipelineByStage(internshipId, "L2");
          setL2Items(items);

          // also load offer statuses for these students
          const ids = items.map((x) => x?.studentId?._id || x?.studentId).filter(Boolean);
          if (ids.length) {
            const map = await checkOfferStatuses(ids, internshipId);
            setOfferStatuses((prev) => ({ ...prev, ...(map || {}) }));
          }
        }

        if (activeLevel === "L3") {
          const items = await fetchPipelineByStage(internshipId, "L3");
          setL3Items(items);

          const ids = items.map((x) => x?.studentId?._id || x?.studentId).filter(Boolean);
          if (ids.length) {
            const map = await checkOfferStatuses(ids, internshipId);
            setOfferStatuses((prev) => ({ ...prev, ...(map || {}) }));
          }
        }

        const [offerItems, setOfferItems] = useState([]);

      } catch (e) {
        console.error("Pipeline load failed:", e);
      } finally {
        setPipelineLoading(false);
      }
    };

    loadPipeline();
  }, [activeLevel, internshipId]);





  // Bulk selection handlers (Level 1 only)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(
        uniqueCandidates
          .filter((s) => offerStatuses[s.student_id] !== "Sent")
          .map((s) => s.student_id)
      );
    } else {
      setSelectedStudents([]);
    }
  };

  const toggleStudentSelect = (id) => {
    if (offerStatuses[id] === "Sent") return;
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Offer modal handlers
  const handleSendOfferClick = (student) => {
    if (offerStatuses[student.student_id] === "Sent") return;
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

  const handleCloseOfferModal = () => {
    setShowOfferModal(false);
    setSelectedStudent(null);
  };

  const handleBulkOfferSuccess = (sentStudents) => {
    setShowBulkModal(false);
    setSelectedStudents([]);
    setOfferStatuses((prev) => {
      const updated = { ...prev };
      sentStudents.forEach((student) => {
        if (student?.student_id) updated[student.student_id] = "Sent";
      });
      return updated;
    });
  };

  // =========================
  // L2 action: Generate + Send
  // =========================
  const handleSendAssignment = async (item) => {
    const sid = item?.studentId?._id || item?.studentId;
    if (!sid || sendingMap[sid]) return;

    const l2Status = item?.l2?.status;
    if (["sent", "started", "submitted", "evaluated"].includes(l2Status)) {
      return;
    }

    setSendingMap((prev) => ({ ...prev, [sid]: true }));

    try {
      let assessmentId = item?.l2?.assessmentId;

      console.log("▶ studentId:", sid);
      console.log("▶ partnerId:", partnerId);
      console.log("▶ existing assessmentId:", assessmentId);

      if (!assessmentId) {
        const res = await generateL2Assessment({
          internshipId,
          studentId: sid,
          partnerId,
          config: l2Config,
        });

        console.log("▶ generate response:", res);
        assessmentId = res?.assessmentId;
      }

      if (!assessmentId) {
        throw new Error("Assessment ID missing after generation");
      }

      console.log("▶ sending assessment:", assessmentId);

      await sendL2Assessment({ assessmentId, partnerId });

      const items = await fetchPipelineByStage(internshipId, "L2");
      setL2Items(items);
    } catch (err) {
      console.error("❌ Send assignment failed:", err?.response?.data || err);
      alert("❌ Failed to send assignment");
    } finally {
      setSendingMap((prev) => ({ ...prev, [sid]: false }));
    }
  };



  // =========================
  // L3 action: Create + Send Link
  // =========================
 const handleScheduleInterview = async (item) => {
  const sid = item?.studentId?._id || item?.studentId;

  // 🔑 Reuse existing interview if present
  let interviewId =
    item?.l3?.interviewId?._id || item?.l3?.interviewId;

  // Create ONLY if not exists
  if (!interviewId) {
    const res = await createInterview({
      internshipId,
      studentId: sid,
      partnerId,
    });
    interviewId = res.interviewId;
  }

  // Always schedule the SAME interview
  await scheduleInterview({
    interviewId,
    scheduledAt: scheduleForm.scheduledAt,
    durationMinutes: scheduleForm.durationMinutes,
    studentEmail: item.studentId.email,
    studentName: item.studentId.name,
    internshipTitle: "Internship",
  });

  await sendInterviewInvite(interviewId);

  const items = await fetchPipelineByStage(internshipId, "L3");
  setL3Items(items);
};



  const renderOfferStatusPill = (sid) => {
    const status = offerStatuses[sid] || "Not Sent";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOfferStatusColor(status)}`}>
        {getOfferStatusText(status)}
      </span>
    );
  };

  const canSendOffer = (sid) => (offerStatuses[sid] || "Not Sent") === "Not Sent";

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <TabBtn active={activeLevel === "L1"} onClick={() => setActiveLevel("L1")}>
          Level 1 ({l1Count})
        </TabBtn>

        <TabBtn active={activeLevel === "L2"} onClick={() => setActiveLevel("L2")}>
          Level 2 ({l2Count})
        </TabBtn>

        <TabBtn active={activeLevel === "L3"} onClick={() => setActiveLevel("L3")}>
          Level 3 ({l3Count})
        </TabBtn>

        <TabBtn active={activeLevel === "OFFER"} onClick={() => setActiveLevel("OFFER")}>
  Offer ({offerCount})
</TabBtn>

      </div>


      {/* Loading */}
      {(isLoadingAll || pipelineLoading) && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      )}

      {/* ========================= LEVEL 1 (existing UI) ========================= */}
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
                    <input
                      type="checkbox"
                      checked={
                        selectedStudents.length > 0 &&
                        selectedStudents.length ===
                        uniqueCandidates.filter((s) => offerStatuses[s.student_id] !== "Sent").length
                      }
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
                  const isLoading = loadingStatuses[student.student_id];

                  return (
                    <tr key={student.student_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.student_id)}
                          disabled={status === "Sent"}
                          onChange={() => toggleStudentSelect(student.student_id)}
                        />
                      </td>
                      <td className="px-6 py-4">{student.name || "N/A"}</td>
                      <td className="px-6 py-4">{student.email || "N/A"}</td>
                      <td className="px-6 py-4">
                        <a
                          href={student.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Resume
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {isLoading ? (
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                            <span className="text-xs text-gray-500">Checking...</span>
                          </div>
                        ) : (
                          renderOfferStatusPill(student.student_id)
                        )}
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        {isLoading ? (
                          <span className="text-gray-500">Loading...</span>
                        ) : status === "Not Sent" ? (
                          <button
                            onClick={() => handleSendOfferClick(student)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Send Offer
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500">{getOfferStatusText(status)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ========================= LEVEL 2 (Assignments) ========================= */}
      {activeLevel === "L2" && (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
              <div>
                <label className="text-xs text-gray-600">MCQ Count</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={l2Config.questionCount}
                  onChange={(e) => setL2Config((p) => ({ ...p, questionCount: Number(e.target.value) }))}
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Difficulty (1-3)</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={l2Config.difficulty}
                  onChange={(e) => setL2Config((p) => ({ ...p, difficulty: Number(e.target.value) }))}
                  min={1}
                  max={3}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Time (mins)</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={l2Config.timeLimitMinutes}
                  onChange={(e) => setL2Config((p) => ({ ...p, timeLimitMinutes: Number(e.target.value) }))}
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Pass Score</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={l2Config.passScore}
                  onChange={(e) => setL2Config((p) => ({ ...p, passScore: Number(e.target.value) }))}
                  min={1}
                  max={100}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={l2Config.allowText}
                    onChange={(e) => setL2Config((p) => ({ ...p, allowText: e.target.checked }))}
                  />
                  Text Answer
                </label>
                <label className="text-xs text-gray-700 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={l2Config.allowFileUpload}
                    onChange={(e) => setL2Config((p) => ({ ...p, allowFileUpload: e.target.checked }))}
                  />
                  File Upload
                </label>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2">
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
                      No Level 2 candidates yet (shortlist candidates in Level 1 to move them here).

                    </td>
                  </tr>
                ) : (
                  l2Items.map((item) => {
                    const sid = item?.studentId?._id || item?.studentId;
                    const name = item?.studentId?.name || "—";
                    const email = item?.studentId?.email || "—";
                    const l2Status = item?.l2?.status || "pending";

                    const offerStatus = offerStatuses[sid] || "Not Sent";

                    // candidate object for offer modal
                    const offerCandidate = { student_id: sid, name, email, resumeUrl: item?.resumeUrl };

                    return (
                      <tr key={sid} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">{name}</td>
                        <td className="px-6 py-4">{email}</td>

                        {/* L2 STATUS */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium
      ${l2Status === "sent"
                                ? "bg-blue-100 text-blue-700"
                                : l2Status === "started"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : l2Status === "submitted"
                                    ? "bg-purple-100 text-purple-800"
                                    : l2Status === "passed"
                                      ? "bg-green-100 text-green-800"
                                      : l2Status === "rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-700"
                              }
    `}
                          >
                            {l2Status}
                          </span>
                        </td>

                        {/* OFFER STATUS */}
                        <td className="px-6 py-4">{renderOfferStatusPill(sid)}</td>

                        <td className="px-6 py-4 space-x-2">
                          {/* ASSIGNMENT */}
                          {(() => {
                            const isSending = sendingMap[sid];
                            const assignmentLocked = ["sent", "started", "submitted", "evaluated", "passed", "rejected"]
                              .includes(l2Status);

                            if (assignmentLocked) {
                              return (
                                <span className="px-3 py-1 text-sm rounded bg-green-100 text-green-700">
                                  Assignment Sent
                                </span>
                              );
                            }

                            return (
                              <button
                                onClick={() => handleSendAssignment(item)}
                                disabled={isSending}
                                className={`px-3 py-1 rounded text-white transition
          ${isSending ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"}
        `}
                              >
                                {isSending ? "Sending..." : "Send Assignment"}
                              </button>
                            );
                          })()}

                          {/* OFFER */}
                          {offerStatus === "Not Sent" ? (
                            <button
                              onClick={() => handleSendOfferClick(offerCandidate)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Send Offer
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {getOfferStatusText(offerStatus)}
                            </span>
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

      {/* ========================= LEVEL 3 (Interviews) ========================= */}
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
            <tr>
              <td colSpan={6} className="px-6 py-6 text-gray-500">
                No candidates currently in Level 3.
              </td>
            </tr>
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

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium
                        ${l3.status === "scheduled"
                          ? "bg-blue-100 text-blue-800"
                          : l3.status === "completed"
                          ? "bg-purple-100 text-purple-800"
                          : l3.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-700"}
                      `}
                    >
                      {l3.status || "Pending"}
                    </span>
                  </td>

                  {/* SCHEDULED AT */}
                  <td className="px-6 py-4">
                    {interview?.scheduledAt
                      ? new Date(interview.scheduledAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>

                  {/* MEETING */}
                  <td className="px-6 py-4">
                    {interview?.link ? (
                      <a
                        href={interview.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Join
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 space-x-2">

                    {/* Schedule / Reschedule */}
                    {!isCompleted && (
                      <button
                        onClick={() => {
                          setScheduleTarget(item);
                          setShowScheduleModal(true);
                        }}
                        className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        {isScheduled ? "Reschedule" : "Schedule"}
                      </button>
                    )}

                    {/* Mark Completed */}
                    {isScheduled && !isCompleted && (
                      <button
                        onClick={async () => {
                          await markInterviewCompleted(interview._id);
                          const items = await fetchPipelineByStage(internshipId, "L3");
                          setL3Items(items);
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Mark Completed
                      </button>
                    )}

                    {/* Pass / Reject */}
                    {isCompleted && !isDecided && (
                      <>
                        <button
                          onClick={async () => {
                            await completeInterview({
                              interviewId: interview._id,
                              result: "passed",
                            });
                            const items = await fetchPipelineByStage(internshipId, "L3");
                            setL3Items(items);
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Pass
                        </button>

                        <button
                          onClick={async () => {
                            await completeInterview({
                              interviewId: interview._id,
                              result: "rejected",
                            });
                            const items = await fetchPipelineByStage(internshipId, "L3");
                            setL3Items(items);
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* Final Rejected */}
                    {l3.status === "rejected" && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Rejected
                      </span>
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


{activeLevel === "OFFER" && (
  <div className="space-y-3">
    <p className="text-sm text-gray-600">
      Candidates who cleared interviews and are eligible for offers.
    </p>

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
            <tr>
              <td colSpan={5} className="px-6 py-6 text-gray-500">
                No candidates in Offer stage.
              </td>
            </tr>
          ) : (
            offerItems.map((item) => {
              const sid = item?.studentId?._id;
              const name = item?.studentId?.name;
              const email = item?.studentId?.email;
              const offerStatus = offerStatuses[sid] || "Not Sent";

              return (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{name}</td>
                  <td className="px-6 py-4">{email}</td>

                  {/* INTERVIEW RESULT */}
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Passed
                    </span>
                  </td>

                  {/* OFFER STATUS */}
                  <td className="px-6 py-4">
                    {renderOfferStatusPill(sid)}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 space-x-2">
                    {offerStatus === "Not Sent" ? (
                      <button
                        onClick={() =>
                          handleSendOfferClick({
                            student_id: sid,
                            name,
                            email,
                            resumeUrl: item?.resumeUrl,
                          })
                        }
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Send Offer
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {getOfferStatusText(offerStatus)}
                      </span>
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


      {/* Single send modal */}
      {showOfferModal && selectedStudent && (
        <Modal isOpen={showOfferModal} onClose={handleCloseOfferModal} title="Send Offer Letter">
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

      {/* Bulk send modal (still only from Level 1 selection) */}
      {showBulkModal && (
        <Modal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          title={`Send Offers to ${selectedStudents.length} Students`}
        >
          <BulkSendOffer
            selectedStudents={selectedStudents.map((id) =>
              uniqueCandidates.find((student) => student.student_id === id)
            )}
            internshipId={internshipId}
            onCancel={() => setShowBulkModal(false)}
            onSuccess={handleBulkOfferSuccess}
          />
        </Modal>
      )}

      {showScheduleModal && scheduleTarget && (
        <Modal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          title="Schedule Interview"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Date & Time</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2"
                value={scheduleForm.scheduledAt}
                onChange={(e) =>
                  setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Duration (minutes)</label>
              <input
                type="number"
                min={15}
                className="w-full border rounded px-3 py-2"
                value={scheduleForm.durationMinutes}
                onChange={(e) =>
                  setScheduleForm((p) => ({
                    ...p,
                    durationMinutes: Number(e.target.value),
                  }))
                }
              />
            </div>

            <button
              onClick={() => handleScheduleInterview(scheduleTarget)}
              className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
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
