"use client";

import { Chess, Square } from "chess.js";

export interface BlunderAnalysis {
  type: "best" | "good" | "inaccurate" | "mistake" | "blunder";
  severity: "low" | "medium" | "high" | "critical";
  evaluation: number; // Centipawns
  description: string;
  alternativeMoves: AlternativeMove[];
  learningOpportunity: string;
  conceptExplanation: string;
}

export interface AlternativeMove {
  move: string;
  evaluation: number;
  description: string;
  reasoning: string;
}

export interface BlunderDetectionResult {
  isBlunder: boolean;
  blunderType: BlunderAnalysis["type"];
  analysis: BlunderAnalysis | null;
  immediateFeedback: string;
}

export class BlunderDetector {
  private chess: Chess;

  constructor() {
    this.chess = new Chess();
  }

  /**
   * Analyze a move for blunders and provide immediate feedback
   * @param fen - Position before the move
   * @param move - The move that was played
   * @param currentEvaluation - Current position evaluation
   * @returns Comprehensive blunder analysis
   */
  async analyzeMove(
    fen: string,
    move: string,
    currentEvaluation: number
  ): Promise<BlunderDetectionResult> {
    try {
      this.chess.load(fen);

      // Analyze the move quality
      const analysis = await this.analyzeMoveQuality(move, currentEvaluation);

      // Determine if it's a blunder
      const isBlunder =
        analysis.type === "mistake" || analysis.type === "blunder";

      // Generate immediate feedback
      const immediateFeedback = this.generateImmediateFeedback(analysis);

      return {
        isBlunder,
        blunderType: analysis.type,
        analysis,
        immediateFeedback,
      };
    } catch (error) {
      console.error("Error analyzing move for blunders:", error);
      return {
        isBlunder: false,
        blunderType: "good",
        analysis: null,
        immediateFeedback: "Unable to analyze move at this time.",
      };
    }
  }

  /**
   * Analyze the quality of a specific move
   */
  private async analyzeMoveQuality(
    move: string,
    currentEvaluation: number
  ): Promise<BlunderAnalysis> {
    // Parse the move to get from and to squares
    const moveInfo = this.parseMove(move);
    if (!moveInfo) {
      return this.getDefaultAnalysis("good", currentEvaluation);
    }

    // Analyze the move impact
    const moveImpact = this.analyzeMoveImpact(moveInfo, currentEvaluation);
    const type = this.categorizeMove(
      moveImpact.evaluationChange,
      moveImpact.depth
    );
    const severity = this.determineSeverity(type, moveImpact.evaluationChange);

    // Generate alternative moves
    const alternativeMoves = this.findAlternativeMoves(moveInfo);

    // Generate analysis
    const analysis: BlunderAnalysis = {
      type,
      severity,
      evaluation: currentEvaluation,
      description: this.generateMoveDescription(move, type, moveImpact),
      alternativeMoves,
      learningOpportunity: this.generateLearningOpportunity(type, moveImpact),
      conceptExplanation: this.generateConceptExplanation(type, moveImpact),
    };

    return analysis;
  }

