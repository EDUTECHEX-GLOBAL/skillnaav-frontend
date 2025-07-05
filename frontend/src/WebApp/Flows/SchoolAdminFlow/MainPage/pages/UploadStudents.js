import React, { useState } from "react";
import axios from "axios";

const UploadStudents = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const token = localStorage.getItem("schoolAdminToken"); // Make sure this exists

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

const handleUpload = async () => {
  if (!selectedFile) return setUploadStatus("Select a file first");

  const formData = new FormData();
  formData.append("csvFile", selectedFile);          // 🔑 must be "csvFile"
  console.log("🛠 FormData entries:", [...formData.entries()]);

  try {
    const res = await axios.post(
      "/api/school-admin/upload-students",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,    
          // DO NOT set Content-Type: browser will set multipart/form-data boundary
        },
      }
    );
    setUploadStatus(res.data.message);
  } catch (err) {
    console.error("Upload error:", err.response?.data || err.message);
    setUploadStatus("Upload failed");
  }
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
