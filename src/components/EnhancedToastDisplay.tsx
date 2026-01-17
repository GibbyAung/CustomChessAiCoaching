// src/components/EnhancedToastDisplay.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  ChevronUp,
  Brain,
  BookOpen,
  Target,
  Lightbulb,
} from "lucide-react";
import { toastManager, Toast } from "@/lib/toast-manager";
import { LLMCoachingResponse } from "@/lib/llm-coaching";

interface EnhancedToast extends Toast {
  llmData?: LLMCoachingResponse;
}

export function EnhancedToastDisplay() {
  const [toasts, setToasts] = useState<EnhancedToast[]>([]);
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
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
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
              relative backdrop-blur-xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 
              border rounded-xl shadow-2xl overflow-hidden
              ${getPriorityStyles(toast.priority).border}
              hover:shadow-3xl transition-all duration-300
              group
            `}
          >
            {/* Priority indicator with gradient */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b ${
                getPriorityStyles(toast.priority).gradient
              }`}
            />

            {/* Main content */}
            <div className="p-4 ml-3">
              {/* Header with icon */}
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    getPriorityStyles(toast.priority).bg
                  }`}
                >
                  {getToastIcon(toast.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-semibold text-sm mb-1 ${
                      getPriorityStyles(toast.priority).text
                    }`}
                  >
                    {toast.title}
                  </h4>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {toast.message}
                  </p>

                  {/* Timestamp */}
                  <span className="text-xs text-white/40 mt-2 block">
                    {new Date(toast.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Close button */}
                <button
                  onClick={() => toastManager.removeToast(toast.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* LLM Enhanced Content */}
              {toast.llmData && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => toggleExpand(toast.id)}
                    className="flex items-center gap-2 text-xs text-white/60 hover:text-white/80 transition-colors"
                  >
                    <Brain className="w-3 h-3" />
                    <span>AI Coach Analysis</span>
                    {expandedToasts.has(toast.id) ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedToasts.has(toast.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-3">
                          {/* Detailed Explanation */}
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-white/80 leading-relaxed">
                              {toast.llmData.detailedExplanation}
                            </p>
                          </div>

                          {/* Alternative Moves */}
                          {toast.llmData.alternativeMoves.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-white/60">
                                <Target className="w-3 h-3" />
                                <span>Alternative Moves</span>
                              </div>
                              {toast.llmData.alternativeMoves.map(
                                (alt, idx) => (
                                  <div
                                    key={idx}
                                    className={`bg-white/5 rounded-lg p-2 border-l-2 ${
                                      alt.priority === "primary"
                                        ? "border-blue-400"
                                        : "border-gray-400"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-blue-300">
                                        {alt.move}
                                      </span>
                                      <span className="text-xs text-white/60">
                                        {alt.explanation}
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          {/* Learning Points */}
                          {toast.llmData.learningPoints.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-white/60">
                                <Lightbulb className="w-3 h-3" />
                                <span>Learning Points</span>
                              </div>
                              <div className="space-y-1">
                                {toast.llmData.learningPoints.map(
                                  (point, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="text-blue-400 text-xs">
                                        •
                                      </span>
                                      <span className="text-xs text-white/70">
                                        {point}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Next Steps */}
                          {toast.llmData.nextSteps.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-white/60">
                                <BookOpen className="w-3 h-3" />
                                <span>Practice Focus</span>
                              </div>
                              <div className="space-y-1">
                                {toast.llmData.nextSteps.map((step, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2"
                                  >
                                    <span className="text-green-400 text-xs">
                                      →
                                    </span>
                                    <span className="text-xs text-white/70">
                                      {step}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Priority badge */}
            {toast.priority === "critical" && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-300 font-medium backdrop-blur-sm">
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
          className="w-full py-2.5 backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 text-sm transition-all hover:text-white/80"
        >
          Clear All ({toasts.length})
        </motion.button>
      )}
    </div>
  );
}

function getToastIcon(type: string) {
  const iconClass = "w-4 h-4";
  switch (type) {
    case "tactical":
      return <Target className={iconClass} />;
    case "positional":
      return <Brain className={iconClass} />;
    case "strategic":
      return <Lightbulb className={iconClass} />;
    case "learning":
      return <BookOpen className={iconClass} />;
    case "error":
      return <X className={iconClass} />;
    case "success":
      return <Target className={iconClass} />;
    default:
      return <Brain className={iconClass} />;
  }
}

function getPriorityStyles(priority: Toast["priority"]) {
  switch (priority) {
    case "critical":
      return {
        border: "border-red-500/40",
        gradient: "from-red-500 to-red-600",
        bg: "bg-red-500/20",
        text: "text-red-300",
      };
    case "high":
      return {
        border: "border-orange-500/30",
        gradient: "from-orange-500 to-orange-600",
        bg: "bg-orange-500/20",
        text: "text-orange-300",
      };
    case "medium":
      return {
        border: "border-blue-500/30",
        gradient: "from-blue-500 to-blue-600",
        bg: "bg-blue-500/20",
        text: "text-blue-300",
      };
    case "low":
      return {
        border: "border-green-500/30",
        gradient: "from-green-500 to-green-600",
        bg: "bg-green-500/20",
        text: "text-green-300",
      };
  }
}
