import React from "react";

export const SectorLoader = ({ title = "internships" }) => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 font-poppins animate-fadeIn">
      {/* Skeleton Header */}
      <div className="space-y-3 mb-8">
        <div className="h-8 w-64 bg-slate-200/80 rounded-lg animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-slate-100 rounded-md animate-pulse" />
      </div>

      {/* Modern Center Spinner Indicator */}
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="relative w-14 h-14 mb-4">
          <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping opacity-75" />
          </div>
        </div>
        <p className="text-base font-semibold text-slate-800">
          Loading {title}...
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Fetching the latest industry-vetted opportunities for your profile
        </p>
      </div>

      {/* Skeleton Internship Cards Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-200/80 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-slate-200/80 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="flex gap-2 pt-3">
              <div className="h-7 w-20 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-7 w-20 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SectorError = ({ error, onRetry }) => {
  return (
    <div className="w-full min-h-[40vh] flex flex-col items-center justify-center p-8 text-center font-poppins">
      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-xl font-bold mb-3 border border-rose-200 shadow-sm">
        !
      </div>
      <p className="text-base font-semibold text-slate-800">
        {error || "Failed to load internships"}
      </p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        Please check your network connection or try refreshing the page.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default SectorLoader;
