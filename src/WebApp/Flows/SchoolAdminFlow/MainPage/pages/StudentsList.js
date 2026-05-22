import React, { useEffect, useState } from 'react';
import axios from "../../../../../api/axiosInstance";
import StudentStatusModal from './StudentStatusModal';
import ConfirmationModal from './ConfirmationModal';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const STUDENTS_PER_PAGE = 40;

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentToConfirm, setStudentToConfirm] = useState(null);
  const [isToggleActive, setIsToggleActive] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [loadingStudentId, setLoadingStudentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchStudents = async () => {
      const token = localStorage.getItem('schoolAdminToken');
      if (!token) return console.warn("❌ No token found, skipping API call");

      setIsLoadingStudents(true);
      try {
        const res = await axios.get('/api/school-admin/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(res.data);
      } catch (err) {
        console.error("❌ Fetch error:", err.response?.data || err.message);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  // Reset to page 1 whenever search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleRequestToggle = (student) => {
    setStudentToConfirm(student);
    setIsToggleActive(student.isActive);
  };

  const toggleAccess = async () => {
    if (!studentToConfirm) return;
    const token = localStorage.getItem('schoolAdminToken');

    setLoadingStudentId(studentToConfirm._id);
    try {
      await axios.patch(
        `/api/school-admin/students/${studentToConfirm._id}/access`,
        { isActive: !isToggleActive },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setStudents(prev =>
        prev.map(student =>
          student._id === studentToConfirm._id
            ? { ...student, isActive: !isToggleActive }
            : student
        )
      );
    } catch (error) {
      console.error("Failed to update student access:", error.response?.data || error.message);
      alert("Failed to update student access.");
    } finally {
      setStudentToConfirm(null);
      setLoadingStudentId(null);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * STUDENTS_PER_PAGE,
    currentPage * STUDENTS_PER_PAGE
  );

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

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
              <th className="px-6 py-4 border-r border-blue-200">Status</th>
              <th className="px-6 py-4 border-r border-blue-200">Login History</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingStudents ? (
              <tr>
                <td colSpan="5" className="text-center py-6">
                  <div className="flex justify-center items-center gap-2 text-blue-500">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Loading students...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedStudents.length > 0 ? (
              paginatedStudents.map((student, idx) => (
                <tr key={student._id || idx} className="bg-white border-t border-blue-100 hover:bg-blue-50">
                  <td className="px-6 py-4">{student.name}</td>
                  <td className="px-6 py-4">{student.email}</td>
                  <td className="px-6 py-4">
                    {student.isActive ? (
                      <span className="text-green-600 font-semibold">Active</span>
                    ) : (
                      <span className="text-red-500 font-semibold">Restricted</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="bg-blue-500 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-600 transition"
                    >
                      View Status
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleRequestToggle(student)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded-md text-sm"
                    >
                      Manage Access
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!isLoadingStudents && filteredStudents.length > 0 && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>
            Showing {((currentPage - 1) * STUDENTS_PER_PAGE) + 1}–{Math.min(currentPage * STUDENTS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page =>
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              )
              .reduce((acc, page, i, arr) => {
                if (i > 0 && page - arr[i - 1] > 1) {
                  acc.push('...');
                }
                acc.push(page);
                return acc;
              }, [])
              .map((item, i) =>
                item === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`w-8 h-8 rounded-md border text-sm font-medium transition ${
                      currentPage === item
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {selectedStudent && (
        <StudentStatusModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {studentToConfirm && (
        <ConfirmationModal
          student={studentToConfirm}
          isActive={isToggleActive}
          onCancel={() => setStudentToConfirm(null)}
          onConfirm={toggleAccess}
          isLoading={loadingStudentId === studentToConfirm._id}
        />
      )}
    </div>
  );
};

export default StudentsList;