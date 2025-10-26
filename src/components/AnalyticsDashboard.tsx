"use client";

import { useState, useEffect } from "react";
import {
  analytics,
  UserSession,
  GameEvent,
  PerformanceMetric,
} from "@/lib/analytics";

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsDashboard({
  isOpen,
  onClose,
}: AnalyticsDashboardProps) {
  const [sessionData, setSessionData] = useState<UserSession | null>(null);
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<
    Record<string, { avg: number; min: number; max: number }>
  >({});
  const [activeTab, setActiveTab] = useState<
    "overview" | "events" | "performance" | "export"
  >("overview");

  useEffect(() => {
    if (isOpen) {
      updateAnalyticsData();
    }
  }, [isOpen]);

  const updateAnalyticsData = () => {
    const summary = analytics.getAnalyticsSummary();
    setSessionData(summary.session);
    setRecentEvents(summary.recentEvents);
    setPerformanceSummary(summary.performanceSummary);
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const exportData = () => {
    const data = analytics.exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chess-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (
      confirm(
        "Are you sure you want to clear all analytics data? This cannot be undone."
      )
    ) {
      analytics.clearData();
      updateAnalyticsData();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "overview", label: "Overview" },
              { id: "events", label: "Events" },
              { id: "performance", label: "Performance" },
              { id: "export", label: "Export" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "overview" && sessionData && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600">
                    Total Games
                  </h3>
                  <p className="text-2xl font-bold text-blue-900">
                    {sessionData.totalGames}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600">
                    Completed Games
                  </h3>
                  <p className="text-2xl font-bold text-green-900">
                    {sessionData.completedGames}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600">
                    Total Moves
                  </h3>
                  <p className="text-2xl font-bold text-purple-900">
                    {sessionData.totalMoves}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-600">
                    Avg Game Time
                  </h3>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatDuration(sessionData.averageGameTime)}
                  </p>
                </div>
              </div>

              {/* Device Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Device Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Screen:</span>{" "}
                    {sessionData.deviceInfo.screenWidth} ×{" "}
                    {sessionData.deviceInfo.screenHeight}
                  </div>
                  <div>
                    <span className="font-medium">Language:</span>{" "}
                    {sessionData.deviceInfo.language}
                  </div>
                  <div>
                    <span className="font-medium">Timezone:</span>{" "}
                    {sessionData.deviceInfo.timezone}
                  </div>
                  <div>
                    <span className="font-medium">Preferred Difficulty:</span>{" "}
                    {sessionData.preferredDifficulty}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {recentEvents.slice(-5).map((event, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span className="font-medium">
                        {event.type.replace("_", " ")}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Events</h3>
              <div className="space-y-2">
                {recentEvents.map((event, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-purple-600">
                          {event.type}
                        </span>
                        {Object.keys(event.data).length > 0 && (
                          <pre className="text-xs text-gray-600 mt-1">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Performance Metrics
              </h3>
              <div className="space-y-4">
                {Object.entries(performanceSummary).map(([type, metrics]) => (
                  <div key={type} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-purple-600 mb-2">
                      {type.replace("_", " ")}
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Average:</span>
                        <span className="ml-2 font-medium">
                          {formatDuration(metrics.avg)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Min:</span>
                        <span className="ml-2 font-medium">
                          {formatDuration(metrics.min)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max:</span>
                        <span className="ml-2 font-medium">
                          {formatDuration(metrics.max)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Export</h3>
              <p className="text-gray-600">
                Export your analytics data for further analysis or backup
                purposes.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={exportData}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Export Data
                </button>
                <button
                  onClick={clearData}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Clear Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
