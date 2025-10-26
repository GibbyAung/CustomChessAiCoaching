"use client";

import { Chess } from "chess.js";
import { stockfishCoaching } from "./stockfish-coaching";

// Advanced AI Coaching System with Multiple Personalities and ML-like Features

export interface CoachingPersonality {
  id: string;
  name: string;
  style:
    | "aggressive"
    | "defensive"
    | "tactical"
    | "positional"
    | "creative"
    | "analytical";
  expertise: string[];
  communicationStyle:
    | "encouraging"
    | "direct"
    | "detailed"
    | "casual"
    | "professional";
  emoji: string;
  catchphrases: string[];
  focusAreas: string[];
}

export interface PlayerProfile {
  playingStyle:
    | "aggressive"
    | "defensive"
    | "balanced"
    | "tactical"
    | "positional";
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert";
  strengths: string[];
  weaknesses: string[];
  preferredOpenings: string[];
  commonMistakes: string[];
  learningGoals: string[];
  gamesPlayed: number;
  improvementAreas: string[];
}

export interface AdvancedCoachingAnalysis {
  moveQuality:
    | "brilliant"
    | "excellent"
    | "good"
    | "inaccurate"
    | "mistake"
    | "blunder";
  tacticalInsights: {
    tactics: string[];
    threats: string[];
    opportunities: string[];
    defenses: string[];
  };
  positionalInsights: {
    pawnStructure: string;
    pieceActivity: string;
    kingSafety: string;
    spaceControl: string;
    development: string;
  };
  strategicPlan: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
  alternativeMoves: {
    move: string;
    evaluation: number;
    explanation: string;
    whyBetter: string;
  }[];
  learningPoints: string[];
  personalizedAdvice: string;
  nextMoveSuggestions: string[];
  gamePhase: "opening" | "middlegame" | "endgame";
  complexity: "simple" | "moderate" | "complex" | "expert";
}

export class AdvancedAICoaching {
  private chess: Chess;
  private personalities: CoachingPersonality[];
  private currentPersonality: CoachingPersonality;
  private playerProfile: PlayerProfile;
  private gameHistory: Array<{
    fen: string;
    move: string;
    analysis: AdvancedCoachingAnalysis;
    timestamp: number;
  }> = [];

  constructor() {
    this.chess = new Chess();
    this.personalities = this.initializePersonalities();
    this.currentPersonality = this.personalities[0];
    this.playerProfile = this.initializePlayerProfile();
  }

  private initializePersonalities(): CoachingPersonality[] {
    return [
      {
        id: "alex_tactical",
        name: "Alex the Tactician",
        style: "tactical",
        expertise: ["tactics", "combinations", "calculations"],
        communicationStyle: "encouraging",
        emoji: "⚡",
        catchphrases: [
          "Let's find the killer move!",
          "Tactics win games!",
          "Calculate like a master!",
        ],
        focusAreas: [
          "tactical patterns",
          "calculation",
          "combinational vision",
        ],
      },
      {
        id: "sophia_positional",
        name: "Sophia the Strategist",
        style: "positional",
        expertise: ["positional play", "pawn structures", "long-term planning"],
        communicationStyle: "detailed",
        emoji: "🧠",
        catchphrases: [
          "Think strategically!",
          "Position before tactics!",
          "Plan like a grandmaster!",
        ],
        focusAreas: [
          "positional understanding",
          "pawn structures",
          "strategic planning",
        ],
      },
      {
        id: "marcus_aggressive",
        name: "Marcus the Attacker",
        style: "aggressive",
        expertise: ["attacking play", "king hunts", "sacrifices"],
        communicationStyle: "direct",
        emoji: "🔥",
        catchphrases: [
          "Attack with fury!",
          "No mercy!",
          "Strike while the iron is hot!",
        ],
        focusAreas: ["attacking techniques", "king safety", "sacrificial play"],
      },
      {
        id: "elena_defensive",
        name: "Elena the Defender",
        style: "defensive",
        expertise: ["defense", "counterplay", "resilience"],
        communicationStyle: "professional",
        emoji: "🛡️",
        catchphrases: [
          "Defend with precision!",
          "Turn defense into attack!",
          "Stay solid!",
        ],
        focusAreas: ["defensive techniques", "counterplay", "resilience"],
      },
      {
        id: "kai_creative",
        name: "Kai the Creative",
        style: "creative",
        expertise: ["unusual moves", "creativity", "originality"],
        communicationStyle: "casual",
        emoji: "🎨",
        catchphrases: [
          "Think outside the box!",
          "Be creative!",
          "Surprise your opponent!",
        ],
        focusAreas: ["creative play", "unusual moves", "originality"],
      },
      {
        id: "dr_analytical",
        name: "Dr. Analytical",
        style: "analytical",
        expertise: [
          "deep analysis",
          "engine evaluation",
          "precise calculation",
        ],
        communicationStyle: "professional",
        emoji: "🔬",
        catchphrases: [
          "Let's analyze this precisely!",
          "Data doesn't lie!",
          "Be precise!",
        ],
        focusAreas: [
          "precise calculation",
          "engine analysis",
          "mathematical approach",
        ],
      },
    ];
  }

