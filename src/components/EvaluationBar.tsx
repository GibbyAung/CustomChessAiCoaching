"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useChessEngine } from "@/contexts/ChessEngineContext";

interface EvaluationBarProps {
  fen: string;
  className?: string;
  isAIOpponentMode?: boolean;
}

export default function EvaluationBar({
  fen,
  className = "",
  isAIOpponentMode = false,
}: EvaluationBarProps) {
  const { engineState, analyzePosition } = useChessEngine();
  const [evaluation, setEvaluation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFen, setLastFen] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Use engine state from context
  const engineReady =
    !engineState.isInitializing && engineState.lastAnalysis !== null;

  // Evaluate position using shared engine
  const evaluatePosition = useCallback(
    async (fen: string) => {
      if (!engineReady || !fen || fen === lastFen || isEvaluating) return;

      setIsEvaluating(true);
      setIsLoading(true);
      setLastFen(fen);

      try {
        // Use shared engine's analyzePosition
        const result = await analyzePosition(fen, {
          maxDepth: 8,
          maxTimeMs: 1500,
        });

        // Use the real evaluation from Stockfish
        setEvaluation(result.evaluation);
      } catch (error) {
        console.error("EvaluationBar: Failed to evaluate position:", error);
        // Don't reset evaluation to 0, keep the last known value
      } finally {
        setIsLoading(false);
        setIsEvaluating(false);
      }
    },
    [engineReady, lastFen, isEvaluating, analyzePosition]
  );

  // Evaluate when FEN changes (only in coaching mode, not AI opponent mode)
  useEffect(() => {
    if (fen && engineReady && !isAIOpponentMode) {
      // Add debouncing to prevent constant re-evaluation
      const timeoutId = setTimeout(() => {
        // Only evaluate if FEN actually changed
        if (fen !== lastFen) {
          evaluatePosition(fen);
        }
      }, 1000); // Reduced from 2000ms to 1000ms for faster response

      return () => clearTimeout(timeoutId);
    }
  }, [fen, engineReady, evaluatePosition, lastFen, isAIOpponentMode]);

  // Convert centipawns to a percentage for display
  const evalPercentage = Math.min(Math.abs(evaluation) / 100, 1);
  const evalColor =
    evaluation > 0
      ? "bg-green-600"
      : evaluation < 0
      ? "bg-red-600"
      : "bg-gray-500";

  // Format evaluation for display
  const formatEvaluation = (evaluation: number): string => {
    if (Math.abs(evaluation) >= 1000) {
      // Show mate scores
      const mateIn = Math.ceil((10000 - Math.abs(evaluation)) / 100);
      return evaluation > 0 ? `M${mateIn}` : `M-${mateIn}`;
    } else {
      // Show centipawn scores
      return evaluation > 0
        ? `+${(evaluation / 100).toFixed(1)}`
        : `${(evaluation / 100).toFixed(1)}`;
    }
  };

  // Get evaluation text
  const getEvaluationText = (): string => {
    if (!engineReady) return "Engine Loading...";
    if (isLoading || isEvaluating) return "Analyzing...";
    if (!engineState.lastAnalysis) return "No analysis available";
    const { evaluation, depth, bestMove } = engineState.lastAnalysis;
    return `Eval: ${formatEvaluation(evaluation)} | Depth: ${depth} | Best: ${
      bestMove || "N/A"
    }`;
  };

  return (
    <div className={`evaluation-bar ${className}`}>
      {/* Evaluation Bar */}
      <div className="relative w-full h-8 bg-gray-800 rounded-lg overflow-hidden">
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse" />
        )}

        {/* Evaluation bar */}
        <div
          className={`absolute top-0 h-full transition-all duration-500 ${evalColor}`}
          style={{
            width: `${evalPercentage * 100}%`,
            left: evaluation < 0 ? `${100 - evalPercentage * 100}%` : "0%",
          }}
        />

        {/* Center line */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white opacity-50 transform -translate-x-0.5" />

        {/* Evaluation text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-xs font-semibold drop-shadow-lg">
            {formatEvaluation(evaluation)}
          </span>
        </div>
      </div>

      {/* Evaluation details */}
      <div className="mt-2 text-xs text-gray-400 text-center">
        {getEvaluationText()}
      </div>

      {/* Position strength indicator */}
      <div className="mt-1 flex justify-center">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`w-2 h-2 rounded-full ${
                Math.abs(evaluation) > level * 200
                  ? evaluation > 0
                    ? "bg-green-400"
                    : "bg-red-400"
                  : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
