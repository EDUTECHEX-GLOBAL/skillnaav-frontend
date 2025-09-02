import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiMessageCircle, FiX } from "react-icons/fi";
import ReactMarkdown from "react-markdown";

const Chatbot = ({ featureIndex = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef(null);
  const toggleChat = () => setIsOpen(!isOpen);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
  const text = input.trim();
  if (!text) return;

  // Add the user message and clear the input RIGHT AWAY
  const userMessage = { sender: "user", text };
  setMessages((prev) => [...prev, userMessage]);
  setInput("");

  try {
    const partnerId = localStorage.getItem("partnerId");

    const res = await axios.post("/api/chatbot", {
      message: text,          // use the captured text
      partnerId,
      featureIndex,           // keep passing your sidebar features
    });

    const botMessage = { sender: "bot", text: res.data.reply };
    setMessages((prev) => [...prev, botMessage]);
  } catch (err) {
    const errorMessage = {
      sender: "bot",
      text: "Something went wrong. Try again.",
    };
    setMessages((prev) => [...prev, errorMessage]);
  }
};

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg"
        >
          <FiMessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="w-80 h-[450px] bg-white shadow-xl rounded-lg flex flex-col border overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-3 bg-blue-600 text-white rounded-t-lg">
            <span className="font-semibold">Chat Assistant</span>
            <FiX onClick={toggleChat} className="cursor-pointer" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm scroll-smooth scrollbar-hide">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`w-full flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-[75%] whitespace-pre-wrap break-words ${msg.sender === "user"
                    ? "bg-blue-400 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                    }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="my-1" {...props} />,
                      li: ({ node, ...props }) => <li className="ml-4 list-disc" {...props} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t bg-white">
            <div className="flex items-stretch gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="mt-5 flex-1 border rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Ask something..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="mt-5 px-4 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
