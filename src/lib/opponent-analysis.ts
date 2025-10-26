"use client";

import { Chess, Square } from "chess.js";

export interface OpponentThreat {
  type:
    | "pin"
    | "fork"
    | "discovered_attack"
    | "skewer"
    | "double_attack"
    | "mate_threat";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  targetSquare?: string;
  attackingPiece?: string;
  defensiveMoves?: string[];
}

export interface StrategicIntent {
  primary: string;
  secondary: string[];
  description: string;
  confidence: number; // 0-1
  counterplay?: string[];
}

export interface OpponentAnalysis {
  threats: OpponentThreat[];
  strategicIntent: StrategicIntent;
  overallAssessment: string;
  recommendations: string[];
}

export class OpponentAnalyzer {
  private chess: Chess;

  constructor() {
    this.chess = new Chess();
  }

  /**
   * Analyze the opponent's position and intentions
   * @param fen - Current position in FEN notation
   * @param isOpponentTurn - Whether it's the opponent's turn to move
   * @returns Comprehensive opponent analysis
   */
  async analyzeOpponent(
    fen: string,
    isOpponentTurn: boolean = false
  ): Promise<OpponentAnalysis> {
    try {
      this.chess.load(fen);

      const threats = this.detectThreats();
      const strategicIntent = this.analyzeStrategicIntent();
      const overallAssessment = this.generateOverallAssessment(
        threats,
        strategicIntent
      );
      const recommendations = this.generateRecommendations(
        threats,
        strategicIntent
      );

      return {
        threats,
        strategicIntent,
        overallAssessment,
        recommendations,
      };
    } catch (error) {
      console.error("Error analyzing opponent position:", error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Detect immediate tactical threats from the opponent
   */
  private detectThreats(): OpponentThreat[] {
    const threats: OpponentThreat[] = [];

    // Get all opponent's legal moves
    const opponentMoves = this.chess.moves({ verbose: true });

    opponentMoves.forEach((move) => {
      // Check for pins
      const pinThreat = this.detectPin(move);
      if (pinThreat) threats.push(pinThreat);

      // Check for forks
      const forkThreat = this.detectFork(move);
      if (forkThreat) threats.push(forkThreat);

      // Check for discovered attacks
      const discoveredThreat = this.detectDiscoveredAttack(move);
      if (discoveredThreat) threats.push(discoveredThreat);

      // Check for mate threats
      const mateThreat = this.detectMateThreat(move);
      if (mateThreat) threats.push(mateThreat);
    });

    return threats;
  }

  /**
   * Detect pin threats
   */
  private detectPin(move: any): OpponentThreat | null {
    // This is a simplified pin detection
    // In a full implementation, we'd analyze the board after the move
    if (move.captured && move.piece === "q") {
      return {
        type: "pin",
        severity: "high",
        description: `The opponent's queen can pin your ${move.captured} to your king, potentially winning material.`,
        targetSquare: move.to,
        attackingPiece: "q",
      };
    }
    return null;
  }

  /**
   * Detect fork threats
   */
  private detectFork(move: any): OpponentThreat | null {
    // Simplified fork detection
    if (
      move.piece === "n" &&
      this.chess.moves({ square: move.to as Square }).length > 1
    ) {
      return {
        type: "fork",
        severity: "medium",
        description: `The opponent's knight can fork multiple pieces from ${move.to}, creating tactical complications.`,
        targetSquare: move.to,
        attackingPiece: "n",
      };
    }
    return null;
  }

  /**
   * Detect discovered attack threats
   */
  private detectDiscoveredAttack(move: any): OpponentThreat | null {
    // Simplified discovered attack detection
    if (move.piece === "p" && this.hasAttackingPieces(move.to as Square)) {
      return {
        type: "discovered_attack",
        severity: "medium",
        description: `Moving the pawn to ${move.to} could discover an attack on your pieces.`,
        targetSquare: move.to,
      };
    }
    return null;
  }

  /**
   * Detect mate threats
   */
  private detectMateThreat(move: any): OpponentThreat | null {
    // Check if the move creates a mate threat
    this.chess.move(move);
    const isCheck = this.chess.isCheck();
    const isCheckmate = this.chess.isCheckmate();
    this.chess.undo();

    if (isCheckmate) {
      return {
        type: "mate_threat",
        severity: "critical",
        description: `CRITICAL: The opponent has a checkmate threat! You must defend immediately.`,
        targetSquare: move.to,
        attackingPiece: move.piece,
      };
    } else if (isCheck) {
      return {
        type: "mate_threat",
        severity: "high",
        description: `The opponent's ${move.piece} move to ${move.to} gives check and could lead to mate threats.`,
        targetSquare: move.to,
        attackingPiece: move.piece,
      };
    }

    return null;
  }

  /**
   * Analyze the opponent's strategic intentions
   */
  private analyzeStrategicIntent(): StrategicIntent {
    const centerControl = this.analyzeCenterControl();
    const development = this.analyzeDevelopment();
    const kingSafety = this.analyzeKingSafety();
    const pawnStructure = this.analyzePawnStructure();

    // Determine primary strategic goal
    let primary = "positional_improvement";
    let confidence = 0.7;

    if (centerControl.score > 0.6) {
      primary = "center_control";
      confidence = centerControl.score;
    } else if (development.score > 0.6) {
      primary = "piece_development";
      confidence = development.score;
    } else if (kingSafety.score < 0.4) {
      primary = "king_safety";
      confidence = 1 - kingSafety.score;
    }

    const secondary = [
      centerControl.goal,
      development.goal,
      kingSafety.goal,
      pawnStructure.goal,
    ].filter((goal) => goal !== primary);

    const description = this.generateStrategicDescription(
      primary,
      centerControl,
      development,
      kingSafety,
      pawnStructure
    );

    return {
      primary,
      secondary,
      description,
      confidence,
      counterplay: this.suggestCounterplay(
        primary,
        centerControl,
        development,
        kingSafety,
        pawnStructure
      ),
    };
  }

  /**
   * Analyze center control
   */
  private analyzeCenterControl(): { score: number; goal: string } {
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
    let opponentControl = 0;
    let totalControl = 0;

    centerSquares.forEach((square) => {
      if (this.chess.get(square)) {
        totalControl++;
        if (this.chess.get(square)?.color === this.getOpponentColor()) {
          opponentControl++;
        }
      }
    });

    const score = totalControl > 0 ? opponentControl / totalControl : 0.5;
    const goal = score > 0.6 ? "center_control" : "center_development";

    return { score, goal };
  }

  /**
   * Analyze piece development
   */
  private analyzeDevelopment(): { score: number; goal: string } {
    const opponentColor = this.getOpponentColor();
    const pieces = this.chess
      .board()
      .flat()
      .filter((piece) => piece && piece.color === opponentColor);

    let developedPieces = 0;
    pieces.forEach((piece) => {
      if (piece && piece.type !== "p" && piece.type !== "k") {
        const square = this.findPieceSquare(piece);
        if (square && this.isDevelopedSquare(square, opponentColor)) {
          developedPieces++;
        }
      }
    });

    const score = pieces.length > 0 ? developedPieces / pieces.length : 0.5;
    const goal = score > 0.6 ? "piece_development" : "piece_activation";

    return { score, goal };
  }

  /**
   * Analyze king safety
   */
  private analyzeKingSafety(): { score: number; goal: string } {
    const opponentColor = this.getOpponentColor();
    const kingSquare = this.findKingSquare(opponentColor);

    if (!kingSquare) return { score: 0.5, goal: "king_safety" };

    const isCastled = this.isCastled(kingSquare, opponentColor);
    const hasPawnShield = this.hasPawnShield(kingSquare, opponentColor);
    const isExposed = this.isKingExposed(kingSquare, opponentColor);

    let score = 0.5;
    if (isCastled) score += 0.3;
    if (hasPawnShield) score += 0.2;
    if (isExposed) score -= 0.3;

    score = Math.max(0, Math.min(1, score));
    const goal = score > 0.6 ? "king_safety" : "king_protection";

    return { score, goal };
  }

  /**
   * Analyze pawn structure
   */
  private analyzePawnStructure(): { score: number; goal: string } {
    const opponentColor = this.getOpponentColor();
    const pawns = this.chess
      .board()
      .flat()
      .filter(
        (piece) => piece && piece.type === "p" && piece.color === opponentColor
      );

    let isolatedPawns = 0;
    let doubledPawns = 0;

    // Simplified pawn structure analysis
    pawns.forEach((pawn) => {
      const square = this.findPieceSquare(pawn);
      if (square && this.isIsolatedPawn(square, opponentColor)) {
        isolatedPawns++;
      }
    });

    const score = 1 - (isolatedPawns / Math.max(pawns.length, 1)) * 0.5;
    const goal = score > 0.6 ? "pawn_structure" : "pawn_improvement";

    return { score, goal };
  }

  /**
   * Generate strategic description
   */
  private generateStrategicDescription(
    primary: string,
    centerControl: any,
    development: any,
    kingSafety: any,
    pawnStructure: any
  ): string {
    const descriptions = {
      center_control: `Your opponent is aggressively controlling the center with their pieces and pawns. They're establishing a strong positional foundation that could lead to attacking opportunities.`,
      piece_development: `The opponent is developing their pieces to active squares, preparing for tactical and positional play. They're building up their position systematically.`,
      king_safety: `Your opponent is prioritizing king safety, likely preparing for long-term strategic play. They're being cautious and defensive.`,
      positional_improvement: `The opponent is making subtle positional improvements, focusing on piece placement and pawn structure rather than immediate tactics.`,
    };

    return (
      descriptions[primary as keyof typeof descriptions] ||
      descriptions.positional_improvement
    );
  }

  /**
   * Generate overall assessment
   */
  private generateOverallAssessment(
    threats: OpponentThreat[],
    strategicIntent: StrategicIntent
  ): string {
    const criticalThreats = threats.filter(
      (t) => t.severity === "critical"
    ).length;
    const highThreats = threats.filter((t) => t.severity === "high").length;

    if (criticalThreats > 0) {
      return `CRITICAL: Your opponent has ${criticalThreats} immediate threats that require immediate attention!`;
    } else if (highThreats > 0) {
      return `Your opponent has ${highThreats} significant threats and is pursuing a ${strategicIntent.primary.replace(
        "_",
        " "
      )} strategy.`;
    } else {
      return `Your opponent is playing positionally, focusing on ${strategicIntent.primary.replace(
        "_",
        " "
      )}. Stay alert for tactical opportunities.`;
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    threats: OpponentThreat[],
    strategicIntent: StrategicIntent
  ): string[] {
    const recommendations: string[] = [];

    // Threat-based recommendations
    threats.forEach((threat) => {
      switch (threat.type) {
        case "pin":
          recommendations.push(
            `Defend against the pin threat by moving the pinned piece or blocking the pinning line.`
          );
          break;
        case "fork":
          recommendations.push(
            `Avoid the fork by moving one of the threatened pieces or blocking the forking square.`
          );
          break;
        case "mate_threat":
          recommendations.push(
            `Defend against the mate threat immediately - this is your top priority!`
          );
          break;
      }
    });

    // Strategic recommendations
    switch (strategicIntent.primary) {
      case "center_control":
        recommendations.push(
          `Challenge the center control by advancing your own pawns or developing pieces to central squares.`
        );
        break;
      case "piece_development":
        recommendations.push(
          `Focus on your own development to match the opponent's activity level.`
        );
        break;
      case "king_safety":
        recommendations.push(
          `Look for tactical opportunities while the opponent is being defensive.`
        );
        break;
    }

    return recommendations;
  }

  /**
   * Suggest counterplay
   */
  private suggestCounterplay(
    primary: string,
    centerControl: any,
    development: any,
    kingSafety: any,
    pawnStructure: any
  ): string[] {
    const counterplay: string[] = [];

    if (centerControl.score > 0.6) {
      counterplay.push("Challenge the center with e4/e5 or d4/d5");
      counterplay.push(
        "Develop knights to c3/f3 or c6/f6 to support center control"
      );
    }

    if (development.score > 0.6) {
      counterplay.push("Match their development pace");
      counterplay.push("Look for tactical opportunities while they develop");
    }

    if (kingSafety.score < 0.4) {
      counterplay.push("Exploit the exposed king with tactical attacks");
      counterplay.push("Create threats that force defensive moves");
    }

    return counterplay;
  }

  // Helper methods
  private getOpponentColor(): "w" | "b" {
    return this.chess.turn() === "w" ? "b" : "w";
  }

  private hasAttackingPieces(square: Square): boolean {
    return this.chess.moves({ square, verbose: true }).length > 0;
  }

  private findPieceSquare(piece: any): Square | null {
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = (String.fromCharCode(97 + file) + (8 - rank)) as Square;
        const boardPiece = this.chess.get(square);
        if (
          boardPiece &&
          boardPiece.type === piece.type &&
          boardPiece.color === piece.color
        ) {
          return square;
        }
      }
    }
    return null;
  }

  private isDevelopedSquare(square: Square, color: "w" | "b"): boolean {
    const rank = parseInt(square[1]);
    const isWhite = color === "w";
    return isWhite ? rank <= 6 : rank >= 3;
  }

  private findKingSquare(color: "w" | "b"): Square | null {
    return this.findPieceSquare({ type: "k", color });
  }

  private isCastled(square: Square, color: "w" | "b"): boolean {
    const isWhite = color === "w";
    return isWhite
      ? square === "g1" || square === "c1"
      : square === "g8" || square === "c8";
  }

  private hasPawnShield(square: Square, color: "w" | "b"): boolean {
    // Simplified pawn shield detection
    const adjacentSquares = this.getAdjacentSquares(square);
    return adjacentSquares.some((adjSquare) => {
      const piece = this.chess.get(adjSquare);
      return piece && piece.type === "p" && piece.color === color;
    });
  }

  private isKingExposed(square: Square, color: "w" | "b"): boolean {
    // Simplified king exposure detection
    const attackingMoves = this.chess.moves({ square, verbose: true });
    return attackingMoves.length > 0;
  }

  private isIsolatedPawn(square: Square, color: "w" | "b"): boolean {
    // Simplified isolated pawn detection
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1]);

    // Check if there are pawns on adjacent files
    const leftFile = file > 0 ? file - 1 : -1;
    const rightFile = file < 7 ? file + 1 : -1;

    let hasAdjacentPawns = false;

    if (leftFile >= 0) {
      for (let r = 1; r <= 8; r++) {
        const piece = this.chess.get(
          (String.fromCharCode(97 + leftFile) + r) as Square
        );
        if (piece && piece.type === "p" && piece.color === color) {
          hasAdjacentPawns = true;
          break;
        }
      }
    }

    if (rightFile >= 0 && !hasAdjacentPawns) {
      for (let r = 1; r <= 8; r++) {
        const piece = this.chess.get(
          (String.fromCharCode(97 + rightFile) + r) as Square
        );
        if (piece && piece.type === "p" && piece.color === color) {
          hasAdjacentPawns = true;
          break;
        }
      }
    }

    return !hasAdjacentPawns;
  }

  private getAdjacentSquares(square: Square): Square[] {
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1]);
    const adjacent: Square[] = [];

    for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
      for (let r = Math.max(1, rank - 1); r <= Math.min(8, rank + 1); r++) {
        if (f !== file || r !== rank) {
          adjacent.push((String.fromCharCode(97 + f) + r) as Square);
        }
      }
    }

    return adjacent;
  }

  /**
   * Get default analysis when something goes wrong
   */
  private getDefaultAnalysis(): OpponentAnalysis {
    return {
      threats: [],
      strategicIntent: {
        primary: "positional_improvement",
        secondary: [],
        description: "Unable to analyze opponent position at this time.",
        confidence: 0.5,
      },
      overallAssessment: "Analysis temporarily unavailable.",
      recommendations: [
        "Continue with your current plan",
        "Stay alert for tactical opportunities",
      ],
    };
  }
}

export const opponentAnalyzer = new OpponentAnalyzer();