  /**
   * Parse a chess move string (e.g., "e2e4", "Nf3", etc.)
   */
  private parseMove(
    move: string
  ): { from: Square; to: Square; piece: string } | null {
    try {
      // Handle UCI format (e2e4)
      if (move.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(move)) {
        const from = move.substring(0, 2) as Square;
        const to = move.substring(2, 4) as Square;
        const piece = this.chess.get(from)?.type || "p";
        return { from, to, piece };
      }

      // Handle SAN format (Nf3) - simplified parsing
      // In a full implementation, we'd need more sophisticated SAN parsing
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze the impact of a move on the position
   */
  private analyzeMoveImpact(
    moveInfo: { from: Square; to: Square; piece: string },
    currentEvaluation: number
  ): {
    evaluationChange: number;
    depth: number;
    tacticalImpact: string;
    positionalImpact: string;
  } {
    // Simulate the move to analyze its impact
    const originalFen = this.chess.fen();

    try {
      // Make the move
      const moveResult = this.chess.move({
        from: moveInfo.from,
        to: moveInfo.to,
      });

      if (!moveResult) {
        return {
          evaluationChange: 0,
          depth: 1,
          tacticalImpact: "invalid_move",
          positionalImpact: "invalid_move",
        };
      }

      // Analyze the resulting position
      const newEvaluation = this.analyzePosition();
      const evaluationChange = newEvaluation - currentEvaluation;

      // Determine tactical and positional impact
      const tacticalImpact = this.analyzeTacticalImpact(moveInfo);
      const positionalImpact = this.analyzePositionalImpact(moveInfo);

      // Restore original position
      this.chess.load(originalFen);

      return {
        evaluationChange,
        depth: 15, // Simulated depth
        tacticalImpact,
        positionalImpact,
      };
    } catch (error) {
      // Restore original position on error
      this.chess.load(originalFen);
      return {
        evaluationChange: 0,
        depth: 1,
        tacticalImpact: "unknown",
        positionalImpact: "unknown",
      };
    }
  }

  /**
   * Analyze the tactical impact of a move
   */
  private analyzeTacticalImpact(moveInfo: {
    from: Square;
    to: Square;
    piece: string;
  }): string {
    const { from, to, piece } = moveInfo;

    // Check for captures
    const capturedPiece = this.chess.get(to);
    if (capturedPiece) {
      return "capture";
    }

    // Check for checks
    this.chess.move({ from, to });
    const isCheck = this.chess.isCheck();
    this.chess.undo();

    if (isCheck) {
      return "check";
    }

    // Check for threats
    if (this.createsThreats(to, piece)) {
      return "threat";
    }

    return "neutral";
  }

  /**
   * Analyze the positional impact of a move
   */
  private analyzePositionalImpact(moveInfo: {
    from: Square;
    to: Square;
    piece: string;
  }): string {
    const { from, to, piece } = moveInfo;

    // Check for development
    if (this.isDevelopmentMove(from, to, piece)) {
      return "development";
    }

    // Check for center control
    if (this.controlsCenter(to)) {
      return "center_control";
    }

    // Check for king safety
    if (this.improvesKingSafety(from, to, piece)) {
      return "king_safety";
    }

    return "neutral";
  }

  /**
   * Check if a move creates threats
   */
  private createsThreats(square: Square, piece: string): boolean {
    // Simplified threat detection
    // In a full implementation, we'd analyze all possible moves from that square
    return false;
  }

  /**
   * Check if a move is a development move
   */
  private isDevelopmentMove(from: Square, to: Square, piece: string): boolean {
    if (piece === "p") return false; // Pawns are not considered development

    const fromRank = parseInt(from[1]);
    const toRank = parseInt(to[1]);
    const isWhite = this.chess.turn() === "w";

    if (isWhite) {
      return toRank <= 6; // Moving towards center/opponent
    } else {
      return toRank >= 3; // Moving towards center/opponent
    }
  }

  /**
   * Check if a square controls the center
   */
  private controlsCenter(square: Square): boolean {
    const centerSquares: Square[] = [
      "e4",
      "e5",
      "d4",
      "d5",
      "e3",
      "e6",
      "d3",
      "d6",
    ];
    return centerSquares.includes(square);
  }

  /**
   * Check if a move improves king safety
   */
  private improvesKingSafety(from: Square, to: Square, piece: string): boolean {
    if (piece !== "k") return false;

    // Check if moving towards castled position
    const isWhite = this.chess.turn() === "w";
    if (isWhite && (to === "g1" || to === "c1")) {
      return true;
    }
    if (!isWhite && (to === "g8" || to === "c8")) {
      return true;
    }

    return false;
  }

  /**
   * Analyze the current position (simplified)
   */
  private analyzePosition(): number {
    // Simplified position analysis
    // In a full implementation, this would use Stockfish or similar engine
    return 0;
  }

  /**
   * Find alternative moves that could have been played
   */
  private findAlternativeMoves(moveInfo: {
    from: Square;
    to: Square;
    piece: string;
  }): AlternativeMove[] {
    const alternatives: AlternativeMove[] = [];

    // Get all legal moves from the same square
    const legalMoves = this.chess.moves({
      square: moveInfo.from,
      verbose: true,
    });

    // Filter out the move that was actually played
    const otherMoves = legalMoves.filter((move) => move.to !== moveInfo.to);

    // Take up to 3 alternative moves
    otherMoves.slice(0, 3).forEach((move) => {
      alternatives.push({
        move: `${move.piece}${move.to}`,
        evaluation: 0, // Would need engine analysis for real evaluation
        description: `Move ${move.piece} to ${move.to}`,
        reasoning: this.generateMoveReasoning(move),
      });
    });

    return alternatives;
  }

  /**
   * Generate reasoning for why an alternative move might be better
   */
  private generateMoveReasoning(move: any): string {
    if (move.captured) {
      return `Captures ${move.captured} and gains material`;
    }

    if (move.san.includes("+")) {
      return "Gives check and creates tactical opportunities";
    }

    if (this.controlsCenter(move.to as Square)) {
      return "Controls important central squares";
    }

    return "Improves piece placement and position";
  }

  /**
   * Categorize a move based on evaluation change
   */
  private categorizeMove(
    evaluationChange: number,
    depth: number
  ): BlunderAnalysis["type"] {
    const absChange = Math.abs(evaluationChange);

    if (depth < 10) return "good";
    if (absChange < 50) return "good";
    if (absChange < 200) return "inaccurate";
    if (absChange < 500) return "mistake";
    return "blunder";
  }

  /**
   * Determine the severity of a blunder
   */
  private determineSeverity(
    type: BlunderAnalysis["type"],
    evaluationChange: number
  ): BlunderAnalysis["severity"] {
    const absChange = Math.abs(evaluationChange);

    switch (type) {
      case "best":
      case "good":
        return "low";
      case "inaccurate":
        return absChange > 100 ? "medium" : "low";
      case "mistake":
        return absChange > 300 ? "high" : "medium";
      case "blunder":
        return absChange > 800 ? "critical" : "high";
      default:
        return "low";
    }
  }

  /**
   * Generate a description of the move
   */
  private generateMoveDescription(
    move: string,
    type: BlunderAnalysis["type"],
    impact: any
  ): string {
    const baseDescriptions = {
      best: "Excellent move! This is the strongest continuation in the position.",
      good: "Good move! This maintains or slightly improves your position.",
      inaccurate:
        "This move is playable but not the most accurate. There are stronger alternatives.",
      mistake:
        "This move has some problems. It gives your opponent opportunities to gain an advantage.",
      blunder:
        "This is a serious mistake that significantly weakens your position.",
    };

    const baseDescription = baseDescriptions[type];

    // Add specific details based on impact
    if (impact.tacticalImpact === "capture") {
      return `${baseDescription} The capture changes the material balance.`;
    } else if (impact.tacticalImpact === "check") {
      return `${baseDescription} The check creates tactical complications.`;
    } else if (impact.positionalImpact === "development") {
      return `${baseDescription} You're developing your pieces to active squares.`;
    }

    return baseDescription;
  }

  /**
   * Generate learning opportunity description
   */
  private generateLearningOpportunity(
    type: BlunderAnalysis["type"],
    impact: any
  ): string {
    const opportunities = {
      best: "Study similar positions to understand why this move is so strong.",
      good: "Practice maintaining this level of play consistently.",
      inaccurate:
        "Work on calculating variations more deeply to find stronger moves.",
      mistake: "Focus on tactical awareness and threat detection.",
      blunder:
        "Practice basic tactical patterns and calculation to avoid similar mistakes.",
    };

    return opportunities[type];
  }

  /**
   * Generate concept explanation
   */
  private generateConceptExplanation(
    type: BlunderAnalysis["type"],
    impact: any
  ): string {
    const explanations = {
      best: "This move follows chess principles: control the center, develop pieces, and create threats.",
      good: "Solid positional play that maintains the initiative and piece coordination.",
      inaccurate:
        "While not terrible, this move misses tactical opportunities that stronger players would exploit.",
      mistake:
        "This move violates basic principles by creating weaknesses or missing threats.",
      blunder:
        "This move loses material or gives your opponent a decisive advantage through tactical oversight.",
    };

    return explanations[type];
  }

  /**
   * Generate immediate feedback for the user
   */
  private generateImmediateFeedback(analysis: BlunderAnalysis): string {
    const gamePhase = this.getGamePhase();
    const moveType = this.analyzeMoveType(analysis);

    const feedbackTemplates = {
      best: {
        opening:
          "🎯 Excellent! This move follows opening principles perfectly. You're developing with purpose!",
        middlegame:
          "🎯 Brilliant! This move creates tactical opportunities and improves your position significantly.",
        endgame:
          "🎯 Perfect endgame technique! This move maximizes your winning chances with precise calculation.",
      },
      good: {
        opening:
          "👍 Solid move! You're building a strong foundation for the middlegame.",
        middlegame:
          "👍 Good positional play! This move maintains your advantage and keeps pressure on your opponent.",
        endgame:
          "👍 Well played! This move maintains your advantage and shows good endgame understanding.",
      },
      inaccurate: {
        opening:
          "🤔 This move is playable, but not the most accurate. Consider if there are stronger developing moves available.",
        middlegame:
          "🤔 This move is okay, but you might be missing some tactical opportunities. Try calculating a few moves deeper.",
        endgame:
          "🤔 This move is reasonable, but not the most precise. In endgames, accuracy is crucial - every move counts.",
      },
      mistake: {
        opening:
          "⚠️ This move creates some problems. Your opponent can exploit this to gain an advantage. Let's think about what they can do.",
        middlegame:
          "⚠️ This move has tactical issues. Your opponent can use this to create threats against your position.",
        endgame:
          "⚠️ This move is a mistake that could cost you the advantage. In endgames, we need to be very careful.",
      },
      blunder: {
        opening:
          "🚨 Critical mistake! This move gives your opponent a significant advantage. This is a common trap that many players fall into.",
        middlegame:
          "🚨 This is a blunder that loses material or gives your opponent a winning attack. Let's analyze what went wrong.",
        endgame:
          "🚨 Critical error! This move could cost you the game. Endgames require precise calculation and technique.",
      },
    };

    const baseFeedback = (feedbackTemplates[analysis.type] as any)[gamePhase];

    // Add specific learning opportunity if available
    if (analysis.learningOpportunity) {
      return `${baseFeedback}\n\n💡 Learning: ${analysis.learningOpportunity}`;
    }

    return baseFeedback;
  }

  private getGamePhase(): string {
    const board = this.chess.board();
    let pieceCount = 0;

    for (let row of board) {
      for (let piece of row) {
        if (piece) pieceCount++;
      }
    }

    if (pieceCount > 24) return "opening";
    if (pieceCount > 12) return "middlegame";
    return "endgame";
  }

  private analyzeMoveType(analysis: BlunderAnalysis): string {
    // Analyze what type of move this was based on the analysis
    if (analysis.alternativeMoves.length > 0) {
      const bestAlternative = analysis.alternativeMoves[0];
      if (bestAlternative.evaluation > analysis.evaluation + 200) {
        return "tactical_miss";
      } else if (bestAlternative.evaluation > analysis.evaluation + 100) {
        return "positional_error";
      }
    }

    return "general";
  }

  /**
   * Get default analysis when something goes wrong
   */
  private getDefaultAnalysis(
    type: BlunderAnalysis["type"],
    evaluation: number
  ): BlunderAnalysis {
    return {
      type,
      severity: "low",
      evaluation,
      description: "Unable to analyze move quality at this time.",
      alternativeMoves: [],
      learningOpportunity: "Continue playing and learning from experience.",
      conceptExplanation:
        "Focus on basic chess principles: control the center, develop pieces, and protect your king.",
    };
  }
}

export const blunderDetector = new BlunderDetector();
