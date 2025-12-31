import React, { useState, useEffect } from "react";
import axios from "axios";
import LevelThree from "./LevelThree";

const ProfileForm = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
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

  const isValidDate = (date) => {
    if (!date || typeof date !== "string") return false;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  };

  // 🔄 Fetch profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) {
          setErrorMessage("Please log in again.");
          return;
        }

        const { data } = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser((prev) => ({
          ...prev,
          ...data,
          dob: isValidDate(data.dob)
            ? new Date(data.dob).toISOString().split("T")[0]
            : "",
          skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
          interests: Array.isArray(data.interests) ? data.interests.join(", ") : "",
          preferredLocations: Array.isArray(data.preferredLocations)
            ? data.preferredLocations.join(", ")
            : "",
        }));
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load profile.");
      }
    };

    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUser((prev) => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    setErrorMessage(null);
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        setErrorMessage("Please log in again.");
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

      await axios.put("/api/users/profile", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccessMessage("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || "Profile update failed."
      );
    }
  };

  const level1Fields = [
    { label: "Full Name", name: "name", type: "text" },
    { label: "Email Address", name: "email", type: "email", disabled: true },
    { label: "University Name", name: "universityName", type: "text" },
    { label: "Date of Birth", name: "dob", type: "date" },
    { label: "Education Level", name: "educationLevel", type: "text" },
    { label: "Field of Study", name: "fieldOfStudy", type: "text" },
    { label: "Desired Field", name: "desiredField", type: "text" },
    { label: "LinkedIn Profile", name: "linkedin", type: "url" },
    { label: "Portfolio", name: "portfolio", type: "url" },
    { label: "Skills", name: "skills", type: "text" },
    { label: "Interests", name: "interests", type: "text" },
    { label: "Preferred Locations", name: "preferredLocations", type: "text" },
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
    <div className="min-h-screen mt-12 flex justify-center bg-gray-50 font-poppins">
      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow">
        <h2 className="text-3xl font-bold mb-2">Your Profile</h2>
        <p className="text-gray-500 mb-6">
          Update your personal and academic details.
        </p>

        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
        {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}

        {[{ title: "Profile Level 1", fields: level1Fields, open: isLevel1Open, setOpen: setIsLevel1Open },
          { title: "Profile Level 2", fields: level2Fields, open: isLevel2Open, setOpen: setIsLevel2Open }]
          .map(({ title, fields, open, setOpen }) => (
            <div key={title}>
              <div className="flex justify-between mt-6">
                <h3 className="text-xl font-semibold">{title}</h3>
                <button onClick={() => setOpen(!open)}>
                  {open ? "▲" : "▼"}
                </button>
              </div>

              {open && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  {fields.map(({ label, name, type, disabled }) => (
                    <div key={name} className="flex flex-col">
                      <label className="text-sm mb-1">{label}</label>
                      <input
                        type={type}
                        name={name}
                        value={user[name]}
                        disabled={disabled}
                        onChange={handleChange}
                        className={`border px-3 py-2 rounded ${
                          disabled ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                  ))}

                  {title === "Profile Level 1" && (
                    <div className="flex flex-col">
                      <label className="text-sm mb-1">Profile Image</label>
                      <input type="file" accept="image/*" onChange={handleFileChange} />
                      {user.profileImage && (
                        <img
                          src={user.profileImage}
                          alt="Profile"
                          className="w-24 h-24 rounded-full mt-4 object-cover"
                        />
                      )}
                    </div>
                  )}

                  {title === "Profile Level 2" && (
                    <button
                      type="button"
                      onClick={handleUpdateProfile}
                      className="bg-blue-600 text-white px-6 py-2 rounded mt-4 col-span-full"
                    >
                      Save Changes
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

        <div className="mt-8">
          <h3 className="text-xl font-semibold">Profile Level 3</h3>
          <button onClick={() => setIsLevel3Open(!isLevel3Open)}>
            {isLevel3Open ? "▲" : "▼"}
          </button>
          {isLevel3Open && (
            <LevelThree
              profileData={user}
              handleProfileData={handleUpdateProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
