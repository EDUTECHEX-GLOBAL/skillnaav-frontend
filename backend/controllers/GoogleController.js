// GoogleController.js
require('dotenv').config();
const { google } = require('googleapis');
const TokenModel = require('../models/webapp-models/TokenModel');
const jwt = require('jsonwebtoken');
const InternshipScheduleModel = require('../models/webapp-models/InternshipScheduleModel');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
} = process.env;

// Validate environment variables
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  throw new Error("⚠️ Google OAuth environment variables missing or invalid.");
}

const googleAuth = (req, res) => {
  // Create new OAuth client per request to avoid shared state
  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  // Generate random state for security
  const state = Math.random().toString(36).substring(2, 15);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'openid'
    ],
    prompt: 'consent',
    include_granted_scopes: true,
    state: state,
    response_type: 'code'
  });

  console.log('Generated auth URL with state:', state);
  res.redirect(authUrl);
};

const googleCallback = async (req, res) => {
  const { code, state, error } = req.query;

  console.log('OAuth callback received:', {
    hasCode: !!code,
    state,
    error,
    fullUrl: req.url
  });

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return res.status(400).send(`Authentication error: ${error}`);
  }

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  try {
    console.log('Starting token exchange process...');

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log('Successfully obtained tokens via manual exchange');

    // Create OAuth client and set credentials
    const oAuth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials(tokens);

    // Get email from ID token first
    let email;
    if (tokens.id_token) {
      try {
        const decoded = jwt.decode(tokens.id_token);
        email = decoded?.email;
        console.log("Email from ID token:", email);
      } catch (decodeErr) {
        console.warn("ID token decode error:", decodeErr.message);
      }
    }

    // Fallback to userinfo API if email not found in ID token
    if (!email) {
      try {
        const oauth2 = google.oauth2({
          version: 'v2',
          auth: oAuth2Client
        });
        const { data } = await oauth2.userinfo.get();
        email = data.email;
        console.log("Email from userinfo API:", email);
      } catch (userinfoErr) {
        console.error("Userinfo API error:", userinfoErr.message);
      }
    }

    if (!email) {
      throw new Error("Failed to retrieve user email from Google");
    }

    // Store tokens with email
    const tokenDoc = await TokenModel.findOneAndUpdate(
      { email },
      {
        tokens,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`Successfully stored tokens for ${email}`);

        try {
      const scheduleDoc = await InternshipScheduleModel
        .findOne({ "timetable.0": { $exists: true } })
        .sort({ createdAt: -1 });

      if (!scheduleDoc || !scheduleDoc.timetable || scheduleDoc.timetable.length === 0) {
        console.warn("⚠️ No internship schedule found to sync.");
      } else {
        console.log(`📅 Found ${scheduleDoc.timetable.length} schedule entries to sync for ${email}`);

        const result = await upsertScheduleForStudent({
          studentEmail: email,
          internshipId: scheduleDoc.internshipId,            // IMPORTANT: give a real id
          timetable: scheduleDoc.timetable,
          internshipTitle: 'Internship Schedule',
          defaultEventLink: scheduleDoc.defaultEventLink || ''
        });

        console.log('📤 Sync result:', result);
      }
    } catch (syncErr) {
      console.error("❌ Error syncing schedule after authentication:", syncErr.message);
    }


    res.send(`
  <html>
  <head>
    <title>Google Sync Successful</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 50px;
      }
      .success {
        color: #28a745;
      }
      .info {
        color: #17a2b8;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <h1 class="success">✅ Google Calendar Sync Successful!</h1>
    <p>Email: ${email}</p>
    <div class="info">
      <p>📅 Internship schedule has been synced to your calendar.</p>
      <p>🔗 <a href="https://calendar.google.com" target="_blank">Open Google Calendar</a></p>
    </div>
    <p>Redirecting to your dashboard...</p>

    <script>
      // Force restore user session token from sessionStorage
      try {
        const token = sessionStorage.getItem('userToken');
        if (token) {
          localStorage.setItem('userToken', token);
          console.log('✅ User token restored to localStorage.');
        } else {
          console.warn('⚠️ No user token found in sessionStorage.');
        }

        // Mark Google sync success
        localStorage.setItem('googleAuthSuccess', 'true');

        // Redirect after brief delay
        setTimeout(() => {  
          window.location.href = "http://localhost:3000/user-main-page";
        }, 1500);
      } catch (e) {
        console.error("Error restoring session token:", e);
        window.location.href = "http://localhost:3000/user-main-page";
      }
    </script>
  </body>
</html>
`);

  } catch (err) {
    console.error("Google callback error:", {
      message: err.message,
      code: err.code,
      stack: err.stack,
      response: err.response?.data || 'No response data'
    });

    let errorMessage = "Authentication failed";
    if (err.message.includes('invalid_grant')) {
      errorMessage = "The authorization code has expired or is invalid. Please try clearing your browser cache and try again.";
    } else if (err.message.includes('redirect_uri_mismatch')) {
      errorMessage = "Redirect URI mismatch. Please check your Google OAuth configuration.";
    } else if (err.message.includes('invalid_client')) {
      errorMessage = "Invalid client credentials. Please check your Google OAuth setup.";
    }

    res.status(500).send(`
      <html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1 class="error">Authentication Failed</h1>
          <p>${errorMessage}</p>
          <p>Error details: ${err.message}</p>
          <a href="/api/google/auth">Try Again</a>
        </body>
      </html>
    `);
  }
};

