import React, { useState } from 'react';
import {
  FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaLaptopHouse, FaHeart,
} from 'react-icons/fa';
import { BsClockHistory } from 'react-icons/bs';
import {
  AiOutlineStar, AiOutlineLike, AiOutlineDislike,
} from 'react-icons/ai';

// Dummy student data for modals
const studentData = {
  Applied: [
    { name: 'B. Santosh', email: 'santosh210@gmail.com', date: 'Apr 22, 2025' },
    { name: 'V. Santosh', email: 'santosh420@gmail.com', date: 'Apr 22, 2025' },
  ],
  Shortlisted: [
    { name: 'A. Santosh', email: 'santosh840@gmail.com', date: 'Apr 22, 2025' },
  ],
  Accepted: [
    { name: 'V. Santosh', email: 'santosh1680@gmail.com', date: 'Apr 22, 2025' },
  ],
  Rejected: [
    { name: 'S. Santosh', email: 'santosh999@gmail.com', date: 'Apr 22, 2025' },
  ],
};

const internships = [
  {
    id: 1,
    title: 'Full Stack Developer',
    company: 'Facebook',
    location: 'Hyderabad, India',
    posted: '100d ago',
    startDate: '30 Mar 2025',
    endDate: '15 Jun 2025',
    pay: 'Unpaid / Free',
    type: 'Hybrid',
    skills: ['HTML', 'CSS', 'JavaScript', 'React.js', 'MongoDB'],
    tag: 'FREE',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
  },
  {
    id: 2,
    title: 'UI/UX Intern',
    company: 'Dribbble',
    location: 'Remote',
    posted: '10d ago',
    startDate: '01 Jul 2025',
    endDate: '30 Sep 2025',
    pay: 'Paid / ₹8,000',
    type: 'Remote',
    skills: ['Figma', 'Adobe XD', 'Wireframes', 'Design Systems'],
    tag: 'PREMIUM',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Dribbble_logo.png',
  },
  {
    id: 3,
    title: 'Data Analyst Intern',
    company: 'Google',
    location: 'Bangalore, India',
    posted: '3d ago',
    startDate: '15 Jul 2025',
    endDate: '15 Oct 2025',
    pay: 'Unpaid / Free',
    type: 'Onsite',
    skills: ['Excel', 'SQL', 'Python', 'Power BI'],
    tag: 'FREE',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
  },
];


const Internships = () => {
  const [modalStatus, setModalStatus] = useState(null); // Applied, Shortlisted, etc.
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (status) => {
    setModalStatus(status);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalStatus(null);
  };

  return (
    <div className="p-6 font-poppins bg-gray-50 min-h-screen grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
      {internships.map((item) => (
        <div key={item.id} className="bg-white shadow-md rounded-xl p-5 relative">
          <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
            {item.tag}
          </span>

          <div className="flex items-start gap-4">
            <img src={item.icon} alt="logo" className="w-10 h-10 object-contain rounded-full" />
            <div>
              <h3 className="text-base font-semibold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-600">
                {item.company} • <BsClockHistory className="inline-block mr-1" />
                {item.posted}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600 mt-4 space-y-1">
            <div className="flex items-center"><FaMapMarkerAlt className="mr-2 text-gray-500" />{item.location}</div>
            <div className="flex items-center"><FaCalendarAlt className="mr-2 text-gray-500" />{item.startDate} – {item.endDate}</div>
            <div className="flex items-center"><FaDollarSign className="mr-2 text-gray-500" />{item.pay}</div>
            <div className="flex items-center"><FaLaptopHouse className="mr-2 text-gray-500" />{item.type}</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {item.skills.map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700">{skill}</span>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button className="text-purple-600 text-sm font-medium hover:underline">View details</button>
            <FaHeart className="text-gray-400 hover:text-pink-500 cursor-pointer" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-medium">
            <MiniStat icon={<FaLaptopHouse className="text-orange-400" />} label="Applied" bg="bg-orange-50" onClick={() => openModal('Applied')} />
            <MiniStat icon={<AiOutlineStar className="text-green-500" />} label="Shortlisted" bg="bg-green-50" onClick={() => openModal('Shortlisted')} />
            <MiniStat icon={<AiOutlineLike className="text-pink-500" />} label="Accepted" bg="bg-pink-50" onClick={() => openModal('Accepted')} />
            <MiniStat icon={<AiOutlineDislike className="text-blue-500" />} label="Rejected" bg="bg-indigo-50" onClick={() => openModal('Rejected')} />
          </div>
        </div>
      ))}

      {isOpen && <StatusModal status={modalStatus} students={studentData[modalStatus]} onClose={closeModal} />}
    </div>
  );
};

const MiniStat = ({ icon, label, bg, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-1 px-2 py-1 rounded-md ${bg} cursor-pointer`}>
    {icon}
    <span>{label}</span>
  </div>
);

const StatusModal = ({ status, students, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative">
      <h3 className="text-lg font-semibold mb-4">{`No. of Students ${status}`}</h3>
      <button onClick={onClose} className="absolute top-2 right-4 text-xl font-bold text-gray-600 hover:text-red-600">×</button>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-pink-100">
            <tr>
              <th className="text-left px-4 py-2 border">Name</th>
              <th className="text-left px-4 py-2 border">Email</th>
              <th className="text-left px-4 py-2 border">Applied Date</th>
              <th className="text-left px-4 py-2 border">Resume</th>
              <th className="text-left px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={i} className="bg-white hover:bg-gray-100">
                <td className="px-4 py-2 border">{s.name}</td>
                <td className="px-4 py-2 border">{s.email}</td>
                <td className="px-4 py-2 border">{s.date}</td>
                <td className="px-4 py-2 border text-blue-600 underline cursor-pointer">View Resume</td>
                <td className="px-4 py-2 border">{status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Internships;
