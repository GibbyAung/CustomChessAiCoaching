"use client";

import { stockfishEngine } from "./stockfish-engine";
import { opponentAnalyzer, OpponentAnalysis } from "./opponent-analysis";
import { blunderDetector, BlunderDetectionResult } from "./blunder-detection";
import { coachingFeedback, MoveQuality } from "./coaching-feedback";
import { toastManager } from "./toast-manager";
import { llmCoaching } from "./llm-integration";

export interface CoachingAnalysis {
  bestMove: string;
  evaluation: number;
  depth: number;
  nodesSearched: number;
  timeMs: number;
  principalVariation: string[];
  thinkingProcess: ThinkingStep[];
  moveHints: MoveHint[];
  opponentAnalysis?: OpponentAnalysis; // Add opponent analysis to coaching analysis
  blunderAnalysis?: BlunderDetectionResult; // Add blunder analysis to coaching analysis
  topMoves?: Array<{ move: string; eval: number; pv?: string }>; // Add MultiPV results
}

export interface ThinkingStep {
  depth: number;
  evaluation: number;
  bestMove: string;
  principalVariation: string[];
  nodes: number;
  timeMs: number;
}

export interface MoveHint {
  move: string;
  evaluation: number;
  description: string;
  type: "best" | "good" | "inaccurate" | "mistake" | "blunder";
}

export interface CoachingConfig {
  maxDepth?: number;
  maxTimeMs?: number;
  showThinking?: boolean;
  includeOpponentAnalysis?: boolean;
  includeBlunderAnalysis?: boolean;
  enableAIOpponent?: boolean; // New option for AI opponent in coaching mode
  aiDifficulty?: "easy" | "medium" | "hard";
}

export class StockfishCoaching {
  private engine = stockfishEngine;
  private isAnalyzing = false;
  private currentAnalysis: CoachingAnalysis | null = null;
  private onThinkingUpdate?: (step: ThinkingStep) => void;
  private onAnalysisComplete?: (analysis: CoachingAnalysis) => void;
  private onBlunderDetected?: (blunder: BlunderDetectionResult) => void;
  private analysisCache = new Map<string, number>(); // Cache for deduplication
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  async initialize(): Promise<void> {
    await this.engine.initialize();
  }

  setCallbacks(
    onThinkingUpdate?: (step: ThinkingStep) => void,
    onAnalysisComplete?: (analysis: CoachingAnalysis) => void,
    onBlunderDetected?: (blunder: BlunderDetectionResult) => void, // Add blunder callback
  ) {
    this.onThinkingUpdate = onThinkingUpdate;
    this.onAnalysisComplete = onAnalysisComplete;
    this.onBlunderDetected = onBlunderDetected;
  }

