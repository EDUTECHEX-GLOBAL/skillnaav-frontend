import React, { useEffect, useState } from "react";
import axios from "../../../../api/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faClock, faDollarSign, faUsers } from "@fortawesome/free-solid-svg-icons";

const Applications = () => {
  const [internships, setInternships] = useState([]);
  const [applicationCounts, setApplicationCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch approved internships
        const internshipsResponse = await axios.get("http://localhost:3000/api/interns/approved");
        const internshipsData = internshipsResponse.data;
        setInternships(internshipsData);

        // Only fetch counts if we have internships
        if (internshipsData.length > 0) {
          try {
            // Get comma-separated string of internship IDs
            const internshipIds = internshipsData.map(internship => internship._id).join(',');
            
            // Fetch counts for these internships
            const countsResponse = await axios.get(
              `/api/applications/counts`,
              {
                params: { internshipIds },
                paramsSerializer: params => {
                  return `internshipIds=${params.internshipIds}`;
                }
              }
            );
            
            setApplicationCounts(countsResponse.data.counts);
          } catch (countsError) {
            console.error('Error fetching counts:', countsError);
            // Continue even if counts fail - show internships without counts
            setApplicationCounts({});
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load internship data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const totalPages = Math.ceil(internships.length / PAGE_SIZE);
  const visibleInternships = internships.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div className="p-6 font-poppins">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Approved Internships</h2>
      {internships.length === 0 ? (
        <div className="flex flex-col items-center mt-8">
          <img src="/no-data.svg" alt="No internships" className="w-52 mb-4" />
          <p className="text-lg text-gray-500">No approved internships available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleInternships.map((internship) => (
              <div key={internship._id} className="bg-white rounded-lg shadow-md p-4 transition-transform transform hover:scale-105">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <img
                      src={internship.imgUrl || "default-image.jpg"}
                      alt={`${internship.companyName} logo`}
                      className="rounded-full w-12 h-12 mr-4 object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">{internship.jobTitle}</h3>
                      <p className="text-gray-500">{internship.companyName}</p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                    Approved
                  </span>
                </div>
                
                <div className="text-gray-500 text-sm mb-3 space-y-1">
                  <p className="flex items-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 w-4" />
                    {internship.location || "N/A"} • {internship.jobType || "N/A"}
                  </p>
                  <p className="flex items-center">
                    <FontAwesomeIcon icon={faClock} className="mr-2 w-4" />
                    {internship.endDateOrDuration || "N/A"}
                  </p>
                  <p className="flex items-center">
                    <FontAwesomeIcon icon={faDollarSign} className="mr-2 w-4" />
                    {internship.internshipType === "STIPEND"
                      ? `${internship.compensationDetails?.amount || 'N/A'} ${internship.compensationDetails?.currency || ''} per ${internship.compensationDetails?.frequency?.toLowerCase() || 'month'}`
                      : internship.internshipType === "FREE"
                      ? "Unpaid / Free"
                      : internship.internshipType === "PAID"
                      ? `Student Pays: ${internship.compensationDetails?.amount || 'N/A'} ${internship.compensationDetails?.currency || ''}`
                      : "N/A"}
                  </p>
                  <p className="flex items-center font-medium">
                    <FontAwesomeIcon icon={faUsers} className="mr-2 w-4" />
                    Applications: {applicationCounts[internship._id] || 0}
                  </p>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {internship.qualifications?.length > 0 ? (
                      internship.qualifications.slice(0, 3).map((qualification, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-800 py-1 px-2 rounded-full">
                          {qualification}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No qualifications listed</span>
                    )}
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center px-2 sm:px-4 py-6 bg-transparent">
              <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-white p-1 sm:p-1.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50 max-w-full overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50/50 shrink-0"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {getPageNumbers().map((p, idx) =>
                  p === "..." ? (
                    <div
                      key={`ellipsis-${idx}`}
                      className="w-7 sm:w-10 h-9 sm:h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 text-xs sm:text-sm font-semibold select-none shrink-0"
                    >
                      ...
                    </div>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 sm:w-10 h-9 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                        currentPage === p
                          ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50/50 shrink-0"
                >
                  <span className="hidden sm:inline">Next</span>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Applications;