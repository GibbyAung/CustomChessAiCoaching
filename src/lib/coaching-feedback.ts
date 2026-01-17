// src/lib/coaching-feedback.ts
"use client";

import { toastManager, ToastPriority, ToastType } from "./toast-manager";

export type MoveQuality =
  | "brilliant"
  | "excellent"
  | "good"
  | "inaccurate"
  | "mistake"
  | "blunder";

export interface CoachingFeedback {
  quality: MoveQuality;
  message: string;
  priority: ToastPriority;
  type: ToastType;
  expandedMessage?: string; // Detailed explanation
}

export class CoachingFeedbackGenerator {
  // Generate concise feedback messages (50 chars max)
  generateFeedback(
    quality: MoveQuality,
    evaluation: number,
    gamePhase: "opening" | "middlegame" | "endgame"
  ): CoachingFeedback {
    const feedback = this.getConciseFeedback(quality, gamePhase);

    return {
      quality,
      message: feedback.message,
      priority: feedback.priority,
      type: feedback.type,
      expandedMessage: this.getExpandedFeedback(quality, evaluation, gamePhase),
    };
  }

  private getConciseFeedback(
    quality: MoveQuality,
    gamePhase: string
  ): { message: string; priority: ToastPriority; type: ToastType } {
    const messages = {
      brilliant: {
        message: "✨ Brilliant! Outstanding move",
        priority: "high" as ToastPriority,
        type: "success" as ToastType,
      },
      excellent: {
        message: "👍 Excellent move",
        priority: "medium" as ToastPriority,
        type: "tactical" as ToastType,
      },
      good: {
        message: "✓ Good move",
        priority: "low" as ToastPriority,
        type: "positional" as ToastType,
      },
      inaccurate: {
        message: "⚠️ Not optimal - consider alternatives",
        priority: "medium" as ToastPriority,
        type: "learning" as ToastType,
      },
      mistake: {
        message: "❌ Mistake! Better moves available",
        priority: "high" as ToastPriority,
        type: "tactical" as ToastType,
      },
      blunder: {
        message: "🚨 Blunder! Major oversight",
        priority: "critical" as ToastPriority,
        type: "error" as ToastType,
      },
    };

    return messages[quality];
  }

  private getExpandedFeedback(
    quality: MoveQuality,
    evaluation: number,
    gamePhase: string
  ): string {
    // Detailed explanation for "Learn More" expansion
    const context = this.getPhaseContext(gamePhase);
    const evalText = this.getEvaluationText(evaluation);

    switch (quality) {
      case "brilliant":
        return `Brilliant move! ${evalText}. This move demonstrates strong ${context} understanding.`;
      case "excellent":
        return `Excellent choice. ${evalText}. You're following good ${context} principles.`;
      case "good":
        return `Solid move. ${evalText}. Maintains your position in the ${context}.`;
      case "inaccurate":
        return `Not the most accurate. ${evalText}. Consider focusing on ${context} improvements.`;
      case "mistake":
        return `This is a mistake. ${evalText}. Review ${context} principles to avoid this.`;
      case "blunder":
        return `Critical blunder! ${evalText}. This significantly damages your position in the ${context}.`;
      default:
        return "Move analyzed.";
    }
  }

  private getPhaseContext(phase: string): string {
    switch (phase) {
      case "opening":
        return "opening development and center control";
      case "middlegame":
        return "middlegame tactics and piece coordination";
      case "endgame":
        return "endgame technique and precision";
      default:
        return "positional";
    }
  }

  private getEvaluationText(evaluation: number): string {
    if (Math.abs(evaluation) < 50) return "Position remains balanced";
    if (evaluation > 200) return "White gains significant advantage";
    if (evaluation < -200) return "Black gains significant advantage";
    if (evaluation > 0) return "Slight advantage for White";
    return "Slight advantage for Black";
  }

  // Send feedback to toast manager
  showFeedback(feedback: CoachingFeedback) {
    const settings = toastManager.getSettings();

    console.log("🎯 Showing feedback:", feedback);

    // In minimal mode, only show mistakes and blunders
    if (
      settings.verbosity === "minimal" &&
      !["mistake", "blunder"].includes(feedback.quality)
    ) {
      console.log("🔇 Feedback blocked by minimal verbosity setting");
      return;
    }

    const toastData = {
      type: feedback.type,
      priority: feedback.priority,
      title: this.getTitleForQuality(feedback.quality),
      message: feedback.message,
    };

    console.log("📤 Sending toast to manager:", toastData);
    toastManager.addToast(toastData);
  }

  private getTitleForQuality(quality: MoveQuality): string {
    const titles = {
      brilliant: "Brilliant Move",
      excellent: "Excellent",
      good: "Good Move",
      inaccurate: "Inaccurate",
      mistake: "Mistake",
      blunder: "Blunder",
    };
    return titles[quality];
  }
}

export const coachingFeedback = new CoachingFeedbackGenerator();
