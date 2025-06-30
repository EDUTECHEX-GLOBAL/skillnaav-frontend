import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SchoolAdminProfileForm = () => {
  const location = useLocation();
  const initialRegisterData = location.state || {};
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    schoolName: "",
    address: "",
    affiliation: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    website: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    affiliation: "",
    verificationDoc: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "verificationDoc") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const combinedData = {
    ...initialRegisterData,
    ...formData,
  };

  try {
    const response = await fetch("/api/school-admin/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(combinedData),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration submitted successfully!");
      navigate("/schooladmin/login");
    } else {
      alert(data.message || "Registration failed.");
    }
  } catch (error) {
    console.error("Error submitting profile:", error);
    alert("An error occurred.");
  }
};



  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 font-poppins">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-xl w-full max-w-3xl p-8"
      >
        <h2 className="text-3xl font-bold text-blue-700 mb-8 text-center">
          School Profile Details
        </h2>

        {/* Section: School Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Institution Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="schoolName"
              placeholder="School / University Name"
              value={formData.schoolName}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md"
              required
            />
            <input
              type="text"
              name="affiliation"
              placeholder="Affiliation (e.g., CBSE)"
              value={formData.affiliation}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md"
              required
            />
            <input
              type="text"
              name="state"
              placeholder="State / Province"
              value={formData.state}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md"
              required
            />
            <input
              type="text"
              name="postalCode"
              placeholder="Postal Code / ZIP"
              value={formData.postalCode}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md"
              required
            />
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select Country</option>
              <option value="India">India</option>
              <option value="Canada">Canada</option>
              <option value="USA">USA</option>
            </select>
            <input
              type="url"
              name="website"
              placeholder="Website (optional)"
              value={formData.website}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md md:col-span-2"
            />
          </div>
        </div>

        {/* Section: Address */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Full Address</h3>
          <textarea
            name="address"
            placeholder="Street, Area, Landmark"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            rows={3}
            required
          />
        </div>

        {/* Section: Contact Info */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="contactPerson"
              placeholder="Contact Person Name"
              value={formData.contactPerson}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md"
              required
            />
            <input
              type="email"
              name="contactEmail"
              placeholder="Contact Email"
              value={formData.contactEmail}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md"
              required
            />
            <input
              type="text"
              name="contactPhone"
              placeholder="Contact Phone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>

        {/* Section: Verification */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Upload Verification Document (optional)
          </h3>
          <input
            type="file"
            name="verificationDoc"
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-md w-full"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-md font-semibold transition"
        >
          Submit Profile
        </button>
      </form>
    </div>
  );
};

export default SchoolAdminProfileForm;
