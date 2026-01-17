"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { stockfishCoaching } from "@/lib/stockfish-coaching";
import { SmartToastDisplay } from "@/components/SmartToastDisplay";
import { CoachingSettingsPanel } from "@/components/CoachingSettings";

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
    isHumanMove?: boolean,
  ) => void;
}

const CoachingContext = createContext<CoachingContextType | undefined>(
  undefined,
);

export function CoachingProvider({ children }: { children: React.ReactNode }) {
  // LLM-powered coaching system - replacing AdvancedCoachingToaster - v2.0
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

  // Trigger LLM-powered analysis when position updates
  useEffect(() => {
    console.log("🔍 CoachingContext: Position update detected", {
      isEnabled,
      currentFen,
      lastMove,
      isLastMoveHuman,
      mode,
      fenType: typeof currentFen,
      lastMoveType: typeof lastMove,
      lastMoveValue: lastMove ? `"${lastMove}"` : "null/undefined",
      lastMoveTrimmed: lastMove ? lastMove.trim() : "null",
      lastMoveLength: lastMove ? lastMove.length : 0,
    });

    // Allow coaching if we have FEN and it's enabled - lastMove is optional
    if (
      isEnabled &&
      currentFen &&
      currentFen !== "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    ) {
      console.log("� CoachingContext: Triggering LLM analysis");
      // Trigger LLM-powered coaching analysis - use empty string if lastMove is undefined
      const moveForAnalysis = lastMove || "";
      stockfishCoaching
        .analyzeAndShowFeedback(currentFen, moveForAnalysis)
        .then(() => console.log("✅ CoachingContext: LLM analysis completed"))
        .catch((error) =>
          console.error("❌ CoachingContext: LLM analysis failed:", error),
        );
    } else {
      console.log("🔍 CoachingContext: Analysis conditions not met", {
        hasFen: !!currentFen,
        isInitialPosition:
          currentFen ===
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        hasLastMove: !!lastMove,
        lastMoveTrimmed: lastMove ? lastMove.trim() : "null",
        lastMoveLength: lastMove ? lastMove.length : 0,
        isEnabled,
      });
    }
  }, [currentFen, lastMove, isEnabled]);

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
    [],
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
      {/* LLM-powered coaching display */}
      <SmartToastDisplay />

      {/* Coaching settings panel - positioned to be visible and accessible */}
      <div className="fixed top-4 right-4 z-50">
        <CoachingSettingsPanel />
      </div>
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
