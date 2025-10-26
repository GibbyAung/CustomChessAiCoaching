"use client";

import React, { useState } from "react";
import { GameMode, GAME_MODES, GameSession } from "@/types/game-modes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { gameSessionManager } from "@/lib/game-session-manager";
import { GameOperations } from "@/lib/game-operations";
import ColorSelectionModal from "./ColorSelectionModal";
import { PlayerColor, AIConfig } from "@/types/game-modes";

interface GameModeSelectorProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  className?: string;
}

export default function GameModeSelector({
  selectedMode,
  onModeChange,
  className = "",
}: GameModeSelectorProps) {
  const [showColorModal, setShowColorModal] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(
    null
  );

  // Subscribe to session changes
  React.useEffect(() => {
    const unsubscribe = gameSessionManager.subscribe(setCurrentSession);
    return unsubscribe;
  }, []);

  const handleModeSelect = (mode: GameMode) => {
    const modeConfig = GAME_MODES[mode];

    // If mode requires setup (like AI opponent), show setup modal
    if (modeConfig.requiresSetup) {
      setPendingMode(mode);
      setShowColorModal(true);
    } else {
      // If mode doesn't require setup, change immediately
      onModeChange(mode);
    }
  };

  const handleColorModalConfirm = async (
    userColor: PlayerColor,
    aiConfig: AIConfig
  ) => {
    if (pendingMode) {
      try {
        // Use our centralized game operations
        const result = await GameOperations.startGameSession(
          pendingMode,
          userColor,
          aiConfig,
          onModeChange
        );

        if (result.success) {
          // Close modal and reset state
          setShowColorModal(false);
          setPendingMode(null);
        } else {
          console.error("Failed to start game session:", result.error);
        }
      } catch (error) {
        console.error("Error starting game session:", error);
      }
    }
  };

  const handleColorModalClose = () => {
    setShowColorModal(false);
    setPendingMode(null);
  };

  // Handle difficulty change from LiveCoaching
  const handleDifficultyChange = (difficulty: "easy" | "medium" | "hard") => {
    if (currentSession && currentSession.mode === "ai_opponent") {
      // Update the AI configuration in the current session
      const updatedConfig = {
        ...currentSession.aiConfig,
        difficulty,
      };

      // Update the session with new difficulty
      gameSessionManager.updateAIConfig(updatedConfig);
    }
  };

  const canChangeMode = gameSessionManager.canChangeMode();
  const hasActiveSession = gameSessionManager.getCurrentSession() !== null;

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        <div className="text-center">
          <h3 className="text-base font-semibold text-white mb-1">Game Mode</h3>
          <p className="text-xs text-gray-300">Choose how you want to play</p>

          {/* Current Session Status */}
          {currentSession && (
            <div className="mt-2 p-2 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <div className="text-xs text-blue-300">
                <div>Current Game: {GAME_MODES[currentSession.mode].name}</div>
                <div>
                  You're playing as:{" "}
                  <span className="font-semibold">
                    {currentSession.userColor}
                  </span>
                </div>
                <div>
                  Status:{" "}
                  <span className="font-semibold capitalize">
                    {currentSession.status}
                  </span>
                </div>
                {currentSession.status === "playing" && (
                  <div>Moves: {currentSession.moveCount}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {Object.values(GAME_MODES).map((mode) => {
            const isSelected = selectedMode === mode.id;
            // Allow mode changes if no active session or if mode changes are allowed
            const isDisabled =
              hasActiveSession && !canChangeMode && !isSelected;
            const requiresSetup = mode.requiresSetup;

            return (
              <Card
                key={mode.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105"
                } ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500/30"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
                onClick={() => !isDisabled && handleModeSelect(mode.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">{mode.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white text-sm">
                          {mode.name}
                        </h4>
                        {requiresSetup && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-yellow-600 text-white"
                          >
                            Setup Required
                          </Badge>
                        )}
                        {isDisabled && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-red-600 text-white"
                          >
                            Game Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-300">
                        {mode.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mode.features.map((feature, index) => (
                          <span
                            key={index}
                            className="text-xs px-1.5 py-0.5 bg-white/10 rounded-full text-gray-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Game Control Buttons */}
        {currentSession && currentSession.status === "playing" && (
          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              onClick={() => GameOperations.pauseGame()}
              className="w-full bg-gray-800 border-gray-600 hover:bg-gray-700"
            >
              Pause Game
            </Button>
          </div>
        )}

        {currentSession && currentSession.status === "paused" && (
          <div className="space-y-2 pt-2">
            <Button
              onClick={() => GameOperations.resumeGame()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Resume Game
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                GameOperations.abandonGame(
                  () => {},
                  () => {}
                )
              }
              className="w-full bg-red-800 border-red-600 hover:bg-red-700"
            >
              Abandon Game
            </Button>
          </div>
        )}

        {currentSession &&
          (currentSession.status === "completed" ||
            currentSession.status === "abandoned") && (
            <div className="space-y-2 pt-2">
              <Button
                onClick={() => gameSessionManager.resetSession()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                New Game
              </Button>
            </div>
          )}

        {/* Show New Game button when no active session */}
        {!currentSession && (
          <div className="space-y-2 pt-2">
            <div className="text-center text-sm text-gray-400 mb-2">
              Select a game mode to start playing
            </div>
          </div>
        )}
      </div>

      {/* Color Selection Modal */}
      <ColorSelectionModal
        isOpen={showColorModal}
        onClose={handleColorModalClose}
        onConfirm={handleColorModalConfirm}
      />
    </>
  );
}
