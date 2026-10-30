// File: Dashboard.js

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaUsers,
  FaUserFriends,
  FaBriefcase,
  FaDollarSign,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import DashboardCharts from "./Analytics/DashboardCharts";
import InternshipTypeChart from "./Analytics/InternshipTypeChart";
import AverageCompensationChart from "./Analytics/AverageCompensationChart";
import PartnerApprovalChart from "./Analytics/PartnerApprovalChart";
import PartnerGrowthChart from "./Analytics/PartnerGrowthChart";
import ApplicationsByTypeChart from "./Analytics/ApplicationsByTypeChart";
import RevenueChart from "./Analytics/RevenueChart";
import Card from "./Analytics/Card";
import axios from "../../../../api/axiosInstance";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getPresetRange = (preset) => {
  const now = new Date();
  const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const subtractMonths = (months) => {
    const d = new Date(now.getFullYear(), now.getMonth() - months, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  switch (preset) {
    case "3m":
      return { startDate: subtractMonths(2), endDate };
    case "6m":
      return { startDate: subtractMonths(5), endDate };
    case "1y":
      return { startDate: subtractMonths(11), endDate };
    case "2y":
      return { startDate: subtractMonths(23), endDate };
    default:
      return { startDate: subtractMonths(5), endDate };
  }
};

/** "YYYY-MM" → "Mar 2025" */
const formatMonthLabel = (ym) => {
  if (!ym) return "";
  const [year, month] = ym.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" },
  );
};

/**
 * Convert any month string the backend might return into "YYYY-MM".
 * Handles: "Jan 2025", "Jan-2025", "January 2025", "Sept 2025",
 *          "2025-01", "2025-01-15", "Mar 2025", etc.
 */
const MONTH_MAP = {
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sep: "09",
  sept: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12",
  january: "01",
};

const toYYYYMM = (label) => {
  if (!label) return null;
  const s = String(label).trim();
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7); // "2025-01" or "2025-01-15"
  const m1 = s.match(/^([A-Za-z]+)[\s-]+(\d{4})$/);
  if (m1) {
    const mm = MONTH_MAP[m1[1].toLowerCase()];
    return mm ? `${m1[2]}-${mm}` : null;
  }
  const m2 = s.match(/^(\d{4})[\s-]+([A-Za-z]+)$/);
  if (m2) {
    const mm = MONTH_MAP[m2[2].toLowerCase()];
    return mm ? `${m2[1]}-${mm}` : null;
  }
  return null;
};

/**
 * Filter a time-series array so only items whose `month` field
 * falls within [startDate, endDate] ("YYYY-MM") are kept.
 * If a month can't be parsed it is kept rather than silently dropped.
 */
const filterByRange = (arr, startDate, endDate) => {
  if (!Array.isArray(arr) || !startDate || !endDate) return arr || [];
  return arr.filter((item) => {
    const ym = toYYYYMM(item.month);
    if (!ym) return true;
    return ym >= startDate && ym <= endDate;
  });
};

const PRESETS = [
  { key: "3m", label: "Last 3 Months" },
  { key: "6m", label: "Last 6 Months" },
  { key: "1y", label: "Last 1 Year" },
  { key: "2y", label: "Last 2 Years" },
];

