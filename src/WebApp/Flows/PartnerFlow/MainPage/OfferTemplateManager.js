// File: OfferTemplateManager.js

import React, { useState, useEffect, useRef } from "react";
import axios from "../../../../api/axiosInstance";
import { toast } from "react-toastify";
import skillnaavLogo from "../../../../assets/skillnaav_logo-250w.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faUpload,
  faSpinner,
  faExclamationTriangle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const PartnerLogoManager = () => {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [planType, setPlanType] = useState("Freemium");
  const fileInputRef = useRef(null);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("partnerToken") ||
    sessionStorage.getItem("partnerToken");

  // =============================
  // Load Partner Profile
  // =============================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await axios.get("/api/partners/profile", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        setCurrentLogoUrl(res.data?.logoUrl || null);
        setPlanType(res.data?.planType || "Freemium");
      } catch (err) {
        console.error("Profile fetch failed:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [token]);

  // =============================
  // File Select
  // =============================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, JPEG, SVG).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Image size should be less than 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearSelected = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // =============================
  // Upload Logo
  // =============================
  const handleUpload = async () => {
    if (!imageFile) {
      toast.warning("Please select a logo image first.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await axios.post("/api/partners/upload-logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setCurrentLogoUrl(res.data.logoUrl);
      setPreviewUrl(null);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast.success("Logo uploaded successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Logo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // =============================
  // Remove Logo
  // =============================
  const handleConfirmRemove = async () => {
    setRemoving(true);

    try {
      await axios.put(
        "/api/partners/remove-logo",
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setCurrentLogoUrl(null);
      setPreviewUrl(null);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowConfirmModal(false);
      toast.success("Logo removed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove logo. Please try again.");
    } finally {
      setRemoving(false);
    }
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="p-4 max-w-2xl mx-auto font-poppins">
      <h2 className="text-2xl font-bold mb-2 text-slate-800">Company Logo</h2>

      <p className="text-sm text-slate-500 mb-6">
        Your logo appears alongside the SkillNaav logo on every offer letter PDF.
      </p>

      {/* Preview Header */}
      <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-sky-50 to-indigo-50/50 border border-sky-100 rounded-2xl mb-6 shadow-sm">
        <img
          src={skillnaavLogo}
          alt="SkillNaav Logo"
          className="h-10 w-auto object-contain bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs"
        />

        <span className="text-slate-400 font-bold text-lg">+</span>

        {currentLogoUrl ? (
          <img
            src={currentLogoUrl}
            alt="Partner Logo"
            className="h-10 max-w-[120px] object-contain bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs"
          />
        ) : (
          <div className="w-20 h-10 bg-white/80 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-[11px] font-medium text-slate-400">
            Your Logo
          </div>
        )}
      </div>

      {/* Upload Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        {loadingProfile ? (
          <div className="flex items-center justify-center py-8 gap-3 text-slate-500 text-sm font-medium">
            <FontAwesomeIcon icon={faSpinner} spin className="text-indigo-600 text-lg" />
            <span>Loading logo manager...</span>
          </div>
        ) : planType === "Freemium" ? (
          <div className="text-amber-700 text-sm bg-amber-50 p-4 rounded-xl border border-amber-200/70 flex items-center gap-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500" />
            <span>Upgrade to Premium to add your company logo to offer letters.</span>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Choose New Logo
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4
                  file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold
                  file:shadow-xs hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl p-1.5"
                />
                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleClearSelected}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Clear selected image"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
            </div>

            {previewUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Preview:</span>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-14 max-w-[120px] object-contain rounded-lg bg-white border border-slate-200 p-1"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!imageFile || uploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {uploading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUpload} className="text-xs" />
                    <span>Save Logo</span>
                  </>
                )}
              </button>

              {currentLogoUrl && (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={uploading || removing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-rose-200 text-rose-600 font-semibold text-sm rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ CUSTOM CONFIRMATION MODAL ═══ */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[3px] animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200/80 transform transition-all scale-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <FontAwesomeIcon icon={faTrash} className="text-lg" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1.5">Remove Company Logo?</h3>

            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to remove your company logo? It will no longer appear on your offer letter PDFs.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={removing}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={removing}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 shadow-md shadow-rose-200 transition-all disabled:opacity-50"
              >
                {removing ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                    <span>Removing...</span>
                  </>
                ) : (
                  "Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerLogoManager;