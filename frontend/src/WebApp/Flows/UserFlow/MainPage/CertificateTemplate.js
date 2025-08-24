// CertificateTemplate.js
import React from "react";

const CertificateTemplate = ({ studentName }) => {
  return (
    <div
      id="certificate-content"
      style={{
        width: "800px",
        height: "600px",
        border: "10px solid #4f46e5",
        borderRadius: "12px",
        padding: "40px",
        textAlign: "center",
        backgroundColor: "#fff",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "20px", color: "#1e3a8a" }}>
        Internship Certificate
      </h1>

      <p style={{ fontSize: "1.2rem", marginBottom: "40px" }}>
        This is to certify that
      </p>

      <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "40px" }}>
        {studentName || "Student Name"}
      </h2>

      <p
        style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          marginTop: "50px",
          color: "#16a34a",
        }}
      >
        Internship Completed
      </p>
    </div>
  );
};

export default CertificateTemplate;
