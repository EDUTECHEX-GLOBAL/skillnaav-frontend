const InternshipSchedule = require('../models/webapp-models/InternshipScheduleModel');
const { addScheduleToGoogleCalendar } = require('../controllers/GoogleController');
const Student = require('../models/webapp-models/userModel'); // <-- replace with your actual student model
const OfferLetter = require('../models/webapp-models/offerLetterModel');
const notifyUser = require('../utils/notifyUser');
const sendNotification = require('../utils/Notification');

const timeToMinutes = (t = "") => {
  const [hh, mm] = String(t).split(":");
  const h = Number(hh);
  const m = Number(mm);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
};

// ✅ Only keep the selected internship type slots (online OR offline OR hybrid)
const sanitizeTimeSlots = (timeSlots = {}, onlyType) => {
  const type = String(onlyType || "").toLowerCase();
  const allowed = ["online", "offline", "hybrid"];
  if (!allowed.includes(type)) return null;

  const arr = Array.isArray(timeSlots[type]) ? timeSlots[type] : [];

  return {
    [type]: arr
      .filter(s => s && (s.startTime || s.endTime)) // keep partially filled to validate
      .map(s => ({
        startTime: String(s.startTime || "").trim(),
        endTime: String(s.endTime || "").trim()
      }))
  };
};

const validateSlotsForTypeBackend = (slotsByType, type) => {
  const slots = slotsByType?.[type] || [];

  // Only validate if timeSlots is being used (paid schedule sends it)
  if (!slots.length) {
    return `Please add at least 1 Time Slot under ${type.toUpperCase()} (Select Time Slot is mandatory).`;
  }

  const hasIncomplete = slots.some(s => !(s?.startTime && s?.endTime));
  if (hasIncomplete) {
    return `Please fill both Start Time and End Time for all Slot(s) under ${type.toUpperCase()} (or remove incomplete slots).`;
  }

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return `Invalid time format in Slot ${i + 1} under ${type.toUpperCase()}.`;
    }
    if (end <= start) {
      return `Slot ${i + 1}: End Time must be after Start Time under ${type.toUpperCase()}.`;
    }
  }

  return null;
};

// ✅ Bedrock Runtime (AWS SDK v3)
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { TextDecoder } = require("util");

// ✅ IMPORTANT: Use the SAME internship model you use in /api/interns/:id route
// Change the path/name if your model file name is different
const Internship = require('../models/webapp-models/internshipPostModel');

// Utility function to fetch student who accepted
const getStudentByInternshipId = async (internshipId) => {
  // Adjust query based on your schema (assumption: status = 'accepted')
  return await Student.findOne({ internshipId, status: 'accepted' });
};

// Send schedule email only to accepted students of this internship
async function notifyAcceptedStudentsOfSchedule({ internshipId, scheduleDoc, isNew }) {
  // Find accepted offers for this internship
  const offers = await OfferLetter
    .find({ internshipId, status: 'Accepted' })
    .select('email studentId name')
    .lean();

  if (!offers.length) return; // nobody accepted yet → do nothing

  // Minimal “what’s next” preview
  const upcoming = (scheduleDoc?.timetable || []).find(s => {
    const d = new Date(s.date);
    const today = new Date();
    d.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
    return d >= today;
  });

  const subject = isNew
    ? 'Your internship schedule is published'
    : 'Your internship schedule was updated';

  // Send users to the public login page
  const appUrl = (process.env.WEBAPP_BASE_URL || 'https://www.skillnaav.com') + '/user/login';

  const previewHtml = upcoming
    ? `<p><b>Next session:</b> ${new Date(upcoming.date).toLocaleDateString('en-IN')} ${upcoming.startTime}–${upcoming.endTime} (${upcoming.type || 'online'})</p>`
    : '';

  // Send emails
  await Promise.all(
    offers.map(o =>
      notifyUser(
        o.email,
        subject,
        `
        <p>Hi ${o.name || 'there'},</p>
        <p>${isNew ? 'A new' : 'An updated'} schedule has been posted for your internship.</p>
        ${previewHtml}
        <p><a href="${appUrl}">Open your dashboard</a> to view all sessions.</p>
        <p>— Skillnaav Team</p>
        `
      ).catch(err => console.error('Schedule email failed:', o.email, err))
    )
  );

  // Optional in-app notification
  await Promise.all(
    offers.map(o =>
      sendNotification({
        studentId: o.studentId,
        title: isNew ? 'Schedule published' : 'Schedule updated',
        message: 'Tap to view your sessions.',
        link: appUrl
      }).catch(() => { })
    )
  );
}

