// src/components/SmartToastDisplay.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { toastManager, Toast } from "@/lib/toast-manager";

export function SmartToastDisplay() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedToasts, setExpandedToasts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedToasts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: index * 0.05,
            }}
            className={`
              relative backdrop-blur-xl bg-gray-900/90 border rounded-xl p-3 shadow-2xl
              ${getPriorityStyles(toast.priority).border}
              hover:bg-gray-900/95 transition-all duration-200
              group
            `}
          >
            {/* Priority indicator */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                getPriorityStyles(toast.priority).accent
              }`}
            />

            {/* Header */}
            <div className="flex items-start gap-2 ml-2">
              <div className="flex-1">
                <h4
                  className={`font-medium text-sm ${
                    getPriorityStyles(toast.priority).text
                  }`}
                >
                  {toast.title}
                </h4>
                <p className="text-white/90 text-sm mt-1">{toast.message}</p>

                {/* Timestamp */}
                <span className="text-xs text-white/40 mt-1 block">
                  {new Date(toast.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Close button */}
              <button
                onClick={() => toastManager.removeToast(toast.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Priority badge for critical */}
            {toast.priority === "critical" && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300 font-medium">
                URGENT
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Clear all button */}
      {toasts.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => toastManager.clearAll()}
          className="w-full py-2 backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 text-sm transition-all"
        >
          Clear All ({toasts.length})
        </motion.button>
      )}
    </div>
  );
}

function getPriorityStyles(priority: Toast["priority"]) {
  switch (priority) {
    case "critical":
      return {
        border: "border-red-500/40",
        accent: "bg-red-500",
        text: "text-red-300",
      };
    case "high":
      return {
        border: "border-orange-500/30",
        accent: "bg-orange-500",
        text: "text-orange-300",
      };
    case "medium":
      return {
        border: "border-blue-500/30",
        accent: "bg-blue-500",
        text: "text-blue-300",
      };
    case "low":
      return {
        border: "border-green-500/30",
        accent: "bg-green-500",
        text: "text-green-300",
      };
  }
}
