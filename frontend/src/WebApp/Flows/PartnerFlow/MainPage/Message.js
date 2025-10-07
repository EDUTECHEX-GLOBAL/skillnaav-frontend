import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Enhanced Internship Card with modern design
const InternshipCard = ({ internshipId, jobTitle, onClick, hasUnread = false }) => (
  <div
    className="group relative p-5 mb-4 bg-white shadow-lg rounded-2xl cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-blue-200"
    onClick={() => onClick(internshipId, jobTitle)}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
          {jobTitle}
        </h3>
        <p className="text-sm text-gray-500 mt-1">ID: {internshipId}</p>
      </div>
      {hasUnread && (
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      )}
      <div className="ml-4 text-gray-400 group-hover:text-blue-500 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
);

// Enhanced Message Bubble Component with improved styling
const MessageBubble = ({ message, isOwn, timestamp }) => (
  <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
      isOwn 
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
    }`}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
      <p className={`text-xs mt-2 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
        {new Date(message.timestamp || message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  </div>
);

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex justify-start mb-4">
    <div className="bg-gray-200 rounded-2xl px-4 py-3 rounded-bl-md">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  </div>
);

// Main Enhanced Chat Interface
const ChatInterface = () => {
  const [internships, setInternships] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);
  const [selectedInternshipTitle, setSelectedInternshipTitle] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (showChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showChat]);

  // Load partnerId and adminId from localStorage
  useEffect(() => {
    const storedPartnerId = localStorage.getItem("partnerId");
    const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));

    if (storedPartnerId) setPartnerId(storedPartnerId);
    if (adminInfo?.id) setAdminId(adminInfo.id);
  }, []);

  // Fetch internships with loading state
  useEffect(() => {
    const fetchInternships = async () => {
      if (!partnerId) return;

      setLoading(true);
      try {
        const response = await axios.get(`/api/interns/partner/${partnerId}`);
        setInternships(response.data || []);
      } catch (err) {
        console.error("Error fetching internships:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, [partnerId]);

  // Enhanced message fetching with better UX
  const fetchMessages = async (internshipId) => {
    if (!partnerId || !internshipId) return;

    setLoading(true);
    try {
      const response = await axios.get(`/api/chats/partner/${partnerId}/internship/${internshipId}`);
      setMessages(response.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle internship selection with smooth transition
  const handleInternshipClick = (id, jobTitle) => {
    setSelectedInternshipId(id);
    setSelectedInternshipTitle(jobTitle);
    setShowChat(true);
    fetchMessages(id);
  };

  // Enhanced message sending with optimistic UI and better UX feedback
  const handleSend = async () => {
    if (!input.trim() || !adminId || !partnerId || !selectedInternshipId || sending) return;

    const messageText = input.trim();
    setInput("");
    setSending(true);
    setIsTyping(true);

    // Optimistic UI update
    const optimisticMessage = {
      message: messageText,
      sender: partnerId,
      timestamp: new Date().toISOString(),
      _id: Date.now() // temporary ID
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const newMessage = {
        internshipId: selectedInternshipId,
        senderId: partnerId,
        receiverId: adminId,
        message: messageText,
      };

      const response = await axios.post("/api/chats/send", newMessage, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        // Replace optimistic message with server response
        setMessages(prev => [
          ...prev.slice(0, -1),
          response.data
        ]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
      setInput(messageText); // Restore input
    } finally {
      setSending(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key press and auto-resize textarea
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // Internship List View with FIXED header and scrollable content
  if (!showChat) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
        {/* FIXED Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
            <p className="text-gray-600 mt-1">Select an internship to start chatting</p>
          </div>
        </div>

        {/* SCROLLABLE Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-600">Loading internships...</p>
              </div>
            ) : internships.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No internships found</h3>
                <p className="text-gray-500">You don't have any internships to message about yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {internships.map(({ _id, jobTitle }) => (
                  <InternshipCard
                    key={_id}
                    internshipId={_id}
                    jobTitle={jobTitle}
                    onClick={handleInternshipClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Chat UI with modern design
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Enhanced Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <button
              className="mr-4 p-2 hover:bg-blue-700 rounded-full transition-all duration-200"
              onClick={() => setShowChat(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold">{selectedInternshipTitle}</h2>
              <p className="text-blue-100 text-sm">ID: {selectedInternshipId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-100">Online</span>
          </div>
        </div>
      </div>

      {/* SCROLLABLE Messages Area with enhanced styling */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-600">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Start the conversation</h3>
              <p className="text-gray-500">Send a message to begin chatting about this internship.</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg._id || idx}
                message={msg}
                isOwn={msg.sender === partnerId}
                timestamp={msg.timestamp || msg.createdAt}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0 shadow-lg">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 min-h-[48px] max-h-[120px]"
              placeholder="Type your message..."
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyPress}
              rows={1}
              disabled={sending}
            />
            <div className="absolute right-3 bottom-3">
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
          </div>
          <button
            className={`p-3 rounded-2xl transition-all duration-200 ${
              input.trim() && !sending
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
