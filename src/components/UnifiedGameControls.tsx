"use client";

import React, { useState } from "react";
import { useChess } from "@/contexts/ChessContext";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { GameOperations } from "@/lib/game-operations";
import { gameSessionManager } from "@/lib/game-session-manager";

interface UnifiedGameControlsProps {
  className?: string;
  variant?: "compact" | "full";
  showGameInfo?: boolean;
}

export function UnifiedGameControls({
  className = "",
  variant = "full",
  showGameInfo = true,
}: UnifiedGameControlsProps) {
  const { resetGame, undoMove, flipBoard, gameState } = useChess();
  const { success, warning, info } = useToast();

  // Modal states
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get current game status
  const gameStatus = GameOperations.getGameStatus();
  const canAbandon = GameOperations.canPerformOperation("abandon");
  const canPause = GameOperations.canPerformOperation("pause");
  const canResume = GameOperations.canPerformOperation("resume");

  // Handle new game
  const handleNewGame = () => {
    setShowNewGameModal(true);
  };

  const confirmNewGame = async () => {
    setIsLoading(true);
    try {
      await GameOperations.startNewGame(resetGame, success);
      setShowNewGameModal(false);
    } catch (error) {
      console.error("Failed to start new game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle abandon game
  const handleAbandonGame = () => {
    setShowAbandonModal(true);
  };

  const confirmAbandonGame = async () => {
    setIsLoading(true);
    try {
      await GameOperations.abandonGame(resetGame, success);
      setShowAbandonModal(false);
    } catch (error) {
      console.error("Failed to abandon game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle undo move
  const handleUndo = () => {
    if (gameState.moveHistory.length > 0) {
      undoMove();
      info("Move Undone", "The last move has been undone.");
    } else {
      warning("No Moves to Undo", "There are no moves to undo.");
    }
  };

  // Handle pause/resume
  const handlePauseResume = async () => {
    if (canPause) {
      await GameOperations.pauseGame();
    } else if (canResume) {
      await GameOperations.resumeGame();
    }
  };

  // Handle flip board
  const handleFlipBoard = () => {
    flipBoard();
  };

  const isCompact = variant === "compact";

  return (
    <>
      <Card className={`bg-slate-800/80 border-slate-600/50 ${className}`}>
        <CardHeader className={isCompact ? "pb-2" : "pb-4"}>
          <CardTitle
            className={`text-white ${isCompact ? "text-sm" : "text-base"}`}
          >
            Game Controls
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-${isCompact ? "2" : "3"}`}>
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleNewGame}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2"
              disabled={isLoading}
            >
              🆕 New Game
            </Button>
            <Button
              onClick={handleUndo}
              disabled={gameState.moveHistory.length === 0}
              className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 text-xs py-2"
            >
              ↩️ Undo
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleFlipBoard}
              className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 text-xs py-2"
            >
              🔄 Flip
            </Button>
            {canAbandon && (
              <Button
                onClick={handleAbandonGame}
                className="bg-red-600 hover:bg-red-700 text-white text-xs py-2"
                disabled={isLoading}
              >
                🏳️ Abandon
              </Button>
            )}
          </div>

          {/* Game Status Actions */}
          {(canPause || canResume) && (
            <Button
              onClick={handlePauseResume}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-2"
            >
              {canPause ? "⏸️ Pause" : "▶️ Resume"}
            </Button>
          )}

          {/* Game Info - Only show in full variant */}
          {showGameInfo && !isCompact && (
            <div className="pt-3 border-t border-slate-600/50">
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Moves:</span>
                  <span className="text-white font-medium">
                    {gameState.moveHistory.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Turn:</span>
                  <span className="text-white font-medium">
                    {gameState.turn === "w" ? "White" : "Black"}
                  </span>
                </div>
                {gameState.isCheck && (
                  <div className="text-yellow-400 font-medium">⚠️ Check!</div>
                )}
                {gameState.isCheckmate && (
                  <div className="text-red-400 font-medium">🏆 Checkmate!</div>
                )}
                {gameState.isStalemate && (
                  <div className="text-orange-400 font-medium">
                    🤝 Stalemate!
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Game Confirmation Modal */}
      <ConfirmationModal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        onConfirm={confirmNewGame}
        title="Start New Game"
        description="Are you sure you want to start a new game? This will reset the current position and clear the move history."
        confirmText="Start New Game"
        variant="default"
        isLoading={isLoading}
      />

      {/* Abandon Game Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAbandonModal}
        onClose={() => setShowAbandonModal(false)}
        onConfirm={confirmAbandonGame}
        title="Abandon Game"
        description="Are you sure you want to abandon this game? The game will be reset and you can start a new one."
        confirmText="Abandon Game"
        variant="destructive"
        isLoading={isLoading}
      />
    </>
  );
}
