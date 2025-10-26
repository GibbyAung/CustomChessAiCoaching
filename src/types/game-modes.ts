export type GameMode =
  | "practice" // Human vs Human practice
  | "ai_opponent" // Human vs AI with auto-play
  | "ai_coaching" // AI coaching mode with hints and analysis
  | "analysis" // Position analysis mode
  | "puzzle"; // Chess puzzles mode

export type PlayerColor = "white" | "black";
export type AIDifficulty = "easy" | "medium" | "hard";
export type GameStatus =
  | "setup"
  | "playing"
  | "paused"
  | "completed"
  | "abandoned";

export interface AIConfig {
  difficulty: AIDifficulty;
  thinkingTime: number; // milliseconds
  searchDepth: number;
  personality: "aggressive" | "defensive" | "balanced";
}

export interface GameSession {
  id: string;
  mode: GameMode;
  status: GameStatus;
  userColor: PlayerColor;
  aiColor: PlayerColor;
  aiConfig: AIConfig;
  startTime: number;
  endTime?: number;
  moveCount: number;
  isBoardFlipped: boolean;
  canChangeMode: boolean;
}

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  features: string[];
  autoPlay: boolean;
  showHints: boolean;
  showEvaluation: boolean;
  showThinking: boolean;
  requiresSetup?: boolean; // New: indicates if mode needs configuration
  maxPlayers?: number; // New: maximum players for this mode
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  practice: {
    id: "practice",
    name: "Practice Mode",
    description: "Play against yourself or another person",
    icon: "👥",
    features: ["Free play", "Move validation", "Game history"],
    autoPlay: false,
    showHints: false,
    showEvaluation: false,
    showThinking: false,
    requiresSetup: false,
    maxPlayers: 2,
  },
  ai_opponent: {
    id: "ai_opponent",
    name: "AI Opponent",
    description: "Challenge Stockfish with configurable settings",
    icon: "🤖",
    features: [
      "Stockfish engine",
      "Color selection",
      "Difficulty settings",
      "Auto-play",
    ],
    autoPlay: true,
    showHints: false,
    showEvaluation: true,
    showThinking: true,
    requiresSetup: true, // Requires color and difficulty selection
    maxPlayers: 1,
  },
  ai_coaching: {
    id: "ai_coaching",
    name: "AI Coaching",
    description: "Learn with Stockfish guidance and analysis",
    icon: "🎓",
    features: ["Move hints", "Position analysis", "Learning insights"],
    autoPlay: false,
    showHints: true,
    showEvaluation: true,
    showThinking: true,
    requiresSetup: false,
    maxPlayers: 1,
  },
  analysis: {
    id: "analysis",
    name: "Analysis Mode",
    description: "Deep position analysis with Stockfish",
    icon: "🔍",
    features: ["Engine analysis", "Move evaluation", "Variation explorer"],
    autoPlay: false,
    showHints: false,
    showEvaluation: true,
    showThinking: true,
    requiresSetup: false,
    maxPlayers: 0,
  },
  puzzle: {
    id: "puzzle",
    name: "Puzzle Mode",
    description: "Solve chess puzzles with AI assistance",
    icon: "🧩",
    features: ["Tactical puzzles", "Hint system", "Solution analysis"],
    autoPlay: false,
    showHints: true,
    showEvaluation: true,
    showThinking: true,
    requiresSetup: false,
    maxPlayers: 1,
  },
};

// AI Difficulty configurations
export const AI_DIFFICULTY_CONFIGS: Record<AIDifficulty, AIConfig> = {
  easy: {
    difficulty: "easy",
    thinkingTime: 1000, // 1 second
    searchDepth: 8,
    personality: "balanced",
  },
  medium: {
    difficulty: "medium",
    thinkingTime: 3000, // 3 seconds
    searchDepth: 12,
    personality: "balanced",
  },
  hard: {
    difficulty: "hard",
    thinkingTime: 5000, // 5 seconds
    searchDepth: 16,
    personality: "aggressive",
  },
};
