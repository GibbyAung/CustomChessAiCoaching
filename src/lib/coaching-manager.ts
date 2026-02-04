"use client";

import { stockfishEngine } from "./stockfish-engine";
import { PositionAnalyzer, ComplexityFactors } from "./position-analyzer";
import { generateHumanCoaching } from "./human-coaching";
import { AIDifficulty } from "@/types/game-modes";
import { Chess } from "chess.js";

export interface MoveEvaluation {
  fen: string;
  evaluation: number;
  bestMove: string | null;
  depth: number;
  complexity?: ComplexityFactors;
}

export type ToastCallback = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  default: (title: string, description?: string) => void;
};

export class CoachingManager {
  private positionBeforeMove: MoveEvaluation | null = null;
  private moveHistory: Array<{
    move: string;
    evalBefore: number;
    evalAfter: number;
    classification: string;
    complexityBefore?: ComplexityFactors;
    complexityAfter?: ComplexityFactors;
  }> = [];

  private lastFeedbackTime = 0;
  private readonly FEEDBACK_COOLDOWN = 800;
  private lastHintTime = 0;
  private readonly HINT_COOLDOWN = 12000;
  private difficulty: AIDifficulty = "medium";
  private toastCallback: ToastCallback | null = null;

  setToastCallback(callback: ToastCallback) {
    this.toastCallback = callback;
  }

  setDifficulty(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
  }

  async prepareForMove(fen: string): Promise<void> {
    console.log("🎯 [Coaching] Preparing for move...");
    
    if (!stockfishEngine.isReady()) {
      await stockfishEngine.initialize();
      try {
        await stockfishEngine.configureOptimalNetwork();
        console.log("✅ [Coaching] Engine ready");
      } catch (error) {
        console.warn("⚠️ [Coaching] Neural network config failed:", error);
      }
    }

    const analysis = await stockfishEngine.analyzePosition(fen, {
      maxDepth: 15,
      maxTimeMs: 1500,
      multiPV: 1,
    });

    const complexity = PositionAnalyzer.analyzeComplexity(fen);

    this.positionBeforeMove = {
      fen,
      evaluation: analysis.evaluation,
      bestMove: analysis.bestMove,
      depth: analysis.depth,
      complexity,
    };

    console.log("📸 [Coaching] Baseline stored:", {
      eval: analysis.evaluation,
      bestMove: analysis.bestMove,
    });

    if (!this.moveHistory.length && this.toastCallback) {
      setTimeout(() => {
        this.toastCallback?.info("🎮 Let's Play!", "I'll coach you as you play!");
      }, 500);
    }
  }

  async analyzeMove(fenAfter: string, playedMove: string): Promise<void> {
    console.log("🔍 [Coaching] Analyzing move:", playedMove);
    
    if (!this.positionBeforeMove) {
      console.warn("⚠️ No baseline - call prepareForMove first!");
      this.toastCallback?.error("Coaching Error", "Analysis not ready. Try again!");
      return;
    }

    const moveLabel = this.describeMove(playedMove, this.positionBeforeMove.fen);

    const analysisAfter = await stockfishEngine.analyzePosition(fenAfter, {
      maxDepth: 15,
      maxTimeMs: 1500,
      multiPV: 3,
    });

    const turnAfter = fenAfter.split(" ")[1];
    const evalBefore = this.positionBeforeMove.evaluation;
    
    const evalAfter = turnAfter === "b" 
      ? -analysisAfter.evaluation 
      : analysisAfter.evaluation;
    
    const evalDelta = evalAfter - evalBefore;

    const complexityAfter = PositionAnalyzer.analyzeComplexity(fenAfter);
    const complexityBefore = this.positionBeforeMove.complexity || {
      overallComplexity: 50,
      phase: "middlegame" as const,
      materialComplexity: 0,
      tacticalComplexity: 0,
      positionalComplexity: 0,
      endgameComplexity: 0,
      recommendations: [],
    };
    
    const complexityDelta = complexityAfter.overallComplexity - complexityBefore.overallComplexity;

    console.log("📊 [Coaching] Move Analysis:", {
      playedMove,
      moveLabel,
      evalBefore,
      evalAfter,
      evalDelta,
      complexity: complexityAfter.overallComplexity,
      bestMove: this.positionBeforeMove.bestMove,
    });

    const classification = this.classifyMoveEnhanced(
      evalDelta,
      complexityDelta,
      complexityAfter,
      playedMove,
      this.positionBeforeMove.bestMove
    );

    this.moveHistory.push({
      move: playedMove,
      evalBefore,
      evalAfter,
      classification,
      complexityBefore,
      complexityAfter,
    });

    this.showEnhancedFeedback(
      classification,
      evalDelta,
      complexityDelta,
      complexityAfter,
      this.positionBeforeMove.bestMove,
      moveLabel
    );

    this.positionBeforeMove = {
      fen: fenAfter,
      evaluation: evalAfter,
      bestMove: analysisAfter.bestMove,
      depth: analysisAfter.depth,
      complexity: complexityAfter,
    };
  }

  private classifyMove(
    evalDelta: number,
    playedMove: string,
    bestMove: string | null
  ): string {
    if (evalDelta < -200) return "blunder";
    if (evalDelta < -100) return "mistake";
    if (evalDelta < -50) return "inaccuracy";
    if (evalDelta > 100) return "brilliant";
    if (evalDelta > 50 || playedMove === bestMove) return "excellent";
    if (evalDelta > 20) return "good";
    return "neutral";
  }

  private classifyMoveEnhanced(
    evalDelta: number,
    complexityDelta: number,
    complexityAfter: ComplexityFactors,
    playedMove: string,
    bestMove: string | null
  ): string {
    let baseClassification = this.classifyMove(evalDelta, playedMove, bestMove);
    const complexity = complexityAfter.overallComplexity;

    if (complexity > 70) {
      if (baseClassification === "mistake" && evalDelta > -80) {
        baseClassification = "inaccuracy";
      }
      if (baseClassification === "inaccuracy" && Math.abs(evalDelta) < 30) {
        baseClassification = "good";
      }
    }

    if (complexity < 40) {
      if (baseClassification === "good" && evalDelta < -30) {
        baseClassification = "inaccuracy";
      }
      if (baseClassification === "neutral" && playedMove !== bestMove) {
        baseClassification = "inaccuracy";
      }
    }

    if (complexityAfter.phase === "endgame") {
      if (baseClassification === "inaccuracy" && Math.abs(evalDelta) > 40) {
        baseClassification = "mistake";
      }
    }

    if (complexityAfter.tacticalComplexity > 75) {
      if (baseClassification === "inaccuracy" && complexityDelta < -10) {
        baseClassification = "mistake";
      }
    }

    return baseClassification;
  }

  private showEnhancedFeedback(
    classification: string,
    evalDelta: number,
    complexityDelta: number,
    complexityAfter: ComplexityFactors,
    bestMove: string | null,
    moveLabel: string
  ): void {
    const now = Date.now();
    if (now - this.lastFeedbackTime < this.FEEDBACK_COOLDOWN) {
      console.log("⏸️ [Coaching] Cooldown active, skipping feedback");
      return;
    }
    this.lastFeedbackTime = now;

    console.log("💬 [Coaching] Showing feedback:", classification);

    if (!this.toastCallback) {
      console.warn("⚠️ No toast callback set");
      return;
    }

    const coaching = generateHumanCoaching(
      classification,
      complexityAfter.overallComplexity,
      complexityAfter.phase,
      evalDelta,
      moveLabel
    );

    const shouldOfferHint = this.shouldOfferHint(classification);

    switch (classification) {
      case "blunder":
        this.toastCallback.error(
          "🚨 Oops!",
          coaching.message || `Big mistake! Lost ${Math.abs(evalDelta / 100).toFixed(1)} pawns`
        );
        if (bestMove && shouldOfferHint) {
          setTimeout(() => {
            this.toastCallback?.info("💡 Better was", `Try ${bestMove} instead!`);
          }, 1500);
        }
        break;

      case "mistake":
        this.toastCallback.warning(
          "⚠️ Careful!",
          coaching.message || `Lost ${Math.abs(evalDelta / 100).toFixed(1)} pawns`
        );
        if (bestMove && shouldOfferHint) {
          setTimeout(() => {
            this.toastCallback?.info("💡 Hint", `Consider ${bestMove} next time`);
          }, 1200);
        }
        break;

      case "inaccuracy":
        this.toastCallback.warning(
          "🤔 Hmm...",
          coaching.message || `Not the strongest (${(evalDelta / 100).toFixed(1)})`
        );
        break;

      case "brilliant":
        this.toastCallback.success(
          "🌟 Brilliant!",
          coaching.message || `Amazing! Gained ${(evalDelta / 100).toFixed(1)} pawns!`
        );
        break;

      case "excellent":
        this.toastCallback.success(
          "🎯 Excellent!",
          coaching.message || "Strong move gaining advantage!"
        );
        break;

      case "good":
        this.toastCallback.success(
          "👍 Good!",
          coaching.message || "Solid move!"
        );
        break;

      case "neutral":
        this.toastCallback.default(
          "💭 Okay",
          coaching.message || "Reasonable move"
        );
        break;

      default:
        console.log("Unknown classification:", classification);
    }

    if (coaching.encouragement && ["blunder", "mistake", "inaccuracy"].includes(classification)) {
      setTimeout(() => {
        this.toastCallback?.info("💪 Keep Going!", coaching.encouragement);
      }, 2000);
    }

    if (
      complexityAfter.overallComplexity > 70 &&
      complexityAfter.recommendations.length > 0 &&
      (this.difficulty === "easy" || shouldOfferHint)
    ) {
      setTimeout(() => {
        this.toastCallback?.info("🧠 Tip", complexityAfter.recommendations[0]);
      }, 3000);
    }
  }

  private shouldOfferHint(classification: string): boolean {
    if (this.difficulty === "easy") {
      return true;
    }

    if (classification !== "blunder") {
      return false;
    }

    const now = Date.now();
    if (now - this.lastHintTime < this.HINT_COOLDOWN) {
      return false;
    }

    const chance = this.difficulty === "medium" ? 0.4 : 0.2;
    const shouldHint = Math.random() < chance;

    if (shouldHint) {
      this.lastHintTime = now;
    }

    return shouldHint;
  }

  private describeMove(playedMove: string, fenBefore: string): string {
    if (!playedMove || playedMove.length < 4) {
      return "";
    }

    const from = playedMove.slice(0, 2);
    const to = playedMove.slice(2, 4);
    const promotion = playedMove.length > 4 ? playedMove.slice(4, 5) : undefined;
    const uciLabel = `${from}-${to}${promotion ? `=${promotion.toUpperCase()}` : ""}`;

    try {
      const chess = new Chess(fenBefore);
      const result = chess.move({
        from,
        to,
        promotion: promotion as "q" | "r" | "b" | "n" | undefined,
      });

      if (result?.san) {
        return `${result.san} (${uciLabel})`;
      }
    } catch (error) {
      console.warn("⚠️ [Coaching] Failed to describe move:", error);
    }

    return uciLabel;
  }

  reset() {
    if (this.moveHistory.length > 0) {
      this.provideGameSummary();
    }
    this.positionBeforeMove = null;
    this.moveHistory = [];
    console.log("🔄 [Coaching] Reset");
  }

  getCoachingStats() {
    const totalMoves = this.moveHistory.length;
    const brilliant = this.moveHistory.filter((m) => m.classification === "brilliant").length;
    const excellent = this.moveHistory.filter((m) => m.classification === "excellent").length;
    const good = this.moveHistory.filter((m) => m.classification === "good").length;
    const inaccuracy = this.moveHistory.filter((m) => m.classification === "inaccuracy").length;
    const mistake = this.moveHistory.filter((m) => m.classification === "mistake").length;
    const blunder = this.moveHistory.filter((m) => m.classification === "blunder").length;

    return {
      totalMoves,
      brilliant,
      excellent,
      good,
      inaccuracy,
      mistake,
      blunder,
      accuracy:
        totalMoves > 0 ? (((brilliant + excellent + good) / totalMoves) * 100).toFixed(1) : "0",
    };
  }

  getMoveHistory() {
    return this.moveHistory;
  }

  provideGameSummary(): void {
    if (this.moveHistory.length < 5) return;

    const stats = this.getCoachingStats();
    const accuracy = parseFloat(stats.accuracy);

    let title = "🏁 Game Complete!";
    let message = "";

    if (accuracy >= 80) {
      title = "🎉 Fantastic!";
      message = `Outstanding play with ${stats.accuracy}% accuracy!`;
    } else if (accuracy >= 60) {
      title = "👍 Good Game!";
      message = `Solid performance: ${stats.accuracy}% accuracy`;
    } else if (accuracy >= 40) {
      title = "📚 Learning!";
      message = `${stats.accuracy}% accuracy - you're improving!`;
    } else {
      title = "💪 Keep Practicing!";
      message = `${stats.accuracy}% accuracy - every game teaches us!`;
    }

    setTimeout(() => {
      this.toastCallback?.info(title, message);
    }, 1000);

    setTimeout(() => {
      this.toastCallback?.default(
        "📊 Stats",
        `Brilliant: ${stats.brilliant}, Excellent: ${stats.excellent}, Mistakes: ${stats.mistake + stats.blunder}`
      );
    }, 2000);
  }
}

export const coachingManager = new CoachingManager();
