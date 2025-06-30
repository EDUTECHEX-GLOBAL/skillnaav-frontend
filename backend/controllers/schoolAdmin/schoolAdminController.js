const asyncHandler = require("express-async-handler");
const SchoolAdmin = require("../../models/webapp-models/schoolAdmin/SchoolAdminModel");
const generateToken = require("../../utils/generateToken");
const notifyUser = require("../../utils/notifyUser");
const jwt = require("jsonwebtoken"); // ✅ ADD THIS


// Register School Admin
const registerSchoolAdmin = asyncHandler(async (req, res) => {
  const {
  schoolName,
  email,
  password,
  affiliation,
  address,
  city,
  state,
  postalCode,
  country,
  website,
  contactPerson,
  contactEmail,
  contactPhone,
  bio
} = req.body;


  const existingAdmin = await SchoolAdmin.findOne({ email });
  if (existingAdmin) {
    res.status(400);
    throw new Error("Admin already registered.");
  }

const admin = await SchoolAdmin.create({
  schoolName,
  email,
  password,
  profile: {
    affiliation,
    address,
    city,
    state,
    postalCode,
    country,
    website,
    contactPerson,
    contactEmail,
    contactPhone,
    bio,
  }
});


  if (admin) {
    res.status(201).json({
      _id: admin._id,
      schoolName: admin.schoolName,
      email: admin.email,
      isApproved: admin.isApproved,
    });
  } else {
    res.status(400);
    throw new Error("Failed to register.");
  }
});

// Login School Admin
// controllers/schoolAdmin/schoolAdminController.js

const loginSchoolAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const school = await SchoolAdmin.findOne({ email });

  if (!school) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await school.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Generate JWT token
const token = generateToken(school._id);

  // Send full profile + token
  res.status(200).json({
    _id: school._id,
    schoolName: school.schoolName,
    affiliation: school.affiliation,
    address: school.address,
    city: school.city,
    state: school.state,
    postalCode: school.postalCode,
    country: school.country,
    website: school.website,
    contactPerson: school.contactPerson,
    contactEmail: school.contactEmail,
    contactPhone: school.contactPhone,
    bio: school.bio,
    isApproved: school.isApproved,
    creditsAvailable: school.creditsAvailable,
    token,
  });
});


const getAllSchoolAdmins = asyncHandler(async (req, res) => {
  const admins = await SchoolAdmin.find({}, "-password"); // exclude password only

  if (admins && admins.length > 0) {
    res.status(200).json(admins);
  } else {
    res.status(404);
    throw new Error("No school admins found.");
  }
});


// Approve a school admin
const approveSchoolAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  const admin = await SchoolAdmin.findById(adminId);
  if (!admin) {
    res.status(404);
    throw new Error("School Admin not found.");
  }

  admin.isApproved = true;
  await admin.save();

  // Notify the school admin
  await notifyUser(
    admin.email,
    "Your Skillnaav School Admin account has been approved!",
    `<p>Congratulations! Your Skillnaav admin account for <strong>${admin.schoolName}</strong> has been approved by our team.</p>`
  );

  res.status(200).json({ message: "School Admin approved successfully." });
});

// Reject a school admin
const rejectSchoolAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  const admin = await SchoolAdmin.findById(adminId);
  if (!admin) {
    res.status(404);
    throw new Error("School Admin not found.");
  }

  admin.isApproved = false;
  admin.status = "Rejected"; // Optional: add this to schema if needed
  await admin.save();

  // Notify the admin
  await notifyUser(
    admin.email,
    "Your Skillnaav School Admin account has been rejected.",
    `<p>We're sorry to inform you that your admin registration for <strong>${admin.schoolName}</strong> has been rejected. If you believe this is a mistake, please contact support.</p>`
  );

  res.status(200).json({ message: "School Admin rejected successfully." });
});


// controllers/schoolAdmin/schoolAdminController.js

const getSchoolAdminProfile = asyncHandler(async (req, res) => {
  const admin = req.schoolAdmin; // comes from protectSchool middleware

  if (!admin) {
    res.status(404);
    throw new Error("School admin not found");
  }

 res.status(200).json({
  _id: admin._id,
  schoolName: admin.schoolName,
  affiliation: admin.profile?.affiliation || "",
  address: admin.profile?.address || "",
  city: admin.profile?.city || "",
  state: admin.profile?.state || "",
  postalCode: admin.profile?.postalCode || "",
  country: admin.profile?.country || "",
  website: admin.profile?.website || "",
  contactPerson: admin.profile?.contactPerson || "",
  contactEmail: admin.profile?.contactEmail || "",
  contactPhone: admin.profile?.contactPhone || "",
  bio: admin.profile?.bio || "",
  isApproved: admin.isApproved,
  creditsAvailable: admin.creditsAvailable,
});

});

const updateSchoolAdminProfile = asyncHandler(async (req, res) => {
  const admin = await SchoolAdmin.findById(req.schoolAdmin._id);

  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  // Update top-level fields
  if (req.body.schoolName) admin.schoolName = req.body.schoolName;

  // Update nested profile fields
  const profileFields = [
    "affiliation", "address", "city", "state", "postalCode",
    "country", "website", "contactPerson", "contactEmail", "contactPhone", "bio"
  ];

  if (!admin.profile) admin.profile = {}; // Ensure profile object exists

  profileFields.forEach(field => {
    if (req.body[field]) {
      admin.profile[field] = req.body[field];
    }
  });

  const updated = await admin.save();
  res.status(200).json(updated);
});

module.exports = {
  getAllSchoolAdmins,
  approveSchoolAdmin,
  rejectSchoolAdmin,
  registerSchoolAdmin,
  loginSchoolAdmin, 
    getSchoolAdminProfile, 
    updateSchoolAdminProfile, 
};

