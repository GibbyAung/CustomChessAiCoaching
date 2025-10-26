"use client";

import { Chess } from "chess.js";
import {
  getBestMove as searchBestMove,
  transpositionTable as engineTT,
} from "./engine/search";
import { DEFAULT_ENGINE_CONFIG } from "./engine/constants";
import { EngineAnalysis, EngineConfig, EngineMove } from "./engine/types";

// Standard piece values (centipawns)
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
  P: -100,
  N: -320,
  B: -330,
  R: -500,
  Q: -900,
  K: -20000,
};

// Advanced piece-square tables (from Stockfish)
const PAWN_PSQT = [
  0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30,
  20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10,
  0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_PSQT = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30,
  0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20,
  15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_PSQT = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
  10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0,
  -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10,
  -10, -10, -10, -10, -10, -20,
];

const ROOK_PSQT = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0,
  -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0,
  -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
];

const QUEEN_PSQT = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
  5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5,
  5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10,
  -20,
];

const KING_MIDDLE_PSQT = [
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40,
  -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40,
  -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20,
  -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
];

const KING_END_PSQT = [
  -50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30,
  -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30,
  -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30,
  0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50,
];

// Opening moves database
const OPENING_MOVES = {
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": [
    "e2e4",
    "d2d4",
    "c2c4",
    "g1f3",
    "b1c3",
    "f2f4",
    "b2b3",
    "g2g3",
  ],
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1": [
    "e7e5",
    "c7c5",
    "e7e6",
    "d7d5",
    "g8f6",
    "b8c6",
    "d7d6",
    "g7g6",
  ],
  "rnbqkbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQKBNR b KQkq d3 0 1": [
    "d7d5",
    "g8f6",
    "e7e6",
    "c7c5",
    "g7g6",
    "b7b6",
    "e7e5",
    "c7c6",
  ],
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2": [
    "g1f3",
    "b1c3",
    "f1c4",
    "d2d3",
    "b2b3",
    "c2c3",
    "g2g3",
    "f2f4",
  ],
  "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2": [
    "c2c4",
    "g1f3",
    "e2e3",
    "c1f4",
    "c1g5",
    "b1c3",
    "e2e4",
    "g2g3",
  ],
};

// Transposition table
const transpositionTable = new Map<
  string,
  { score: number; depth: number; flag: string; bestMove?: string }
>();

// Move history for move ordering
const moveHistory = new Map<string, number>();

// Helper to create a stable move key
function moveKey(move: any): string {
  return `${move.from}${move.to}${move.promotion || ""}`;
}

// Killer moves table: depth -> [killer1, killer2]
const killerMoves: Record<number, string[]> = {};

// Advanced evaluation function
function evaluatePosition(chess: Chess): number {
  const fen = chess.fen();
  const board = fen.split(" ")[0];
  const isEndgame = countPieces(board) <= 12;

  let score = 0;
  let squareIndex = 0;

  // Material and positional evaluation
  for (let i = 0; i < board.length; i++) {
    const char = board[i];
    if (char === "/") continue;

    if (char >= "1" && char <= "8") {
      squareIndex += parseInt(char);
      continue;
    }

    const piece = char.toLowerCase();
    const isWhite = char === char.toUpperCase();
    const value = PIECE_VALUES[char as keyof typeof PIECE_VALUES] || 0;

    // Material score
    score += value;

    // Positional score
    const psqtValue = getPSQTValue(piece, squareIndex, isWhite, isEndgame);
    score += isWhite ? psqtValue : -psqtValue;

    squareIndex++;
  }

  // Mobility evaluation
  score += evaluateMobility(chess);

  // Pawn structure evaluation
  score += evaluatePawnStructure(chess);

  // Piece features (bishop pair, rooks on files)
  score += evaluatePieceFeatures(chess);

  // King safety evaluation
  score += evaluateKingSafety(chess, isEndgame);

  // Center control evaluation
  score += evaluateCenterControl(chess);

  // Tactical evaluation
  if (chess.isCheck()) {
    score += chess.turn() === "w" ? -500 : 500;
  }

  if (chess.isCheckmate()) {
    score += chess.turn() === "w" ? -10000 : 10000;
  }

  if (chess.isStalemate()) {
    score = 0;
  }

  // Hanging piece detection
  score += evaluateHangingPieces(chess);

  return score;
}

