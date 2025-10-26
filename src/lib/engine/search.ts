import { Chess } from "chess.js";
import { OPENING_MOVES } from "./constants";
import {
  orderMoves,
  killerMoves,
  moveHistory,
  moveKey,
  simpleSEE,
} from "./moveOrdering";
import { evaluatePosition } from "./evaluation";

export const transpositionTable = new Map<
  string,
  { score: number; depth: number; flag: string; bestMove?: string }
>();

export function quiescence(
  chess: Chess,
  alpha: number,
  beta: number,
  startTime: number,
  maxTimeMs: number
): number {
  if (Date.now() - startTime > maxTimeMs)
    throw new Error("Time limit exceeded");
  const standPat = evaluatePosition(chess);
  if (standPat >= beta) return beta;
  alpha = Math.max(alpha, standPat);
  const moves = chess.moves({ verbose: true }).filter((m) => m.captured);
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

function nullMovePrune(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  startTime: number,
  maxTimeMs: number,
  ply: number
): number | null {
  if (depth < 3 || chess.isCheck()) return null;
  const fen = chess.fen().split(" ");
  fen[1] = fen[1] === "w" ? "b" : "w";
  fen[3] = "-";
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
    if (score >= beta) return score;
  } catch {}
  return null;
}

export function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  startTime: number,
  maxTimeMs: number,
  ply: number = 0
): number {
  if (Date.now() - startTime > maxTimeMs)
    throw new Error("Time limit exceeded");

  const fen = chess.fen();
  const ttEntry = transpositionTable.get(fen);
  if (ttEntry && ttEntry.depth >= depth) return ttEntry.score;

  if (depth === 0) return quiescence(chess, alpha, beta, startTime, maxTimeMs);
  if (chess.isGameOver()) return evaluatePosition(chess);

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return evaluatePosition(chess);

  const ttBest = ttEntry?.bestMove;
  const orderedMoves = orderMoves(moves, chess, ply, ttBest);

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

  let bestScore = maximizing ? -Infinity : Infinity;
  let flag = "exact";
  let bestMoveKey = "";

  let moveIndex = 0;
  for (const move of orderedMoves) {
    const chessCopy = new Chess(chess.fen());
    chessCopy.move(move);

    let nextDepth = depth - 1;
    const isCapture = !!move.captured;
    const isCheck = move.san.includes("+");
    if (isCheck && depth > 1) {
      nextDepth = Math.max(nextDepth, depth); // check extension
    }
    if (!isCapture && !isCheck && moveIndex > 3 && depth >= 3)
      nextDepth = depth - 2;

    let score: number;
    if (moveIndex === 0) {
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

    if (maximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMoveKey = moveKey(move);
        moveHistory.set(
          bestMoveKey,
          (moveHistory.get(bestMoveKey) || 0) + depth * depth
        );
        if (score >= beta) {
          flag = "lowerbound";
          if (!isCapture) {
            const killers = killerMoves[ply] || [];
            if (!killers.includes(bestMoveKey))
              killerMoves[ply] = [
                bestMoveKey,
                ...(killers[0] ? [killers[0]] : []),
              ].slice(0, 2);
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
            if (!killers.includes(bestMoveKey))
              killerMoves[ply] = [
                bestMoveKey,
                ...(killers[0] ? [killers[0]] : []),
              ].slice(0, 2);
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

export function getBestMove(
  chess: Chess,
  maxDepth: number,
  maxTimeMs: number
): { move: any; evaluation: number } | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  const fen = chess.fen();
  const moveNumber = parseInt(fen.split(" ")[5]) || 1;
  if (moveNumber <= 4 && OPENING_MOVES[fen]) {
    const openingMove = OPENING_MOVES[fen][0];
    const move = moves.find(
      (m) => `${m.from}${m.to}${m.promotion || ""}` === openingMove
    );
    if (move) return { move, evaluation: 0 };
  }

  const startTime = Date.now();

  // Root-level filters and priorities:
  // 1) Avoid immediate queen drops
  let candidates = moves.filter((m) => !isImmediateQueenDrop(chess, m));
  // 2) Avoid allowing opponent mate in one
  const avoidMate = candidates.filter((m) => !allowsMateInOne(chess, m));
  if (avoidMate.length > 0) candidates = avoidMate;
  // 3) Avoid immediate minor-piece drops (prevents ...Ne5?? dxe5)
  const avoidMinor = candidates.filter((m) => !isImmediateMinorDrop(chess, m));
  if (avoidMinor.length > 0) candidates = avoidMinor;
  // 4) Prefer capturing a hanging opponent queen
  const queenCapture = candidates.find((m) =>
    isCapturingOpponentQueenSafely(chess, m)
  );
  const rootMoves = candidates.length > 0 ? candidates : moves;

  let bestMove = rootMoves[0];
  let bestEval = chess.turn() === "w" ? -Infinity : Infinity;
  let window = 50;

  if (queenCapture) {
    bestMove = queenCapture;
  }

  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      let alpha = bestEval - window;
      let beta = bestEval + window;
      for (const move of rootMoves) {
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
    } catch (e: any) {
      if (e?.message === "Time limit exceeded") break;
      throw e;
    }
  }
  return { move: bestMove, evaluation: bestEval };
}

// Detect if a root move allows the opponent to immediately capture our queen profitably
function isImmediateQueenDrop(chess: Chess, move: any): boolean {
  const after = new Chess(chess.fen());
  after.move(move);
  const oppMoves = after.moves({ verbose: true }) as any[];
  for (const m of oppMoves) {
    if (m.captured === "q") {
      // If opponent can capture a queen right away and SEE is not terrible for them, treat as drop
      const see = simpleSEE(after, m);
      if (see >= -50) return true;
    }
  }
  return false;
}

function isImmediateMinorDrop(chess: Chess, move: any): boolean {
  const after = new Chess(chess.fen());
  after.move(move);
  const oppMoves = after.moves({ verbose: true }) as any[];
  for (const m of oppMoves) {
    if (m.captured === "n" || m.captured === "b") {
      const see = simpleSEE(after, m);
      if (see >= -10) return true;
    }
  }
  return false;
}

// Does this move allow opponent to deliver mate in one on the next move?
function allowsMateInOne(chess: Chess, move: any): boolean {
  const after = new Chess(chess.fen());
  after.move(move);
  const oppMoves = after.moves({ verbose: true }) as any[];
  for (const m of oppMoves) {
    const next = new Chess(after.fen());
    next.move(m);
    if (next.isCheckmate()) return true;
  }
  return false;
}

// Is this move safely capturing the opponent queen (good SEE)?
function isCapturingOpponentQueenSafely(chess: Chess, move: any): boolean {
  const after = new Chess(chess.fen());
  after.move(move);
  // If our move captured a queen already
  if (move.captured === "q") {
    const see = simpleSEE(chess, move);
    return see >= 0;
  }
  // Or if on next move we can capture their queen safely
  const ourNextMoves = after.moves({ verbose: true }) as any[];
  for (const nm of ourNextMoves) {
    if (nm.captured === "q" && simpleSEE(after, nm) >= 0) return true;
  }
  return false;
}
