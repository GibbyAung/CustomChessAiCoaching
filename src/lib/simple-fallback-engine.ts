"use client";

import { Chess } from "chess.js";

export interface FallbackEngineConfig {
  maxDepth?: number;
  maxTimeMs?: number;
  skillLevel?: number;
}

export class SimpleFallbackEngine {
  private chess: Chess;
  private config: FallbackEngineConfig;

  constructor() {
    this.chess = new Chess();
    this.config = {
      maxDepth: 3,
      maxTimeMs: 1000,
      skillLevel: 5,
    };
  }

  async initialize(): Promise<void> {
    // Simple fallback engine doesn't need initialization
    console.log("🔧 SimpleFallbackEngine: Initialized");
  }

  setOptions(config: Partial<FallbackEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async analyzePosition(
    fen: string,
    config?: Partial<FallbackEngineConfig>
  ): Promise<{
    bestMove: { from: string; to: string; piece: string; san: string } | null;
    evaluation: number;
    depth: number;
    nodesSearched: number;
    timeMs: number;
  }> {
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

      // Simple evaluation: prefer captures and center moves
      const scoredMoves = legalMoves.map((move) => {
        let score = 0;

        // Prefer captures
        if (move.captured) {
          score += 10;
        }

        // Prefer center moves for pawns
        if (move.piece === "p") {
          const file = move.to.charCodeAt(0) - 97; // a=0, b=1, etc.
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

      // Sort by score and pick the best move
      scoredMoves.sort((a, b) => b.score - a.score);
      const bestMove = scoredMoves[0];

      return {
        bestMove: {
          from: bestMove.from,
          to: bestMove.to,
          piece: bestMove.piece,
          san: bestMove.san,
        },
        evaluation: 0, // Simple engine doesn't provide evaluation
        depth: mergedConfig.maxDepth || 3,
        nodesSearched: legalMoves.length,
        timeMs: Math.random() * 500 + 100, // Simulate thinking time
      };
    } catch (error) {
      console.error("SimpleFallbackEngine: Error analyzing position:", error);
      throw error;
    }
  }

  async getBestMove(
    fen: string,
    depth: number = 3,
    maxTimeMs: number = 1000
  ): Promise<string | null> {
    try {
      const analysis = await this.analyzePosition(fen, {
        maxDepth: depth,
      });
      return analysis.bestMove
        ? `${analysis.bestMove.from}${analysis.bestMove.to}`
        : null;
    } catch (error) {
      console.error("SimpleFallbackEngine: Error getting best move:", error);
      return null;
    }
  }

  async evaluatePosition(
    fen: string,
    maxTimeMs: number = 200
  ): Promise<number> {
    // Simple fallback engine doesn't provide evaluation
    // Return a random small value to indicate uncertainty
    return (Math.random() - 0.5) * 50;
  }

  destroy(): void {
    // Nothing to clean up
    console.log("🔧 SimpleFallbackEngine: Destroyed");
  }
}

export const simpleFallbackEngine = new SimpleFallbackEngine();