// Create or update a schedule
const updateInternshipSchedule = async (req, res) => {
  try {
    const {
      internshipId,
      partnerId,
      startDate,
      endDate,
      workHours,
      timetable = [],
      defaultStartTime,
      defaultEndTime,
      defaultEventLink,
      defaultLocation,
      defaultType,
      selectedDays,
      timeSlots
    } = req.body;

    if (!internshipId || !partnerId || !startDate || !endDate || !workHours) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Paid schedule: validate timeSlots ONLY if frontend sends it
    let sanitizedSlots = null;
    if (timeSlots && typeof timeSlots === "object") {
      const typeToValidate = defaultType || "online";

      // ✅ sanitize only selected type
      sanitizedSlots = sanitizeTimeSlots(timeSlots, typeToValidate);

      const slotErr = validateSlotsForTypeBackend(sanitizedSlots, typeToValidate);
      if (slotErr) {
        return res.status(400).json({ error: slotErr });
      }
    }

    // Sanitize timetable for saving
    const sanitizedTimetable = timetable.map((entry) => {
      const entryType = entry.type || "online";

      return {
        date: new Date(entry.date),
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        eventLink: entry.eventLink || "",
        sectionSummary: entry.sectionSummary || "",
        instructor: entry.instructor || "",
        assignment: entry.assignment || null,
        type: entryType,
        location: entryType === "online" ? null : {
          name: entry.location?.name || "",
          address: entry.location?.address || "",
          mapLink: entry.location?.mapLink || ""
        },
        events: (entry.events || []).map((ev) => {
          const evType = ev.type || "online";
          return {
            description: ev.description,
            type: evType,
            location: evType === "online" ? null : {
              name: ev.location?.name || "",
              address: ev.location?.address || "",
              mapLink: ev.location?.mapLink || ""
            }
          };
        })
      };
    });

    const scheduleData = {
      internshipId,
      partnerId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      workHours,
      defaultStartTime,
      defaultEndTime,
      defaultEventLink,
      defaultLocation: (defaultType === 'online') ? null : {
        name: defaultLocation?.name || '',
        address: defaultLocation?.address || '',
        mapLink: defaultLocation?.mapLink || ''
      },
      defaultType,
      selectedDays,

      // ✅ Save Select Time Slots (Paid schedule only)
      ...(sanitizedSlots ? { timeSlots: sanitizedSlots } : {}),

      timetable: sanitizedTimetable
    };

    let schedule = await InternshipSchedule.findOne({ internshipId, partnerId });

    // 🚫 Block updates if schedule already closed
    if (schedule && schedule.isClosed) {
      return res.status(403).json({
        error: 'This schedule has been closed permanently and cannot be updated.'
      });
    }

    let wasCreated = false;
    if (schedule) {
      schedule.set(scheduleData);
    } else {
      schedule = new InternshipSchedule(scheduleData);
      wasCreated = true;
    }

    // ✅ ADD THIS
    if (sanitizedSlots) {
      schedule.timeSlots = sanitizedSlots;
      schedule.markModified("timeSlots");
    }

    await schedule.save();

    // ✅ Send schedule email only to accepted students
    try {
      await notifyAcceptedStudentsOfSchedule({
        internshipId,
        scheduleDoc: schedule,   // saved schedule doc
        isNew: wasCreated
      });
    } catch (e) {
      console.error('notifyAcceptedStudentsOfSchedule failed:', e);
    }

    // Step: Send to Google Calendar (sync for all accepted students)
    const acceptedOffers = await OfferLetter
      .find({ internshipId, status: "Accepted" })
      .select("email")
      .lean();

    await Promise.allSettled(
      acceptedOffers.map((o) =>
        addScheduleToGoogleCalendar({
          studentEmail: o.email,
          timetable: sanitizedTimetable,
          internshipTitle: "Internship Schedule",
        })
      )
    );

    return res.status(200).json({
      message: 'Schedule saved successfully',
      schedule,
    });
  } catch (err) {
    console.error('Schedule Save Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to save schedule',
    });
  }
};

// Get schedule by internshipId and partnerId
const getInternshipSchedule = async (req, res) => {
  try {
    const { internshipId, partnerId } = req.query;

    if (!internshipId || !partnerId) {
      return res.status(400).json({ error: 'Missing internshipId or partnerId' });
    }

    const schedule = await InternshipSchedule.findOne({ internshipId, partnerId });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    return res.status(200).json(schedule);
  } catch (err) {
    console.error('Fetch Schedule Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch schedule' });
  }
};