  private initializePlayerProfile(): PlayerProfile {
    return {
      playingStyle: "balanced",
      skillLevel: "intermediate",
      strengths: [],
      weaknesses: [],
      preferredOpenings: [],
      commonMistakes: [],
      learningGoals: ["improve tactics", "better positional understanding"],
      gamesPlayed: 0,
      improvementAreas: [],
    };
  }

  // Switch coaching personality
  switchPersonality(personalityId: string): CoachingPersonality {
    const personality = this.personalities.find((p) => p.id === personalityId);
    if (personality) {
      this.currentPersonality = personality;
    }
    return this.currentPersonality;
  }

  // Get all available personalities
  getPersonalities(): CoachingPersonality[] {
    return this.personalities;
  }

  // Advanced position analysis with personality-based coaching
  async analyzePosition(
    fen: string,
    lastMove?: string
  ): Promise<AdvancedCoachingAnalysis> {
    this.chess.load(fen);

    // Get basic Stockfish analysis
    const basicAnalysis = await stockfishCoaching.analyzePosition(fen, {
      maxDepth: 16,
      maxTimeMs: 2000,
      includeOpponentAnalysis: true,
      includeBlunderAnalysis: true,
    });

    // Generate advanced analysis based on personality
    const advancedAnalysis = await this.generateAdvancedAnalysis(
      fen,
      lastMove,
      basicAnalysis
    );

    // Store in game history
    this.gameHistory.push({
      fen,
      move: lastMove || "",
      analysis: advancedAnalysis,
      timestamp: Date.now(),
    });

    // Update player profile based on analysis
    this.updatePlayerProfile(advancedAnalysis);

    return advancedAnalysis;
  }

  private async generateAdvancedAnalysis(
    fen: string,
    lastMove: string | undefined,
    basicAnalysis: any
  ): Promise<AdvancedCoachingAnalysis> {
    const gamePhase = this.determineGamePhase(fen);
    const complexity = this.assessComplexity(fen);

    // Generate personality-specific insights
    const tacticalInsights = this.generateTacticalInsights(fen, basicAnalysis);
    const positionalInsights = this.generatePositionalInsights(
      fen,
      basicAnalysis
    );
    const strategicPlan = this.generateStrategicPlan(fen, gamePhase);
    const alternativeMoves = this.generateAlternativeMoves(fen, basicAnalysis);
    const learningPoints = this.generateLearningPoints(fen, basicAnalysis);
    const personalizedAdvice = this.generatePersonalizedAdvice(
      fen,
      basicAnalysis
    );
    const nextMoveSuggestions = this.generateNextMoveSuggestions(
      fen,
      basicAnalysis
    );

    return {
      moveQuality: this.assessMoveQuality(basicAnalysis),
      tacticalInsights,
      positionalInsights,
      strategicPlan,
      alternativeMoves,
      learningPoints,
      personalizedAdvice,
      nextMoveSuggestions,
      gamePhase,
      complexity,
    };
  }

  private determineGamePhase(
    fen: string
  ): "opening" | "middlegame" | "endgame" {
    const moveCount = this.chess.history().length;
    const materialCount = this.countMaterial(fen);

    if (moveCount < 15) return "opening";
    if (materialCount < 20) return "endgame";
    return "middlegame";
  }

