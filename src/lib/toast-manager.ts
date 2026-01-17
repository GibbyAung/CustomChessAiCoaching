// src/lib/toast-manager.ts
"use client";

export type ToastPriority = "low" | "medium" | "high" | "critical";
export type ToastType =
  | "tactical"
  | "positional"
  | "strategic"
  | "learning"
  | "error"
  | "success";

export interface Toast {
  id: string;
  type: ToastType;
  priority: ToastPriority;
  title: string;
  message: string;
  timestamp: number;
  duration?: number; // Auto-dismiss duration in ms
}

export interface CoachingSettings {
  verbosity: "silent" | "minimal" | "normal" | "verbose";
  showOnlyBlunders: boolean;
  maxToasts: number;
  autoDismiss: boolean;
  cooldownMs: number; // Minimum time between toasts
}

class ToastManager {
  private toasts: Map<string, Toast> = new Map();
  private toastCache: Set<string> = new Set();
  private lastToastTime = 0;
  private subscribers: Set<(toasts: Toast[]) => void> = new Set();

  private settings: CoachingSettings = {
    verbosity: "normal",
    showOnlyBlunders: false,
    maxToasts: 2, // Reduced from 3
    autoDismiss: true,
    cooldownMs: 2000, // 2 second cooldown between toasts
  };

  // Update settings
  updateSettings(newSettings: Partial<CoachingSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.notifySubscribers();
  }

  getSettings(): CoachingSettings {
    return { ...this.settings };
  }

  // Add toast with deduplication
  addToast(toast: Omit<Toast, "id" | "timestamp">): string | null {
    // Check if in silent mode
    if (this.settings.verbosity === "silent") {
      return null;
    }

    // Check cooldown
    const now = Date.now();
    if (now - this.lastToastTime < this.settings.cooldownMs) {
      console.log("⏸️ Toast blocked by cooldown");
      return null;
    }

    // Filter by settings
    if (this.settings.showOnlyBlunders && toast.priority !== "critical") {
      return null;
    }

    // Check verbosity level
    if (!this.shouldShowToast(toast.priority)) {
      return null;
    }

    // Generate cache key for deduplication
    const cacheKey = `${toast.type}-${toast.title}-${toast.message.substring(
      0,
      50
    )}`;
    console.log("🔑 Generated cache key:", cacheKey);

    // Check if duplicate (within 10 seconds)
    if (this.toastCache.has(cacheKey)) {
      console.log("🚫 Duplicate toast blocked:", cacheKey);
      return null;
    }

    // Create toast
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      timestamp: now,
      duration: toast.duration || this.getDefaultDuration(toast.priority),
    };

    // Add to cache
    this.toastCache.add(cacheKey);
    setTimeout(() => {
      this.toastCache.delete(cacheKey);
    }, 30000); // Clear from cache after 30 seconds

    // Add toast
    this.toasts.set(id, newToast);
    this.lastToastTime = now;

    // Enforce max toasts limit
    this.enforceMaxToasts();

    // Auto-dismiss if enabled
    if (this.settings.autoDismiss && newToast.duration) {
      setTimeout(() => {
        this.removeToast(id);
      }, newToast.duration);
    }

    this.notifySubscribers();
    console.log("✅ Toast added:", {
      type: toast.type,
      priority: toast.priority,
    });
    return id;
  }

  private shouldShowToast(priority: ToastPriority): boolean {
    const { verbosity } = this.settings;

    switch (verbosity) {
      case "silent":
        return false;
      case "minimal":
        return priority === "critical" || priority === "high";
      case "normal":
        return priority !== "low";
      case "verbose":
        return true;
      default:
        return true;
    }
  }

  private getDefaultDuration(priority: ToastPriority): number {
    switch (priority) {
      case "critical":
        return 0; // Manual dismiss only
      case "high":
        return 8000;
      case "medium":
        return 6000;
      case "low":
        return 4000;
      default:
        return 5000;
    }
  }

  private enforceMaxToasts() {
    const toastArray = Array.from(this.toasts.values());

    if (toastArray.length > this.settings.maxToasts) {
      // Sort by priority and timestamp, keep highest priority and newest
      const sorted = toastArray.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];

        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp - a.timestamp;
      });

      // Remove excess toasts
      const toRemove = sorted.slice(this.settings.maxToasts);
      toRemove.forEach((toast) => this.toasts.delete(toast.id));
    }
  }

  removeToast(id: string) {
    if (this.toasts.delete(id)) {
      this.notifySubscribers();
    }
  }

  clearAll() {
    this.toasts.clear();
    this.notifySubscribers();
  }

  getToasts(): Toast[] {
    return Array.from(this.toasts.values()).sort((a, b) => {
      // Sort by priority first, then by timestamp
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp - a.timestamp;
    });
  }

  subscribe(callback: (toasts: Toast[]) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getToasts()); // Initial call
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    const toasts = this.getToasts();
    this.subscribers.forEach((callback) => callback(toasts));
  }
}

// Singleton instance
export const toastManager = new ToastManager();
