import React, { useMemo } from "react";


// ─── Static styles (module-level — created once, never re-allocated) ──────────
const S = {
  badgeBase: {
    borderRadius: 20, padding: "3px 10px", fontSize: 12,
    fontWeight: 600, marginRight: 6, marginBottom: 6, display: "inline-block",
  },
  rowContainer: {
    display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12,
  },
  rowIcon: { fontSize: 18, minWidth: 22 },
  rowLabel: {
    fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase",
  },
  rowValue: { fontSize: 14, color: "#1a1a2e", fontWeight: 500 },
  sectionLabel: {
    fontSize: 11, color: "#888", fontWeight: 600,
    textTransform: "uppercase", marginBottom: 8,
  },
  panelRoot: {
    width: 320, borderLeft: "1px solid #e9ecef",
    background: "#fff", display: "flex",
    flexDirection: "column", height: "100%", overflowY: "auto",
  },
  header: {
    padding: "16px 18px", borderBottom: "1px solid #e9ecef",
    background: "#f8f9ff", display: "flex",
    justifyContent: "space-between", alignItems: "flex-start",
    position: "sticky", top: 0, zIndex: 1,
  },
  headerInner: { display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 },
  headerImg: {
    width: 40, height: 40, borderRadius: 10,
    objectFit: "cover", border: "1px solid #e9ecef", flexShrink: 0,
  },
  headerTitle: {
    fontWeight: 700, fontSize: 15, color: "#1a1a2e",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  headerCompany: { fontSize: 12, color: "#555", marginTop: 2 },
  closeBtn: {
    background: "none", border: "none", fontSize: 20,
    cursor: "pointer", color: "#888", lineHeight: 1, flexShrink: 0,
  },
  badgeRow: { padding: "12px 18px 4px", display: "flex", flexWrap: "wrap" },
  detailSection: { padding: "14px 18px" },
  skillsSection: { padding: "0 18px 14px" },
  contactSection: { padding: "0 18px 14px" },
  descSection: { padding: "0 18px 20px" },
  descText: { fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" },
};


// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = React.memo(({ text, color = "#3B5BDB" }) => (
  <span style={{
    ...S.badgeBase,
    background: `${color}18`,
    color,
    border: `1px solid ${color}40`,
  }}>
    {text}
  </span>
));


// ─── DetailRow ────────────────────────────────────────────────────────────────
const DetailRow = React.memo(({ icon, label, value }) => (
  <div style={S.rowContainer}>
    <span style={S.rowIcon}>{icon}</span>
    <div>
      <div style={S.rowLabel}>{label}</div>
      <div style={S.rowValue}>{value || "—"}</div>
    </div>
  </div>
));


// ─── Main Component ───────────────────────────────────────────────────────────
const InternshipDetailPanel = React.memo(({ internship, onClose }) => {

  // ── Destructure with safe fallbacks BEFORE hooks ──────────────────────────
  const {
    jobTitle,
    companyName,
    location,
    internshipType,
    internshipMode,
    compensationDetails,
    duration,
    qualifications = [],
    jobDescription,
    openings,
    endDateOrDuration,
    applicationOpen,
    sector,
    classification,
    imgUrl,
    contactInfo,
    _id,
  } = internship || {};  // ← safe fallback so hooks below never crash


  // ── Derived values (memoized — only recompute when deps change) ───────────
  const stipendLabel = useMemo(() => {
    if (!compensationDetails) return "Unpaid";
    const { type, amount, currency, frequency } = compensationDetails;
    if (type === "FREE" || !amount) return "Unpaid / Free";
    return `${currency || ""} ${amount.toLocaleString()} / ${frequency?.toLowerCase() || "month"}`.trim();
  }, [compensationDetails]);

  const deadlineLabel = useMemo(() => {
    if (!endDateOrDuration) return null;
    const d = new Date(endDateOrDuration);
    return isNaN(d.getTime())
      ? endDateOrDuration
      : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }, [endDateOrDuration]);

  const sectorLabel = useMemo(() =>
    sector?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  [sector]);


  // ── Early return AFTER all hooks ──────────────────────────────────────────
  if (!internship) return null;


  const statusColor = applicationOpen ? "#2F9E44" : "#C92A2A";
  const statusLabel = applicationOpen ? "OPEN" : "CLOSED";


  return (
    <div style={S.panelRoot}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerInner}>
          {imgUrl && (
            <img
              src={imgUrl}
              alt={companyName}
              style={S.headerImg}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={S.headerTitle}>{jobTitle}</div>
            <div style={S.headerCompany}>{companyName}</div>
          </div>
        </div>
        <button onClick={onClose} style={S.closeBtn} title="Close">×</button>
      </div>

      {/* ── Status + Meta Badges ── */}
      <div style={S.badgeRow}>
        <Badge text={statusLabel}    color={statusColor} />
        <Badge text={internshipType} color={internshipType === "PAID" ? "#2F9E44" : "#E67700"} />
        <Badge text={internshipMode} color="#1971C2" />
        {classification && <Badge text={classification} color="#862E9C" />}
        {sectorLabel    && <Badge text={sectorLabel}    color="#0C8599" />}
        <Badge text={`ID: …${String(_id).slice(-6)}`} color="#999" />
      </div>

      {/* ── Core Details ── */}
      <div style={S.detailSection}>
        <DetailRow icon="📍" label="Location"        value={location} />
        <DetailRow icon="💰" label="Stipend"         value={stipendLabel} />
        <DetailRow icon="⏱️" label="Duration"        value={duration} />
        <DetailRow icon="🗓️" label="End / Deadline"  value={deadlineLabel} />
        <DetailRow icon="🧑‍💼" label="Type"           value={internshipType} />
        <DetailRow icon="🖥️" label="Mode"            value={internshipMode} />
        {openings != null && (
          <DetailRow icon="🪑" label="Openings" value={openings} />
        )}
      </div>

      {/* ── Qualifications ── */}
      {qualifications.length > 0 && (
        <div style={S.skillsSection}>
          <div style={S.sectionLabel}>Qualifications Required</div>
          <div>
            {qualifications.map((q, i) => (
              <Badge key={i} text={q} color="#1971C2" />
            ))}
          </div>
        </div>
      )}

      {/* ── Contact Info ── */}
      {contactInfo && (
        <div style={S.contactSection}>
          <div style={S.sectionLabel}>Contact</div>
          <DetailRow icon="👤" label="Name"  value={contactInfo.name} />
          <DetailRow icon="✉️" label="Email" value={contactInfo.email} />
          <DetailRow icon="📞" label="Phone" value={contactInfo.phone} />
        </div>
      )}

      {/* ── Description ── */}
      {jobDescription && (
        <div style={S.descSection}>
          <div style={S.sectionLabel}>Description</div>
          <p style={S.descText}>{jobDescription}</p>
        </div>
      )}

    </div>
  );
});


export default InternshipDetailPanel;