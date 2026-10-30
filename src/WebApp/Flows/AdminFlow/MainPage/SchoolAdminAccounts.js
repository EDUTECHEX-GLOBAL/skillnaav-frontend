// SchoolAdminAccounts.js
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import axios from "../../../../api/axiosInstance";
import {
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineSearch,
  AiOutlineClose,
  AiOutlineMail,
  AiOutlineEye,
  AiOutlineCheck,
  AiOutlineCloseCircle,
  AiOutlineTeam,
  AiOutlineClockCircle,
} from "react-icons/ai";

const getAvatarInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : "?";
};

const getAvatarColor = (name) => {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-indigo-500",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};


const SchoolAdminAccounts = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get("/api/school-admin/schooladmins");
        const adminsWithStatus = response.data.map((admin) => ({
          ...admin,
          status: admin.isApproved ? "Approved" : "Pending",
          ...admin.profile // assuming profile fields (affiliation, contactPhone, etc.) are inside profile object
        }));
        setAdmins(adminsWithStatus);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch school admins.");
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);


  const filteredAdmins = admins.filter((admin) =>
    admin.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await axios.patch(`/api/school-admin/approve/${confirmAction.adminId}`);

      setAdmins((prev) =>
        prev.map((admin) =>
          admin._id === confirmAction.adminId ? { ...admin, status: "Approved" } : admin
        )
      );
      setConfirmAction(null);
    } catch (err) {
      alert("Approval failed.");
    } finally {
      setActionLoading(false);
    }
  };


  const handleReject = async () => {
    try {
      setActionLoading(true);
      await axios.patch(`/api/school-admin/reject/${confirmAction.adminId}`);
      setAdmins((prev) =>
        prev.map((admin) =>
          admin._id === confirmAction.adminId ? { ...admin, status: "Rejected" } : admin
        )
      );
      setConfirmAction(null);
    } catch (err) {
      alert("Rejection failed.");
    } finally {
      setActionLoading(false);
    }
  };


  const confirmActionHandler = () => {
    if (confirmAction.type === "approve") handleApprove();
    else handleReject();
  };

  const openModal = (admin) => {
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAdmin(null);
    setIsModalOpen(false);
  };

  const openConfirmationModal = (adminId, type) => {
    setConfirmAction({ adminId, type });
  };

  const downloadPDF = () => {
    if (!selectedAdmin) return;
    const user = selectedAdmin;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const PW = 210; const PH = 297;
    const MX = 18; const CW = PW - MX * 2;

    const setFill = (arr) => doc.setFillColor(...arr);
    const setDraw = (arr) => doc.setDrawColor(...arr);
    const setTxt  = (arr) => doc.setTextColor(...arr);

    // ── Colour palette ─────────────────────────────────────────────────────────
    const C = {
      navy:      [30,  45,  78],
      brand:     [59, 111, 219],
      accent:    [91, 141, 239],
      lightBg:   [244, 247, 254],
      midGrey:   [100, 116, 139],
      lightGrey: [203, 213, 225],
      textDark:  [15,  23,  42],
      white:     [255, 255, 255],
      green:     [6,   95,  70],
      greenBg:   [209, 250, 229],
      red:       [153, 27,  27],
      redBg:     [254, 226, 226],
      amber:     [146, 64,  14],
      amberBg:   [254, 243, 199],
    };

    // ── HEADER BANNER ────────────────────────────────────────────────────────
    const bannerH = 54;
    setFill(C.navy); doc.rect(0, 0, PW, bannerH, "F");

    setFill(C.brand);
    doc.setGState(doc.GState({ opacity: 0.18 }));
    doc.triangle(PW * 0.58, 0, PW, 0, PW * 0.75, bannerH, "F");
    doc.triangle(PW * 0.75, bannerH, PW, 0, PW, bannerH, "F");
    doc.setGState(doc.GState({ opacity: 1 }));

    // Avatar circle
    const ax = MX + 14; const ay = bannerH / 2;
    setFill(C.accent); doc.circle(ax, ay, 13, "F");

    const name = user.schoolName || "School Admin";
    const parts = name.trim().split(" ");
    const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length-1][0] : "")).toUpperCase();
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); setTxt(C.white);
    doc.text(initials, ax, ay + 2.5, { align: "center" });

    // Name + email
    const nx = ax + 13 + 6;
    doc.setFont("helvetica", "bold"); doc.setFontSize(19); setTxt(C.white);
    doc.text(name, nx, 20);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); setTxt(C.lightGrey);
    doc.text(user.contactEmail || user.email || "", nx, 29);

    // Status pill
    const status = user.status || "Pending";
    const [pillBg, pillFg] =
      status === "Approved" ? [C.greenBg, C.green]
      : status === "Rejected" ? [C.redBg, C.red]
      : [C.amberBg, C.amber];
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    const pillW = doc.getTextWidth(`  ${status}  `) + 4;
    setFill(pillBg); doc.roundedRect(nx, 35, pillW, 7, 2, 2, "F");
    setTxt(pillFg); doc.text(`  ${status}`, nx + 1, 40.5);

    // Generated date
    const today = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); setTxt(C.accent);
    doc.text("SKILLNAAV ADMIN PORTAL", PW - MX, 18, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); setTxt(C.lightGrey);
    doc.text(`Generated: ${today}`, PW - MX, 10, { align: "right" });

    // ── SECTION CARD HELPER ──────────────────────────────────────────────────
    const sectionCard = (title, rows, x, y, w) => {
      const visible = rows.filter(([, v]) => v && String(v).trim() !== "" && v !== "N/A");
      if (!visible.length) return y;
      const rowH = 9; const padX = 5; const padTop = 8; const padBot = 4;
      const labelW = 24; const valX = x + padX + 3 + labelW;
      const cardH = padTop + visible.length * rowH + padBot;

      setFill(C.lightBg); doc.roundedRect(x, y, w, cardH, 3, 3, "F");
      setFill(C.brand); doc.roundedRect(x, y, 3, cardH, 1, 1, "F");

      doc.setFont("helvetica", "bold"); doc.setFontSize(7); setTxt(C.brand);
      doc.text(title.toUpperCase(), x + padX + 3, y + 6.5);

      setDraw(C.lightGrey); doc.setLineWidth(0.3);
      doc.line(x + padX + 3, y + padTop - 1, x + w - padX, y + padTop - 1);

      visible.forEach(([label, value], i) => {
        const ry = y + padTop + i * rowH + 6;
        doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); setTxt(C.midGrey);
        doc.text(label, x + padX + 3, ry);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); setTxt(C.textDark);
        const lines = doc.splitTextToSize(String(value), w - padX * 2 - labelW - 3);
        const textToPrint = lines.length > 1 ? lines[0] + "..." : lines[0];
        doc.text(textToPrint, valX, ry);
        if (i < visible.length - 1) {
          setDraw(C.lightGrey); doc.setLineWidth(0.2);
          doc.line(x + padX + 3, y + padTop + (i+1) * rowH + 0.5,
                   x + w - padX,  y + padTop + (i+1) * rowH + 0.5);
        }
      });
      return y + cardH + 5;
    };

    // ── TWO-COLUMN BODY ──────────────────────────────────────────────────────
    const colGap = 4; const colW = (CW - colGap) / 2;
    const col1X = MX; const col2X = MX + colW + colGap;
    let c1Y = bannerH + 8; let c2Y = bannerH + 8;

    sectionCard("School Information", [
      ["School Name",    user.schoolName],
      ["Affiliation",    user.affiliation || "N/A"],
      ["Address",        user.address],
      ["City",           user.city],
      ["State",          user.state],
      ["Country",        user.country],
      ["Postal Code",    user.postalCode],
    ], col1X, c1Y, colW);

    sectionCard("Contact & Details", [
      ["Contact Person", user.contactPerson || "N/A"],
      ["Email",          user.contactEmail || user.email],
      ["Phone",          user.contactPhone || "N/A"],
      ["Website",        user.website || "N/A"],
    ], col2X, c2Y, colW);

    // ── FOOTER ───────────────────────────────────────────────────────────────
    const footerY = PH - 14;
    setDraw(C.lightGrey); doc.setLineWidth(0.3);
    doc.line(MX, footerY - 4, PW - MX, footerY - 4);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); setTxt(C.midGrey);
    doc.text("This document is confidential and intended for administrative use only.",
      PW / 2, footerY, { align: "center" });
    doc.setFont("helvetica", "bold"); setTxt(C.navy);
    doc.text(`Skillnaav · School Admin Profile · ${today}`,
      PW / 2, footerY + 4, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); setTxt(C.midGrey);
    doc.text("Page 1", PW - MX, footerY + 4, { align: "right" });

    doc.save(`${user.schoolName || "SchoolAdmin"}_Profile.pdf`);
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentAdmins = filteredAdmins.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);

  const getPaginationItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, "ellipsis-left", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "ellipsis-left", currentPage - 1, currentPage, currentPage + 1, "ellipsis-right", totalPages];
  };

  const nextPage = () => setCurrentPage((page) => Math.min(page + 1, totalPages));
  const prevPage = () => setCurrentPage((page) => Math.max(page - 1, 1));

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  const totalAdmins = admins.length;
  const pendingAdmins = admins.filter((admin) => admin.status === "Pending").length;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto font-poppins">
      {/* Header and Stats */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 font-poppins">School Admin Accounts</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex-1 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 font-poppins">Total Accounts</p>
              <p className="text-3xl font-bold text-blue-900 font-poppins">{totalAdmins}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-600 text-2xl">
              <AiOutlineTeam />
            </div>
          </div>
          
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 flex-1 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 font-poppins">Pending Approval</p>
              <p className="text-3xl font-bold text-amber-900 font-poppins">{pendingAdmins}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100/50 flex items-center justify-center text-amber-600 text-2xl">
              <AiOutlineClockCircle />
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full mb-6">
        <AiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by School Name or Email"
          className="search-input !mt-0 h-11 w-full !pl-10 pr-10 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent font-poppins placeholder-gray-400 text-sm truncate shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Clear search"
          >
            <AiOutlineClose size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {currentAdmins.map((admin) => (
          <div
            key={admin._id}
            className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            {/* Left: Avatar + Info */}
            <div className="flex items-center gap-4 min-w-0 lg:w-[35%]">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm ${getAvatarColor(
                  admin.schoolName
                )}`}
              >
                {getAvatarInitial(admin.schoolName)}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 truncate font-poppins">
                  {admin.schoolName}
                </h3>
                <p className="text-sm text-gray-500 truncate font-poppins mt-0.5">
                  {admin.email}
                </p>
              </div>
            </div>

            {/* Middle: Status */}
            <div className="flex-shrink-0 lg:w-[20%] flex justify-start lg:justify-center">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(
                  admin.status
                )} font-poppins`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mr-2 ${
                    admin.status === "Approved"
                      ? "bg-emerald-500"
                      : admin.status === "Rejected"
                      ? "bg-rose-500"
                      : "bg-amber-500"
                  }`}
                ></div>
                {admin.status || "Pending Review"}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 lg:w-[45%] lg:justify-end shrink-0">
              <button
                onClick={() => openModal(admin)}
                className="flex items-center justify-center bg-gray-50 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-xl border border-gray-200 transition-all h-10"
                title="View Details"
              >
                <AiOutlineEye className="text-lg" />
              </button>

              <button
                disabled={admin.status === "Approved"}
                onClick={() => openConfirmationModal(admin._id, "approve")}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-sm font-semibold transition-all font-poppins h-10 ${
                  admin.status === "Approved"
                    ? "bg-emerald-50 text-emerald-300 cursor-not-allowed border border-emerald-100"
                    : "bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-500 shadow-sm"
                }`}
              >
                <AiOutlineCheck className="text-base shrink-0" />
                <span>Approve</span>
              </button>

              <button
                disabled={admin.status === "Rejected"}
                onClick={() => openConfirmationModal(admin._id, "reject")}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-sm font-semibold transition-all font-poppins h-10 ${
                  admin.status === "Rejected"
                    ? "bg-rose-50 text-rose-300 cursor-not-allowed border border-rose-100"
                    : "bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 shadow-sm"
                }`}
              >
                <AiOutlineCloseCircle className="text-base shrink-0" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAdmins.length > itemsPerPage && (
        <div className="mt-8 flex justify-center w-full px-0 sm:px-2 pb-8">
          <div className="flex flex-nowrap items-center justify-start sm:justify-center gap-1 sm:gap-1.5 bg-white p-1.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50 max-w-full overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
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
                  onClick={() => setCurrentPage(item)}
                  className={`w-8 sm:w-10 h-9 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                    currentPage === item
                      ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  aria-label={`Go to page ${item}`}
                  aria-current={currentPage === item ? "page" : undefined}
                >
                  {item}
                </button>
              );
            })}

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50/50 shrink-0"
            >
              <span className="hidden sm:inline">Next</span>
              <AiOutlineRight size={16} />
            </button>
          </div>
        </div>
      )}

      {isModalOpen && selectedAdmin && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-poppins">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn overflow-hidden">
            {/* Minimal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                School Admin Profile
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {/* Profile Header Block */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md flex-shrink-0 ${getAvatarColor(
                    selectedAdmin.schoolName
                  )}`}
                >
                  {getAvatarInitial(selectedAdmin.schoolName)}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1.5">
                    {selectedAdmin.schoolName}
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-gray-600 mb-3 text-sm">
                    <span className="flex items-center gap-1.5">
                      <AiOutlineMail className="text-base" />
                      {selectedAdmin.contactEmail || selectedAdmin.email}
                    </span>
                    <span className="hidden sm:inline text-gray-300">•</span>
                    <span className="flex items-center gap-1.5">
                      {selectedAdmin.contactPhone || "No Phone"}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                      selectedAdmin.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedAdmin.status === "Rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    Status: {selectedAdmin.status || "Pending"}
                  </span>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* School Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">
                    School Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-0.5">Affiliation</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedAdmin.affiliation || "Not Provided"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-0.5">Website</p>
                      {selectedAdmin.website ? (
                        <a href={selectedAdmin.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-medium break-all">
                          {selectedAdmin.website}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-900 font-medium">Not Provided</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Person */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">
                    Primary Contact
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-0.5">Contact Person</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedAdmin.contactPerson || "Not Provided"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-0.5">Direct Phone</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedAdmin.contactPhone || "Not Provided"}</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 md:col-span-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">
                    Address Location
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold text-gray-500 mb-0.5">Street Address</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedAdmin.address || "Not Provided"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-0.5">City</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedAdmin.city || "Not Provided"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-0.5">State / Province</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedAdmin.state || "Not Provided"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-0.5">Postal Code</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedAdmin.postalCode || "Not Provided"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-0.5">Country</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedAdmin.country || "Not Provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-4 sm:p-5 bg-white flex-shrink-0 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-5 rounded-xl font-semibold transition-all text-sm"
              >
                Close
              </button>
              <button
                onClick={downloadPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-xl font-semibold transition-all text-sm shadow-sm shadow-blue-500/20"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl transform transition-all">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Confirm {confirmAction.type}?</h3>
            <div className="flex justify-center gap-3">
              <button 
                className={`flex items-center justify-center min-w-[80px] text-white px-5 py-2.5 rounded-xl font-semibold transition-colors ${confirmAction.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`} 
                onClick={confirmActionHandler}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Yes"
                )}
              </button>
              <button 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50" 
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdminAccounts;
