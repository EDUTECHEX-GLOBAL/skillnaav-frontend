import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaLaptopHouse, FaHeart, 
} from 'react-icons/fa';
import { BsClockHistory } from 'react-icons/bs';
import {
  AiOutlineStar, AiOutlineLike, AiOutlineDislike,
} from 'react-icons/ai';

const SCHOOL_ADMIN_ID = localStorage.getItem('schoolAdminId');
const SHORTLIST_API_BASE_URL = process.env.REACT_APP_SHORTLIST_API_BASE_URL;

const Internships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalStatus, setModalStatus] = useState(null);
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetchingApplications, setIsFetchingApplications] = useState(false);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await axios.get('/api/interns/approved');
        setInternships(response.data);
      } catch (err) {
        console.error('Failed to fetch internships:', err);
        setError('Failed to load internships.');
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, []);

  const openModal = async (status, internshipId) => {
    const token = localStorage.getItem('schoolAdminToken');

    if (!token) {
      alert('Session expired. Please log in again.');
      return;
    }

    setIsOpen(true);
    setModalStatus(status);
    setSelectedInternshipId(internshipId);
    setApplications([]);
    setIsFetchingApplications(true);

    try {
      let response;

      if (status === 'Shortlisted') {
        const url = SCHOOL_ADMIN_ID
          ? `${SHORTLIST_API_BASE_URL}/partner/shortlisted/${internshipId}?schoolAdminId=${SCHOOL_ADMIN_ID}`
          : `${SHORTLIST_API_BASE_URL}/partner/shortlisted/${internshipId}`;

        response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const mappedShortlisted = response.data.shortlisted_candidates.map((c) => ({
          userName: c.name || 'N/A',
          userEmail: c.email || 'N/A',
          appliedDate: c.appliedDate || '',
          resumeUrl: c.resumeUrl || '',
          status: 'Shortlisted',
        }));

        setApplications(mappedShortlisted);
      } else if (status === 'Accepted' || status === 'Rejected') {
        const offerUrl = `/api/offer-letters/internship/${internshipId}?schoolAdminId=${SCHOOL_ADMIN_ID}`;
        response = await axios.get(offerUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filtered = response.data.offers.filter((offer) => offer.status === status);
        const mapped = filtered.map((offer) => ({
          userName: offer.name,
          userEmail: offer.email,
          appliedDate: offer.sentDate,
          resumeUrl: offer.s3Url,
          status: offer.status,
        }));

        setApplications(mapped);
      } else {
        // Default: Applied
        response = await axios.get(
          `/api/applications/internship/${internshipId}?schoolAdmin=${SCHOOL_ADMIN_ID}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const filtered = response.data.applications.filter(app => app.status === status);
        setApplications(filtered);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setApplications([]);
    } finally {
      setIsFetchingApplications(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalStatus(null);
    setSelectedInternshipId(null);
    setApplications([]);
  };

  return (
    <div className="p-6 font-poppins bg-gray-50 min-h-screen grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
      {loading && (
        Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white shadow-md rounded-xl p-5 animate-pulse" />
        ))
      )}

      {error && <p className="text-center text-red-500 col-span-full">{error}</p>}
      {!loading && internships.length === 0 && <p className="text-center col-span-full">No internships available.</p>}

      {internships.map((item) => (
        <div key={item._id} className="bg-white shadow-md rounded-xl p-5 relative">
          <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
            {item.internshipType || 'FREE'}
          </span>

          <div className="flex items-start gap-4">
            <img
              src={item.imgUrl || 'https://dummyimage.com/40x40/cccccc/000000&text=No+Image'}
              alt="logo"
              className="w-10 h-10 object-contain rounded-full"
            />
            <div>
              <h3 className="text-base font-semibold text-gray-800">{item.jobTitle}</h3>
              <p className="text-sm text-gray-600">
                {item.companyName} • <BsClockHistory className="inline-block mr-1" />
                {formatPostedDate(item.postedOn)}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600 mt-4 space-y-1">
            <div className="flex items-center"><FaMapMarkerAlt className="mr-2 text-gray-500" />{item.location}</div>
            <div className="flex items-center"><FaCalendarAlt className="mr-2 text-gray-500" />{item.startDate} – {item.endDate}</div>
            <div className="flex items-center"><FaDollarSign className="mr-2 text-gray-500" />{item.pay || 'Unpaid / Free'}</div>
            <div className="flex items-center"><FaLaptopHouse className="mr-2 text-gray-500" />{item.internshipType}</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {item.skills?.map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700">{skill}</span>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button className="text-purple-600 text-sm font-medium hover:underline">View details</button>
            <FaHeart className="text-gray-400 hover:text-pink-500 cursor-pointer" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-medium">
            <MiniStat icon={<FaLaptopHouse className="text-orange-400" />} label="Applied" bg="bg-orange-50" onClick={() => openModal('Applied', item._id)} />
            <MiniStat icon={<AiOutlineStar className="text-green-500" />} label="Shortlisted" bg="bg-green-50" onClick={() => openModal('Shortlisted', item._id)} />
            <MiniStat icon={<AiOutlineLike className="text-pink-500" />} label="Accepted" bg="bg-pink-50" onClick={() => openModal('Accepted', item._id)} />
            <MiniStat icon={<AiOutlineDislike className="text-blue-500" />} label="Rejected" bg="bg-indigo-50" onClick={() => openModal('Rejected', item._id)} />
          </div>
        </div>
      ))}

      {isOpen && (
        <StatusModal
          status={modalStatus}
          loading={isFetchingApplications}
          students={applications}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

const MiniStat = ({ icon, label, bg, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-1 px-2 py-1 rounded-md ${bg} cursor-pointer`}>
    {icon}
    <span>{label}</span>
  </div>
);

const StatusModal = ({ status, students, loading, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative">
      <h3 className="text-lg font-semibold mb-4">{`No. of Students ${status}`}</h3>
      <button onClick={onClose} className="absolute top-2 right-4 text-xl font-bold text-gray-600 hover:text-red-600">×</button>
      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Loading...</p>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No students found in this category.</p>
        ) : (
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
                  <td className="px-4 py-2 border">{s.userName}</td>
                  <td className="px-4 py-2 border">{s.userEmail}</td>
                  <td className="px-4 py-2 border">{new Date(s.appliedDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2 border text-blue-600 underline">
                    <a href={s.resumeUrl} target="_blank" rel="noopener noreferrer">View Resume</a>
                  </td>
                  <td className="px-4 py-2 border">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
);

const formatPostedDate = (dateStr) => {
  if (!dateStr) return '';
  const postedDate = new Date(dateStr);
  const now = new Date();
  const daysAgo = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));
  return `${daysAgo}d ago`;
};

export default Internships;
