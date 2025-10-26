"use client";

import React, { useState } from "react";
import {
  PlayerColor,
  AIDifficulty,
  AIConfig,
  AI_DIFFICULTY_CONFIGS,
} from "@/types/game-modes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ColorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userColor: PlayerColor, aiConfig: AIConfig) => void;
}

export default function ColorSelectionModal({
  isOpen,
  onClose,
  onConfirm,
}: ColorSelectionModalProps) {
  const [selectedColor, setSelectedColor] = useState<PlayerColor>("white");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<AIDifficulty>("medium");

  if (!isOpen) return null;

  const handleConfirm = () => {
    const aiConfig = AI_DIFFICULTY_CONFIGS[selectedDifficulty];
    onConfirm(selectedColor, aiConfig);
  };

  const handleColorSelect = (color: PlayerColor) => {
    setSelectedColor(color);
  };

  const handleDifficultySelect = (difficulty: AIDifficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const aiConfig = AI_DIFFICULTY_CONFIGS[selectedDifficulty];
  const isBoardFlipped = selectedColor === "black";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-white text-xl">
            Setup AI Opponent
          </CardTitle>
          <p className="text-gray-300 text-sm">
            Choose your color and AI difficulty level
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Color Selection */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm">
              Choose Your Color
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedColor === "white" ? "default" : "outline"}
                onClick={() => handleColorSelect("white")}
                className={`h-16 ${
                  selectedColor === "white"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-800 hover:bg-gray-700 border-gray-600"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">♔</div>
                  <div className="text-xs">White (First Move)</div>
                </div>
              </Button>

              <Button
                variant={selectedColor === "black" ? "default" : "outline"}
                onClick={() => handleColorSelect("black")}
                className={`h-16 ${
                  selectedColor === "black"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-800 hover:bg-gray-700 border-gray-600"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">♚</div>
                  <div className="text-xs">Black (Second Move)</div>
                </div>
              </Button>
            </div>

            {isBoardFlipped && (
              <div className="text-center">
                <Badge variant="secondary" className="bg-yellow-600 text-white">
                  Board will be flipped for your perspective
                </Badge>
              </div>
            )}
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm">AI Difficulty</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(AI_DIFFICULTY_CONFIGS).map(([key, config]) => (
                <Button
                  key={key}
                  variant={selectedDifficulty === key ? "default" : "outline"}
                  onClick={() => handleDifficultySelect(key as AIDifficulty)}
                  className={`h-20 ${
                    selectedDifficulty === key
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-800 hover:bg-gray-700 border-gray-600"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold capitalize mb-1">
                      {key}
                    </div>
                    <div className="text-xs opacity-80">
                      {config.thinkingTime / 1000}s
                    </div>
                    <div className="text-xs opacity-60">
                      Depth {config.searchDepth}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* AI Configuration Preview */}
          <div className="bg-gray-800 rounded-lg p-3">
            <h4 className="text-white font-semibold text-sm mb-2">
              AI Configuration
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
              <div>Thinking Time: {aiConfig.thinkingTime / 1000}s</div>
              <div>Search Depth: {aiConfig.searchDepth}</div>
              <div>Personality: {aiConfig.personality}</div>
              <div>
                Style:{" "}
                {aiConfig.personality === "aggressive"
                  ? "Attacking"
                  : aiConfig.personality === "defensive"
                  ? "Defensive"
                  : "Balanced"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gray-800 border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
