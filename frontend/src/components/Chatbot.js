// src/components/Chatbot.jsx
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chatbot() {
  /* ---------- user & limits ---------- */
  const user =
    JSON.parse(localStorage.getItem("userInfo") || "{}") ?? {};
  const isPremium =
    user.isPremium && new Date(user.premiumExpiration) > new Date();
  const FREE_LIMIT = 10; // change if you raise the cap

  /* ---------- state ---------- */
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem("careerChatHistory");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------- refs ---------- */
  const messagesRef = useRef(null);

  /* ---------- sendMessage ---------- */
  const sendMessage = async () => {
    // stop non-premium users at FREE_LIMIT replies
    if (
      !isPremium &&
      chatHistory.filter((m) => m.type === "bot").length >= FREE_LIMIT
    ) {
      setError(
        `⚠️ You’ve used all ${FREE_LIMIT} free replies. ` +
          `Upgrade to Premium for unlimited chat.`
      );
      return;
    }

    if (!userInput.trim()) return;

    const userMsg = { type: "user", text: userInput.trim() };
    setChatHistory((prev) => [...prev, userMsg]);
    setUserInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/career-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });
      if (!res.ok) throw new Error("Backend error");

      const { reply } = await res.json();
      const botMsg = { type: "bot", text: reply };
      setChatHistory((prev) => [...prev, botMsg]);
    } catch {
      setError("❌ Could not connect to the AI chatbot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- auto-scroll ---------- */
  useEffect(() => {
    if (!chatHistory.length) return;
    const last = chatHistory[chatHistory.length - 1];
    if (last.type !== "user") return;
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [chatHistory]);

  /* ---------- persist chat history ---------- */
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "careerChatHistory",
        JSON.stringify(chatHistory)
      );
    } catch {}
  }, [chatHistory]);

  /* ---------- clear on refresh ---------- */
  useEffect(() => {
    const clear = () => sessionStorage.removeItem("careerChatHistory");
    window.addEventListener("beforeunload", clear);
    return () => window.removeEventListener("beforeunload", clear);
  }, []);

  /* ---------- UI ---------- */
  return (
    <>
      {/* messages */}
      <div
        ref={messagesRef}
        className="h-96 overflow-y-auto mb-2 space-y-2 scrollbar-none"
      >
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-md break-words ${
              msg.type === "user"
                ? "bg-blue-100 text-right ml-10 whitespace-pre-wrap"
                : "bg-gray-100 text-left mr-10"
            }`}
          >
            {msg.type === "bot" ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>
              </div>
            ) : (
              msg.text
            )}
          </div>
        ))}
      </div>

      {/* error */}
      {error && <div className="text-red-500 text-sm mb-1">{error}</div>}

      {/* usage counter for free users */}
      {!isPremium && (
        <p className="text-xs text-gray-500 mb-1">
          Replies used&nbsp;
          {chatHistory.filter((m) => m.type === "bot").length}/{FREE_LIMIT}
        </p>
      )}

      {/* input + send */}
      <div className="flex items-center">
        <input
          type="text"
          className="flex-1 h-10 mt-0 border rounded-l px-3 text-sm focus:outline-none"
          placeholder="Ask about SkillNaav related"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="h-10 bg-blue-600 text-white px-4 rounded-r disabled:opacity-50 flex-shrink-0"
          disabled={
            loading ||
            !userInput.trim() ||
            (!isPremium &&
              chatHistory.filter((m) => m.type === "bot").length >=
                FREE_LIMIT)
          }
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </>
  );
}
