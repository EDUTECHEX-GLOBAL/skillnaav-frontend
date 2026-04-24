import React, { useState } from "react";
import axios from "../../../../../api/axiosInstance";
import Papa from "papaparse";
import { FaCloudUploadAlt, FaFileCsv, FaInfoCircle } from "react-icons/fa";

const UploadStudents = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const token = localStorage.getItem("schoolAdminToken"); // Make sure this exists

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

const handleUpload = async () => {
  if (!selectedFile) return setUploadStatus("❗ Select a CSV file first.");

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
        "Field of Internship"
      ];

      const uploadedHeaders = Object.keys(results.data[0] || {});
      const isValid = requiredHeaders.every(header => uploadedHeaders.includes(header));

      if (!isValid) {
        setUploadStatus("❌ CSV format invalid. Expected columns: Full Name, Email Address, School Name, Grade, Stream/Curriculum, Field of Internship.");
        return;
      }

      const formData = new FormData();
      formData.append("csvFile", selectedFile);
      console.log("🛠 FormData entries:", [...formData.entries()]);

      try {
        const res = await axios.post(
          "/api/school-admin/upload-students",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUploadStatus(`✅ ${res.data.message}`);
      } catch (err) {
        console.error("Upload error:", err.response?.data || err.message);
        setUploadStatus("❌ Upload failed. Check console for details.");
      }
    },
    error: (err) => {
      console.error("CSV parse error:", err);
      setUploadStatus("❌ Failed to read the file.");
    }
  });
};

  const statusClasses = uploadStatus.includes("✅")
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : uploadStatus.includes("❌") || uploadStatus.includes("❗")
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-teal-50/40 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] bg-slate-900 p-6 text-white md:p-8">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl text-teal-300">
            <FaCloudUploadAlt />
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
            Student Import
          </p>
          <h2 className="text-3xl font-bold leading-tight">
            Upload students in one CSV batch
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Choose a CSV file with the required headers and send it directly to the
            school admin upload endpoint.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label
              htmlFor="student-csv-upload"
              className="flex cursor-pointer flex-col rounded-2xl border border-dashed border-teal-300/40 bg-slate-950/40 p-5 transition hover:border-teal-300/70 hover:bg-slate-950/60"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/15 text-xl text-teal-300">
                  <FaFileCsv />
                </span>
                {selectedFile ? "Selected CSV File" : "Choose CSV File"}
              </span>
              <span className="mt-3 text-sm text-slate-300">
                {selectedFile
                  ? selectedFile.name
                  : "Click here to browse and attach your student data sheet."}
              </span>
              {selectedFile && (
                <span className="mt-2 text-xs uppercase tracking-[0.18em] text-teal-300">
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
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              Upload Students CSV
            </button>
          </div>

          {uploadStatus && (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${statusClasses}`}>
              {uploadStatus}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white/80 p-6 backdrop-blur-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600">
              Format Guide
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              Required CSV columns
            </h3>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="rounded-xl border border-slate-200 bg-white px-3 py-2">Full Name</li>
              <li className="rounded-xl border border-slate-200 bg-white px-3 py-2">Email Address</li>
              <li className="rounded-xl border border-slate-200 bg-white px-3 py-2">School Name</li>
              <li className="rounded-xl border border-slate-200 bg-white px-3 py-2">Grade</li>
              <li className="rounded-xl border border-slate-200 bg-white px-3 py-2">Stream/Curriculum</li>
              <li className="rounded-xl border border-slate-200 bg-white px-3 py-2">Field of Internship</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-amber-600">
                <FaInfoCircle />
              </span>
              <p className="leading-6">
                Header names must match exactly. Empty rows are skipped automatically
                before the file is sent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadStudents;
