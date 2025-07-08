import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudentStatusModal from './StudentStatusModal';
import { Search } from 'lucide-react';

const StudentsList = () => {
  const [students, setStudents] = useState([]);  // 👈 move 'students' to state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Move useEffect inside the component
 useEffect(() => {
  const fetchStudents = async () => {
    const token = localStorage.getItem('schoolAdminToken'); // ✅ match login storage key


    if (!token) {
      console.warn("❌ No token found, skipping API call");
      return;
    }

    try {
      const res = await axios.get('/api/school-admin/students', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setStudents(res.data);
    } catch (err) {
      console.error("❌ Fetch error:", err.response?.data || err.message);
    }
  };

  fetchStudents();
}, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-white rounded-xl shadow-md font-poppins">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-blue-600">Students</h2>

        <div className="relative w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name or email"
            className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 pointer-events-none mt-2">
            <Search size={18} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border border-blue-200 rounded-lg overflow-hidden">
          <thead className="bg-pink-100 text-gray-700 text-base font-medium">
            <tr>
              <th className="px-6 py-4 border-r border-blue-200">Student Name</th>
              <th className="px-6 py-4 border-r border-blue-200">Email</th>
              <th className="px-6 py-4">Student Login Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, idx) => (
                <tr key={student._id || idx} className="bg-white border-t border-blue-100 hover:bg-blue-50">
                  <td className="px-6 py-4">{student.name}</td>
                  <td className="px-6 py-4">{student.email}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition"
                    >
                      View status
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <StudentStatusModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default StudentsList;
