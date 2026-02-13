// components/UserCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { 
  AiOutlineClose, 
  AiOutlineCalendar, 
  AiOutlineLink, 
  AiOutlineMail, 
  AiOutlineStar,
  AiOutlineBook,
  AiOutlineEnvironment,
  AiOutlineUser,
  AiOutlineTag
} from "react-icons/ai";
import { MdOutlineSchool, MdLocationPin } from "react-icons/md";

const UserCard = ({ user, onClose, className = "" }) => {
  if (!user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Approved": return "bg-emerald-500 text-white";
      case "Rejected": return "bg-red-500 text-white";
      default: return "bg-amber-500 text-white";
    }
  };

  const getAvatarInitial = (name) => {
    if (!name) return "U";
    const names = name.trim().split(' ');
    if (names.length > 1) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name) => {
    if (!name) return "from-blue-500 to-purple-600";
    
    const colors = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600",
      "from-orange-500 to-red-600",
      "from-purple-500 to-pink-600",
      "from-teal-500 to-cyan-600",
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto font-poppins ${className}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition z-10"
        aria-label="Close"
      >
        <AiOutlineClose size={20} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-5 mb-6 pb-6 border-b border-gray-200">
        <div className="relative flex-shrink-0">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `
                  <div class="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-3xl bg-gradient-to-br ${getAvatarColor(user.name)}">
                    ${getAvatarInitial(user.name)}
                  </div>
                `;
              }}
            />
          ) : (
            <div className={`w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-3xl bg-gradient-to-br ${getAvatarColor(user.name)}`}>
              {getAvatarInitial(user.name)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{user.name || "No name"}</h2>
          <p className="text-base text-gray-600 flex items-center gap-2 mt-1">
            <AiOutlineMail className="text-blue-600" />
            {user.email || "No email"}
          </p>
          {user.universityName && (
            <p className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full mt-2 inline-block">
              {user.universityName}
            </p>
          )}
          
          {/* Status Badge */}
          <div className="mt-3">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${getStatusColor(user.status)}`}>
              {user.status || "Pending Approval"}
            </span>
          </div>
        </div>
      </div>

      {/* Two Columns Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Left Column: Personal & Academic */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AiOutlineUser className="text-blue-600" />
            Personal & Academic
          </h3>

          {user.dob && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <AiOutlineCalendar className="text-blue-600 flex-shrink-0" />
                Date of Birth
              </p>
              <p className="font-semibold text-gray-900 pl-7">{formatDate(user.dob)}</p>
            </div>
          )}

          {user.educationLevel && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Education Level</p>
              <p className="font-semibold text-gray-900 capitalize">{user.educationLevel}</p>
            </div>
          )}

          {user.fieldOfStudy && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <AiOutlineBook className="text-blue-600 flex-shrink-0" />
                Current Field
              </p>
              <p className="font-semibold text-gray-900">{user.fieldOfStudy}</p>
            </div>
          )}

          {user.desiredField && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Desired Field</p>
              <p className="font-semibold text-gray-900">{user.desiredField}</p>
            </div>
          )}
        </div>

        {/* Right Column: Location & Other Details */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AiOutlineEnvironment className="text-blue-600" />
            Location & Details
          </h3>

          {(user.city || user.state || user.country) && (
            <div className="space-y-2">
              {/* <p className="text-sm text-gray-600 flex items-center gap-2">
                <MdLocationPin className="text-blue-600 flex-shrink-0" />
                Location
              </p> */}
              <div className="font-semibold text-gray-900 pl-7">
                {user.city && <p>{user.city}</p>}
                {(user.state || user.country) && (
                  <p>
                    {user.state && `${user.state}, `}
                    {user.country}
                  </p>
                )}
              </div>
            </div>
          )}

          {user.address && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-semibold text-gray-900">{user.address}</p>
            </div>
          )}

          {user.phone && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Phone Number</p>
              <p className="font-semibold text-gray-900">{user.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <AiOutlineTag className="text-blue-600" />
          Skills
        </h3>
        {(user.skills || []).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill, i) => (
              <span key={i} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No skills listed</p>
        )}
      </div>

      {/* Interests Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Interests</h3>
        {user.interests?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.interests.map((interest, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No interests listed</p>
        )}
      </div>

      {/* Preferred Locations */}
      {user.preferredLocations?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MdLocationPin className="text-green-600" />
            Preferred Locations
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.preferredLocations.map((loc, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-full"
              >
                {loc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {(user.linkedin || user.portfolio?.trim()) && (
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user.linkedin && (
              <a
                href={user.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition border border-blue-200"
              >
                <AiOutlineLink className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 truncate">LinkedIn</span>
              </a>
            )}
            {user.portfolio?.trim() && (
              <a
                href={user.portfolio}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition border border-purple-200"
              >
                <AiOutlineLink className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800 truncate">Portfolio</span>
              </a>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UserCard;


// components/UserCard.jsx
// import React from "react";
// import { motion } from "framer-motion";
// import { 
//   AiOutlineClose, 
//   AiOutlineUser, 
//   AiOutlineBook, 
//   AiOutlineFlag, 
//   AiOutlineStar, 
//   AiOutlineCode,
//   AiOutlinePushpin 
// } from "react-icons/ai";

// const UserCard = ({ user, onClose, className = "" }) => {
//   if (!user) return null;

//   return (
//     <motion.div
//       className={`bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 max-w-lg w-full max-h-[95vh] overflow-y-auto relative ${className}`}
//       initial={{ scale: 0.95, opacity: 0, y: 20 }}
//       animate={{ scale: 1, opacity: 1, y: 0 }}
//       exit={{ scale: 0.95, opacity: 0, y: 20 }}
//       transition={{ type: "spring", stiffness: 300, damping: 30 }}
//     >
//       {/* Decorative top gradient bar */}
//       <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-t-3xl"></div>
      
//       {/* Close button */}
//       {onClose && (
//         <motion.button
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.95 }}
//           onClick={onClose}
//           className="absolute top-6 right-6 text-gray-500 hover:text-red-500 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border border-white/50 hover:border-gray-200"
//         >
//           <AiOutlineClose size={20} />
//         </motion.button>
//       )}

//       {/* Profile Header */}
//       <div className="text-center mb-8 pt-4">
//         {user.profileImage ? (
//           <motion.div
//             whileHover={{ scale: 1.05 }}
//             className="inline-block relative"
//           >
//             <img
//               src={user.profileImage}
//               alt={user.name}
//               className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-2xl ring-4 ring-blue-100/50"
//             />
//             <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
//               <AiOutlineUser className="text-white text-sm" />
//             </div>
//           </motion.div>
//         ) : (
//           <div className="w-28 h-28 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto shadow-xl ring-4 ring-gray-100">
//             <AiOutlineUser className="text-3xl text-gray-500" />
//           </div>
//         )}
        
//         <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 bg-clip-text text-transparent mt-4 mb-1">
//           {user.name}
//         </h2>
//         <p className="text-lg text-gray-600 font-medium">{user.email}</p>
        
//         {user.universityName && (
//           <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl inline-flex items-center gap-2 text-sm font-semibold text-blue-800">
//             <AiOutlineBook />
//             {user.universityName}
//           </div>
//         )}
//       </div>

//       {/* Premium Badge */}
//       {user.planType && user.isPremium && (
//         <motion.div
//           initial={{ scale: 0, rotate: -180 }}
//           animate={{ scale: 1, rotate: 0 }}
//           className="mb-6 mx-auto w-fit px-4 py-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center gap-2"
//         >
//           <AiOutlineStar />
//           {user.planType} Premium
//         </motion.div>
//       )}

//       {/* Stats Grid */}
//       <div className="grid grid-cols-2 gap-4 mb-8">
//         {user.educationLevel && (
//           <motion.div 
//             whileHover={{ y: -2 }}
//             className="group p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 hover:border-blue-200 hover:shadow-lg transition-all duration-200"
//           >
//             <div className="flex items-center gap-2 mb-1">
//               <AiOutlineBook className="text-blue-500 text-lg" />
//               <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Education</span>
//             </div>
//             <p className="text-lg font-bold text-gray-900 group-hover:text-blue-600">{user.educationLevel}</p>
//           </motion.div>
//         )}
        
//         {user.fieldOfStudy && (
//           <motion.div 
//             whileHover={{ y: -2 }}
//             className="group p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 hover:border-purple-200 hover:shadow-lg transition-all duration-200"
//           >
//             <div className="flex items-center gap-2 mb-1">
//               <AiOutlineCode className="text-purple-500 text-lg" />
//               <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Field</span>
//             </div>
//             <p className="text-lg font-bold text-gray-900 group-hover:text-purple-600">{user.fieldOfStudy}</p>
//           </motion.div>
//         )}
        
//         {user.country && (
//           <motion.div 
//             whileHover={{ y: -2 }}
//             className="group p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 hover:border-green-200 hover:shadow-lg transition-all duration-200"
//           >
//             <div className="flex items-center gap-2 mb-1">
//               <AiOutlineFlag className="text-green-500 text-lg" />
//               <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Country</span>
//             </div>
//             <p className="text-lg font-bold text-gray-900 group-hover:text-green-600">{user.country}</p>
//           </motion.div>
//         )}
        
//         {user.planType && (
//           <motion.div 
//             whileHover={{ y: -2 }}
//             className="group p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 hover:border-yellow-200 hover:shadow-lg transition-all duration-200"
//           >
//             <div className="flex items-center gap-2 mb-1">
//               <AiOutlineStar className="text-yellow-500 text-lg" />
//               <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Plan</span>
//             </div>
//             <p className="text-lg font-bold text-gray-900 group-hover:text-yellow-600">{user.planType}</p>
//           </motion.div>
//         )}
//       </div>

//       {/* Skills */}
//       {user.skills?.length > 0 && (
//         <div className="mb-8">
//           <div className="flex items-center gap-2 mb-4">
//             <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
//             <h3 className="text-lg font-bold text-gray-900">Skills</h3>
//           </div>
//           <div className="flex flex-wrap gap-2">
//             {user.skills.map((skill, index) => (
//               <motion.span
//                 key={skill}
//                 initial={{ scale: 0, y: 20 }}
//                 animate={{ scale: 1, y: 0 }}
//                 transition={{ delay: index * 0.05 }}
//                 className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-default"
//               >
//                 {skill}
//               </motion.span>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Preferred Locations */}
//       {user.preferredLocations?.length > 0 && (
//         <div className="mb-8">
//           <div className="flex items-center gap-2 mb-4">
//             <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
//             <h3 className="text-lg font-bold text-gray-900">Preferred Locations</h3>
//           </div>
//           <div className="flex flex-wrap gap-2">
//             {user.preferredLocations.map((loc, index) => (
//               <motion.span
//                 key={loc}
//                 initial={{ scale: 0, y: 20 }}
//                 animate={{ scale: 1, y: 0 }}
//                 transition={{ delay: index * 0.05 }}
//                 className="px-4 py-2 text-sm bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-default"
//               >
//                 <AiOutlinePushpin className="inline mr-1" />
//                 {loc}
//               </motion.span>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Links */}
//       {(user.linkedin || user.portfolio) && (
//         <div className="pt-6 border-t border-gray-200/50">
//           <div className="flex gap-6 justify-center">
//             {user.linkedin && (
//               <motion.a
//                 href={user.linkedin}
//                 target="_blank"
//                 rel="noreferrer"
//                 whileHover={{ scale: 1.05, y: -2 }}
//                 whileTap={{ scale: 0.98 }}
//                 className="group flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 border border-transparent hover:border-blue-300"
//               >
//                 <AiOutlineClose className="group-hover:rotate-180 transition-transform" />
//                 LinkedIn
//               </motion.a>
//             )}
//             {user.portfolio && (
//               <motion.a
//                 href={user.portfolio}
//                 target="_blank"
//                 rel="noreferrer"
//                 whileHover={{ scale: 1.05, y: -2 }}
//                 whileTap={{ scale: 0.98 }}
//                 className="group flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 border border-transparent hover:border-purple-300"
//               >
//                 Portfolio
//               </motion.a>
//             )}
//           </div>
//         </div>
//       )}
//     </motion.div>
//   );
// };

// export default UserCard;
