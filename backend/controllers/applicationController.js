const Application = require("../models/webapp-models/applicationModel"); // Import the Application model
const mongoose = require("mongoose");
const Userwebapp = require("../models/webapp-models/userModel");  // Ensure correct import path
const InternshipPosting = require("../models/webapp-models/internshipPostModel.js"); 
const { sendNotification } = require("../utils/Notification.js");
const notifyUser = require("../utils/notifyUser.js");
const multer = require("multer"); // Multer for file uploads
const path = require("path");
const fs = require("fs");

const upgradeToPremium = async (req, res) => {
  const { studentId } = req.body;

  try {
    const student = await Userwebapp.findByIdAndUpdate(studentId, { isPremium: true }, { new: true });

    if (!student) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User upgraded to premium!", user: student });
  } catch (error) {
    console.error("Error upgrading user:", error.message);
    res.status(500).json({ message: "Error upgrading to premium.", error: error.message });
  }
};

// Controller to handle applying for an internship (using multer for file uploads)
const applyForInternship = async (req, res) => {
  const { studentId, internshipId } = req.body;
  const resumeFile = req.file;

  if (!resumeFile) {
    return res.status(400).json({ message: "Please upload a resume." });
  }

  try {
    const student = await Userwebapp.findById(studentId);
    const internship = await InternshipPosting.findById(internshipId);

    if (!student || !internship) {
      return res.status(404).json({ message: "Student or Internship not found." });
    }

    // New check: Reject if applications are closed
    if (!internship.applicationOpen) {
      return res.status(403).json({ message: "Applications are currently closed for this internship." });
    }

    // Enforce application limit for non-premium users
    if (!student.isPremium) {
      const applicationCount = await Application.countDocuments({ studentId });

      if (applicationCount >= 5) {
        return res.status(403).json({
          message: "You have reached the limit of 5 applications. Upgrade to premium to apply for more jobs.",
          limitReached: true,
        });
      }
    }

    const existingApplication = await Application.findOne({ studentId, internshipId });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this internship." });
    }

    const resumeUrl = resumeFile.location;

    const newApplication = new Application({
      studentId,
      internshipId,
      resumeUrl,
      status: "Applied",
      appliedDate: new Date(),
      userName: student.name,
      userEmail: student.email,
      jobTitle: internship.jobTitle,
      schoolAdmin: student.schoolAdmin || null,
    });

    await newApplication.save();

    res.status(201).json({
      message: "Application submitted successfully!",
      application: newApplication,
      limitReached: false,
    });

  } catch (error) {
    console.error("Error during application submission:", error.message);
    res.status(500).json({
      message: "Error applying for the internship.",
      error: error.message,
    });
  }
};


const getApplicationCount = async (req, res) => {
  try {
    console.log("Request received at /count/:studentId"); // Debugging log
    console.log("Params received:", req.params);

    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const applicationCount = await Application.countDocuments({ studentId });

    res.status(200).json({ count: applicationCount });
  } catch (error) {
    console.error("Error fetching application count:", error.message);
    res.status(500).json({ message: "Error fetching application count." });
  }
};

// Controller to get all students who applied for a specific internship
const getApplicationsForInternship = async (req, res) => {
  const { internshipId } = req.params;
  const { schoolAdmin } = req.query;

  try {
    // Validate internship ID
    if (!mongoose.Types.ObjectId.isValid(internshipId)) {
      return res.status(400).json({ message: "Invalid internship ID." });
    }

    // Validate schoolAdmin ID if provided
    if (schoolAdmin && !mongoose.Types.ObjectId.isValid(schoolAdmin)) {
      return res.status(400).json({ message: "Invalid schoolAdmin ID." });
    }

    // Build query filter
    const query = { internshipId };
    if (schoolAdmin) {
      query.schoolAdmin = schoolAdmin;
    }

    // Fetch applications
    const applications = await Application.find(query).populate('studentId', 'name email profileImage');

    if (!applications || applications.length === 0) {
      return res.status(404).json({ message: "No applications found for this internship." });
    }

    res.status(200).json({ applications });

  } catch (error) {
    console.error("Error fetching applications:", error.message);
    res.status(500).json({
      message: "Error fetching applications.",
      error: error.message,
    });
  }
};

// Controller to get application status for a student
const getApplicationStatus = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Find all applications for the student
    const applications = await Application.find({ studentId });

    if (!applications || applications.length === 0) {
      return res.status(404).json({
        message: "No applications found for this student.",
      });
    }

    res.status(200).json({
      applications,
    });
  } catch (error) {
    console.error("Error fetching application status:", error.message);
    res.status(500).json({
      message: "Error fetching application status.",
      error: error.message,
    });
  }
};