function evaluateMobility(chess: Chess): number {
  const whiteMoves = chess.moves().length;
  const chessCopy = new Chess(chess.fen());
  const fenParts = chess.fen().split(" ");
  fenParts[1] = "b";
  fenParts[3] = "-";
  try {
    chessCopy.load(fenParts.join(" "));
    const blackMoves = chessCopy.moves().length;
    return (blackMoves - whiteMoves) * 10;
  } catch (error) {
    return 0;
  }
}

function evaluatePawnStructure(chess: Chess): number {
  let score = 0;
  const fen = chess.fen();
  const board = fen.split(" ")[0];

  const filePawnsWhite: number[] = Array(8).fill(0);
  const filePawnsBlack: number[] = Array(8).fill(0);

  // Doubled pawns penalty and track files
  for (let file = 0; file < 8; file++) {
    let whitePawns = 0,
      blackPawns = 0;
    for (let rank = 0; rank < 8; rank++) {
      const char = board[rank * 9 + file];
      if (char === "P") whitePawns++;
      if (char === "p") blackPawns++;
    }
    filePawnsWhite[file] = whitePawns;
    filePawnsBlack[file] = blackPawns;
    if (whitePawns > 1) score -= 30 * (whitePawns - 1);
    if (blackPawns > 1) score += 30 * (blackPawns - 1);
  }

  // Isolated/Passed pawns
  for (let file = 0; file < 8; file++) {
    const left = file > 0 ? file - 1 : -1;
    const right = file < 7 ? file + 1 : -1;

    // Isolated
    const wNeighbors =
      (left >= 0 ? filePawnsWhite[left] : 0) +
      (right >= 0 ? filePawnsWhite[right] : 0);
    const bNeighbors =
      (left >= 0 ? filePawnsBlack[left] : 0) +
      (right >= 0 ? filePawnsBlack[right] : 0);
    if (filePawnsWhite[file] > 0 && wNeighbors === 0) score -= 15; // isolated white
    if (filePawnsBlack[file] > 0 && bNeighbors === 0) score += 15; // isolated black

    // Passed: no opposing pawns ahead on same/adjacent files
    if (filePawnsWhite[file] > 0) {
      const hasOppSame = filePawnsBlack[file] > 0;
      const hasOppAdjacent =
        (left >= 0 && filePawnsBlack[left] > 0) ||
        (right >= 0 && filePawnsBlack[right] > 0);
      if (!hasOppSame && !hasOppAdjacent) score += 40; // white passed pawn bonus
    }
    if (filePawnsBlack[file] > 0) {
      const hasOppSame = filePawnsWhite[file] > 0;
      const hasOppAdjacent =
        (left >= 0 && filePawnsWhite[left] > 0) ||
        (right >= 0 && filePawnsWhite[right] > 0);
      if (!hasOppSame && !hasOppAdjacent) score -= 40; // black passed pawn bonus (negative for white)
    }
  }

  return score;
}

function evaluatePieceFeatures(chess: Chess): number {
  // Bishop pair, rooks on (semi-)open files
  let score = 0;
  const fen = chess.fen();
  const board = fen.split(" ")[0];

  // Count bishops
  let wBishops = 0,
    bBishops = 0;
  const fileHasWhitePawn: boolean[] = Array(8).fill(false);
  const fileHasBlackPawn: boolean[] = Array(8).fill(false);

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const char = board[rank * 9 + file];
      if (char === "B") wBishops++;
      if (char === "b") bBishops++;
      if (char === "P") fileHasWhitePawn[file] = true;
      if (char === "p") fileHasBlackPawn[file] = true;
    }
  }

  if (wBishops >= 2) score += 40; // bishop pair bonus
  if (bBishops >= 2) score -= 40; // bishop pair for black

  // Rooks on open/semi-open files
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const char = board[rank * 9 + file];
      if (char === "R") {
        const open = !fileHasWhitePawn[file] && !fileHasBlackPawn[file];
        const semiOpen =
          !fileHasWhitePawn[file] && fileHasBlackPawn[file] === true;
        if (open) score += 25;
        else if (semiOpen) score += 10;
      }
      if (char === "r") {
        const open = !fileHasWhitePawn[file] && !fileHasBlackPawn[file];
        const semiOpen =
          !fileHasBlackPawn[file] && fileHasWhitePawn[file] === true;
        if (open) score -= 25;
        else if (semiOpen) score -= 10;
      }
    }
  }

  return score;
}

