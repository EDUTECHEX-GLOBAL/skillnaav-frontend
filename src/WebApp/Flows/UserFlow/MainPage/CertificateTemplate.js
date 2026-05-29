// CertificateTemplate.js
import React from "react";

const defaultWidth = 1120;
const defaultHeight = 792;

const CertificateTemplate = ({
  studentName,
  internshipTitle = "Frontend Developer Intern",
  companyName = "Amazon",
  startDate = "May 1, 2026",
  endDate = "Jun 10, 2026",
  backgroundImageUrl = "",
  width = defaultWidth,
  height = defaultHeight,
  textColor = "#1f2937",
}) => {
  const hasCustomBackground = Boolean(backgroundImageUrl);

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Poppins:wght@300;400;500;600;700&display=swap');
        `}
      </style>
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
          boxShadow: hasCustomBackground ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
              zIndex: 1,
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
            padding: hasCustomBackground ? "90px 100px" : "60px 80px",
            color: textColor,
            textShadow: hasCustomBackground
              ? "0 1px 3px rgba(255,255,255,0.9), 0 2px 10px rgba(255,255,255,0.7)"
              : "none",
            zIndex: 2,
          }}
        >
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "3.2rem",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "15px",
              color: textColor,
            }}
          >
            Certificate of Internship
          </h1>

          <p
            style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: "2.2rem",
              marginBottom: "35px",
              color: textColor,
              opacity: 0.9,
            }}
          >
            This is to proudly certify that
          </p>

          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "3rem",
              fontStyle: "italic",
              fontWeight: 700,
              marginBottom: "45px",
              color: textColor,
              borderBottom: `2px solid ${textColor}`,
              paddingBottom: "5px",
              display: "inline-block",
              minWidth: "400px",
            }}
          >
            {studentName || "Student Name"}
          </h2>

          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "1.4rem",
              fontWeight: 600,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: textColor,
            }}
          >
            Internship Completed
          </p>

          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "1.25rem",
              marginTop: "15px",
              marginBottom: 0,
              fontWeight: 400,
              color: textColor,
              opacity: 0.9,
            }}
          >
            {internshipTitle} at {companyName}
          </p>

          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "1.1rem",
              marginTop: "15px",
              marginBottom: 0,
              fontWeight: 500,
              color: textColor,
              opacity: 0.8,
            }}
          >
            {startDate} — {endDate}
          </p>

          <div
            style={{
              position: "absolute",
              bottom: "35px",
              left: "45px",
              textAlign: "left",
              fontSize: "0.75rem",
              color: textColor,
              fontFamily: "monospace",
              background: hasCustomBackground ? "rgba(255,255,255,0.85)" : "transparent",
              padding: "12px",
              borderRadius: "8px",
              boxShadow: hasCustomBackground ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
              lineHeight: 1.6,
            }}
          >
            Certificate ID: 0d443aeb-10dc-4891-a98c-9bf28ddb31f1<br />
            Verify at: https://www.skillnaav.com/verify/0d443aeb-10dc-4891...<br />
            Issued: May 28, 2026
          </div>
        </div>
      </div>
    </>
  );
};

export default CertificateTemplate;
