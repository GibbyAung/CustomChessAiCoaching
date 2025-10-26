"use client";

import React, { useEffect, useState } from "react";
import { useChess } from "@/contexts/ChessContext";
import { stockfishCoaching } from "@/lib/stockfish-coaching";
import { GameMode } from "@/types/game-modes";

interface ModernAIOpponentProps {
  isEnabled: boolean;
  gameMode: GameMode;
  difficulty: "easy" | "medium" | "hard";
  autoPlay: boolean;
}

export function ModernAIOpponent({
  isEnabled,
  gameMode,
  difficulty,
  autoPlay,
}: ModernAIOpponentProps) {
  const { gameState, makeMove } = useChess();
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<string | null>(null);

  // Get difficulty settings
  const getDifficultySettings = () => {
    switch (difficulty) {
      case "easy":
        return { maxDepth: 8, maxTimeMs: 500 };
      case "medium":
        return { maxDepth: 12, maxTimeMs: 1000 };
      case "hard":
        return { maxDepth: 16, maxTimeMs: 2000 };
      default:
        return { maxDepth: 12, maxTimeMs: 1000 };
    }
  };

  // Check if it's AI's turn
  const isAITurn = () => {
    return gameState.turn === "b" && !gameState.isGameOver;
  };

  // Make AI move
  const makeAIMove = async () => {
    if (!isEnabled || !isAITurn() || isThinking) return;

    setIsThinking(true);
    try {
      const settings = getDifficultySettings();
      const analysis = await stockfishCoaching.analyzePosition(
        gameState.fen,
        settings
      );

      if (analysis.bestMove) {
        // Add a small delay to make the AI feel more natural
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Parse Stockfish move (e.g., "e2e4") into from and to squares
        const from = analysis.bestMove.slice(0, 2) as any;
        const to = analysis.bestMove.slice(2, 4) as any;

        const success = makeMove(from, to);
        if (success) {
          setLastMove(analysis.bestMove);
        }
      }
    } catch (error) {
      console.error("AI move failed:", error);
    } finally {
      setIsThinking(false);
    }
  };

  // Auto-play effect
  useEffect(() => {
    if (isEnabled && autoPlay && isAITurn() && !isThinking) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState.fen, isEnabled, autoPlay, isAITurn(), isThinking]);

  // Manual AI move for non-auto-play modes
  useEffect(() => {
    if (isEnabled && !autoPlay && isAITurn() && !isThinking) {
      // In coaching mode, don't auto-move - let the user decide
      if (gameMode === "ai_coaching") return;

      // In other modes, prompt for AI move
      if (gameMode === "ai_opponent") {
        makeAIMove();
      }
    }
  }, [gameState.fen, isEnabled, autoPlay, gameMode, isAITurn(), isThinking]);

  // Show AI status
  if (!isEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isThinking && (
        <div className="bg-blue-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">AI thinking...</span>
        </div>
      )}

      {lastMove && !isThinking && (
        <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg">
          <span className="text-sm font-medium">AI played: {lastMove}</span>
        </div>
      )}
    </div>
  );
}
