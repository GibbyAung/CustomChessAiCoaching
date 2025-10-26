import { Chess } from "chess.js";
import {
  PIECE_VALUES,
  PAWN_PSQT,
  KNIGHT_PSQT,
  BISHOP_PSQT,
  ROOK_PSQT,
  QUEEN_PSQT,
  KING_MIDDLE_PSQT,
  KING_END_PSQT,
} from "./constants";
import { simpleSEE } from "./moveOrdering";

export function evaluatePosition(chess: Chess): number {
  const fen = chess.fen();
  const board = fen.split(" ")[0];
  const isEndgame = countPieces(board) <= 12;
  const moveNumber = getMoveNumber(fen);

  let score = 0;
  let squareIndex = 0;

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
    score += value;
    const psqtValue = getPSQTValue(piece, squareIndex, isWhite, isEndgame);
    score += isWhite ? psqtValue : -psqtValue;
    squareIndex++;
  }

  score += evaluateMobility(chess);
  score += evaluatePawnStructure(chess);
  score += evaluatePieceFeatures(chess);
  score += evaluateCenterControl(chess);
  score += evaluateDevelopment(chess, moveNumber);
  score += evaluateEarlyRooks(chess, moveNumber);
  score += evaluateKingShield(chess, isEndgame);
  score += evaluateQueenSafety(chess);

  if (chess.isCheck()) score += chess.turn() === "w" ? -500 : 500;
  if (chess.isCheckmate()) score += chess.turn() === "w" ? -10000 : 10000;
  if (chess.isStalemate()) score = 0;

  score += evaluateHangingPieces(chess);
  return score;
}

export function evaluateMobility(chess: Chess): number {
  const whiteMoves = chess.moves().length;
  const chessCopy = new Chess(chess.fen());
  const fenParts = chess.fen().split(" ");
  fenParts[1] = "b";
  fenParts[3] = "-";
  try {
    chessCopy.load(fenParts.join(" "));
    const blackMoves = chessCopy.moves().length;
    return (blackMoves - whiteMoves) * 10;
  } catch {
    return 0;
  }
}

export function evaluatePawnStructure(chess: Chess): number {
  let score = 0;
  const fen = chess.fen();
  const board = fen.split(" ")[0];
  const filePawnsWhite: number[] = Array(8).fill(0);
  const filePawnsBlack: number[] = Array(8).fill(0);
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
  for (let file = 0; file < 8; file++) {
    const left = file > 0 ? file - 1 : -1;
    const right = file < 7 ? file + 1 : -1;
    const wNeighbors =
      (left >= 0 ? filePawnsWhite[left] : 0) +
      (right >= 0 ? filePawnsWhite[right] : 0);
    const bNeighbors =
      (left >= 0 ? filePawnsBlack[left] : 0) +
      (right >= 0 ? filePawnsBlack[right] : 0);
    if (filePawnsWhite[file] > 0 && wNeighbors === 0) score -= 15;
    if (filePawnsBlack[file] > 0 && bNeighbors === 0) score += 15;
    if (filePawnsWhite[file] > 0) {
      const hasOppSame = filePawnsBlack[file] > 0;
      const hasOppAdjacent =
        (left >= 0 && filePawnsBlack[left] > 0) ||
        (right >= 0 && filePawnsBlack[right] > 0);
      if (!hasOppSame && !hasOppAdjacent) score += 40;
    }
    if (filePawnsBlack[file] > 0) {
      const hasOppSame = filePawnsWhite[file] > 0;
      const hasOppAdjacent =
        (left >= 0 && filePawnsWhite[left] > 0) ||
        (right >= 0 && filePawnsWhite[right] > 0);
      if (!hasOppSame && !hasOppAdjacent) score -= 40;
    }
  }
  return score;
}

export function evaluatePieceFeatures(chess: Chess): number {
  let score = 0;
  const fen = chess.fen();
  const board = fen.split(" ")[0];
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
  if (wBishops >= 2) score += 40;
  if (bBishops >= 2) score -= 40;
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

export function evaluateCenterControl(chess: Chess): number {
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

export function evaluateHangingPieces(chess: Chess): number {
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
      if (movingValue < capturedValue)
        score += chess.turn() === "w" ? -capturedValue : capturedValue;
      else if (movingValue > capturedValue)
        score += chess.turn() === "w" ? capturedValue : -capturedValue;
    }
  }
  return score;
}

export function countPieces(board: string): number {
  let count = 0;
  for (const char of board) if (char.match(/[rnbqkp]/i)) count++;
  return count;
}

function getMoveNumber(fen: string): number {
  const parts = fen.split(" ");
  const ply = parseInt(parts[5] || "1");
  return isNaN(ply) ? 1 : ply;
}

