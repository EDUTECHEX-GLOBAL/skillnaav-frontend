const express = require("express");
const InternshipPosting = require("../../models/webapp-models/internshipPostModel.js");
const notifyUser = require("../../utils/notifyUser.js");
const router = express.Router();
const mongoose = require("mongoose");
const Application = require("../../models/webapp-models/applicationModel.js"); // Adjust path if needed
const SavedJob = require("../../models/webapp-models/SavedJobModel.js"); // Adjust path if needed
const Partner = require("../../models/webapp-models/partnerModel.js"); // Adjust path if needed
const redisClient = require("../../utils/redisClient.js")


// GET all internship postings (excluding deleted) with caching
router.get("/", async (req, res) => {
  const cacheKey = "internships:all";
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Cache hit for all internships");
      return res.json(JSON.parse(cached));
    }
    console.log("Cache miss for all internships");

    const internships = await InternshipPosting.find({ deleted: false });

    // Cache for 5 minutes (300 seconds)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(internships));

    res.json(internships);
  } catch (error) {
    res.status(500).json({ message: "Server Error: Unable to fetch internships" });
  }
});

// GET all approved internships (excluding deleted ones) with sorting and caching
router.get("/approved", async (req, res) => {
  const isPremiumUser = req.query.isPremium === "true";
  const { sector } = req.query;

  // Compose unique cache key based on isPremiumUser and sector
  const cacheKey = `internships:approved:isPremium=${isPremiumUser}:sector=${sector || "all"}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Cache hit for approved internships", cacheKey);
      return res.json(JSON.parse(cached));
    }
    console.log("Cache miss for approved internships", cacheKey);

    const filter = { deleted: false, adminApproved: true };
    if (sector) filter.sector = sector;

    let internships = await InternshipPosting.find(filter).lean();

    const premiumPriority = { PAID: 3, STIPEND: 2, FREE: 1 };
    const nonPremiumPriority = { FREE: 3, STIPEND: 2, PAID: 1 };

    internships.forEach(i => i.internshipType = (i.internshipType || 'FREE').toUpperCase());
    const priority = isPremiumUser ? premiumPriority : nonPremiumPriority;

    internships.sort((a, b) => (priority[b.internshipType] || 0) - (priority[a.internshipType] || 0));

    // Controlled randomness
    for (let i = internships.length - 1; i > 0; i--) {
      if (Math.random() < 0.2) {
        const j = Math.floor(Math.random() * (i + 1));
        [internships[i], internships[j]] = [internships[j], internships[i]];
      }
    }

    // Cache the result for 5 mins before sending
    await redisClient.setEx(cacheKey, 300, JSON.stringify(internships));

    res.json(internships);
  } catch (error) {
    console.error("Error fetching approved internships:", error);
    res.status(500).json({ message: "Error fetching approved internships", error: error.message });
  }
});

// POST create a new internship posting
router.post("/", async (req, res) => {
  try {
    const {
      jobTitle,
      companyName,
      location,
      jobDescription,
      startDate,
      endDateOrDuration,
      duration,
      sector,
      internshipType,
      internshipMode,
      qualifications,
      contactInfo,
      imgUrl,
      partnerId,
      compensationDetails,
      classification,          // 🔹 new field
      applicationOpen = true,
    } = req.body;

    const partner = await Partner.findById(partnerId);
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    // Freemium restrictions
    if (partner.planType === "Freemium") {
      if (internshipType === "PAID") {
        return res
          .status(403)
          .json({ message: "Freemium partners cannot post paid internships." });
      }
      const activeCount = await InternshipPosting.countDocuments({
        partnerId,
        deleted: false,
      });
      if (activeCount >= 2) {
        return res
          .status(403)
          .json({ message: "Freemium partners can post up to 2 internships only." });
      }
    }

    const finalMode = (internshipMode || "ONLINE").toUpperCase();
    const finalComp = { type: internshipType };
    if (["PAID", "STIPEND"].includes(internshipType)) {
      finalComp.amount = compensationDetails?.amount ?? 0;
      finalComp.currency = compensationDetails?.currency ?? "USD";
      finalComp.frequency = compensationDetails?.frequency ?? "MONTHLY";
    } else {
      finalComp.amount = 0;
      finalComp.currency = null;
      finalComp.frequency = null;
    }

    const newInternship = new InternshipPosting({
      jobTitle,
      companyName,
      location,
      jobDescription,
      startDate,
      endDateOrDuration,
      duration,
      sector,
      internshipType,
      internshipMode: finalMode,
      classification,            // 🔹 save new field
      compensationDetails: finalComp,
      qualifications,
      contactInfo,
      imgUrl,
      applicationOpen,
      studentApplied: false,
      adminApproved: false,
      adminReviewed: false,
      partnerId,
      deleted: false,
    });

    const created = await newInternship.save();
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating internship post:", error);
    res
      .status(400)
      .json({ message: "Error: Unable to create internship post", error: error.message });
  }
});

// GET all deleted internship postings (soft deleted)
router.get("/bin", async (req, res) => {
  const cacheKey = "internships:deleted";
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Cache hit for deleted internships");
      return res.json(JSON.parse(cached));
    }
    console.log("Cache miss for deleted internships");

    const deletedInternships = await InternshipPosting.find({ deleted: true });

    if (deletedInternships.length === 0) {
      return res.status(404).json({ message: "No deleted internships found" });
    }

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(deletedInternships));

    res.json(deletedInternships);
  } catch (error) {
    console.error("Error fetching deleted internships:", error);
    res.status(500).json({
      message: "Server Error: Unable to fetch deleted internships",
      error: error.message,
    });
  }
});


// Soft delete an internship posting by ID (mark as deleted)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid internship ID" });
    }

    const internship = await InternshipPosting.findById(id);

    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    internship.deleted = true;
    await internship.save();

    await Application.updateMany({ internshipId: id }, { deleted: true });
    // Remove saved job references from SavedJobs schema
    await SavedJob.deleteMany({ jobId: id });

    res.json({ message: "Internship and applications soft deleted" });
  } catch (error) {
    console.error("Error during deletion:", error);
    res.status(500).json({
      message: "Server Error: Unable to delete the internship",
      error: error.message,
    });
  }
});

// Restore an internship by setting 'deleted' to false
router.patch("/:id/restore", async (req, res) => {
  const { id } = req.params;

  try {
    // Find the internship by ID
    const internship = await InternshipPosting.findById(id);

    // Check if the internship exists
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    // Set 'deleted' to false (restore the internship)
    internship.deleted = false;

    // Save the updated internship document
    await internship.save();

    // Return the restored internship
    res.status(200).json({
      message: "Internship restored successfully",
      internship,
    });
  } catch (error) {
    console.error("Error restoring internship:", error);
    res.status(500).json({
      message: "Server Error: Unable to restore internship",
      error: error.message,
    });
  }
});

// Permanently delete an internship posting by ID
router.delete("/:id/permanent", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid internship ID" });
    }

    const internship = await InternshipPosting.findById(id);
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    // Delete applications first
    await Application.deleteMany({ internshipId: id });

    // Then delete the internship
    await InternshipPosting.deleteOne({ _id: id });

    // Delete all related saved job entries
    await SavedJob.deleteMany({ jobId: id });

    res.json({ message: "Internship permanently deleted" });
  } catch (error) {
    console.error("Error during permanent deletion:", error);
    res.status(500).json({
      message: "Server Error: Unable to permanently delete the internship",
      error: error.message,
    });
  }
});


// GET a single internship posting by ID
router.get("/:id", async (req, res) => {
  const cacheKey = `internship:${req.params.id}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Cache hit for internship id:", req.params.id);
      return res.json(JSON.parse(cached));
    }
    console.log("Cache miss for internship id:", req.params.id);

    const internship = await InternshipPosting.findById(req.params.id);
    if (internship) {
      // Cache for 5 minutes
      await redisClient.setEx(cacheKey, 300, JSON.stringify(internship));
      res.json(internship);
    } else {
      res.status(404).json({ message: "Internship not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// GET internships by partner ID
router.get("/partner/:partnerId", async (req, res) => {
  const cacheKey = `partnerInternships:${req.params.partnerId}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Cache hit for partner internships:", req.params.partnerId);
      return res.status(200).json(JSON.parse(cached));
    }
    console.log("Cache miss for partner internships:", req.params.partnerId);

    const internships = await InternshipPosting.find({ partnerId: req.params.partnerId });

    // Always respond 200 with list, empty if none
    await redisClient.setEx(cacheKey, 300, JSON.stringify(internships));
    res.status(200).json(internships);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


// PUT update an internship posting by ID
router.put("/:id", async (req, res) => {
  const {
    jobTitle,
    companyName,
    location,
    jobDescription,
    startDate,
    endDateOrDuration,
    duration,
    salaryDetails,
    qualifications,
    contactInfo,
    imgUrl,
    studentApplied,
    adminApproved,
    partnerId,
    sector,
    classification,            // 🔹 accept new field
    applicationOpen,
  } = req.body;

  try {
    const updatedInternship = await InternshipPosting.findByIdAndUpdate(
      req.params.id,
      {
        ...(jobTitle && { jobTitle }),
        ...(companyName && { companyName }),
        ...(location && { location }),
        ...(jobDescription && { jobDescription }),
        ...(startDate && { startDate }),
        ...(endDateOrDuration && { endDateOrDuration }),
        ...(duration && { duration }),
        ...(salaryDetails && { salaryDetails }),
        ...(qualifications && { qualifications }),
        ...(sector && { sector }),
        ...(classification && { classification }), // 🔹 update if provided
        ...(contactInfo && { contactInfo }),
        ...(imgUrl && { imgUrl }),
        ...(studentApplied !== undefined && { studentApplied }),
        ...(adminApproved !== undefined && { adminApproved }),
        ...(partnerId && { partnerId }),
        ...(applicationOpen !== undefined && { applicationOpen }),
      },
      { new: true }
    );

    if (updatedInternship) {
      res.json(updatedInternship);
    } else {
      res.status(404).json({ message: "Internship not found" });
    }
  } catch (error) {
    console.error("Error updating internship:", error.message);
    res.status(500).json({
      message: "Error: Unable to update internship post",
      error: error.message,
    });
  }
});

// DELETE an internship posting by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Log the ID to verify
    console.log("ID to delete:", id);

    // Find and delete the internship in one step
    const deletedInternship = await InternshipPosting.findByIdAndDelete(id);

    if (!deletedInternship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    res.json({ message: "Internship deleted successfully" });
  } catch (error) {
    console.error("Error during deletion:", error); // Log the actual error
    res.status(500).json({
      message: "Server Error: Unable to delete the internship",
      error: error.message,
    });
  }
});

/// Approve an internship posting by ID
router.patch("/:id/approve", async (req, res) => {
  try {
    const internship = await InternshipPosting.findById(req.params.id);

    if (internship) {
      internship.adminApproved = true; // Mark as approved
      await internship.save(); // Save changes

      // Prepare and send email to the partner
      const emailContent = `
        Congratulations! Your internship posting "${internship.jobTitle}" has been approved!
        Company: ${internship.companyName}
        Location: ${internship.location}
        Description: ${internship.jobDescription}
        Start Date: ${internship.startDate}
        End Date/Duration: ${internship.endDateOrDuration}
      `;
      try {
        console.log(`Sending email to: ${internship.contactInfo.email}`);
        await notifyUser(internship.contactInfo.email, "Internship Approved", emailContent);
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }
      

      res.json({ message: "Internship approved successfully", internship });
    } else {
      res.status(404).json({ message: "Internship not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error: Unable to approve internship", error: error.message });
  }
});

// Reject an internship posting by ID
router.patch("/:id/reject", async (req, res) => {
  try {
    const internship = await InternshipPosting.findById(req.params.id);

    if (internship) {
      internship.adminApproved = false; // Mark as rejected
      await internship.save(); // Save changes

      // Prepare and send rejection email to the partner
      const emailContent = `
        We regret to inform you that your internship posting "${internship.jobTitle}" has been rejected.
        Reason: ${req.body.reason || "No specific reason provided."}
        Company: ${internship.companyName}
        Location: ${internship.location}
      `;
      try {
        await notifyUser(internship.contactInfo.email, "Internship Rejected", emailContent);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }

      res.json({ message: "Internship rejected successfully", internship });
    } else {
      res.status(404).json({ message: "Internship not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error: Unable to reject internship", error: error.message });
  }
});

router.post("/:id/review", async (req, res) => {
  try {
    const internship = await InternshipPosting.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ message: "Internship not found." });
    }

    // Mark as reviewed
    internship.isAdminReviewed = true; 

    await internship.save();

    res.status(200).json({
      message: "Internship marked as reviewed.",
      isAdminReviewed: internship.isAdminReviewed,
    });
  } catch (error) {
    console.error("Error updating internship:", error);
    res.status(500).json({ message: "Server error: Unable to update internship.", error: error.message });
  }
});

module.exports = router;