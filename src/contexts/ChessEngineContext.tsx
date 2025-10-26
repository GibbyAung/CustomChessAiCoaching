/**
 * Chess Engine Context
 * Integrates Stockfish WASM engine with fallback to Advanced JS AI
 */

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { ChessGame, GameState } from "@/lib/chess";
import type {
  ChessEngine,
  EngineAnalysis,
  EngineConfig,
} from "@/lib/engine/interface";

// Engine state interface
interface EngineState {
  isLoaded: boolean;
  isAnalyzing: boolean;
  isInitializing: boolean;
  lastAnalysis: EngineAnalysis | null;
  error: string | null;
  config: EngineConfig;
  engineType: "stockfish" | "fallback" | null;
}

// Engine actions
type EngineAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ANALYZING"; payload: boolean }
  | { type: "SET_INITIALIZING"; payload: boolean }
  | { type: "SET_ANALYSIS"; payload: EngineAnalysis }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_CONFIG"; payload: Partial<EngineConfig> }
  | { type: "SET_ENGINE_TYPE"; payload: "stockfish" | "fallback" | null }
  | { type: "RESET" };

// Context type
interface ChessEngineContextType {
  engineState: EngineState;
  initializeEngine: () => Promise<void>;
  analyzePosition: (
    fen: string,
    config?: Partial<EngineConfig>
  ) => Promise<EngineAnalysis>;
  getBestMove: (fen: string, depth?: number) => Promise<string | null>;
  evaluatePosition: (fen: string) => Promise<number>;
  updateEngineConfig: (config: Partial<EngineConfig>) => void;
  resetEngine: () => void;
  isEngineReady: boolean;
  getAnalysisDisplay: () => string;
  getEngineStatus: () => {
    type: string;
    loaded: boolean;
    analyzing: boolean;
    error: string | null;
  };
  getEngineType: () => string;
}

// Initial state
const initialEngineState: EngineState = {
  isLoaded: false,
  isAnalyzing: false,
  isInitializing: false,
  lastAnalysis: null,
  error: null,
  engineType: null,
  config: {
    maxDepth: 12,
    maxTimeMs: 2000,
    skillLevel: 20,
  } as EngineConfig,
};

// Engine reducer
function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoaded: action.payload };
    case "SET_ANALYZING":
      return { ...state, isAnalyzing: action.payload };
    case "SET_INITIALIZING":
      return { ...state, isInitializing: action.payload };
    case "SET_ANALYSIS":
      return {
        ...state,
        lastAnalysis: action.payload,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_ENGINE_TYPE":
      return { ...state, engineType: action.payload };
    case "UPDATE_CONFIG":
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };
    case "RESET":
      return initialEngineState;
    default:
      return state;
  }
}

// Create context
const ChessEngineContext = createContext<ChessEngineContextType | undefined>(
  undefined
);