export function getPSQTValue(
  piece: string,
  square: number,
  isWhite: boolean,
  isEndgame: boolean
): number {
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

// Encourage developing knights/bishops early; penalize being stuck on back rank in opening
function evaluateDevelopment(chess: Chess, moveNumber: number): number {
  if (moveNumber > 12) return 0;
  const board = chess.fen().split(" ")[0];
  let score = 0;
  // White undeveloped minors on back rank
  const whiteBack = board.slice(0, 8);
  const blackBack = board.slice(-8);
  const countChar = (row: string, c: string) =>
    (row.match(new RegExp(c, "g")) || []).length;
  // Compressed FEN rows contain digits; expand roughly by treating digits as empties
  const expandRow = (row: string) =>
    row.replace(/[1-8]/g, (d) => ".".repeat(parseInt(d)));
  const wRow = expandRow(whiteBack);
  const bRow = expandRow(blackBack);
  const wUndeveloped = countChar(wRow, "N") + countChar(wRow, "B");
  const bUndeveloped = countChar(bRow, "n") + countChar(bRow, "b");
  // Penalize each undeveloped minor slightly
  score += -15 * wUndeveloped;
  score += 15 * bUndeveloped;
  return score;
}

// Penalize early rook lifts that aren't captures/checks (heuristic via placement)
function evaluateEarlyRooks(chess: Chess, moveNumber: number): number {
  if (moveNumber > 12) return 0;
  const b = chess.board();
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq: any = b[r][f];
      if (!sq) continue;
      if (sq.type === "r") {
        // White rooks on ranks 3-5 early are suspicious
        if (sq.color === "w") {
          const rankFromBottom = 8 - r; // a8 row r=0
          if (rankFromBottom >= 4 && rankFromBottom <= 6) score -= 12;
        } else {
          const rankFromTop = r + 1;
          if (rankFromTop >= 3 && rankFromTop <= 5) score += 12;
        }
      }
    }
  }
  return score;
}

// Basic king shield and castling awareness
function evaluateKingShield(chess: Chess, isEndgame: boolean): number {
  if (isEndgame) return 0;
  const board = chess.board();
  let score = 0;
  // Detect white king location
  let wk: { r: number; f: number } | null = null;
  let bk: { r: number; f: number } | null = null;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq: any = board[r][f];
      if (sq && sq.type === "k") {
        if (sq.color === "w") wk = { r, f };
        else bk = { r, f };
      }
    }
  }
  const pawnAt = (color: "w" | "b", r: number, f: number) => {
    if (r < 0 || r > 7 || f < 0 || f > 7) return false;
    const sq: any = board[r][f];
    return sq && sq.type === "p" && sq.color === color;
  };
  // White castled king at g1 or c1
  if (wk) {
    const g1 = wk.r === 7 && wk.f === 6;
    const c1 = wk.r === 7 && wk.f === 2;
    if (g1) {
      // Shield pawns f2,g2,h2
      if (pawnAt("w", 6, 5)) score += 10;
      if (pawnAt("w", 6, 6)) score += 12;
      if (pawnAt("w", 6, 7)) score += 8;
    } else if (c1) {
      // Shield pawns a2,b2,c2
      if (pawnAt("w", 6, 0)) score += 8;
      if (pawnAt("w", 6, 1)) score += 12;
      if (pawnAt("w", 6, 2)) score += 10;
    } else {
      // Not castled by midgame -> slight penalty
      score -= 10;
    }
  }
  // Black castled king at g8 or c8
  if (bk) {
    const g8 = bk.r === 0 && bk.f === 6;
    const c8 = bk.r === 0 && bk.f === 2;
    if (g8) {
      if (pawnAt("b", 1, 5)) score -= 10;
      if (pawnAt("b", 1, 6)) score -= 12;
      if (pawnAt("b", 1, 7)) score -= 8;
    } else if (c8) {
      if (pawnAt("b", 1, 0)) score -= 8;
      if (pawnAt("b", 1, 1)) score -= 12;
      if (pawnAt("b", 1, 2)) score -= 10;
    } else {
      score += 10;
    }
  }
  return score;
}

// Heavy penalty if a side's queen can be captured immediately without significant loss
function evaluateQueenSafety(chess: Chess): number {
  let score = 0;
  const fen = chess.fen();
  const parts = fen.split(" ");
  const toMove = parts[1];

  // Helper to check immediate queen capture for a given side
  const queenHangPenalty = (color: "w" | "b"): number => {
    const after = new Chess(fen);
    // Generate opponent moves (opponent relative to `color`)
    if (after.turn() !== color) {
      // Ensure it's `color` to move so we can flip turn to opponent consistently
      // Toggle side to move in FEN
      const f = parts.slice();
      f[1] = color;
      try {
        after.load(f.join(" "));
      } catch {}
    }
    // Now simulate opponent perspective by switching turn
    const toggle = parts.slice();
    toggle[1] = color === "w" ? "b" : "w";
    let opp: Chess;
    try {
      opp = new Chess(toggle.join(" "));
    } catch {
      opp = new Chess(fen);
    }
    const oppMoves = opp.moves({ verbose: true }) as any[];
    for (const m of oppMoves) {
      if (m.captured === "q") {
        const see = simpleSEE(opp, m);
        if (see >= -50) {
          // Penalize heavily: losing a queen
          return color === "w" ? -2000 : 2000;
        }
      }
    }
    return 0;
  };

  score += queenHangPenalty("w");
  score += queenHangPenalty("b");
  return score;
}
