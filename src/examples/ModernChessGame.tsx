// Example usage in ModernChessGame.tsx or main game component
"use client";

import React from "react";
import { SmartToastDisplay } from "@/components/SmartToastDisplay";
import { CoachingSettingsPanel } from "@/components/CoachingSettings";
import { stockfishCoaching } from "@/lib/stockfish-coaching";

export function ModernChessGame() {
  // Your existing game state
  const [game, setGame] = React.useState<any>(null);
  const [currentFen, setCurrentFen] = React.useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );

  // In your move handler:
  const handleMove = async (move: string) => {
    // ... your existing move logic
    // Update game state, validate move, etc.

    // Show coaching feedback (with built-in deduplication)
    if (game) {
      await stockfishCoaching.analyzeAndShowFeedback(game.fen(), move);
    }
  };

  return (
    <div className="relative">
      {/* Your existing game UI */}
      <div className="chess-board-container">
        {/* Your chess board component */}
      </div>

      {/* Add coaching settings - positioned in top-right corner */}
      <div className="absolute top-4 right-4">
        <CoachingSettingsPanel />
      </div>

      {/* Smart toast display - positioned in top-right corner */}
      <SmartToastDisplay />
    </div>
  );
}

// Alternative: If you want to add it to an existing component
export function ExistingChessComponent() {
  // Add these imports to your existing component
  // import { SmartToastDisplay } from "@/components/SmartToastDisplay";
  // import { CoachingSettingsPanel } from "@/components/CoachingSettings";
  // import { stockfishCoaching } from "@/lib/stockfish-coaching";

  // Add this to your existing move handler
  const existingMoveHandler = async (move: string, fen: string) => {
    // ... your existing move logic

    // Add this line for coaching feedback
    await stockfishCoaching.analyzeAndShowFeedback(fen, move);
  };

  // Add these to your JSX return statement
  return (
    <div>
      {/* Your existing component content */}

      {/* Add these components */}
      <CoachingSettingsPanel />
      <SmartToastDisplay />
    </div>
  );
}
