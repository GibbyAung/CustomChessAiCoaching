// Performance Analysis System for Chess Engine
// Analyzes collected performance data and provides optimization recommendations

import { analytics } from "./analytics";
import { errorMonitor } from "./error-monitoring";

export interface PerformanceAnalysis {
  timestamp: number;
  sessionId: string;
  summary: PerformanceSummary;
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
  trends: PerformanceTrend[];
}

export interface PerformanceSummary {
  totalEvents: number;
  totalMetrics: number;
  averagePageLoad: number;
  averageMoveExecution: number;
  averageAIResponse: number;
  memoryUsage: number;
  errorRate: number;
  sessionDuration: number;
}

export interface Bottleneck {
  id: string;
  type: "performance" | "memory" | "error" | "user_experience";
  severity: "low" | "medium" | "high" | "critical";
  metric: string;
  value: number;
  threshold: number;
  description: string;
  impact: string;
  frequency: number;
}

export interface Recommendation {
  id: string;
  category: "optimization" | "bug_fix" | "feature" | "monitoring";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  impact: string;
  effort: "low" | "medium" | "high";
  implementation: string;
}

export interface PerformanceTrend {
  metric: string;
  values: { timestamp: number; value: number }[];
  trend: "improving" | "stable" | "degrading";
  changeRate: number;
}