const EMPTY_DATA = {
  partnersCount: 0,
  activeUsersCount: 0,
  internshipsCount: 0,
  paymentsCount: 0,
  jobApplications: 0,
  internshipApprovals: 0,
  internshipRejections: 0,
  userGrowth: [],
  jobPostings: [],
  internshipTypeDistribution: {},
  averageCompensation: {},
  partnerApproval: {},
  partnerGrowth: [],
  applicationTypeDistribution: {},
  totalRevenue: 0,
  monthlyRevenue: [],
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MonthPickerBox = ({ label, value, onChange, min, max }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [yearStr, monthStr] = (value || "2026-01").split("-");
  const [pickerYear, setPickerYear] = useState(
    Number(yearStr) || new Date().getFullYear(),
  );

  useEffect(() => {
    if (value) {
      const [y] = value.split("-");
      if (y) setPickerYear(Number(y));
    }
  }, [value]);

  const currentMonthIdx = Number(monthStr) - 1;

  const displayLabel = value
    ? `${MONTH_NAMES[currentMonthIdx] || ""} ${yearStr}`
    : "Select Month";

  const handleSelectMonth = (monthIdx) => {
    const formattedMonth = String(monthIdx + 1).padStart(2, "0");
    onChange(`${pickerYear}-${formattedMonth}`);
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      <label className="text-xs text-gray-500 mb-1 block font-medium">
        {label}
      </label>

      {/* Input box with right side calendar icon */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-10 px-3.5 bg-white border rounded-xl flex items-center justify-between text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-100"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className="text-gray-800 font-medium">{displayLabel}</span>
        <FaCalendarAlt className="text-indigo-500 text-xs" />
      </button>

      {/* Inline Calendar Grid opened strictly within the box */}
      {isOpen && (
        <div className="mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
          {/* Year Nav */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              className="p-1 rounded-lg text-gray-600 hover:bg-gray-200 transition"
              aria-label="Previous year"
            >
              <FaChevronLeft className="text-xs" />
            </button>
            <span className="font-bold text-xs text-gray-800">
              {pickerYear}
            </span>
            <button
              type="button"
              onClick={() => setPickerYear((y) => y + 1)}
              className="p-1 rounded-lg text-gray-600 hover:bg-gray-200 transition"
              aria-label="Next year"
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-4 gap-1">
            {MONTH_NAMES.map((mName, idx) => {
              const formattedMonth = String(idx + 1).padStart(2, "0");
              const isSelected =
                pickerYear === Number(yearStr) && idx === currentMonthIdx;
              const ymValue = `${pickerYear}-${formattedMonth}`;
              const isDisabled =
                (min && ymValue < min) || (max && ymValue > max);

              return (
                <button
                  key={mName}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-1.5 text-xs rounded-lg font-medium transition ${
                    isSelected
                      ? "bg-indigo-600 text-white font-semibold shadow-sm"
                      : isDisabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── DateRangeFilter ─────────────────────────────────────────────────────────

const DateRangeFilter = ({
  preset,
  customStart,
  customEnd,
  onPresetChange,
  onCustomChange,
  onApply,
}) => {
  const [open, setOpen] = useState(false);
  const isCustom = preset === "custom";

  const activeLabel = isCustom
    ? `${formatMonthLabel(customStart)} – ${formatMonthLabel(customEnd)}`
    : (PRESETS.find((p) => p.key === preset)?.label ?? "Select Range");

  return (
    <div className="relative w-full sm:w-64">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <div className="flex items-center gap-2 truncate">
          <FaCalendarAlt className="text-indigo-500 text-xs flex-shrink-0" />
          <span className="truncate">{activeLabel}</span>
        </div>
        <FaChevronDown
          className={`text-gray-400 text-xs flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute left-0 right-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-4 max-h-[80vh] overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Ranges
            </p>
            <div className="flex flex-col gap-1 mb-4">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    onPresetChange(p.key);
                    setOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors duration-100 ${
                    preset === p.key
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Custom Range
            </p>
            <div className="flex flex-col gap-3">
              <MonthPickerBox
                label="From"
                value={customStart}
                onChange={(val) => {
                  onPresetChange("custom");
                  onCustomChange("start", val);
                }}
                max={customEnd}
              />

              <MonthPickerBox
                label="To"
                value={customEnd}
                onChange={(val) => {
                  onPresetChange("custom");
                  onCustomChange("end", val);
                }}
                min={customStart}
              />

              <button
                disabled={!customStart || !customEnd || customStart > customEnd}
                onClick={() => {
                  onApply();
                  setOpen(false);
                }}
                className="mt-1 w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
              >
                Apply Range
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

const Dashboard = () => {
  const defaultPreset = "6m";
  const [preset, setPreset] = useState(defaultPreset);
  const { startDate: ds, endDate: de } = getPresetRange(defaultPreset);
  const [customStart, setCustomStart] = useState(ds);
  const [customEnd, setCustomEnd] = useState(de);
  const [appliedRange, setAppliedRange] = useState({
    startDate: ds,
    endDate: de,
  });
  const [rawData, setRawData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async (startDate, endDate) => {
    setLoading(true);
    try {
      const { data: jsonData } = await axios.get("/api/dashboard/counts", {
        params: { startDate, endDate }, // backend must read these query params
      });
      //debug the dashboard data in the admin 31-07-2026
      console.log("admin dashbaord data: ", jsonData);

      setRawData({
        partnersCount: jsonData.partnersCount || 0,
        activeUsersCount: jsonData.usersCount || 0,
        internshipsCount: jsonData.internshipsCount || 0,
        paymentsCount: jsonData.paymentsCount || 0,
        jobApplications: jsonData.jobApplications || 0,
        internshipApprovals: jsonData.internshipApprovals || 0,
        internshipRejections: jsonData.internshipRejections || 0,
        userGrowth: jsonData.userGrowth || [],
        jobPostings: jsonData.jobPostings || [],
        internshipTypeDistribution: jsonData.internshipTypeDistribution || {},
        averageCompensation: jsonData.averageCompensation || {},
        partnerApproval: jsonData.partnerApproval || {},
        partnerGrowth: jsonData.partnerGrowth || [],
        applicationTypeDistribution: jsonData.applicationTypeDistribution || {},
        totalRevenue: jsonData.totalRevenue || 0,
        monthlyRevenue: jsonData.monthlyRevenue || [],
      });
    } catch (error) {
      console.error(
        "Error fetching dashboard data:",
        error.response || error.message,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(appliedRange.startDate, appliedRange.endDate);
    if (preset !== "custom") {
      const interval = setInterval(() => {
        const range = getPresetRange(preset);
        fetchDashboardData(range.startDate, range.endDate);
      }, 30_000);
      return () => clearInterval(interval);
    }
  }, [appliedRange, preset, fetchDashboardData]);

  // ── Frontend filter — safety net when backend returns all months ──────────
  // The 4 time-series arrays (userGrowth, jobPostings, partnerGrowth,
  // monthlyRevenue) each have a `month` field that is filtered here so the
  // charts always display only the selected window even if the backend
  // hasn't been updated to honour startDate/endDate yet.
  const data = useMemo(
    () => ({
      ...rawData,
      userGrowth: filterByRange(
        rawData.userGrowth,
        appliedRange.startDate,
        appliedRange.endDate,
      ),
      jobPostings: filterByRange(
        rawData.jobPostings,
        appliedRange.startDate,
        appliedRange.endDate,
      ),
      partnerGrowth: filterByRange(
        rawData.partnerGrowth,
        appliedRange.startDate,
        appliedRange.endDate,
      ),
      monthlyRevenue: filterByRange(
        rawData.monthlyRevenue,
        appliedRange.startDate,
        appliedRange.endDate,
      ),
    }),
    [rawData, appliedRange],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePresetChange = (key) => {
    setPreset(key);
    if (key !== "custom") {
      const range = getPresetRange(key);
      setCustomStart(range.startDate);
      setCustomEnd(range.endDate);
      setAppliedRange(range);
    }
  };

  const handleCustomChange = (field, value) => {
    if (field === "start") setCustomStart(value);
    else setCustomEnd(value);
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd)
      setAppliedRange({ startDate: customStart, endDate: customEnd });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Admin Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Showing data from{" "}
            <span className="font-medium text-gray-600">
              {formatMonthLabel(appliedRange.startDate)}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-600">
              {formatMonthLabel(appliedRange.endDate)}
            </span>
            {loading && (
              <span className="ml-2 inline-flex items-center gap-1 text-indigo-400">
                <svg
                  className="animate-spin h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Loading…
              </span>
            )}
          </p>
        </div>

        <DateRangeFilter
          preset={preset}
          customStart={customStart}
          customEnd={customEnd}
          onPresetChange={handlePresetChange}
          onCustomChange={handleCustomChange}
          onApply={handleApplyCustom}
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        <Card
          icon={<FaUserFriends className="h-8 w-8 text-blue-600" />}
          title="Partners Enrolled"
          count={data.partnersCount}
          color="bg-blue-100"
        />
        <Card
          icon={<FaUsers className="h-8 w-8 text-green-600" />}
          title="Active Users"
          count={data.activeUsersCount}
          color="bg-green-100"
        />
        <Card
          icon={<FaBriefcase className="h-8 w-8 text-yellow-600" />}
          title="Total Internships"
          count={data.internshipsCount}
          color="bg-yellow-100"
        />
        <Card
          icon={<FaDollarSign className="h-8 w-8 text-red-600" />}
          title="Total Payments"
          count={data.paymentsCount}
          color="bg-red-100"
        />
      </div>

      <DashboardCharts
        userGrowth={data.userGrowth}
        jobPostings={data.jobPostings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
        <InternshipTypeChart distribution={data.internshipTypeDistribution} />
        <AverageCompensationChart data={data.averageCompensation} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
        <PartnerApprovalChart data={data.partnerApproval} />
        <PartnerGrowthChart data={data.partnerGrowth} />
      </div>

      <div className="mt-6 sm:mt-8">
        <ApplicationsByTypeChart data={data.applicationTypeDistribution} />
      </div>

      <div className="mt-6 sm:mt-8">
        <RevenueChart data={data.monthlyRevenue} />
      </div>
    </div>
  );
};

export default Dashboard;
//changes
