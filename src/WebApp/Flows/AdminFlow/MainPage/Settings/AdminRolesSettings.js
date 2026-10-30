import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Search, UserCog, CheckCircle2, AlertTriangle, Calendar, UsersRound, UserPlus, X, Trash2, ChevronDown } from 'lucide-react';

import axios from 'axios';

const settingsApi = axios.create({ baseURL: process.env.REACT_APP_API_BASE || "" });

settingsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

settingsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback) => {
  if (error?.response?.data?.message) return error.response.data.message;
  return fallback;
};

export const AdminRolesSettings = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role: "Support Admin" });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [hasSuperAdminFlag] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("adminInfo") || "{}").isAdmin === true;
    } catch (_) {
      return false;
    }
  });
  const [currentAdminId] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("adminInfo") || "{}").id || "";
    } catch (_) {
      return "";
    }
  });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await settingsApi.get("/api/admin/all");
      setAdmins(data);
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error, "Could not load administrator accounts."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const filteredAdmins = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return admins.filter((admin) => {
      const searchString = `${admin.name || ''} ${admin.email || ''} ${admin.role || ''}`.toLowerCase();
      return searchString.includes(query);
    });
  }, [admins, searchQuery]);

  const activeAdminCount = useMemo(
    () => admins.filter((admin) => admin.status === "Active" || !admin.status).length,
    [admins]
  );

  const isSuperAdmin = useMemo(
    () => hasSuperAdminFlag || admins.some((admin) => admin._id === currentAdminId && admin.role === "Super Admin"),
    [admins, currentAdminId, hasSuperAdminFlag]
  );

  const updateAdminAccess = async (id, changes) => {
    setSavingId(id);
    setNotice(null);
    try {
      const { data } = await settingsApi.patch(`/api/admin/${id}/access`, changes);
      setAdmins((currentList) =>
        currentList.map((item) => (item._id === id ? data : item))
      );
      setNotice({ type: "success", text: "Administrator access updated." });
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error, "Administrator access could not be updated."),
      });
    } finally {
      setSavingId("");
    }
  };

  const toggleStatus = (admin) => {
    const isCurrentlyActive = admin.status === "Active" || !admin.status;
    const newStatus = isCurrentlyActive ? "Suspended" : "Active";
    updateAdminAccess(admin._id, { status: newStatus });
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    setCreating(true);
    setNotice(null);
    try {
      const { data } = await settingsApi.post("/api/admin", newAdmin);
      setAdmins((current) => [...current, data]);
      setNewAdmin({ name: "", email: "", password: "", role: "Support Admin" });
      setIsAddOpen(false);
      setNotice({ type: "success", text: "Administrator account created." });
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error, "Administrator account could not be created.") });
    } finally {
      setCreating(false);
    }
  };

  const deleteAdmin = async () => {
    if (!deleteTarget) return;
    setSavingId(deleteTarget._id);
    setNotice(null);
    try {
      await settingsApi.delete(`/api/admin/${deleteTarget._id}`);
      setAdmins((current) => current.filter((admin) => admin._id !== deleteTarget._id));
      setNotice({ type: "success", text: "Administrator account deleted." });
      setDeleteTarget(null);
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error, "Administrator account could not be deleted.") });
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-200 m-2 sm:m-4 md:m-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Administrator Access</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage roles and account status for platform administrators
          </p>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 sm:px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow active:scale-[0.98] whitespace-nowrap flex-1 sm:flex-none"
            >
              <UserPlus size={18} className="shrink-0" />
              <span>Add Admin</span>
            </button>
          )}
          <div className="h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-50/70 border border-indigo-100 px-4 text-sm font-semibold text-indigo-800 whitespace-nowrap flex-1 sm:flex-none">
            <UsersRound size={18} className="text-indigo-600 shrink-0" />
            <span>{activeAdminCount} Active</span>
          </div>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm flex items-center gap-2  ${
          notice.type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
          {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {notice.text}
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <form onSubmit={createAdmin} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Add Administrator</h4>
                <p className="mt-1 text-sm text-gray-500">Create a staff account and assign its work role.</p>
              </div>
              <button type="button" onClick={() => setIsAddOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <input required value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="Full name" className="w-full h-11 rounded-xl border border-gray-200 px-3.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white" />
              <input required type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="Email address" className="w-full h-11 rounded-xl border border-gray-200 px-3.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white" />
              <input required type="password" minLength="8" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="Temporary password (minimum 8 characters)" className="w-full h-11 rounded-xl border border-gray-200 px-3.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white" />
              
              {/* Custom Role Dropdown matching exact box size */}
              <div className="relative w-full" ref={roleDropdownRef}>
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3.5 text-sm outline-none cursor-pointer flex justify-between items-center hover:border-indigo-500 focus:border-indigo-500 transition-colors text-left"
                >
                  <span className="text-gray-800 font-medium truncate">
                    {newAdmin.role || "Support Admin"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 flex-shrink-0 ml-2 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`}
                  />
                </button>
                {roleDropdownOpen && (
                  <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 w-full box-border">
                    {["Operations Admin", "Support Admin", "Finance Admin"].map((role) => (
                      <div
                        key={role}
                        onClick={() => {
                          setNewAdmin({ ...newAdmin, role });
                          setRoleDropdownOpen(false);
                        }}
                        className={`px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                          newAdmin.role === role ? "bg-indigo-600 text-white font-medium" : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        }`}
                      >
                        {role}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {creating && <Loader2 size={16} className="animate-spin" />}
                Create Admin
              </button>
              <button type="button" onClick={() => setIsAddOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2 text-red-600"><Trash2 size={20} /></div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Delete administrator?</h4>
                <p className="text-sm text-gray-500">This permanently removes {deleteTarget.name || deleteTarget.email}.</p>
              </div>
            </div>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={deleteAdmin} disabled={Boolean(savingId)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                {savingId === deleteTarget._id && <Loader2 size={16} className="animate-spin" />}
                Delete Account
              </button>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={Boolean(savingId)} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search administrators by name or email..."
          className="w-full rounded-xl bg-gray-50 border border-gray-200 py-3 pl-12 pr-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 bg-white text-gray-900"
        />
      </div>

      {/* Admin Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="mb-3 animate-spin text-indigo-600" size={32} />
          <span className="text-sm text-gray-500">Loading administrators…</span>
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 py-16 text-center">
          <UserCog className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-500">No administrators found</h4>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAdmins.map((admin) => {
            const isActive = admin.status === "Active" || !admin.status;
            const initial = (admin.name || admin.email || "A").charAt(0).toUpperCase();

            return (
              <div key={admin._id} className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-white border border-gray-200 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-100 shadow-sm">
                
                {/* Avatar and Info wrapper */}
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold shadow-sm ${
                      isActive 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                        : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500'
                    }`}>
                      {initial}
                    </div>
                    <div className={`absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-[3px] border-white ${
                      isActive ? 'bg-emerald-500' : 'bg-gray-300'
                    }`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg font-bold text-gray-800">
                        {admin.name || "Unnamed Admin"}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                        {isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-1 truncate">{admin.email}</p>
                    <p className="mt-1 text-xs font-semibold text-indigo-600">{admin.role || "Support Admin"}</p>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-300" />
                      Last login: {admin.lastLogin 
                        ? new Date(admin.lastLogin).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Action */}
                {isSuperAdmin && (
                  <div className="flex items-center justify-between sm:justify-start gap-3 sm:pl-4 sm:border-l sm:border-gray-100 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto">
                    {savingId === admin._id ? (
                      <div className="w-[210px] flex justify-center">
                        <Loader2 size={24} className="animate-spin text-indigo-600" />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleStatus(admin)}
                          className={`relative flex-1 sm:flex-none justify-center overflow-hidden rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                            isActive
                              ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 hover:shadow-sm'
                              : 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-sm'
                          }`}
                        >
                          {isActive ? 'Suspend Access' : 'Restore Access'}
                        </button>
                        {admin._id !== currentAdminId && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(admin)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition-colors hover:bg-red-50 flex-shrink-0"
                            aria-label={`Delete ${admin.name || admin.email}`}
                            title="Delete account"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
