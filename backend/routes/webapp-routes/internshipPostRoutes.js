//File: internshipPostRoutes.js

const express = require("express");
const InternshipPosting = require("../../models/webapp-models/internshipPostModel.js");
const notifyUser = require("../../utils/notifyUser.js");
const router = express.Router();
const mongoose = require("mongoose");
const Application = require("../../models/webapp-models/applicationModel.js");
const SavedJob = require("../../models/webapp-models/SavedJobModel.js");
const Partner = require("../../models/webapp-models/partnerModel.js");

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─── GET all internship postings (excluding deleted) ──────────────────────────
router.get("/", async (req, res) => {
  try {
    const internships = await InternshipPosting.find({ deleted: false });
    res.json(internships);
  } catch (error) {
    res.status(500).json({ message: "Server Error: Unable to fetch internships" });
  }
});

// ─── GET all approved internships (paginated, searchable, sorted, priority-ordered) ───────
router.get("/approved", async (req, res) => {
  const isPremiumUser = req.query.isPremium === "true";
  const { sector, search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  try {
    const filter = { deleted: false, adminApproved: true };

    // ── Sector filter ────────────────────────────────────────────────────────
    if (sector) filter.sector = sector;

    // ── Search filter (title, company, location, skills, sector) ────────────
    // Case-insensitive regex across useful text fields so the frontend
    // search bar works without a separate endpoint.
    if (search && search.trim()) {
      const rx = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { jobTitle: rx },
        { companyName: rx },
        { location: rx },
        { skills: rx },
        { sector: rx },
      ];
    }

    // ── Count BEFORE pagination ──────────────────────────────────────────────
    // Returning totalCount gives the frontend an exact, stable page count
    // so pagination never jumps (was the root cause of the "2 → 4 → 2" bug).
    const totalCount = await InternshipPosting.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    let internships = await InternshipPosting.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    internships.forEach(i => {
      i.internshipType = (i.internshipType || "FREE").toUpperCase();
    });

    // ── Priority sort ────────────────────────────────────────────────────────
    const premiumPriority = { PAID: 3, STIPEND: 2, FREE: 1 };
    const nonPremiumPriority = { FREE: 3, STIPEND: 2, PAID: 1 };
    const priority = isPremiumUser ? premiumPriority : nonPremiumPriority;

    internships.sort(
      (a, b) => (priority[b.internshipType] || 0) - (priority[a.internshipType] || 0)
    );

    // ── Light shuffle (20% chance per pair, preserves rough priority order) ──
    for (let i = internships.length - 1; i > 0; i--) {
      if (Math.random() < 0.2) {
        const j = Math.floor(Math.random() * (i + 1));
        [internships[i], internships[j]] = [internships[j], internships[i]];
      }
    }

    res.json({
      data: internships,
      page,
      totalCount,  // ✅ exact count — frontend uses this for stable pagination
      totalPages,  // ✅ pre-computed — frontend can use either field
      hasMore: skip + internships.length < totalCount, // kept for backwards compat
    });
  } catch (error) {
    console.error("Error fetching approved internships:", error);
    res.status(500).json({ message: "Error fetching approved internships", error: error.message });
  }
});

// ─── GET all deleted internships (bin) ───────────────────────────────────────
router.get("/bin", async (req, res) => {
  try {
    const deletedInternships = await InternshipPosting.find({ deleted: true });
    if (deletedInternships.length === 0) {
      return res.status(404).json({ message: "No deleted internships found" });
    }
    res.json(deletedInternships);
  } catch (error) {
    console.error("Error fetching deleted internships:", error);
    res.status(500).json({ message: "Server Error: Unable to fetch deleted internships", error: error.message });
  }
});

