import React, { useEffect, useState } from "react";
import axios from "../../../../api/axiosInstance";
import jsPDF from "jspdf";
import {
  AiOutlineCheck,
  AiOutlineCloseCircle,
  AiOutlineClose,
  AiOutlineSearch,
  AiOutlineFilePdf,
  AiOutlineEye,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineMail,
  AiOutlineIdcard,
  AiOutlineTeam,
  AiOutlineClockCircle,
} from "react-icons/ai";

const PartnerManagement = () => {
  // ---------------- STATES ----------------
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 9;

  // ---------------- FETCH ----------------
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data } = await axios.get("/api/partners/partners");
        setPartners(data);
        setFilteredPartners(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // ---------------- FILTER ----------------
  useEffect(() => {
    let result = partners;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.universityName?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q),
      );
    }

    setFilteredPartners(result);
    setCurrentPage(1);
  }, [searchQuery, partners]);

  // ---------------- PAGINATION ----------------
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentPartners = filteredPartners.slice(indexOfFirst, indexOfLast);

  const getPaginationItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
    }

    if (currentPage >= totalPages - 3) {
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
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis-right",
      totalPages,
    ];
  };

  // ---------------- HELPERS ----------------
  const hasProfileImage = (partner) =>
    partner.profileImage &&
    partner.profileImage !== "null" &&
    partner.profileImage !== "undefined" &&
    partner.profileImage.trim() !== "";

  const getProfileImageUrl = (profileImage) => {
    if (!profileImage || profileImage.trim() === "") return null;
    if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
      return profileImage;
    }
    const baseUrl = process.env.REACT_APP_API_BASE || "http://localhost:5000";
    const normalizedImage = profileImage.replace(/\\/g, "/");
    if (normalizedImage.startsWith("/")) return `${baseUrl}${normalizedImage}`;
    if (normalizedImage.startsWith("uploads/")) return `${baseUrl}/${normalizedImage}`;
    return `${baseUrl}/uploads/${normalizedImage}`;
  };

  const getAvatarInitial = (name) => name?.charAt(0)?.toUpperCase() || "P";

  const getAvatarColor = (name) => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-indigo-600",
      "bg-gradient-to-br from-emerald-500 to-teal-600",
      "bg-gradient-to-br from-violet-500 to-purple-600",
      "bg-gradient-to-br from-rose-500 to-pink-600",
      "bg-gradient-to-br from-amber-500 to-orange-600",
    ];
    const index =
      name?.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
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

  const nextPage = () =>
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  const prevPage = () => setCurrentPage((page) => Math.max(page - 1, 1));

  // ---------------- ACTIONS ----------------
  const handleConfirm = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);

    try {
      await axios.patch(
        `/api/partners/${confirmAction.type}/${confirmAction.partnerId}`,
      );

      setPartners((prev) =>
        prev.map((p) =>
          p._id === confirmAction.partnerId
            ? {
                ...p,
                status:
                  confirmAction.type === "approve" ? "Approved" : "Rejected",
              }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const downloadPDF = () => {
    if (!selectedPartner) return;
    const user = selectedPartner;
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

    const name = user.universityName || "Partner";
    const parts = name.trim().split(" ");
    const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length-1][0] : "")).toUpperCase();
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); setTxt(C.white);
    doc.text(initials, ax, ay + 2.5, { align: "center" });

    // Name + email
    const nx = ax + 13 + 6;
    doc.setFont("helvetica", "bold"); doc.setFontSize(19); setTxt(C.white);
    doc.text(name, nx, 20);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); setTxt(C.lightGrey);
    doc.text(user.email || "", nx, 29);

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
      const padX = 5; const padTop = 8; const padBot = 4;
      const labelW = 32; 
      const availW = w - padX * 2 - labelW - 3;
      
      const rowHeights = visible.map(([label, value]) => {
        doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
        const lines = doc.splitTextToSize(String(value), availW);
        const height = Math.max(9, lines.length * 4 + 5); 
        return { label, lines, height };
      });
      
      const cardH = padTop + rowHeights.reduce((sum, r) => sum + r.height, 0) + padBot;

      setFill(C.lightBg); doc.roundedRect(x, y, w, cardH, 3, 3, "F");
      setFill(C.brand); doc.roundedRect(x, y, 3, cardH, 1, 1, "F");

      doc.setFont("helvetica", "bold"); doc.setFontSize(7); setTxt(C.brand);
      doc.text(title.toUpperCase(), x + padX + 3, y + 6.5);

      setDraw(C.lightGrey); doc.setLineWidth(0.3);
      doc.line(x + padX + 3, y + padTop - 1, x + w - padX, y + padTop - 1);

      let currentY = y + padTop;
      const valX = x + padX + 3 + labelW;
      
      rowHeights.forEach((row, i) => {
        const ry = currentY + 6;
        doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); setTxt(C.midGrey);
        doc.text(row.label, x + padX + 3, ry);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); setTxt(C.textDark);
        doc.text(row.lines, valX, ry);
        
        currentY += row.height;
        if (i < visible.length - 1) {
          setDraw(C.lightGrey); doc.setLineWidth(0.2);
          doc.line(x + padX + 3, currentY + 0.5,
                   x + w - padX,  currentY + 0.5);
        }
      });
      return y + cardH + 5;
    };

    // ── TWO-COLUMN BODY ──────────────────────────────────────────────────────
    const colGap = 4; const colW = (CW - colGap) / 2;
    const col1X = MX; const col2X = MX + colW + colGap;
    const c1Y = bannerH + 8; const c2Y = bannerH + 8;

    sectionCard("Partner Information", [
      ["University",     user.universityName],
      ["Institution ID", user.institutionId || "N/A"],
      ["Address",        user.address],
      ["City",           user.city],
      ["State",          user.state],
      ["Country",        user.country],
      ["Postal Code",    user.postalCode],
    ], col1X, c1Y, colW);

    sectionCard("Contact & Details", [
      ["Contact Name", user.contactPersonName || user.contactPerson || "N/A"],
      ["Email",        user.email],
      ["Phone",        user.phoneNumber || user.contactPhone || "N/A"],
      ["Website",      user.website || "N/A"],
    ], col2X, c2Y, colW);

    // ── FOOTER ───────────────────────────────────────────────────────────────
    const footerY = PH - 14;
    setDraw(C.lightGrey); doc.setLineWidth(0.3);
    doc.line(MX, footerY - 4, PW - MX, footerY - 4);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); setTxt(C.midGrey);
    doc.text("This document is confidential and intended for administrative use only.",
      PW / 2, footerY, { align: "center" });
    doc.setFont("helvetica", "bold"); setTxt(C.navy);
    doc.text(`Skillnaav · Partner Profile · ${today}`,
      PW / 2, footerY + 4, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); setTxt(C.midGrey);
    doc.text("Page 1", PW - MX, footerY + 4, { align: "right" });

    doc.save(`${user.universityName || "Partner"}_Profile.pdf`);
  };

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-poppins">Loading partners...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AiOutlineCloseCircle className="text-2xl text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 font-poppins mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 font-poppins">{error}</p>
        </div>
      </div>
    );
  }

  // ---------------- RENDER ----------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-poppins p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-poppins">
            Partner Applications
          </h1>
          <p className="text-gray-600 mt-2 font-poppins">
            Review and manage partner onboarding requests
          </p>

          {/* STATS */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6 max-w-3xl">
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex-1 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 font-poppins">Total Partners</p>
                <p className="text-3xl font-bold text-blue-900 font-poppins">{partners.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-600 text-2xl">
                <AiOutlineTeam />
              </div>
            </div>
            
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 flex-1 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 font-poppins">Pending Review</p>
                <p className="text-3xl font-bold text-amber-900 font-poppins">
                  {partners.filter((p) => !p.status || p.status === "Pending").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100/50 flex items-center justify-center text-amber-600 text-2xl">
                <AiOutlineClockCircle />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <AiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
            <input
              type="text"
              name="partner_search_query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              autoComplete="on"
              className="search-input !mt-0 h-11 w-full !pl-10 pr-10 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-poppins placeholder-gray-400 text-sm truncate"
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
        </div>

        {/* PARTNER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPartners.map((partner) => (
            <div
              key={partner._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {hasProfileImage(partner) ? (
                      <img
                        src={getProfileImageUrl(partner.profileImage)}
                        alt={partner.name}
                        className="w-14 h-14 rounded-xl object-cover border-4 border-white shadow-md"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md ${getAvatarColor(
                          partner.name,
                        )}`}
                      >
                        {getAvatarInitial(partner.universityName)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate font-poppins">
                      {partner.universityName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate font-poppins flex items-center gap-1 mt-1">
                      <AiOutlineMail className="flex-shrink-0" />
                      <span className="truncate">{partner.email}</span>
                    </p>

                    {/* Status */}
                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          partner.status,
                        )} font-poppins`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            partner.status === "Approved"
                              ? "bg-emerald-500"
                              : partner.status === "Rejected"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                          }`}
                        ></div>
                        {partner.status || "Pending Review"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="px-5 pb-5">
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSelectedPartner(partner);
                      setIsModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-800 py-2 px-3 rounded-xl border border-gray-300 transition-all font-medium font-poppins text-sm"
                  >
                    <AiOutlineEye className="shrink-0" />
                    <span className="truncate">View Details</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      disabled={partner.status === "Approved"}
                      onClick={() =>
                        setConfirmAction({
                          type: "approve",
                          partnerId: partner._id,
                        })
                      }
                      className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 sm:px-2 rounded-xl text-xs font-medium transition-all font-poppins overflow-hidden ${
                        partner.status === "Approved"
                          ? "bg-emerald-100 text-emerald-700 cursor-not-allowed opacity-70"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      }`}
                    >
                      <AiOutlineCheck className="text-sm shrink-0" />
                      <span className="truncate">Approve</span>
                    </button>

                    <button
                      disabled={partner.status === "Rejected"}
                      onClick={() =>
                        setConfirmAction({
                          type: "reject",
                          partnerId: partner._id,
                        })
                      }
                      className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 sm:px-2 rounded-xl text-xs font-medium transition-all font-poppins overflow-hidden ${
                        partner.status === "Rejected"
                          ? "bg-rose-100 text-rose-700 cursor-not-allowed opacity-70"
                          : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                      }`}
                    >
                      <AiOutlineCloseCircle className="text-sm shrink-0" />
                      <span className="truncate">Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* NO RESULTS */}
        {filteredPartners.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AiOutlineSearch className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 font-poppins mb-2">
              No partners found
            </h3>
            <p className="text-gray-600 font-poppins">
              {searchQuery
                ? "Try adjusting your search"
                : "No partner applications available"}
            </p>
          </div>
        )}

        {/* PAGINATION */}
        {filteredPartners.length > itemsPerPage && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-white p-1 sm:p-1.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50 max-w-full overflow-x-auto scrollbar-none">
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
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}
      {isModalOpen && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/*Remove overflow-hidden add "flex flex-col" for scrolling purpose in mobile view - 05-08-2026*/}
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            {/*Add the flex-shrink-0 for fixed position in scrolling in the mobile view - 05-08-2026 */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 font-poppins">
                  Partner Details
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Content */}
            {/*Add the flex-1 for scrolling the content in mobile view - 05-06-2026 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Avatar & Name */}
              <div className="text-center">
                {hasProfileImage(selectedPartner) ? (
                  <img
                    src={getProfileImageUrl(selectedPartner.profileImage)}
                    alt={selectedPartner.name}
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg mx-auto"
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg ${getAvatarColor(
                      selectedPartner.name,
                    )}`}
                  >
                    {getAvatarInitial(selectedPartner.universityName)}
                  </div>
                )}

                <h3 className="text-2xl font-bold mt-4 text-gray-900 font-poppins">
                  {selectedPartner.universityName}
                </h3>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(
                    selectedPartner.status,
                  )} font-poppins`}
                >
                  {selectedPartner.status || "Pending Review"}
                </span>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-gray-600 mb-1">
                    <AiOutlineMail className="text-lg" />
                    <span className="text-sm font-medium font-poppins">
                      Email Address
                    </span>
                  </div>
                  <p className="text-gray-900 font-poppins pl-8">
                    {selectedPartner.email}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-gray-600 mb-1">
                    <AiOutlineIdcard className="text-lg" />
                    <span className="text-sm font-medium font-poppins">
                      Institution ID
                    </span>
                  </div>
                  <p className="text-gray-900 font-poppins pl-8">
                    {selectedPartner.institutionId || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            {/*Add the flex-shrink-0 for fixed position in scrolling in the mobile view - 05-08-2026  */}
            <div className="border-t border-gray-200 p-6 bg-gray-50  flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={downloadPDF}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all font-poppins"
                >
                  <AiOutlineFilePdf className="text-lg" />
                  Download PDF
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-medium transition-all font-poppins"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-fadeIn">
            <div className="p-8 text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  confirmAction.type === "approve"
                    ? "bg-emerald-100"
                    : "bg-rose-100"
                }`}
              >
                {confirmAction.type === "approve" ? (
                  <AiOutlineCheck className="text-3xl text-emerald-600" />
                ) : (
                  <AiOutlineCloseCircle className="text-3xl text-rose-600" />
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3 font-poppins">
                Confirm{" "}
                {confirmAction.type === "approve" ? "Approval" : "Rejection"}
              </h3>

              <p className="text-gray-600 mb-8 font-poppins">
                Are you sure you want to {confirmAction.type} this partner
                application? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={confirmLoading}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all font-poppins ${
                    confirmAction.type === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                  } disabled:opacity-50`}
                >
                  {confirmLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    "Yes, Continue"
                  )}
                </button>

                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-all font-poppins"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerManagement;
