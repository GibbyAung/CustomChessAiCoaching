"use client";

import { useState, useEffect } from "react";
import {
  performanceAnalyzer,
  PerformanceAnalysis,
  Bottleneck,
  Recommendation,
} from "@/lib/performance-analysis";

interface PerformanceAnalysisDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerformanceAnalysisDashboard({
  isOpen,
  onClose,
}: PerformanceAnalysisDashboardProps) {
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<
    "summary" | "bottlenecks" | "recommendations" | "trends" | "report"
  >("summary");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runAnalysis();
    }
  }, [isOpen]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate analysis time
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = performanceAnalyzer.analyzePerformance();
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatMemory = (mb: number): string => {
    return `${mb.toFixed(1)}MB`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const exportReport = () => {
    const report = performanceAnalyzer.getAnalysisReport();
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-analysis-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportData = () => {
    const data = performanceAnalyzer.exportAnalysis();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-analysis-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Performance Analysis</h2>
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
              { id: "summary", label: "Summary" },
              { id: "bottlenecks", label: "Bottlenecks" },
              { id: "recommendations", label: "Recommendations" },
              { id: "trends", label: "Trends" },
              { id: "report", label: "Report" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-600"
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
          {isAnalyzing ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing performance data...</p>
              </div>
            </div>
          ) : analysis ? (
            <>
              {activeTab === "summary" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-600">
                        Page Load
                      </h3>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatDuration(analysis.summary.averagePageLoad)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-600">
                        Move Execution
                      </h3>
                      <p className="text-2xl font-bold text-green-900">
                        {formatDuration(analysis.summary.averageMoveExecution)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-purple-600">
                        AI Response
                      </h3>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatDuration(analysis.summary.averageAIResponse)}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-orange-600">
                        Memory Usage
                      </h3>
                      <p className="text-2xl font-bold text-orange-900">
                        {formatMemory(analysis.summary.memoryUsage)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">
                        Session Statistics
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Events:</span>
                          <span className="font-medium">
                            {analysis.summary.totalEvents}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Metrics:</span>
                          <span className="font-medium">
                            {analysis.summary.totalMetrics}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Error Rate:</span>
                          <span className="font-medium">
                            {analysis.summary.errorRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Session Duration:</span>
                          <span className="font-medium">
                            {(analysis.summary.sessionDuration / 60000).toFixed(
                              1
                            )}{" "}
                            minutes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">
                        Issues Found
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Critical Issues:</span>
                          <span className="font-medium text-red-600">
                            {
                              analysis.bottlenecks.filter(
                                (b) => b.severity === "critical"
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>High Priority:</span>
                          <span className="font-medium text-orange-600">
                            {
                              analysis.bottlenecks.filter(
                                (b) => b.severity === "high"
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recommendations:</span>
                          <span className="font-medium text-blue-600">
                            {analysis.recommendations.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "bottlenecks" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Performance Bottlenecks
                  </h3>
                  <div className="space-y-4">
                    {analysis.bottlenecks.map((bottleneck, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">
                            {bottleneck.description}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                              bottleneck.severity
                            )}`}
                          >
                            {bottleneck.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Impact:</strong> {bottleneck.impact}
                          </p>
                          <p>
                            <strong>Frequency:</strong> {bottleneck.frequency}{" "}
                            occurrences
                          </p>
                          <p>
                            <strong>Current Value:</strong>{" "}
                            {bottleneck.value.toFixed(1)} (Threshold:{" "}
                            {bottleneck.threshold})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "recommendations" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Optimization Recommendations
                  </h3>
                  <div className="space-y-4">
                    {analysis.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">
                            {rec.title}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                              rec.priority
                            )}`}
                          >
                            {rec.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>
                            <strong>Description:</strong> {rec.description}
                          </p>
                          <p>
                            <strong>Impact:</strong> {rec.impact}
                          </p>
                          <p>
                            <strong>Effort:</strong> {rec.effort}
                          </p>
                          <p>
                            <strong>Implementation:</strong>{" "}
                            {rec.implementation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "trends" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Performance Trends
                  </h3>
                  <div className="space-y-4">
                    {analysis.trends.map((trend, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900">
                            {trend.metric.replace("_", " ")}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              trend.trend === "improving"
                                ? "text-green-600 bg-green-50"
                                : trend.trend === "degrading"
                                ? "text-red-600 bg-red-50"
                                : "text-gray-600 bg-gray-50"
                            }`}
                          >
                            {trend.trend.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>
                            <strong>Change Rate:</strong>{" "}
                            {trend.changeRate.toFixed(2)}
                          </p>
                          <p>
                            <strong>Data Points:</strong> {trend.values.length}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "report" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Analysis Report</h3>
                  <p className="text-gray-600">
                    Generate and export detailed performance analysis reports.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={exportReport}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Export Markdown Report
                    </button>
                    <button
                      onClick={exportData}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Export JSON Data
                    </button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Report Preview</h4>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {performanceAnalyzer.getAnalysisReport()}
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-600">
              No analysis data available. Run analysis to see results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