// ─── GET internships by partner ID (paginated, searchable) ───────────────────
router.get("/partner/:partnerId", async (req, res) => {
  try {
    const { partnerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = (req.query.search || "").trim();
    const escapedSearch = escapeRegex(search);
    const sortField = req.query.sort || "jobTitle";
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const internshipType = req.query.internshipType;

    const baseQuery = {
      partnerId,
      ...(internshipType && { internshipType }),
    };

    const searchFilter = escapedSearch
      ? {
        $or: [
          { jobTitle: { $regex: escapedSearch, $options: "i" } },
          { companyName: { $regex: escapedSearch, $options: "i" } },
          { location: { $regex: escapedSearch, $options: "i" } },
          { country: { $regex: escapedSearch, $options: "i" } },
          { state: { $regex: escapedSearch, $options: "i" } },
          { city: { $regex: escapedSearch, $options: "i" } },
          { jobDescription: { $regex: escapedSearch, $options: "i" } },
          { endDateOrDuration: { $regex: escapedSearch, $options: "i" } },
          { duration: { $regex: escapedSearch, $options: "i" } },
          { sector: { $regex: escapedSearch, $options: "i" } },
          { internshipType: { $regex: escapedSearch, $options: "i" } },
          { internshipMode: { $regex: escapedSearch, $options: "i" } },
          { classification: { $regex: escapedSearch, $options: "i" } },
          { qualifications: { $regex: escapedSearch, $options: "i" } },
          { "contactInfo.name": { $regex: escapedSearch, $options: "i" } },
          { "contactInfo.email": { $regex: escapedSearch, $options: "i" } },
          { "contactInfo.phone": { $regex: escapedSearch, $options: "i" } },
          { "compensationDetails.type": { $regex: escapedSearch, $options: "i" } },
          { "compensationDetails.currency": { $regex: escapedSearch, $options: "i" } },
          { "compensationDetails.frequency": { $regex: escapedSearch, $options: "i" } },
          { "compensationDetails.benefits": { $regex: escapedSearch, $options: "i" } },
          { "compensationDetails.additionalCosts.description": { $regex: escapedSearch, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$startDate",
                  },
                },
                regex: escapedSearch,
                options: "i",
              },
            },
          },
          {
            $expr: {
              $regexMatch: {
                input: {
                  $ifNull: [{ $toString: "$compensationDetails.amount" }, ""],
                },
                regex: escapedSearch,
                options: "i",
              },
            },
          },
        ],
      }
      : {};

    const finalQuery = escapedSearch
      ? { $and: [baseQuery, searchFilter] }
      : baseQuery;

    const total = await InternshipPosting.countDocuments(finalQuery);
    const internships = await InternshipPosting.find(finalQuery)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: internships,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching internships:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── GET single internship by ID ──────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const internship = await InternshipPosting.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: "Internship not found" });
    res.json(internship);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── POST create a new internship posting ────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const {
      jobTitle, companyName, location, jobDescription,
      startDate, endDateOrDuration, duration, sector,
      internshipType, internshipMode, qualifications,
      contactInfo, imgUrl, partnerId, compensationDetails,
      classification, applicationOpen = true,
      country, state, city,
    } = req.body;

    const partner = await Partner.findById(partnerId);
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    if (partner.planType === "Freemium") {
      if (internshipType === "PAID") {
        return res.status(403).json({ message: "Freemium partners cannot post paid internships." });
      }
      const activeCount = await InternshipPosting.countDocuments({ partnerId, deleted: false });
      if (activeCount >= 2) {
        return res.status(403).json({ message: "Freemium partners can post up to 2 internships only." });
      }
    }

    const finalMode = (internshipMode || "ONLINE").toUpperCase();
    const finalComp = { type: internshipType };
    if (["PAID", "STIPEND"].includes(internshipType)) {
      finalComp.amount = compensationDetails?.amount ?? 0;
      finalComp.currency = compensationDetails?.currency ?? "USD";
      finalComp.frequency = compensationDetails?.frequency ?? "MONTHLY";
    } else {
      finalComp.amount = 0; finalComp.currency = null; finalComp.frequency = null;
    }

    const composedLocation = (location && location.trim())
      ? location
      : [city, state, country].filter(Boolean).join(", ");

    const newInternship = new InternshipPosting({
      jobTitle, companyName,
      location: composedLocation,
      country, state, city,
      jobDescription, startDate, endDateOrDuration, duration,
      sector, internshipType,
      internshipMode: finalMode,
      classification,
      compensationDetails: finalComp,
      qualifications, contactInfo, imgUrl, applicationOpen,
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
    res.status(400).json({ message: "Error: Unable to create internship post", error: error.message });
  }
});

// ─── PUT update internship by ID ─────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  const {
    jobTitle, companyName, location, jobDescription,
    startDate, endDateOrDuration, duration, salaryDetails,
    qualifications, contactInfo, imgUrl, studentApplied,
    adminApproved, partnerId, country, state, city,
    sector, classification, applicationOpen,
  } = req.body;

  try {
    const updatedInternship = await InternshipPosting.findByIdAndUpdate(
      req.params.id,
      {
        ...(jobTitle && { jobTitle }),
        ...(companyName && { companyName }),
        ...((location || city || state || country) && {
          location: (location || [city, state, country].filter(Boolean).join(", "))
        }),
        ...(country && { country }),
        ...(state && { state }),
        ...(city && { city }),
        ...(jobDescription && { jobDescription }),
        ...(startDate && { startDate }),
        ...(endDateOrDuration && { endDateOrDuration }),
        ...(duration && { duration }),
        ...(salaryDetails && { salaryDetails }),
        ...(qualifications && { qualifications }),
        ...(sector && { sector }),
        ...(classification && { classification }),
        ...(contactInfo && { contactInfo }),
        ...(imgUrl && { imgUrl }),
        ...(studentApplied !== undefined && { studentApplied }),
        ...(adminApproved !== undefined && { adminApproved }),
        ...(partnerId && { partnerId }),
        ...(applicationOpen !== undefined && { applicationOpen }),
      },
      { new: true }
    );

    if (!updatedInternship) return res.status(404).json({ message: "Internship not found" });
    res.json(updatedInternship);
  } catch (error) {
    console.error("Error updating internship:", error.message);
    res.status(500).json({ message: "Error: Unable to update internship post", error: error.message });
  }
});

