const notifyUser = require("./notifyUser");

function formatDateTime(date, timezone = "Asia/Kolkata") {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: timezone, 
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Interview Scheduled Email (Student)
 */
async function sendInterviewScheduledToStudent({
  to,
  studentName,
  internshipTitle,
  meetLink,
  scheduledAt,
  timezone,
  partnerName,
}) {
  const subject = "Your SkillNaav Interview is Scheduled 🎯";

  const bodyHtml = `
    <p>Hi ${studentName || "there"},</p>

    <p>Your interview for <strong>${internshipTitle}</strong> has been scheduled.</p>

    <p><strong>Interview Details:</strong></p>
    <ul>
      <li><strong>Date & Time:</strong> ${formatDateTime(scheduledAt, timezone)}</li>
      <li><strong>Interviewer:</strong> ${partnerName}</li>
      <li><strong>Meeting Link:</strong>
        <a href="${meetLink}" target="_blank">${meetLink}</a>
      </li>
    </ul>

    <p>Please join the meeting 5 minutes early.</p>
    <p>All the best! 🚀</p>
  `;

  return notifyUser(to, subject, bodyHtml);
}

/**
 * Interview Scheduled Email (Partner)
 */
async function sendInterviewScheduledToPartner({
  to,
  partnerName,
  studentName,
  internshipTitle,
  meetLink,
  scheduledAt,
  timezone,
}) {
  const subject = "Interview Scheduled Successfully ✅";

  const bodyHtml = `
    <p>Hi ${partnerName || "Partner"},</p>

    <p>You have successfully scheduled an interview.</p>

    <ul>
      <li><strong>Candidate:</strong> ${studentName}</li>
      <li><strong>Internship:</strong> ${internshipTitle}</li>
      <li><strong>Date & Time:</strong> ${formatDateTime(scheduledAt, timezone)}</li>
      <li><strong>Meeting Link:</strong>
        <a href="${meetLink}" target="_blank">${meetLink}</a>
      </li>
    </ul>

    <p>You can manage this interview from your SkillNaav dashboard.</p>
  `;

  return notifyUser(to, subject, bodyHtml);
}

module.exports = {
  sendInterviewScheduledToStudent,
  sendInterviewScheduledToPartner,
};