  private assessComplexity(
    fen: string
  ): "simple" | "moderate" | "complex" | "expert" {
    const tacticalComplexity = this.assessTacticalComplexity(fen);
    const positionalComplexity = this.assessPositionalComplexity(fen);

    const totalComplexity = tacticalComplexity + positionalComplexity;

    if (totalComplexity < 3) return "simple";
    if (totalComplexity < 6) return "moderate";
    if (totalComplexity < 9) return "complex";
    return "expert";
  }

  private assessTacticalComplexity(fen: string): number {
    let complexity = 0;

    // Check for tactical motifs
    if (this.hasPins(fen)) complexity += 2;
    if (this.hasForks(fen)) complexity += 2;
    if (this.hasSkewers(fen)) complexity += 2;
    if (this.hasDiscoveredAttacks(fen)) complexity += 3;
    if (this.hasSacrifices(fen)) complexity += 3;

    return Math.min(complexity, 5);
  }

  private assessPositionalComplexity(fen: string): number {
    let complexity = 0;

    // Check for positional factors
    if (this.hasWeakPawns(fen)) complexity += 1;
    if (this.hasWeakSquares(fen)) complexity += 1;
    if (this.hasBadBishops(fen)) complexity += 1;
    if (this.hasKingSafetyIssues(fen)) complexity += 2;
    if (this.hasSpaceAdvantages(fen)) complexity += 1;

    return Math.min(complexity, 5);
  }

  private generateTacticalInsights(fen: string, basicAnalysis: any): any {
    const insights = {
      tactics: [] as string[],
      threats: [] as string[],
      opportunities: [] as string[],
      defenses: [] as string[],
    };

    // Personality-specific tactical analysis
    switch (this.currentPersonality.style) {
      case "tactical":
        insights.tactics = this.findTacticalPatterns(fen);
        insights.opportunities = this.findTacticalOpportunities(fen);
        break;
      case "aggressive":
        insights.threats = this.findAttackingOpportunities(fen);
        insights.opportunities = this.findSacrificialPossibilities(fen);
        break;
      case "defensive":
        insights.defenses = this.findDefensiveResources(fen);
        insights.threats = this.findDefensiveThreats(fen);
        break;
    }

    return insights;
  }

  private generatePositionalInsights(fen: string, basicAnalysis: any): any {
    return {
      pawnStructure: this.analyzePawnStructure(fen),
      pieceActivity: this.analyzePieceActivity(fen),
      kingSafety: this.analyzeKingSafety(fen),
      spaceControl: this.analyzeSpaceControl(fen),
      development: this.analyzeDevelopment(fen),
    };
  }

  private generateStrategicPlan(fen: string, gamePhase: string): any {
    const plan = {
      shortTerm: [] as string[],
      mediumTerm: [] as string[],
      longTerm: [] as string[],
    };

    // Personality-specific strategic planning
    switch (this.currentPersonality.style) {
      case "positional":
        plan.shortTerm = this.generatePositionalShortTerm(fen);
        plan.mediumTerm = this.generatePositionalMediumTerm(fen);
        plan.longTerm = this.generatePositionalLongTerm(fen);
        break;
      case "aggressive":
        plan.shortTerm = this.generateAttackingShortTerm(fen);
        plan.mediumTerm = this.generateAttackingMediumTerm(fen);
        plan.longTerm = this.generateAttackingLongTerm(fen);
        break;
      case "defensive":
        plan.shortTerm = this.generateDefensiveShortTerm(fen);
        plan.mediumTerm = this.generateDefensiveMediumTerm(fen);
        plan.longTerm = this.generateDefensiveLongTerm(fen);
        break;
    }

    return plan;
  }

  private generateAlternativeMoves(fen: string, basicAnalysis: any): any[] {
    // Generate alternative moves with explanations
    const alternatives: any[] = [];

    if (basicAnalysis.moveHints && basicAnalysis.moveHints.length > 0) {
      for (const hint of basicAnalysis.moveHints.slice(0, 3)) {
        alternatives.push({
          move: hint.move,
          evaluation: hint.evaluation || 0,
          explanation: hint.description,
          whyBetter: this.explainWhyBetter(hint, basicAnalysis),
        });
      }
    }

    return alternatives;
  }