function getBedrockClient() {
  // ✅ Dedicated Bedrock credentials (NEW .env keys)
  const accessKeyId = process.env.BEDROCK_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BEDROCK_AWS_SECRET_ACCESS_KEY;
  const region = process.env.BEDROCK_AWS_REGION;

  if (!accessKeyId || !secretAccessKey || !region) {
    throw new Error(
      "Missing Bedrock AWS credentials/region. Please set BEDROCK_AWS_ACCESS_KEY_ID, BEDROCK_AWS_SECRET_ACCESS_KEY, BEDROCK_AWS_REGION in .env"
    );
  }

  return new BedrockRuntimeClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const bedrock = getBedrockClient();

function extractJson(text) {
  if (!text) return null;

  // Remove common wrappers if the model accidentally adds them
  let t = String(text).trim()
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(t);
    return parsed;
  } catch (e) { /* ignore */ }

  // Fallback: slice first JSON array/object region
  const firstArray = t.indexOf("[");
  const lastArray = t.lastIndexOf("]");
  if (firstArray !== -1) {
    let slice = lastArray !== -1 ? t.slice(firstArray, lastArray + 1) : t.slice(firstArray);

    // If truncated: close array at last complete object
    if (lastArray === -1) {
      const lastObjEnd = slice.lastIndexOf("}");
      if (lastObjEnd !== -1) slice = slice.slice(0, lastObjEnd + 1) + "]";
    }

    // Remove trailing commas
    slice = slice.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");

    // Replace smart quotes just in case
    slice = slice.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

    try { return JSON.parse(slice); } catch (e) { /* ignore */ }
  }

  return null;
}

async function bedrockGenerateText({ prompt }) {
  const modelId = process.env.BEDROCK_MODEL_ID;
  if (!modelId) throw new Error("Missing BEDROCK_MODEL_ID in .env");

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2500, // ✅ IMPORTANT: 700 truncates JSON for many days
    temperature: 0.3,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
  });

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body,
  });

  const response = await bedrock.send(command);
  const json = JSON.parse(new TextDecoder().decode(response.body));
  return json?.content?.[0]?.text || "";
}

const generateAiSectionSummaries = async (req, res) => {
  try {
    const { internshipId, totalDays, days } = req.body;

    if (!internshipId) {
      return res.status(400).json({ error: "Missing internshipId" });
    }
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ error: "Missing days list" });
    }

    // ✅ Fetch internship data (jobTitle/jobDescription/etc.) from your PostAJob saved doc
    const internship = await Internship.findById(internshipId).lean();
    if (!internship) {
      return res.status(404).json({ error: "Internship not found" });
    }

    const context = {
      jobTitle: internship.jobTitle || "",
      companyName: internship.companyName || "",
      sector: internship.sector || "",
      classification: internship.classification || "",
      mode: internship.mode || "",
      jobDescription: internship.jobDescription || "",
      qualifications: internship.qualifications || [],
      duration: internship.duration || "",
      location: internship.location || "",
    };

    const prompt = `
You are generating "Section Summary" text for an internship schedule.

Goal:
- Create a short section summary for EACH requested day.
- Summaries must be relevant to the internship posting.
- Make them progress logically from Day 1 to Day N.
- Keep each summary 1-2 lines (max ~200 characters).
- Use classification to adjust difficulty:
  - Basic: beginner-friendly tasks
  - Intermediate: more responsibility + practice
  - Advanced: deeper ownership + deliverables

Input Internship:
${JSON.stringify(context, null, 2)}

Requested schedule days:
${JSON.stringify(days, null, 2)}

Return ONLY valid JSON (no markdown, no extra text):
[
  { "date": "YYYY-MM-DD", "sectionSummary": "..." },
  ...
]
`;

    const raw = await bedrockGenerateText({ prompt });
    const parsed = extractJson(raw);

    if (!Array.isArray(parsed)) {
      console.error("Bedrock output (not JSON array):", raw);
      return res.status(500).json({
        error: "AI did not return valid JSON. Try again.",
      });
    }

    // sanitize output
    const summaries = parsed
      .filter(x => x && x.date)
      .map(x => ({
        date: String(x.date).slice(0, 10),
        sectionSummary: (x.sectionSummary || "").toString().trim(),
      }));

    return res.status(200).json({ summaries });
  } catch (err) {
    console.error("generateAiSectionSummaries error:", err);
    return res.status(500).json({ error: err.message || "AI generation failed" });
  }
};

module.exports = {
  updateInternshipSchedule,
  getInternshipSchedule,
  generateAiSectionSummaries,
};