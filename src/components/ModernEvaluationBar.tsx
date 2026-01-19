"use client";

import React, { useEffect, useState } from "react";
import { useChessEngine } from "@/contexts/ChessEngineContext";
import { Chess } from "chess.js";
import type { EngineAnalysis } from "@/lib/engine/interface";


interface ModernEvaluationBarProps {
  fen: string;
  className?: string;
  showThinking?: boolean;
}

export default function ModernEvaluationBar({
  fen,
  className = "",
  showThinking = true,
}: ModernEvaluationBarProps) {
  const { engineState } = useChessEngine();
  const [evaluation, setEvaluation] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<EngineAnalysis | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<any[]>([]);

  // Parse FEN to get current turn
  const getCurrentTurn = (fen: string): string => {
    try {
      const chess = new Chess(fen);
      return chess.turn();
    } catch {
      return "w";
    }
  };

  useEffect(() => {
    const updateEvaluation = async () => {
      if (!engineState.isLoaded) return;

      try {
        // Use engine state analysis if available
        if (engineState.lastAnalysis) {
          setAnalysis(engineState.lastAnalysis);
          setEvaluation(engineState.lastAnalysis.evaluation);
        } else {
          setEvaluation(0);
        }
      } catch (error) {
        console.error("Failed to evaluate position:", error);
        setEvaluation(0);
      }
    };

    // Debounce evaluation updates to prevent rapid re-renders
    const timeoutId = setTimeout(updateEvaluation, 100);
    return () => clearTimeout(timeoutId);
  }, [fen, engineState.isLoaded, engineState.lastAnalysis, showThinking]);

  // Convert centipawns to a percentage for display
  const getEvaluationPercentage = (evaluation: number): number => {
    // Clamp evaluation to reasonable bounds (-1000 to 1000 centipawns)
    const clampedEval = Math.max(-1000, Math.min(1000, evaluation));
    // Convert to percentage (0-100)
    return 50 + (clampedEval / 1000) * 50;
  };

  const getEvaluationText = (evaluation: number): string => {
    if (Math.abs(evaluation) < 10) return "0.00";
    const pawns = evaluation / 100;
    return (pawns > 0 ? "+" : "") + pawns.toFixed(2);
  };

  const getAdvantageText = (
    evaluation: number,
    currentTurn: string,
  ): string => {
    if (Math.abs(evaluation) < 50) return "Equal";

    if (evaluation > 0) {
      return currentTurn === "w" ? "White ahead" : "Black ahead";
    } else {
      return currentTurn === "b" ? "Black ahead" : "White ahead";
    }
  };

  const currentTurn = getCurrentTurn(fen);
  const percentage = getEvaluationPercentage(evaluation);
  const evalText = getEvaluationText(evaluation);
  const advantageText = getAdvantageText(evaluation, currentTurn);

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Turn indicator - smaller */}
      <div className="text-center">
        <div className="text-xs font-medium text-gray-300 mb-1">
          {currentTurn === "w" ? "White" : "Black"}
        </div>
        <div className="w-2 h-2 rounded-full bg-white shadow-sm"></div>
      </div>

      {/* Main evaluation bar - Chess.com style */}
      <div className="relative w-6 h-40 bg-gray-800 rounded-lg overflow-hidden border border-gray-600 shadow-lg">
        {/* Black advantage (top) */}
        <div
          className="absolute top-0 left-0 right-0 bg-gradient-to-b from-red-500 to-red-600 transition-all duration-300 ease-out"
          style={{
            height: `${100 - percentage}%`,
            opacity: evaluation < 0 ? 1 : 0.3,
          }}
        />

        {/* White advantage (bottom) */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-600 transition-all duration-300 ease-out"
          style={{
            height: `${percentage}%`,
            opacity: evaluation > 0 ? 1 : 0.3,
          }}
        />

        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400 transform -translate-y-1/2" />

        {/* Evaluation indicator - smaller */}
        <div
          className="absolute left-0 right-0 w-3 h-3 bg-yellow-400 rounded-full border border-gray-800 shadow-sm transform -translate-x-1/2 transition-all duration-300 ease-out"
          style={{
            top: `${100 - percentage}%`,
            transform: `translate(-50%, -50%)`,
          }}
        />

        {/* Depth marker - smaller */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-300 font-mono">
          {analysis?.depth || 0}
        </div>
      </div>

      {/* Evaluation details - compact */}
      <div className="text-center space-y-1">
        <div className="text-sm font-mono font-bold text-white bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">
          {evalText}
        </div>
        <div className="text-[10px] text-gray-300 font-medium">
          {advantageText}
        </div>
      </div>

      {/* Thinking process - only show if needed */}
      {showThinking && analysis && (
        <div className="w-full max-w-16">
          <div className="text-[10px] text-gray-400 text-center mb-1">
            Analysis
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] text-gray-300">D:{analysis.depth}</div>
            {analysis.bestMove && (
              <div className="text-[10px] text-green-300 font-mono">
                {analysis.bestMove.san}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
