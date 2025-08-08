import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const OfferTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [planType, setPlanType] = useState("Freemium");

  const partnerId = localStorage.getItem("partnerId");

  useEffect(() => {
    fetchTemplates();

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo?.planType) {
      setPlanType(userInfo.planType);
    } else {
      setPlanType("Freemium");
    }
  }, []);


  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`/api/templates?partnerId=${partnerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTemplates(res.data);
    } catch (err) {
      toast.error("Failed to load templates.");
    }
  };

  // const fetchUserDetails = async () => {
  //   try {
  //     const res = await axios.get(`/api/partner/profile?partnerId=${partnerId}`, {
  //       headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  //     });
  //     setPlanType(res.data.planType || "Freemium");
  //   } catch (err) {
  //     toast.error("Failed to fetch user details.");
  //   }
  // };

  const handleImageUpload = async () => {
    if (!imageFile) {
      toast.warning("Please select an image.");
      return;
    }

    if (!templateName.trim()) {
      toast.warning("Please enter a template name.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const uploadRes = await axios.post("/api/templates/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const imageUrl = uploadRes.data.imageUrl;

      await axios.post(
        "/api/templates",
        {
          partnerId,
          name: templateName.trim(),
          backgroundImageUrl: imageUrl,
          textStyle: {
            fontSize: 12,
            fontColor: "#000000",
            marginTop: 100,
            marginLeft: 50,
          },
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success("Template uploaded successfully!");
      setImageFile(null);
      setImagePreview(null);
      setTemplateName("");
      fetchTemplates();
    } catch (err) {
      toast.error("Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    try {
      await axios.delete(`/api/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Template deleted successfully.");
      fetchTemplates();
    } catch (err) {
      toast.error("Failed to delete template: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Offer Letter Templates</h2>

      {/* Upload form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Upload New Template</h3>

        {planType === "Freemium" ? (
          <div className="text-red-500 font-medium">
            Uploading templates is only available for Premium Basic and Premium Plus Partners.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., 'Summer 2025 Design'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Image *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {imagePreview && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Preview:</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs border border-gray-200 rounded-md shadow-sm"
                />
              </div>
            )}

            <button
              onClick={handleImageUpload}
              disabled={loading || !imageFile || !templateName.trim()}
              className={`mt-4 px-4 py-2 rounded-md text-white font-medium ${loading || !imageFile || !templateName.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                "Upload Template"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Template list */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Your Templates ({templates.length})</h3>

        {templates.length === 0 ? (
          <p className="text-gray-500 italic">No templates uploaded yet.</p>
        ) : (
          <div className="space-y-4">
            {templates.map((tpl) => (
              <div key={tpl._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{tpl.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(tpl.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteTemplate(tpl._id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <img
                    src={tpl.backgroundImageUrl}
                    alt="Template Background"
                    className="max-w-full md:max-w-xs rounded border border-gray-200 shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferTemplateManager;
