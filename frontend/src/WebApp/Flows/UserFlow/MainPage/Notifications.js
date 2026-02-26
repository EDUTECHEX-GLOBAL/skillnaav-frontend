import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { BellIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const Notifications = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const studentId = userInfo?._id;
        if (!studentId) {
          setError("Unable to identify user");
          return;
        }
        const { data } = await axios.get(`/api/notifications/${studentId}`);
        if (data.success) {
          setNotifications(
            (data.notifications || []).map((n) => ({
              ...n,
              isRead: Boolean(n.read || n.isRead),
            }))
          );
        } else {
          setError("Failed to fetch notifications");
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Error fetching notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // ── Close menu on outside click ────────────────────────────────────────────
  // We attach to document and check openMenuId so we don't need a ref per card
  useEffect(() => {
    if (!openMenuId) return;
    const onDocClick = () => setOpenMenuId(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openMenuId]);

  // ── Shared navigation helper (deduplicates the repeated logic) ────────────
  const navigateToLink = useCallback(
    (link) => {
      if (!link) return;

      const isAbsolute = /^https?:\/\//i.test(link);

      if (isAbsolute) {
        const url = new URL(link);
        if (url.origin === window.location.origin) {
          const openTab = url.searchParams.get("openTab");
          if (openTab)
            window.dispatchEvent(
              new CustomEvent("openTab", { detail: { tab: openTab, fromNotification: true } })
            );
          navigate(url.pathname + url.search + url.hash);
        } else {
          window.open(link, "_blank", "noopener,noreferrer");
        }
        return;
      }

      if (link.startsWith("/")) {
        const urlObj = new URL(link, window.location.origin);
        const openTab = urlObj.searchParams.get("openTab");
        if (openTab)
          window.dispatchEvent(
            new CustomEvent("openTab", { detail: { tab: openTab, fromNotification: true } })
          );
        navigate(urlObj.pathname + urlObj.search + urlObj.hash);
        return;
      }

      if (link.startsWith("#") || /recommend/i.test(link)) {
        window.dispatchEvent(
          new CustomEvent("openTab", { detail: { tab: "recommendations", fromNotification: true } })
        );
        return;
      }

      window.location.href = link;
    },
    [navigate]
  );

  // ── Mark single as read ────────────────────────────────────────────────────
  const markOneRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      await axios.put(`/api/notifications/read/${id}`);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, []);

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await axios.put(`/api/notifications/read-all`);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  // ── Main notification click ────────────────────────────────────────────────
  const handleNotificationClick = async (notification, e) => {
    e?.stopPropagation();
    if (!notification.isRead) await markOneRead(notification._id);
    navigateToLink(notification.link);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (notification, e) => {
    e?.stopPropagation();
    try {
      await axios.delete(`/api/notifications/${notification._id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notification._id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // ── Label helpers ──────────────────────────────────────────────────────────
  const linkLabel = (type) =>
    type === "offer" ? "📄 View Offer Letter" : "📄 View Recommendation";

  const menuOpenLabel = (type) =>
    type === "offer" ? "Open Offer Letter" : "Open Recommendation";

  const menuDownloadLabel = (type) =>
    type === "offer" ? "Download Offer Letter" : "Download Recommendation";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 min-h-screen font-poppins bg-gradient-to-br from-white via-slate-100 to-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 tracking-tight flex items-center gap-3">
            <BellIcon className="w-6 h-6 text-blue-600" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center text-xs font-medium bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Recent updates, offers and recommendations
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="inline-flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          aria-label="Mark all as read"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Mark all read
        </button>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm mt-10 justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading notifications...
        </div>
      ) : error ? (
        <div className="text-red-500 font-medium text-sm">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircleIcon className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">You're all caught up — no notifications.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notification) => (
            <li
              key={notification._id}
              onClick={(e) => handleNotificationClick(notification, e)}
              className={`relative p-4 sm:p-5 rounded-2xl shadow-sm flex gap-4 items-start transition-all duration-150 border cursor-pointer ${
                notification.isRead
                  ? "bg-white border-gray-200 hover:border-gray-300"
                  : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300"
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {notification.isRead ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                ) : (
                  <BellIcon className="w-6 h-6 text-blue-600 animate-pulse" />
                )}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0 pr-8">
                <p
                  className={`text-sm ${
                    notification.isRead ? "text-gray-700" : "text-blue-900 font-medium"
                  }`}
                >
                  {notification.message}
                </p>

                {notification.link && (
                  <span className="inline-block mt-2 text-xs text-blue-700 font-medium underline hover:text-blue-900 transition-colors">
                    {linkLabel(notification.type)}
                  </span>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Unread badge */}
              {!notification.isRead && (
                <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-blue-600 text-white px-2 py-0.5 rounded-full self-start">
                  New
                </span>
              )}

              {/* ── Per-card context menu ──────────────────────────────────── */}
              {/* stopPropagation on the wrapper so li onClick doesn't fire */}
              <div
                className="absolute top-3 right-3 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() =>
                    setOpenMenuId((prev) =>
                      prev === notification._id ? null : notification._id
                    )
                  }
                  className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
                  aria-label="Open notification menu"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>

                {openMenuId === notification._id && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden py-1"
                    role="menu"
                  >
                    {notification.link && (
                      <>
                        <button
                          onClick={() => {
                            navigateToLink(notification.link);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {menuOpenLabel(notification.type)}
                        </button>

                        <button
                          onClick={() => {
                            try {
                              const a = document.createElement("a");
                              a.href = notification.link;
                              a.download = "";
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                            } catch (err) {
                              console.error("Download failed:", err);
                            }
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {menuDownloadLabel(notification.type)}
                        </button>

                        <div className="border-t border-gray-100 my-1" />
                      </>
                    )}

                    <button
                      onClick={(e) => handleDelete(notification, e)}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;