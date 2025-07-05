import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FaSchool, FaMapMarkerAlt, FaCity, FaGlobe, FaUserTie,
  FaEnvelope, FaPhone, FaAddressCard, FaFlag, FaEdit,
  FaLanguage, FaClipboardList, FaFileAlt
} from "react-icons/fa";

const SchoolAdminProfile = () => {
  const [formData, setFormData] = useState({
    schoolName: "",
    affiliation: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "",
    website: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    bio: "",
    schoolType: "",
    schoolNumber: "",
    languageOfInstruction: "",
    verificationDoc: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [profilePic, setProfilePic] = useState("/default-profile.jpg");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("schoolAdminToken");
        const res = await axios.get("/api/school-admin/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFormData(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
    }
  };

  const handleEditToggle = () => setIsEditing(true);

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("schoolAdminToken");
      await axios.put("/api/school-admin/update-profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Profile updated!");
      setIsEditing(false);
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="p-6 font-poppins">
      <motion.div
        className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-400 to-blue-600 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4 relative">
            <motion.img
              src={profilePic}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-white object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
            />
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                className="absolute bottom-0 left-16 w-6 h-6 opacity-0 cursor-pointer"
                onChange={handleImageUpload}
              />
            )}
            <div>
              <h2 className="text-white text-2xl font-semibold">{formData.schoolName}</h2>
              <p className="text-white text-sm">School Admin</p>
            </div>
          </div>
          {!isEditing ? (
            <motion.button
              onClick={handleEditToggle}
              className="bg-white text-blue-600 font-medium px-4 py-2 rounded-md shadow hover:bg-gray-100 flex items-center"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
            >
              <FaEdit className="mr-2" /> Edit Profile
            </motion.button>
          ) : (
            <motion.button
              onClick={handleUpdate}
              className="bg-white text-green-600 font-medium px-4 py-2 rounded-md shadow hover:bg-gray-100"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
            >
              Update
            </motion.button>
          )}
        </div>

        {/* Info */}
        <motion.div className="p-6 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <InfoSection title="Personal Information">
            <IconInput icon={<FaSchool />} label="School Name" name="schoolName" value={formData.schoolName} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaFlag />} label="Affiliation" name="affiliation" value={formData.affiliation} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaClipboardList />} label="School Type" name="schoolType" value={formData.schoolType} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaClipboardList />} label="School Number" name="schoolNumber" value={formData.schoolNumber} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaLanguage />} label="Language of Instruction" name="languageOfInstruction" value={formData.languageOfInstruction} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaGlobe />} label="Website" name="website" value={formData.website} editable={isEditing} onChange={handleChange} />
          </InfoSection>

          <InfoSection title="Location Details">
            <IconInput icon={<FaCity />} label="City" name="city" value={formData.city} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaMapMarkerAlt />} label="Province" name="province" value={formData.province} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaAddressCard />} label="Postal Code" name="postalCode" value={formData.postalCode} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaGlobe />} label="Country" name="country" value={formData.country} editable={isEditing} onChange={handleChange} />
          </InfoSection>

          <InfoSection title="Contact Information">
            <IconInput icon={<FaUserTie />} label="Contact Person" name="contactPerson" value={formData.contactPerson} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaEnvelope />} label="Contact Email" name="contactEmail" value={formData.contactEmail} editable={isEditing} onChange={handleChange} />
            <IconInput icon={<FaPhone />} label="Contact Phone" name="contactPhone" value={formData.contactPhone} editable={isEditing} onChange={handleChange} />
          </InfoSection>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Address</h3>
            {isEditing ? (
              <textarea
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            ) : (
              <p className="bg-gray-50 p-2 border border-gray-300 rounded-md text-sm text-gray-800">{formData.address}</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Bio</h3>
            {isEditing ? (
              <textarea
                name="bio"
                rows="2"
                value={formData.bio}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            ) : (
              <p className="bg-gray-50 p-2 border border-gray-300 rounded-md text-sm text-gray-800">{formData.bio}</p>
            )}
          </div>

          {/* Verification Document (read-only display) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Verification Document</h3>
            {formData.verificationDoc ? (
              <a
                href={formData.verificationDoc}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline text-sm"
              >
                View Uploaded Document
              </a>
            ) : (
              <p className="text-sm text-gray-500">No document uploaded.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const InfoSection = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-700 mb-3">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

const IconInput = ({ icon, label, name, value, editable, onChange }) => (
  <motion.div
    className="flex items-center space-x-2"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <span className="text-gray-600">{icon}</span>
    {editable ? (
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={label}
        className="flex-1 p-2 border border-gray-300 rounded-md"
      />
    ) : (
      <div className="flex-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-800">
        {value}
      </div>
    )}
  </motion.div>
);

export default SchoolAdminProfile;
