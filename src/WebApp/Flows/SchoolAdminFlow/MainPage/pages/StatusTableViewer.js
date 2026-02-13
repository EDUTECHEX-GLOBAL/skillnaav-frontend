import React, { useState } from 'react';

const studentData = {
  Applied: [
    { name: 'B. Santosh', email: 'santosh210@gmail.com', date: 'Apr 22, 2025', status: 'Applied' },
    { name: 'V. Santosh', email: 'santosh420@gmail.com', date: 'Apr 22, 2025', status: 'Applied' },
    { name: 'A. Santosh', email: 'santosh840@gmail.com', date: 'Apr 22, 2025', status: 'Applied' },
    { name: 'V. Santosh', email: 'santosh1680@gmail.com', date: 'Apr 22, 2025', status: 'Applied' },
  ],
  Shortlisted: [
    { name: 'B. Santosh', email: 'santosh210@gmail.com', date: 'Apr 22, 2025', status: 'Shortlisted' },
    { name: 'V. Santosh', email: 'santosh420@gmail.com', date: 'Apr 22, 2025', status: 'Shortlisted' },
    { name: 'A. Santosh', email: 'santosh840@gmail.com', date: 'Apr 22, 2025', status: 'Shortlisted' },
  ],
  Accepted: [
    { name: 'B. Santosh', email: 'santosh210@gmail.com', date: 'Apr 22, 2025', status: 'Accepted' },
    { name: 'V. Santosh', email: 'santosh420@gmail.com', date: 'Apr 22, 2025', status: 'Accepted' },
  ],
  Rejected: [
    { name: 'A. Santosh', email: 'santosh840@gmail.com', date: 'Apr 22, 2025', status: 'Rejected' },
    { name: 'V. Santosh', email: 'santosh1680@gmail.com', date: 'Apr 22, 2025', status: 'Rejected' },
  ],
};

const StatusTableViewer = () => {
  const [activeTab, setActiveTab] = useState('Applied');

  return (
    <div className="p-6 font-poppins">
      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        {Object.keys(studentData).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-pink-100 text-gray-800">
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Applied Date</th>
              <th className="border px-4 py-2">Resume</th>
              <th className="border px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {studentData[activeTab].map((student, index) => (
              <tr key={index} className="bg-white hover:bg-blue-50">
                <td className="border px-4 py-2">{student.name}</td>
                <td className="border px-4 py-2">{student.email}</td>
                <td className="border px-4 py-2">{student.date}</td>
                <td className="border px-4 py-2 text-blue-600 underline cursor-pointer">
                  View Resume
                </td>
                <td className="border px-4 py-2">{student.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatusTableViewer;
