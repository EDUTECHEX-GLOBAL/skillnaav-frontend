// import React, { useEffect, useState } from "react";
// import axios from "../../../../api/axiosInstance";

// const TicketThread = ({ internshipId }) => {
//   const [ticket, setTicket] = useState(null);
//   const [newMessage, setNewMessage] = useState("");

//   const fetchTicket = async () => {
//     try {
//       const token = JSON.parse(localStorage.getItem("userToken"));
//       const res = await axios.get(`/api/tickets/internship/${internshipId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setTicket(res.data);
//     } catch (err) {
//       console.error("Error fetching ticket:", err);
//     }
//   };

//   const sendMessage = async () => {
//     if (!newMessage.trim()) return;

//     try {
//       const token = JSON.parse(localStorage.getItem("userToken"));
//       const res = await axios.post(
//         `/api/tickets/${ticket._id}/messages`,
//         { message: newMessage },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setTicket((prev) => ({
//         ...prev,
//         messages: [...prev.messages, res.data],
//       }));
//       setNewMessage("");
//     } catch (err) {
//       console.error("Error sending message:", err);
//     }
//   };

//   useEffect(() => {
//     fetchTicket();
//   }, [internshipId]);

//   if (!ticket) return <p>Loading ticket...</p>;

//   return (
//     <div className="space-y-4">
//       <div className="max-h-[300px] overflow-y-auto bg-gray-50 border p-3 rounded-md">
//         {ticket.messages.map((msg, i) => (
//           <div
//             key={i}
//             className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
//           >
//             <div
//               className={`p-2 px-4 rounded-lg text-sm max-w-[70%] my-1 ${
//                 msg.senderType === "user"
//                   ? "bg-purple-100 text-right"
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
//           className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };

// export default TicketThread;
import React, { useEffect, useState } from "react";

const TicketThread = ({ internshipId }) => {
  const [ticket, setTicket] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Simulate API call with a fake ticket
    const mockTicket = {
      _id: "mockTicket123",
      messages: [
        {
          senderType: "user",
          message: "Hello, I have a question about this internship.",
          timestamp: new Date().toISOString(),
        },
        {
          senderType: "partner",
          message: "Sure! Please let us know what your query is.",
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setTicket(mockTicket);
  }, [internshipId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      senderType: "user",
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    setTicket((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));
    setNewMessage("");
  };

  if (!ticket) return <p>Loading mock ticket...</p>;

  return (
    <div className="space-y-4">
      <div className="max-h-[300px] overflow-y-auto bg-gray-50 border p-3 rounded-md">
        {ticket.messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-2 px-4 rounded-lg text-sm max-w-[70%] my-1 ${
                msg.senderType === "user"
                  ? "bg-purple-100 text-right"
                  : "bg-white border"
              }`}
            >
              {msg.message}
              <div className="text-[10px] text-gray-400 mt-1">
                {new Date(msg.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border px-3 py-2 rounded"
        />
        <button
          onClick={sendMessage}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default TicketThread;
