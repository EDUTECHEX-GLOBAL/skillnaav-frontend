// import React, { useEffect, useState } from "react";
// import axios from "../../../../api/axiosInstance";
// import ChatPage from "./ChatPage";
// import TicketsPage from "./TicketsPage";

// const Support = () => {
//   const [isPremium, setIsPremium] = useState(false);
//   const [appliedInternships, setAppliedInternships] = useState([]);
//   const [selectedInternship, setSelectedInternship] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       const userInfo = (JSON.parse(localStorage.getItem("studentInfo")) || JSON.parse(localStorage.getItem("userInfo")));
//       const token = JSON.parse(localStorage.getItem("userToken"));
//       setIsPremium(userInfo?.isPremium);

//       const studentId = userInfo?._id;
//       if (!studentId || !token) return;

//       try {
//         const res = await axios.get(
//           `/api/applications/student/${studentId}/applications`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//         setAppliedInternships(res.data.applications || []);
//       } catch (err) {
//         console.error("Error fetching applied internships:", err);
//       }

//       setLoading(false);
//     };

//     fetchData();
//   }, []);

//   if (loading) return <div className="p-4">Loading your applied internships...</div>;

//   if (selectedInternship) {
//     return isPremium ? (
//       <ChatPage internship={selectedInternship} goBack={() => setSelectedInternship(null)} />
//     ) : (
//       <TicketsPage internship={selectedInternship} goBack={() => setSelectedInternship(null)} />
//     );
//   }

//   return (
//     <div className="p-4 font-poppins">
//       <h2 className="text-2xl font-semibold mb-4 text-purple-700">Support Center</h2>

//       {appliedInternships.length === 0 ? (
//         <p className="text-gray-600">You haven’t applied to any internships yet.</p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {appliedInternships.map((app) => {
//             const internship = app.internshipId;
//             return (
//               <div
//                 key={app._id}
//                 className="p-4 bg-white shadow rounded-lg border border-gray-200 flex items-start gap-4"
//               >
//                 {/* Internship Image */}
//                 <img
//                   src={internship.imgUrl}
//                   alt={internship.companyName}
//                   className="w-16 h-16 rounded-md object-cover"
//                 />

//                 {/* Info */}
//                 <div className="flex-1">
//                   <h3 className="text-lg font-bold text-gray-800">
//                     {internship.jobTitle} @ {internship.companyName}
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Mode: {internship.internshipMode} | Duration: {internship.duration}
//                   </p>
//                   <button
//                     onClick={() => setSelectedInternship(app)}
//                     className={`mt-3 px-4 py-2 text-sm rounded-md font-medium ${
//                       isPremium
//                         ? "bg-blue-600 text-white hover:bg-blue-700"
//                         : "bg-purple-600 text-white hover:bg-purple-700"
//                     }`}
//                   >
//                     {isPremium ? "Open Chat" : "Raise Ticket"}
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Support;
import React from 'react'

const Support = () => {
  return (
    <div>
      Support
    </div>
  )
}

export default Support
