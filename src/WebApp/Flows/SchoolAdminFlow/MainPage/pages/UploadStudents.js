import React, { useState } from "react";
import axios from "../../../../../api/axiosInstance";
import Papa from "papaparse";
import {
  FaCloudUploadAlt,
  FaFileCsv,
} from "react-icons/fa";

// ─────────────────────────────────────────────────────────────
// Upload Overlay Component
// ─────────────────────────────────────────────────────────────
function UploadOverlay({ modal, onClose }) {
  if (!modal.show) return null;

  const { generated, total, phase, currentName } = modal;
  const pct = total > 0 ? Math.round((generated / total) * 100) : 0;
  const isDone = phase === "done";
  const isFailedZero = isDone && generated === 0;

  const STEP_ORDER = [
    "parsing",
    "validating",
    "generating",
    "emailing",
    "done",
  ];

  const currentIdx = STEP_ORDER.indexOf(phase);

  const steps = [
    { key: "parsing", label: "CSV file parsed" },
    { key: "validating", label: "Student records validated" },
    { key: "generating", label: "Generating credentials" },
    {
      key: "emailing",
      label: isFailedZero
        ? "No emails sent (0 new students created)"
        : "Emails sent to students",
    },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                isDone
                  ? isFailedZero
                    ? "bg-rose-100"
                    : "bg-emerald-100"
                  : "bg-blue-100"
              }`}
            >
              {isDone ? (
                isFailedZero ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 8v4M12 16h.01"
                      stroke="#DC2626"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )
              ) : (
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              )}
            </div>

            <div>
              <h2
                className={`text-xl font-bold ${
                  isFailedZero ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {isDone
                  ? isFailedZero
                    ? "0 Credentials Generated"
                    : "All Credentials Generated"
                  : "Generating Credentials..."}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isDone
                  ? isFailedZero
                    ? "All uploaded students already exist or are duplicates. No emails sent."
                    : `${generated} students processed successfully.`
                  : "Please do not close or refresh the page."}
              </p>
            </div>
          </div>

          <div
            className={`mb-6 rounded-2xl border p-5 ${
              isFailedZero
                ? "border-rose-200 bg-rose-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div
              className={`mb-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                isFailedZero ? "text-rose-500" : "text-slate-500"
              }`}
            >
              Credentials Generated
            </div>

            <div className="flex items-end gap-3">
              <span
                key={generated}
                className={`text-5xl font-extrabold ${
                  isDone
                    ? isFailedZero
                      ? "text-rose-600"
                      : "text-emerald-600"
                    : "text-blue-600"
                }`}
              >
                {generated}
              </span>

              <span className="mb-1 text-2xl text-slate-400">/</span>

              <span className="mb-1 text-2xl font-semibold text-slate-500">
                {total}
              </span>
            </div>

            {!isDone && currentName && (
              <p className="mt-3 truncate text-sm italic text-indigo-600">
                Processing: {currentName}
              </p>
            )}
          </div>

          <div className="mb-6">
            <div className="mb-2 flex justify-between text-sm text-slate-600">
              <span>Progress</span>
              <span>{pct}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDone
                    ? isFailedZero
                      ? "bg-gradient-to-r from-rose-500 to-rose-400"
                      : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            {steps.map((step) => {
              const stepIndex = STEP_ORDER.indexOf(step.key);
              const done = currentIdx > stepIndex;
              const active = currentIdx === stepIndex;
              const isEmailStepZero = step.key === "emailing" && isFailedZero;

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      isEmailStepZero
                        ? "bg-rose-200"
                        : done
                        ? "bg-emerald-200"
                        : active
                        ? "bg-blue-200"
                        : "bg-slate-200"
                    }`}
                  >
                    {isEmailStepZero ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M3 3l6 6M9 3l-6 6"
                          stroke="#DC2626"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : done ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l2.5 2.5L10 3"
                          stroke="#059669"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : active ? (
                      <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-slate-400" />
                    )}
                  </div>

                  <span
                    className={`text-sm ${
                      isEmailStepZero
                        ? "font-semibold text-rose-700"
                        : done
                        ? "font-semibold text-emerald-700"
                        : active
                        ? "font-semibold text-blue-700"
                        : "text-slate-500"
                    }`}
                  >
                    {step.key === "generating" && active
                      ? `Generating credential ${generated + 1} of ${total}`
                      : step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {!isDone && (
            <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              🔒 Upload is in progress. The page is temporarily locked.
            </div>
          )}

          <button
            disabled={!isDone}
            onClick={onClose}
            className={`w-full rounded-2xl py-3 text-sm font-semibold transition ${
              isDone
                ? isFailedZero
                  ? "bg-rose-600 text-white hover:bg-rose-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
                : "cursor-not-allowed bg-slate-200 text-slate-500"
            }`}
          >
            {isDone
              ? isFailedZero
                ? "Close (0 Credentials Created)"
                : "Done — Close"
              : `Generating... ${generated}/${total}`}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Utility Delay Function
// ─────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
const UploadStudents = () => {
  const token = localStorage.getItem("schoolAdminToken");

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Upload overlay state
  const [uploadModal, setUploadModal] = useState({
    show: false,
    generated: 0,
    total: 0,
    phase: "idle",
    currentName: "",
  });

  // ───────────────────────────────────────────────────────────
  // CSV File Selection
  // ───────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadStatus("");
  };

  // ───────────────────────────────────────────────────────────
  // Simulated Progress
  // ───────────────────────────────────────────────────────────
  const simulatePerStudentProgress = async (students) => {
    for (let i = 0; i < students.length; i++) {
      await delay(500);

      setUploadModal((prev) => ({
        ...prev,
        generated: i + 1,
        currentName: students[i]["Full Name"] || `Student ${i + 1}`,
      }));
    }
  };

  // ───────────────────────────────────────────────────────────
  // CSV Upload
  // ───────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("❗ Select a CSV file first.");
      return;
    }

    setIsUploading(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,

      complete: async (results) => {
        const requiredHeaders = [
          "Full Name",
          "Email Address",
          "School Name",
          "Grade",
          "Stream/Curriculum",
          "Field of Internship",
        ];

        const uploadedHeaders = Object.keys(results.data[0] || {});

        const isValid = requiredHeaders.every((header) =>
          uploadedHeaders.includes(header)
        );

        if (!isValid) {
          setUploadStatus(
            "❌ CSV format invalid. Please use the correct template."
          );
          return;
        }

        const students = results.data;
        const total = students.length;

        // Phase 1
        setUploadModal({
          show: true,
          generated: 0,
          total,
          phase: "parsing",
          currentName: "",
        });

        await delay(700);

        // Phase 2
        setUploadModal((prev) => ({
          ...prev,
          phase: "validating",
        }));

        await delay(700);

        // Phase 3
        setUploadModal((prev) => ({
          ...prev,
          phase: "generating",
        }));

        const formData = new FormData();
        formData.append("csvFile", selectedFile);

        try {
          const [res] = await Promise.all([
            axios.post(
              "/api/school-admin/upload-students",
              formData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            ),

            simulatePerStudentProgress(students),
          ]);

          const resData = res.data;
          const generatedCount = resData.generated ?? 0;

          // Phase 4
          setUploadModal((prev) => ({
            ...prev,
            phase: "emailing",
            generated: generatedCount,
            currentName: "",
          }));

          await delay(900);

          // Phase 5
          setUploadModal((prev) => ({
            ...prev,
            phase: "done",
            generated: generatedCount,
          }));

          const icon = resData.statusIcon || (generatedCount === 0 ? "❌" : "✅");
          setUploadStatus(`${icon} ${resData.message}`);
          setIsUploading(false);
        } catch (err) {
          const errMsg =
            err.response?.data?.message ||
            err.message ||
            "Upload failed. Please check the CSV file.";
          console.error(err.response?.data || err.message);

          setUploadModal({
            show: false,
            generated: 0,
            total: 0,
            phase: "idle",
            currentName: "",
          });

          setUploadStatus(`❌ ${errMsg}`);
          setIsUploading(false);
        }
      },

      error: (err) => {
        console.error(err);
        setUploadStatus("❌ Failed to parse CSV.");
        setIsUploading(false);
      },
    });
  };

  // ───────────────────────────────────────────────────────────
  // Close Overlay
  // ───────────────────────────────────────────────────────────
  const handleModalClose = () => {
    setUploadModal({
      show: false,
      generated: 0,
      total: 0,
      phase: "idle",
      currentName: "",
    });
  };

  // ───────────────────────────────────────────────────────────
  // Status Styling
  // ───────────────────────────────────────────────────────────
  const statusClasses = uploadStatus.includes("✅")
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : uploadStatus.includes("⚠️")
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : uploadStatus.includes("❌") || uploadStatus.includes("❗")
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-slate-200 bg-slate-50 text-slate-700";

  if (isPageLoading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      {/* Upload Overlay */}
      <UploadOverlay modal={uploadModal} onClose={handleModalClose} />

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2 w-full max-w-full min-w-0 overflow-hidden">
        {/* ───────────────────────────────────────── */}
        {/* CSV Upload Section */}
        {/* ───────────────────────────────────────── */}
        <div className="w-full max-w-full min-w-0 rounded-[24px] sm:rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-teal-50/40 p-3 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8 overflow-hidden">
          <div className="rounded-[20px] sm:rounded-[24px] bg-slate-900 p-4 sm:p-6 md:p-8 text-white min-w-0 max-w-full overflow-hidden">
            <div className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white/10 text-xl sm:text-2xl text-teal-300">
              <FaCloudUploadAlt />
            </div>

            <p className="mb-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
              Student Import
            </p>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight break-words max-w-full">
              Upload students in one CSV batch
            </h2>

            <p className="mt-2 sm:mt-3 max-w-xl text-xs sm:text-sm leading-5 sm:leading-6 text-slate-300 break-words">
              Upload a CSV file and automatically generate credentials for
              students.
            </p>

            <div className="mt-6 sm:mt-8 rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 min-w-0 max-w-full">
              <label
                htmlFor="student-csv-upload"
                className="flex cursor-pointer flex-col rounded-2xl border border-dashed border-teal-300/40 bg-slate-950/40 p-4 sm:p-5 transition hover:border-teal-300/70 hover:bg-slate-950/60 min-w-0 max-w-full"
              >
                <span className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-white min-w-0">
                  <span className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-teal-400/15 text-lg sm:text-xl text-teal-300 shrink-0">
                    <FaFileCsv />
                  </span>

                  <span className="truncate">{selectedFile ? "Selected CSV File" : "Choose CSV File"}</span>
                </span>

                <p className="mt-3 text-xs sm:text-sm text-slate-300 block w-full min-w-0 break-words leading-relaxed">
                  {selectedFile
                    ? selectedFile.name
                    : "Click here to browse and attach your student data sheet."}
                </p>

                {selectedFile && (
                  <span className="mt-2 text-xs uppercase tracking-[0.18em] text-teal-300 font-medium">
                    Ready to upload
                  </span>
                )}
              </label>

              <input
                id="student-csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-500 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
                )}
                {isUploading ? "Uploading..." : "Upload Students CSV"}
              </button>
            </div>

            {uploadStatus && (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-medium break-words ${statusClasses}`}
              >
                {uploadStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadStudents;