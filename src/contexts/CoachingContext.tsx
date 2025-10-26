"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { AdvancedCoachingToaster } from "@/components/AdvancedCoachingToaster";
import { stockfishCoaching } from "@/lib/stockfish-coaching";

interface CoachingContextType {
  isEnabled: boolean;
  mode: "coaching" | "ai_opponent";
  currentFen: string;
  lastMove?: string;
  isLastMoveHuman: boolean; // New: track if last move was made by human
  enableCoaching: () => void;
  disableCoaching: () => void;
  setMode: (mode: "coaching" | "ai_opponent") => void;
  updatePosition: (
    fen: string,
    lastMove?: string,
    isHumanMove?: boolean
  ) => void;
}

const CoachingContext = createContext<CoachingContextType | undefined>(
  undefined
);

export function CoachingProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [mode, setMode] = useState<"coaching" | "ai_opponent">("coaching");
  const [currentFen, setCurrentFen] = useState("");
  const [lastMove, setLastMove] = useState<string | undefined>();
  const [isLastMoveHuman, setIsLastMoveHuman] = useState(true);

  // Initialize Stockfish coaching when enabled
  useEffect(() => {
    if (isEnabled) {
      stockfishCoaching.initialize().catch(console.error);
    }
  }, [isEnabled]);

  const enableCoaching = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disableCoaching = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const updatePosition = useCallback(
    (fen: string, lastMove?: string, isHumanMove: boolean = true) => {
      setCurrentFen(fen);
      setLastMove(lastMove);
      setIsLastMoveHuman(isHumanMove);
    },
    []
  );

  const value: CoachingContextType = {
    isEnabled,
    mode,
    currentFen,
    lastMove,
    isLastMoveHuman,
    enableCoaching,
    disableCoaching,
    setMode,
    updatePosition,
  };

  return (
    <CoachingContext.Provider value={value}>
      {children}
      <AdvancedCoachingToaster
        fen={currentFen}
        lastMove={lastMove}
        isEnabled={isEnabled}
        isHumanMove={isLastMoveHuman}
        gameMode={mode}
      />
    </CoachingContext.Provider>
  );
}

export function useCoaching() {
  const context = useContext(CoachingContext);
  if (context === undefined) {
    throw new Error("useCoaching must be used within a CoachingProvider");
  }
  return context;
}
