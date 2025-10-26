"use client";

import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { useChess } from "@/contexts/ChessContext";
import { useToast } from "@/contexts/ToastContext";
import { analytics } from "@/lib/analytics";
import { Square } from "chess.js";
import { gameSessionManager } from "@/lib/game-session-manager";

interface ChessBoardProps {
  width?: number;
  showMoveHistory?: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  width = 560,
  showMoveHistory = true,
}) => {
  const { gameState, makeMove, getLegalMoves } = useChess();
  const { success, warning, info } = useToast();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<
    Record<string, React.CSSProperties>
  >({});
  const [lastGameState, setLastGameState] = useState(gameState);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [boardSize, setBoardSize] = useState<number>(width);

  // Get board orientation from session manager
  const shouldFlipBoard = gameSessionManager.shouldFlipBoard();
  const boardOrientation = shouldFlipBoard ? "black" : "white";

  // Get legal moves for the selected piece
  const getLegalMovesForSquare = (square: Square) => {
    try {
      return getLegalMoves(square);
    } catch {
      return [];
    }
  };

  // Check if a square is in check (king's square)
  const isSquareInCheck = (square: Square) => {
    if (!gameState.isCheck) return false;

    // Check if this square contains a king
    const piece = gameState.fen.split(" ")[0];
    const squareIndex = getSquareIndex(square);
    const pieceAtSquare = getPieceAtSquare(piece, squareIndex);

    return pieceAtSquare === "k" || pieceAtSquare === "K";
  };

  // Helper function to get piece at a specific square
  const getPieceAtSquare = (fenBoard: string, squareIndex: number) => {
    let file = squareIndex % 8;
    let rank = Math.floor(squareIndex / 8);

    // Convert to FEN notation (a1 = 0, h8 = 63)
    const fenRank = 8 - rank - 1;
    const fenFile = String.fromCharCode(97 + file); // a-h

    // Parse FEN board string
    let currentSquare = 0;
    for (let i = 0; i < fenBoard.length; i++) {
      const char = fenBoard[i];
      if (char === "/") continue;

      if (isNaN(parseInt(char))) {
        if (currentSquare === squareIndex) {
          return char;
        }
        currentSquare++;
      } else {
        currentSquare += parseInt(char);
      }
    }
    return null;
  };

  // Helper function to get square index from square notation
  const getSquareIndex = (square: Square) => {
    const file = square.charCodeAt(0) - 97; // a=0, h=7
    const rank = 8 - parseInt(square[1]); // 1=7, 8=0
    return rank * 8 + file;
  };

  // Create comprehensive square styles including highlights, legal moves, and check
  const createSquareStyles = () => {
    const styles: Record<string, React.CSSProperties> = {
      ...highlightedSquares,
    };

    // Add check highlighting for king's square
    Object.keys(styles).forEach((square) => {
      if (isSquareInCheck(square as Square)) {
        styles[square] = {
          ...styles[square],
          backgroundColor: "rgba(255, 0, 0, 0.6)",
          border: "2px solid rgba(255, 0, 0, 0.8)",
        };
      }
    });

    return styles;
  };

  // Remove the custom square renderer since it's not supported in this version
  // Instead, we'll use squareStyles and add visual indicators through CSS

  // Use fixed board size for stable layout
  useEffect(() => {
    setBoardSize(width);
  }, [width]);

  // Track game start
  useEffect(() => {
    if (gameState.moveHistory.length === 0 && !gameStartTime) {
      setGameStartTime(Date.now());
      analytics.trackEvent("game_start", {
        fen: gameState.fen,
        turn: gameState.turn,
      });
    }
  }, [gameState.moveHistory.length, gameStartTime]);

  // Check for game state changes and show appropriate toasts
  useEffect(() => {
    // Check for checkmate
    if (gameState.isCheckmate && !lastGameState.isCheckmate) {
      const winner = gameState.turn === "w" ? "Black" : "White";
      success("Checkmate!", `${winner} wins the game!`);

      // Track game end
      if (gameStartTime) {
        const gameTime = Date.now() - gameStartTime;
        analytics.trackEvent("game_end", {
          result: "checkmate",
          winner,
          gameTime,
          totalMoves: gameState.moveHistory.length,
        });
        setGameStartTime(null);
      }
    }

    // Check for stalemate
    if (gameState.isStalemate && !lastGameState.isStalemate) {
      warning("Stalemate!", "The game is a draw by stalemate.");

      // Track game end
      if (gameStartTime) {
        const gameTime = Date.now() - gameStartTime;
        analytics.trackEvent("game_end", {
          result: "stalemate",
          gameTime,
          totalMoves: gameState.moveHistory.length,
        });
        setGameStartTime(null);
      }
    }

    // Check for draw
    if (gameState.isDraw && !lastGameState.isDraw) {
      info("Draw!", "The game is a draw.");

      // Track game end
      if (gameStartTime) {
        const gameTime = Date.now() - gameStartTime;
        analytics.trackEvent("game_end", {
          result: "draw",
          gameTime,
          totalMoves: gameState.moveHistory.length,
        });
        setGameStartTime(null);
      }
    }

    // Check for check
    if (gameState.isCheck && !lastGameState.isCheck) {
      const player = gameState.turn === "w" ? "White" : "Black";
      warning("Check!", `${player} is in check!`);
    }

    setLastGameState(gameState);
  }, [gameState, lastGameState, success, warning, info, gameStartTime]);

  const onSquareClick = (square: Square) => {
    if (selectedSquare === null) {
      // First click - select piece
      const legalMoves = getLegalMovesForSquare(square);
      if (legalMoves.length > 0) {
        setSelectedSquare(square);
        const highlights: Record<string, React.CSSProperties> = {};

        // Highlight selected piece with stronger yellow
        highlights[square] = {
          backgroundColor: "rgba(255, 255, 0, 0.8)",
          border: "3px solid rgba(255, 255, 0, 1)",
        };

        // Highlight legal moves with light blue background
        legalMoves.forEach(([from, to]) => {
          highlights[to] = {
            backgroundColor: "rgba(100, 200, 255, 0.4)",
            border: "2px solid rgba(100, 200, 255, 0.8)",
          };
        });

        setHighlightedSquares(highlights);
      }
    } else {
      // Second click - make move
      if (selectedSquare !== square) {
        const startTime = performance.now();
        const success = makeMove(selectedSquare, square);
        const endTime = performance.now();

        if (success) {
          // Track move performance
          analytics.trackPerformance("move_execution", endTime - startTime);

          // Track move made
          analytics.trackEvent("move_made", {
            from: selectedSquare,
            to: square,
            moveNumber: Math.floor(gameState.moveHistory.length / 2) + 1,
          });
        }
      }
      // Clear selection
      setSelectedSquare(null);
      setHighlightedSquares({});
    }
  };

  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    const startTime = performance.now();
    const success = makeMove(sourceSquare, targetSquare);
    const endTime = performance.now();

    if (success) {
      // Track move performance
      analytics.trackPerformance("move_execution", endTime - startTime);

      // Track move made
      analytics.trackEvent("move_made", {
        from: sourceSquare,
        to: targetSquare,
        moveNumber: Math.floor(gameState.moveHistory.length / 2) + 1,
        method: "drag_drop",
      });

      setSelectedSquare(null);
      setHighlightedSquares({});
    }
    return success;
  };

  const getGameStatus = () => {
    if (gameState.isCheckmate) {
      return `${gameState.turn === "w" ? "Black" : "White"} wins by checkmate!`;
    }
    if (gameState.isStalemate) {
      return "Game is a draw by stalemate!";
    }
    if (gameState.isDraw) {
      return "Game is a draw!";
    }
    if (gameState.isCheck) {
      const player = gameState.turn === "w" ? "White" : "Black";
      return `🚨 ${player} is in CHECK! 🚨`;
    }
    return `${gameState.turn === "w" ? "White" : "Black"}'s turn`;
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-lg font-semibold text-white">{getGameStatus()}</div>

      {/* Board Orientation Indicator */}
      {shouldFlipBoard && (
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-1">
          <span className="text-sm text-blue-300">
            🎯 Playing as Black - Board flipped for your perspective
          </span>
        </div>
      )}

      <div
        className="relative"
        style={{ width: boardSize, height: boardSize, maxWidth: "100%" }}
      >
        <div
          className={`transition-transform duration-300 ${
            shouldFlipBoard ? "rotate-180" : ""
          }`}
        >
          <Chessboard
            options={{
              position: gameState.fen,
              onSquareClick: ({ square }) => onSquareClick(square as Square),
              onPieceDrop: ({ sourceSquare, targetSquare }) =>
                onDrop(sourceSquare as Square, targetSquare as Square),
              boardStyle: {
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
                width: boardSize,
                height: boardSize,
              },
              squareStyles: createSquareStyles(),
            }}
          />

          {/* Legal move dots overlay */}
          {selectedSquare && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 10 }}
            >
              {Object.keys(highlightedSquares).map((square) => {
                if (square === selectedSquare) return null;
                if (highlightedSquares[square]) {
                  const [file, rank] = square.split("");
                  const fileIndex = file.charCodeAt(0) - 97; // a=0, h=7
                  const rankIndex = 8 - parseInt(rank); // 1=7, 8=0

                  // Adjust position based on board flip
                  const adjustedFileIndex = shouldFlipBoard
                    ? 7 - fileIndex
                    : fileIndex;
                  const adjustedRankIndex = shouldFlipBoard
                    ? 7 - rankIndex
                    : rankIndex;

                  // Calculate center position of each square (12.5% is the center of each square)
                  const left = adjustedFileIndex * 12.5 + 6.25;
                  const top = adjustedRankIndex * 12.5 + 6.25;

                  return (
                    <div
                      key={square}
                      className="absolute w-4 h-4 bg-black rounded-full opacity-80 border-2 border-white"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* Check indicator overlay */}
          {gameState.isCheck && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 15 }}
            >
              {Object.keys(highlightedSquares).map((square) => {
                if (isSquareInCheck(square as Square)) {
                  const [file, rank] = square.split("");
                  const fileIndex = file.charCodeAt(0) - 97;
                  const rankIndex = 8 - parseInt(rank);

                  // Adjust position based on board flip
                  const adjustedFileIndex = shouldFlipBoard
                    ? 7 - fileIndex
                    : fileIndex;
                  const adjustedRankIndex = shouldFlipBoard
                    ? 7 - rankIndex
                    : rankIndex;

                  // Calculate center position of each square
                  const left = adjustedFileIndex * 12.5 + 6.25;
                  const top = adjustedRankIndex * 12.5 + 6.25;

                  return (
                    <div
                      key={`check-${square}`}
                      className="absolute w-5 h-5 bg-red-500 rounded-full opacity-90 animate-pulse border-2 border-white"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>

      {showMoveHistory && (
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-2 text-white text-center">
            Move History
          </h3>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-3 max-h-32 overflow-y-auto">
            {gameState.moveHistory.length === 0 ? (
              <p className="text-white/70 text-center">No moves yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-1 text-xs">
                {gameState.moveHistory.map((move, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-white/70">
                      {Math.floor(index / 2) + 1}.
                    </span>
                    <span className="text-white font-medium">{move.san}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
