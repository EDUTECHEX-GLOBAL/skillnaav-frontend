import React, { useEffect, useState } from "react";
import axios from "../../../../api/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faRotateLeft,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

const Bin = () => {
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const partnerId = localStorage.getItem("partnerId");

  useEffect(() => {
    const fetchDeletedPosts = async () => {
      if (!partnerId) {
        setDeletedPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`/api/partner-bin/${partnerId}`);
        const posts = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setDeletedPosts(posts);
      } catch (error) {
        if (error.response?.status === 404) {
          setDeletedPosts([]);
        } else {
          console.error("Error fetching deleted posts:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDeletedPosts();
  }, [partnerId]);

  const handleRestore = async (id) => {
    try {
      await axios.patch(`/api/partner-bin/${partnerId}/${id}/restore`);
      setDeletedPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Error restoring post:", error);
      alert("Failed to restore post.");
    }
  };

  const handlePermanentDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this post? This action cannot be undone."
      )
    )
      return;
    try {
      await axios.delete(`/api/partner-bin/${partnerId}/${id}/permanent`);
      setDeletedPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Error permanently deleting post:", error);
      alert("Failed to permanently delete post.");
    }
  };

  return (
    <div
      className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full min-h-[500px]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Bin – Deleted Internships
        </h2>
      </div>

      {/* Result count */}
      {!loading && deletedPosts.length > 0 && (
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faLayerGroup} className="text-gray-300" />
          {deletedPosts.length} result{deletedPosts.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : deletedPosts.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FontAwesomeIcon
            icon={faTrash}
            className="text-4xl mb-3 opacity-30"
          />
          <p className="text-sm">Your bin is empty.</p>
        </div>
      ) : (
        /* Table */
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3.5 text-gray-500 font-semibold text-xs border-b border-gray-200 w-14">
                  S.No
                </th>
                <th className="px-5 py-3.5 text-gray-500 font-semibold text-xs border-b border-gray-200">
                  Job Title
                </th>
                <th className="px-5 py-3.5 text-gray-500 font-semibold text-xs border-b border-gray-200">
                  Company
                </th>
                <th className="px-5 py-3.5 text-gray-500 font-semibold text-xs border-b border-gray-200">
                  Location
                </th>
                <th className="px-5 py-3.5 text-gray-500 font-semibold text-xs border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {deletedPosts.map((post, index) => (
                <tr
                  key={post._id}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-4 text-gray-400 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-800">
                    {post.jobTitle}
                  </td>
                  <td className="px-5 py-4 text-gray-500">{post.companyName}</td>
                  <td className="px-5 py-4 text-gray-500">
                    {post.location || "N/A"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(post._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-all duration-150 hover:-translate-y-px hover:shadow-md"
                      >
                        <FontAwesomeIcon icon={faRotateLeft} />
                        Restore
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(post._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all duration-150 hover:-translate-y-px hover:shadow-md"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Bin;
