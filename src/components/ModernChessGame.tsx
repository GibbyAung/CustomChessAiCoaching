"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChessProvider } from "@/contexts/ChessContext";
import { ChessEngineProvider } from "@/contexts/ChessEngineContext";
import dynamic from "next/dynamic";
import { GameMode, GAME_MODES } from "@/types/game-modes";

import { gameSessionManager } from "@/lib/game-session-manager";
import { GameOperations } from "@/lib/game-operations";
import { UnifiedGameControls } from "@/components/UnifiedGameControls";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { useChess } from "@/contexts/ChessContext";
import { useCoaching } from "@/contexts/CoachingContext";
import { Square } from "chess.js";

// Dynamic imports for better performance
const ChessBoard = dynamic(
  () => import("@/components/ChessBoard").then((m) => m.ChessBoard),
  { ssr: false },
);
const ModernEvaluationBar = dynamic(
  () => import("@/components/ModernEvaluationBar"),
  { ssr: false },
);
const GameModeSelector = dynamic(
  () => import("@/components/GameModeSelector"),
  { ssr: false },
);
// CoachingInsights removed - functionality integrated into AdvancedCoachingToaster
const ModernAIOpponent = dynamic(
  () => import("@/components/ModernAIOpponent").then((m) => m.ModernAIOpponent),
  { ssr: false },
);

// AIRobotCoach component removed - replaced with modern toaster system