// ─── PATCH approve internship ─────────────────────────────────────────────────
router.patch("/:id/approve", async (req, res) => {
  try {
    const internship = await InternshipPosting.findByIdAndUpdate(
      req.params.id,
      { $set: { adminApproved: true } },
      { new: true, runValidators: false } // ← skips validation on unrelated fields
    );

    if (!internship) return res.status(404).json({ message: "Internship not found" });

    const recipientEmail = internship.contactInfo?.email;
    if (recipientEmail) {
      const emailContent = `
        Congratulations! Your internship posting "${internship.jobTitle}" has been approved!
        Company: ${internship.companyName}
        Location: ${internship.location}
        Description: ${internship.jobDescription}
        Start Date: ${internship.startDate}
        End Date/Duration: ${internship.endDateOrDuration}
      `;
      try {
        await notifyUser(recipientEmail, "Internship Approved", emailContent);
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }
    }

    res.json({ message: "Internship approved successfully", internship });
  } catch (error) {
    console.error("Approve route error:", error);
    res.status(500).json({ message: "Server Error: Unable to approve internship", error: error.message });
  }
});

// ─── PATCH reject internship ──────────────────────────────────────────────────
router.patch("/:id/reject", async (req, res) => {
  try {
    const internship = await InternshipPosting.findByIdAndUpdate(
      req.params.id,
      { $set: { adminApproved: false, rejectionReason: req.body.reason || "" } },
      { new: true, runValidators: false }
    );

    if (!internship) return res.status(404).json({ message: "Internship not found" });

    const recipientEmail = internship.contactInfo?.email;
    if (recipientEmail) {
      const emailContent = `
        We regret to inform you that your internship posting "${internship.jobTitle}" has been rejected.
        Reason: ${req.body.reason || "No specific reason provided."}
        Company: ${internship.companyName}
        Location: ${internship.location}
      `;
      try {
        await notifyUser(recipientEmail, "Internship Rejected", emailContent);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }
    }

    res.json({ message: "Internship rejected successfully", internship });
  } catch (error) {
    console.error("Reject route error:", error);
    res.status(500).json({ message: "Server Error: Unable to reject internship", error: error.message });
  }
});

// ─── POST mark internship as reviewed ────────────────────────────────────────
router.post("/:id/review", async (req, res) => {
  try {
    const updated = await InternshipPosting.findByIdAndUpdate(
      req.params.id,
      { $set: { adminReviewed: true } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Internship not found." });
    }

    res.status(200).json({
      message: "Internship marked as reviewed.",
      adminReviewed: updated.adminReviewed,
    });
  } catch (error) {
    console.error("Error in review route:", error);
    res.status(500).json({ message: "Server error: Unable to update internship.", error: error.message });
  }
});

// ─── PATCH restore soft-deleted internship ────────────────────────────────────
router.patch("/:id/restore", async (req, res) => {
  try {
    const internship = await InternshipPosting.findByIdAndUpdate(
      req.params.id,
      { $set: { deleted: false } },
      { new: true, runValidators: false }
    );

    if (!internship) return res.status(404).json({ message: "Internship not found" });

    res.status(200).json({ message: "Internship restored successfully", internship });
  } catch (error) {
    console.error("Error restoring internship:", error);
    res.status(500).json({ message: "Server Error: Unable to restore internship", error: error.message });
  }
});

// ─── DELETE soft-delete internship ───────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid internship ID" });
    }

    const internship = await InternshipPosting.findById(id);
    if (!internship) return res.status(404).json({ message: "Internship not found" });

    internship.deleted = true;
    await internship.save();

    await Application.updateMany({ internshipId: id }, { deleted: true });
    await SavedJob.deleteMany({ jobId: id });

    res.json({ message: "Internship and applications soft deleted" });
  } catch (error) {
    console.error("Error during deletion:", error);
    res.status(500).json({ message: "Server Error: Unable to delete the internship", error: error.message });
  }
});

// ─── DELETE permanently delete internship ────────────────────────────────────
router.delete("/:id/permanent", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid internship ID" });
    }

    const internship = await InternshipPosting.findById(id);
    if (!internship) return res.status(404).json({ message: "Internship not found" });

    await Application.deleteMany({ internshipId: id });
    await InternshipPosting.deleteOne({ _id: id });
    await SavedJob.deleteMany({ jobId: id });

    res.json({ message: "Internship permanently deleted" });
  } catch (error) {
    console.error("Error during permanent deletion:", error);
    res.status(500).json({ message: "Server Error: Unable to permanently delete the internship", error: error.message });
  }
});

module.exports = router;