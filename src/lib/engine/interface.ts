export interface EngineAnalysis {
  bestMove: {
    from: string;
    to: string;
    piece: string;
    san: string;
    promotion?: string;
    isCapture?: boolean;
  } | null;
  evaluation: number;
  depth: number;
  nodesSearched: number;
  timeMs: number;
}

export interface EngineConfig {
  maxDepth?: number;
  maxTimeMs?: number;
  skillLevel?: number;
}

export interface ChessEngine {
  initialize(): Promise<void>;
  setOptions(config: Partial<EngineConfig>): void;
  analyzePosition(
    fen: string,
    config?: Partial<EngineConfig>
  ): Promise<EngineAnalysis>;
  getBestMove(
    fen: string,
    depth?: number,
    maxTimeMs?: number
  ): Promise<string | null>;
  evaluatePosition(fen: string, maxTimeMs?: number): Promise<number>;
  destroy(): void;
}
