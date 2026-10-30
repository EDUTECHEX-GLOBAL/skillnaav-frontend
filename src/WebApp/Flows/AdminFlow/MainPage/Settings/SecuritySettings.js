import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, KeyRound, Save, ShieldCheck, CheckCircle2, AlertTriangle, Eye, EyeOff, ChevronDown } from 'lucide-react';

import axios from 'axios';

const defaults = { 
  sessionExpiry: 60, 
  forceLogout: true, 
  maxLoginAttempts: 5, 
  accountLockDuration: 30, 
  require2FA: true 
};

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

export const SecuritySettings = () => {
  
  const [values, setValues] = useState(defaults);
  const [initial, setInitial] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);


  // Accordion State
  const [isAuthExpanded, setIsAuthExpanded] = useState(false);
  const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);

  // Change Password State

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null); // { type: 'success' | 'error', text: '' }
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const requestPasswordOtp = async () => {
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setIsChangingPassword(true);
    try {
      await settingsApi.post('/api/admin/change-password-otp');
      setOtpSent(true);
      setPasswordStatus({ type: 'success', text: 'OTP sent to your email! Please enter it below to confirm.' });
    } catch (err) {
      setPasswordStatus({ type: 'error', text: getErrorMessage(err, 'Failed to send OTP') });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const updatePassword = async () => {
    if (!otp) {
      setPasswordStatus({ type: 'error', text: 'Please enter the OTP.' });
      return;
    }
    setIsChangingPassword(true);
    try {
      await settingsApi.post('/api/admin/change-password', { otp, newPassword });
      setPasswordStatus({ type: 'success', text: 'Password successfully updated!' });
      setOtpSent(false);
      setNewPassword('');
      setOtp('');
    } catch (err) {
      setPasswordStatus({ type: 'error', text: getErrorMessage(err, 'Failed to update password') });
    } finally {
      setIsChangingPassword(false);
    }
  };


  const load = useCallback(async () => { 
    setLoading(true); 
    try { 
      const { data } = await settingsApi.get("/api/admin/settings"); 
      const next = { ...defaults, ...data.securitySettings }; 
      setValues(next); 
      setInitial(next); 
    } catch (error) { 
      setNotice({ 
        type: "error", 
        text: getErrorMessage(error, "Could not load security settings.") 
      }); 
    } finally { 
      setLoading(false); 
    } 
  }, []);

  useEffect(() => { load(); }, [load]);

  const change = ({ target: { name, value, type, checked } }) => 
    setValues((current) => ({ 
      ...current, 
      [name]: type === "checkbox" ? checked : value 
    }));

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const save = async () => { 
    setSaving(true); 
    setNotice(null); 
    try { 
      const payload = { 
        ...values, 
        sessionExpiry: Number(values.sessionExpiry), 
        maxLoginAttempts: Number(values.maxLoginAttempts), 
        accountLockDuration: Number(values.accountLockDuration) 
      }; 
      const { data } = await settingsApi.put("/api/admin/settings", { 
        securitySettings: payload 
      }); 
      const next = { ...defaults, ...data.securitySettings }; 
      setValues(next); 
      setInitial(next); 
      setNotice({ 
        type: "success", 
        text: "Security policy saved successfully." 
      }); 
    } catch (error) { 
      setNotice({ 
        type: "error", 
        text: getErrorMessage(error, "Security settings could not be saved.") 
      }); 
    } finally { 
      setSaving(false); 
    } 
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 m-2 sm:m-4 md:m-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Security Policy</h3>
          <p className="text-sm text-gray-500 mt-1">
            Set administrator sign-in and password requirements
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 ">
          <ShieldCheck size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Protected</span>
        </div>
      </div>

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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="mb-3 animate-spin text-indigo-600" size={32} />
          <span className="text-sm text-gray-500">Loading security policy…</span>
        </div>
      ) : (
        <>
        <div className="space-y-6">
          {/* Authentication Rules */}
          <div className="rounded-2xl bg-blue-50/50 shadow-sm border border-blue-100 p-4 sm:p-6">
            <button 
              type="button" 
              onClick={() => setIsAuthExpanded(!isAuthExpanded)}
              className="flex w-full items-start sm:items-center justify-between gap-3 text-left focus:outline-none"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-10 w-10 min-w-[2.5rem] min-h-[2.5rem] shrink-0 aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 text-white shadow-md">
                  <KeyRound size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Authentication Rules</h4>
                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 sm:line-clamp-none">Limit failed attempts and strengthen access</p>
                </div>
              </div>
              <ChevronDown 
                size={18} 
                className={`text-gray-400 shrink-0 transition-transform duration-200 mt-1 sm:mt-0 ${isAuthExpanded ? 'rotate-180' : ''}`} 
              />
            </button>
            {isAuthExpanded && (
              <div className="grid gap-5 mt-5 pt-5 border-t border-blue-100">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Maximum Login Attempts
                </label>
                <p className="text-xs text-gray-400 mt-0.5">Between 1 and 20 attempts</p>
                <input
                  type="number"
                  name="maxLoginAttempts"
                  value={values.maxLoginAttempts}
                  min="1"
                  max="20"
                  onChange={change}
                  className="mt-2 w-full h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 text-sm text-gray-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 !mt-0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Account Lock Duration
                </label>
                <p className="text-xs text-gray-400 mt-0.5">1 minute to 24 hours</p>
                <div className="relative mt-2">
                  <input
                    type="number"
                    name="accountLockDuration"
                    value={values.accountLockDuration}
                    min="1"
                    max="1440"
                    onChange={change}
                    className="w-full h-11 rounded-xl bg-gray-50 border border-gray-200 px-4 pr-20 text-sm text-gray-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 !mt-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 select-none">
                    minutes
                  </span>
                </div>
              </div>
            </div>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 transition-all hover:bg-blue-50/70 shadow-sm">
            <input
              type="checkbox"
              name="require2FA"
              checked={values.require2FA}
              onChange={change}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 bg-gray-50 text-indigo-600 focus:ring-cyan-400/20 shrink-0"
            />
            <div>
              <span className="block text-sm font-semibold text-gray-700">
                Require Two-Factor Authentication
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-gray-500">
                Require an email OTP when administrators sign in
              </span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-xs text-gray-400">
              <ShieldCheck size={14} className="shrink-0" />
              These rules apply to all administrator accounts
            </p>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Policy
            </button>
          </div>
        </div>

        
        {/* Change Password Card */}
        <div className="rounded-2xl bg-blue-50/50 shadow-sm border border-blue-100 p-4 sm:p-6 mt-6">
          <button 
            type="button" 
            onClick={() => setIsPasswordExpanded(!isPasswordExpanded)}
            className="flex w-full items-start sm:items-center justify-between gap-3 text-left focus:outline-none"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-10 w-10 min-w-[2.5rem] min-h-[2.5rem] shrink-0 aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-blue-400 text-white shadow-md">
                <KeyRound size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Change Password</h4>
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 sm:line-clamp-none">Securely update your admin account password</p>
              </div>
            </div>
            <ChevronDown 
              size={18} 
              className={`text-gray-400 shrink-0 transition-transform duration-200 mt-1 sm:mt-0 ${isPasswordExpanded ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {isPasswordExpanded && (
            <div className="mt-5 pt-5 border-t border-blue-100">
              {/* Stepper */}
              <div className="mb-8 w-full max-w-xl">
                <div className="flex items-start justify-between relative">
                  {[
                    { num: 1, label: 'New password', isActive: true, isDone: newPassword.length >= 8 || otpSent || passwordStatus?.type === 'success' },
                    { num: 2, label: 'Request OTP', isActive: newPassword.length >= 8 || otpSent, isDone: otpSent || passwordStatus?.type === 'success' },
                    { num: 3, label: 'Enter OTP', isActive: otpSent || passwordStatus?.type === 'success', isDone: passwordStatus?.type === 'success' },
                    { num: 4, label: 'Confirmed', isActive: passwordStatus?.type === 'success', isDone: passwordStatus?.type === 'success' },
                  ].map((step, idx, arr) => (
                    <div key={step.num} className="flex-1 flex flex-col items-center relative min-w-0">
                      {/* Connecting Line */}
                      {idx > 0 && (
                        <div className="absolute top-4 sm:top-5 -left-1/2 w-full h-0.5 bg-gray-200 -z-0">
                          <div
                            className={`h-full transition-all duration-300 ${step.isActive || step.isDone ? 'bg-emerald-600' : 'bg-transparent'}`}
                            style={{ width: step.isActive || step.isDone ? '100%' : '0%' }}
                          />
                        </div>
                      )}
                      
                      {/* Step Circle */}
                      <div className={`relative z-10 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 aspect-square items-center justify-center rounded-full border-2 transition-all ${
                        step.isDone 
                          ? 'border-emerald-600 bg-white text-emerald-600' 
                          : step.isActive && !step.isDone
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' 
                            : 'border-gray-200 bg-white text-gray-400'
                      }`}>
                        {step.isDone ? <CheckCircle2 size={18} /> : <span className="text-xs sm:text-sm font-bold">{step.num}</span>}
                      </div>

                      {/* Step Label without absolute overlapping */}
                      <span className={`mt-2 text-center text-[10px] sm:text-xs font-semibold leading-tight px-0.5 sm:px-1 break-words line-clamp-2 ${
                        step.isActive || step.isDone ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            {/* Status Messages */}
            {passwordStatus && (
              <div className={`mb-6 flex items-center gap-2 rounded-xl p-3.5 text-sm max-w-md ${
                passwordStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {passwordStatus.type === 'error' ? <AlertTriangle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
                <span>{passwordStatus.text}</span>
              </div>
            )}
            
            {/* Form */}
            <div className="max-w-md mt-6">
              {!otpSent && passwordStatus?.type !== 'success' ? (
                <>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">New Password</label>
                  <div className="relative mb-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordStatus(null);
                      }}
                      disabled={isChangingPassword}
                      placeholder="Enter new password"
                      className="w-full h-11 rounded-xl border border-gray-300 py-2.5 pl-4 pr-12 text-sm text-gray-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none !mt-0 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-6">Minimum 8 characters.</p>

                  <button
                    onClick={requestPasswordOtp}
                    disabled={isChangingPassword || newPassword.length < 8}
                    className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                  >
                    {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
                    Send code to my email
                  </button>
                </>
              ) : otpSent ? (
                <>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Verification OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      setPasswordStatus(null);
                    }}
                    disabled={isChangingPassword}
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className="w-full h-11 rounded-xl border border-gray-300 py-2.5 px-4 text-sm text-gray-800 tracking-widest focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none mb-6 !mt-0 bg-white"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={updatePassword}
                      disabled={isChangingPassword || !otp}
                      className="h-11 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                    >
                      {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
                      Update Password
                    </button>
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setPasswordStatus(null);
                      }}
                      disabled={isChangingPassword}
                      className="h-11 px-4 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          )}
        </div>
        </>
      )}
    </div>
  );
};

// ============ LAYOUT ============
