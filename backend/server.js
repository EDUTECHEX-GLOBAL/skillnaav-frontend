const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const connectDB = require("./config/dbConfig");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const cron = require("node-cron");
const checkPremiumExpiration = require("./utils/checkpremiumExipiration");


// Load environment variables
dotenv.config();

const app = express(); // Initialize express app

// ✅ Middleware (must come before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
connectDB(); // Establish MongoDB connection

// ✅ Load your chatbot route after middleware is ready
const chatRoute = require('./routes/chat');
const chatbotRoute = require('./routes/chatbot');
app.use('/api', chatRoute);
app.use('/api/chatbot', chatbotRoute);

app.use(
  cors({
    origin: "*", // or specify your front-end origin
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Routes
const userRoutes = require("./routes/webapp-routes/userRoutes");
const internRoutes = require("./routes/webapp-routes/internshipPostRoutes");
const skillnaavRoute = require("./routes/skillnaavRoute");
const partnerRoutes = require("./routes/webapp-routes/partnerRoutes");
const adminRoutes = require("./routes/webapp-routes/adminRoutes");
const chatRoutes = require("./routes/webapp-routes/ChatRoutes");
// const googleUserRoutes = require("./routes/webapp-routes/GoogleUserRoutes");
const applicationRoutes = require("./routes/webapp-routes/applicationRoutes");
const savedJobRoutes = require("./routes/webapp-routes/SavedJobRoutes");
const personalityRoutes = require("./routes/webapp-routes/PersonalityRoutes");
const paymentRoutes = require("./routes/webapp-routes/paymentRoutes");
const dashboardRoutes = require("./routes/webapp-routes/dashboardRoutes");
const NotificationRoutes = require("./routes/webapp-routes/NotificatioRoutes");
const googleRoutes = require("./routes/webapp-routes/googleRoutes");

// NEW: Import Offer Routes
const offerLetterRoutes = require("./routes/webapp-routes/offerLetterRoutes");
const offerTemplateRoutes = require("./routes/webapp-routes/offerTemplateRoutes");
const scheduleRoutes = require("./routes/webapp-routes/scheduleRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
//partner payment routes
const partnerPaymentRoutes = require("./routes/webapp-routes/partnerPaymentRoutes");

const internshipPaymentRoutes = require("./routes/webapp-routes/internshipPaymentRoutes");

// NEW: Import Offer Routes
const schoolAdminRoutes = require("./routes/webapp-routes/schoolAdmin/schoolAdminRoutes");
// NEW: Import School Admin Payment Routes
const schoolAdminPaymentRoutes = require("./routes/webapp-routes/schoolAdmin/paymentRoutes");
// NEW: Import School Admin Login Session Routes
const schoolAdminLoginSessionRoutes = require("./routes/webapp-routes/schoolAdmin/LoginSessionRoutes");



app.use("/api/upload", uploadRoutes);
// Define routes
app.use("/api/users", userRoutes);
app.use("/api/interns", internRoutes);
app.use("/api/skillnaav", skillnaavRoute);
app.use("/api/contact", skillnaavRoute);
app.use("/api/partners", partnerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chats", chatRoutes);
// app.use("/api/google-users", googleUserRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/savedJobs", savedJobRoutes);
app.use("/api/personality", personalityRoutes);
app.use("/api/payments", paymentRoutes);
app.use(
  "/api/payments/razorpay-webhook",
  express.raw({ type: "application/json" })
);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/google", googleRoutes);

// NEW: Add Offer Routes
app.use('/api/offer-letters', offerLetterRoutes);
app.use("/api/notifications", NotificationRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/templates", offerTemplateRoutes);

// NEW: Add Partner Payment Routes
app.use("/api/partner/payments", partnerPaymentRoutes);
// NEW: Add Internship Payment Routes
app.use("/api/internship/payments", internshipPaymentRoutes);

// NEW: Add School Admin Routes
app.use("/api/school-admin", schoolAdminRoutes);
// NEW: Add School Admin Payment Routes
app.use("/api/school-admin/payments", schoolAdminPaymentRoutes);
// NEW: Add School Admin Login Session Routes
app.use("/api/sessions", schoolAdminLoginSessionRoutes);

// New route for skill gap analysis
app.post("/analyze-skills", async (req, res) => {
  console.log("Received request:", req.body);
  try {
    const response = await axios.post("/analyze-skills", req.body);
    res.json(response.data);
  } catch (error) {
    console.error("Error from FastAPI:", error.response?.data || error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build/index.html"));
  });
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});