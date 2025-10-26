"use client";

import { Chess } from "chess.js";
import { getBestMove } from "./search";
import { evaluatePosition } from "./evaluation";
import { DEFAULT_ENGINE_CONFIG } from "./constants";
import type { EngineConfig, EngineAnalysis } from "./types";

export class AdvancedChessAI {
  private chess: Chess;
  private config: EngineConfig;

  constructor() {
    this.chess = new Chess();
    this.config = { ...DEFAULT_ENGINE_CONFIG };
  }

  async initialize(): Promise<void> {
    console.log("🔧 AdvancedChessAI: Initialized");
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

      const startTime = Date.now();
      const result = getBestMove(
        this.chess,
        mergedConfig.maxDepth || 12,
        mergedConfig.maxTimeMs || 2000
      );
      const timeMs = Date.now() - startTime;

      if (!result) {
        return {
          bestMove: null,
          evaluation: 0,
          depth: 1,
          nodesSearched: 0,
          timeMs,
        };
      }

      return {
        bestMove: result.move,
        evaluation: result.evaluation,
        depth: mergedConfig.maxDepth || 12,
        nodesSearched: 0, // Not tracked in current implementation
        timeMs,
      };
    } catch (error) {
      console.error("AdvancedChessAI: Error analyzing position:", error);
      throw error;
    }
  }

  async getBestMove(
    fen: string,
    depth: number = 12,
    maxTimeMs: number = 2000
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
      console.error("AdvancedChessAI: Error getting best move:", error);
      return null;
    }
  }

  async evaluatePosition(
    fen: string,
    maxTimeMs: number = 400
  ): Promise<number> {
    try {
      this.chess.load(fen);
      return evaluatePosition(this.chess);
    } catch (error) {
      console.error("AdvancedChessAI: Error evaluating position:", error);
      return 0;
    }
  }

  destroy(): void {
    console.log("🔧 AdvancedChessAI: Destroyed");
  }
}