class PerformanceAnalyzer {
  private analysisCache: Map<string, PerformanceAnalysis> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public analyzePerformance(): PerformanceAnalysis {
    const sessionData = analytics.getSessionData();
    const events = analytics.getEvents();
    const metrics = analytics.getPerformanceMetrics();
    const errorSummary = errorMonitor.getErrorSummary();

    // Check cache first
    const cacheKey = `${sessionData.id}_${Math.floor(
      Date.now() / this.CACHE_DURATION
    )}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const analysis: PerformanceAnalysis = {
      timestamp: Date.now(),
      sessionId: sessionData.id,
      summary: this.calculateSummary(
        events,
        metrics,
        errorSummary,
        sessionData
      ),
      bottlenecks: this.identifyBottlenecks(events, metrics, errorSummary),
      recommendations: this.generateRecommendations(
        events,
        metrics,
        errorSummary
      ),
      trends: this.analyzeTrends(metrics),
    };

    // Cache the analysis
    this.analysisCache.set(cacheKey, analysis);

    return analysis;
  }

  private calculateSummary(
    events: any[],
    metrics: any[],
    errorSummary: any,
    sessionData: any
  ): PerformanceSummary {
    const pageLoadMetrics = metrics.filter((m) => m.type === "page_load");
    const moveExecutionMetrics = metrics.filter(
      (m) => m.type === "move_execution"
    );
    const aiResponseMetrics = metrics.filter((m) => m.type === "ai_response");

    const averagePageLoad =
      pageLoadMetrics.length > 0
        ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) /
          pageLoadMetrics.length
        : 0;

    const averageMoveExecution =
      moveExecutionMetrics.length > 0
        ? moveExecutionMetrics.reduce((sum, m) => sum + m.value, 0) /
          moveExecutionMetrics.length
        : 0;

    const averageAIResponse =
      aiResponseMetrics.length > 0
        ? aiResponseMetrics.reduce((sum, m) => sum + m.value, 0) /
          aiResponseMetrics.length
        : 0;

    const sessionDuration = Date.now() - sessionData.startTime;
    const errorRate =
      events.length > 0 ? (errorSummary.total / events.length) * 100 : 0;

    return {
      totalEvents: events.length,
      totalMetrics: metrics.length,
      averagePageLoad,
      averageMoveExecution,
      averageAIResponse,
      memoryUsage: this.getMemoryUsage(),
      errorRate,
      sessionDuration,
    };
  }

  private identifyBottlenecks(
    events: any[],
    metrics: any[],
    errorSummary: any
  ): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Analyze performance metrics
    const performanceBottlenecks = this.analyzePerformanceBottlenecks(metrics);
    bottlenecks.push(...performanceBottlenecks);

    // Analyze error patterns
    const errorBottlenecks = this.analyzeErrorBottlenecks(errorSummary);
    bottlenecks.push(...errorBottlenecks);

    // Analyze user experience issues
    const uxBottlenecks = this.analyzeUXBottlenecks(events, metrics);
    bottlenecks.push(...uxBottlenecks);

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private analyzePerformanceBottlenecks(metrics: any[]): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Page load time analysis
    const pageLoadMetrics = metrics.filter((m) => m.type === "page_load");
    if (pageLoadMetrics.length > 0) {
      const avgPageLoad =
        pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) /
        pageLoadMetrics.length;
      const slowLoads = pageLoadMetrics.filter((m) => m.value > 3000).length;

      if (avgPageLoad > 2000) {
        bottlenecks.push({
          id: "slow_page_load",
          type: "performance",
          severity:
            avgPageLoad > 5000
              ? "critical"
              : avgPageLoad > 3000
              ? "high"
              : "medium",
          metric: "page_load",
          value: avgPageLoad,
          threshold: 2000,
          description: `Average page load time is ${avgPageLoad.toFixed(0)}ms`,
          impact: "Poor user experience, high bounce rate",
          frequency: slowLoads,
        });
      }
    }

    // Move execution time analysis
    const moveMetrics = metrics.filter((m) => m.type === "move_execution");
    if (moveMetrics.length > 0) {
      const avgMoveTime =
        moveMetrics.reduce((sum, m) => sum + m.value, 0) / moveMetrics.length;
      const slowMoves = moveMetrics.filter((m) => m.value > 100).length;

      if (avgMoveTime > 50) {
        bottlenecks.push({
          id: "slow_move_execution",
          type: "performance",
          severity: avgMoveTime > 200 ? "high" : "medium",
          metric: "move_execution",
          value: avgMoveTime,
          threshold: 50,
          description: `Average move execution time is ${avgMoveTime.toFixed(
            1
          )}ms`,
          impact: "Unresponsive game feel",
          frequency: slowMoves,
        });
      }
    }

    // AI response time analysis
    const aiMetrics = metrics.filter((m) => m.type === "ai_response");
    if (aiMetrics.length > 0) {
      const avgAIResponse =
        aiMetrics.reduce((sum, m) => sum + m.value, 0) / aiMetrics.length;
      const slowAI = aiMetrics.filter((m) => m.value > 5000).length;

      if (avgAIResponse > 2000) {
        bottlenecks.push({
          id: "slow_ai_response",
          type: "performance",
          severity:
            avgAIResponse > 10000
              ? "critical"
              : avgAIResponse > 5000
              ? "high"
              : "medium",
          metric: "ai_response",
          value: avgAIResponse,
          threshold: 2000,
          description: `Average AI response time is ${avgAIResponse.toFixed(
            0
          )}ms`,
          impact: "Poor AI opponent experience",
          frequency: slowAI,
        });
      }
    }

    return bottlenecks;
  }

  private analyzeErrorBottlenecks(errorSummary: any): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    if (errorSummary.total > 0) {
      const errorRate = errorSummary.total / 100; // Errors per 100 events

      if (errorRate > 0.1) {
        // More than 10% error rate
        bottlenecks.push({
          id: "high_error_rate",
          type: "error",
          severity:
            errorRate > 0.5 ? "critical" : errorRate > 0.2 ? "high" : "medium",
          metric: "error_rate",
          value: errorRate * 100,
          threshold: 10,
          description: `Error rate is ${(errorRate * 100).toFixed(1)}%`,
          impact: "Poor reliability, user frustration",
          frequency: errorSummary.total,
        });
      }

      // Analyze error types
      Object.entries(errorSummary.byType).forEach(([type, count]) => {
        if ((count as number) > 5) {
          bottlenecks.push({
            id: `frequent_${type}_errors`,
            type: "error",
            severity: (count as number) > 20 ? "high" : "medium",
            metric: `${type}_errors`,
            value: count as number,
            threshold: 5,
            description: `Frequent ${type} errors (${count} occurrences)`,
            impact: "Reduced functionality and user trust",
            frequency: count as number,
          });
        }
      });
    }

    return bottlenecks;
  }

  private analyzeUXBottlenecks(events: any[], metrics: any[]): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Analyze game completion rate
    const gameStarts = events.filter((e) => e.type === "game_start").length;
    const gameEnds = events.filter((e) => e.type === "game_end").length;

    if (gameStarts > 0) {
      const completionRate = (gameEnds / gameStarts) * 100;
      if (completionRate < 50) {
        bottlenecks.push({
          id: "low_game_completion",
          type: "user_experience",
          severity: completionRate < 20 ? "high" : "medium",
          metric: "game_completion_rate",
          value: completionRate,
          threshold: 50,
          description: `Game completion rate is ${completionRate.toFixed(1)}%`,
          impact: "Users abandoning games, poor engagement",
          frequency: gameStarts - gameEnds,
        });
      }
    }

    return bottlenecks;
  }

  private generateRecommendations(
    events: any[],
    metrics: any[],
    errorSummary: any
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Performance recommendations
    const performanceRecs = this.generatePerformanceRecommendations(metrics);
    recommendations.push(...performanceRecs);

    // Error handling recommendations
    const errorRecs = this.generateErrorRecommendations(errorSummary);
    recommendations.push(...errorRecs);

    // User experience recommendations
    const uxRecs = this.generateUXRecommendations(events, metrics);
    recommendations.push(...uxRecs);

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private generatePerformanceRecommendations(metrics: any[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Page load optimization
    const pageLoadMetrics = metrics.filter((m) => m.type === "page_load");
    if (pageLoadMetrics.length > 0) {
      const avgPageLoad =
        pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) /
        pageLoadMetrics.length;

      if (avgPageLoad > 2000) {
        recommendations.push({
          id: "optimize_page_load",
          category: "optimization",
          priority: avgPageLoad > 5000 ? "critical" : "high",
          title: "Optimize Page Load Performance",
          description: `Current average page load time is ${avgPageLoad.toFixed(
            0
          )}ms, which is above the 2-second threshold.`,
          impact: "Improve user experience and reduce bounce rate",
          effort: "medium",
          implementation:
            "Implement code splitting, optimize bundle size, use CDN for assets, enable compression",
        });
      }
    }

    return recommendations;
  }

  private generateErrorRecommendations(errorSummary: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (errorSummary.total > 0) {
      const errorRate = errorSummary.total / 100;

      if (errorRate > 0.1) {
        recommendations.push({
          id: "improve_error_handling",
          category: "bug_fix",
          priority: errorRate > 0.5 ? "critical" : "high",
          title: "Improve Error Handling",
          description: `Error rate of ${(errorRate * 100).toFixed(
            1
          )}% indicates reliability issues.`,
          impact: "Improve application stability and user trust",
          effort: "medium",
          implementation:
            "Add comprehensive error boundaries, improve input validation, implement retry mechanisms",
        });
      }
    }

    return recommendations;
  }

  private generateUXRecommendations(
    events: any[],
    metrics: any[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Game completion rate
    const gameStarts = events.filter((e) => e.type === "game_start").length;
    const gameEnds = events.filter((e) => e.type === "game_end").length;

    if (gameStarts > 0) {
      const completionRate = (gameEnds / gameStarts) * 100;
      if (completionRate < 50) {
        recommendations.push({
          id: "improve_game_completion",
          category: "feature",
          priority: completionRate < 20 ? "high" : "medium",
          title: "Improve Game Completion Rate",
          description: `Only ${completionRate.toFixed(
            1
          )}% of started games are completed.`,
          impact: "Increase user engagement and retention",
          effort: "high",
          implementation:
            "Add save/load functionality, implement game hints, improve AI difficulty scaling, add tutorial mode",
        });
      }
    }

    return recommendations;
  }

  private analyzeTrends(metrics: any[]): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];

    // Group metrics by type and time
    const metricsByType = metrics.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = [];
      }
      acc[metric.type].push({
        timestamp: metric.timestamp,
        value: metric.value,
      });
      return acc;
    }, {} as Record<string, { timestamp: number; value: number }[]>);

    // Analyze trends for each metric type
    Object.entries(metricsByType).forEach(([type, values]) => {
      if ((values as { timestamp: number; value: number }[]).length >= 3) {
        const sortedValues = (
          values as { timestamp: number; value: number }[]
        ).sort(
          (
            a: { timestamp: number; value: number },
            b: { timestamp: number; value: number }
          ) => a.timestamp - b.timestamp
        );
        const trend = this.calculateTrend(sortedValues);

        trends.push({
          metric: type,
          values: sortedValues,
          trend: trend.direction,
          changeRate: trend.changeRate,
        });
      }
    });

    return trends;
  }

  private calculateTrend(values: { timestamp: number; value: number }[]): {
    direction: "improving" | "stable" | "degrading";
    changeRate: number;
  } {
    if (values.length < 2) {
      return { direction: "stable", changeRate: 0 };
    }

    // Calculate linear regression
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v.value, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v.value, 0);
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const changeRate = slope;

    // Determine trend direction
    let direction: "improving" | "stable" | "degrading";
    if (Math.abs(changeRate) < 0.1) {
      direction = "stable";
    } else if (changeRate < 0) {
      direction = "improving"; // Lower values are better for performance metrics
    } else {
      direction = "degrading";
    }

    return { direction, changeRate };
  }

  private getMemoryUsage(): number {
    if (typeof window === "undefined" || !("memory" in performance)) {
      return 0;
    }

    const memory = (performance as any).memory;
    return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
  }

  public getAnalysisReport(): string {
    const analysis = this.analyzePerformance();

    let report = `# Performance Analysis Report\n\n`;
    report += `**Generated:** ${new Date(
      analysis.timestamp
    ).toLocaleString()}\n`;
    report += `**Session ID:** ${analysis.sessionId}\n\n`;

    // Summary
    report += `## Summary\n\n`;
    report += `- **Total Events:** ${analysis.summary.totalEvents}\n`;
    report += `- **Total Metrics:** ${analysis.summary.totalMetrics}\n`;
    report += `- **Average Page Load:** ${analysis.summary.averagePageLoad.toFixed(
      0
    )}ms\n`;
    report += `- **Average Move Execution:** ${analysis.summary.averageMoveExecution.toFixed(
      1
    )}ms\n`;
    report += `- **Average AI Response:** ${analysis.summary.averageAIResponse.toFixed(
      0
    )}ms\n`;
    report += `- **Memory Usage:** ${analysis.summary.memoryUsage.toFixed(
      1
    )}MB\n`;
    report += `- **Error Rate:** ${analysis.summary.errorRate.toFixed(1)}%\n`;
    report += `- **Session Duration:** ${(
      analysis.summary.sessionDuration / 60000
    ).toFixed(1)} minutes\n\n`;

    // Bottlenecks
    if (analysis.bottlenecks.length > 0) {
      report += `## Critical Issues\n\n`;
      analysis.bottlenecks.slice(0, 5).forEach((bottleneck) => {
        report += `### ${bottleneck.description}\n`;
        report += `- **Severity:** ${bottleneck.severity}\n`;
        report += `- **Impact:** ${bottleneck.impact}\n`;
        report += `- **Frequency:** ${bottleneck.frequency} occurrences\n\n`;
      });
    }

    // Recommendations
    if (analysis.recommendations.length > 0) {
      report += `## Recommendations\n\n`;
      analysis.recommendations.slice(0, 5).forEach((rec) => {
        report += `### ${rec.title}\n`;
        report += `- **Priority:** ${rec.priority}\n`;
        report += `- **Impact:** ${rec.impact}\n`;
        report += `- **Effort:** ${rec.effort}\n`;
        report += `- **Implementation:** ${rec.implementation}\n\n`;
      });
    }

    return report;
  }

  public exportAnalysis(): string {
    const analysis = this.analyzePerformance();
    return JSON.stringify(analysis, null, 2);
  }
}

// Create singleton instance
export const performanceAnalyzer = new PerformanceAnalyzer();

export default performanceAnalyzer;
