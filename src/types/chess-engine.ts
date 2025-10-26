import { Move } from "chess.js";

export interface GameState {
  fen: string;
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  turn: "w" | "b";
  moveHistory: Move[];
}

export interface AnalysisResult {
  bestMove: string;
  evaluation: number;
  depth: number;
  timeMs: number;
}

export interface EngineConfig {
  maxDepth?: number;
  maxTimeMs?: number;
}

export interface UCIOptions {
  skillLevel: number;
  threads: number;
  hash: number;
  contempt: number;
  ponder: boolean;
  multiPV: number;
  uciLimitStrength: boolean;
  uciShowWDL: boolean;
}
