const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const schoolAdminSchema = new mongoose.Schema({
  schoolName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  creditsAvailable: { type: Number, default: 0 },

  profile: {
    affiliation: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    website: { type: String },
    contactPerson: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    bio: { type: String },
    profilePic: { type: String }, // Optional
  }
}, { timestamps: true });


// Hash password before save
schoolAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

schoolAdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const SchoolAdmin = mongoose.model("SchoolAdmin", schoolAdminSchema);
module.exports = SchoolAdmin;
