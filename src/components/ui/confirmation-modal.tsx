"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
  isLoading?: boolean;
  className?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
  className,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: "⚠️",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          border: "border-red-500/30",
        };
      case "warning":
        return {
          icon: "⚠️",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
          border: "border-yellow-500/30",
        };
      default:
        return {
          icon: "ℹ️",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
          border: "border-blue-500/30",
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200" />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border bg-white/10 backdrop-blur-md shadow-2xl transform transition-all duration-200",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4",
          variantStyles.border,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <div className="text-2xl">{variantStyles.icon}</div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={cn("flex-1", variantStyles.confirmButton)}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
