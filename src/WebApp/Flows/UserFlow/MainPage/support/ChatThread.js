// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const ChatThread = ({ internshipId }) => {
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");

//   const fetchMessages = async () => {
//     try {
//       const token = JSON.parse(localStorage.getItem("userToken"));
//       const res = await axios.get(`/api/chat/${internshipId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setMessages(res.data || []);
//     } catch (err) {
//       console.error("Error loading chat:", err);
//     }
//   };

//   const sendMessage = async () => {
//     if (!newMessage.trim()) return;

//     try {
//       const token = JSON.parse(localStorage.getItem("userToken"));
//       const res = await axios.post(
//         `/api/chat/${internshipId}/send`,
//         { message: newMessage },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setMessages((prev) => [...prev, res.data]);
//       setNewMessage("");
//     } catch (err) {
//       console.error("Error sending chat message:", err);
//     }
//   };

//   useEffect(() => {
//     fetchMessages();
//   }, [internshipId]);

//   return (
//     <div className="space-y-4">
//       <div className="max-h-[300px] overflow-y-auto bg-gray-50 border p-3 rounded-md">
//         {messages.map((msg, i) => (
//           <div
//             key={i}
//             className={`flex ${msg.isFromUser ? "justify-end" : "justify-start"}`}
//           >
//             <div
//               className={`p-2 px-4 rounded-lg text-sm max-w-[70%] my-1 ${
//                 msg.isFromUser
//                   ? "bg-blue-100 text-right"
//                   : "bg-white border"
//               }`}
//             >
//               {msg.message}
//               <div className="text-[10px] text-gray-400 mt-1">
//                 {new Date(msg.timestamp).toLocaleString()}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="flex gap-2">
//         <input
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           placeholder="Type your message..."
//           className="flex-1 border px-3 py-2 rounded"
//         />
//         <button
//           onClick={sendMessage}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ChatThread;

import React, { useEffect, useState } from "react";

const ChatThread = ({ internshipId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Mock data for now
    const mockMessages = [
      {
        isFromUser: true,
        message: "Hi, I wanted to confirm the start date?",
        timestamp: new Date().toISOString(),
      },
      {
        isFromUser: false,
        message: "Hello! The internship starts on March 24th.",
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(mockMessages);
  }, [internshipId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const newMsg = {
      isFromUser: true,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[400px] bg-white/70 backdrop-blur-md rounded-xl shadow-lg p-4 font-poppins">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.isFromUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-2xl px-4 py-2 text-sm max-w-[75%] shadow-md ${
                msg.isFromUser
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p>{msg.message}</p>
              <p className="text-[10px] text-gray-300 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-all"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatThread;
