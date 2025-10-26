export interface CoachingMessage {
  id: string;
  type: "move" | "blunder" | "brilliant" | "suggestion" | "warning";
  title: string;
  message: string;
  move?: string;
  evaluation?: number;
  timestamp: number;
}

export interface CoachingAnalysis {
  type: "move" | "blunder" | "brilliant" | "suggestion" | "warning";
  title: string;
  message: string;
  move: string;
  evaluation: number;
  previousEvaluation: number;
  improvement: number;
}

export interface AICoachingToasterProps {
  isVisible: boolean;
  onToggle: () => void;
  coachingEnabled: boolean;
  currentMove?: string;
  fen?: string;
  evaluation?: number;
}

export type GamePhase = "opening" | "middlegame" | "endgame";

export interface CoachingTip {
  phase: GamePhase;
  tip: string;
  priority: "high" | "medium" | "low";
}
