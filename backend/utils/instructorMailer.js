// backend/utils/instructorMailer.js
const notifyUser = require("./notifyUser");

// Optional public base URL to make file links absolute (ex: https://skillnaav.com)
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";

// Convert camelCase -> "Title Case"
function toLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Render any value to a readable string
function renderValue(v) {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(renderValue).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// Build a simple key/value table for arbitrary fields
function renderKVTable(obj, { exclude = [] } = {}) {
  const rows = Object.entries(obj)
    .filter(([k]) => !exclude.includes(k) && !k.startsWith("__"))
    .map(([k, v]) => {
      const val = renderValue(v);
      if (val === "" || val === "null" || val === "undefined") return null;
      return `
        <tr>
          <td style="padding:8px 12px; border-bottom:1px solid #eee; font-weight:600; width: 40%;">${toLabel(k)}</td>
          <td style="padding:8px 12px; border-bottom:1px solid #eee;">${val}</td>
        </tr>`;
    })
    .filter(Boolean)
    .join("");

  if (!rows) return "<p>No details available.</p>";

  return `
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; border:1px solid #eee; border-radius:8px; overflow:hidden;">
      <tbody>${rows}</tbody>
    </table>`;
}

function absUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${PUBLIC_BASE_URL}${url}`;
}

/**
 * Compose the instructor “created” email body.
 * We include:
 *  - All top-level fields (except internals & file blobs)
 *  - File links (resume, photo, certificates) when present
 */
function buildInstructorCreatedEmail(docRaw) {
  const doc = typeof docRaw?.toObject === "function" ? docRaw.toObject() : docRaw || {};
  const {
    email,
    firstName,
    lastName,
    resume,
    photo,
    certificates,
    createdAt,
    updatedAt,
    __v,
    _id,
    ...rest
  } = doc;

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Instructor";
  const subject = "SkillNaav — Your Instructor Profile Has Been Created";

  const detailsTable = renderKVTable(rest, {
    exclude: [
      // already removed above: email, firstName, lastName, resume, photo, certificates, createdAt, updatedAt, _id, __v
      // Add any more fields to hide here if needed.
    ],
  });

  const resumeLink = resume?.url ? `<li>Resume: <a href="${absUrl(resume.url)}" target="_blank" rel="noopener">View</a></li>` : "";
  const photoLink = photo?.url ? `<li>Photo: <a href="${absUrl(photo.url)}" target="_blank" rel="noopener">View</a></li>` : "";
  const certLinks =
    Array.isArray(certificates) && certificates.length
      ? `<li>Certificates:
           <ul>${certificates
        .map((c, i) => `<li><a href="${absUrl(c.url)}" target="_blank" rel="noopener">Certificate ${i + 1}</a></li>`)
        .join("")}
           </ul>
         </li>`
      : "";

  const filesBlock =
    resumeLink || photoLink || certLinks
      ? `<ul style="margin:0; padding-left:18px;">${resumeLink}${photoLink}${certLinks}</ul>`
      : "<p>No files uploaded.</p>";

  const bodyHtml = `
    <p>Hi ${fullName},</p>
    <p>Welcome to <strong>SkillNaav</strong> 🎉 Your instructor profile has been created with the following details submitted by our partner:</p>

    <h3 style="margin:16px 0 8px;">Profile Details</h3>
    ${detailsTable}

    <h3 style="margin:16px 0 8px;">Files</h3>
    ${filesBlock}

    <p style="margin-top:16px;">If any of the above information needs correction, please reply to this email.</p>
  `;

  return { subject, bodyHtml, to: email };
}

/**
 * Public function to send the email.
 * Safe to call & ignore errors (does not throw).
 */
async function sendInstructorCreatedEmail(doc) {
  const { to, subject, bodyHtml } = buildInstructorCreatedEmail(doc);
  if (!to) {
    console.warn("[instructorMailer] No email on instructor document; skipping mail.");
    return { ok: false, reason: "missing-email" };
  }
  // Fire the templated mail
  return await notifyUser(to, subject, bodyHtml);
}

module.exports = {
  sendInstructorCreatedEmail,
  buildInstructorCreatedEmail, // exported for testing
};
