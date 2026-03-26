// ─── ChatView.js ──────────────────────────────────────────────────────────────
// Renders the full chat column: header with back/info buttons, paginated message
// list, typing indicator, input bar, and the slide-in InternshipDetailPanel.

import React, { useMemo, useCallback } from "react";
import InternshipDetailPanel from "./InternshipDetailPanel";
import { PaginationBar } from "./Internshiplistview";
import {
  S, globalCss,
  fmtTime, getInitials, getAvatarColor,
  IconBack, IconInfo, IconSend, IconEmptyChat, SpinnerRing,
  PAID_PILL, FREE_PILL, MODE_PILL, ACTIVE_DOT, ACTIVE_WRAP,
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

// ─── TypingIndicator ──────────────────────────────────────────────────────────
const TYPING_DELAYS = [0, 0.15, 0.3];

const TypingIndicator = React.memo(() => (
  <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
    <div style={{
      background: "#fff", border: "1.5px solid #EEF0F4",
      borderRadius: "18px 18px 18px 4px", padding: "12px 16px",
      display: "flex", gap: 5, alignItems: "center",
    }}>
      {TYPING_DELAYS.map((delay, i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#B0B8D1",
          display: "inline-block",
          animation: "typing 1.2s ease-in-out infinite",
          animationDelay: `${delay}s`,
        }} />
      ))}
    </div>
  </div>
));

// ─── MessageBubble ────────────────────────────────────────────────────────────
const MessageBubble = React.memo(({ message, isOwn }) => (
  <div style={{
    display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start",
    marginBottom: 10, animation: "msgIn 0.2s ease both",
  }}>
    <div style={{
      maxWidth: "68%", padding: "10px 14px",
      borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      background: isOwn ? "linear-gradient(135deg, #4A6CF7 0%, #3B5BDB 100%)" : "#fff",
      color: isOwn ? "#fff" : "#1A1D2E",
      border: isOwn ? "none" : "1.5px solid #EEF0F4",
      boxShadow: isOwn ? "0 4px 14px rgba(74,108,247,0.25)" : "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <p style={{
        margin: 0, fontSize: 13.5, lineHeight: 1.55,
        fontFamily: "'DM Sans', sans-serif",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {message.message}
      </p>
      <p style={{
        margin: "5px 0 0", fontSize: 10.5, textAlign: "right",
        color: isOwn ? "rgba(255,255,255,0.65)" : "#A0A8C0",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {fmtTime(message.timestamp || message.createdAt)}
      </p>
    </div>
  </div>
));

// ─── MessagesPager ────────────────────────────────────────────────────────────
const MessagesPager = React.memo(({ currentPage, totalPages, onGoTo, totalCount, isLoading }) => {
  if (totalPages <= 1) return null;
  return (
    <div style={S.msgsPager}>
      <p style={S.pagerText}>
        Page {currentPage} of {totalPages} · {totalCount} total messages
      </p>
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        onGoTo={onGoTo}
        isLoading={isLoading}
      />
    </div>
  );
});

// ─── ChatView ─────────────────────────────────────────────────────────────────
/**
 * Props:
 *   selected           {object}   — { id, title, company, imgUrl, intType, intMode, location }
 *   partnerId          {string}
 *   messages           {array}
 *   msgLoading         {boolean}
 *   msgPaging          {boolean}
 *   msgCurrentPage     {number}
 *   msgTotalPages      {number}
 *   msgTotalCount      {number}
 *   isTyping           {boolean}
 *   sending            {boolean}
 *   input              {string}
 *   inputRef           {ref}
 *   messagesEndRef     {ref}
 *   showDetailPanel    {boolean}
 *   detailLoading      {boolean}
 *   selectedInternship {object|null}
 *   onBack             {fn}
 *   onMsgPageChange    {fn}       — (page) => void
 *   onSend             {fn}
 *   onKeyDown          {fn}
 *   onInputChange      {fn}
 *   onToggleDetail     {fn}
 *   onCloseDetail      {fn}
 */
const ChatView = ({
  selected,
  partnerId,
  messages,
  msgLoading, msgPaging,
  msgCurrentPage, msgTotalPages, msgTotalCount,
  isTyping, sending,
  input,
  inputRef, messagesEndRef,
  showDetailPanel, detailLoading, selectedInternship,
  onBack, onMsgPageChange, onSend, onKeyDown, onInputChange,
  onToggleDetail, onCloseDetail,
}) => {
  // Memoised message list — only rebuilds when messages or partnerId change
  const messageList = useMemo(() =>
    messages.map((msg, idx) => (
      <MessageBubble
        key={msg._id || idx}
        message={msg}
        isOwn={msg.sender === partnerId}
      />
    )),
  [messages, partnerId]);

  // Memoised info-button style — depends only on showDetailPanel
  const infoBtnStyle = useMemo(() => ({
    background: showDetailPanel ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
    border: showDetailPanel ? "1.5px solid rgba(255,255,255,0.5)" : "1.5px solid rgba(255,255,255,0.2)",
    borderRadius: 10, width: 36, height: 36, cursor: "pointer", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s ease",
  }), [showDetailPanel]);

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ ...S.rowFull, background: "#F4F6FD", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Chat Column ── */}
        <div style={S.chatCol}>

          {/* Header */}
          <div style={S.chatHeader}>
            <div style={S.headerRow}>

              <button className="back-btn" onClick={onBack} style={S.backBtn}>
                {IconBack}
              </button>

              {selected.imgUrl ? (
                <img
                  src={selected.imgUrl}
                  alt={selected.title}
                  style={S.headerImg}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <Avatar title={selected.title} size={42} />
              )}

              <div style={S.headerMeta}>
                <p style={S.headerTitle}>{selected.title}</p>
                {(selected.company || selected.location) && (
                  <p style={S.headerSub}>
                    {[selected.company, selected.location].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div style={S.pillRow}>
                  {selected.intType && (
                    <span style={selected.intType === "PAID" ? PAID_PILL : FREE_PILL}>
                      {selected.intType === "PAID" ? "💰 Paid" : "🆓 Free"}
                    </span>
                  )}
                  {selected.intMode && (
                    <span style={MODE_PILL}>
                      {selected.intMode === "ONLINE" ? "🌐 Online"
                        : selected.intMode === "OFFLINE" ? "🏢 Offline"
                        : "🔀 Hybrid"}
                    </span>
                  )}
                  <span style={ACTIVE_WRAP}>
                    <span style={ACTIVE_DOT} />
                    Active now
                  </span>
                </div>
              </div>

              {msgTotalCount > 0 && (
                <div style={S.msgCount}>
                  <span style={S.msgCountText}>
                    {msgTotalCount} msg{msgTotalCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <button
                className="info-btn"
                onClick={onToggleDetail}
                title={showDetailPanel ? "Hide details" : "View internship details"}
                style={infoBtnStyle}
              >
                {IconInfo}
              </button>

            </div>
          </div>

          {/* Messages area */}
          <div style={S.msgArea}>
            {msgLoading ? (
              <Spinner label="Loading messages…" />
            ) : messages.length === 0 ? (
              <EmptyState
                icon={IconEmptyChat}
                title="No messages yet"
                subtitle="Send a message to start the conversation."
              />
            ) : (
              <>
                <MessagesPager
                  currentPage={msgCurrentPage}
                  totalPages={msgTotalPages}
                  onGoTo={onMsgPageChange}
                  totalCount={msgTotalCount}
                  isLoading={msgPaging}
                />
                {msgPaging
                  ? <div style={{ paddingTop: 24 }}><Spinner label="Loading page…" /></div>
                  : messageList
                }
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input bar */}
          <div style={S.inputBar}>
            <div style={S.inputRow}>
              <div style={{ flex: 1 }}>
                <textarea
                  ref={inputRef}
                  className="chat-textarea"
                  placeholder="Type a message…"
                  value={input}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  rows={1}
                  disabled={sending}
                  style={S.textarea}
                  onFocus={(e) => (e.target.style.borderColor = "#4A6CF7")}
                  onBlur={(e)  => (e.target.style.borderColor = "#E8EAF2")}
                />
              </div>
              <button
                className="send-btn"
                onClick={onSend}
                disabled={!input.trim() || sending}
                style={S.sendBtn}
              >
                {sending ? SpinnerRing : IconSend}
              </button>
            </div>
            <p style={S.hintText}>Enter to send · Shift+Enter for new line</p>
          </div>

        </div>

        {/* ── Detail Panel ── */}
        {showDetailPanel && (
          <div className="detail-panel" style={{ flexShrink: 0 }}>
            {detailLoading ? (
              <div style={{ width: 320, borderLeft: "1px solid #e9ecef", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Spinner label="Loading details…" />
              </div>
            ) : (
              <InternshipDetailPanel
                internship={selectedInternship}
                onClose={onCloseDetail}
              />
            )}
          </div>
        )}

      </div>
    </>
  );
};

export default ChatView;