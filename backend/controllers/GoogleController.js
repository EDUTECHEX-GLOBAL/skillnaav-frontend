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
      const scheduleDoc = await InternshipScheduleModel.findOne({ "timetable.0": { $exists: true } }).sort({ createdAt: -1 });

      if (!scheduleDoc || !scheduleDoc.timetable || scheduleDoc.timetable.length === 0) {
        console.warn("⚠️ No internship schedule found to sync.");
      } else {
        console.log(`📅 Found ${scheduleDoc.timetable.length} schedule entries to sync for ${email}`);

        const result = await addScheduleToGoogleCalendar({
          studentEmail: email,
          timetable: scheduleDoc.timetable,
          internshipTitle: 'Internship Schedule',
          defaultEventLink: scheduleDoc.defaultEventLink
        });


        console.log('📤 Sync result:', result.summary);
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

    // Create test event for 1 hour from now
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const testEvent = {
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 }
        ]
      },
      colorId: '1', // Optional
      status: 'confirmed',
    };

    console.log('🧪 Creating test event:', {
      summary: testEvent.summary,
      start: testEvent.start.dateTime,
      end: testEvent.end.dateTime
    });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: testEvent
    });

    console.log('🧪 Test event created successfully:', {
      eventId: response.data.id,
      htmlLink: response.data.htmlLink
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      message: 'Test event created successfully'
    };

  } catch (err) {
    console.error('🧪 Test event creation failed:', err);
    return {
      success: false,
      error: err.message
    };
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

const addScheduleToGoogleCalendar = async ({ studentEmail, timetable, internshipTitle, defaultEventLink }) => {
  console.log('🚀 Starting calendar integration for:', studentEmail);
  console.log('📅 Timetable data:', JSON.stringify(timetable, null, 2));
  console.log('📋 Internship title:', internshipTitle);

  try {
    // Get student tokens
    const studentToken = await TokenModel.findOne({ email: studentEmail });
    if (!studentToken || !studentToken.tokens) {
      console.error(`❌ No Google tokens found for ${studentEmail}`);
      return {
        success: false,
        error: 'No authentication tokens found. Please authenticate with Google first.',
        action: 'Please visit /api/google/auth to authenticate'
      };
    }

    console.log('🔑 Found tokens for user:', studentEmail);
    console.log('🔗 Token details:', {
      hasAccessToken: !!studentToken.tokens.access_token,
      hasRefreshToken: !!studentToken.tokens.refresh_token,
      expiryDate: studentToken.tokens.expiry_date,
      scope: studentToken.tokens.scope
    });

    // Create OAuth client
    const oAuth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials(studentToken.tokens);

    // Handle token refresh
    oAuth2Client.on('tokens', async (newTokens) => {
      console.log('🔄 Refreshing tokens for', studentEmail);
      try {
        const mergedTokens = { ...studentToken.tokens, ...newTokens };

        await TokenModel.findOneAndUpdate(
          { email: studentEmail },
          {
            tokens: mergedTokens,
            updatedAt: new Date()
          }
        );

        console.log('✅ Tokens refreshed successfully');
      } catch (saveErr) {
        console.error('❌ Error saving refreshed tokens:', saveErr);
      }
    });

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Test calendar access first
    console.log('🔍 Testing calendar access...');
    try {
      const calendarList = await calendar.calendarList.list();
      console.log('📋 Calendar access successful. Available calendars:', calendarList.data.items.length);

      // Log primary calendar details
      const primaryCalendar = calendarList.data.items.find(cal => cal.primary);
      if (primaryCalendar) {
        console.log('📅 Primary calendar:', {
          id: primaryCalendar.id,
          summary: primaryCalendar.summary,
          timeZone: primaryCalendar.timeZone
        });
      }
    } catch (accessErr) {
      console.error('❌ Calendar access failed:', accessErr);
      return {
        success: false,
        error: 'Failed to access Google Calendar. Please re-authenticate.',
        details: accessErr.message,
        action: 'Please visit /api/google/auth to re-authenticate'
      };
    }

    // Validate timetable
    if (!Array.isArray(timetable) || timetable.length === 0) {
      return {
        success: false,
        error: 'Invalid timetable: expected non-empty array',
        received: typeof timetable
      };
    }

    console.log(`📊 Processing ${timetable.length} time slots...`);

    const createdEvents = [];
    const failedEvents = [];

    // Process each time slot
    for (let i = 0; i < timetable.length; i++) {
      const slot = timetable[i];
      console.log(`\n🔄 Processing slot ${i + 1}/${timetable.length}:`, slot);

      try {
        // Validate slot
        if (!slot || typeof slot !== 'object') {
          throw new Error('Invalid slot object');
        }

        const requiredFields = ['date', 'startTime', 'endTime'];
        const missingFields = requiredFields.filter(field => !slot[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Normalize slot.date to YYYY-MM-DD string
        let dateStr;
        if (slot.date instanceof Date) {
          dateStr = slot.date.toISOString().split('T')[0];
        } else if (typeof slot.date === 'string') {
          if (slot.date.includes('T')) {
            dateStr = slot.date.split('T')[0];
          } else {
            dateStr = slot.date;
          }
        } else {
          throw new Error(`Invalid date format: ${slot.date}. Expected YYYY-MM-DD`);
        }

        // Validate date format (should be YYYY-MM-DD)
        if (!isValidDate(dateStr)) {
          throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
        }

        // Validate time format (should be HH:MM)
        if (!isValidTime(slot.startTime) || !isValidTime(slot.endTime)) {
          throw new Error(`Invalid time format. Expected HH:MM format. Got start: ${slot.startTime}, end: ${slot.endTime}`);
        }

        // Create proper datetime strings for IST timezone
        const startDateTime = createISTDateTime(dateStr, slot.startTime);
        let endDateTime;

        const [startHour, startMin] = slot.startTime.split(":").map(Number);
        const [endHour, endMin] = slot.endTime.split(":").map(Number);

        if (endHour < startHour || (endHour === startHour && endMin <= startMin)) {
          // End time is next day
          const endDateObj = new Date(dateStr);
          endDateObj.setDate(endDateObj.getDate() + 1);
          const endDateStr = endDateObj.toISOString().split("T")[0];
          endDateTime = createISTDateTime(endDateStr, slot.endTime);
        } else {
          endDateTime = createISTDateTime(dateStr, slot.endTime);
        }

        console.log('⏰ Created datetime strings:', {
          start: startDateTime,
          end: endDateTime
        });

        // Validate times
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid datetime values');
        }

        if (startDate >= endDate) {
          throw new Error(`End time must be after start time. Got ${slot.startTime} to ${slot.endTime}`);
        }

        // Use finalEventLink before the event object
        const finalEventLink = slot.eventLink || defaultEventLink; // fallback to default

        let event;
        if (slot.type === 'online') {
          event = buildOnlineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle, finalEventLink });
        } else if (slot.type === 'offline') {
          event = buildOfflineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle });
        } else if (slot.type === 'hybrid') {
          if (slot.location?.address) {
            event = buildOfflineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle });
          } else {
            event = buildOnlineEvent({ slot, dateStr, startDateTime, endDateTime, internshipTitle, finalEventLink });
          }
        }

        // If nothing is provided and includeMeet is true, generate a Meet link
        if ((slot.type === 'online' || slot.type === 'hybrid') && !finalEventLink && slot.includeMeet !== false) {
          event.conferenceData = {
            createRequest: {
              requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          };
        }

        console.log('📝 Creating event with details:', {
          summary: event.summary,
          start: event.start.dateTime,
          end: event.end.dateTime,
          timeZone: event.start.timeZone,
          hasConference: !!event.conferenceData || !!slot.eventLink
        });

        // Create the event
        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: event,
          conferenceDataVersion: event.conferenceData ? 1 : 0,
          sendNotifications: true,
        });

        const eventData = {
          slot,
          eventId: response.data.id,
          meetLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri,
          htmlLink: response.data.htmlLink,
          created: response.data.created,
          summary: response.data.summary,
          startDateTime: response.data.start.dateTime,
          endDateTime: response.data.end.dateTime
        };

        createdEvents.push(eventData);

        console.log(`✅ Event created successfully:`, {
          eventId: response.data.id,
          summary: response.data.summary,
          date: slot.date,
          time: `${slot.startTime}-${slot.endTime}`,
          meetLink: eventData.meetLink,
          calendarLink: response.data.htmlLink
        });

        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (slotErr) {
        console.error(`❌ Failed to create event for slot ${i + 1}:`, {
          error: slotErr.message,
          slot,
          stack: slotErr.stack
        });

        failedEvents.push({
          slot,
          error: slotErr.message,
          index: i + 1
        });
      }
    }

    // Return comprehensive result
    const result = {
      success: createdEvents.length > 0,
      studentEmail,
      createdEvents,
      failedEvents,
      summary: `Successfully created ${createdEvents.length} events, ${failedEvents.length} failed`,
      totalSlots: timetable.length,
      calendarUrl: 'https://calendar.google.com/calendar/u/0/r',
      details: {
        successful: createdEvents.length,
        failed: failedEvents.length,
        successRate: `${Math.round((createdEvents.length / timetable.length) * 100)}%`
      }
    };

    console.log('🎉 Calendar integration completed:', result.summary);
    console.log('📊 Success rate:', result.details.successRate);

    if (createdEvents.length > 0) {
      console.log('📅 Events successfully added to Google Calendar!');
      console.log('🔗 View calendar at:', result.calendarUrl);
    }

    if (failedEvents.length > 0) {
      console.log('⚠️ Failed events:', failedEvents.map(f => `${f.index}: ${f.error}`));
    }

    return result;

  } catch (err) {
    console.error(`❌ Calendar integration error for ${studentEmail}:`, {
      error: err.message,
      stack: err.stack
    });

    return {
      success: false,
      error: err.message,
      studentEmail,
      stack: err.stack
    };
  }
};

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

// Test function with immediate execution
const debugCalendarCreation = async (studentEmail) => {
  console.log('🧪 Starting debug calendar creation for:', studentEmail);

  // Create test event for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = slot.date instanceof Date ? slot.date.toISOString().split('T')[0] : slot.date;

  const testTimetable = [
    {
      date: dateString,
      startTime: '15:00',
      endTime: '16:00',
      sectionSummary: 'Debug Test Session',
      description: 'This is a debug test event to verify calendar integration',
      location: 'Virtual Debug Room',
      includeMeet: true
    }
  ];

  console.log('🧪 Test timetable:', testTimetable);

  const result = await addScheduleToGoogleCalendar({
    studentEmail,
    timetable: testTimetable,
    internshipTitle: '🧪 Debug Test Internship'
  });

  console.log('🧪 Debug result:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('✅ Debug test successful! Check your Google Calendar.');
    console.log('🔗 Calendar link:', result.calendarUrl);
  } else {
    console.log('❌ Debug test failed:', result.error);
  }

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

    // Fetch tokens
    const studentToken = await TokenModel.findOne({ email: studentEmail });
    if (!studentToken?.tokens) {
      return res.status(401).json({ success: false, message: "Student not authenticated with Google" });
    }

    // Auth setup
    const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
    oAuth2Client.setCredentials(studentToken.tokens);

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Find latest schedule
    const scheduleDoc = await InternshipScheduleModel.findOne({ internshipId });

    if (!scheduleDoc || !Array.isArray(scheduleDoc.timetable)) {
      return res.status(404).json({ success: false, message: "No schedule found" });
    }

    const timetable = scheduleDoc.timetable;

    // 1. Delete previously created events if they have event IDs
    for (const slot of timetable) {
      if (slot.eventId) {
        try {
          await calendar.events.delete({ calendarId: 'primary', eventId: slot.eventId });
        } catch (e) {
          console.warn("Failed to delete previous event:", e.message);
        }
      }
    }

    // 2. Recreate schedule
    const result = await addScheduleToGoogleCalendar({
      studentEmail,
      timetable,
      internshipTitle: scheduleDoc.internshipTitle || 'Internship Schedule',
      defaultEventLink: scheduleDoc.defaultEventLink
    });

    // 3. Save new event IDs
    for (let i = 0; i < timetable.length; i++) {
      if (result.createdEvents[i]?.eventId) {
        scheduleDoc.timetable[i].eventId = result.createdEvents[i].eventId;
      }
    }

    await scheduleDoc.save();

    return res.json({ success: true, result });

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
  updateScheduleInGoogleCalendar
};