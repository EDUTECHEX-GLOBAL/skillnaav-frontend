import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const ProfileForm = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    universityName: "",
    institutionId: "",
    adminApproved: false,
    active: false,
    profileImage: "",       // Image URL for preview
    profileImageFile: null, // Actual file
  });

  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      setUser((prevUser) => ({
        ...prevUser,
        name: userInfo.name || "",
        email: userInfo.email || "",
        universityName: userInfo.universityName || "",
        institutionId: userInfo.institutionId || "",
        adminApproved: userInfo.adminApproved || false,
        active: userInfo.active || false,
        profileImage: userInfo.profileImage || "",  // Load stored image URL
        profileImageFile: null,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUser((prevUser) => ({
        ...prevUser,
        profileImageFile: file,
        profileImage: URL.createObjectURL(file), // preview
      }));
    }
  };

  const handleUpdateProfile = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (user.password && user.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (user.password !== user.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const token = userInfo?.token;

      if (!token) {
        setErrorMessage("No token found. Please log in again.");
        return;
      }

      let formData = new FormData();
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("universityName", user.universityName);
      formData.append("institutionId", user.institutionId);

      if (user.password) {
        formData.append("password", user.password);
        formData.append("confirmPassword", user.confirmPassword);
      }

      // 💡 CRUCIAL: Field name must match backend multer single("profileImage")
      if (user.profileImageFile) {
        formData.append("profileImage", user.profileImageFile);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.put("/api/partners/profile", formData, config);

      // Save new data to localStorage
      const updatedUserInfo = { ...userInfo, ...data, token };
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));

      setUser((prevUser) => ({
        ...prevUser,
        ...data,
        password: "",
        confirmPassword: "",
        profileImageFile: null,
      }));

      setSuccessMessage("Profile updated successfully!");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  };

  return (
    <div className="min-h-screen mt-12 bg-white-50 flex items-center justify-center font-poppins">
      <div className="relative w-full max-w-4xl bg-white p-6 sm:p-8 rounded-lg shadow-lg">

        <form className="w-full">
          <h2 className="text-2xl font-semibold mb-1 text-gray-800">Your Profile</h2>
          <p className="text-gray-500 mb-6">Update your photo and personal details here.</p>

          {/* Profile Image */}
          <div className="mb-6 flex items-center space-x-6 border-b pb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-300">
              {user.profileImage ? (
                <img className="w-full h-full object-cover" src={user.profileImage} alt="Profile" />
              ) : (
                <FontAwesomeIcon icon={faUser} className="text-3xl text-gray-400" />
              )}
            </div>

            <label className="cursor-pointer">
              <span className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                {user.profileImageFile ? "Change Photo" : "Upload Photo"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {[
              { label: "Full Name", name: "name" },
              { label: "Email Address", name: "email", disabled: true },
              { label: "University Name", name: "universityName" },
              { label: "Institution ID", name: "institutionId" },
              { label: "Password", name: "password", type: "password" },
              { label: "Confirm Password", name: "confirmPassword", type: "password" },
            ].map((f, i) => (
              <div key={i}>
                <label className="text-gray-700 mb-2 block">{f.label}</label>
                <input
                  type={f.type || "text"}
                  name={f.name}
                  value={user[f.name]}
                  onChange={handleChange}
                  disabled={f.disabled}
                  className="px-4 py-2 border border-gray-300 rounded-md w-full"
                />
              </div>
            ))}
          </div>

          {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}
        </form>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button className="px-6 py-2 border rounded-md" onClick={() => window.location.reload()}>
            Cancel
          </button>
          <button className="px-6 py-2 bg-purple-600 text-white rounded-md" onClick={handleUpdateProfile}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