  private generateLearningPoints(fen: string, basicAnalysis: any): string[] {
    const points: string[] = [];

    // Personality-specific learning points
    switch (this.currentPersonality.style) {
      case "tactical":
        points.push("Look for tactical patterns in every position");
        points.push("Calculate forcing moves first");
        points.push("Always check for checks, captures, and threats");
        break;
      case "positional":
        points.push("Evaluate pawn structures carefully");
        points.push("Consider piece activity and coordination");
        points.push("Plan for long-term advantages");
        break;
      case "aggressive":
        points.push("Look for attacking opportunities");
        points.push("Consider sacrifices for initiative");
        points.push("Keep the king under pressure");
        break;
    }

    return points;
  }

  private generatePersonalizedAdvice(fen: string, basicAnalysis: any): string {
    const catchphrase =
      this.currentPersonality.catchphrases[
        Math.floor(Math.random() * this.currentPersonality.catchphrases.length)
      ];

    const advice = this.generatePersonalitySpecificAdvice(fen, basicAnalysis);

    return `${this.currentPersonality.emoji} ${catchphrase} ${advice}`;
  }

  private generateNextMoveSuggestions(
    fen: string,
    basicAnalysis: any
  ): string[] {
    const suggestions: string[] = [];

    if (basicAnalysis.bestMove) {
      suggestions.push(
        `Consider ${basicAnalysis.bestMove} - ${this.explainMove(
          basicAnalysis.bestMove,
          fen
        )}`
      );
    }

    // Add personality-specific suggestions
    switch (this.currentPersonality.style) {
      case "tactical":
        suggestions.push("Look for tactical shots and combinations");
        break;
      case "positional":
        suggestions.push("Focus on improving your position");
        break;
      case "aggressive":
        suggestions.push("Look for attacking opportunities");
        break;
    }

    return suggestions;
  }

  // Helper methods for analysis
  private countMaterial(fen: string): number {
    const pieces = fen.split(" ")[0];
    return pieces.replace(/[^rnbqkpRNBQKP]/g, "").length;
  }

  private hasPins(fen: string): boolean {
    // Simplified pin detection
    return Math.random() > 0.7; // Placeholder
  }

  private hasForks(fen: string): boolean {
    // Simplified fork detection
    return Math.random() > 0.8; // Placeholder
  }

  private hasSkewers(fen: string): boolean {
    // Simplified skewer detection
    return Math.random() > 0.9; // Placeholder
  }

  private hasDiscoveredAttacks(fen: string): boolean {
    // Simplified discovered attack detection
    return Math.random() > 0.85; // Placeholder
  }

  private hasSacrifices(fen: string): boolean {
    // Simplified sacrifice detection
    return Math.random() > 0.9; // Placeholder
  }

  private hasWeakPawns(fen: string): boolean {
    // Simplified weak pawn detection
    return Math.random() > 0.6; // Placeholder
  }

  private hasWeakSquares(fen: string): boolean {
    // Simplified weak square detection
    return Math.random() > 0.7; // Placeholder
  }

  private hasBadBishops(fen: string): boolean {
    // Simplified bad bishop detection
    return Math.random() > 0.8; // Placeholder
  }

  private hasKingSafetyIssues(fen: string): boolean {
    // Simplified king safety detection
    return Math.random() > 0.7; // Placeholder
  }

  private hasSpaceAdvantages(fen: string): boolean {
    // Simplified space advantage detection
    return Math.random() > 0.6; // Placeholder
  }

  // Placeholder methods for various analyses
  private findTacticalPatterns(fen: string): string[] {
    return ["Pin on the queen", "Fork opportunity", "Discovered attack"];
  }

  private findTacticalOpportunities(fen: string): string[] {
    return ["Sacrifice for mate", "Tactical combination", "Forcing sequence"];
  }

  private findAttackingOpportunities(fen: string): string[] {
    return ["King attack", "Sacrificial attack", "Initiative"];
  }

  private findSacrificialPossibilities(fen: string): string[] {
    return ["Piece sacrifice", "Pawn sacrifice", "Exchange sacrifice"];
  }

  private findDefensiveResources(fen: string): string[] {
    return ["Defensive moves", "Counterplay", "Resilience"];
  }

  private findDefensiveThreats(fen: string): string[] {
    return ["Defensive threats", "Counter-attack", "Defensive resources"];
  }

  private analyzePawnStructure(fen: string): string {
    return (
      "Pawn structure analysis: " +
      (Math.random() > 0.5 ? "Solid" : "Needs improvement")
    );
  }

