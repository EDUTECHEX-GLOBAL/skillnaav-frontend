import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminFeedbackDashboard({ flow = "all" }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");
  const API = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "";

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setErr(null);
      const url = `${API || ""}/api/feedback/summary?flow=${encodeURIComponent(flow || "all")}&timeRange=${timeRange}`;
      const res = await axios.get(url, { timeout: 10000 });
      setSummary(res.data || null);
    } catch (e) {
      console.error("fetchSummary", e);
      setErr(e);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [flow, timeRange]);

  const safe = (v, def = 0) => (v === null || v === undefined ? def : v);

  const getRatingCounts = () => {
    const rc = summary?.ratingCounts || null;
    if (!rc) return [0, 0, 0, 0, 0];
    if (Array.isArray(rc)) return rc.slice(0, 5);
    return [1, 2, 3, 4, 5].map(i => rc[i] || rc[String(i)] || 0);
  };

  const computeFlowInsights = () => {
    const byFlow = Array.isArray(summary?.byFlow) ? summary.byFlow : [];
    const total = byFlow.reduce((sum, f) => sum + (f.count || 0), 0);
    
    return byFlow.map(flow => ({
      ...flow,
      percentage: total > 0 ? Math.round((flow.count / total) * 100) : 0,
      sentiment: flow.avgOverall >= 4 ? "positive" : flow.avgOverall >= 3 ? "neutral" : "negative"
    }));
  };

  const calculateSentimentScore = () => {
    const counts = getRatingCounts();
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    
    // Weighted sentiment: 5*positive + 3*neutral + 1*negative
    const positive = counts[3] + counts[4]; // 4 & 5 stars
    const neutral = counts[2]; // 3 stars
    const negative = counts[0] + counts[1]; // 1 & 2 stars
    
    return Math.round(((positive * 5 + neutral * 3 + negative * 1) / (total * 5)) * 100);
  };

  const renderMetricCard = (title, value, change, color = "blue") => {
    const colors = {
      blue: "from-blue-500 to-cyan-400",
      green: "from-emerald-500 to-green-400",
      purple: "from-purple-500 to-pink-400",
      orange: "from-orange-500 to-amber-400"
    };

    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
            <span className="text-white font-bold text-lg">{title.charAt(0)}</span>
          </div>
          {change && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              change > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {change > 0 ? "↑" : "↓"} {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-1">{title}</div>
      </div>
    );
  };

  const renderFlowDistribution = () => {
    const flowInsights = computeFlowInsights();
    
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback by User Type</h3>
        <div className="space-y-4">
          {flowInsights.map((flow, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  flow._id === "student" ? "bg-blue-100 text-blue-600" :
                  flow._id === "partner" ? "bg-emerald-100 text-emerald-600" :
                  "bg-purple-100 text-purple-600"
                }`}>
                  <span className="text-sm font-bold">{flow._id.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 capitalize">{flow._id}</div>
                  <div className="text-sm text-gray-500">Avg: {flow.avgOverall?.toFixed(1) || "—"}/5</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{flow.count}</div>
                <div className="text-sm text-gray-500">{flow.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderIssuesByFlow = () => {
    const issuesByFlow = summary?.issuesByFlow || {};
    
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issues by User Type</h3>
        <div className="space-y-6">
          {Object.entries(issuesByFlow).map(([flow, issues]) => (
            <div key={flow}>
              <div className="flex items-center mb-3">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  flow === "student" ? "bg-blue-500" :
                  flow === "partner" ? "bg-emerald-500" :
                  "bg-purple-500"
                }`} />
                <span className="font-medium text-gray-900 capitalize">{flow} Issues</span>
              </div>
              <div className="space-y-2 ml-5">
                {issues.slice(0, 3).map((issue, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="text-sm text-gray-800">{issue.text}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500">Frequency: {issue.count}</div>
                      <div className="text-xs px-2 py-1 bg-gray-200 rounded-full">
                        {(issue.sentiment || "neutral") === "negative" ? "⚠️ Needs Attention" : "💡 Suggestion"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (err) return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center">
          <div className="text-red-600 text-2xl mr-3">⚠️</div>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Failed to Load Data</h3>
            <p className="text-red-600">{err.message || "Please check your connection"}</p>
          </div>
        </div>
        <button onClick={fetchSummary} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feedback Analytics</h1>
            <p className="text-gray-600 mt-2">
              Insights across {flow === "all" ? "all user flows" : flow} 
              <span className="ml-2 text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                Last {timeRange.replace("d", " days").replace("m", " months")}
              </span>
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <button
              onClick={fetchSummary}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-shadow"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-gray-200">
          {["overview", "issues", "sentiment", "trends"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? "bg-white text-blue-600 border-t border-l border-r border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {renderMetricCard("Total Feedback", summary?.total || 0, 12, "blue")}
              {renderMetricCard("Avg Rating", summary?.avgOverall?.toFixed(1) || "—", 8, "green")}
              {renderMetricCard("NPS Score", summary?.avgNps?.toFixed(1) || "—", 15, "purple")}
              {renderMetricCard("Sentiment", `${calculateSentimentScore()}%`, 5, "orange")}
            </div>

            {/* Distribution & Issues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {renderFlowDistribution()}
              {renderIssuesByFlow()}
            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Rating Distribution</h3>
              <div className="space-y-4">
                {[5,4,3,2,1].map(star => {
                  const count = getRatingCounts()[star - 1] || 0;
                  const totalRatings = getRatingCounts().reduce((a,b) => a + b, 0);
                  const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                  
                  return (
                    <div key={star} className="flex items-center">
                      <div className="w-16 text-sm font-medium text-gray-600">
                        {star} ★
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <span className="font-semibold text-gray-900">{count}</span>
                        <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Issues Tab */}
        {activeTab === "issues" && (
          <div className="space-y-8">
            {Object.entries(summary?.issuesByFlow || {}).map(([flow, issues]) => (
              <div key={flow} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      flow === "student" ? "bg-blue-500" :
                      flow === "partner" ? "bg-emerald-500" :
                      "bg-purple-500"
                    }`} />
                    <h3 className="text-xl font-bold text-gray-900 capitalize">{flow} - Top Issues</h3>
                  </div>
                  <span className="px-4 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {issues.length} issues found
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {issues.map((issue, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          issue.priority === "high" ? "bg-red-100 text-red-800" :
                          issue.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {issue.priority || "low"} priority
                        </div>
                        <span className="text-sm text-gray-500">#{idx + 1}</span>
                      </div>
                      <p className="text-gray-800 mb-4 line-clamp-3">{issue.text}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>👤 {issue.count} reports</span>
                        <span>⏱️ Last: {issue.lastReported}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sentiment Tab */}
        {activeTab === "sentiment" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sentiment Overview */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Sentiment Analysis by Flow</h3>
              <div className="space-y-6">
                {summary?.sentimentByFlow?.map((flow, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          flow._id === "student" ? "bg-blue-500" :
                          flow._id === "partner" ? "bg-emerald-500" :
                          "bg-purple-500"
                        }`} />
                        <span className="font-medium text-gray-900 capitalize">{flow._id}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Sentiment: <span className={`font-semibold ${
                          flow.sentimentScore >= 70 ? "text-green-600" :
                          flow.sentimentScore >= 40 ? "text-yellow-600" :
                          "text-red-600"
                        }`}>{flow.sentimentScore}%</span>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          flow.sentimentScore >= 70 ? "bg-gradient-to-r from-green-400 to-emerald-500" :
                          flow.sentimentScore >= 40 ? "bg-gradient-to-r from-yellow-400 to-amber-500" :
                          "bg-gradient-to-r from-red-400 to-pink-500"
                        }`}
                        style={{ width: `${flow.sentimentScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Requests */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Feature Requests</h3>
              <div className="space-y-4">
                {summary?.topFeatures?.slice(0, 5).map((feature, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mr-4">
                      <span className="text-blue-600 font-bold">+</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{feature.feature}</div>
                      <div className="text-sm text-gray-500">
                        Requested by {feature.byFlow?.student || 0} students, 
                        {feature.byFlow?.partner || 0} partners
                      </div>
                    </div>
                    <div className="text-lg font-bold text-blue-600">{feature.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString('en-US', { 
                dateStyle: 'medium', 
                timeStyle: 'medium' 
              })}
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <button className="px-5 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                Export PDF
              </button>
              <button className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-400 text-white rounded-xl hover:shadow-lg">
                Download CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}