// Provider component
export const ChessEngineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [engineState, dispatch] = useReducer(engineReducer, initialEngineState);
  const [primaryEngine, setPrimaryEngine] = React.useState<any>(null);
  const [fallbackEngine, setFallbackEngine] = React.useState<any>(null);
  const engineRef = React.useRef<any>(null);

  // Load Stockfish engine
  const loadStockfishEngine = useCallback(async () => {
    console.log("🔧 Context: Loading Stockfish engine...");
    if (typeof window === "undefined") {
      console.log("🔧 Context: SSR detected, skipping Stockfish load");
      return null;
    }

    try {
      const { stockfishEngine } = await import("@/lib/stockfish-engine");
      console.log("🔧 Context: Stockfish import successful");
      return stockfishEngine;
    } catch (error) {
      console.error("🔧 Context: Failed to load Stockfish:", error);
      return null;
    }
  }, []);

  // Load fallback engine
  const loadFallbackEngine = useCallback(async () => {
    console.log("🔧 Context: Loading fallback Unified Engine...");
    if (typeof window === "undefined") {
      console.log("🔧 Context: SSR detected, skipping fallback load");
      return null;
    }

    try {
      const { UnifiedEngine } = await import("@/lib/engine/unified-engine");
      console.log("🔧 Context: Unified Engine import successful");
      return new UnifiedEngine();
    } catch (error) {
      console.error("🔧 Context: Failed to load Unified Engine:", error);
      return null;
    }
  }, []);

  // Load simple fallback engine
  const loadSimpleFallbackEngine = useCallback(async () => {
    console.log("🔧 Context: Loading simple fallback engine...");
    if (typeof window === "undefined") {
      console.log("🔧 Context: SSR detected, skipping simple fallback load");
      return null;
    }

    try {
      const { UnifiedEngine } = await import("@/lib/engine/unified-engine");
      console.log("🔧 Context: Simple fallback engine import successful");
      return new UnifiedEngine();
    } catch (error) {
      console.error(
        "🔧 Context: Failed to load simple fallback engine:",
        error
      );
      return null;
    }
  }, []);

  // Initialize engine with fallback
  const initializeEngine = useCallback(async () => {
    console.log("🔧 Context: Starting engine initialization...");
    try {
      dispatch({ type: "SET_INITIALIZING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      // Try Stockfish first
      console.log("🔧 Context: Attempting to initialize Stockfish...");
      const stockfish = await loadStockfishEngine();
      if (stockfish) {
        try {
          await stockfish.initialize();
          stockfish.setOptions(engineState.config as any);
          setPrimaryEngine(stockfish);
          engineRef.current = stockfish;
          dispatch({ type: "SET_ENGINE_TYPE", payload: "stockfish" });
          dispatch({ type: "SET_LOADING", payload: true });
          console.log("🔧 Context: Stockfish initialized successfully");
          return;
        } catch (error) {
          console.error("🔧 Context: Stockfish initialization failed:", error);
          // Continue to fallback
        }
      }

      // Fallback to Advanced JS AI
      console.log("🔧 Context: Falling back to Advanced JS AI...");
      const fallback = await loadFallbackEngine();
      if (fallback) {
        try {
          await fallback.initialize();
          fallback.setOptions(engineState.config as any);
          setFallbackEngine(fallback);
          engineRef.current = fallback;
          dispatch({ type: "SET_ENGINE_TYPE", payload: "fallback" });
          dispatch({ type: "SET_LOADING", payload: true });
          console.log("🔧 Context: Advanced JS AI initialized successfully");
          return;
        } catch (error) {
          console.error(
            "🔧 Context: Advanced JS AI initialization failed:",
            error
          );
          // Continue to simple fallback
        }
      }

      // Final fallback to Simple Engine
      console.log("🔧 Context: Falling back to Simple Engine...");
      const simpleFallback = await loadSimpleFallbackEngine();
      if (!simpleFallback) {
        throw new Error("All engines failed to load");
      }

      await simpleFallback.initialize();
      simpleFallback.setOptions(engineState.config as any);
      setFallbackEngine(simpleFallback);
      engineRef.current = simpleFallback;
      dispatch({ type: "SET_ENGINE_TYPE", payload: "fallback" });
      dispatch({ type: "SET_LOADING", payload: true });
      console.log(
        "🔧 Context: Simple fallback engine initialized successfully"
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("🔧 Context: All engine initialization failed:", error);
      dispatch({ type: "SET_ERROR", payload: errorMessage });
    } finally {
      dispatch({ type: "SET_INITIALIZING", payload: false });
    }
  }, [
    engineState.config,
    loadStockfishEngine,
    loadFallbackEngine,
    loadSimpleFallbackEngine,
  ]);

  // Ensure initialized before use
  const ensureInitialized = useCallback(async () => {
    if (!engineState.isLoaded && !engineState.isInitializing) {
      await initializeEngine();
    }
  }, [engineState.isLoaded, engineState.isInitializing, initializeEngine]);

  // Analyze position
  const analyzePosition = useCallback(
    async (fen: string, config?: Partial<any>): Promise<any> => {
      try {
        await ensureInitialized();
        const engine = engineRef.current;
        if (!engine) {
          throw new Error("No engine available");
        }

        dispatch({ type: "SET_ANALYZING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        const analysis = await engine.analyzePosition(fen, {
          ...engineState.config,
          ...config,
        });

        dispatch({ type: "SET_ANALYSIS", payload: analysis });
        return analysis;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Analysis failed";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        throw error;
      } finally {
        dispatch({ type: "SET_ANALYZING", payload: false });
      }
    },
    [ensureInitialized, engineState.config]
  );

  // Get best move
  const getBestMove = useCallback(
    async (fen: string, depth: number = 12): Promise<string | null> => {
      try {
        await ensureInitialized();
        const engine = engineRef.current;
        if (!engine) {
          throw new Error("No engine available");
        }
        return await engine.getBestMove(
          fen,
          depth,
          engineState.config.maxTimeMs
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to get best move";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        return null;
      }
    },
    [ensureInitialized, engineState.config.maxTimeMs]
  );

  // Evaluate position
  const evaluatePosition = useCallback(
    async (fen: string): Promise<number> => {
      try {
        await ensureInitialized();
        const engine = engineRef.current;
        if (!engine) {
          throw new Error("No engine available");
        }
        return await engine.evaluatePosition(fen, 400);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to evaluate position";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        return 0;
      }
    },
    [ensureInitialized]
  );

  // Update engine config
  const updateEngineConfig = useCallback(
    (config: Partial<any>) => {
      dispatch({ type: "UPDATE_CONFIG", payload: config });
      const engine = engineRef.current;
      if (engine) {
        engine.setOptions({ ...engineState.config, ...config } as any);
      }
    },
    [engineState.config]
  );

  // Reset engine
  const resetEngine = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.destroy();
    }
    setPrimaryEngine(null);
    setFallbackEngine(null);
    engineRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  // Get analysis display string
  const getAnalysisDisplay = useCallback(() => {
    if (!engineState.lastAnalysis) return "No analysis available";
    const { evaluation, depth, bestMove } = engineState.lastAnalysis;
    const evalStr =
      evaluation > 0
        ? `+${(evaluation / 100).toFixed(2)}`
        : `${(evaluation / 100).toFixed(2)}`;
    const moveStr = bestMove ? `${bestMove.from}${bestMove.to}` : "No move";
    return `Depth ${depth}: ${evalStr} (${moveStr})`;
  }, [engineState.lastAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      if (engine) {
        engine.destroy();
      }
    };
  }, []);

  const contextValue: ChessEngineContextType = {
    engineState,
    initializeEngine,
    analyzePosition,
    getBestMove,
    evaluatePosition,
    updateEngineConfig,
    resetEngine,
    isEngineReady: engineState.isLoaded && !engineState.isAnalyzing,
    getAnalysisDisplay,
    getEngineStatus: () => ({
      type:
        engineState.engineType === "stockfish"
          ? "Stockfish"
          : "Advanced JS AI (Fallback)",
      loaded: engineState.isLoaded,
      analyzing: engineState.isAnalyzing,
      error: engineState.error,
    }),
    getEngineType: () =>
      engineState.engineType === "stockfish"
        ? "Stockfish"
        : "Advanced JS AI (Fallback)",
  };

  return (
    <ChessEngineContext.Provider value={contextValue}>
      {children}
    </ChessEngineContext.Provider>
  );
};

// Hook to use the engine context
export const useChessEngine = (): ChessEngineContextType => {
  const context = useContext(ChessEngineContext);
  if (context === undefined) {
    throw new Error("useChessEngine must be used within a ChessEngineProvider");
  }
  return context;
};