// Manual token exchange function
const https = require('https');
const querystring = require('querystring');

async function exchangeCodeForTokens(code) {
  const postData = querystring.stringify({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });

  console.log("Sending token request to Google with:");
  console.log("Code:", code);
  console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
  console.log("Redirect URI:", process.env.GOOGLE_REDIRECT_URI);

  const options = {
    hostname: 'oauth2.googleapis.com',
    port: 443,
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.error) {
            console.error('❌ Token exchange error response:', response);
            reject(new Error(response.error_description || response.error));
          } else {
            console.log('✅ Token exchange successful');
            resolve(response);
          }
        } catch (parseErr) {
          console.error('❌ Failed to parse token response:', data);
          reject(new Error('Invalid response from Google OAuth'));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Token exchange request error:', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}


// Create a test event immediately after authentication
const createTestEvent = async (email) => {
  console.log('🧪 Creating test event for:', email);

  try {
    const studentToken = await TokenModel.findOne({ email });
    if (!studentToken || !studentToken.tokens) {
      throw new Error(`No tokens found for ${email}`);
    }

    const oAuth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials(studentToken.tokens);
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const testEvent = {
      summary: 'Test: Calendar connectivity',   // ← added
      start: { dateTime: startTime.toISOString(), timeZone: 'Asia/Kolkata' },
      end:   { dateTime: endTime.toISOString(),   timeZone: 'Asia/Kolkata' },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] },
      colorId: '1',
      status: 'confirmed',
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: testEvent
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      message: 'Test event created successfully'
    };

  } catch (err) {
    console.error('🧪 Test event creation failed:', err);
    return { success: false, error: err.message };
  }
};

// Enhanced function to add schedule to Google Calendar

// ✅ Function for Online Events
function buildOnlineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle, finalEventLink }) {
  return {
    summary: `Online Section by ${slot.instructor || 'Instructor'}`,
    description: `Topic: ${slot.sectionSummary || 'Internship session'}
    
👨‍🏫 Instructor Name: ${slot.instructor || 'Not assigned'}

🔗 Online Meeting Link: ${finalEventLink || 'Link not available'}

📅 Date: ${formatDate(dateStr)}
⏰ Time: ${slot.startTime} - ${slot.endTime} (IST)

Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
    `,
    start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
    end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 15 },
        { method: 'popup', minutes: 1 }
      ]
    },
    colorId: '9',
    visibility: 'default',
    status: 'confirmed',
    conferenceData: (!finalEventLink && slot.includeMeet !== false) ? {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    } : undefined
  };
}

// ✅ Function for Offline Events
function buildOfflineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle }) {
  return {
    summary: `Offline Section by ${slot.instructor || 'Instructor'}`,
    description: `Topic: ${slot.sectionSummary || 'Internship session'}

👨‍🏫 Instructor Name: ${slot.instructor || 'Not assigned'}
📅 Date: ${formatDate(dateStr)}
⏰ Time: ${slot.startTime} - ${slot.endTime} (IST)

📍 Location: ${slot.location?.address || 'Offline'}

${slot.location?.mapLink ? `🗺️ Map: ${slot.location.mapLink}` : ''}

Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
    `,
    location: slot.location?.mapLink || 'Offline',
    start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
    end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 15 },
        { method: 'popup', minutes: 1 }
      ]
    },
    colorId: '9',
    visibility: 'default',
    status: 'confirmed'
  };
}