function evaluateKingSafety(chess: Chess, isEndgame: boolean): number {
  let score = 0;

  const whiteKing = findKing(chess, "w");
  const blackKing = findKing(chess, "b");

  if (whiteKing) {
    const centerDistance =
      Math.abs(whiteKing.charCodeAt(0) - 101) +
      Math.abs(parseInt(whiteKing[1]) - 4);
    if (isEndgame) {
      score -= centerDistance * 10; // King should be active in endgame
    } else {
      score += centerDistance * 5; // King should be safe in middlegame
    }
  }

  if (blackKing) {
    const centerDistance =
      Math.abs(blackKing.charCodeAt(0) - 101) +
      Math.abs(parseInt(blackKing[1]) - 4);
    if (isEndgame) {
      score += centerDistance * 10;
    } else {
      score -= centerDistance * 5;
    }
  }

  return score;
}

function findKing(chess: Chess, color: string): string | null {
  const fen = chess.fen();
  const board = fen.split(" ")[0];
  const kingChar = color === "w" ? "K" : "k";

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const char = board[rank * 9 + file];
      if (char === kingChar) {
        return String.fromCharCode(97 + file) + (8 - rank);
      }
    }
  }
  return null;
}

function evaluateCenterControl(chess: Chess): number {
  let score = 0;
  const centerSquares = ["d4", "d5", "e4", "e5"];

  for (const square of centerSquares) {
    const piece = chess.get(square as any);
    if (piece) {
      const value =
        PIECE_VALUES[piece.type.toUpperCase() as keyof typeof PIECE_VALUES] ||
        0;
      score += piece.color === "w" ? -value / 20 : value / 20;
    }
  }

  return score;
}

function evaluateHangingPieces(chess: Chess): number {
  let score = 0;
  const moves = chess.moves({ verbose: true });

  for (const move of moves) {
    if (move.captured) {
      const capturedValue =
        PIECE_VALUES[
          move.captured.toUpperCase() as keyof typeof PIECE_VALUES
        ] || 0;
      const movingValue =
        PIECE_VALUES[move.piece.toUpperCase() as keyof typeof PIECE_VALUES] ||
        0;

      if (movingValue < capturedValue) {
        score += chess.turn() === "w" ? -capturedValue : capturedValue;
      } else if (movingValue > capturedValue) {
        score += chess.turn() === "w" ? capturedValue : -capturedValue;
      }
    }
  }

  return score;
}

function countPieces(board: string): number {
  let count = 0;
  for (const char of board) {
    if (char.match(/[rnbqkp]/i)) count++;
  }
  return count;
}

function getPSQTValue(
  piece: string,
  square: number,
  isWhite: boolean,
  isEndgame: boolean
): number {
  const file = square % 8;
  const rank = Math.floor(square / 8);
  const index = isWhite ? square : 63 - square;

  switch (piece) {
    case "p":
      return PAWN_PSQT[index];
    case "n":
      return KNIGHT_PSQT[index];
    case "b":
      return BISHOP_PSQT[index];
    case "r":
      return ROOK_PSQT[index];
    case "q":
      return QUEEN_PSQT[index];
    case "k":
      return isEndgame ? KING_END_PSQT[index] : KING_MIDDLE_PSQT[index];
    default:
      return 0;
  }
}

// Static Exchange Evaluation (very simplified)
function simpleSEE(chess: Chess, move: any): number {
  // Approximate: gain = capturedValue - movingValue
  const captured = move.captured
    ? PIECE_VALUES[move.captured.toUpperCase() as keyof typeof PIECE_VALUES] ||
      0
    : 0;
  const moving =
    PIECE_VALUES[move.piece.toUpperCase() as keyof typeof PIECE_VALUES] || 0;
  return captured - moving;
}

