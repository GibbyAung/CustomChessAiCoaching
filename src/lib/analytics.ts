// Analytics System for Chess Engine
// Tracks user behavior, game completion, and performance metrics

export interface GameEvent {
  type:
    | "session_start"
    | "game_start"
    | "game_end"
    | "move_made"
    | "ai_move"
    | "difficulty_change"
    | "control_used";
  timestamp: number;
  data: Record<string, any>;
  sessionId: string;
  userId?: string;
}

export interface PerformanceMetric {
  type: "page_load" | "ai_response" | "move_execution" | "memory_usage";
  value: number;
  unit: string;
  timestamp: number;
  sessionId: string;
}

export interface UserSession {
  id: string;
  startTime: number;
  lastActivity: number;
  totalGames: number;
  completedGames: number;
  totalMoves: number;
  averageGameTime: number;
  preferredDifficulty: string;
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  timezone: string;
}

class Analytics {
  private sessionId: string;
  private events: GameEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private session: UserSession;
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.session = this.initializeSession();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): UserSession {
    return {
      id: this.sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      totalGames: 0,
      completedGames: 0,
      totalMoves: 0,
      averageGameTime: 0,
      preferredDifficulty: "medium",
      deviceInfo: this.getDeviceInfo(),
    };
  }

  private getDeviceInfo(): DeviceInfo {
    if (typeof window === "undefined") {
      return {
        userAgent: "server",
        screenWidth: 0,
        screenHeight: 0,
        language: "en",
        timezone: "UTC",
      };
    }

    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  public init(): void {
    if (this.isInitialized) return;

    this.trackEvent("session_start", {
      sessionId: this.sessionId,
      deviceInfo: this.session.deviceInfo,
    });

    // Track page load performance
    this.trackPerformance("page_load", this.measurePageLoadTime());

    // Set up activity tracking
    this.setupActivityTracking();

    this.isInitialized = true;
    console.log("Analytics initialized for session:", this.sessionId);
  }

  private measurePageLoadTime(): number {
    if (typeof window === "undefined") return 0;

    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    return navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
  }

  private setupActivityTracking(): void {
    if (typeof window === "undefined") return;

    const updateActivity = () => {
      this.session.lastActivity = Date.now();
    };

    ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(
      (event) => {
        window.addEventListener(event, updateActivity, { passive: true });
      }
    );
  }

  public trackEvent(
    type: GameEvent["type"],
    data: Record<string, any> = {}
  ): void {
    const event: GameEvent = {
      type,
      timestamp: Date.now(),
      data,
      sessionId: this.sessionId,
    };

    this.events.push(event);
    this.session.lastActivity = Date.now();

    // Update session data based on event type
    this.updateSessionData(event);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("Analytics Event:", event);
    }

    // Store in localStorage for persistence
    this.persistData();
  }

  private updateSessionData(event: GameEvent): void {
    switch (event.type) {
      case "game_start":
        this.session.totalGames++;
        break;
      case "game_end":
        this.session.completedGames++;
        if (event.data.gameTime) {
          this.updateAverageGameTime(event.data.gameTime);
        }
        break;
      case "move_made":
        this.session.totalMoves++;
        break;
      case "difficulty_change":
        this.session.preferredDifficulty = event.data.difficulty;
        break;
    }
  }

  private updateAverageGameTime(gameTime: number): void {
    const totalTime =
      this.session.averageGameTime * (this.session.completedGames - 1) +
      gameTime;
    this.session.averageGameTime = totalTime / this.session.completedGames;
  }

  public trackPerformance(
    type: PerformanceMetric["type"],
    value: number,
    unit: string = "ms"
  ): void {
    const metric: PerformanceMetric = {
      type,
      value,
      unit,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.performanceMetrics.push(metric);

    if (process.env.NODE_ENV === "development") {
      console.log("Performance Metric:", metric);
    }
  }

  private persistData(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        "chess_analytics_session",
        JSON.stringify(this.session)
      );
      localStorage.setItem(
        "chess_analytics_events",
        JSON.stringify(this.events.slice(-100))
      ); // Keep last 100 events
      localStorage.setItem(
        "chess_analytics_performance",
        JSON.stringify(this.performanceMetrics.slice(-50))
      ); // Keep last 50 metrics
    } catch (error) {
      console.warn("Failed to persist analytics data:", error);
    }
  }

  public getSessionData(): UserSession {
    return { ...this.session };
  }

  public getEvents(): GameEvent[] {
    return [...this.events];
  }

  public getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  public getAnalyticsSummary(): {
    session: UserSession;
    recentEvents: GameEvent[];
    performanceSummary: Record<
      string,
      { avg: number; min: number; max: number }
    >;
  } {
    const performanceSummary: Record<
      string,
      { avg: number; min: number; max: number }
    > = {};

    // Group metrics by type
    const metricsByType = this.performanceMetrics.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = [];
      }
      acc[metric.type].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate summary for each metric type
    Object.entries(metricsByType).forEach(([type, values]) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      performanceSummary[type] = { avg, min, max };
    });

    return {
      session: this.getSessionData(),
      recentEvents: this.events.slice(-20), // Last 20 events
      performanceSummary,
    };
  }

  public exportData(): string {
    return JSON.stringify(
      {
        session: this.session,
        events: this.events,
        performanceMetrics: this.performanceMetrics,
        exportTimestamp: Date.now(),
      },
      null,
      2
    );
  }

  public clearData(): void {
    this.events = [];
    this.performanceMetrics = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("chess_analytics_session");
      localStorage.removeItem("chess_analytics_events");
      localStorage.removeItem("chess_analytics_performance");
    }
  }
}

// Create singleton instance
export const analytics = new Analytics();

// Initialize analytics when module is loaded
if (typeof window !== "undefined") {
  analytics.init();
}

export default analytics;
