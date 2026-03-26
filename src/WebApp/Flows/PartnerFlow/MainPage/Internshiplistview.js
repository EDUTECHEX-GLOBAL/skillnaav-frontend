// ─── InternshipListView.js ────────────────────────────────────────────────────
// Renders the internship selection list: header, search bar, cards, pagination.
// All data-fetching state lives in the parent (Message.js) and is passed via props.

import React, { useMemo, useCallback } from "react";
import {
  S, globalCss, CARD_HOVER_CSS, INTERNSHIPS_PER_PAGE,
  IconMessages, IconSearch, IconChevronRight, IconEmptyList,
  getInitials, getAvatarColor,
} from "./Chatconstants";

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = React.memo(({ title, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 2,
    background: getAvatarColor(title),
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontSize: size * 0.35, fontWeight: 700,
    color: "#fff", fontFamily: "'Sora', sans-serif", letterSpacing: "0.02em",
  }}>
    {getInitials(title)}
  </div>
));

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = React.memo(({ label }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
    <div style={{
      width: 22, height: 22, borderRadius: "50%",
      border: "2.5px solid #E0E7FF", borderTopColor: "#4A6CF7",
      animation: "spin 0.7s linear infinite",
    }} />
    {label && (
      <span style={{ fontSize: 13.5, color: "#8B91A7", fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </span>
    )}
  </div>
));

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = React.memo(({ icon, title, subtitle }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "100%", gap: 12, padding: 32,
  }}>
    <div style={{
      width: 64, height: 64, borderRadius: 20,
      background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {icon}
    </div>
    <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#1A1D2E", fontFamily: "'Sora', sans-serif" }}>
      {title}
    </p>
    <p style={{ margin: 0, fontSize: 13, color: "#8B91A7", fontFamily: "'DM Sans', sans-serif", textAlign: "center", maxWidth: 260 }}>
      {subtitle}
    </p>
  </div>
));

// ─── PaginationBar ────────────────────────────────────────────────────────────
export const PaginationBar = React.memo(({ currentPage, totalPages, onGoTo, isLoading }) => {
  const pageNums = useMemo(() => {
    const delta = 1, range = [];
    const left  = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);
    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    if (totalPages > 1) range.push(totalPages);
    return range;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div style={S.paginationRow}>
      <button
        onClick={() => onGoTo(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        style={{ ...S.pageBtn, opacity: currentPage === 1 || isLoading ? 0.35 : 1 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {pageNums.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} style={{ fontSize: 13, color: "#B0B8D1", padding: "0 4px", fontFamily: "'DM Sans', sans-serif" }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onGoTo(p)}
            disabled={isLoading}
            style={{ ...S.pageBtn, ...(p === currentPage ? S.activePage : {}) }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onGoTo(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        style={{ ...S.pageBtn, opacity: currentPage === totalPages || isLoading ? 0.35 : 1 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
});

// ─── InternshipCard ───────────────────────────────────────────────────────────
const InternshipCard = React.memo(({
  internshipId, jobTitle, companyName, location,
  internshipType, internshipMode, compensationDetails,
  imgUrl, onClick, index,
}) => {
  const stipendShort = useMemo(() => {
    if (!compensationDetails) return "Free";
    const { type, amount, currency } = compensationDetails;
    if (type === "FREE" || !amount) return "Unpaid";
    return `${currency || ""} ${amount.toLocaleString()}`.trim();
  }, [compensationDetails]);

  const handleClick = useCallback(() =>
    onClick(internshipId, jobTitle, {
      companyName, imgUrl, internshipType, internshipMode, location,
    }),
  [onClick, internshipId, jobTitle, companyName, imgUrl, internshipType, internshipMode, location]);

  return (
    <div
      className="int-card"
      onClick={handleClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px", background: "#fff", borderRadius: 14,
        border: "1.5px solid #EEF0F4", cursor: "pointer",
        transition: "all 0.18s ease",
        animation: "cardIn 0.3s ease both",
        animationDelay: `${index * 0.04}s`,
      }}
    >
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={companyName || jobTitle}
          style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover", flexShrink: 0, border: "1.5px solid #EEF0F4" }}
          onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
        />
      ) : null}
      <div style={{ display: imgUrl ? "none" : "flex" }}>
        <Avatar title={jobTitle} size={44} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14.5, color: "#1A1D2E", fontFamily: "'Sora', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {jobTitle}
        </p>
        {(companyName || location) && (
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#5A607F", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {[companyName, location].filter(Boolean).join(" · ")}
          </p>
        )}
        <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
          {internshipType && (
            <span style={{
              fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
              fontFamily: "'DM Sans', sans-serif",
              background: internshipType === "PAID" ? "#DCFCE7" : "#FEF3C7",
              color:      internshipType === "PAID" ? "#166534" : "#92400E",
              border: `1px solid ${internshipType === "PAID" ? "#BBF7D0" : "#FDE68A"}`,
            }}>
              {internshipType === "PAID" ? `💰 ${stipendShort}` : "🆓 Free"}
            </span>
          )}
          {internshipMode && (
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 20, fontFamily: "'DM Sans', sans-serif", background: "#EEF2FF", color: "#3730A3", border: "1px solid #C7D2FE" }}>
              {internshipMode === "ONLINE" ? "🌐 Online" : internshipMode === "OFFLINE" ? "🏢 Offline" : "🔀 Hybrid"}
            </span>
          )}
          <span style={{ fontSize: 10.5, color: "#B0B8D1", fontFamily: "'DM Sans', sans-serif", padding: "2px 0" }}>
            #{String(internshipId).slice(-6)}
          </span>
        </div>
      </div>

      {IconChevronRight}
    </div>
  );
});

// ─── InternshipListView ───────────────────────────────────────────────────────
/**
 * Props:
 *   internships      {array}    — current page of internship objects
 *   intLoading       {boolean}  — initial full-page load
 *   intSearching     {boolean}  — search in progress
 *   intCurrentPage   {number}
 *   intTotalPages    {number}
 *   intTotalCount    {number}
 *   searchDraft      {string}   — live input value
 *   committedQuery   {string}   — last executed query (for empty-state copy)
 *   onCardClick      {fn}       — (id, title, extra) => void
 *   onSearchChange   {fn}       — (value) => void
 *   onSearchSubmit   {fn}       — () => void
 *   onPageChange     {fn}       — (page) => void
 */
const InternshipListView = ({
  internships,
  intLoading, intSearching,
  intCurrentPage, intTotalPages, intTotalCount,
  searchDraft, committedQuery,
  onCardClick, onSearchChange, onSearchSubmit, onPageChange,
}) => {
  const internshipList = useMemo(() =>
    internships.map(({ _id, jobTitle, companyName, location, internshipType, internshipMode, compensationDetails, imgUrl }, index) => (
      <InternshipCard
        key={_id}
        internshipId={_id}
        jobTitle={jobTitle}
        companyName={companyName}
        location={location}
        internshipType={internshipType}
        internshipMode={internshipMode}
        compensationDetails={compensationDetails}
        imgUrl={imgUrl}
        onClick={onCardClick}
        index={index}
      />
    )),
  [internships, onCardClick]);

  return (
    <>
      <style>{globalCss + CARD_HOVER_CSS}</style>
      <div style={S.listRoot}>

        {/* ── Header ── */}
        <div style={S.listHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={S.iconBox}>{IconMessages}</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1A1D2E", fontFamily: "'Sora', sans-serif" }}>
                Messages
              </h1>
              <p style={{ margin: 0, fontSize: 12.5, color: "#8B91A7" }}>
                {intLoading ? "Loading…" : `${intTotalCount} internship${intTotalCount !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Search */}
          <div style={S.searchWrap}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
                {IconSearch}
              </span>
              <input
                type="text"
                placeholder="Search internships…"
                value={searchDraft}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
                style={S.searchInput}
                onFocus={(e) => (e.target.style.borderColor = "#4A6CF7")}
                onBlur={(e)  => (e.target.style.borderColor = "#E8EAF2")}
              />
            </div>
            <button
              onClick={onSearchSubmit}
              disabled={intSearching}
              style={{ ...S.searchBtn, opacity: intSearching ? 0.65 : 1 }}
            >
              {intSearching ? "…" : "Search"}
            </button>
          </div>
        </div>

        {/* ── Card list ── */}
        <div style={S.listScroll}>
          {intLoading ? (
            <Spinner label="Loading internships…" />
          ) : internships.length === 0 ? (
            <EmptyState
              icon={IconEmptyList}
              title={committedQuery ? "No results found" : "No internships yet"}
              subtitle={committedQuery
                ? `No internships match "${committedQuery}"`
                : "You don't have any internships to message about."}
            />
          ) : (
            <div style={S.cardList}>{internshipList}</div>
          )}
        </div>

        {/* ── Footer / Pagination ── */}
        <div style={S.listFooter}>
          <PaginationBar
            currentPage={intCurrentPage}
            totalPages={intTotalPages}
            onGoTo={onPageChange}
            isLoading={intLoading || intSearching}
          />
          {intTotalCount > 0 && (
            <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 11.5, color: "#B0B8D1", fontFamily: "'DM Sans', sans-serif" }}>
              Showing {(intCurrentPage - 1) * INTERNSHIPS_PER_PAGE + 1}–
              {Math.min(intCurrentPage * INTERNSHIPS_PER_PAGE, intTotalCount)} of {intTotalCount}
            </p>
          )}
        </div>

      </div>
    </>
  );
};

export default InternshipListView;