// Quiescence search for tactical positions
function quiescence(
  chess: Chess,
  alpha: number,
  beta: number,
  startTime: number,
  maxTimeMs: number
): number {
  if (Date.now() - startTime > maxTimeMs) {
    throw new Error("Time limit exceeded");
  }

  const standPat = evaluatePosition(chess);
  if (standPat >= beta) return beta;

  alpha = Math.max(alpha, standPat);

  const moves = chess.moves({ verbose: true }).filter((move) => move.captured);
  if (moves.length === 0) return standPat;

  const orderedMoves = orderMoves(moves, chess).filter(
    (m) => simpleSEE(chess, m) >= -50
  );

  for (const move of orderedMoves) {
    const chessCopy = new Chess(chess.fen());
    chessCopy.move(move);

    const score = -quiescence(chessCopy, -beta, -alpha, startTime, maxTimeMs);

    if (score >= beta) return beta;
    alpha = Math.max(alpha, score);
  }

  return alpha;
}

// Advanced move ordering
function orderMoves(moves: any[], chess: Chess, depth?: number): any[] {
  const fen = chess.fen();
  const tt = transpositionTable.get(fen);
  const ttBest = tt?.bestMove;
  const killers = depth !== undefined ? killerMoves[depth] || [] : [];

  return moves.sort((a, b) => {
    const aKey = moveKey(a);
    const bKey = moveKey(b);

    // 1) Transposition table best move first
    if (ttBest) {
      if (aKey === ttBest && bKey !== ttBest) return -1;
      if (bKey === ttBest && aKey !== ttBest) return 1;
    }

    // 2) Captures by MVV-LVA
    const aCapture = a.captured
      ? PIECE_VALUES[a.captured.toUpperCase() as keyof typeof PIECE_VALUES] || 0
      : 0;
    const bCapture = b.captured
      ? PIECE_VALUES[b.captured.toUpperCase() as keyof typeof PIECE_VALUES] || 0
      : 0;
    if (aCapture !== bCapture) return bCapture - aCapture;

    // 3) Killer moves (non-captures only)
    const aIsKiller = killers.includes(aKey) && !a.captured;
    const bIsKiller = killers.includes(bKey) && !b.captured;
    if (aIsKiller !== bIsKiller) return aIsKiller ? -1 : 1;

    // 4) Checks
    if (a.san.includes("+") && !b.san.includes("+")) return -1;
    if (!a.san.includes("+") && b.san.includes("+")) return 1;

    // 5) History heuristic
    const aHist = moveHistory.get(aKey) || 0;
    const bHist = moveHistory.get(bKey) || 0;
    if (aHist !== bHist) return bHist - aHist;

    // 6) Pawn moves
    if (a.piece === "p" && b.piece !== "p") return -1;
    if (a.piece !== "p" && b.piece === "p") return 1;

    return 0;
  });
}

