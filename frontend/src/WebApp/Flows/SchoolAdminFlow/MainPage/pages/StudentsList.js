import React, { useState } from 'react';
import StudentStatusModal from './StudentStatusModal';
import { Search } from 'lucide-react';


const students = [
  {
    name: 'Venkat Balaji',
    email: 'srivenkatbalaji07@gmail.com',
  },
  {
    name: 'Gnanesh Kumar',
    email: 'gnaneshkumar09@gmail.com',
  },
];

const StudentsList = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
                <tr key={idx} className="bg-white border-t border-blue-100 hover:bg-blue-50">
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
