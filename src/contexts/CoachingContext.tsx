"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { coachingManager } from "../lib/coaching-manager";
import { AIDifficulty } from "@/types/game-modes";
import { useToast } from "./ToastContext";

interface CoachingContextType {
  isEnabled: boolean;
  mode: "coaching" | "ai_opponent";
  currentFen: string;
  lastMove?: string;
  isLastMoveHuman: boolean;
  difficulty: AIDifficulty;
  enableCoaching: () => void;
  disableCoaching: () => void;
  setMode: (mode: "coaching" | "ai_opponent") => void;
  setDifficulty: (difficulty: AIDifficulty) => void;
  updatePosition: (fen: string, lastMove?: string, isHuman?: boolean) => void;
}

const CoachingContext = createContext<CoachingContextType | undefined>(
  undefined,
);

export function CoachingProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [mode, setMode] = useState<"coaching" | "ai_opponent">("coaching");
  const [difficulty, setDifficultyState] = useState<AIDifficulty>("medium");
  const [currentFen, setCurrentFen] = useState("");
  const [lastMove, setLastMove] = useState<string | undefined>(undefined);
  const [isLastMoveHuman, setIsLastMoveHuman] = useState(true);
  const { success, error, warning, info } = useToast();

  // ✅ Debounce refs
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedFenRef = useRef<string>("");

  const enableCoaching = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disableCoaching = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const setDifficulty = useCallback((nextDifficulty: AIDifficulty) => {
    setDifficultyState(nextDifficulty);
    coachingManager.setDifficulty(nextDifficulty);
  }, []);

  const updatePosition = useCallback(
    async (fen: string, lastMove?: string, isHuman: boolean = true) => {
      console.log("🔍 [CoachingContext] updatePosition called:", {
        fen,
        lastMove,
        isHuman,
        isEnabled,
        mode,
      });
      setCurrentFen(fen);
      setLastMove(lastMove);
      setIsLastMoveHuman(isHuman);

      // ✅ QUICK FIX: Skip coaching entirely during AI opponent mode to prevent conflicts
      if (mode === "ai_opponent" && !isHuman) {
        console.log(
          "🚫 [CoachingContext] Skipping coaching - AI move detected",
        );
        return;
      }

      // ✅ NEW: Prepare position for coaching when it's human's turn
      if (isEnabled && isHuman && mode === "coaching") {
        try {
          // Always prepare the current position for future analysis
          await coachingManager.prepareForMove(fen);
          console.log("🎯 [CoachingContext] Prepared position for coaching");

          // If this is a move (not just position update), analyze it immediately
          if (lastMove) {
            console.log("🔍 [CoachingContext] Analyzing human move:", lastMove);
            await coachingManager.analyzeMove(fen, lastMove);
          }
        } catch (error) {
          console.error(
            "❌ [CoachingContext] Coaching preparation failed:",
            error,
          );
        }
      }
    },
    [isEnabled, mode],
  );

  // ✅ Set up toast callback for coaching manager
  useEffect(() => {
    coachingManager.setToastCallback({
      success,
      error,
      warning,
      info,
      default: info,
    });
  }, [success, error, warning, info]);

  // ✅ Initialize coaching on mount
  useEffect(() => {
    console.log("🎯 [CoachingContext] Initialized with mode:", mode);

    if (isEnabled && mode === "coaching") {
      // Welcome message for human-like coaching
      setTimeout(() => {
        info(
          "👋 Hi there!",
          "I'm your chess coach! I'll give you human-like feedback on your moves. Let's improve together!",
        );
      }, 1000);
    }
  }, [mode, isEnabled, info]);

  const value: CoachingContextType = {
    isEnabled,
    mode,
    currentFen,
    lastMove,
    isLastMoveHuman,
    difficulty,
    enableCoaching,
    disableCoaching,
    setMode,
    setDifficulty,
    updatePosition,
  };

  return (
    <CoachingContext.Provider value={value}>
      {children}
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
