const PDFDocument = require("pdfkit");
const moment = require("moment");
const axios = require("axios");

const SKILLNAAV_BRAND = "#1d4ed8";
const SKILLNAAV_LOGO_URL = process.env.SKILLNAAV_LOGO_URL || null;

/**
 * Safely fetch an image buffer. Returns null on any failure.
 */
const fetchImageBuffer = async (url, timeout = 6000) => {
  if (!url) return null;
  try {
    const resp = await axios.get(url, { responseType: "arraybuffer", timeout });
    return Buffer.from(resp.data, "binary");
  } catch {
    return null;
  }
};

/**
 * Draw a styled text "pill" inside the header bar.
 * Uses doc.text() with explicit x/y so PDFKit cursor never auto-advances.
 */
const drawTextPill = (doc, label, x, y, pillW, fillColor, textColor) => {
  const pillH = 26;
  const radius = 5;
  doc.save()
     .roundedRect(x, y, pillW, pillH, radius)
     .fillOpacity(0.18).fill(fillColor)
     .restore();
  doc.font("Helvetica-Bold")
     .fontSize(11)
     .fillColor(textColor)
     .text(label, x, y + 7, { width: pillW, align: "center", lineBreak: false });
};

const generateOfferPDFBuffer = async (offerData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0, size: "A4" });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageW = doc.page.width;
      const pageH = doc.page.height;

      const partnerBrand   = offerData.partnerBrandColor || SKILLNAAV_BRAND;
      const bgFill         = "#f6f8fb";
      const textColor      = "#111827";
      const cardMargin     = 48;
      const cardX          = cardMargin;
      const cardY          = cardMargin;
      const cardW          = pageW - cardMargin * 2;
      const cardH          = pageH - cardMargin * 2;
      const pad            = 28;
      const innerX         = cardX + pad;
      const innerW         = cardW - pad * 2;

      // ── Background ────────────────────────────────────────────────────────────
      const bgBuf = await fetchImageBuffer(offerData.backgroundImageUrl);
      if (bgBuf) {
        try {
          doc.image(bgBuf, 0, 0, { width: pageW, height: pageH });
          doc.save().rect(0, 0, pageW, pageH).fillOpacity(0.45).fill("#ffffff").restore();
        } catch {
          doc.rect(0, 0, pageW, pageH).fill(bgFill);
        }
      } else {
        doc.rect(0, 0, pageW, pageH).fill(bgFill);
      }

      // ── Card shadow + card ────────────────────────────────────────────────────
      doc.save().roundedRect(cardX + 6, cardY + 8, cardW, cardH, 8).fillOpacity(0.06).fill("#000000").restore();
      doc.save().roundedRect(cardX, cardY, cardW, cardH, 8).fill("#ffffff").strokeOpacity(0.12).lineWidth(1).stroke("#d1d5db").restore();

      // ── Header bar ────────────────────────────────────────────────────────────
      const headerH = 56;
      doc.save()
         .roundedRect(cardX, cardY, cardW, headerH, 8)
         .fill(partnerBrand);
      doc.rect(cardX, cardY + headerH - 10, cardW, 10).fill(partnerBrand).restore();

      // ── Fetch logos in parallel ───────────────────────────────────────────────
      const [skillnaavLogoBuf, partnerLogoBuf] = await Promise.all([
        fetchImageBuffer(SKILLNAAV_LOGO_URL),
        fetchImageBuffer(offerData.partnerLogoUrl),
      ]);

      const logoY   = cardY + 12;
      const logoFitH = 32;
      const pillW   = 110;

      // ── LEFT: SkillNaav logo ──────────────────────────────────────────────────
      if (skillnaavLogoBuf) {
        try {
          doc.image(skillnaavLogoBuf, innerX, logoY, { fit: [pillW, logoFitH] });
        } catch {
          drawTextPill(doc, "SkillNaav", innerX, logoY, pillW, "#ffffff", "#ffffff");
        }
      } else {
        // Text pill — white semi-transparent background, white text
        drawTextPill(doc, "SkillNaav", innerX, logoY, pillW, "#ffffff", "#ffffff");
      }

      // ── CENTER divider dot ─────────────────────────────────────────────────────
      const midX = cardX + cardW / 2;
      doc.save()
         .circle(midX, logoY + logoFitH / 2, 2.5)
         .fillOpacity(0.5).fill("#ffffff")
         .restore();

      // ── RIGHT: Partner logo ───────────────────────────────────────────────────
      const partnerX = cardX + cardW - pad - pillW;
      if (partnerLogoBuf) {
        try {
          doc.image(partnerLogoBuf, partnerX, logoY, { fit: [pillW, logoFitH] });
        } catch {
          drawTextPill(doc, offerData.companyName || "Partner", partnerX, logoY, pillW, "#ffffff", "#ffffff");
        }
      } else {
        drawTextPill(doc, offerData.companyName || "Partner", partnerX, logoY, pillW, "#ffffff", "#ffffff");
      }

      // ── Content area ──────────────────────────────────────────────────────────
      const contentTopY     = cardY + headerH + 20;
      const innerH          = cardH - headerH - pad;
      const signatureHeight = 120;
      const usableHeight    = innerH - signatureHeight - 12;

      let responsibilities = (offerData.jobDescription || "").split("\n").map(s => s.trim()).filter(Boolean);
      let qualifications   = (offerData.qualifications || []).slice();

      const minFont  = 9;
      let baseFont   = 11.5;

      // ── Height measurement (throw-away doc) ──────────────────────────────────
      const measureContentHeight = (fontSize, respArr, qualArr) => {
        const mDoc = new PDFDocument({ margin: 0, size: "A4" });
        mDoc.end();
        mDoc.font("Helvetica").fontSize(fontSize);
        let y = 0;
        y += mDoc.heightOfString(`Date: ${moment().format("MMMM D, YYYY")}`, { width: innerW }) + 8;
        y += mDoc.heightOfString(`To: ${offerData.name || ""}`, { width: innerW }) + 4;
        if (offerData.email) y += mDoc.heightOfString(`Email: ${offerData.email}`, { width: innerW }) + 8;
        mDoc.font("Helvetica-Bold").fontSize(Math.round(fontSize * 1.18));
        y += mDoc.heightOfString(`OFFER LETTER – ${offerData.position || ""}`, { width: innerW }) + 10;
        mDoc.font("Helvetica").fontSize(fontSize);
        const intro = `Dear ${offerData.name || "Candidate"},\n\nWe are delighted to offer you the position of ${offerData.position || "—"} at ${offerData.companyName || "—"}. Your internship is scheduled to commence on ${offerData.startDate ? moment(offerData.startDate).format("MMMM D, YYYY") : "TBD"}.`;
        y += mDoc.heightOfString(intro, { width: innerW, lineGap: 4 }) + 10;
        const pushSection = (title, lines) => {
          mDoc.font("Helvetica-Bold").fontSize(Math.round(fontSize * 1.02));
          y += mDoc.heightOfString(title.toUpperCase(), { width: innerW }) + 6;
          mDoc.font("Helvetica").fontSize(fontSize);
          lines.forEach((ln) => { y += mDoc.heightOfString(`• ${ln}`, { width: innerW - 20 }) + 4; });
          y += 6;
        };
        pushSection("Position Details", [
          `Job Title: ${offerData.position || "—"}`,
          `Reporting Manager: ${offerData.contactInfo?.name || "HR Manager"}`,
          `Location: ${offerData.location || "—"}`,
          `Start Date: ${offerData.startDate ? moment(offerData.startDate).format("MMMM D, YYYY") : "—"}`,
          `Duration: ${offerData.duration || "—"}`
        ]);
        const compLines = [];
        if (offerData.internshipType === "STIPEND") {
          const c = offerData.compensationDetails || {};
          compLines.push(`${c.amount ?? "—"} ${c.currency ?? ""} ${c.frequency ? `per ${c.frequency.toLowerCase()}` : ""}`);
          if (c.benefits?.length) compLines.push(`Benefits: ${c.benefits.join(", ")}`);
        } else if (offerData.internshipType === "PAID") {
          compLines.push("This is a paid internship.");
        } else {
          compLines.push("This is an unpaid internship.");
        }
        pushSection("Compensation Details", compLines);
        if (respArr.length) pushSection("Key Responsibilities", respArr);
        if (qualArr.length) pushSection("Required Qualifications", qualArr);
        pushSection("Terms and Conditions", [
          "This offer is contingent upon successful completion of any pre-internship requirements.",
          "Interns are expected to adhere to all company policies.",
          `The internship may be terminated by either party with ${offerData.noticePeriod || "2 weeks"} notice.`
        ]);
        y += mDoc.heightOfString(`Please sign and return this offer letter by ${moment().add(7, "days").format("MMMM D, YYYY")} to confirm your acceptance.`, { width: innerW }) + 12;
        return y;
      };

      // Shrink font to fit, then truncate lists if still too tall
      let measured = measureContentHeight(baseFont, responsibilities, qualifications);
      while (measured > usableHeight && baseFont > minFont) {
        baseFont -= 0.5;
        measured = measureContentHeight(baseFont, responsibilities, qualifications);
      }
      let respLimit = responsibilities.length;
      let qualLimit = qualifications.length;
      while (measured > usableHeight && (respLimit > 2 || qualLimit > 1)) {
        if (respLimit > 2) respLimit = Math.max(2, respLimit - 2);
        else if (qualLimit > 1) qualLimit = Math.max(1, qualLimit - 1);
        responsibilities = responsibilities.slice(0, respLimit);
        qualifications   = qualifications.slice(0, qualLimit);
        if (respLimit < (offerData.jobDescription || "").split("\n").filter(Boolean).length)
          responsibilities.push("...see full description in portal");
        if (qualLimit < (offerData.qualifications || []).length)
          qualifications.push("...see full description in portal");
        measured = measureContentHeight(baseFont, responsibilities, qualifications);
      }

      const finalFont   = Math.max(baseFont, minFont);
      const headingFont = Math.round(finalFont * 1.18);
      let cursorY       = contentTopY;

      // ── Date ─────────────────────────────────────────────────────────────────
      doc.font("Helvetica").fontSize(finalFont).fillColor("#6b7280")
         .text(`Date: ${moment().format("MMMM D, YYYY")}`, innerX, cursorY, { width: innerW, align: "right", lineBreak: false });
      cursorY += doc.heightOfString("Date", { width: innerW }) + 8;

      // ── To / Email ────────────────────────────────────────────────────────────
      doc.font("Helvetica-Bold").fontSize(finalFont).fillColor(textColor)
         .text(`To: ${offerData.name || ""}`, innerX, cursorY, { width: innerW, lineBreak: false });
      cursorY += doc.heightOfString(`To: ${offerData.name || ""}`, { width: innerW }) + 4;
      if (offerData.email) {
        doc.font("Helvetica").fontSize(Math.max(finalFont - 0.5, 9)).fillColor("#374151")
           .text(`Email: ${offerData.email}`, innerX, cursorY, { width: innerW, lineBreak: false });
        cursorY += doc.heightOfString(`Email: ${offerData.email}`, { width: innerW }) + 10;
      } else cursorY += 6;

      // ── Divider ───────────────────────────────────────────────────────────────
      doc.save().moveTo(innerX, cursorY).lineTo(innerX + innerW, cursorY)
         .lineWidth(0.7).strokeOpacity(0.12).stroke("#9ca3af").restore();
      cursorY += 12;

      // ── Title ────────────────────────────────────────────────────────────────
      doc.font("Helvetica-Bold").fontSize(headingFont).fillColor(partnerBrand)
         .text(`OFFER LETTER – ${String(offerData.position || "").toUpperCase()}`, innerX, cursorY, { width: innerW, lineBreak: false });
      cursorY += doc.heightOfString(`OFFER LETTER – ${offerData.position}`, { width: innerW }) + 10;

      // ── Intro ─────────────────────────────────────────────────────────────────
      doc.font("Helvetica").fontSize(finalFont).fillColor(textColor);
      const intro = `Dear ${offerData.name || "Candidate"},\n\nWe are delighted to offer you the position of ${offerData.position || "—"} at ${offerData.companyName || "—"}. Your internship is scheduled to commence on ${offerData.startDate ? moment(offerData.startDate).format("MMMM D, YYYY") : "TBD"}.`;
      doc.text(intro, innerX, cursorY, { width: innerW, lineGap: 4 });
      cursorY += doc.heightOfString(intro, { width: innerW }) + 10;

      // ── Section renderer ──────────────────────────────────────────────────────
      const drawSection = (title, lines) => {
        doc.font("Helvetica-Bold").fontSize(Math.round(finalFont * 1.02)).fillColor(partnerBrand)
           .text(title.toUpperCase(), innerX, cursorY, { width: innerW, lineBreak: false });
        cursorY += doc.heightOfString(title, { width: innerW }) + 6;
        doc.font("Helvetica").fontSize(finalFont).fillColor(textColor);
        lines.forEach((ln) => {
          doc.text(`• ${ln}`, innerX + 8, cursorY, { width: innerW - 20, lineGap: 2 });
          cursorY += doc.heightOfString(`• ${ln}`, { width: innerW - 20 }) + 4;
        });
        cursorY += 6;
      };

      drawSection("Position Details", [
        `Job Title: ${offerData.position || "—"}`,
        `Reporting Manager: ${offerData.contactInfo?.name || "HR Manager"}`,
        `Location: ${offerData.location || "—"}`,
        `Start Date: ${offerData.startDate ? moment(offerData.startDate).format("MMMM D, YYYY") : "—"}`,
        `Duration: ${offerData.duration || "—"}`
      ]);

      const compLines = [];
      if (offerData.internshipType === "STIPEND") {
        const c = offerData.compensationDetails || {};
        compLines.push(`${c.amount ?? "—"} ${c.currency ?? ""} ${c.frequency ? `per ${c.frequency.toLowerCase()}` : ""}`);
        if (c.benefits?.length) compLines.push(`Benefits: ${c.benefits.join(", ")}`);
      } else if (offerData.internshipType === "PAID") {
        compLines.push("This is a paid internship.");
      } else {
        compLines.push("This is an unpaid internship.");
      }
      drawSection("Compensation Details", compLines);

      if (responsibilities.length) drawSection("Key Responsibilities", responsibilities);
      if (qualifications.length)   drawSection("Required Qualifications", qualifications);

      drawSection("Terms and Conditions", [
        "This offer is contingent upon successful completion of any pre-internship requirements.",
        "Interns are expected to adhere to all company policies.",
        `The internship may be terminated by either party with ${offerData.noticePeriod || "2 weeks"} notice.`
      ]);

      // ── Acceptance ────────────────────────────────────────────────────────────
      const acceptanceLine = `Please sign and return this offer letter by ${moment().add(7, "days").format("MMMM D, YYYY")} to confirm your acceptance.`;
      doc.font("Helvetica-Bold").fontSize(Math.round(finalFont)).fillColor(partnerBrand)
         .text("ACCEPTANCE", innerX, cursorY, { lineBreak: false });
      cursorY += doc.heightOfString("ACCEPTANCE", { width: innerW }) + 6;
      doc.font("Helvetica").fontSize(finalFont).fillColor(textColor)
         .text(acceptanceLine, innerX, cursorY, { width: innerW, lineGap: 4 });
      cursorY += doc.heightOfString(acceptanceLine, { width: innerW }) + 12;

      // ── Signature block (anchored to bottom of card) ──────────────────────────
      const signY = cardY + cardH - signatureHeight + 10;
      if (cursorY > signY - 20) {
        doc.save().moveTo(innerX, signY - 30).lineTo(innerX + innerW, signY - 30)
           .lineWidth(0.6).strokeOpacity(0.08).stroke("#9ca3af").restore();
      }

      doc.font("Helvetica").fontSize(finalFont).fillColor(textColor)
         .text("We look forward to welcoming you aboard!", innerX, signY - 64, { width: innerW, lineBreak: false });
      doc.font("Helvetica").text("Sincerely,", innerX, signY - 48, { lineBreak: false });
      doc.moveTo(innerX, signY - 16).lineTo(innerX + 180, signY - 16)
         .lineWidth(0.9).strokeOpacity(0.14).stroke("#374151");

      doc.font("Helvetica-Bold").fontSize(finalFont).fillColor(textColor)
         .text(offerData.contactInfo?.name || "HR Manager", innerX, signY, { lineBreak: false });
      doc.font("Helvetica").fontSize(Math.max(finalFont - 0.5, 9)).fillColor("#6b7280")
         .text(offerData.companyName || "", innerX, signY + 18, { lineBreak: false });

      const hasContactLine = offerData.contactInfo?.email || offerData.contactInfo?.phone;
      if (hasContactLine) {
        const sep         = offerData.contactInfo.email && offerData.contactInfo.phone ? " | " : "";
        const contactText = `${offerData.contactInfo.email || ""}${sep}${offerData.contactInfo.phone || ""}`;
        doc.font("Helvetica").fontSize(Math.max(finalFont - 2, 8)).fillColor("#6b7280")
           .text(contactText, innerX, signY + 36, { lineBreak: false });
      }

      // ── Footer bar ────────────────────────────────────────────────────────────
      const footerY = cardY + cardH - 22;
      doc.save().rect(cardX, footerY, cardW, 22).fill(partnerBrand).restore();
      doc.font("Helvetica").fontSize(8).fillColor("#ffffff")
         .text("Generated by SkillNaav · skillnaav.com", cardX, footerY + 7, { width: cardW, align: "center", lineBreak: false });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateOfferPDFBuffer;