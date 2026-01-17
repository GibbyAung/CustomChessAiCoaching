// src/lib/llm-integration.ts
"use client";

import { professionalCoach } from "./llm-coaching";
import { stockfishEngine } from "./stockfish-engine";

export class LLMIntegratedCoaching {
  private coach = professionalCoach;

  // Make coach accessible for external use
  getCoach() {
    return this.coach;
  }

  async analyzeWithLLM(fen: string, lastMove: string) {
    try {
      // First get engine analysis
      const engineAnalysis = await stockfishEngine.analyzePosition(fen, {
        maxDepth: 15,
        maxTimeMs: 2000,
      });

      // Determine game phase
      const gamePhase = this.getGamePhase(fen);

      // Get LLM coaching
      const llmResponse = await this.coach.analyzePosition({
        fen,
        lastMove,
        evaluation: engineAnalysis.evaluation,
        gamePhase,
        playerSkill: "intermediate", // Could be dynamic
        timeControl: "blitz", // Could be dynamic
      });

      return {
        engine: engineAnalysis,
        llm: llmResponse,
      };
    } catch (error) {
      console.error("LLM coaching failed:", error);
      throw error;
    }
  }

  private getGamePhase(fen: string): "opening" | "middlegame" | "endgame" {
    const parts = fen.split(" ");
    const moveNumber = parseInt(parts[5]) || 1;
    const pieceCount = (fen.match(/[KQRBNP]/g) || []).length;

    if (moveNumber <= 8 && pieceCount >= 30) return "opening";
    if (moveNumber <= 25 && pieceCount >= 20) return "middlegame";
    return "endgame";
  }
}

export const llmCoaching = new LLMIntegratedCoaching();
