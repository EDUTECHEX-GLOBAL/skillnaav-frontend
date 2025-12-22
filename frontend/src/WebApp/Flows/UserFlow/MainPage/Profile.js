import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import LevelThree from "./LevelThree";

const ProfileForm = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    universityName: "",
    dob: "",
    educationLevel: "",
    fieldOfStudy: "",
    desiredField: "",
    linkedin: "",
    portfolio: "",
    financialStatus: "",
    state: "",
    country: "",
    city: "",
    postalCode: "",
    address: "",
    currentGrade: "",
    gradePercentage: "",
    profileImage: "",
    skills: "",
    interests: "",
    preferredLocations: "",
  });

  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLevel1Open, setIsLevel1Open] = useState(true);
  const [isLevel2Open, setIsLevel2Open] = useState(false);
  const [isLevel3Open, setIsLevel3Open] = useState(false);

  // 👁 state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  const isValidDate = (date) => {
    if (!date || typeof date !== "string") return false;
    if (date.toLowerCase().includes("not provided")) return false;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  };

useEffect(() => {
  const fetchUserProfile = async () => {
    try {
      // ✅ CORRECT TOKEN SOURCE
      const token = localStorage.getItem("userToken");

      if (!token) {
        setErrorMessage("No token found. Please log in again.");
        return;
      }

      const { data } = await axios.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser((prevUser) => ({
        ...prevUser,
        ...data,
        password: "",
        confirmPassword: "",
        dob: isValidDate(data.dob)
          ? new Date(data.dob).toISOString().split("T")[0]
          : "",
        profileImage: data.profileImage || prevUser.profileImage,
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
        interests: Array.isArray(data.interests) ? data.interests.join(", ") : "",
        preferredLocations: Array.isArray(data.preferredLocations)
          ? data.preferredLocations.join(", ")
          : "",
      }));
    } catch (error) {
      console.error("Error fetching profile:", error);
      setErrorMessage("Failed to load profile data.");
    }
  };

  fetchUserProfile();
}, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser((prevUser) => ({
          ...prevUser,
          profileImage: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

 const handleUpdateProfile = async () => {
  setErrorMessage(null);
  setSuccessMessage("");

  try {
    // ✅ CORRECT TOKEN SOURCE
    const token = localStorage.getItem("userToken");

    if (!token) {
      setErrorMessage("No token found. Please log in again.");
      return;
    }

    const payload = {
      ...user,
      skills: user.skills
        ? user.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      interests: user.interests
        ? user.interests.split(",").map((i) => i.trim()).filter(Boolean)
        : [],
      preferredLocations: user.preferredLocations
        ? user.preferredLocations.split(",").map((l) => l.trim()).filter(Boolean)
        : [],
    };

    const { data } = await axios.put("/api/users/profile", payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    setSuccessMessage("Profile updated successfully!");

    // 🔄 update userInfo WITHOUT token
    const storedUser = JSON.parse(localStorage.getItem("userInfo")) || {};
    localStorage.setItem(
      "userInfo",
      JSON.stringify({ ...storedUser, ...data })
    );

    setUser((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
      profileImage: data.profileImage || prev.profileImage,
    }));
  } catch (error) {
    console.error("Update error:", error);
    setErrorMessage(
      "Failed to update profile. " +
        (error.response?.data?.message || "Unknown error")
    );
  }
};

  const level1Fields = [
    { label: "Full name", name: "name", type: "text" },
    { label: "Email Address", name: "email", type: "email" },
    { label: "University Name", name: "universityName", type: "text" },
    { label: "Date of Birth", name: "dob", type: "date" },
    { label: "Education Level", name: "educationLevel", type: "text" },
    { label: "Field of Study", name: "fieldOfStudy", type: "text" },
    { label: "Desired Field", name: "desiredField", type: "text" },
    { label: "LinkedIn Profile", name: "linkedin", type: "url" },
    { label: "Portfolio Link", name: "portfolio", type: "url" },
    { label: "Skills", name: "skills", type: "text", placeholder: "React, Node.js, SQL" },
    { label: "Interests", name: "interests", type: "text", placeholder: "AI, Robotics, Cloud" },
    { label: "Preferred Locations", name: "preferredLocations", type: "text", placeholder: "Hyderabad, Remote" },
    { label: "Password", name: "password", type: "password" },
    { label: "Confirm Password", name: "confirmPassword", type: "password" },
  ];

  const level2Fields = [
    { label: "Financial Status", name: "financialStatus", type: "text" },
    { label: "Country", name: "country", type: "text" },
    { label: "State", name: "state", type: "text" },
    { label: "City", name: "city", type: "text" },
    { label: "Postal Code", name: "postalCode", type: "text" },
    { label: "Address", name: "address", type: "text" },
    { label: "Current Grade", name: "currentGrade", type: "text" },
    { label: "Grade Percentage", name: "gradePercentage", type: "text" },
  ];

  return (
    <div className="min-h-screen mt-12 bg-white-50 flex items-center justify-center font-poppins">
      <div className="relative w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center md:text-left mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Your Profile</h2>
          <p className="text-gray-500 mt-2">
            Update your photo and personal details here.
          </p>
        </div>

        {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
        {successMessage && (
          <div className="text-green-500 mb-4">{successMessage}</div>
        )}

        <form>
          {[{ level: 1, isOpen: isLevel1Open, toggle: setIsLevel1Open, fields: level1Fields },
          { level: 2, isOpen: isLevel2Open, toggle: setIsLevel2Open, fields: level2Fields }].map(({ level, isOpen, toggle, fields }) => (
            <div key={level}>
              <div className="flex items-center justify-between mt-6">
                <h3 className="text-2xl font-semibold text-gray-800">
                  Profile Level {level}
                </h3>
                <button
                  type="button"
                  onClick={() => toggle(!isOpen)}
                  className="text-gray-500 focus:outline-none"
                >
                  {isOpen ? "▲" : "▼"}
                </button>
              </div>
              {isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  {fields.map(({ label, name, type, placeholder }) => {
                    // For Level 2, skip the "address" item here; we'll insert it right after "postalCode"
                    if (level === 2 && name === "address") return null;

                    return (
                      <React.Fragment key={name}>
                        <div className="flex flex-col relative">
                          <label
                            htmlFor={name}
                            className="text-sm font-medium text-gray-600 mb-2"
                          >
                            {label}
                          </label>

                          {(name === "password" || name === "confirmPassword") ? (
                            <div className="relative">
                              <input
                                type={
                                  name === "password"
                                    ? (showPassword ? "text" : "password")
                                    : (showConfirm ? "text" : "password")
                                }
                                id={name}
                                name={name}
                                value={user[name]}
                                onChange={handleChange}
                                placeholder={placeholder}
                                className="px-4 py-2 border rounded-md w-full pr-10 mt-1"
                              />
                              <span
                                onClick={() =>
                                  name === "password"
                                    ? setShowPassword(!showPassword)
                                    : setShowConfirm(!showConfirm)
                                }
                                className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                              >
                                {name === "password"
                                  ? (showPassword
                                    ? <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                                    : <EyeIcon className="h-5 w-5 text-gray-500" />)
                                  : (showConfirm
                                    ? <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                                    : <EyeIcon className="h-5 w-5 text-gray-500" />)}
                              </span>
                            </div>
                          ) : (
                            <input
                              type={type}
                              id={name}
                              name={name}
                              value={user[name]}
                              onChange={handleChange}
                              placeholder={placeholder}
                              className="px-4 py-2 border rounded-md"
                            />
                          )}
                        </div>

                        {/* ⬇️ Insert Address immediately after Postal Code for Level 2 */}
                        {level === 2 && name === "postalCode" && (
                          <div className="flex flex-col relative">
                            <label
                              htmlFor="address"
                              className="text-sm font-medium text-gray-600 mb-2"
                            >
                              Address
                            </label>
                            <input
                              type="text"
                              id="address"
                              name="address"
                              value={user.address}
                              onChange={handleChange}
                              placeholder="Street address, Apt/Suite"
                              className="px-4 py-2 border rounded-md"
                              autoComplete="street-address"
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Profile Image upload section */}
                  {level === 1 && (
                    <div className="flex flex-col">
                      <label
                        htmlFor="profileImage"
                        className="text-sm font-medium text-gray-600 mb-2"
                      >
                        Profile Image
                      </label>
                      <input
                        type="file"
                        id="profileImage"
                        name="profileImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="px-4 py-2 border rounded-md"
                      />
                      <div className="mt-4 flex justify-center items-center">
                        {user.profileImage && (
                          <img
                            src={user.profileImage}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-300"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {level === 2 && (
                    <button
                      type="button"
                      onClick={handleUpdateProfile}
                      className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-md w-full"
                    >
                      Save Changes
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Level 3 Personality */}
          <div>
            <div className="flex items-center justify-between mt-6">
              <h3 className="text-2xl font-semibold text-gray-800">
                Profile Level 3 (Personality Questions)
              </h3>
              <button
                type="button"
                onClick={() => setIsLevel3Open(!isLevel3Open)}
                className="text-gray-500 focus:outline-none"
              >
                {isLevel3Open ? "▲" : "▼"}
              </button>
            </div>
            {isLevel3Open && (
              <LevelThree
                profileData={user}
                createLevelThree={isLevel3Open}
                setCreateLevelThree={setIsLevel3Open}
                handleProfileData={handleUpdateProfile}
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;