// Advanced minimax with alpha-beta pruning
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  startTime: number,
  maxTimeMs: number,
  ply: number = 0
): number {
  if (Date.now() - startTime > maxTimeMs) {
    throw new Error("Time limit exceeded");
  }

  const fen = chess.fen();
  const ttEntry = transpositionTable.get(fen);
  if (ttEntry && ttEntry.depth >= depth) {
    return ttEntry.score;
  }

  if (depth === 0) {
    return quiescence(chess, alpha, beta, startTime, maxTimeMs);
  }

  if (chess.isGameOver()) {
    return evaluatePosition(chess);
  }

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return evaluatePosition(chess);

  const orderedMoves = orderMoves(moves, chess, ply);
  let bestScore = maximizing ? -Infinity : Infinity;
  let flag = "exact";
  let bestMoveKey = "";

  let moveIndex = 0;
  for (const move of orderedMoves) {
    const chessCopy = new Chess(chess.fen());
    chessCopy.move(move);

    // Late Move Reductions (very simple): reduce depth for quiet late moves
    let nextDepth = depth - 1;
    const isCapture = !!move.captured;
    const isCheck = move.san.includes("+");
    if (!isCapture && !isCheck && moveIndex > 3 && depth >= 3) {
      nextDepth = depth - 2; // small reduction
    }

    let score: number;
    if (moveIndex === 0) {
      // Full window on first move
      score = minimax(
        chessCopy,
        nextDepth,
        alpha,
        beta,
        !maximizing,
        startTime,
        maxTimeMs,
        ply + 1
      );
    } else {
      // PVS: try a narrow window first
      score = minimax(
        chessCopy,
        nextDepth,
        alpha,
        alpha + 1,
        !maximizing,
        startTime,
        maxTimeMs,
        ply + 1
      );
      if (score > alpha && score < beta) {
        // re-search with full window if it fails high
        score = minimax(
          chessCopy,
          nextDepth,
          alpha,
          beta,
          !maximizing,
          startTime,
          maxTimeMs,
          ply + 1
        );
      }
    }

    // Null-move pruning attempt
    const nullScore = nullMovePrune(
      chess,
      depth,
      alpha,
      beta,
      startTime,
      maxTimeMs,
      ply
    );
    if (nullScore !== null) {
      transpositionTable.set(fen, {
        score: nullScore,
        depth,
        flag: "lowerbound",
        bestMove: "",
      });
      return nullScore;
    }

    if (maximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMoveKey = moveKey(move);
        // History heuristic reward
        moveHistory.set(
          bestMoveKey,
          (moveHistory.get(bestMoveKey) || 0) + depth * depth
        );
        if (score >= beta) {
          flag = "lowerbound";
          // Killer move storage for non-captures
          if (!isCapture) {
            const killers = killerMoves[ply] || [];
            if (!killers.includes(bestMoveKey)) {
              killerMoves[ply] = [
                bestMoveKey,
                ...(killers[0] ? [killers[0]] : []),
              ].slice(0, 2);
            }
          }
          break;
        }
        if (score > alpha) {
          alpha = score;
          flag = "exact";
        }
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMoveKey = moveKey(move);
        moveHistory.set(
          bestMoveKey,
          (moveHistory.get(bestMoveKey) || 0) + depth * depth
        );
        if (score <= alpha) {
          flag = "upperbound";
          if (!isCapture) {
            const killers = killerMoves[ply] || [];
            if (!killers.includes(bestMoveKey)) {
              killerMoves[ply] = [
                bestMoveKey,
                ...(killers[0] ? [killers[0]] : []),
              ].slice(0, 2);
            }
          }
          break;
        }
        if (score < beta) {
          beta = score;
          flag = "exact";
        }
      }
    }

    moveIndex++;
  }

  transpositionTable.set(fen, {
    score: bestScore,
    depth,
    flag,
    bestMove: bestMoveKey,
  });
  return bestScore;
}

// Null-move pruning helper
function nullMovePrune(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  startTime: number,
  maxTimeMs: number,
  ply: number
): number | null {
  // Skip in endgame or if side to move in check
  if (depth < 3 || chess.isCheck()) return null;
  // Make a null move by toggling side to move in FEN
  const fen = chess.fen().split(" ");
  fen[1] = fen[1] === "w" ? "b" : "w";
  fen[3] = "-"; // clear en passant
  const reducedDepth = depth - 2;
  try {
    const copy = new Chess(fen.join(" "));
    const score = -minimax(
      copy,
      reducedDepth - 1,
      -beta,
      -beta + 1,
      false,
      startTime,
      maxTimeMs,
      ply + 1
    );
    if (score >= beta) return score; // prune
  } catch {}
  return null;
}

// Get best move with iterative deepening
function getBestMove(
  chess: Chess,
  maxDepth: number,
  maxTimeMs: number
): { move: any; evaluation: number } | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Check opening book for first few moves
  const fen = chess.fen();
  const moveNumber = parseInt(fen.split(" ")[5]) || 1;

  if (moveNumber <= 4 && OPENING_MOVES[fen as keyof typeof OPENING_MOVES]) {
    const openingMoves = OPENING_MOVES[fen as keyof typeof OPENING_MOVES];
    const openingMove = openingMoves[0];
    const move = moves.find(
      (m) => `${m.from}${m.to}${m.promotion || ""}` === openingMove
    );
    if (move) {
      return { move, evaluation: 0 };
    }
  }

  const startTime = Date.now();
  let bestMove = moves[0];
  let bestEval = chess.turn() === "w" ? -Infinity : Infinity;

  // Iterative deepening with aspiration windows
  let window = 50; // 0.5 pawns
  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      let alpha = bestEval - window;
      let beta = bestEval + window;
      for (const move of moves) {
        const chessCopy = new Chess(chess.fen());
        chessCopy.move(move);

        let evaluation = minimax(
          chessCopy,
          depth - 1,
          alpha,
          beta,
          chessCopy.turn() === "b",
          startTime,
          maxTimeMs
        );

        // If failed low/high, re-search with full window
        if (evaluation <= alpha || evaluation >= beta) {
          evaluation = minimax(
            chessCopy,
            depth - 1,
            -Infinity,
            Infinity,
            chessCopy.turn() === "b",
            startTime,
            maxTimeMs
          );
          window = Math.min(400, window * 2);
        } else {
          window = Math.max(25, Math.floor(window * 0.9));
        }

        if (chess.turn() === "w") {
          if (evaluation > bestEval) {
            bestEval = evaluation;
            bestMove = move;
          }
        } else {
          if (evaluation < bestEval) {
            bestEval = evaluation;
            bestMove = move;
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Time limit exceeded") {
        break;
      }
      throw error;
    }
  }

  return { move: bestMove, evaluation: bestEval };
}

