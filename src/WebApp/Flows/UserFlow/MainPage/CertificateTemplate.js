// CertificateTemplate.js
import React from "react";

const defaultWidth = 1120;
const defaultHeight = 792;

const CertificateTemplate = ({
  studentName,
  backgroundImageUrl = "",
  width = defaultWidth,
  height = defaultHeight,
}) => {
  const hasCustomBackground = Boolean(backgroundImageUrl);

  return (
    <div
      id="certificate-content"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        overflow: "hidden",
        border: hasCustomBackground ? "none" : "10px solid #4f46e5",
        borderRadius: "12px",
        backgroundColor: "#fff",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {hasCustomBackground && (
        <img
          src={backgroundImageUrl}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: hasCustomBackground ? "72px 96px" : "40px",
          color: hasCustomBackground ? "#111827" : "inherit",
          textShadow: hasCustomBackground
            ? "0 1px 2px rgba(255,255,255,0.85), 0 2px 10px rgba(255,255,255,0.55)"
            : "none",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", marginBottom: "20px", color: hasCustomBackground ? "#1f2937" : "#1e3a8a" }}>
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
            color: hasCustomBackground ? "#166534" : "#16a34a",
          }}
        >
          Internship Completed
        </p>
      </div>
    </div>
  );
};

export default CertificateTemplate;
