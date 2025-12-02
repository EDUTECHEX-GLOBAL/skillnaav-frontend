import React, { useEffect, useState, useRef } from "react";
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
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const studentId = userInfo?._id;
        if (!studentId) {
          console.error("No student ID found");
          setError("Unable to identify user");
          setLoading(false);
          return;
        }

        const { data } = await axios.get(`/api/notifications/${studentId}`);
        if (data.success) {
          setNotifications((data.notifications || []).map(n => ({
            ...n,
            isRead: Boolean(n.read || n.isRead)
          })));
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

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const markAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await axios.put(`/api/notifications/read-all`);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleNotificationClick = async (notification, e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    if (!notification.isRead) {
      try {
        const { data } = await axios.put(`/api/notifications/read/${notification._id}`);
        if (data.success) {
          setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      }
    }

    const link = notification.link;
    if (!link) return;

    try {
      // absolute URL?
      const isAbsolute = /^https?:\/\//i.test(link);
      if (isAbsolute) {
        const url = new URL(link);
        // same-origin -> treat as internal route
        if (url.origin === window.location.origin) {
          const pathWithQuery = url.pathname + url.search + url.hash;
          const openTabParam = (new URLSearchParams(url.search)).get('openTab');
          if (openTabParam) {
            window.dispatchEvent(new CustomEvent("openTab", { detail: { tab: openTabParam, fromNotification: true } }));
          }
          navigate(pathWithQuery);
          return;
        }
        // external origin -> open new tab
        window.open(link, "_blank", "noopener,noreferrer");
        return;
      }

      // relative -> internal
      if (link.startsWith("/")) {
        const urlObj = new URL(link, window.location.origin);
        const openTabParam = urlObj.searchParams.get('openTab');
        if (openTabParam) {
          window.dispatchEvent(new CustomEvent("openTab", { detail: { tab: openTabParam, fromNotification: true } }));
        }
        navigate(urlObj.pathname + urlObj.search + urlObj.hash);
        return;
      }

      // hash or textual heuristic (fallback)
      if (link.startsWith("#") || /recommend/i.test(link)) {
        window.dispatchEvent(new CustomEvent("openTab", { detail: { tab: "recommendations", fromNotification: true } }));
        return;
      }

      // final fallback (reload)
      window.location.href = link;
    } catch (err) {
      console.error("Navigation error:", err);
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  const handleDelete = async (notification, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await axios.delete(`/api/notifications/${notification._id}`);
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      if (openMenuId === notification._id) setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="p-6 min-h-screen font-[Poppins] bg-gradient-to-br from-white via-slate-100 to-slate-200">
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
          <p className="text-sm text-gray-500 mt-1">Recent updates, offers and recommendations</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm hover:shadow-md"
            aria-label="Mark all as read"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600 text-sm">Loading notifications...</p>
      ) : error ? (
        <div className="text-red-500 font-medium">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">You're all caught up — no notifications.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {notifications.map(notification => (
            <li
              key={notification._id}
              className={`relative p-4 sm:p-5 rounded-2xl shadow-sm flex gap-4 items-start transition-all duration-150 border ${
                notification.isRead ? "bg-white border-gray-200" : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
              }`}
              onClick={(e) => handleNotificationClick(notification, e)}
            >
              <div className="flex-shrink-0 mt-1">
                {notification.isRead ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                ) : (
                  <BellIcon className="w-6 h-6 text-blue-600 animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm truncate ${notification.isRead ? "text-gray-700" : "text-blue-900 font-medium"}`}>
                      {notification.message}
                    </p>

                    {notification.link && (
                      <div className="mt-2">
                        <span className="inline-block text-xs text-blue-700 font-medium underline hover:text-blue-900 transition">
                          {notification.type === "offer" ? "📄 View Offer Letter" : "📄 View Recommendation"}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {!notification.isRead && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-blue-600 text-white px-2 py-0.5 rounded-full self-start">
                  New
                </span>
              )}

              <div ref={menuRef} className="absolute top-3 right-3 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(prev => (prev === notification._id ? null : notification._id));
                  }}
                  className="text-gray-600 hover:text-gray-800 p-1 rounded"
                  aria-label="Open notification menu"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>

                {openMenuId === notification._id && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden"
                    role="menu"
                    aria-orientation="vertical"
                    aria-label="Notification menu"
                  >
                    {notification.link && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Use same internal/external logic as the main click handler
                            if (/^https?:\/\//.test(notification.link)) {
                              const url = new URL(notification.link);
                              if (url.origin === window.location.origin) {
                                const pathWithQuery = url.pathname + url.search + url.hash;
                                const openTabParam = (new URLSearchParams(url.search)).get('openTab');
                                if (openTabParam) window.dispatchEvent(new CustomEvent("openTab", { detail: { tab: openTabParam, fromNotification: true } }));
                                navigate(pathWithQuery);
                              } else {
                                window.open(notification.link, "_blank", "noopener,noreferrer");
                              }
                            } else if (notification.link.startsWith("/")) {
                              const urlObj = new URL(notification.link, window.location.origin);
                              const openTabParam = urlObj.searchParams.get('openTab');
                              if (openTabParam) window.dispatchEvent(new CustomEvent("openTab", { detail: { tab: openTabParam, fromNotification: true } }));
                              navigate(urlObj.pathname + urlObj.search + urlObj.hash);
                            } else if (notification.link.startsWith("#") || /recommend/i.test(notification.link)) {
                              window.dispatchEvent(new CustomEvent("openTab", { detail: { tab: "recommendations", fromNotification: true } }));
                            } else {
                              window.open(notification.link, "_blank", "noopener,noreferrer");
                            }
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          {notification.type === "offer" ? "Open Offer Letter" : "Open Recommendation"}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
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
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          {notification.type === "offer" ? "Download Offer Letter" : "Download Recommendation"}
                        </button>
                      </>
                    )}

                    <button
                      onClick={(e) => handleDelete(notification, e)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
