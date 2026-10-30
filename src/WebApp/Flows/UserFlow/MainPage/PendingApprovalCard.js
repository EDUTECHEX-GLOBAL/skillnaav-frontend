// PendingApprovalCard.jsx
import React from "react";

const PendingApprovalCard = ({ userInfo }) => {
  const steps = [
    { label: "Account created", done: true },
    { label: "Profile submitted", done: true },
    { label: "Admin review", done: false, active: true },
    { label: "Access granted", done: false },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8 max-w-md w-full mx-auto text-center border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
      <style>{`
        @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:0.2} }
      `}</style>

      {/* Animated icon */}
      <div className="relative inline-flex mb-4">
        <div
          className="absolute -inset-2 rounded-full border-2 border-purple-400"
          style={{ animation: "pulse-ring 2s ease-in-out infinite" }}
        />
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-2xl sm:text-3xl shadow-inner">
          ⏳
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        Awaiting Admin Approval
      </h2>
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
        Hi{" "}
        <strong className="text-purple-900 font-semibold">
          {userInfo?.name?.split(" ")[0] || "there"}
        </strong>
        ! Your account is under review. You'll get full access once an admin
        approves your profile.
      </p>

      {/* Progress steps */}
      <div className="flex items-center justify-between w-full mb-6 px-1">
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex-1 min-w-0 flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step.done
                    ? "bg-purple-600 text-white shadow-sm"
                    : step.active
                      ? "bg-purple-100 text-purple-700 border-2 border-purple-600 ring-4 ring-purple-100"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                }`}
              >
                {step.done ? (
                  "✓"
                ) : step.active ? (
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full bg-purple-600"
                    style={{ animation: "pulse-ring 1.4s ease-in-out infinite" }}
                  />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[9px] sm:text-[11px] leading-tight text-center max-w-full px-0.5 ${
                  step.done
                    ? "text-purple-600 font-semibold"
                    : step.active
                      ? "text-purple-900 font-bold"
                      : "text-gray-400 font-normal"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mb-4 mx-0.5 sm:mx-1 transition-colors duration-300 ${
                  step.done ? "bg-purple-600" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Info row */}
      <div className="bg-purple-50 rounded-xl p-3.5 sm:p-4 mb-5 border border-purple-100 flex items-start gap-2.5 text-left">
        <span className="text-base sm:text-lg flex-shrink-0">📧</span>
        <p className="text-xs sm:text-sm text-purple-900 leading-snug break-all sm:break-normal">
          We'll send an email to{" "}
          <strong className="font-semibold text-purple-950">
            {userInfo?.email}
          </strong>{" "}
          as soon as your account is approved.
        </p>
      </div>

      <p className="text-xs text-gray-400">
        Approval usually takes 1–2 business days. Questions?{" "}
        <a
          href="mailto:support@skillnaav.com"
          className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
        >
          Contact support
        </a>
      </p>
    </div>
  );
};

export default PendingApprovalCard;