// Use upsert so any caller of this function won't create duplicates.
const addScheduleToGoogleCalendar = async ({
  studentEmail,
  timetable,
  internshipTitle,
  defaultEventLink,
  internshipId // <-- pass this whenever you can
}) => {
  return upsertScheduleForStudent({
    studentEmail,
    internshipId: String(internshipId || 'global'), // temporary fallback if id isn't available
    timetable,
    internshipTitle,
    defaultEventLink: defaultEventLink || ''
  });
};


// === Upsert schedule to a student's calendar by extendedProperties.private ===
async function upsertScheduleForStudent({
  studentEmail,
  internshipId,
  timetable,
  internshipTitle = 'Internship Schedule',
  defaultEventLink = ''
}) {
  try {
    // 0) Load tokens
    const studentToken = await TokenModel.findOne({ email: studentEmail });
    if (!studentToken?.tokens) {
      return { success: false, message: `No Google auth for ${studentEmail}` };
    }

    // 1) Auth
    const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
    oAuth2Client.setCredentials(studentToken.tokens);
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // 2) Validate timetable
    if (!Array.isArray(timetable) || timetable.length === 0) {
      return { success: false, message: 'Empty timetable' };
    }

    // 3) Build a window to list existing events (min..max date +-1 day)
    const dates = timetable.map(s => new Date(
      s.date instanceof Date ? s.date : (String(s.date).includes('T') ? s.date : `${s.date}T00:00:00.000Z`)
    ));
    const timeMin = new Date(Math.min(...dates));
    const timeMax = new Date(Math.max(...dates));
    timeMin.setDate(timeMin.getDate() - 1);
    timeMax.setDate(timeMax.getDate() + 1);

    // 4) List events tagged for this internship
    const existing = [];
    let pageToken;
    do {
      const resp = await calendar.events.list({
        calendarId: 'primary',
        privateExtendedProperty: `internshipId=${String(internshipId)}`,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        maxResults: 2500,
        pageToken,
      });
      existing.push(...(resp.data.items || []));
      pageToken = resp.data.nextPageToken;
    } while (pageToken);

    const existingBySlotKey = new Map(
      existing
        .map(e => [e.extendedProperties?.private?.slotKey, e])
        .filter(([k]) => !!k)
    );

    // 5) Upsert every slot
    const seenKeys = new Set();

    for (const slot of timetable) {
      const key = slotKeyOf(slot);
      seenKeys.add(key);

      // Prepare date/time strings
      let dateStr;
      if (slot.date instanceof Date) {
        dateStr = slot.date.toISOString().split('T')[0];
      } else if (typeof slot.date === 'string') {
        dateStr = slot.date.includes('T') ? slot.date.split('T')[0] : slot.date;
      } else {
        throw new Error(`Invalid slot.date: ${slot.date}`);
      }

      const startDateTime = createISTDateTime(dateStr, slot.startTime);
      let endDateTime = createISTDateTime(dateStr, slot.endTime);

      // Handle end next day if needed
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      if (eh < sh || (eh === sh && em <= sm)) {
        const endDateObj = new Date(`${dateStr}T00:00:00.000Z`);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const nextDateStr = endDateObj.toISOString().split('T')[0];
        endDateTime = createISTDateTime(nextDateStr, slot.endTime);
      }

      // Build event (reuse your existing builders)
      const finalEventLink = slot.eventLink || defaultEventLink || '';

      let baseEvent;
      if (slot.type === 'offline') {
        baseEvent = buildOfflineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle });
      } else if (slot.type === 'online') {
        baseEvent = buildOnlineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle, finalEventLink });
      } else if (slot.type === 'hybrid') {
        baseEvent = (slot.location?.address)
          ? buildOfflineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle })
          : buildOnlineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle, finalEventLink });
      } else {
        // default to online formatting to be safe
        baseEvent = buildOnlineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle, finalEventLink });
      }

      const body = withExtendedProps(baseEvent, { internshipId, slot });

      // PATCH if exists; otherwise INSERT
      const existingEvent = existingBySlotKey.get(key);
      if (existingEvent) {
        await calendar.events.patch({
          calendarId: 'primary',
          eventId: existingEvent.id,
          requestBody: body,
          conferenceDataVersion: body.conferenceData ? 1 : 0,
        });
      } else {
        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: body,
          conferenceDataVersion: body.conferenceData ? 1 : 0,
        });
      }
    }

    // 6) Delete stale events
    for (const [key, ev] of existingBySlotKey.entries()) {
      if (!seenKeys.has(key)) {
        try {
          await calendar.events.delete({ calendarId: 'primary', eventId: ev.id });
        } catch (e) {
          console.warn('Delete old event failed:', e.message);
        }
      }
    }

    return { success: true };
  } catch (e) {
    console.error('upsertScheduleForStudent error:', e);
    return { success: false, message: e.message };
  }
}

