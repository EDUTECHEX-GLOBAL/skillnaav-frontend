import React, { useEffect, useState, useMemo } from "react";
import axios from "../../../../api/axiosInstance";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faRotateLeft,
  faSearch,
  faTimes,
  faTriangleExclamation,
  faBuilding,
  faLocationDot,
  faSpinner,
  faBriefcase,
  faArrowsRotate,
  faLayerGroup,
  faCalendarAlt,
  faMoneyBillWave,
  faGlobe,
  faArrowRight,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useTabContext } from "./UserHomePageContext/HomePageContext";

const getInitials = (name = "") => {
  if (!name) return "SK";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBg = (title = "") => {
  const colors = [
    "from-teal-500 to-emerald-600",
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Bin = () => {
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all"); // 'all', 'paid', 'free', 'online', 'offline'
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  const { handleSelectTab } = useTabContext();
  const partnerId = localStorage.getItem("partnerId");

  const fetchDeletedPosts = async (isManualRefresh = false) => {
    if (!partnerId) {
      setDeletedPosts([]);
      setLoading(false);
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await axios.get(`/api/partner-bin/${partnerId}`);
      const posts = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setDeletedPosts(posts);
      if (isManualRefresh) {
        toast.info("Bin refreshed.");
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setDeletedPosts([]);
      } else {
        console.error("Error fetching deleted posts:", error);
        toast.error("Failed to load recycle bin items.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeletedPosts();
  }, [partnerId]);

  const handleRestore = async (id, title) => {
    setRestoringId(id);
    try {
      await axios.patch(`/api/partner-bin/${partnerId}/${id}/restore`);
      setDeletedPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success(`"${title || "Internship"}" restored successfully!`);
    } catch (error) {
      console.error("Error restoring post:", error);
      toast.error(error.response?.data?.message || "Failed to restore internship.");
    } finally {
      setRestoringId(null);
    }
  };

  useEffect(() => {
    if (!postToDelete) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !deleting) setPostToDelete(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [postToDelete, deleting]);

  const handlePermanentDelete = async () => {
    if (!postToDelete || deleting) return;

    const id = postToDelete._id;
    const title = postToDelete.jobTitle;
    setDeleting(true);
    try {
      await axios.delete(`/api/partner-bin/${partnerId}/${id}/permanent`);
      setDeletedPosts((prev) => prev.filter((p) => p._id !== id));
      setPostToDelete(null);
      toast.success(`"${title || "Internship"}" permanently deleted.`);
    } catch (error) {
      console.error("Error permanently deleting post:", error);
      toast.error(error.response?.data?.message || "Failed to permanently delete internship.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return deletedPosts.filter((post) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        post.jobTitle?.toLowerCase().includes(q) ||
        post.companyName?.toLowerCase().includes(q) ||
        post.location?.toLowerCase().includes(q) ||
        post.internshipMode?.toLowerCase().includes(q) ||
        post.internshipType?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedFilter === "paid") {
        return (
          post.internshipType?.toUpperCase() === "PAID" ||
          post.compensationDetails?.type?.toUpperCase() === "PAID"
        );
      }
      if (selectedFilter === "free") {
        return (
          post.internshipType?.toUpperCase() === "FREE" ||
          post.compensationDetails?.type?.toUpperCase() === "FREE"
        );
      }
      if (selectedFilter === "online") {
        return post.internshipMode?.toUpperCase() === "ONLINE";
      }
      if (selectedFilter === "offline") {
        return post.internshipMode?.toUpperCase() === "OFFLINE";
      }

      return true;
    });
  }, [deletedPosts, searchQuery, selectedFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto font-poppins pb-10">
      {/* ── Top Header Banner ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-500/20 flex-shrink-0">
              <FontAwesomeIcon icon={faTrash} className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Recycle Bin
                </h1>
                {!loading && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    {deletedPosts.length} {deletedPosts.length === 1 ? "Item" : "Items"}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Safely recover or permanently remove deleted internship listings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              type="button"
              onClick={() => fetchDeletedPosts(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-xs font-semibold text-slate-700 transition shadow-xs disabled:opacity-50"
              title="Refresh recycle bin"
            >
              <FontAwesomeIcon
                icon={faArrowsRotate}
                className={`text-xs text-slate-500 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab("your-job-posts")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-xs font-semibold text-white transition shadow-xs"
            >
              <span>View Active Posts</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </button>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        {!loading && deletedPosts.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            {/* Search input */}
            <div className="relative flex-1 max-w-xl">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title, company, location..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xs" />
                </button>
              )}
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: "all", label: "All Items", count: deletedPosts.length },
                {
                  id: "paid",
                  label: "Paid",
                  count: deletedPosts.filter(
                    (p) =>
                      p.internshipType?.toUpperCase() === "PAID" ||
                      p.compensationDetails?.type?.toUpperCase() === "PAID"
                  ).length,
                },
                {
                  id: "free",
                  label: "Free",
                  count: deletedPosts.filter(
                    (p) =>
                      p.internshipType?.toUpperCase() === "FREE" ||
                      p.compensationDetails?.type?.toUpperCase() === "FREE"
                  ).length,
                },
                {
                  id: "online",
                  label: "Online",
                  count: deletedPosts.filter(
                    (p) => p.internshipMode?.toUpperCase() === "ONLINE"
                  ).length,
                },
                {
                  id: "offline",
                  label: "On-site",
                  count: deletedPosts.filter(
                    (p) => p.internshipMode?.toUpperCase() === "OFFLINE"
                  ).length,
                },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedFilter(chip.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedFilter === chip.id
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedFilter === chip.id
                        ? "bg-teal-700/60 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Content Area ── */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-200 border-t-teal-600" />
          <p className="text-xs font-medium text-slate-400">Loading deleted internships...</p>
        </div>
      ) : deletedPosts.length === 0 ? (
        /* Empty Bin State */
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="w-20 h-20 rounded-3xl bg-teal-50/60 text-teal-600 border border-teal-100 flex items-center justify-center mb-4 shadow-inner">
            <FontAwesomeIcon icon={faTrash} className="text-3xl text-teal-600/70" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">
            Your Recycle Bin is Empty
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed mb-6">
            When you delete internships from your dashboard, they will safely appear here. You can restore them anytime or permanently remove them.
          </p>
          <button
            type="button"
            onClick={() => handleSelectTab("your-job-posts")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-xs font-bold text-white transition shadow-sm"
          >
            <span>Go to Active Job Posts</span>
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        /* No Search Matches */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <FontAwesomeIcon icon={faSearch} className="text-xl" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            No Matching Deleted Internships
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            We couldn&apos;t find any items matching &ldquo;{searchQuery}&rdquo;. Try another keyword or reset filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedFilter("all");
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* ── Cards List ── */
        <div className="grid grid-cols-1 gap-3.5">
          {filteredPosts.map((post, index) => {
            const isPaid =
              post.internshipType?.toUpperCase() === "PAID" ||
              post.compensationDetails?.type?.toUpperCase() === "PAID";
            const stipendAmt =
              post.compensationDetails?.amount || post.stipend || "";
            const currency = post.compensationDetails?.currency || "$";

            const mode = post.internshipMode || "ONLINE";
            const isOnline = mode.toUpperCase() === "ONLINE";
            const isOffline = mode.toUpperCase() === "OFFLINE";

            return (
              <div
                key={post._id}
                className="bg-white border border-slate-200/85 hover:border-teal-400/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
              >
                {/* Left Side: Avatar + Details */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Company Logo or Initials Avatar */}
                  {post.imgUrl || post.image || post.companyLogo ? (
                    <img
                      src={post.imgUrl || post.image || post.companyLogo}
                      alt={post.companyName || "Company Logo"}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200/70 flex-shrink-0 bg-slate-50"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarBg(
                      post.jobTitle || post.companyName || "Skillnaav"
                    )} text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs ${
                      post.imgUrl || post.image || post.companyLogo ? "hidden" : "flex"
                    }`}
                  >
                    {getInitials(post.companyName || post.jobTitle)}
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        #{index + 1}
                      </span>

                      {/* Company Name */}
                      <span 
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 truncate max-w-[120px] sm:max-w-[180px]"
                        title={post.companyName || "Company"}
                      >
                        <FontAwesomeIcon icon={faBuilding} className="text-[11px] text-slate-400 flex-shrink-0" />
                        <span className="truncate">{post.companyName || "Company"}</span>
                      </span>

                      {/* Location */}
                      {post.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <FontAwesomeIcon icon={faLocationDot} className="text-[10px] text-slate-400" />
                          {post.location}
                        </span>
                      )}

                      {/* Deleted Date */}
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium ml-auto sm:ml-0">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-[10px] text-slate-300" />
                        Deleted {formatDate(post.updatedAt || post.createdAt)}
                      </span>
                    </div>

                    {/* Job Title */}
                    <h3 
                      className="text-sm sm:text-base font-bold text-slate-900 truncate block leading-snug group-hover:text-teal-700 transition-colors"
                      title={post.jobTitle}
                    >
                      {post.jobTitle}
                    </h3>

                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      {/* Stipend / Type Badge */}
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                          <FontAwesomeIcon icon={faMoneyBillWave} className="text-[10px]" />
                          {stipendAmt ? `Paid (${currency}${stipendAmt})` : "Paid"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                          Free / Unpaid
                        </span>
                      )}

                      {/* Mode Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                          isOnline
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200/70"
                            : isOffline
                            ? "bg-cyan-50 text-cyan-700 border-cyan-200/70"
                            : "bg-slate-50 text-slate-600 border-slate-200/70"
                        }`}
                      >
                        <FontAwesomeIcon icon={faGlobe} className="text-[10px]" />
                        {mode}
                      </span>

                      {/* In Bin Tag */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-rose-50/70 text-rose-600 border border-rose-100">
                        In Recycle Bin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-2.5 self-stretch lg:self-center justify-end flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Restore Button */}
                  <button
                    type="button"
                    onClick={() => handleRestore(post._id, post.jobTitle)}
                    disabled={restoringId === post._id || deleting}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow disabled:opacity-50 min-w-[105px]"
                    title="Restore this internship back to active listings"
                  >
                    {restoringId === post._id ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                        <span>Restoring...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
                        <span>Restore</span>
                      </>
                    )}
                  </button>

                  {/* Delete Forever Button */}
                  <button
                    type="button"
                    onClick={() => setPostToDelete(post)}
                    disabled={restoringId === post._id || deleting}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:scale-95 bg-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                    title="Permanently remove this internship from database"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    <span>Delete Forever</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ PERMANENT DELETE CONFIRMATION MODAL ═══ */}
      {postToDelete && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px] animate-fade-in"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setPostToDelete(null);
            }
          }}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200/80 transform transition-all"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Permanently Delete Internship?
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed break-words">
                  <strong className="text-slate-800 font-semibold">&ldquo;{postToDelete.jobTitle}&rdquo;</strong>{" "}
                  will be permanently removed from your account and the database. All associated applications and records will be deleted.
                </p>
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-medium flex items-center gap-2">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-600 text-xs flex-shrink-0" />
                  <span>This action cannot be undone.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bin;
