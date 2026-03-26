// ─── chatConstants.js ─────────────────────────────────────────────────────────
// Shared constants, pure helpers, reducers, static styles, and hoisted icons.
// No React components live here — import this wherever needed.

import { useState, useEffect } from "react";

// ─── Pagination constants ─────────────────────────────────────────────────────
export const INTERNSHIPS_PER_PAGE = 6;
export const MESSAGES_PER_PAGE    = 20;

// ─── Pure helpers ─────────────────────────────────────────────────────────────
export const getInitials = (title = "") =>
  title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const avatarColors = [
  "#3B5BDB", "#1971C2", "#0C8599", "#2F9E44",
  "#E67700", "#C92A2A", "#862E9C", "#5C7CFA",
];
export const getAvatarColor = (str = "") =>
  avatarColors[str.charCodeAt(0) % avatarColors.length];

export const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── Auth resolver ────────────────────────────────────────────────────────────
export const resolvePartnerId = () => {
  const direct =
    localStorage.getItem("partnerId") ||
    localStorage.getItem("partner_id") ||
    localStorage.getItem("userId") ||
    localStorage.getItem("id");
  if (direct) return String(direct);

  for (const key of ["partner", "user", "authUser"]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const id = parsed?._id || parsed?.id || parsed?.partnerId;
      if (id) return String(id);
    } catch { /* not JSON */ }
  }
  return null;
};

// ─── Debounce hook ────────────────────────────────────────────────────────────
export const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ─── Internship list reducer ──────────────────────────────────────────────────
export const intInitial = {
  list: [], loading: false, searching: false,
  currentPage: 1, totalPages: 1, totalCount: 0,
  searchDraft: "", committedQuery: "",
};
export const intReducer = (s, a) => {
  switch (a.type) {
    case "FETCH_START":   return { ...s, [a.isFirst ? "loading" : "searching"]: true };
    case "FETCH_SUCCESS": return {
      ...s, loading: false, searching: false,
      list: a.data, totalPages: a.totalPages,
      totalCount: a.totalCount, committedQuery: a.query,
    };
    case "FETCH_ERROR":   return { ...s, loading: false, searching: false, list: [] };
    case "SET_PAGE":      return { ...s, currentPage: a.page };
    case "SET_DRAFT":     return { ...s, searchDraft: a.value };
    default:              return s;
  }
};

// ─── Messages reducer ─────────────────────────────────────────────────────────
export const msgInitial = {
  list: [], loading: false, paging: false,
  currentPage: 1, totalPages: 1, totalCount: 0,
};
export const msgReducer = (s, a) => {
  switch (a.type) {
    case "FETCH_START":   return { ...s, [a.isFirst ? "loading" : "paging"]: true };
    case "FETCH_SUCCESS": return {
      ...s, loading: false, paging: false,
      list: a.data, totalPages: a.totalPages, totalCount: a.totalCount,
    };
    case "FETCH_ERROR":   return { ...s, loading: false, paging: false, list: [] };
    case "SET_PAGE":      return { ...s, currentPage: a.page };
    case "APPEND":        return { ...s, list: [...s.list, a.msg] };
    case "REPLACE_LAST":  return { ...s, list: [...s.list.slice(0, -1), a.msg], totalCount: s.totalCount + 1 };
    case "REMOVE":        return { ...s, list: s.list.filter((m) => m._id !== a.id) };
    case "RESET":         return { ...msgInitial };
    default:              return s;
  }
};

