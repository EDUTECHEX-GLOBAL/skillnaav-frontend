// ─── Message.js ───────────────────────────────────────────────────────────────
// Root orchestrator. Owns all state and data-fetching; renders either:
//   • A "no session" error screen
//   • <InternshipListView> (when no chat is open)
//   • <ChatView>           (when a chat is open)
//
// No JSX markup for list items or messages lives here — those are fully
// encapsulated inside their respective view components.

import React, {
  useState, useEffect, useRef,
  useCallback, useReducer,
} from "react";
import axios from "axios";

import InternshipListView from "./Internshiplistview";
import  ChatView     from "./Chatview";
import {
  resolvePartnerId, useDebounce,
  intInitial, intReducer,
  msgInitial, msgReducer,
  INTERNSHIPS_PER_PAGE, MESSAGES_PER_PAGE,
  S, globalCss, IconNoSession,
} from "./Chatconstants";

// ─── ChatInterface (root) ─────────────────────────────────────────────────────
const ChatInterface = () => {

  // ── Auth ──────────────────────────────────────────────────────────────────
  // resolvePartnerId is passed as a lazy initialiser — runs exactly once
  const [partnerId] = useState(resolvePartnerId);

  // ── Internship list ───────────────────────────────────────────────────────
  const [intState, intDispatch] = useReducer(intReducer, intInitial);
  const {
    list: internships,
    loading: intLoading, searching: intSearching,
    currentPage: intCurrentPage, totalPages: intTotalPages, totalCount: intTotalCount,
    searchDraft, committedQuery,
  } = intState;

  // ── Chat / selected internship ─────────────────────────────────────────────
  const [showChat, setShowChat] = useState(false);
  const [selected, setSelected] = useState({
    id: null, title: "", company: "",
    imgUrl: "", intType: "", intMode: "", location: "",
  });

  // ── Detail panel ──────────────────────────────────────────────────────────
  const [showDetailPanel, setShowDetailPanel]       = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [detailLoading, setDetailLoading]           = useState(false);

  // ── Messages ──────────────────────────────────────────────────────────────
  const [msgState, msgDispatch] = useReducer(msgReducer, msgInitial);
  const {
    list: messages,
    loading: msgLoading, paging: msgPaging,
    currentPage: msgCurrentPage, totalPages: msgTotalPages, totalCount: msgTotalCount,
  } = msgState;

  // ── Input / send ──────────────────────────────────────────────────────────
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef   = useRef(null);
  const inputRef         = useRef(null);
  const isIntInitialRef  = useRef(true);   // skip page-change effect on first render
  const isMsgInitialRef  = useRef(true);   // skip msg-page-change effect on first render
  const currentInternRef = useRef(null);   // keeps internship id for paged message fetches

  // ── Debounced search ──────────────────────────────────────────────────────
  const debouncedSearch = useDebounce(searchDraft, 400);

  // Log missing session once on mount
  useEffect(() => {
    if (!partnerId)
      console.warn("[ChatInterface] No partnerId in localStorage. Keys:", Object.keys(localStorage));
  }, []); // eslint-disable-line

  // ══════════════════════════════════════════════════════════════════════════
  // Internship fetching
  // ══════════════════════════════════════════════════════════════════════════
  const fetchInternships = useCallback(async (page, query, isFirst = false) => {
    if (!partnerId) return;
    intDispatch({ type: "FETCH_START", isFirst });
    try {
      const res = await axios.get(`/api/interns/partner/${partnerId}`, {
        params: { page, limit: INTERNSHIPS_PER_PAGE, search: query },
      });
      intDispatch({
        type: "FETCH_SUCCESS",
        data:       res.data.data       || [],
        totalPages: res.data.totalPages || 1,
        totalCount: res.data.total      || 0,
        query,
      });
    } catch (err) {
      console.error("fetchInternships:", err);
      intDispatch({ type: "FETCH_ERROR" });
    }
  }, [partnerId]);

  // Initial load
  useEffect(() => {
    if (!partnerId) return;
    fetchInternships(1, "", true);
    isIntInitialRef.current = false;
  }, [partnerId]); // eslint-disable-line

  // Page navigation
  useEffect(() => {
    if (isIntInitialRef.current) return;
    fetchInternships(intCurrentPage, committedQuery);
  }, [intCurrentPage]); // eslint-disable-line

  // Debounced auto-search
  useEffect(() => {
    if (isIntInitialRef.current) return;
    intDispatch({ type: "SET_PAGE", page: 1 });
    fetchInternships(1, debouncedSearch);
  }, [debouncedSearch]); // eslint-disable-line

  const handleSearchSubmit = useCallback(() => {
    intDispatch({ type: "SET_PAGE", page: 1 });
    fetchInternships(1, searchDraft);
  }, [searchDraft, fetchInternships]);

  // ══════════════════════════════════════════════════════════════════════════
  // Internship detail panel
  // ══════════════════════════════════════════════════════════════════════════
  const fetchInternshipDetail = useCallback(async (internshipId) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/interns/${internshipId}`);
      setSelectedInternship(res.data?.data || res.data || null);
    } catch (err) {
      console.error("fetchInternshipDetail:", err);
      setSelectedInternship(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleToggleDetailPanel = useCallback(() => {
    if (!showDetailPanel && selected.id) fetchInternshipDetail(selected.id);
    setShowDetailPanel((prev) => !prev);
  }, [showDetailPanel, selected.id, fetchInternshipDetail]);

  const handleCloseDetailPanel = useCallback(() => {
    setShowDetailPanel(false);
    setSelectedInternship(null);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Message fetching
  // ══════════════════════════════════════════════════════════════════════════
  const fetchMessages = useCallback(async (page, internshipId, isFirst = false) => {
    if (!partnerId || !internshipId) return;
    msgDispatch({ type: "FETCH_START", isFirst });
    try {
      const res = await axios.get(
        `/api/chats/partner/${partnerId}/internship/${internshipId}`,
        { params: { page, limit: MESSAGES_PER_PAGE } }
      );
      const payload = res.data;
      if (Array.isArray(payload)) {
        msgDispatch({ type: "FETCH_SUCCESS", data: payload, totalPages: 1, totalCount: payload.length });
      } else {
        msgDispatch({
          type: "FETCH_SUCCESS",
          data:       payload.data       || [],
          totalPages: payload.totalPages || 1,
          totalCount: payload.total      || 0,
        });
      }
    } catch (err) {
      console.error("fetchMessages:", err);
      msgDispatch({ type: "FETCH_ERROR" });
    }
  }, [partnerId]);

  // Open chat -> load first page
  useEffect(() => {
    if (!showChat || !selected.id) return;
    currentInternRef.current = selected.id;
    isMsgInitialRef.current  = false;
    fetchMessages(1, selected.id, true);
  }, [showChat, selected.id]); // eslint-disable-line

  // Message page change
  useEffect(() => {
    if (isMsgInitialRef.current) return;
    fetchMessages(msgCurrentPage, currentInternRef.current);
  }, [msgCurrentPage]); // eslint-disable-line

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (showChat) inputRef.current?.focus();
  }, [showChat]);

  // ══════════════════════════════════════════════════════════════════════════
  // Event handlers
  // ══════════════════════════════════════════════════════════════════════════
  const handleInternshipClick = useCallback((id, title, extra = {}) => {
    setSelected({
      id,
      title,
      company:  extra.companyName    || "",
      imgUrl:   extra.imgUrl         || "",
      intType:  extra.internshipType || "",
      intMode:  extra.internshipMode || "",
      location: extra.location       || "",
    });
    msgDispatch({ type: "RESET" });
    isMsgInitialRef.current = true;
    setShowDetailPanel(false);
    setSelectedInternship(null);
    setShowChat(true);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowChat(false);
    msgDispatch({ type: "RESET" });
    isMsgInitialRef.current = true;
    setShowDetailPanel(false);
    setSelectedInternship(null);
  }, []);

  const handleMsgPageChange = useCallback((page) =>
    msgDispatch({ type: "SET_PAGE", page }), []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !partnerId || !selected.id || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    setIsTyping(true);

    const optimistic = {
      message: text, sender: partnerId,
      timestamp: new Date().toISOString(),
      _id: `opt-${Date.now()}`,
    };
    msgDispatch({ type: "APPEND", msg: optimistic });

    try {
      const res = await axios.post(
        "/api/chats/send",
        { internshipId: selected.id, senderId: partnerId, message: text },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.status === 201) {
        msgDispatch({ type: "REPLACE_LAST", msg: res.data });
      }
    } catch (err) {
      console.error("handleSend:", err);
      msgDispatch({ type: "REMOVE", id: optimistic._id });
      setInput(text); // restore on failure
    } finally {
      setSending(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, [input, partnerId, selected.id, sending]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleTextareaChange = useCallback((e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px";
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  // ── No session ────────────────────────────────────────────────────────────
  if (!partnerId) {
    return (
      <>
        <style>{globalCss}</style>
        <div style={S.noSession}>
          <div style={{ textAlign: "center", padding: 32 }}>
            <div style={S.noSessionIcon}>{IconNoSession}</div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#1A1D2E", fontFamily: "'Sora', sans-serif" }}>
              Session not found
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8B91A7", maxWidth: 260 }}>
              Please log in again. Your partner session could not be found.
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────
  if (!showChat) {
    return (
      <InternshipListView
        internships={internships}
        intLoading={intLoading}
        intSearching={intSearching}
        intCurrentPage={intCurrentPage}
        intTotalPages={intTotalPages}
        intTotalCount={intTotalCount}
        searchDraft={searchDraft}
        committedQuery={committedQuery}
        onCardClick={handleInternshipClick}
        onSearchChange={(val) => intDispatch({ type: "SET_DRAFT", value: val })}
        onSearchSubmit={handleSearchSubmit}
        onPageChange={(p) => intDispatch({ type: "SET_PAGE", page: p })}
      />
    );
  }

  // ── Chat View ─────────────────────────────────────────────────────────────
  return (
    <ChatView
      selected={selected}
      partnerId={partnerId}
      messages={messages}
      msgLoading={msgLoading}
      msgPaging={msgPaging}
      msgCurrentPage={msgCurrentPage}
      msgTotalPages={msgTotalPages}
      msgTotalCount={msgTotalCount}
      isTyping={isTyping}
      sending={sending}
      input={input}
      inputRef={inputRef}
      messagesEndRef={messagesEndRef}
      showDetailPanel={showDetailPanel}
      detailLoading={detailLoading}
      selectedInternship={selectedInternship}
      onBack={handleBackToList}
      onMsgPageChange={handleMsgPageChange}
      onSend={handleSend}
      onKeyDown={handleKeyDown}
      onInputChange={handleTextareaChange}
      onToggleDetail={handleToggleDetailPanel}
      onCloseDetail={handleCloseDetailPanel}
    />
  );
};

export default ChatInterface;