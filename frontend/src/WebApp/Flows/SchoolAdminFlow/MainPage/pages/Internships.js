import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaLaptopHouse, FaHeart,
} from 'react-icons/fa';
import { BsClockHistory } from 'react-icons/bs';
import {
  AiOutlineStar, AiOutlineLike, AiOutlineDislike,
} from 'react-icons/ai';

// All AI calls go through Node backend — same pattern as /api/applications/recommendations
// No Python URL, no port number, no env var needed in the frontend
const AI_API = "/api/ai";

const Internships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalStatus, setModalStatus] = useState(null);
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);

  const [applications, setApplications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetchingApplications, setIsFetchingApplications] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchInternships(page + 1);
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [page, hasMore, loading]);

  const fetchInternships = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const response = await axios.get('/api/interns/approved', {
        params: { page: pageNumber },
      });

      setInternships(prev =>
        pageNumber === 1
          ? response.data.data
          : [...prev, ...response.data.data]
      );

      setHasMore(response.data.hasMore);
      setPage(response.data.page);
    } catch (err) {
      setError('Failed to load internships.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships(1);
  }, []);

  const openModal = async (status, internshipId) => {
    const token = localStorage.getItem('schoolAdminToken');
    const schoolAdminId = localStorage.getItem('schoolAdminId');

    console.log(`📍 Opening modal for status: ${status}, internshipId: ${internshipId}`);
    console.log(`🧾 schoolAdminId from localStorage: ${schoolAdminId}`);
    console.log(`🔐 Token present: ${!!token}`);

    if (!token) {
      alert('Session expired. Please log in again.');
      return;
    }

    if (!internshipId || !schoolAdminId) {
      console.error('❌ Missing internshipId or schoolAdminId');
      alert('Missing required data. Please login again.');
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
        if (!internshipId || !schoolAdminId) {
          console.error('❌ Missing required IDs:', { internshipId, schoolAdminId });
          return;
        }

        // ✅ SECURITY: proxied through Node backend — Python URL never exposed to browser
        const url = `${AI_API}/partner/shortlisted/by-admin?internship_id=${internshipId}&school_admin_id=${schoolAdminId}`;
        console.log(`🚀 Fetching Shortlisted Students from: ${url}`);

        response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('✅ Shortlisted API response:', response.data);

        const mappedShortlisted = response.data.shortlisted_candidates.map((c) => ({
          userName: c.name || 'N/A',
          userEmail: c.email || 'N/A',
          appliedDate: c.appliedDate || '',
          resumeUrl: c.resumeUrl || '',
          status: 'Shortlisted',
        }));

        setApplications(mappedShortlisted);
      } else if (status === 'Accepted' || status === 'Rejected') {
        const offerUrl = `/api/offer-letters/internship/${internshipId}?schoolAdminId=${schoolAdminId}`;
        console.log(`🚀 Fetching Offer Letters from: ${offerUrl}`);

        response = await axios.get(offerUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('✅ Offer Letter API response:', response.data);

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
        const appliedUrl = `/api/applications/internship/${internshipId}?schoolAdmin=${schoolAdminId}`;
        console.log(`🚀 Fetching Applied Students from: ${appliedUrl}`);

        response = await axios.get(appliedUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('✅ Applied API response:', response.data);
        setApplications(response.data.applications);
      }
    } catch (err) {
      console.error('❌ Error fetching applications:', err);
      if (err.response) {
        console.error('📡 Response error:', err.response.status, err.response.data);
      } else if (err.request) {
        console.error('📞 No response received from server:', err.request);
      } else {
        console.error('🧠 Error setting up request:', err.message);
      }
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
      {!loading && internships.length === 0 && (
        <p className="text-center col-span-full">No internships available.</p>
      )}

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
            <MiniStat icon={<FaLaptopHouse className="text-orange-400" />}   label="Applied"     bg="bg-orange-50" onClick={() => openModal('Applied',     item._id)} />
            <MiniStat icon={<AiOutlineStar className="text-green-500" />}    label="Shortlisted" bg="bg-green-50"  onClick={() => openModal('Shortlisted', item._id)} />
            <MiniStat icon={<AiOutlineLike className="text-pink-500" />}     label="Accepted"    bg="bg-pink-50"   onClick={() => openModal('Accepted',    item._id)} />
            <MiniStat icon={<AiOutlineDislike className="text-blue-500" />}  label="Rejected"    bg="bg-indigo-50" onClick={() => openModal('Rejected',    item._id)} />
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

      {hasMore && (
        <div
          ref={loadMoreRef}
          className="col-span-full h-10 flex justify-center items-center"
        >
          {loading && (
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-600" />
          )}
        </div>
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
    <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] p-6 relative flex flex-col shadow-xl">
      <button
        onClick={onClose}
        className="absolute top-3 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold"
      >
        &times;
      </button>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Students {status} ({students.length})
      </h2>

      <div className="overflow-y-auto border rounded-lg flex-grow">
        {loading ? (
          <div className="flex justify-center items-center h-full py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-pink-500" />
          </div>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No students found in this category.</p>
        ) : (
          <table className="w-full text-sm text-gray-700 border-collapse">
            <thead className="bg-pink-100 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 border-b font-medium">Name</th>
                <th className="text-left px-4 py-3 border-b font-medium">Email</th>
                <th className="text-left px-4 py-3 border-b font-medium">Applied Date</th>
                <th className="text-left px-4 py-3 border-b font-medium">Resume</th>
                <th className="text-left px-4 py-3 border-b font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border-b">{s.userName}</td>
                  <td className="px-4 py-2 border-b">{s.userEmail}</td>
                  <td className="px-4 py-2 border-b">
                    {s.appliedDate ? new Date(s.appliedDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {s.resumeUrl ? (
                      <a
                        href={s.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Resume
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-4 py-2 border-b capitalize">{s.status}</td>
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