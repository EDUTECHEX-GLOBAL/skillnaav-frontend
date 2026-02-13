import React, { useState } from "react";
import axios from "axios";
import Papa from "papaparse";

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

  return (
    <div className="p-6 bg-white rounded shadow-md w-full max-w-lg">
      <h2 className="text-xl font-semibold mb-4">Upload Students CSV</h2>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Upload
      </button>
      {uploadStatus && <p className="mt-4 text-sm">{uploadStatus}</p>}
    </div>
  );
};

export default UploadStudents;
