import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chatbot() {
  const user = JSON.parse(localStorage.getItem("userInfo") || "{}") ?? {};
  const token = user?.token ?? "";

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

  const [replyCount, setReplyCount] = useState(user?.careerChatUsage ?? 0);
  const [isPremium, setIsPremium] = useState(
    user?.isPremium && new Date(user.premiumExpiration) > new Date()
  );

  const FREE_LIMIT = 10;
  const messagesRef = useRef(null);

  // Sync with latest backend user profile
useEffect(() => {
  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReplyCount(data.careerChatUsage ?? 0);
      setIsPremium(data.isPremium && new Date(data.premiumExpiration) > new Date());
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  };

  if (token) fetchUsage();
}, [token]);



  // Handle message sending
const sendMessage = async () => {
  if (!userInput.trim()) return;

  const userMsg = { type: "user", text: userInput.trim() };
  setChatHistory((prev) => [...prev, userMsg]);
  setUserInput("");
  setLoading(true);
  setError("");

  try {
    const res = await fetch("/api/career-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: userMsg.text }),
    });

    if (!res.ok) throw new Error("Backend error");

    const { reply } = await res.json();

    // Add bot reply to chat
    const botMsg = { type: "bot", text: reply };
    setChatHistory((prev) => [...prev, botMsg]);

    // 🔁 Re-fetch usage silently in background
    const resProfile = await fetch("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profile = await resProfile.json();

    setReplyCount(profile.careerChatUsage ?? 0);
    setIsPremium(profile.isPremium && new Date(profile.premiumExpiration) > new Date());

  } catch (err) {
    console.error("Chat error:", err);
    setError("❌ Could not connect to the AI chatbot. Please try again.");
  } finally {
    setLoading(false);
  }
};


  // Auto-scroll on new message
  useEffect(() => {
    if (!chatHistory.length) return;
    const last = chatHistory[chatHistory.length - 1];
    if (last.type !== "user") return;
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
    });
  }, [chatHistory]);

  // Persist chat history to session
  useEffect(() => {
    try {
      sessionStorage.setItem("careerChatHistory", JSON.stringify(chatHistory));
    } catch {}
  }, [chatHistory]);

  // Clear session on refresh
  useEffect(() => {
    const clear = () => sessionStorage.removeItem("careerChatHistory");
    window.addEventListener("beforeunload", clear);
    return () => window.removeEventListener("beforeunload", clear);
  }, []);

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

      {/* error message */}
      {error && <div className="text-red-500 text-sm mb-1">{error}</div>}

      {/* usage counter for freemium users */}
{/* usage counter – show only before limit */}
{/* {!isPremium && replyCount < FREE_LIMIT && !error.includes("You’ve used all 10 free replies") && (
  <p className="text-xs text-gray-500 mb-1">
    Replies used: {replyCount}/{FREE_LIMIT}
  </p>
)} */}



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
          disabled={loading || !userInput.trim()}
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </>
  );
}