// Inner component that uses the chess context
function ChessGameContent({
  selectedMode,
  aiDifficulty,
  showGameModes,
  showGameMenu,
  showNewGameConfirm,
  showPerformance,
  setShowGameModes,
  setShowGameMenu,
  setShowNewGameConfirm,
  setShowPerformance,
  setAiDifficulty,
  handleModeChange,
  currentMode,
}: {
  selectedMode: GameMode;
  aiDifficulty: "easy" | "medium" | "hard";
  showGameModes: boolean;
  showGameMenu: boolean;
  showNewGameConfirm: boolean;
  showPerformance: boolean;
  setShowGameModes: (show: boolean) => void;
  setShowGameMenu: (show: boolean) => void;
  setShowNewGameConfirm: (show: boolean) => void;
  setShowPerformance: (show: boolean) => void;
  setAiDifficulty: (difficulty: "easy" | "medium" | "hard") => void;
  handleModeChange: (mode: GameMode) => void;
  currentMode: any;
}) {
  const { resetGame, undoMove, flipBoard, gameState } = useChess();
  const { updatePosition, setDifficulty } = useCoaching();
  const [hintArrows, setHintArrows] = useState<
    Array<{ startSquare: Square; endSquare: Square; color: string }>
  >([]);
  const lastHintFenRef = useRef<string>("");
  const hintRequestRef = useRef<number>(0);

  useEffect(() => {
    setDifficulty(aiDifficulty);
  }, [aiDifficulty, setDifficulty]);

  // Update coaching position when game state changes
  useEffect(() => {
    if (gameState.fen) {
      // Always analyze moves in practice and analysis modes
      // In AI opponent mode, only analyze human moves
      let isHumanMove = true; // Default to true for practice/analysis modes

      if (selectedMode === "ai_opponent") {
        // In AI opponent mode:
        // If it's black's turn, last move was by white (human) = analyze
        // If it's white's turn, last move was by black (AI) = skip
        isHumanMove = gameState.turn === "b"; // Black to move = last move was by white (human) = analyze
      } else if (selectedMode === "ai_coaching") {
        // In AI coaching mode, analyze all moves to provide feedback
        isHumanMove = true;
      }

      console.log("🧠 [CoachingContext] Move analysis:", {
        lastMove: gameState.lastMove,
        isHumanMove,
        currentTurn: gameState.turn,
        gameMode: selectedMode,
        willAnalyze: isHumanMove && !!gameState.lastMove,
      });

      // ✅ ALTERNATIVE FIX: Only analyze when we have a move and it meets the human move criteria
      // Add delay to prevent conflicts with AI thinking
      if (gameState.lastMove && isHumanMove) {
        console.log(
          "📊 [CoachingContext] Analyzing human move:",
          gameState.lastMove,
        );

        // Wait a bit to ensure AI isn't using Stockfish
        setTimeout(() => {
          try {
            updatePosition(gameState.fen, gameState.lastMove, isHumanMove);
          } catch (err: any) {
            console.error("❌ [CoachingContext] Coaching error:", err);
          }
        }, 500); // Delay to avoid conflict
      } else if (!gameState.lastMove) {
        console.log("🚫 [CoachingContext] Skipping analysis - no lastMove");
      } else {
        console.log("🚫 [CoachingContext] Skipping coaching - AI move");
      }
    }
  }, [
    gameState.fen,
    gameState.lastMove,
    gameState.turn,
    selectedMode,
    updatePosition,
  ]);

  useEffect(() => {
    let isActive = true;

    const updateHintArrows = async () => {
      const shouldShowHints =
        aiDifficulty === "easy" &&
        (selectedMode === "ai_coaching" || selectedMode === "ai_opponent");

      console.log("🧭 [Hints] Evaluating hint arrows:", {
        mode: selectedMode,
        difficulty: aiDifficulty,
        shouldShowHints,
        turn: gameState.turn,
      });

      if (!shouldShowHints) {
        if (hintArrows.length > 0) {
          console.log("🧹 [Hints] Clearing hint arrows - hints disabled");
          setHintArrows([]);
        }
        return;
      }

      if (gameState.isGameOver) {
        console.log("🏁 [Hints] Clearing hint arrows - game over");
        setHintArrows([]);
        return;
      }

      const sessionColor = gameSessionManager.getUserColor();
      const userColor = sessionColor ?? "white";
      const isUserTurn =
        (userColor === "white" && gameState.turn === "w") ||
        (userColor === "black" && gameState.turn === "b");

      if (!isUserTurn) {
        console.log("⏳ [Hints] Clearing hint arrows - waiting for user turn");
        setHintArrows([]);
        return;
      }

      if (lastHintFenRef.current === gameState.fen) {
        console.log("🔁 [Hints] Skipping hint update - same position");
        return;
      }

      lastHintFenRef.current = gameState.fen;
      hintRequestRef.current += 1;
      const requestId = hintRequestRef.current;

      try {
        const { stockfishEngine } = await import("@/lib/stockfish-engine");
        if (!stockfishEngine.isReady()) {
          await stockfishEngine.initialize();
        }

        console.log("🧠 [Hints] Requesting hint lines from Stockfish");
        const topMoves = await stockfishEngine.getMultipleLines(
          gameState.fen,
          3,
          800,
        );

        if (!isActive || hintRequestRef.current !== requestId) {
          return;
        }

        console.log("✅ [Hints] Received hint lines:", topMoves);

        const hintColors = [
          "rgba(34, 197, 94, 0.9)",
          "rgba(59, 130, 246, 0.85)",
          "rgba(249, 115, 22, 0.85)",
        ];

        const arrows = topMoves
          .filter((move) => move.move && move.move.length >= 4)
          .slice(0, 3)
          .map((move, index) => ({
            startSquare: move.move.slice(0, 2) as Square,
            endSquare: move.move.slice(2, 4) as Square,
            color: hintColors[index] ?? hintColors[0],
          }));

        console.log("📌 [Hints] Setting hint arrows:", arrows);
        setHintArrows(arrows);
      } catch (error) {
        console.error("❌ [Coaching] Failed to fetch hint arrows:", error);
      }
    };

    updateHintArrows();

    return () => {
      isActive = false;
    };
  }, [
    selectedMode,
    aiDifficulty,
    gameState.fen,
    gameState.turn,
    gameState.isGameOver,
    hintArrows.length,
  ]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">Chess Engine</h1>
            <div className="flex items-center space-x-2">
              <span className="text-xl">{currentMode.icon}</span>
              <span className="text-white font-semibold">
                {currentMode.name}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowPerformance(true)}
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 text-white hover:from-blue-500/30 hover:to-purple-500/30 shadow-lg"
            >
              📊 Analytics
            </Button>
            <Button
              onClick={() => setShowGameModes(true)}
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-500/30 text-white hover:from-emerald-500/30 hover:to-teal-500/30 shadow-lg"
            >
              Change Mode
            </Button>
            <Button
              onClick={() => setShowGameMenu(true)}
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 text-white hover:from-amber-500/30 hover:to-orange-500/30 shadow-lg"
            >
              ⚙️ Game Menu
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Full Height */}
      <div className="flex-1 flex p-6 gap-8">
        {/* Left Panel - Game Info - Clean & Spacious */}
        <div className="w-64 flex-shrink-0 space-y-8">
          {/* Game Mode Section - Minimal */}
          <div className="text-center">
            <div className="text-white text-2xl font-bold mb-2">
              {currentMode.icon}
            </div>
            <div className="text-white text-lg font-semibold mb-2">
              {currentMode.name}
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {currentMode.description}
            </p>
          </div>

          {/* Game Controls - Clean & Simple */}
          {selectedMode === "ai_opponent" && (
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-center space-y-3">
                <div className="text-white text-sm font-medium">Difficulty</div>
                <div className="text-white text-lg font-bold px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30">
                  {aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)}
                </div>
                <div className="flex items-center justify-center space-x-2 text-xs text-emerald-300">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>Auto-play Active</span>
                </div>
              </div>
            </div>
          )}

          {selectedMode === "ai_coaching" && (
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-center space-y-3">
                <div className="text-white text-sm font-medium">Features</div>
                <div className="flex justify-center space-x-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-300">Hints</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-emerald-300">Analysis</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coaching Insights removed - functionality integrated into AdvancedCoachingToaster */}

          {/* Analysis Mode - Simple */}
          {selectedMode === "analysis" && (
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center">
              <div className="text-white text-lg font-semibold mb-2">
                🔍 Analysis Mode
              </div>
              <div className="text-sm text-gray-300">
                Deep position analysis with Stockfish engine
              </div>
            </div>
          )}
        </div>

        {/* Center - Chess Board with Evaluation - Fixed Layout */}
        <div className="flex-1 flex justify-center items-start pt-8">
          <div
            className="flex items-start gap-6"
            style={{ width: "fit-content", maxWidth: "100%" }}
          >
            {/* Evaluation Bar - Fixed position, always rendered */}
            <div className="flex-shrink-0 w-6">
              {currentMode.showEvaluation ? (
                <ModernEvaluationBar
                  fen={gameState.fen}
                  showThinking={currentMode.showThinking}
                />
              ) : (
                <div className="w-6 h-40" /> // Placeholder to maintain layout
              )}
            </div>
            {/* Chess Board - Fixed position, never moves */}
            <div className="flex-shrink-0 w-[480px]">
              <ChessBoard
                width={480}
                showMoveHistory={true}
                hintArrows={hintArrows}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Game Controls & Info */}
        <div className="w-64 flex-shrink-0 space-y-6">
          {/* Game Controls */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">🎮</span>
              Game Controls
            </h3>
            <UnifiedGameControls
              variant="compact"
              className="bg-transparent border-0 shadow-none"
            />
          </div>

          {/* Game Info */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">📊</span>
              Game Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Moves:</span>
                <span className="text-white font-medium">
                  {gameState.moveHistory.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Turn:</span>
                <span className="text-white font-medium">
                  {gameState.turn === "w" ? "White" : "Black"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Mode:</span>
                <Badge className="bg-blue-600 text-white text-xs">
                  {currentMode.name}
                </Badge>
              </div>
              {gameState.isCheck && (
                <div className="text-yellow-400 font-medium text-center py-2 bg-yellow-900/20 rounded-lg">
                  ⚠️ Check!
                </div>
              )}
              {gameState.isCheckmate && (
                <div className="text-red-400 font-medium text-center py-2 bg-red-900/20 rounded-lg">
                  🏆 Checkmate!
                </div>
              )}
              {gameState.isStalemate && (
                <div className="text-orange-400 font-medium text-center py-2 bg-orange-900/20 rounded-lg">
                  🤝 Stalemate!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Menu Modal */}
      {showGameMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowGameMenu(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Game Menu</h2>
                <Button
                  onClick={() => setShowGameMenu(false)}
                  size="sm"
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                >
                  ✕
                </Button>
              </div>

              {/* Use our unified game controls in compact mode */}
              <UnifiedGameControls
                variant="compact"
                showGameInfo={false}
                className="bg-transparent border-none shadow-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Game Mode Selection Modal */}
      {showGameModes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowGameModes(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">
                  Choose Game Mode
                </h2>
                <Button
                  onClick={() => setShowGameModes(false)}
                  size="sm"
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                >
                  ✕
                </Button>
              </div>
              <div className="space-y-3">
                <GameModeSelector
                  selectedMode={selectedMode}
                  onModeChange={handleModeChange}
                />

                {/* Difficulty Selection - Only show for coaching */}
                {selectedMode === "ai_coaching" && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white">
                        AI Difficulty
                      </h3>
                      <span className="text-xs text-gray-400">
                        Select level
                      </span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {(["easy", "medium", "hard"] as const).map(
                        (difficulty) => (
                          <Button
                            key={difficulty}
                            onClick={() => setAiDifficulty(difficulty)}
                            variant={
                              aiDifficulty === difficulty
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={`flex-1 ${
                              aiDifficulty === difficulty
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                            }`}
                          >
                            {difficulty.charAt(0).toUpperCase() +
                              difficulty.slice(1)}
                          </Button>
                        ),
                      )}
                    </div>
                    <div className="text-xs text-gray-300 bg-white/5 rounded px-2 py-1.5">
                      {aiDifficulty === "easy" &&
                        "🎯 Beginner level - Great for learning"}
                      {aiDifficulty === "medium" &&
                        "⚡ Intermediate level - Balanced challenge"}
                      {aiDifficulty === "hard" &&
                        "🔥 Advanced level - Maximum challenge"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Game Confirmation Modal */}
      <ConfirmationModal
        isOpen={showNewGameConfirm}
        onClose={() => setShowNewGameConfirm(false)}
        onConfirm={async () => {
          await GameOperations.startNewGame(resetGame);
          setShowNewGameConfirm(false);
        }}
        title="Start New Game"
        description="Are you sure you want to start a new game? This will reset the current game."
        confirmText="Start New Game"
        variant="default"
      />

      {/* Performance Analytics Modal */}
      {showPerformance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPerformance(false)}
          />
          <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Performance Analytics
                </h2>
                <Button
                  onClick={() => setShowPerformance(false)}
                  size="sm"
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Game Statistics */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Game Statistics
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Games Played:</span>
                      <span className="text-white">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wins:</span>
                      <span className="text-green-400">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Losses:</span>
                      <span className="text-red-400">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Draws:</span>
                      <span className="text-yellow-400">0</span>
                    </div>
                  </div>
                </div>

                {/* Move Analysis */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Move Analysis
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Best Moves:</span>
                      <span className="text-green-400">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Good Moves:</span>
                      <span className="text-blue-400">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inaccuracies:</span>
                      <span className="text-yellow-400">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mistakes:</span>
                      <span className="text-orange-400">0</span>
                    </div>
                  </div>
                </div>

                {/* Engine Performance */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Engine Performance
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Average Depth:</span>
                      <span className="text-white">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Analysis Time:</span>
                      <span className="text-white">0ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nodes Searched:</span>
                      <span className="text-white">0</span>
                    </div>
                  </div>
                </div>

                {/* Learning Progress */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Learning Progress
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Hints Used:</span>
                      <span className="text-white">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lessons Completed:</span>
                      <span className="text-white">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skill Level:</span>
                      <span className="text-green-400">Beginner</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Opponent */}
      <ModernAIOpponent
        isEnabled={
          selectedMode === "ai_opponent" || selectedMode === "ai_coaching"
        }
        gameMode={selectedMode}
        difficulty={aiDifficulty}
        autoPlay={currentMode.autoPlay}
      />
    </div>
  );
}

export function ModernChessGame() {
  const [selectedMode, setSelectedMode] = useState<GameMode>("practice");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [showGameModes, setShowGameModes] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);

  const currentMode = GAME_MODES[selectedMode];

  useEffect(() => {
    const unsubscribe = gameSessionManager.subscribe((session) => {
      if (session?.aiConfig?.difficulty) {
        console.log("🎚️ [ModernChessGame] Syncing AI difficulty:", {
          difficulty: session.aiConfig.difficulty,
          mode: session.mode,
        });
        setAiDifficulty(session.aiConfig.difficulty);
      } else if (!session) {
        console.log("♻️ [ModernChessGame] No active session - keeping difficulty");
      }
    });

    return unsubscribe;
  }, []);

  // Initialize engine when component mounts and mode changes
  useEffect(() => {
    console.log(
      "🚀 [ModernChessGame] Initializing engine for mode:",
      currentMode,
    );

    // Initialize engine if evaluation or coaching is needed
    if (
      currentMode.showEvaluation ||
      currentMode.showThinking ||
      currentMode.name.includes("Coaching")
    ) {
      const initializeEngine = async () => {
        try {
          console.log("🔧 [ModernChessGame] Loading stockfish engine...");
          const { stockfishEngine } = await import("@/lib/stockfish-engine");
          if (!stockfishEngine.isReady()) {
            await stockfishEngine.initialize();
            console.log("✅ [ModernChessGame] Engine initialized successfully");
          } else {
            console.log("✅ [ModernChessGame] Engine already ready");
          }
        } catch (error) {
          console.error(
            "❌ [ModernChessGame] Engine initialization failed:",
            error,
          );
        }
      };

      initializeEngine();
    }
  }, [currentMode]);

  const handleModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
    setShowGameModes(false);
  };

  return (
    <ChessEngineProvider>
      <ChessProvider>
        <ChessGameContent
          selectedMode={selectedMode}
          aiDifficulty={aiDifficulty}
          showGameModes={showGameModes}
          showGameMenu={showGameMenu}
          showNewGameConfirm={showNewGameConfirm}
          showPerformance={showPerformance}
          setShowGameModes={setShowGameModes}
          setShowGameMenu={setShowGameMenu}
          setShowNewGameConfirm={setShowNewGameConfirm}
          setShowPerformance={setShowPerformance}
          setAiDifficulty={setAiDifficulty}
          handleModeChange={handleModeChange}
          currentMode={currentMode}
        />
      </ChessProvider>
    </ChessEngineProvider>
  );
}