const getApplicationsForStudent = async (req, res) => {
  try {
    const applications = await Application.find({ studentId: req.params.studentId })
      .populate('internshipId')  // Populate internship details
      .populate('studentId', 'userName userEmail');  // Populate user details

    res.json({ applications });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ message: "Error fetching applications" });
  }
};

// Controller to check if a specific job has been applied by the user
const checkIfApplied = async (req, res) => {
  const { studentId, internshipId } = req.params;

  try {
    // Check if the student has applied for this internship
    const existingApplication = await Application.findOne({
      studentId,
      internshipId,
    });

    if (existingApplication) {
      return res.status(200).json({ isApplied: true });
    } else {
      return res.status(200).json({ isApplied: false });
    }
  } catch (error) {
    console.error("Error checking application status:", error.message);
    res.status(500).json({
      message: "Error checking application status.",
      error: error.message,
    });
  }
};

const getApplicationsCountForInternships = async (req, res) => {
  try {
    const { internshipIds } = req.query;
    
    if (!internshipIds) {
      return res.status(400).json({ message: "Internship IDs are required" });
    }

    // Convert comma-separated string to array and validate IDs
    const idsArray = internshipIds.split(',')
      .map(id => id.trim())
      .filter(id => mongoose.Types.ObjectId.isValid(id));

    if (idsArray.length === 0) {
      return res.status(400).json({ message: "No valid internship IDs provided" });
    }

    const counts = await Application.aggregate([
      {
        $match: {
          internshipId: { $in: idsArray.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      {
        $group: {
          _id: "$internshipId",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert array to object { internshipId: count }
    const countsMap = counts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    res.status(200).json({ counts: countsMap });
  } catch (error) {
    console.error("Error fetching application counts:", error);
    res.status(500).json({ 
      message: "Error fetching application counts",
      error: error.message 
    });
  }
};

const updateApplicationStatus = async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  if (!["Accepted", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'Accepted' or 'Rejected'" });
  }

  try {
    // ✅ Update application status
    const application = await Application.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // ✅ Fetch student details
    let student = await Userwebapp.findById(application.studentId).lean();
    if (!student) {
      student = {
        name: application.userName || "Student",
        email: application.userEmail || null,
      };
    }

    if (!student.email) {
      console.warn(`⚠️ No email found for studentId: ${application.studentId}`);
    }

    // 👉 Handle rejection
    if (status === "Rejected") {
      // 1️⃣ Save in-app notification
      try {
        await sendNotification({
          studentId: application.studentId,
          title: "Application Rejected",
          message: `Unfortunately, your application for ${application.jobTitle} was rejected.`,
          link: "/student-dashboard/recommendations",
        });
        console.log(`✅ Notification saved for studentId: ${application.studentId}`);
      } catch (err) {
        console.error("❌ Failed to save notification:", err.message);
      }

      // 2️⃣ Prepare recommended internships
      let recommendationsHtml = "<p>No recommendations available at the moment.</p>";
      try {
        const recommendations = await InternshipPosting.find({ applicationOpen: true })
          .limit(3)
          .lean();

        if (recommendations.length > 0) {
          recommendationsHtml = `<ul>${recommendations
            .map(
              (job) =>
                `<li><b>${job.jobTitle}</b> at ${job.companyName || "Company"} – <a href="https://yourdomain.com/internship/${job._id}">Apply Now</a></li>`
            )
            .join("")}</ul>`;
        }
      } catch (err) {
        console.error("❌ Failed to fetch recommendations:", err.message);
      }

      // 3️⃣ Send rejection email
      if (student.email) {
        try {
          const mailResult = await notifyUser(
            student.email,
            "Application Rejected - Explore New Opportunities",
            `<p>Hi ${student.name},</p>
             <p>We regret to inform you that your application for <b>${application.jobTitle}</b> has been rejected.</p>
             <p>But don’t worry! Here are some recommended internships for you:</p>
             ${recommendationsHtml}
             <p><a href="https://yourdomain.com/student-dashboard/recommendations">View All Recommendations</a></p>`
          );
          console.log("✅ Email sent successfully:", mailResult);
        } catch (err) {
          console.error("❌ Failed to send email:", err.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application,
    });
  } catch (err) {
    console.error("❌ Error in updateApplicationStatus:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


module.exports = {
  applyForInternship,
  getApplicationsForInternship,
  getApplicationStatus,
  getApplicationsForStudent,
  checkIfApplied, // Add the new function to exports
  upgradeToPremium,
  getApplicationCount,
  getApplicationsCountForInternships,
  updateApplicationStatus,
};