// Skill-based move selection
function selectMoveWithSkill(
  bestMove: any,
  skillLevel: number,
  chess: Chess
): any {
  const moves = chess.moves({ verbose: true });
  if (moves.length <= 1) return bestMove;

  // Very low randomness for high skill levels
  const randomnessThreshold = Math.max(0.01, 0.1 - skillLevel / 20);

  if (Math.random() < randomnessThreshold) {
    const topMoveCount = Math.min(3, moves.length);
    const topMoves = moves.slice(0, topMoveCount);

    const validMoves = topMoves.filter((move) => {
      const chessCopy = new Chess(chess.fen());
      chessCopy.move(move);
      const evaluation = evaluatePosition(chessCopy);
      return Math.abs(evaluation) < 200;
    });

    if (validMoves.length > 0) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
  }

  return bestMove;
}

// Advanced chess AI engine
export class AdvancedChessAI {
  private chess: Chess;

  constructor() {
    this.chess = new Chess();
  }

  async initialize(): Promise<void> {
    console.log("🔧 AdvancedChessAI: Initialized");
  }

  setOptions(config?: EngineConfig) {}

  setPosition(fen: string) {
    this.chess = new Chess(fen);
  }

  async analyzePosition(
    fen: string,
    config?: EngineConfig
  ): Promise<EngineAnalysis> {
    try {
      this.setPosition(fen);

      const skillLevel = config?.skillLevel ?? DEFAULT_ENGINE_CONFIG.skillLevel;
      const maxDepth = config?.maxDepth ?? DEFAULT_ENGINE_CONFIG.maxDepth;
      const maxTimeMs = config?.maxTimeMs ?? DEFAULT_ENGINE_CONFIG.maxTimeMs;

      const startTime = Date.now();

      const result = searchBestMove(this.chess, maxDepth, maxTimeMs);

      if (!result) {
        return {
          bestMove: null,
          evaluation: 0,
          depth: maxDepth,
          nodesSearched: engineTT.size,
          timeMs: Date.now() - startTime,
        };
      }

      const { move, evaluation } = result;

      const finalMove = selectMoveWithSkill(move, skillLevel, this.chess);

      const engineMove: EngineMove = {
        from: finalMove.from,
        to: finalMove.to,
        piece: finalMove.piece,
        promotion: finalMove.promotion,
        isCapture: finalMove.captured !== undefined,
        isCheck: finalMove.san.includes("+"),
        isCheckmate: finalMove.san.includes("#"),
      };

      return {
        bestMove: engineMove,
        evaluation,
        depth: maxDepth,
        nodesSearched: engineTT.size,
        timeMs: Date.now() - startTime,
        pv: [engineMove],
      };
    } catch (error) {
      console.error("🔧 AdvancedChessAI: Error in analyzePosition:", error);
      return {
        bestMove: null,
        evaluation: 0,
        depth: 0,
        nodesSearched: 0,
        timeMs: 0,
      };
    }
  }

  async getBestMove(
    fen: string,
    depth: number = 6,
    maxTimeMs: number = 1500
  ): Promise<string | null> {
    const analysis = await this.analyzePosition(fen, {
      maxDepth: depth,
      maxTimeMs,
    });
    return analysis.bestMove
      ? `${analysis.bestMove.from}${analysis.bestMove.to}${
          analysis.bestMove.promotion ?? ""
        }`
      : null;
  }

  async evaluatePosition(
    fen: string,
    maxTimeMs: number = 500
  ): Promise<number> {
    const analysis = await this.analyzePosition(fen, { maxTimeMs });
    return analysis.evaluation;
  }

  destroy() {
    console.log("🔧 AdvancedChessAI: Destroyed");
    engineTT.clear();
  }
}

export const advancedChessAI = new AdvancedChessAI();
