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
        <p>- Skillnaav Team</p>
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
        events: (entry.events || [])
          .filter(ev => ev && String(ev.description || "").trim())
          .map((ev) => {
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

    // ✅ Faster save for big schedules (skip mongoose validations; you already sanitize fields)
    if (sanitizedTimetable.length > 80) {
      await schedule.save({ validateBeforeSave: false });
    } else {
      await schedule.save();
    }

    // ✅ RESPOND IMMEDIATELY (FAST)
    res.status(200).json({
      message: "Schedule saved successfully",
      schedule,
    });

    // ✅ Run email + calendar sync AFTER response (non-blocking)
    setImmediate(async () => {
      // 1) Emails + in-app notification
      try {
        await notifyAcceptedStudentsOfSchedule({
          internshipId,
          scheduleDoc: schedule,
          isNew: wasCreated,
        });
      } catch (e) {
        console.error("notifyAcceptedStudentsOfSchedule failed:", e);
      }

      // 2) Google Calendar sync
      try {
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
      } catch (e) {
        console.error("Google Calendar sync failed:", e);
      }
    });

    return; // ✅ IMPORTANT: stop execution (response already sent)

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

// ✅ ADD THIS (just below extractJson)
function chunkArray(arr = [], size = 20) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

// ✅ ADD THIS (just below chunkArray)
function clampSummary(text = "", max = 200) {
  const t = String(text || "").trim();
  return t.length > max ? t.slice(0, max - 1).trim() : t;
}

async function runWithConcurrency(items, concurrency, handler) {
  let idx = 0;
  const workers = new Array(Math.max(1, concurrency)).fill(0).map(async () => {
    while (idx < items.length) {
      const current = idx++;
      await handler(items[current], current);
    }
  });
  await Promise.all(workers);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function bedrockGenerateText({ prompt, maxTokens = 1200, retries = 2 }) {
  const modelId = process.env.BEDROCK_MODEL_ID;
  if (!modelId) throw new Error("Missing BEDROCK_MODEL_ID in .env");

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    temperature: 0.3,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
  });

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body,
  });

  try {
    const response = await bedrock.send(command);
    const json = JSON.parse(new TextDecoder().decode(response.body));
    return json?.content?.[0]?.text || "";
  } catch (err) {
    const nameOrMsg = String(err?.name || err?.message || "");
    const throttled =
      nameOrMsg.includes("Throttling") ||
      nameOrMsg.includes("TooManyRequests") ||
      nameOrMsg.includes("Rate") ||
      (err?.$metadata?.httpStatusCode === 429);

    if (throttled && retries > 0) {
      // backoff: 800ms, 1600ms...
      await sleep((3 - retries) * 800);
      return bedrockGenerateText({ prompt, maxTokens, retries: retries - 1 });
    }
    throw err;
  }
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

    const compactContext = {
      jobTitle: context.jobTitle,
      companyName: context.companyName,
      sector: context.sector,
      classification: context.classification,
      mode: context.mode,
      location: context.location,
      duration: context.duration,
      jobDescription: String(context.jobDescription || "").slice(0, 900), // ✅ reduce tokens
      qualifications: Array.isArray(context.qualifications)
        ? context.qualifications.slice(0, 10)
        : [],
    };

    // ✅ milestone + day mapping (prompt rules)
    const N = Number(totalDays || days.length || 0);
    const earlyEnd = Math.max(1, Math.round(N * 0.33));
    const middleEnd = Math.max(1, Math.round(N * 0.75));
    const dayNumToDate = {};
    days.forEach(d => {
      if (d?.dayNumber && d?.date) dayNumToDate[d.dayNumber] = String(d.date).slice(0, 10);
    });

    // milestone day numbers
    const dCheckpoint = Math.max(1, Math.round(N * 0.25));
    const dMid = Math.max(1, Math.round(N * 0.50));
    const dFinal = Math.max(1, Math.round(N * 0.90));

    const milestones = [
      { label: "Checkpoint", dayNumber: dCheckpoint, date: dayNumToDate[dCheckpoint] || null },
      { label: "Mid-review", dayNumber: dMid, date: dayNumToDate[dMid] || null },
      { label: "Final deliverable", dayNumber: dFinal, date: dayNumToDate[dFinal] || null },
    ].filter(m => m.date);

    // ✅ chunk + parallel calls
    const CHUNK_SIZE = Number(process.env.BEDROCK_DAYS_PER_CALL || 25);
    const CONCURRENCY = Number(process.env.BEDROCK_CONCURRENCY || 3);

    // ✅ only send minimal day fields to AI
    const normalizedDays = (days || []).map(d => ({
      date: String(d.date).slice(0, 10),
      dayNumber: d.dayNumber,
      type: d.type || "online",
    }));

    // Build milestone lookup
    const milestoneLabelByDate = {};
    milestones.forEach(m => {
      if (m?.date) milestoneLabelByDate[String(m.date).slice(0, 10)] = m.label;
    });

    const summaryMap = {}; // date -> sectionSummary
    const chunks = chunkArray(normalizedDays, CHUNK_SIZE);

    // ✅ PARALLEL execution
    await runWithConcurrency(chunks, CONCURRENCY, async (chunk) => {
      const prompt = `
You generate "Section Summary" text for an internship schedule.

Return ONLY valid JSON array (no markdown, no extra text), exactly:
[
  { "date": "YYYY-MM-DD", "sectionSummary": "..." }
]

Rules:
- MUST include an item for EVERY input day in THIS request (same dates, no missing).
- Each sectionSummary must be 1–2 lines, max 200 characters.
Phase format (MANDATORY):
- If dayNumber <= ${earlyEnd}, sectionSummary MUST start with "Setup:" and focus on setup + understanding.
- If ${earlyEnd} < dayNumber <= ${middleEnd}, sectionSummary MUST start with "Practice:" and focus on practice + hands-on work.
- If dayNumber > ${middleEnd}, sectionSummary MUST start with "Outcome:" and focus on outcomes + results.
- Do NOT repeat the same sectionSummary across days.
- Use dayNumber to maintain progress across the full internship (dayNumber is global).
- classification controls difficulty: Basic / Intermediate / Advanced

Milestone requirements:
- If a milestone date is in this chunk, that day's summary MUST include the milestone label word:
${JSON.stringify(milestones, null, 2)}

Internship info:
${JSON.stringify(compactContext, null, 2)}

Days (do not change dates):
${JSON.stringify(chunk, null, 2)}
`;

      const maxTokens = Math.min(1800, 250 + chunk.length * 55);

      const raw = await bedrockGenerateText({ prompt, maxTokens });
      const parsed = extractJson(raw);

      if (!Array.isArray(parsed)) {
        console.error("Bedrock output (not JSON array):", raw);
        throw new Error("AI did not return valid JSON.");
      }

      parsed.forEach(x => {
        if (!x?.date) return;
        const dt = String(x.date).slice(0, 10);
        if (!dt) return;
        summaryMap[dt] = clampSummary(x.sectionSummary || "", 200);
      });
    });

    // ✅ GUARANTEE: return summary for every requested day
    const used = new Set();

    const summaries = normalizedDays.map(d => {
      const dt = d.date;
      const milestoneLabel = milestoneLabelByDate[dt];

      const phasePrefix =
        d.dayNumber <= earlyEnd
          ? "Setup:"
          : d.dayNumber <= middleEnd
            ? "Practice:"
            : "Outcome:";

      let text = summaryMap[dt];

      // fallback only if missing
      if (!text || !text.trim()) {
        if (phasePrefix === "Setup:") {
          text = "Setup: set up tools and understand today’s goals.";
        } else if (phasePrefix === "Practice:") {
          text = "Practice: complete a hands-on task and capture learnings.";
        } else {
          text = "Outcome: finalize output and document results clearly.";
        }
      } else {
        // Ensure the output follows required phase prefix (in case AI forgets)
        if (!/^(Setup:|Practice:|Outcome:)\s*/i.test(String(text).trim())) {
          text = `${phasePrefix} ${text}`;
        }
      }

      // ✅ Ensure milestone word exists WITHOUT breaking the required prefix
      if (milestoneLabel && !String(text).toLowerCase().includes(milestoneLabel.toLowerCase())) {
        text = String(text).replace(/^(Setup:|Practice:|Outcome:)\s*/i, (m) => `${m}${milestoneLabel} - `);
      }

      text = clampSummary(text, 200);

      // ✅ Prevent duplicates without breaking prefix format
      if (used.has(text)) {
        text = clampSummary(`${text} (Day ${d.dayNumber})`, 200);
      }
      used.add(text);

      return {
        date: dt,
        sectionSummary: text,
      };
    });

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