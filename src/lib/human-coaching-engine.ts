import { Chess } from "chess.js";
import { CoachingAnalysis, GamePhase } from "@/types/coaching";

interface CoachingPersonality {
  name: string;
  style: "encouraging" | "analytical" | "casual" | "strict";
  expertise: "tactics" | "positional" | "endgame" | "general";
}

interface GameContext {
  phase: GamePhase;
  moveNumber: number;
  recentMistakes: number;
  recentBrilliantMoves: number;
  lastAdvice: string;
  conversationHistory: string[];
}

export class HumanCoachingEngine {
  private chess: Chess;
  private previousEvaluation: number = 0;
  private moveHistory: Array<{
    move: string;
    evaluation: number;
    timestamp: number;
  }> = [];
  private gameContext: GameContext;
  private personality: CoachingPersonality;
  private coachingMemory: Map<string, number> = new Map();

  constructor() {
    this.chess = new Chess();
    this.personality = this.selectPersonality();
    this.gameContext = this.initializeGameContext();
  }

  private selectPersonality(): CoachingPersonality {
    const personalities: CoachingPersonality[] = [
      { name: "Alex", style: "encouraging", expertise: "tactics" },
      { name: "Dr. Sarah", style: "analytical", expertise: "positional" },
      { name: "Mike", style: "casual", expertise: "general" },
      { name: "Coach Elena", style: "strict", expertise: "endgame" },
    ];

    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  private initializeGameContext(): GameContext {
    return {
      phase: "opening",
      moveNumber: 0,
      recentMistakes: 0,
      recentBrilliantMoves: 0,
      lastAdvice: "",
      conversationHistory: [],
    };
  }

  updatePosition(fen: string): void {
    this.chess.load(fen);
    this.updateGameContext();
  }

  private updateGameContext(): void {
    this.gameContext.moveNumber = this.chess.history().length;
    this.gameContext.phase = this.getGamePhase();
  }

  private getGamePhase(): GamePhase {
    const moveCount = this.chess.history().length;
    if (moveCount < 20) return "opening";
    if (moveCount < 40) return "middlegame";
    return "endgame";
  }

  analyzeMove(move: string, currentEvaluation: number): CoachingAnalysis {
    const improvement = currentEvaluation - this.previousEvaluation;
    const isWhite = this.chess.turn() === "b";
    const perspectiveEval = isWhite ? currentEvaluation : -currentEvaluation;
    const perspectiveImprovement = isWhite ? improvement : -improvement;

    // Update context
    this.updateMoveHistory(move, currentEvaluation, perspectiveImprovement);

    // Generate human-like coaching
    const analysis = this.generateHumanCoaching(
      move,
      currentEvaluation,
      perspectiveImprovement
    );

    this.previousEvaluation = currentEvaluation;
    return analysis;
  }

  analyzeAIMove(
    aiMove: string,
    currentEval: number,
    previousEval: number
  ): CoachingAnalysis {
    // For AI moves, we need to analyze from the human player's perspective
    // If AI is playing black, a positive improvement for AI is bad for human
    const improvement = currentEval - previousEval;
    const isWhite = this.chess.turn() === "w";

    // Flip the improvement for AI moves - if AI improves its position, it's bad for human
    const humanPerspectiveImprovement = isWhite ? -improvement : improvement;

    console.log(
      `🔧 CoachingEngine: AI move ${aiMove} - AI improvement: ${improvement}cp, Human perspective: ${humanPerspectiveImprovement}cp`
    );

    return this.generateAIMoveCoaching(
      aiMove,
      currentEval,
      humanPerspectiveImprovement
    );
  }

  private updateMoveHistory(
    move: string,
    evaluation: number,
    improvement: number
  ): void {
    this.moveHistory.push({
      move,
      evaluation,
      timestamp: Date.now(),
    });

    // Keep only last 10 moves
    if (this.moveHistory.length > 10) {
      this.moveHistory.shift();
    }

    // Update context based on move quality
    if (improvement < -200) {
      this.gameContext.recentMistakes++;
    } else if (improvement > 300) {
      this.gameContext.recentBrilliantMoves++;
    }
  }

  private generateHumanCoaching(
    move: string,
    currentEval: number,
    improvement: number
  ): CoachingAnalysis {
    const moveQuality = this.assessMoveQuality(improvement);
    const context = this.getMoveContext(move);

    // Avoid repeating the same advice
    const adviceKey = `${moveQuality}-${context}`;
    const lastGiven = this.coachingMemory.get(adviceKey) || 0;
    const timeSinceLastAdvice = Date.now() - lastGiven;

    // Don't repeat advice within 2 minutes
    if (timeSinceLastAdvice < 120000) {
      return this.generateVariedResponse(
        move,
        currentEval,
        improvement,
        moveQuality
      );
    }

    this.coachingMemory.set(adviceKey, Date.now());

    return this.generatePersonalizedCoaching(
      move,
      currentEval,
      improvement,
      moveQuality,
      context
    );
  }

  private assessMoveQuality(
    improvement: number
  ): "blunder" | "mistake" | "neutral" | "good" | "brilliant" {
    if (improvement < -200) return "blunder";
    if (improvement < -50) return "mistake";
    if (improvement < 50) return "neutral";
    if (improvement < 300) return "good";
    return "brilliant";
  }

  private getMoveContext(move: string): string {
    const moveLower = move.toLowerCase();

    if (moveLower.includes("x")) return "capture";
    if (moveLower.includes("+")) return "check";
    if (moveLower.includes("o-o")) return "castling";
    if (moveLower.includes("#")) return "checkmate";
    if (moveLower.includes("=")) return "promotion";
    if (moveLower.startsWith("n")) return "knight";
    if (moveLower.startsWith("b")) return "bishop";
    if (moveLower.startsWith("r")) return "rook";
    if (moveLower.startsWith("q")) return "queen";
    if (moveLower.startsWith("k")) return "king";
    return "pawn";
  }

  private generatePersonalizedCoaching(
    move: string,
    currentEval: number,
    improvement: number,
    quality: string,
    context: string
  ): CoachingAnalysis {
    const coach = this.personality;
    const phase = this.gameContext.phase;

    // Generate coaching based on personality and context
    switch (quality) {
      case "blunder":
        return this.generateBlunderCoaching(move, improvement, coach, phase);
      case "mistake":
        return this.generateMistakeCoaching(move, improvement, coach, phase);
      case "neutral":
        return this.generateNeutralCoaching(
          move,
          currentEval,
          coach,
          phase,
          context
        );
      case "good":
        return this.generateGoodMoveCoaching(move, improvement, coach, phase);
      case "brilliant":
        return this.generateBrilliantCoaching(move, improvement, coach, phase);
      default:
        return this.generateDefaultCoaching(move, currentEval, coach);
    }
  }

  private generateBlunderCoaching(
    move: string,
    improvement: number,
    coach: CoachingPersonality,
    phase: GamePhase
  ): CoachingAnalysis {
    const responses = {
      encouraging: [
        `Hey, ${move} wasn't the best choice here. Don't worry though - we all make mistakes! In the ${phase}, it's better to focus on ${this.getPhaseAdvice(
          phase
        )}.`,
        `Oops! ${move} gives away too much. But you know what? Every great player has made this exact mistake. Let's learn from it!`,
        `That ${move} move... hmm, it's not ideal. But I can see you're thinking tactically! Just need to be a bit more careful about ${this.getPositionalTip(
          phase
        )}.`,
      ],
      analytical: [
        `${move} loses approximately ${Math.abs(
          improvement
        )} centipawns of advantage. In this ${phase} position, consider developing your pieces more systematically.`,
        `The move ${move} creates tactical weaknesses. A better approach would be to maintain piece coordination and control key squares.`,
        `This ${move} move violates basic ${phase} principles. Let's focus on piece development and king safety.`,
      ],
      casual: [
        `Whoa, ${move} is a bit too aggressive there! 😅 In the ${phase}, sometimes the best move is the simple one.`,
        `Hmm, ${move}... that's going to hurt! But hey, we've all been there. The ${phase} is tricky!`,
        `Not gonna lie, ${move} is pretty rough! But you're learning - that's what matters!`,
      ],
      strict: [
        `${move} is unacceptable. This type of move loses games. In the ${phase}, you must prioritize ${this.getPhaseAdvice(
          phase
        )}.`,
        `That ${move} move shows a lack of understanding of basic ${phase} principles. Study the fundamentals.`,
        `${move} is a blunder. No excuses. Focus on the basics: piece safety, king security, and tactical awareness.`,
      ],
    };

    const message = this.selectVariedResponse(responses[coach.style]);

    return {
      type: "blunder",
      title: this.getBlunderTitle(coach),
      message,
      move,
      evaluation: this.previousEvaluation + improvement,
      previousEvaluation: this.previousEvaluation,
      improvement,
    };
  }

  private generateMistakeCoaching(
    move: string,
    improvement: number,
    coach: CoachingPersonality,
    phase: GamePhase
  ): CoachingAnalysis {
    const responses = {
      encouraging: [
        `${move} isn't quite right, but you're on the right track! In the ${phase}, try to think about ${this.getPhaseAdvice(
          phase
        )}.`,
        `Close, but ${move} could be better. You're improving though! Keep focusing on piece coordination.`,
        `Not bad, but ${move} has some issues. The ${phase} requires patience - don't rush your moves!`,
      ],
      analytical: [
        `${move} weakens your position by ${Math.abs(
          improvement
        )} centipawns. Consider the long-term consequences of each move.`,
        `The move ${move} creates positional problems. In the ${phase}, prioritize piece activity and pawn structure.`,
        `${move} is suboptimal. Focus on maintaining the initiative and controlling key squares.`,
      ],
      casual: [
        `${move} is okay, but there's definitely better! The ${phase} is all about finding the right balance.`,
        `Eh, ${move} is decent but not great. You're getting the hang of it though!`,
        `${move}... not terrible, but we can do better! 😊`,
      ],
      strict: [
        `${move} is a mistake. In the ${phase}, every move must serve a purpose. Think more carefully.`,
        `That ${move} move shows poor judgment. Study ${phase} principles and apply them consistently.`,
        `${move} is not good enough. You must improve your positional understanding.`,
      ],
    };

    const message = this.selectVariedResponse(responses[coach.style]);

    return {
      type: "warning",
      title: this.getMistakeTitle(coach),
      message,
      move,
      evaluation: this.previousEvaluation + improvement,
      previousEvaluation: this.previousEvaluation,
      improvement,
    };
  }

  private generateNeutralCoaching(
    move: string,
    currentEval: number,
    coach: CoachingPersonality,
    phase: GamePhase,
    context: string
  ): CoachingAnalysis {
    const responses = {
      encouraging: [
        `${move} is a solid choice! You're maintaining the balance. In the ${phase}, that's often exactly what you need.`,
        `Good thinking with ${move}! You're playing sensibly. The ${phase} is about building your position gradually.`,
        `Nice! ${move} keeps things steady. You're showing good ${phase} understanding!`,
      ],
      analytical: [
        `${move} maintains the current evaluation of ${currentEval} centipawns. This is appropriate for the ${phase}.`,
        `The move ${move} is positionally sound. Continue developing your pieces systematically.`,
        `${move} is a reasonable choice that doesn't weaken your position. Good ${phase} play.`,
      ],
      casual: [
        `${move} is pretty standard - nothing wrong with that! The ${phase} is about steady progress.`,
        `Solid ${move}! Sometimes the boring moves are the right moves. 😄`,
        `${move} works! You're playing like a pro in the ${phase}!`,
      ],
      strict: [
        `${move} is acceptable. Continue following ${phase} principles and maintain discipline.`,
        `That ${move} move is correct but unremarkable. Strive for more active play.`,
        `${move} is adequate. Focus on finding more dynamic continuations.`,
      ],
    };

    const message = this.selectVariedResponse(responses[coach.style]);

    return {
      type: "move",
      title: this.getNeutralTitle(coach),
      message,
      move,
      evaluation: currentEval,
      previousEvaluation: this.previousEvaluation,
      improvement: 0,
    };
  }

  private generateGoodMoveCoaching(
    move: string,
    improvement: number,
    coach: CoachingPersonality,
    phase: GamePhase
  ): CoachingAnalysis {
    const responses = {
      encouraging: [
        `Excellent! ${move} is a strong move that improves your position by ${improvement} centipawns! You're really getting the hang of the ${phase}!`,
        `Wow, ${move} is really good! You're thinking like a chess player now! This is great ${phase} play!`,
        `Nice work! ${move} shows you understand the position. You're improving so much!`,
      ],
      analytical: [
        `${move} improves your position by ${improvement} centipawns. This demonstrates good ${phase} understanding and tactical awareness.`,
        `The move ${move} is well-calculated and positionally sound. Continue this level of play.`,
        `${move} is a strong move that increases your advantage. Good strategic thinking.`,
      ],
      casual: [
        `Sweet! ${move} is a really nice move! You're crushing it in the ${phase}! 🎉`,
        `Dude, ${move} is awesome! You're totally getting this chess thing!`,
        `${move} is fire! 🔥 You're playing some solid ${phase} chess!`,
      ],
      strict: [
        `${move} is a good move that improves your position. Maintain this level of concentration.`,
        `That ${move} move shows improvement. Continue applying ${phase} principles consistently.`,
        `${move} is correct. You're beginning to understand the game better.`,
      ],
    };

    const message = this.selectVariedResponse(responses[coach.style]);

    return {
      type: "move",
      title: this.getGoodMoveTitle(coach),
      message,
      move,
      evaluation: this.previousEvaluation + improvement,
      previousEvaluation: this.previousEvaluation,
      improvement,
    };
  }

  private generateBrilliantCoaching(
    move: string,
    improvement: number,
    coach: CoachingPersonality,
    phase: GamePhase
  ): CoachingAnalysis {
    const responses = {
      encouraging: [
        `INCREDIBLE! ${move} is absolutely brilliant! You've improved your position by ${improvement} centipawns! This is master-level ${phase} play!`,
        `WOW! ${move} is a masterpiece! You're playing like a grandmaster! This is the kind of move that wins games!`,
        `AMAZING! ${move} is pure genius! You've found something that even experienced players might miss!`,
      ],
      analytical: [
        `${move} is a brilliant tactical shot that gains ${improvement} centipawns. This demonstrates exceptional ${phase} understanding and calculation.`,
        `The move ${move} is a masterful combination that significantly improves your position. Excellent work.`,
        `${move} is a brilliant move that showcases advanced tactical and positional understanding.`,
      ],
      casual: [
        `HOLY MOLY! ${move} is absolutely insane! 🤯 You're playing like a chess god!`,
        `DUDE! ${move} is next level! You just pulled off something incredible!`,
        `NO WAY! ${move} is mind-blowing! You're a chess genius! 🧠✨`,
      ],
      strict: [
        `${move} is an exceptional move that demonstrates mastery of ${phase} concepts. This is the standard you should maintain.`,
        `That ${move} move is brilliant. You've shown you can play at a high level when you focus.`,
        `${move} is a masterful move. Continue this level of play and you will improve rapidly.`,
      ],
    };

    const message = this.selectVariedResponse(responses[coach.style]);

    return {
      type: "brilliant",
      title: this.getBrilliantTitle(coach),
      message,
      move,
      evaluation: this.previousEvaluation + improvement,
      previousEvaluation: this.previousEvaluation,
      improvement,
    };
  }

  private generateAIMoveCoaching(
    aiMove: string,
    currentEval: number,
    improvement: number
  ): CoachingAnalysis {
    const moveType = this.analyzeMoveType(aiMove);
    const phase = this.gameContext.phase;

    // Determine if AI made a blunder (from human perspective)
    let message: string;
    let type: string;
    let title: string;

    if (improvement < -200) {
      // AI made a blunder - good for human
      type = "brilliant";
      title = "AI Blunder Detected!";
      message = `The AI made a blunder with ${aiMove}! This gives you a significant advantage. ${this.getAIAnalysis(
        improvement,
        phase
      )}`;
    } else if (improvement < -50) {
      // AI made a mistake - good for human
      type = "move";
      title = "AI Mistake";
      message = `The AI made a mistake with ${aiMove}. You can take advantage of this! ${this.getAIAnalysis(
        improvement,
        phase
      )}`;
    } else if (improvement > 200) {
      // AI made a brilliant move - bad for human
      type = "suggestion";
      title = "AI Brilliant Move";
      message = `The AI played a brilliant move ${aiMove}. You need to be careful here! ${this.getAIAnalysis(
        improvement,
        phase
      )}`;
    } else if (improvement > 50) {
      // AI made a good move - bad for human
      type = "suggestion";
      title = "AI Good Move";
      message = `The AI played a good move ${aiMove}. Consider your response carefully. ${this.getAIAnalysis(
        improvement,
        phase
      )}`;
    } else {
      // Neutral move
      type = "move";
      title = "AI Move";
      message = `The AI played ${aiMove} to ${moveType}. ${this.getAIAnalysis(
        improvement,
        phase
      )}`;
    }

    return {
      type: type as any,
      title,
      message,
      move: aiMove,
      evaluation: currentEval,
      previousEvaluation: this.previousEvaluation,
      improvement,
    };
  }

  private generateVariedResponse(
    move: string,
    currentEval: number,
    improvement: number,
    quality: string
  ): CoachingAnalysis {
    const shortResponses: Record<string, string[]> = {
      blunder: [
        "That's not ideal.",
        "Hmm, let's try something else.",
        "Not quite right.",
      ],
      mistake: ["Close, but not quite.", "Almost there!", "Getting better!"],
      neutral: ["Solid move.", "Good choice.", "Nice play."],
      good: ["Well done!", "Great move!", "Excellent!"],
      brilliant: ["Incredible!", "Amazing!", "Brilliant!"],
    };

    const message = this.selectVariedResponse(
      shortResponses[quality] || ["Good move."]
    );

    return {
      type:
        quality === "blunder"
          ? "blunder"
          : quality === "mistake"
          ? "warning"
          : "move",
      title: this.getShortTitle(quality),
      message,
      move,
      evaluation: currentEval,
      previousEvaluation: this.previousEvaluation,
      improvement,
    };
  }

  private generateDefaultCoaching(
    move: string,
    currentEval: number,
    coach: CoachingPersonality
  ): CoachingAnalysis {
    return {
      type: "move",
      title: `${coach.name}'s Analysis`,
      message: `You played ${move}. Current evaluation: ${
        currentEval > 0 ? "+" : ""
      }${currentEval} cp.`,
      move,
      evaluation: currentEval,
      previousEvaluation: this.previousEvaluation,
      improvement: 0,
    };
  }

  // Helper methods
  private selectVariedResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getPhaseAdvice(phase: GamePhase): string {
    const advice = {
      opening: "developing pieces and controlling the center",
      middlegame: "tactical combinations and piece coordination",
      endgame: "king activity and pawn promotion",
    };
    return advice[phase];
  }

  private getPositionalTip(phase: GamePhase): string {
    const tips = {
      opening: "piece development",
      middlegame: "tactical patterns",
      endgame: "king and pawn play",
    };
    return tips[phase];
  }

  private analyzeMoveType(move: string): string {
    const moveLower = move.toLowerCase();

    if (moveLower.includes("x")) return "capture your piece";
    if (moveLower.includes("+")) return "check your king";
    if (moveLower.includes("o-o")) return "castle for safety";
    if (moveLower.includes("#")) return "checkmate you";
    if (moveLower.includes("=")) return "promote a pawn";
    if (moveLower.startsWith("n")) return "develop the knight";
    if (moveLower.startsWith("b")) return "develop the bishop";
    if (moveLower.startsWith("r")) return "activate the rook";
    if (moveLower.startsWith("q")) return "move the queen";
    if (moveLower.startsWith("k")) return "move the king";
    return "advance a pawn";
  }

  private getAIAnalysis(improvement: number, phase: GamePhase): string {
    if (improvement > 200) {
      return "This is a powerful move that significantly improves the AI's position. You need to be very careful here!";
    } else if (improvement > 50) {
      return "This is a solid move that gives the AI a small advantage. Consider your response carefully.";
    } else if (improvement < -200) {
      return "The AI seems to have made a mistake! This could be your chance to gain an advantage.";
    } else {
      return "The position remains balanced. Focus on your own plans.";
    }
  }

  // Title generators
  private getBlunderTitle(coach: CoachingPersonality): string {
    const titles = {
      encouraging: "💭 Let's Learn From This",
      analytical: "📊 Position Analysis",
      casual: "😅 Oops!",
      strict: "⚠️ Critical Error",
    };
    return titles[coach.style];
  }

  private getMistakeTitle(coach: CoachingPersonality): string {
    const titles = {
      encouraging: "🤔 Almost There!",
      analytical: "📈 Room for Improvement",
      casual: "😊 Getting Better!",
      strict: "⚠️ Mistake Detected",
    };
    return titles[coach.style];
  }

  private getNeutralTitle(coach: CoachingPersonality): string {
    const titles = {
      encouraging: "👍 Solid Move!",
      analytical: "📋 Position Maintained",
      casual: "😄 Nice!",
      strict: "✅ Acceptable",
    };
    return titles[coach.style];
  }

  private getGoodMoveTitle(coach: CoachingPersonality): string {
    const titles = {
      encouraging: "🌟 Great Move!",
      analytical: "📊 Strong Play",
      casual: "🎉 Awesome!",
      strict: "✅ Good Move",
    };
    return titles[coach.style];
  }

  private getBrilliantTitle(coach: CoachingPersonality): string {
    const titles = {
      encouraging: "✨ INCREDIBLE!",
      analytical: "🏆 Masterful Play",
      casual: "🤯 MIND-BLOWING!",
      strict: "🏅 Exceptional",
    };
    return titles[coach.style];
  }

  private getAIMoveTitle(improvement: number): string {
    if (improvement > 200) return "🤖 AI Found a Brilliant Move!";
    if (improvement < -200) return "🤖 AI Made a Mistake!";
    return "🤖 AI's Move";
  }

  private getShortTitle(quality: string): string {
    const titles: Record<string, string> = {
      blunder: "💭 Note",
      mistake: "🤔 Almost",
      neutral: "👍 Good",
      good: "🌟 Great",
      brilliant: "✨ Amazing",
    };
    return titles[quality] || "📝 Move";
  }

  reset(): void {
    this.chess.reset();
    this.previousEvaluation = 0;
    this.moveHistory = [];
    this.gameContext = this.initializeGameContext();
    this.personality = this.selectPersonality();
    this.coachingMemory.clear();
  }
}
