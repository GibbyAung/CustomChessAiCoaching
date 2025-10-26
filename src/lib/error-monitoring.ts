// Error Monitoring System for Chess Engine
// Tracks errors, performance issues, and provides alerting

export interface ErrorEvent {
  id: string;
  timestamp: number;
  type: "error" | "warning" | "performance" | "user_action";
  message: string;
  stack?: string;
  context: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
  sessionId: string;
  userId?: string;
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  severity: "warning" | "critical";
}

class ErrorMonitor {
  private errors: ErrorEvent[] = [];
  private alerts: PerformanceAlert[] = [];
  private sessionId: string;
  private isInitialized = false;
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = [];
  private errorCallbacks: ((error: ErrorEvent) => void)[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public init(): void {
    if (this.isInitialized) return;

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    this.isInitialized = true;
    console.log("Error monitoring initialized for session:", this.sessionId);
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === "undefined") return;

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError(
        "Unhandled Promise Rejection",
        {
          reason: event.reason,
          promise: event.promise,
        },
        "high"
      );
    });

    // Handle JavaScript errors
    window.addEventListener("error", (event) => {
      this.captureError(
        "JavaScript Error",
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        },
        "high"
      );
    });

    // Handle resource loading errors
    window.addEventListener(
      "error",
      (event) => {
        if (event.target !== window) {
          this.captureError(
            "Resource Loading Error",
            {
              target: event.target,
              type: event.type,
            },
            "medium"
          );
        }
      },
      true
    );
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === "undefined") return;

    // Monitor long tasks
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Tasks longer than 50ms
              this.capturePerformanceIssue("Long Task", {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              });
            }
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch (error) {
        console.warn("PerformanceObserver not supported");
      }
    }

    // Monitor memory usage
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) {
          // 50MB threshold
          this.capturePerformanceIssue("High Memory Usage", {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  public captureError(
    message: string,
    context: Record<string, any> = {},
    severity: ErrorEvent["severity"] = "medium",
    error?: Error
  ): void {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: "error",
      message,
      stack: error?.stack,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      severity,
      sessionId: this.sessionId,
    };

    this.errors.push(errorEvent);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error captured:", errorEvent);
    }

    // Trigger error callbacks
    this.errorCallbacks.forEach((callback) => callback(errorEvent));

    // Store in localStorage
    this.persistErrors();
  }

  public captureWarning(
    message: string,
    context: Record<string, any> = {}
  ): void {
    const warningEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: "warning",
      message,
      context,
      severity: "low",
      sessionId: this.sessionId,
    };

    this.errors.push(warningEvent);

    if (process.env.NODE_ENV === "development") {
      console.warn("Warning captured:", warningEvent);
    }

    this.persistErrors();
  }

  public capturePerformanceIssue(
    message: string,
    context: Record<string, any> = {}
  ): void {
    const performanceEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: "performance",
      message,
      context,
      severity: "medium",
      sessionId: this.sessionId,
    };

    this.errors.push(performanceEvent);

    // Create performance alert
    const alert: PerformanceAlert = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      metric: context.metric || "unknown",
      value: context.value || 0,
      threshold: context.threshold || 0,
      message,
      severity: "warning",
    };

    this.alerts.push(alert);

    // Trigger alert callbacks
    this.alertCallbacks.forEach((callback) => callback(alert));

    if (process.env.NODE_ENV === "development") {
      console.warn("Performance issue captured:", performanceEvent);
    }

    this.persistErrors();
  }

  public captureUserAction(
    action: string,
    context: Record<string, any> = {}
  ): void {
    const userActionEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: "user_action",
      message: `User action: ${action}`,
      context,
      severity: "low",
      sessionId: this.sessionId,
    };

    this.errors.push(userActionEvent);
    this.persistErrors();
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private persistErrors(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        "chess_error_log",
        JSON.stringify(this.errors.slice(-100))
      ); // Keep last 100 errors
      localStorage.setItem(
        "chess_alerts",
        JSON.stringify(this.alerts.slice(-50))
      ); // Keep last 50 alerts
    } catch (error) {
      console.warn("Failed to persist error data:", error);
    }
  }

  public onError(callback: (error: ErrorEvent) => void): void {
    this.errorCallbacks.push(callback);
  }

  public onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  public getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getErrorSummary(): {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    recentErrors: ErrorEvent[];
  } {
    const bySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errors.length,
      bySeverity,
      byType,
      recentErrors: this.errors.slice(-10), // Last 10 errors
    };
  }

  public clearErrors(): void {
    this.errors = [];
    this.alerts = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("chess_error_log");
      localStorage.removeItem("chess_alerts");
    }
  }

  public exportErrorData(): string {
    return JSON.stringify(
      {
        sessionId: this.sessionId,
        errors: this.errors,
        alerts: this.alerts,
        summary: this.getErrorSummary(),
        exportTimestamp: Date.now(),
      },
      null,
      2
    );
  }
}

// Create singleton instance
export const errorMonitor = new ErrorMonitor();

// Initialize error monitoring when module is loaded
if (typeof window !== "undefined") {
  errorMonitor.init();
}

export default errorMonitor;
