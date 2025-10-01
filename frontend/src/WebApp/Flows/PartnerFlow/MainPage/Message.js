import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Component for Internship Card
const InternshipCard = ({ internshipId, jobTitle, onClick }) => (
  <div
    className="p-4 mb-4 bg-white shadow-lg rounded-lg cursor-pointer hover:bg-gray-100 transition duration-200"
    onClick={() => onClick(internshipId, jobTitle)}
  >
    <h3 className="text-lg font-bold text-gray-700">{jobTitle}</h3>
    <p className="text-sm text-gray-500">Internship ID: {internshipId}</p>
  </div>
);

// Main Chat Interface
const ChatInterface = () => {
  const [internships, setInternships] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);
  const [selectedInternshipTitle, setSelectedInternshipTitle] = useState("");
  const [showChat, setShowChat] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Load partnerId and adminId from localStorage
  useEffect(() => {
    const storedPartnerId = localStorage.getItem("partnerId");
    const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));

    if (storedPartnerId) setPartnerId(storedPartnerId);
    if (adminInfo?.id) setAdminId(adminInfo.id);
  }, []);

  // Fetch internships
  useEffect(() => {
    const fetchInternships = async () => {
      if (!partnerId) return;

      try {
        const response = await axios.get(`/api/interns/partner/${partnerId}`);
        setInternships(response.data || []);
      } catch (err) {
        console.error("Error fetching internships:", err);
      }
    };

    fetchInternships();
  }, [partnerId]);

  // Fetch messages for selected internship
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

  // Handle selecting an internship
  const handleInternshipClick = (id, jobTitle) => {
    setSelectedInternshipId(id);
    setSelectedInternshipTitle(jobTitle);
    setShowChat(true);
    fetchMessages(id);
  };

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim() || !adminId || !partnerId || !selectedInternshipId) return;

    const newMessage = {
      internshipId: selectedInternshipId,
      senderId: partnerId,
      receiverId: adminId,
      message: input.trim(),
    };

    try {
      const response = await axios.post("/api/chats/send", newMessage, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        setMessages((prev) => [...prev, response.data]);
        setInput("");
      } else {
        console.error("Unexpected response status:", response.status);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Render internship list if chat is not open
  if (!showChat) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        {internships.length === 0 ? (
          <div className="text-gray-500">No internships found.</div>
        ) : (
          internships.map(({ _id, jobTitle }) => (
            <InternshipCard
              key={_id}
              internshipId={_id}
              jobTitle={jobTitle}
              onClick={handleInternshipClick}
            />
          ))
        )}
      </div>
    );
  }

  // Chat UI
  return (
    <div className="flex flex-col font-poppins h-screen bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white shadow-md flex items-center justify-between">
        <button
          className="text-blue-500 hover:text-blue-700 font-medium"
          onClick={() => setShowChat(false)}
        >
          ← Back
        </button>
        <h2 className="text-lg font-semibold">
          Chat - {selectedInternshipTitle} (ID: {selectedInternshipId})
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">No messages yet.</div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === partnerId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-sm p-3 rounded-lg shadow-md ${
                  msg.sender === partnerId ? "bg-blue-100 text-right" : "bg-gray-200 text-left"
                }`}
              >
                <div className="text-sm text-gray-700">{msg.message}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t flex items-center">
        <input
          type="text"
          className="flex-grow p-2 border rounded-lg focus:outline-none"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