  private analyzePieceActivity(fen: string): string {
    return (
      "Piece activity: " +
      (Math.random() > 0.5 ? "Good coordination" : "Pieces need activation")
    );
  }

  private analyzeKingSafety(fen: string): string {
    return "King safety: " + (Math.random() > 0.5 ? "Secure" : "Vulnerable");
  }

  private analyzeSpaceControl(fen: string): string {
    return (
      "Space control: " +
      (Math.random() > 0.5 ? "Good space advantage" : "Limited space")
    );
  }

  private analyzeDevelopment(fen: string): string {
    return (
      "Development: " +
      (Math.random() > 0.5 ? "Well developed" : "Behind in development")
    );
  }

  // Strategic planning methods
  private generatePositionalShortTerm(fen: string): string[] {
    return ["Improve piece placement", "Strengthen pawn structure"];
  }

  private generatePositionalMediumTerm(fen: string): string[] {
    return ["Create long-term advantages", "Plan piece coordination"];
  }

  private generatePositionalLongTerm(fen: string): string[] {
    return ["Convert advantages", "Endgame preparation"];
  }

  private generateAttackingShortTerm(fen: string): string[] {
    return ["Look for attacking moves", "Create threats"];
  }

  private generateAttackingMediumTerm(fen: string): string[] {
    return ["Build up attack", "Sacrifice for initiative"];
  }

  private generateAttackingLongTerm(fen: string): string[] {
    return ["Deliver checkmate", "Win material"];
  }

  private generateDefensiveShortTerm(fen: string): string[] {
    return ["Defend against threats", "Find counterplay"];
  }

  private generateDefensiveMediumTerm(fen: string): string[] {
    return ["Stabilize position", "Look for counter-attacks"];
  }

  private generateDefensiveLongTerm(fen: string): string[] {
    return ["Turn defense into attack", "Equalize position"];
  }

  private explainWhyBetter(hint: any, basicAnalysis: any): string {
    return `This move is better because it ${hint.description.toLowerCase()}`;
  }

  private explainMove(move: string, fen: string): string {
    return `improves your position and follows good chess principles`;
  }

  private generatePersonalitySpecificAdvice(
    fen: string,
    basicAnalysis: any
  ): string {
    switch (this.currentPersonality.style) {
      case "tactical":
        return "Focus on finding tactical patterns and calculating variations carefully.";
      case "positional":
        return "Consider the long-term aspects of your position and plan strategically.";
      case "aggressive":
        return "Look for attacking opportunities and don't be afraid to sacrifice for initiative.";
      case "defensive":
        return "Stay solid and look for counterplay opportunities.";
      case "creative":
        return "Think outside the box and consider unusual moves.";
      case "analytical":
        return "Analyze the position precisely and calculate all variations.";
      default:
        return "Continue playing and learning from each position.";
    }
  }

  private assessMoveQuality(
    basicAnalysis: any
  ): "brilliant" | "excellent" | "good" | "inaccurate" | "mistake" | "blunder" {
    if (basicAnalysis.moveHints && basicAnalysis.moveHints.length > 0) {
      const hint = basicAnalysis.moveHints[0];
      switch (hint.type) {
        case "blunder":
          return "blunder";
        case "mistake":
          return "mistake";
        case "inaccuracy":
          return "inaccurate";
        case "good":
          return "good";
        case "excellent":
          return "excellent";
        case "brilliant":
          return "brilliant";
        default:
          return "good";
      }
    }
    return "good";
  }

  private updatePlayerProfile(analysis: AdvancedCoachingAnalysis): void {
    // Update player profile based on analysis
    this.playerProfile.gamesPlayed++;

    // Update strengths and weaknesses based on analysis
    if (
      analysis.moveQuality === "brilliant" ||
      analysis.moveQuality === "excellent"
    ) {
      // Add to strengths
    } else if (
      analysis.moveQuality === "blunder" ||
      analysis.moveQuality === "mistake"
    ) {
      // Add to weaknesses
    }
  }

  // Get current personality
  getCurrentPersonality(): CoachingPersonality {
    return this.currentPersonality;
  }

  // Get player profile
  getPlayerProfile(): PlayerProfile {
    return this.playerProfile;
  }

  // Get game history
  getGameHistory(): any[] {
    return this.gameHistory;
  }
}

// Export singleton instance
export const advancedAICoaching = new AdvancedAICoaching();
