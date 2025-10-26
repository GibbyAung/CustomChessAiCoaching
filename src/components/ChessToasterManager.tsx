"use client";

import React, { useState, useCallback } from "react";
import ChessToaster from "./ChessToaster";
import { CoachingMessage } from "@/types/coaching";

interface ChessToasterManagerProps {
  isEnabled: boolean;
}

export default function ChessToasterManager({
  isEnabled,
}: ChessToasterManagerProps) {
  const [currentToaster, setCurrentToaster] = useState<CoachingMessage | null>(
    null
  );
  const [lastToasterTime, setLastToasterTime] = useState(0);

  const showToaster = useCallback(
    (message: CoachingMessage) => {
      const now = Date.now();
      const timeSinceLastToaster = now - lastToasterTime;

      // Prevent rapid-fire toasters (minimum 500ms between toasters)
      if (timeSinceLastToaster < 500) {
        console.log("Toaster cooldown active, skipping duplicate toaster");
        return;
      }

      setLastToasterTime(now);

      // Dismiss current toaster and show new one
      setCurrentToaster(null);
      setTimeout(() => {
        setCurrentToaster(message);
      }, 50); // Faster transition
    },
    [lastToasterTime]
  );

  const dismissToaster = useCallback(() => {
    setCurrentToaster(null);
  }, []);

  // Expose the showToaster function globally so other components can use it
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).showChessToaster = showToaster;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).showChessToaster;
      }
    };
  }, [showToaster]);

  if (!isEnabled) return null;

  return (
    <ChessToaster
      message={currentToaster}
      onDismiss={dismissToaster}
      autoHide={true}
      duration={3000}
    />
  );
}
