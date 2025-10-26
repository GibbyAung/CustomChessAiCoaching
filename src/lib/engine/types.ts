export interface EngineMove {
  from: string;
  to: string;
  piece: string;
  promotion?: string;
  isCapture: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
}

export interface EngineAnalysis {
  bestMove: EngineMove | null;
  evaluation: number;
  depth: number;
  nodesSearched: number;
  timeMs: number;
  pv?: EngineMove[];
}

export interface EngineConfig {
  maxDepth?: number;
  maxTimeMs?: number;
  skillLevel?: number; // 0-20
}
