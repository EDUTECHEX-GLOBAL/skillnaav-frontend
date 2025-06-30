import React from 'react';

const dummyHistory = [
  {
    loginDate: 'Apr 18, 2025',
    loginTime: '08:24:03',
    logoutDate: 'Apr 18, 2025',
    logoutTime: '09:24:03',
    session: '1h 0m',
  },
  {
    loginDate: 'Apr 17, 2025',
    loginTime: '12:59:59',
    logoutDate: 'Apr 17, 2025',
    logoutTime: '13:00:00',
    session: '0h 30m',
  },
  {
    loginDate: 'Apr 16, 2025',
    loginTime: '13:00:00',
    logoutDate: 'Apr 16, 2025',
    logoutTime: '13:00:00',
    session: '0h 0m',
  },
  {
    loginDate: 'Apr 15, 2025',
    loginTime: '23:59:59',
    logoutDate: 'Apr 15, 2025',
    logoutTime: '23:59:59',
    session: '0h 0m',
  },
  {
    loginDate: 'Apr 14, 2025',
    loginTime: '00:00:00',
    logoutDate: 'Apr 14, 2025',
    logoutTime: '00:00:00',
    session: '0h',
  },
  {
    loginDate: 'Apr 13, 2025',
    loginTime: '07:07:07',
    logoutDate: 'Apr 13, 2025',
    logoutTime: '07:07:07',
    session: '0h 0m',
  },
];

const StudentStatusModal = ({ student, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 font-poppins">
      <div className="bg-white w-[90%] max-w-3xl rounded-2xl shadow-lg p-6">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{student.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="min-w-full text-sm border border-blue-200 rounded-xl">
            <thead className="bg-pink-100 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-3 border border-blue-200">Login Date</th>
                <th className="px-4 py-3 border border-blue-200">Login Time</th>
                <th className="px-4 py-3 border border-blue-200">Logout Date</th>
                <th className="px-4 py-3 border border-blue-200">Logout Time</th>
                <th className="px-4 py-3 border border-blue-200">Session History</th>
              </tr>
            </thead>
            <tbody>
              {dummyHistory.map((entry, index) => (
                <tr key={index} className="border border-blue-100">
                  <td className="px-4 py-2 border">{entry.loginDate}</td>
                  <td className="px-4 py-2 border">{entry.loginTime}</td>
                  <td className="px-4 py-2 border">{entry.logoutDate}</td>
                  <td className="px-4 py-2 border">{entry.logoutTime}</td>
                  <td className="px-4 py-2 border">{entry.session}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentStatusModal;
