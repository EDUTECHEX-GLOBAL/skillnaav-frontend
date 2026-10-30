// frontend/src/WebApp/Flows/AdminFlow/AdminFeedbackList.jsx
import React, { useEffect, useState } from "react";
import axios from "../../../../api/axiosInstance";
import { AiOutlineLeft, AiOutlineRight, AiOutlineClose } from "react-icons/ai";

export default function AdminFeedbackList({ flow: initialFlowProp } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [flowFilter, setFlowFilter] = useState(initialFlowProp || "all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, flowFilter, fromDate, toDate, statusFilter, refreshKey]);

  function fmtDate(val) {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString();
  }

  // --------------------
  // Helpers for rating/key detection & humanizing keys
  // --------------------

  // humanize keys like "overall_partner" -> "Overall Partner"
  function humanizeKey(key) {
    if (!key) return "";
    return key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // find a numeric rating (0-5) from an item; returns number or null
  function findNumericRating(item) {
    if (!item) return null;

    // quick candidates (top-level and answers)
    const candidates = [
      item?.answers?.overall,
      item?.answers?.rating,
      item?.answers?.overallRating,
      item?.answers?.score,
      item?.answers?.stars,
      item?.overall,
      item?.rating,
      item?.score,
    ];

    for (const c of candidates) {
      if (c !== undefined && c !== null && String(c).trim() !== "") {
        const num = Number(c);
        if (!Number.isNaN(num))
          return Math.max(0, Math.min(5, Math.round(num)));
      }
    }

    // fallback: search answers for keys containing overall/rating/score/stars
    function recursiveSearch(obj) {
      if (!obj || typeof obj !== "object") return null;
      for (const [k, v] of Object.entries(obj)) {
        if (v === null || v === undefined) continue;
        const keyLower = String(k).toLowerCase();
        if (/(^overall$|overall_|_overall|rating|score|stars)/.test(keyLower)) {
          const num = Number(v);
          if (!Number.isNaN(num))
            return Math.max(0, Math.min(5, Math.round(num)));
        }
        if (typeof v === "object") {
          const found = recursiveSearch(v);
          if (found !== null) return found;
        }
      }
      return null;
    }

    if (item.answers && typeof item.answers === "object") {
      const found = recursiveSearch(item.answers);
      if (found !== null) return found;
    }

    return null;
  }

  // --------------------
  // Render helpers
  // --------------------
  function renderAnswersWithLabels(item) {
    if (!item || !item.answers) return <div>—</div>;

    if (Array.isArray(item.questionMeta) && item.questionMeta.length) {
      return item.questionMeta.map((q) => {
        const key = q.id;
        const label = q.label || key;
        const val = Object.prototype.hasOwnProperty.call(item.answers, key)
          ? item.answers[key]
          : "";
        return (
          <div key={key} className="mb-2">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm whitespace-pre-wrap">
              {String(val ?? "")}
            </div>
          </div>
        );
      });
    }

    return Object.entries(item.answers).map(([k, v]) => (
      <div key={k} className="mb-2">
        <div className="text-xs text-gray-500">{humanizeKey(k)}</div>
        <div className="text-sm whitespace-pre-wrap">{String(v ?? "")}</div>
      </div>
    ));
  }

  // --------------------
  // Data fetching
  // --------------------
  async function fetchList() {
    try {
      setLoading(true);
      const params = { page, limit };
      if (flowFilter && flowFilter !== "all") params.flow = flowFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (search) params.q = search;

      const res = await axios.get("/api/feedback", { params });
      if (res.data && res.data.items) {
        setItems(res.data.items);
        setTotal(res.data.total || 0);
      } else if (Array.isArray(res.data)) {
        setItems(res.data);
        setTotal(res.data.length);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Failed to fetch feedback list", err);
      alert("Could not load feedback list. Check backend or network.");
    } finally {
      setLoading(false);
    }
  }

  const downloadCSV = async () => {
    try {
      setExportingCSV(true);
      const params = {};
      if (flowFilter && flowFilter !== "all") params.flow = flowFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await axios.get("/api/feedback/export", {
        params,
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback_export_${flowFilter || "all"}_${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed", err);
      alert("Export failed");
    } finally {
      setExportingCSV(false);
    }
  };

  const downloadPDF = async (id) => {
    try {
      setPdfLoadingId(id);
      const API = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "";
      const url = API
        ? `${API}/api/feedback/${id}/pdf`
        : `/api/feedback/${id}/pdf`;

      const res = await axios.get(url, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const objectUrl = window.URL.createObjectURL(blob);

      const newTab = window.open(objectUrl, "_blank");
      if (!newTab) {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `feedback_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 10000);
    } catch (err) {
      console.error("PDF download failed", err);
      if (!navigator.onLine) {
        alert(
          "You appear to be offline. Check your network connection and try again.",
        );
        return;
      }
      const msg = err?.response?.status
        ? `Server returned status ${err.response.status}`
        : err?.code === "ECONNREFUSED" ||
            err?.message?.includes("Network Error")
          ? "Unable to reach backend server. Is the backend running?"
          : "Failed to download PDF. Check server logs or the network tab.";
      alert(msg);
    } finally {
      setPdfLoadingId(null);
    }
  };

  // --------------------
  // Actions & UI helpers
  // --------------------
  const openDetail = (item) => setSelected(item);
  const closeDetail = () => setSelected(null);

  const markStatus = async (id, status, note = "") => {
    try {
      setActionLoading(true);
      await axios.patch(`/api/feedback/${id}`, { status, note });
      setRefreshKey((k) => k + 1);
      if (selected && selected._id === id) {
        setSelected((prev) => ({ ...prev, status, note }));
      }
    } catch (err) {
      console.error("mark status failed", err);
      alert("Could not update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const resetFilters = () => {
    setSearch("");
    setFlowFilter(initialFlowProp || "all");
    setFromDate("");
    setToDate("");
    setStatusFilter("all");
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const handleTabClick = (flow) => {
    setFlowFilter(flow);
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getPaginationItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
    }

    if (page >= totalPages - 3) {
      return [
        1,
        "ellipsis-left",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "ellipsis-left",
      page - 1,
      page,
      page + 1,
      "ellipsis-right",
      totalPages,
    ];
  };

  const nextPage = () =>
    setPage((current) => Math.min(current + 1, totalPages));
  const prevPage = () => setPage((current) => Math.max(current - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-poppins">
      {/* Main Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              Feedback Inbox
            </h1>

            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 w-full sm:w-auto">
              {/* Flow Tabs */}
              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <button
                  onClick={() => handleTabClick("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${flowFilter === "all" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                >
                  All
                </button>
                <button
                  onClick={() => handleTabClick("user")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${flowFilter === "user" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                >
                  User
                </button>
                <button
                  onClick={() => handleTabClick("partner")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${flowFilter === "partner" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                >
                  Partner
                </button>
                <button
                  onClick={() => handleTabClick("schoolAdmin")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${flowFilter === "schoolAdmin" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                >
                  School Admin
                </button>
              </div>

              <button
                onClick={downloadCSV}
                disabled={exportingCSV}
                className="w-full lg:w-auto justify-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingCSV ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                {exportingCSV ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <CustomSelect
              label="Flow"
              value={flowFilter}
              onChange={(val) => {
                setFlowFilter(val);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All" },
                { value: "user", label: "User" },
                { value: "partner", label: "Partner" },
                { value: "schoolAdmin", label: "School Admin" },
              ]}
            />

            <CustomSelect
              label="Status"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: "all", label: "All" },
                { value: "new", label: "New" },
                { value: "in_review", label: "In Review" },
                { value: "actioned", label: "Actioned" },
                { value: "resolved", label: "Resolved" },
              ]}
            />

            <CustomDatePicker
              label="From Date"
              value={fromDate}
              onChange={(val) => setFromDate(val)}
              placeholder="dd-mm-yyyy"
            />

            <CustomDatePicker
              label="To Date"
              value={toDate}
              onChange={(val) => setToDate(val)}
              placeholder="dd-mm-yyyy"
            />
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative w-full">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                placeholder="Search text, email or notes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="search-input !mt-0 h-11 w-full border border-gray-300 rounded-lg pr-10 !pl-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-poppins placeholder-gray-400 truncate bg-white"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                    setRefreshKey((k) => k + 1);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-6 h-11 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
            >
              Search
            </button>
            <button
              onClick={resetFilters}
              className="px-5 h-11 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 flex-shrink-0"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Flow
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  User Details
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  OverAll Rating
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Spinner />
                      <span className="text-sm text-gray-600">
                        Loading feedback...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <svg
                        className="w-12 h-12 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm">No feedback found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((it, index) => (
                  <tr
                    key={it._id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="p-4 align-top">
                      <div className="text-sm text-gray-900">
                        {fmtDate(it.createdAt || it.timestamp)}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {it.flow}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-medium text-gray-900">
                        {it.userName ||
                          (it.answers && it.answers.contactName) ||
                          "—"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {it.userEmail ||
                          (it.answers &&
                            (it.answers.contactEmail ||
                              it.answers.contactEmail_partner)) ||
                          "—"}
                      </div>
                    </td>

                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {(() => {
                            const overall = findNumericRating(it) ?? 0;
                            return [...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < overall ? "text-yellow-400" : "text-gray-300"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ));
                          })()}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {(() => {
                            const r = findNumericRating(it);
                            return r === null ? "—" : String(r);
                          })()}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 align-top">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          it.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : it.status === "in_review"
                              ? "bg-yellow-100 text-yellow-800"
                              : it.status === "new"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {it.status || "new"}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetail(it)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors flex items-center gap-1"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={() => downloadPDF(it._id)}
                          disabled={pdfLoadingId === it._id}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {pdfLoadingId === it._id ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          )}
                          PDF
                        </button>
                        <button
                          onClick={() => {
                            openDetail(it);
                            if (!it.status || it.status === "new") {
                              markStatus(it._id, "in_review");
                            }
                          }}
                          className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded hover:bg-yellow-600 transition-colors shadow-sm"
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="px-6 py-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-white p-1 sm:p-1.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50 max-w-full overflow-x-auto scrollbar-none">
                <button
                  onClick={prevPage}
                  disabled={page === 1 || loading}
                  aria-label="Go to previous page"
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50/50 shrink-0"
                >
                  <AiOutlineLeft size={16} />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {getPaginationItems().map((item, index) => {
                  if (typeof item !== "number") {
                    return (
                      <div
                        key={`${item}-${index}`}
                        className="w-7 sm:w-10 h-9 sm:h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 text-xs sm:text-sm font-semibold select-none shrink-0"
                      >
                        ...
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      disabled={loading}
                      className={`w-8 sm:w-10 h-9 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                        page === item
                          ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
                      aria-label={`Go to page ${item}`}
                      aria-current={page === item ? "page" : undefined}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  onClick={nextPage}
                  disabled={page >= totalPages || loading}
                  aria-label="Go to next page"
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50/50 shrink-0"
                >
                  <span className="hidden sm:inline">Next</span>
                  <AiOutlineRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-4 sm:p-6 overflow-auto max-h-[90vh] border border-gray-100 my-auto font-poppins relative">
            
            {/* Header with Title and Close Button */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-200 mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  Feedback Detail & Review
                </h3>
                <div className="text-xs sm:text-sm text-gray-500 mt-1 font-poppins">
                  ID: {selected._id} • Flow: <span className="font-semibold text-blue-600">{selected.flow}</span> •{" "}
                  {fmtDate(selected.createdAt || selected.timestamp)}
                </div>
              </div>

              <button
                onClick={closeDetail}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition shrink-0"
                aria-label="Close modal"
              >
                <AiOutlineClose size={18} className="sm:text-[20px]" />
              </button>
            </div>

            {/* Action Buttons Bar */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 mb-6 pb-4 border-b border-gray-200">
              <button
                onClick={() => downloadPDF(selected._id)}
                disabled={pdfLoadingId === selected._id}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfLoadingId === selected._id ? (
                  <svg className="w-3.5 h-3.5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                PDF
              </button>

              {selected.status !== "in_review" && (
                <button
                  onClick={() => markStatus(selected._id, "in_review")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-semibold rounded-xl hover:bg-yellow-600 disabled:opacity-50 transition-colors w-full sm:w-auto text-center"
                >
                  Mark In Review
                </button>
              )}

              {selected.status !== "actioned" && (
                <button
                  onClick={() => markStatus(selected._id, "actioned")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors w-full sm:w-auto text-center"
                >
                  Mark Actioned
                </button>
              )}

              {selected.status !== "resolved" && (
                <button
                  onClick={() => markStatus(selected._id, "resolved")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors w-full sm:w-auto text-center"
                >
                  Mark Resolved
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    User Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                      <span className="text-xs sm:text-sm text-gray-500 w-24 shrink-0 font-medium">Name:</span>
                      <span className="text-xs sm:text-sm text-gray-900 font-medium truncate">
                        {selected.userName || "—"}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                      <span className="text-xs sm:text-sm text-gray-500 w-24 shrink-0 font-medium">Email:</span>
                      <span className="text-xs sm:text-sm text-gray-900 font-medium break-all">
                        {selected.userEmail ||
                          (selected.answers &&
                            (selected.answers.contactEmail ||
                              selected.answers.contactEmail_partner)) ||
                          "—"}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                      <span className="text-xs sm:text-sm text-gray-500 w-24 shrink-0 font-medium">Page:</span>
                      <span className="text-xs sm:text-sm text-gray-900 font-medium break-all">
                        {selected.page || "—"}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0 mt-1">
                      <span className="text-xs sm:text-sm text-gray-500 w-24 shrink-0 font-medium">
                        Status:
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selected.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : selected.status === "in_review"
                              ? "bg-yellow-100 text-yellow-800"
                              : selected.status === "new"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selected.status || "new"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Feedback Summary
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selected.answers && typeof selected.answers === "object" ? (
                    renderAnswersWithLabels(selected)
                  ) : (
                    <div className="text-sm text-gray-700">
                      {String(selected.answers)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Internal Notes
              </h4>
              <InternalNoteEditor
                feedback={selected}
                onSaved={() => {
                  setRefreshKey((k) => k + 1);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <svg
        className="animate-spin h-6 w-6 text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
    </div>
  );
}

function InternalNoteEditor({ feedback, onSaved }) {
  const [note, setNote] = useState(feedback?.note || "");
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    setNote(feedback?.note || "");
  }, [feedback]);

  const saveNote = async () => {
    try {
      setLoading(true);
      await axios.patch(`/api/feedback/${feedback._id}`, {
        note,
        status: feedback.status === "new" ? "in_review" : feedback.status,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      onSaved && onSaved();
    } catch (err) {
      console.error("save note failed", err);
      alert("Could not save note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none !mt-0 font-poppins"
        rows={4}
        placeholder="Add internal notes, action items, or remarks..."
      />
      <div className="flex items-center gap-3">
        <button
          onClick={saveNote}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Note</span>
          )}
        </button>
        <button
          onClick={() => {
            setNote("");
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
        {savedSuccess && (
          <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Note saved!
          </span>
        )}
      </div>
    </div>
  );
}

function CustomSelect({ label, value, options, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="flex flex-col gap-1.5 relative w-full" ref={ref}>
      {label && (
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-11 bg-white border border-gray-300 rounded-lg px-3.5 text-sm outline-none cursor-pointer flex justify-between items-center hover:border-blue-500 focus:border-blue-500 transition-colors text-left"
      >
        <span className="text-gray-800 font-medium truncate">
          {selectedOption?.label || "Select..."}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ml-2 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto w-full">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${value === opt.value ? "bg-blue-600 text-white font-medium" : "text-gray-700 hover:bg-blue-50"}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomDatePicker({ label, value, onChange, placeholder = "dd-mm-yyyy" }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  const parsedDate = value ? new Date(value + "T00:00:00") : null;
  const [viewDate, setViewDate] = React.useState(parsedDate || new Date());

  React.useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) setViewDate(d);
    }
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const formatDisplay = (val) => {
    if (!val) return "";
    const [y, m, d] = val.split("-");
    return `${d}-${m}-${y}`;
  };

  const selectDay = (day) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
    setOpen(false);
  };

  const selectToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  const clearDate = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5 relative w-full" ref={ref}>
      {label && (
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-11 bg-white border border-gray-300 rounded-lg px-3.5 text-sm outline-none cursor-pointer flex justify-between items-center hover:border-blue-500 focus:border-blue-500 transition-colors text-left"
      >
        <span className={value ? "text-gray-800 font-medium truncate" : "text-gray-400 truncate"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg
          className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-[100%] left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[9999] p-3.5 w-[280px] max-w-[calc(100vw-32px)] box-border">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              aria-label="Previous month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-bold text-gray-800">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              aria-label="Next month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="text-[11px] font-semibold text-gray-400">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-full" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const mm = String(month + 1).padStart(2, "0");
              const dd = String(day).padStart(2, "0");
              const isSelected = value === `${year}-${mm}-${dd}`;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`h-7 w-7 mx-auto flex items-center justify-center text-xs rounded-lg font-medium transition ${
                    isSelected
                      ? "bg-blue-600 text-white font-bold shadow-sm"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 mt-2.5 pt-2 text-xs">
            <button
              type="button"
              onClick={clearDate}
              className="text-blue-600 hover:underline font-medium"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={selectToday}
              className="text-blue-600 hover:underline font-medium"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