// Helper functions
function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false;

  const date = new Date(dateString + 'T00:00:00.000Z');
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidTime(timeString) {
  if (!timeString || typeof timeString !== 'string') return false;
  const regEx = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeString.match(regEx) !== null;
}

function createISTDateTime(dateString, timeString) {
  // Create proper ISO string for IST timezone
  return `${dateString}T${timeString}:00+05:30`;
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// === Unique key for a slot (per day + start time) ===
function slotKeyOf(slot) {
  // slot.date may be Date or string; normalize to YYYY-MM-DD
  const dateStr = (slot.date instanceof Date)
    ? slot.date.toISOString().slice(0, 10)
    : (typeof slot.date === 'string' && slot.date.includes('T'))
      ? slot.date.split('T')[0]
      : String(slot.date);

  return `${dateStr}_${slot.startTime}`;
}

// === Attach private extended properties so we can find/update/delete later ===
function withExtendedProps(baseEvent, { internshipId, slot }) {
  return {
    ...baseEvent,
    extendedProperties: {
      private: {
        internshipId: String(internshipId),
        slotKey: slotKeyOf(slot),
      },
    },
  };
}

// Test function with immediate execution
const debugCalendarCreation = async (studentEmail) => {
  console.log('🧪 Starting debug calendar creation for:', studentEmail);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const testTimetable = [
    {
      date: dateStr,
      startTime: '15:00',
      endTime: '16:00',
      sectionSummary: 'Debug Test Session',
      instructor: 'Debugger',
      type: 'online',
      eventLink: '',
      includeMeet: true
    }
  ];

  const result = await upsertScheduleForStudent({
    studentEmail,
    internshipId: 'debug',
    timetable: testTimetable,
    internshipTitle: '🧪 Debug Test Internship'
  });

  console.log('🧪 Debug result:', JSON.stringify(result, null, 2));
  return result;
};

// Function to check authentication status
const checkAuthStatus = async (studentEmail) => {
  try {
    const studentToken = await TokenModel.findOne({ email: studentEmail });

    if (!studentToken || !studentToken.tokens) {
      return {
        authenticated: false,
        message: 'No authentication tokens found',
        action: 'Please authenticate with Google'
      };
    }

    // Test if tokens are still valid
    const oAuth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials(studentToken.tokens);

    try {
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
      await calendar.calendarList.list();

      return {
        authenticated: true,
        email: studentEmail,
        tokenInfo: {
          hasAccessToken: !!studentToken.tokens.access_token,
          hasRefreshToken: !!studentToken.tokens.refresh_token,
          expiryDate: studentToken.tokens.expiry_date
        },
        message: 'Authentication valid'
      };
    } catch (apiErr) {
      return {
        authenticated: false,
        message: 'Authentication expired or invalid',
        error: apiErr.message,
        action: 'Please re-authenticate with Google'
      };
    }

  } catch (err) {
    return {
      authenticated: false,
      message: 'Error checking authentication status',
      error: err.message
    };
  }
};

// POST /api/google/update-schedule
const updateScheduleInGoogleCalendar = async (req, res) => {
  try {
    const { internshipId, studentEmail } = req.body;

    const studentToken = await TokenModel.findOne({ email: studentEmail });
    if (!studentToken?.tokens) {
      return res.status(401).json({ success: false, message: "Student not authenticated with Google" });
    }

    const scheduleDoc = await InternshipScheduleModel.findOne({ internshipId });
    if (!scheduleDoc || !Array.isArray(scheduleDoc.timetable)) {
      return res.status(404).json({ success: false, message: "No schedule found" });
    }

    const result = await upsertScheduleForStudent({
      studentEmail,
      internshipId,
      timetable: scheduleDoc.timetable,
      internshipTitle: scheduleDoc.internshipTitle || 'Internship Schedule',
      defaultEventLink: scheduleDoc.defaultEventLink || ''
    });

    return res.json({ success: result.success, result });
  } catch (error) {
    console.error("Error updating schedule in calendar:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  googleAuth,
  googleCallback,
  addScheduleToGoogleCalendar,
  debugCalendarCreation,
  checkAuthStatus,
  createTestEvent,
  updateScheduleInGoogleCalendar,
  upsertScheduleForStudent,
};