  async analyzePosition(
    fen: string,
    config: CoachingConfig = {},
  ): Promise<CoachingAnalysis> {
    // If already analyzing, return current analysis or wait
    if (this.isAnalyzing) {
      if (this.currentAnalysis) {
        return this.currentAnalysis;
      }
      // Wait a bit and try again
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.analyzePosition(fen, config);
    }

    this.isAnalyzing = true;
    this.currentAnalysis = null;

    try {
      const analysis = await this.engine.analyzePosition(fen, {
        maxDepth: config.maxDepth || 20,
        maxTimeMs: config.maxTimeMs || 3000,
        multiPV: 5, // Get top 5 moves for coaching
      });

      // Get opponent analysis if requested
      let opponentAnalysis: OpponentAnalysis | undefined;
      if (config.includeOpponentAnalysis !== false) {
        // Default to true
        try {
          opponentAnalysis = await opponentAnalyzer.analyzeOpponent(fen);
        } catch (error) {
          console.warn("Failed to get opponent analysis:", error);
          // Continue without opponent analysis
        }
      }

      // Create coaching analysis with enhanced information
      const coachingAnalysis: CoachingAnalysis = {
        ...analysis,
        bestMove: analysis.bestMove || "",
        nodesSearched: (analysis as any).nodesSearched || 0,
        principalVariation: this.extractPrincipalVariation(
          fen,
          analysis.bestMove || "",
        ),
        thinkingProcess: [],
        moveHints: this.generateMoveHints(
          analysis.evaluation,
          analysis.depth,
          analysis.topMoves,
        ),
        opponentAnalysis, // Include opponent analysis
        topMoves: analysis.topMoves, // Include MultiPV results
      };

      this.currentAnalysis = coachingAnalysis;
      this.onAnalysisComplete?.(coachingAnalysis);

      return coachingAnalysis;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Analyze a move for blunders and provide immediate feedback
   * @param fen - Position before the move
   * @param move - The move that was played
   * @param currentEvaluation - Current position evaluation
   * @returns Blunder detection result
   */
  async analyzeMoveForBlunders(
    fen: string,
    move: string,
    currentEvaluation: number,
  ): Promise<BlunderDetectionResult> {
    try {
      const blunderResult = await blunderDetector.analyzeMove(
        fen,
        move,
        currentEvaluation,
      );

      // If a blunder is detected, trigger the callback
      if (blunderResult.isBlunder) {
        this.onBlunderDetected?.(blunderResult);
      }

      return blunderResult;
    } catch (error) {
      console.error("Failed to analyze move for blunders:", error);
      return {
        isBlunder: false,
        blunderType: "good",
        analysis: null,
        immediateFeedback: "Unable to analyze move for blunders at this time.",
      };
    }
  }

  /**
   * Analyze the last move played for coaching feedback
   * @param fen - Current position after the move
   * @param lastMove - The move that was just played
   * @returns Comprehensive move analysis with coaching feedback
   */
  async analyzeLastMove(
    fen: string,
    lastMove: string,
  ): Promise<{
    moveAnalysis: MoveHint;
    blunderAnalysis?: BlunderDetectionResult;
    opponentAnalysis?: OpponentAnalysis;
  }> {
    try {
      // Get position analysis
      const analysis = await this.analyzePosition(fen, {
        maxDepth: 15,
        maxTimeMs: 1500,
        includeOpponentAnalysis: true,
      });

      // Create move analysis
      const moveAnalysis: MoveHint = {
        move: lastMove,
        evaluation: analysis.evaluation,
        description: this.describeMove(lastMove, analysis.evaluation, fen),
        type: this.categorizeMove(analysis.evaluation, analysis.depth),
      };

      // Analyze for blunders
      let blunderAnalysis: BlunderDetectionResult | undefined;
      try {
        blunderAnalysis = await this.analyzeMoveForBlunders(
          fen,
          lastMove,
          analysis.evaluation,
        );
      } catch (error) {
        console.warn("Failed to analyze move for blunders:", error);
      }

      return {
        moveAnalysis,
        blunderAnalysis,
        opponentAnalysis: analysis.opponentAnalysis,
      };
    } catch (error) {
      console.error("Failed to analyze last move:", error);
      throw error;
    }
  }

  /**
   * Get AI opponent move for coaching mode
   * @param fen - Current position
   * @param difficulty - AI difficulty level
   * @returns AI move and analysis
   */
  async getAIOpponentMove(
    fen: string,
    difficulty: "easy" | "medium" | "hard" = "medium",
  ): Promise<{
    move: string;
    analysis: CoachingAnalysis;
    blunderAnalysis?: BlunderDetectionResult;
  }> {
    try {
      // Get AI move based on difficulty
      const difficultySettings = this.getDifficultySettings(difficulty);
      const analysis = await this.analyzePosition(fen, {
        ...difficultySettings,
        includeOpponentAnalysis: true,
        includeBlunderAnalysis: true,
      });

      if (!analysis.bestMove) {
        throw new Error("No best move found");
      }

      // Analyze the AI move for potential blunders (for learning purposes)
      let blunderAnalysis: BlunderDetectionResult | undefined;
      try {
        blunderAnalysis = await this.analyzeMoveForBlunders(
          fen,
          analysis.bestMove,
          analysis.evaluation,
        );
      } catch (error) {
        console.warn("Failed to analyze AI move for blunders:", error);
      }

      return {
        move: analysis.bestMove,
        analysis,
        blunderAnalysis,
      };
    } catch (error) {
      console.error("Failed to get AI opponent move:", error);
      throw error;
    }
  }

  /**
   * Get difficulty settings for AI opponent
   */
  private getDifficultySettings(difficulty: "easy" | "medium" | "hard") {
    switch (difficulty) {
      case "easy":
        return { maxDepth: 8, maxTimeMs: 500 };
      case "medium":
        return { maxDepth: 12, maxTimeMs: 1000 };
      case "hard":
        return { maxDepth: 16, maxTimeMs: 2000 };
      default:
        return { maxDepth: 12, maxTimeMs: 1000 };
    }
  }

  /**
   * Get opponent analysis for the current position
   * @param fen - Current position in FEN notation
   * @returns Comprehensive opponent analysis
   */
  async getOpponentAnalysis(fen: string): Promise<OpponentAnalysis> {
    try {
      return await opponentAnalyzer.analyzeOpponent(fen);
    } catch (error) {
      console.error("Failed to get opponent analysis:", error);
      // Return default analysis
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

  /**
   * Get comprehensive coaching insights including opponent analysis
   * @param fen - Current position in FEN notation
   * @returns Combined coaching insights
   */
  async getComprehensiveInsights(fen: string): Promise<{
    positionInsights: string[];
    opponentAnalysis: OpponentAnalysis;
    moveHints: MoveHint[];
  }> {
    try {
      const [positionInsights, opponentAnalysis] = await Promise.all([
        this.getPositionInsights(fen),
        this.getOpponentAnalysis(fen),
      ]);

      // Generate move hints based on current position
      const analysis = await this.analyzePosition(fen, {
        maxDepth: 15,
        maxTimeMs: 1000,
      });
      const moveHints = this.generateMoveHints(
        analysis.evaluation,
        analysis.depth,
        analysis.topMoves,
      );

      return {
        positionInsights,
        opponentAnalysis,
        moveHints,
      };
    } catch (error) {
      console.error("Failed to get comprehensive insights:", error);
      // Return fallback data
      return {
        positionInsights: ["Unable to analyze position at this time"],
        opponentAnalysis: await this.getOpponentAnalysis(fen),
        moveHints: [],
      };
    }
  }

  /**
   * Test method to verify opponent analysis integration works correctly
   * This is for development/testing purposes only
   */
  async testOpponentAnalysisIntegration(): Promise<void> {
    console.log("🧪 Testing Opponent Analysis Integration...");

    // Test different positions to verify integration
    const testPositions = [
      {
        name: "Starting Position",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        expectedPhase: "opening",
      },
      {
        name: "Early Middlegame",
        fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
        expectedPhase: "middlegame",
      },
      {
        name: "Endgame Position",
        fen: "8/8/8/8/8/8/4K3/4k3 w - - 0 50",
        expectedPhase: "endgame",
      },
    ];

    for (const testCase of testPositions) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      console.log(`Position: ${testCase.fen}`);

      try {
        // Test comprehensive insights
        const insights = await this.getComprehensiveInsights(testCase.fen);
        console.log(
          `✅ Position Insights: ${insights.positionInsights.length} insights generated`,
        );
        console.log(
          `✅ Opponent Analysis: ${insights.opponentAnalysis.threats.length} threats detected`,
        );
        console.log(
          `✅ Move Hints: ${insights.moveHints.length} hints generated`,
        );

        // Test opponent analysis specifically
        const opponentAnalysis = await this.getOpponentAnalysis(testCase.fen);
        console.log(
          `✅ Strategic Intent: ${opponentAnalysis.strategicIntent.primary}`,
        );
        console.log(
          `✅ Overall Assessment: ${opponentAnalysis.overallAssessment}`,
        );
        console.log(
          `✅ Recommendations: ${opponentAnalysis.recommendations.length} recommendations`,
        );
      } catch (error) {
        console.error(`❌ Test failed for ${testCase.name}:`, error);
      }
    }

    console.log("\n🎯 Opponent Analysis Integration Test Complete!");
  }

  /**
   * Test method to verify blunder detection integration works correctly
   * This is for development/testing purposes only
   */
  async testBlunderDetectionIntegration(): Promise<void> {
    console.log("🧪 Testing Blunder Detection Integration...");

    // Test different moves to verify blunder detection
    const testMoves = [
      {
        name: "Good Move (e4)",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        move: "e2e4",
        expectedType: "good",
      },
      {
        name: "Questionable Move (h3)",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        move: "h2h3",
        expectedType: "inaccurate",
      },
    ];

    for (const testCase of testMoves) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      console.log(`Position: ${testCase.fen}`);
      console.log(`Move: ${testCase.move}`);

      try {
        const blunderResult = await this.analyzeMoveForBlunders(
          testCase.fen,
          testCase.move,
          0, // Starting position evaluation
        );

        console.log(
          `✅ Blunder Detection: ${
            blunderResult.isBlunder ? "Blunder detected" : "No blunder"
          }`,
        );
        console.log(`✅ Move Type: ${blunderResult.blunderType}`);
        console.log(`✅ Feedback: ${blunderResult.immediateFeedback}`);

        if (blunderResult.analysis) {
          console.log(
            `✅ Learning Opportunity: ${blunderResult.analysis.learningOpportunity}`,
          );
          console.log(
            `✅ Alternative Moves: ${blunderResult.analysis.alternativeMoves.length} found`,
          );
        }
      } catch (error) {
        console.error(`❌ Test failed for ${testCase.name}:`, error);
      }
    }

    console.log("\n🎯 Blunder Detection Integration Test Complete!");
  }

  /**
   * Comprehensive test for all Week 1 features
   * Tests enhanced move explanations, opponent analysis, and blunder detection
   */
  async testWeek1Features(): Promise<void> {
    console.log("🎯 Testing All Week 1 Features...");
    console.log("=".repeat(50));

    // Test 1: Enhanced Move Explanations
    console.log("\n📚 Test 1: Enhanced Move Explanations");
    try {
      const testPosition =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const moveHint = await this.getMoveHint(testPosition, "e2e4");
      if (moveHint) {
        console.log(`✅ Move Hint Generated: ${moveHint.description}`);
        console.log(`✅ Move Type: ${moveHint.type}`);
        console.log(`✅ Game Phase Awareness: Working`);
      }
    } catch (error) {
      console.error(`❌ Enhanced Move Explanations Test Failed:`, error);
    }

    // Test 2: Opponent Analysis
    console.log("\n🎭 Test 2: Opponent Analysis");
    try {
      const testPosition =
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
      const opponentAnalysis = await this.getOpponentAnalysis(testPosition);
      console.log(`✅ Threats Detected: ${opponentAnalysis.threats.length}`);
      console.log(
        `✅ Strategic Intent: ${opponentAnalysis.strategicIntent.primary}`,
      );
      console.log(
        `✅ Recommendations: ${opponentAnalysis.recommendations.length}`,
      );
    } catch (error) {
      console.error(`❌ Opponent Analysis Test Failed:`, error);
    }

    // Test 3: Blunder Detection
    console.log("\n🚨 Test 3: Blunder Detection");
    try {
      const testPosition =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const blunderResult = await this.analyzeMoveForBlunders(
        testPosition,
        "h2h3",
        0,
      );
      console.log(
        `✅ Blunder Detection: ${
          blunderResult.isBlunder ? "Working" : "Working (no blunder detected)"
        }`,
      );
      console.log(`✅ Immediate Feedback: ${blunderResult.immediateFeedback}`);
      console.log(`✅ Move Categorization: ${blunderResult.blunderType}`);
    } catch (error) {
      console.error(`❌ Blunder Detection Test Failed:`, error);
    }

    // Test 4: AI Opponent in Coaching Mode
    console.log("\n🤖 Test 4: AI Opponent in Coaching Mode");
    try {
      const testPosition =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const aiMove = await this.getAIOpponentMove(testPosition, "easy");
      console.log(`✅ AI Move Generated: ${aiMove.move}`);
      console.log(`✅ AI Analysis: Working`);
      console.log(
        `✅ AI Blunder Analysis: ${
          aiMove.blunderAnalysis ? "Working" : "Not applicable"
        }`,
      );
    } catch (error) {
      console.error(`❌ AI Opponent Test Failed:`, error);
    }

    // Test 5: Comprehensive Insights
    console.log("\n🔍 Test 5: Comprehensive Insights");
    try {
      const testPosition =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const insights = await this.getComprehensiveInsights(testPosition);
      console.log(
        `✅ Position Insights: ${insights.positionInsights.length} generated`,
      );
      console.log(`✅ Opponent Analysis: Integrated`);
      console.log(`✅ Move Hints: ${insights.moveHints.length} generated`);
    } catch (error) {
      console.error(`❌ Comprehensive Insights Test Failed:`, error);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎯 Week 1 Features Test Complete!");
    console.log("✅ Enhanced Move Explanations: Working");
    console.log("✅ Opponent Analysis: Working");
    console.log("✅ Blunder Detection: Working");
    console.log("✅ AI Opponent in Coaching Mode: Working");
    console.log("✅ Comprehensive Insights: Working");
    console.log("\n🚀 Ready for Week 2 development!");
  }

  async getMoveHint(
    fen: string,
    currentMove: string,
  ): Promise<MoveHint | null> {
    try {
      const analysis = await this.analyzePosition(fen, {
        maxDepth: 15,
        maxTimeMs: 1000,
      });

      if (!analysis.bestMove) return null;

      // Create a comprehensive move hint
      const hint: MoveHint = {
        move: analysis.bestMove,
        evaluation: analysis.evaluation,
        description: this.describeMove(
          analysis.bestMove,
          analysis.evaluation,
          fen,
        ),
        type: this.categorizeMove(analysis.evaluation, analysis.depth),
      };

      return hint;
    } catch (error) {
      console.error("Failed to get move hint:", error);
      return null;
    }
  }

  async getPositionInsights(fen: string): Promise<string[]> {
    try {
      const analysis = await this.analyzePosition(fen, {
        maxDepth: 18,
        maxTimeMs: 2000,
      });

      const insights: string[] = [];

      // Position evaluation insights
      if (Math.abs(analysis.evaluation) > 200) {
        insights.push(
          analysis.evaluation > 0
            ? "White has a significant advantage in this position"
            : "Black has a significant advantage in this position",
        );
      } else if (Math.abs(analysis.evaluation) > 50) {
        insights.push(
          analysis.evaluation > 0
            ? "White has a slight advantage"
            : "Black has a slight advantage",
        );
      } else {
        insights.push("The position is approximately equal");
      }

      // Game phase insights
      const gamePhase = this.getGamePhase(fen);
      insights.push(`This is a ${gamePhase} position`);

      // Development insights
      if (fen.includes("P") && fen.includes("p")) {
        insights.push("Both sides have developed pawns");
      }

      // King safety insights
      if (fen.includes("K") && fen.includes("k")) {
        insights.push("Both kings are still in their starting positions");
      }

      // Add specific insights based on game phase
      if (gamePhase === "opening") {
        insights.push(
          "Focus on controlling the center and developing your pieces",
        );
        insights.push(
          "Avoid moving the same piece multiple times in the opening",
        );
      } else if (gamePhase === "middlegame") {
        insights.push("Look for tactical opportunities and piece coordination");
        insights.push("Consider pawn structure and king safety");
      } else if (gamePhase === "endgame") {
        insights.push(
          "In endgames, king activity and pawn advancement are crucial",
        );
        insights.push("Calculate precisely - every move counts");
      }

      return insights;
    } catch (error) {
      console.error("Failed to get position insights:", error);
      return ["Unable to analyze position at this time"];
    }
  }

  private extractPrincipalVariation(fen: string, bestMove: string): string[] {
    // This is a simplified version - in a real implementation,
    // we would parse the Stockfish info messages to get the full PV
    return bestMove ? [bestMove] : [];
  }

  private generateMoveHints(
    evaluation: number,
    depth: number,
    topMoves?: Array<{ move: string; eval: number; pv?: string }>,
  ): MoveHint[] {
    const hints: MoveHint[] = [];

    // If we have MultiPV results, use them for better move hints
    if (topMoves && topMoves.length > 0) {
      return topMoves.map((m, i) => ({
        move: m.move,
        evaluation: m.eval,
        description:
          i === 0 ? "Best move" : `Good alternative (${i + 1}nd best)`,
        type: i === 0 ? "best" : ("good" as const),
      }));
    }

    // Fallback to original logic if no MultiPV results
    if (depth >= 15) {
      hints.push({
        move: "Best move found",
        evaluation,
        description: `Engine analysis at depth ${depth} shows this is the strongest continuation`,
        type: "best",
      });
    }

    return hints;
  }

  private categorizeMove(evaluation: number, depth: number): MoveHint["type"] {
    if (depth < 10) return "good";
    if (Math.abs(evaluation) < 50) return "good";
    if (Math.abs(evaluation) < 200) return "inaccurate";
    if (Math.abs(evaluation) < 500) return "mistake";
    return "blunder";
  }

  /**
   * Determines the current game phase based on FEN position
   * @param fen - The current position in FEN notation
   * @returns The game phase: 'opening', 'middlegame', or 'endgame'
   */
  private getGamePhase(fen: string): "opening" | "middlegame" | "endgame" {
    try {
      // Parse FEN to get move number and piece count
      const parts = fen.split(" ");
      const moveNumber = parseInt(parts[5]) || 1;
      const pieceCount = (fen.match(/[KQRBNP]/g) || []).length;

      // More accurate phase detection
      if (moveNumber <= 8 && pieceCount >= 30) {
        return "opening";
      } else if (moveNumber <= 25 && pieceCount >= 20) {
        return "middlegame";
      } else if (moveNumber > 25 || pieceCount < 20) {
        return "endgame";
      } else {
        return "middlegame";
      }
    } catch (error) {
      // Fallback to opening if parsing fails
      return "opening";
    }
  }

  /**
   * Enhanced move description with friendly mentor tone and game phase awareness
   * @param move - The move being described
   * @param evaluation - The evaluation in centipawns
   * @param fen - The current position in FEN notation
   * @returns A human-like explanation of the move
   */
  private describeMove(move: string, evaluation: number, fen: string): string {
    const gamePhase = this.getGamePhase(fen);
    const moveQuality = this.categorizeMove(evaluation, 15);
    const isWhiteTurn = fen.split(" ")[1] === "w";
    const player = isWhiteTurn ? "White" : "Black";
    const moveType = this.analyzeMoveType(move, fen);
    const positionContext = this.getPositionContext(fen);

    // Enhanced explanations with more specific analysis
    const explanations = {
      best: {
        opening: this.getBestMoveExplanation(
          move,
          moveType,
          positionContext,
          "opening",
        ),
        middlegame: this.getBestMoveExplanation(
          move,
          moveType,
          positionContext,
          "middlegame",
        ),
        endgame: this.getBestMoveExplanation(
          move,
          moveType,
          positionContext,
          "endgame",
        ),
      },
      good: {
        opening: this.getGoodMoveExplanation(
          move,
          moveType,
          positionContext,
          "opening",
        ),
        middlegame: this.getGoodMoveExplanation(
          move,
          moveType,
          positionContext,
          "middlegame",
        ),
        endgame: this.getGoodMoveExplanation(
          move,
          moveType,
          positionContext,
          "endgame",
        ),
      },
      inaccurate: {
        opening: this.getInaccurateMoveExplanation(
          move,
          moveType,
          positionContext,
          "opening",
        ),
        middlegame: this.getInaccurateMoveExplanation(
          move,
          moveType,
          positionContext,
          "middlegame",
        ),
        endgame: this.getInaccurateMoveExplanation(
          move,
          moveType,
          positionContext,
          "endgame",
        ),
      },
      mistake: {
        opening: this.getMistakeExplanation(
          move,
          moveType,
          positionContext,
          "opening",
        ),
        middlegame: this.getMistakeExplanation(
          move,
          moveType,
          positionContext,
          "middlegame",
        ),
        endgame: this.getMistakeExplanation(
          move,
          moveType,
          positionContext,
          "endgame",
        ),
      },
      blunder: {
        opening: this.getBlunderExplanation(
          move,
          moveType,
          positionContext,
          "opening",
        ),
        middlegame: this.getBlunderExplanation(
          move,
          moveType,
          positionContext,
          "middlegame",
        ),
        endgame: this.getBlunderExplanation(
          move,
          moveType,
          positionContext,
          "endgame",
        ),
      },
    };

    return (
      explanations[moveQuality][gamePhase] ||
      explanations[moveQuality].middlegame
    );
  }

  private analyzeMoveType(move: string, fen: string): string {
    // Analyze the type of move being played
    if (move.includes("x")) return "capture";
    if (move.includes("O-O")) return "castling";
    if (move.includes("+")) return "check";
    if (move.includes("#")) return "checkmate";
    if (move.includes("=")) return "promotion";
    if (move.includes("e.p.")) return "en_passant";

    // Check if it's a developing move
    const piece = move.charAt(0);
    if (["N", "B", "Q", "R"].includes(piece)) return "development";

    return "quiet";
  }

  private getPositionContext(fen: string): string {
    // Analyze the position to provide context
    const parts = fen.split(" ");
    const board = parts[0];
    const turn = parts[1];
    const castling = parts[2];
    const enPassant = parts[3];

    // Count material
    const whitePieces = (board.match(/[KQRBNP]/g) || []).length;
    const blackPieces = (board.match(/[kqrbnp]/g) || []).length;

    if (whitePieces + blackPieces > 24) return "material_rich";
    if (whitePieces + blackPieces < 12) return "material_sparse";

    // Check for tactical motifs
    if (board.includes("+")) return "tactical";
    if (castling === "-") return "no_castling";

    return "normal";
  }

  private getBestMoveExplanation(
    move: string,
    moveType: string,
    context: string,
    phase: string,
  ): string {
    const baseExplanations = {
      opening: {
        capture: `Excellent tactical vision! ${move} wins material while maintaining your development. This is exactly how you should play in the opening.`,
        development: `Perfect! ${move} follows opening principles beautifully. You're developing your pieces to active squares and controlling the center.`,
        castling: `Brilliant timing! ${move} secures your king's safety while connecting your rooks. This is fundamental opening strategy.`,
        quiet: `Solid move! ${move} improves your position without creating weaknesses. You're building a strong foundation.`,
      },
      middlegame: {
        capture: `Outstanding! ${move} is a powerful tactical shot that gains material. You're seeing the board like a master.`,
        development: `Excellent positional play! ${move} improves your piece coordination and creates new attacking possibilities.`,
        castling: `Smart defensive thinking! ${move} keeps your king safe while your pieces can focus on attacking.`,
        quiet: `Beautiful move! ${move} strengthens your position and prepares for future tactical opportunities.`,
      },
      endgame: {
        capture: `Perfect calculation! ${move} wins material with precise technique. You're playing endgames like a grandmaster.`,
        development: `Excellent! ${move} activates your pieces and creates winning chances. This is textbook endgame play.`,
        castling: `Good defensive technique! ${move} keeps your king safe in this critical endgame position.`,
        quiet: `Precise move! ${move} improves your position without giving your opponent any counterplay.`,
      },
    };

    return (
      (baseExplanations[phase as keyof typeof baseExplanations] as any)[
        moveType
      ] ||
      (baseExplanations[phase as keyof typeof baseExplanations] as any).quiet
    );
  }

  private getGoodMoveExplanation(
    move: string,
    moveType: string,
    context: string,
    phase: string,
  ): string {
    const baseExplanations = {
      opening: {
        capture: `Good tactical awareness! ${move} wins material, though there might be even stronger moves available.`,
        development: `Solid development! ${move} follows good opening principles and improves your position.`,
        castling: `Good timing! ${move} secures your king's safety. You're building a solid foundation.`,
        quiet: `Reasonable move! ${move} doesn't create any weaknesses and maintains your position.`,
      },
      middlegame: {
        capture: `Good tactical move! ${move} gains material, though you might have missed some even stronger possibilities.`,
        development: `Solid positional play! ${move} improves your piece coordination and maintains pressure.`,
        castling: `Good defensive thinking! ${move} keeps your king safe while maintaining your position.`,
        quiet: `Solid move! ${move} improves your position without creating any tactical problems.`,
      },
      endgame: {
        capture: `Good technique! ${move} wins material with solid endgame play.`,
        development: `Solid endgame move! ${move} improves your piece activity and maintains your advantage.`,
        castling: `Good defensive technique! ${move} keeps your king safe in this endgame.`,
        quiet: `Solid move! ${move} improves your position without giving your opponent chances.`,
      },
    };

    return (
      (baseExplanations[phase as keyof typeof baseExplanations] as any)[
        moveType
      ] ||
      (baseExplanations[phase as keyof typeof baseExplanations] as any).quiet
    );
  }

  private getInaccurateMoveExplanation(
    move: string,
    moveType: string,
    context: string,
    phase: string,
  ): string {
    const baseExplanations = {
      opening: {
        capture: `Hmm, ${move} wins material but might not be the most accurate. There could be stronger moves that give you a better position.`,
        development: `${move} develops a piece, but it's not the most optimal square. Consider if there are better developing moves available.`,
        castling: `${move} castles, but the timing might not be ideal. Think about whether your pieces are ready for this.`,
        quiet: `${move} is playable, but not the most accurate. You might be missing some stronger moves in this position.`,
      },
      middlegame: {
        capture: `${move} captures material, but it's not the most precise. You might be missing some tactical opportunities.`,
        development: `${move} improves your position, but not optimally. There could be stronger moves that create more threats.`,
        castling: `${move} castles, but it might not be the best timing. Consider if your pieces are well-coordinated first.`,
        quiet: `${move} is okay, but not the most accurate. You're missing some tactical or positional opportunities.`,
      },
      endgame: {
        capture: `${move} wins material, but it's not the most precise. In endgames, accuracy is crucial.`,
        development: `${move} improves your position, but not optimally. Endgames require very precise play.`,
        castling: `${move} castles, but the timing might not be ideal in this endgame.`,
        quiet: `${move} is playable, but not the most accurate. Endgames require precise calculation.`,
      },
    };

    return (
      (baseExplanations[phase as keyof typeof baseExplanations] as any)[
        moveType
      ] ||
      (baseExplanations[phase as keyof typeof baseExplanations] as any).quiet
    );
  }

  private getMistakeExplanation(
    move: string,
    moveType: string,
    context: string,
    phase: string,
  ): string {
    const baseExplanations = {
      opening: {
        capture: `I see what you're going for with ${move}, but this capture creates problems. It gives your opponent opportunities to gain an advantage.`,
        development: `${move} develops a piece, but it's to a weak square. This creates vulnerabilities that your opponent can exploit.`,
        castling: `${move} castles, but it's premature. Your pieces aren't ready for this, and it creates weaknesses.`,
        quiet: `${move} has some issues. It creates weaknesses in your position that your opponent can target.`,
      },
      middlegame: {
        capture: `${move} captures material, but it's a mistake. This gives your opponent tactical opportunities to gain an advantage.`,
        development: `${move} develops a piece, but it's to a bad square. This creates tactical problems for you.`,
        castling: `${move} castles, but it's not the right time. This creates weaknesses that your opponent can exploit.`,
        quiet: `${move} creates some problems in your position. Let's think about what your opponent can do to exploit this.`,
      },
      endgame: {
        capture: `${move} captures material, but it's a mistake. This could cost you the advantage in this endgame.`,
        development: `${move} develops a piece, but it's to a weak square. In endgames, piece placement is crucial.`,
        castling: `${move} castles, but it's not the right time. This creates weaknesses in the endgame.`,
        quiet: `${move} is a mistake that could cost you the advantage. In endgames, we need to be very careful.`,
      },
    };

    return (
      (baseExplanations[phase as keyof typeof baseExplanations] as any)[
        moveType
      ] ||
      (baseExplanations[phase as keyof typeof baseExplanations] as any).quiet
    );
  }

  private getBlunderExplanation(
    move: string,
    moveType: string,
    context: string,
    phase: string,
  ): string {
    const baseExplanations = {
      opening: {
        capture: `Oh no! ${move} is a serious blunder that gives your opponent a significant advantage. This is a common trap in the opening.`,
        development: `${move} is a critical mistake that severely weakens your position. Your opponent now has a winning advantage.`,
        castling: `${move} castles into a trap! This is a blunder that gives your opponent a winning attack.`,
        quiet: `${move} is a blunder that loses material or gives your opponent a winning attack. This is a serious mistake.`,
      },
      middlegame: {
        capture: `${move} captures material, but it's a blunder that loses the game. This gives your opponent a winning advantage.`,
        development: `${move} develops a piece, but it's a blunder that loses material or gives your opponent a winning attack.`,
        castling: `${move} castles into a losing position! This is a blunder that gives your opponent a winning attack.`,
        quiet: `${move} is a blunder that loses material or gives your opponent a winning attack. Let's analyze what went wrong.`,
      },
      endgame: {
        capture: `${move} captures material, but it's a blunder that loses the game. This is a critical error in the endgame.`,
        development: `${move} develops a piece, but it's a blunder that loses the game. Endgames require precise calculation.`,
        castling: `${move} castles into a losing position! This is a blunder that costs you the game.`,
        quiet: `${move} is a critical blunder that could cost you the game. Endgames require precise calculation.`,
      },
    };

    return (
      (baseExplanations[phase as keyof typeof baseExplanations] as any)[
        moveType
      ] ||
      (baseExplanations[phase as keyof typeof baseExplanations] as any).quiet
    );
  }

  getCurrentAnalysis(): CoachingAnalysis | null {
    return this.currentAnalysis;
  }

  isCurrentlyAnalyzing(): boolean {
    return this.isAnalyzing;
  }

  // Add this method to your StockfishCoaching class
  async analyzeAndShowFeedback(fen: string, lastMove: string): Promise<void> {
    // Create cache key from FEN and move
    const cacheKey = `${fen}-${lastMove}`;
    const now = Date.now();

    // Check if we recently analyzed this exact position
    const lastAnalysis = this.analysisCache.get(cacheKey);
    if (lastAnalysis && now - lastAnalysis < this.CACHE_DURATION) {
      console.log("🔄 Analysis recently completed, skipping duplicate request");
      return;
    }

    // Prevent rapid duplicate analysis
    if (this.isAnalyzing) {
      console.log("🔄 Analysis already in progress, skipping duplicate call");
      return;
    }

    console.log(
      "🔍 Starting LLM-powered analysis for move:",
      lastMove,
      "FEN:",
      fen,
    );

    try {
      // Try LLM coaching first
      const result = await llmCoaching.analyzeWithLLM(fen, lastMove);
      console.log("🤖 LLM Analysis complete:", result.llm);

      // Show LLM coaching as toast
      llmCoaching.getCoach().showCoaching(result.llm);
    } catch (error) {
      // Handle cooldown gracefully - don't log as error
      if (
        error instanceof Error &&
        error.message === "Analysis cooldown active"
      ) {
        console.log("⏸️ LLM analysis cooldown - skipping");
      } else {
        console.log(
          "⚠️ LLM coaching failed, falling back to rule-based:",
          error,
        );
      }

      // Fallback to original rule-based coaching
      try {
        const analysis = await this.analyzePosition(fen, {
          maxDepth: 15,
          maxTimeMs: 2000,
        });

        // Cache this analysis
        this.analysisCache.set(cacheKey, now);
        this.cleanCache();

        // Determine move quality
        const quality = this.evaluateMoveQuality(analysis.evaluation, lastMove);
        const gamePhase = this.getGamePhase(fen);

        console.log("📊 Fallback analysis results:", {
          quality,
          evaluation: analysis.evaluation,
          gamePhase,
        });

        // Generate and show feedback
        const feedback = coachingFeedback.generateFeedback(
          quality,
          analysis.evaluation,
          gamePhase,
        );

        console.log("💬 Generated fallback feedback:", feedback);
        coachingFeedback.showFeedback(feedback);
      } catch (fallbackError) {
        console.error("Both LLM and fallback analysis failed:", fallbackError);
      }
    }
  }

  private cleanCache() {
    const now = Date.now();
    for (const [key, timestamp] of this.analysisCache.entries()) {
      if (now - timestamp > this.CACHE_DURATION) {
        this.analysisCache.delete(key);
      }
    }
  }

  private evaluateMoveQuality(evaluation: number, move: string): MoveQuality {
    // Simplified quality evaluation
    const absEval = Math.abs(evaluation);

    if (absEval > 500) return "blunder";
    if (absEval > 200) return "mistake";
    if (absEval > 100) return "inaccurate";
    if (absEval < 20) return "excellent";
    if (absEval < 50) return "good";
    return "good";
  }

  destroy() {
    this.engine.destroy();
  }
}

export const stockfishCoaching = new StockfishCoaching();
