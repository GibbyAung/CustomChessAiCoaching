"use client";

import React, { useState, useEffect } from "react";
import { X, Brain, Target, AlertTriangle, Sparkles, Info } from "lucide-react";
import { CoachingMessage } from "@/types/coaching";

interface ChessToasterProps {
  message: CoachingMessage | null;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function ChessToaster({
  message,
  onDismiss,
  autoHide = true,
  duration = 8000,
}: ChessToasterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      setIsExiting(false);

      if (autoHide) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [message, autoHide, duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300); // Match animation duration
  };

  if (!message || !isVisible) return null;

  const getIcon = (type: CoachingMessage["type"]) => {
    switch (type) {
      case "blunder":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "brilliant":
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
      case "suggestion":
        return <Target className="w-5 h-5 text-blue-400" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      default:
        return <Brain className="w-5 h-5 text-purple-400" />;
    }
  };

  const getBorderColor = (type: CoachingMessage["type"]) => {
    switch (type) {
      case "blunder":
        return "border-red-400/50";
      case "brilliant":
        return "border-yellow-400/50";
      case "suggestion":
        return "border-blue-400/50";
      case "warning":
        return "border-orange-400/50";
      default:
        return "border-purple-400/50";
    }
  };

  const getBackgroundColor = (type: CoachingMessage["type"]) => {
    switch (type) {
      case "blunder":
        return "bg-red-500/10";
      case "brilliant":
        return "bg-yellow-500/10";
      case "suggestion":
        return "bg-blue-500/10";
      case "warning":
        return "bg-orange-500/10";
      default:
        return "bg-purple-500/10";
    }
  };

  return (
    <div
      className={`
        fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50
        max-w-md w-full mx-4
        transition-all duration-300 ease-out
        ${
          isExiting
            ? "translate-y-full opacity-0 scale-95"
            : "translate-y-0 opacity-100 scale-100"
        }
      `}
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        className={`
          relative rounded-2xl border-2 p-4 shadow-2xl
          ${getBorderColor(message.type)}
          ${getBackgroundColor(message.type)}
          bg-white/10
        `}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3 pr-8">
          {getIcon(message.type)}
          <div className="flex-1 min-w-0">
            <h4 className="text-white/90 font-semibold text-sm mb-1">
              {message.title}
            </h4>
            <p className="text-white/80 text-sm leading-relaxed">
              {message.message}
            </p>
            {message.evaluation !== undefined && (
              <div className="mt-2 text-xs text-white/60">
                Evaluation: {message.evaluation > 0 ? "+" : ""}
                {message.evaluation} cp
              </div>
            )}
          </div>
        </div>

        {/* Progress bar for auto-hide */}
        {autoHide && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-white/40 transition-all ease-linear"
              style={{
                width: isExiting ? "0%" : "100%",
                transitionDuration: `${duration}ms`,
              }}
            />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