// ─── Static styles ────────────────────────────────────────────────────────────
export const S = {
  // Layout
  rowFull:     { height: "100vh", display: "flex", flexDirection: "row", overflow: "hidden" },
  chatCol:     { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },

  // List view
  listRoot:    { height: "100vh", display: "flex", flexDirection: "column", background: "#fff", fontFamily: "'DM Sans', sans-serif" },
  listHeader:  { borderBottom: "1.5px solid #EEF0F4", padding: "22px 24px 18px", flexShrink: 0 },
  listScroll:  { flex: 1, overflowY: "auto", padding: "14px 20px 0" },
  listFooter:  { padding: "14px 24px 20px", flexShrink: 0, borderTop: "1px solid #F4F5F9" },
  cardList:    { display: "flex", flexDirection: "column", gap: 8 },
  iconBox:     {
    width: 40, height: 40, borderRadius: 12,
    background: "linear-gradient(135deg, #4A6CF7, #3B5BDB)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px rgba(74,108,247,0.3)",
  },

  // Search
  searchWrap:  { display: "flex", gap: 8 },
  searchInput: {
    width: "100%", padding: "10px 14px 10px 34px",
    border: "1.5px solid #E8EAF2", borderRadius: 10,
    fontSize: 13.5, color: "#1A1D2E",
    fontFamily: "'DM Sans', sans-serif",
    background: "#F8F9FF", outline: "none",
    transition: "border-color 0.15s ease",
  },
  searchBtn: {
    padding: "10px 20px", borderRadius: 10,
    background: "linear-gradient(135deg, #4A6CF7, #3B5BDB)",
    color: "#fff", border: "none",
    fontSize: 13.5, fontWeight: 600, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "opacity 0.15s",
    boxShadow: "0 3px 10px rgba(74,108,247,0.25)",
  },

  // Chat header
  chatHeader: {
    background: "linear-gradient(135deg, #4A6CF7 0%, #3B5BDB 100%)",
    padding: "14px 20px", flexShrink: 0,
    boxShadow: "0 4px 20px rgba(74,108,247,0.3)",
  },
  headerRow:   { display: "flex", alignItems: "center", gap: 12 },
  backBtn: {
    background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10,
    width: 36, height: 36, cursor: "pointer", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s ease",
  },
  headerImg: {
    width: 42, height: 42, borderRadius: 12,
    objectFit: "cover", flexShrink: 0,
    border: "2px solid rgba(255,255,255,0.3)",
  },
  headerMeta:  { flex: 1, minWidth: 0 },
  headerTitle: {
    margin: 0, fontWeight: 700, fontSize: 15, color: "#fff",
    fontFamily: "'Sora', sans-serif",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  headerSub: {
    margin: "1px 0 4px", fontSize: 11.5,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  pillRow:     { display: "flex", gap: 5, flexWrap: "wrap" },
  msgCount: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: 20, padding: "3px 10px", flexShrink: 0,
  },
  msgCountText: {
    fontSize: 12, color: "rgba(255,255,255,0.85)",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
  },

  // Messages area
  msgArea:     { flex: 1, overflowY: "auto", padding: "16px 20px 10px" },
  msgsPager: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 8, padding: "8px 0 14px",
    borderBottom: "1px dashed #EEF0F4", marginBottom: 12,
  },
  pagerText: {
    margin: 0, fontSize: 11.5, color: "#B0B8D1",
    fontFamily: "'DM Sans', sans-serif",
  },

  // Input bar
  inputBar: {
    background: "#fff", borderTop: "1.5px solid #EEF0F4",
    padding: "14px 18px 16px", flexShrink: 0,
    boxShadow: "0 -4px 20px rgba(0,0,0,0.04)",
  },
  inputRow:    { display: "flex", alignItems: "flex-end", gap: 10 },
  textarea: {
    width: "100%", padding: "11px 16px",
    border: "1.5px solid #E8EAF2", borderRadius: 14,
    fontSize: 13.5, color: "#1A1D2E", resize: "none",
    fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
    minHeight: 46, maxHeight: 110, overflow: "auto",
    background: "#FAFBFF", transition: "border-color 0.15s ease",
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 14, border: "none",
    background: "linear-gradient(135deg, #4A6CF7, #3B5BDB)",
    color: "#fff", cursor: "pointer", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.18s ease",
    boxShadow: "0 4px 14px rgba(74,108,247,0.35)",
  },
  hintText: {
    margin: "8px 0 0", textAlign: "center", fontSize: 11.5,
    color: "#C5CAD9", fontFamily: "'DM Sans', sans-serif",
  },

  // Pagination
  paginationRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 5 },
  pageBtn: {
    minWidth: 34, height: 34, borderRadius: 8,
    border: "1.5px solid #E8EAF2", background: "#fff",
    color: "#5A607F", fontSize: 13, fontWeight: 500,
    cursor: "pointer", transition: "all 0.15s ease",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 8px",
  },
  activePage: {
    background: "#4A6CF7", borderColor: "#4A6CF7",
    color: "#fff", fontWeight: 700,
  },

  // No session
  noSession: {
    height: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#fff",
    fontFamily: "'DM Sans', sans-serif",
  },
  noSessionIcon: {
    width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
    background: "#FEE2E2", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
};

// ─── Chat header pill styles ──────────────────────────────────────────────────
export const PAID_PILL  = { fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, fontFamily: "'DM Sans', sans-serif", color: "#fff", background: "rgba(74,222,128,0.2)",  border: "1px solid rgba(74,222,128,0.4)"  };
export const FREE_PILL  = { fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, fontFamily: "'DM Sans', sans-serif", color: "#fff", background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)"  };
export const MODE_PILL  = { fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, fontFamily: "'DM Sans', sans-serif", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" };
export const ACTIVE_DOT = { width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" };
export const ACTIVE_WRAP= { display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif" };

// ─── CSS hover rule for InternshipCard ───────────────────────────────────────
export const CARD_HOVER_CSS = `
  .int-card:hover {
    border-color: #4A6CF7 !important;
    box-shadow: 0 4px 20px rgba(74,108,247,0.12) !important;
    transform: translateY(-2px) !important;
  }
`;

// ─── Global CSS ───────────────────────────────────────────────────────────────
export const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap');

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes typing {
    0%, 100% { transform: translateY(0); opacity: 0.4; }
    50%       { transform: translateY(-4px); opacity: 1; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  * { box-sizing: border-box; }
  .chat-textarea { outline: none !important; }
  .chat-textarea::placeholder { color: #B0B8D1; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D6DAE8; border-radius: 10px; }
  .send-btn:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(74,108,247,0.4) !important;
  }
  .send-btn:disabled { opacity: 0.45 !important; cursor: not-allowed !important; }
  .back-btn:hover  { background: rgba(255,255,255,0.14) !important; }
  .info-btn:hover  { background: rgba(255,255,255,0.2)  !important; }
  .detail-panel    { animation: slideIn 0.22s ease both; }
`;

// ─── Hoisted SVG icons ────────────────────────────────────────────────────────
export const IconBack = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
export const IconInfo = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12"    y2="12" />
    <line x1="12" y1="8"  x2="12.01" y2="8"  />
  </svg>
);
export const IconSend = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
export const IconChevronRight = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5CAD9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
export const IconSearch = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B0B8D1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);
export const IconMessages = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
export const IconEmptyChat = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A6CF7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
export const IconEmptyList = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A6CF7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
export const IconNoSession = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8"  x2="12"    y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ─── Hoisted spinner ring (used inside send button) ───────────────────────────
export const SpinnerRing = (
  <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
);