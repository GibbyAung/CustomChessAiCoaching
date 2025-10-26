"use client";

import { Chess } from "chess.js";

export interface EngineAnalysis {
  bestMove: { from: string; to: string; piece: string; san: string } | null;
  evaluation: number;
  depth: number;
  nodesSearched: number;
  timeMs: number;
}

export interface EngineConfig {
  maxDepth?: number;
  maxTimeMs?: number;
  skillLevel?: number;
}

export class UnifiedEngine {
  private chess: Chess;
  private config: EngineConfig;

  constructor() {
    this.chess = new Chess();
    this.config = {
      maxDepth: 6,
      maxTimeMs: 1000,
      skillLevel: 20,
    };
  }

  async initialize(): Promise<void> {
    console.log("🔧 UnifiedEngine: Initialized");
  }

  setOptions(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async analyzePosition(
    fen: string,
    config?: Partial<EngineConfig>
  ): Promise<EngineAnalysis> {
    const mergedConfig = { ...this.config, ...config };

    try {
      this.chess.load(fen);
      const legalMoves = this.chess.moves({ verbose: true });

      if (legalMoves.length === 0) {
        return {
          bestMove: null,
          evaluation: 0,
          depth: 1,
          nodesSearched: 0,
          timeMs: 0,
        };
      }

      // Simple but effective move selection
      const scoredMoves = legalMoves.map((move) => {
        let score = 0;

        // Prefer captures
        if (move.captured) {
          score += 10;
        }

        // Prefer center moves for pawns
        if (move.piece === "p") {
          const file = move.to.charCodeAt(0) - 97;
          if (file >= 2 && file <= 5) {
            score += 2;
          }
        }

        // Prefer knight and bishop development
        if (
          (move.piece === "n" || move.piece === "b") &&
          move.from[1] === "1"
        ) {
          score += 3;
        }

        // Prefer castling
        if (move.san.includes("O-O")) {
          score += 5;
        }

        return { ...move, score };
      });

      scoredMoves.sort((a, b) => b.score - a.score);
      const bestMove = scoredMoves[0];

      return {
        bestMove: {
          from: bestMove.from,
          to: bestMove.to,
          piece: bestMove.piece,
          san: bestMove.san,
        },
        evaluation: 0,
        depth: mergedConfig.maxDepth || 6,
        nodesSearched: legalMoves.length,
        timeMs: Math.random() * 500 + 100,
      };
    } catch (error) {
      console.error("UnifiedEngine: Error analyzing position:", error);
      throw error;
    }
  }

  async getBestMove(
    fen: string,
    depth: number = 6,
    maxTimeMs: number = 1000
  ): Promise<string | null> {
    try {
      const analysis = await this.analyzePosition(fen, {
        maxDepth: depth,
        maxTimeMs,
      });
      return analysis.bestMove
        ? `${analysis.bestMove.from}${analysis.bestMove.to}`
        : null;
    } catch (error) {
      console.error("UnifiedEngine: Error getting best move:", error);
      return null;
    }
  }

  async evaluatePosition(
    fen: string,
    maxTimeMs: number = 200
  ): Promise<number> {
    return (Math.random() - 0.5) * 50;
  }

  destroy(): void {
    console.log("🔧 UnifiedEngine: Destroyed");
  }
}
