"use client";

import { PositionAnalyzer, ComplexityFactors } from "./position-analyzer";

export interface TopMove {
  move: string;
  eval: number;
  depth?: number;
  nodes?: number;
  pv?: string[];
}

export interface AnalysisResult {
  bestMove: string | null;
  evaluation: number;
  depth: number;
  timeMs: number;
  topMoves?: TopMove[];
  complexity?: number;
  multipv?: number;
}

// ✅ NEW: Request queue item
interface QueuedRequest {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private ready: boolean = false;
  private initializing: boolean = false;
  private currentSkillLevel: number = 20;
  private messageHandlers: Map<string, (payload: any) => void> = new Map();

  // ✅ NEW: Request queue to prevent concurrent access
  private requestQueue: QueuedRequest[] = [];
  private isProcessingRequest = false;

  async initialize(): Promise<void> {
    if (typeof window === "undefined") throw new Error("Client-only");
    if (this.ready) {
      console.log("✅ Engine already initialized");
      return;
    }
    if (this.initializing) {
      console.log("🔧 Waiting for initialization...");
      // Wait for init to complete
      while (this.initializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.initializing = true;
    console.log("🔧 Initializing Stockfish...");

    try {
      this.worker = new Worker("/stockfish-worker.js", { type: "module" });

      // Setup message router
      this.worker.onmessage = (e: MessageEvent) => {
        const { type, payload } = e.data;
        const handler = this.messageHandlers.get(type);
        if (handler) {
          handler(payload);
        }
      };

      // Wait for ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Init timeout"));
        }, 30000);

        this.messageHandlers.set("ready", () => {
          clearTimeout(timeout);
          this.ready = true;
          this.messageHandlers.delete("ready");
          console.log("✅ Stockfish ready");
          resolve();
        });

        this.messageHandlers.set("error", (msg: string) => {
          clearTimeout(timeout);
          this.messageHandlers.delete("ready");
          this.messageHandlers.delete("error");
          reject(new Error(msg));
        });

        this.worker!.postMessage({ type: "init" });
      });
    } finally {
      this.initializing = false;
    }
  }

  isReady(): boolean {
    return this.ready && this.worker !== null;
  }

  // ✅ NEW: Queue management
  private async enqueueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingRequest || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingRequest = true;
    const request = this.requestQueue.shift()!;

    try {
      const result = await request.fn();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.isProcessingRequest = false;
      // Process next request if any
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processQueue(), 0);
      }
    }
  }

  async setSkillLevel(level: number): Promise<void> {
    if (!this.isReady()) return;
    const validLevel = Math.max(0, Math.min(20, Math.round(level)));
    if (this.currentSkillLevel === validLevel) return;

    console.log(`🎯 Setting skill level to ${validLevel}`);

    // ✅ Wrap in queue
    return this.enqueueRequest(async () => {
      this.worker!.postMessage({
        type: "setoption",
        payload: { name: "Skill Level", value: validLevel },
      });
      this.currentSkillLevel = validLevel;
    });
  }

  // Neural Network Configuration for Stockfish 17
  async setNeuralNetwork(
    evalFile?: string,
    evalFileSmall?: string,
  ): Promise<void> {
    if (!this.isReady()) {
      throw new Error("Engine not initialized");
    }

    console.log("🧠 Configuring neural networks...");

    // Set large neural network (default for stronger play)
    if (evalFile) {
      await this.setOption("EvalFile", evalFile);
      console.log(`✅ Set EvalFile: ${evalFile}`);
    }

    // Set small neural network (faster, less accurate)
    if (evalFileSmall) {
      await this.setOption("EvalFileSmall", evalFileSmall);
      console.log(`✅ Set EvalFileSmall: ${evalFileSmall}`);
    }
  }

  async setOption(
    name: string,
    value: string | number | boolean,
  ): Promise<void> {
    if (!this.isReady()) {
      throw new Error("Engine not initialized");
    }

    // ✅ Wrap in queue
    return this.enqueueRequest(async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Set option ${name} timeout`));
        }, 5000);

        const cleanup = () => {
          clearTimeout(timeout);
          this.messageHandlers.delete("readyok");
          this.messageHandlers.delete("error");
        };

        this.messageHandlers.set("readyok", () => {
          cleanup();
          resolve();
        });

        this.messageHandlers.set("error", (msg: string) => {
          cleanup();
          reject(new Error(`Failed to set ${name}: ${msg}`));
        });

        this.worker!.postMessage({
          type: "setoption",
          payload: { name, value },
        });
      });
    });
  }

  // Auto-configure best available neural network
  async configureOptimalNetwork(): Promise<void> {
    if (!this.isReady()) {
      throw new Error("Engine not initialized");
    }

    console.log("🔍 Detecting optimal neural network configuration...");

    // Try to detect if we're using Stockfish 17+ with NNUE support
    try {
      // Check if EvalFile option is available
      await this.setOption("EvalFile", "");

      // Set default large network for maximum strength
      await this.setNeuralNetwork(
        "nn-1111cefa1111.nnue", // Stockfish 17 default large network
        undefined, // Don't set small network by default
      );

      console.log("✅ Neural network configured optimally for Stockfish 17");
    } catch (error) {
      console.warn(
        "⚠️ Could not configure neural network, falling back to classical evaluation:",
        error,
      );
    }
  }

  // ✅ MAIN FIX: analyzePosition now uses queue
  async analyzePosition(
    fen: string,
    options: { maxDepth?: number; maxTimeMs?: number; multiPV?: number } = {},
  ): Promise<AnalysisResult> {
    if (!this.isReady()) {
      throw new Error("Engine not initialized");
    }

    // ✅ Enqueue this analysis request
    return this.enqueueRequest(() =>
      this._analyzePositionInternal(fen, options),
    );
  }

  // ✅ NEW: Internal analysis method (not queued itself)
  private async _analyzePositionInternal(
    fen: string,
    options: { maxDepth?: number; maxTimeMs?: number; multiPV?: number },
  ): Promise<AnalysisResult> {
    const settings = {
      maxDepth: options.maxDepth || 15,
      maxTimeMs: options.maxTimeMs || 2000,
      multiPV: options.multiPV || 1,
    };

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      let depth = 0;
      let currentEval = 0;
      let bestMove: string | null = null;
      const topMoves: TopMove[] = [];

      const timeout = setTimeout(() => {
        cleanup();
        this.worker!.postMessage({ type: "stop" });
        reject(new Error("Analysis timeout"));
      }, settings.maxTimeMs + 3000);

      const cleanup = () => {
        clearTimeout(timeout);
        this.messageHandlers.delete("info");
        this.messageHandlers.delete("bestmove");
        this.messageHandlers.delete("error");
      };

      // Info handler
      this.messageHandlers.set("info", (payload: string) => {
        const info = payload;

        const depthMatch = info.match(/depth (\d+)/);
        if (depthMatch) {
          depth = parseInt(depthMatch[1]);
        }

        const scoreMatch = info.match(/score cp (-?\d+)/);
        if (scoreMatch) {
          currentEval = parseInt(scoreMatch[1]);
        }

        const multiPVMatch = info.match(/multipv (\d+)/);
        const pvMatch = info.match(/pv (.+)/);
        const nodesMatch = info.match(/nodes (\d+)/);

        if (multiPVMatch && pvMatch && scoreMatch) {
          const pvIndex = parseInt(multiPVMatch[1]) - 1;
          const pvMoves = pvMatch[1].trim().split(/\s+/);
          topMoves[pvIndex] = {
            move: pvMoves[0] || "",
            eval: parseInt(scoreMatch[1]),
            nodes: nodesMatch ? parseInt(nodesMatch[1]) : undefined,
            pv: pvMoves,
          };
        }
      });

      // Bestmove handler
      this.messageHandlers.set("bestmove", (payload: string) => {
        const match = payload.match(/bestmove (\S+)/);
        bestMove = match ? match[1] : null;
        cleanup();

        const complexity = PositionAnalyzer.analyzeComplexity(fen);

        resolve({
          bestMove,
          evaluation: currentEval,
          depth,
          timeMs: Date.now() - startTime,
          topMoves: topMoves.length > 0 ? topMoves : undefined,
          multipv: settings.multiPV,
          complexity: complexity.overallComplexity,
        });
      });

      // Error handler
      this.messageHandlers.set("error", (msg: string) => {
        cleanup();
        reject(new Error(msg));
      });

      // Send commands
      this.worker!.postMessage({ type: "position", payload: { fen } });
      this.worker!.postMessage({
        type: "go",
        payload: {
          movetime: settings.maxTimeMs,
          multiPV: settings.multiPV,
        },
      });
    });
  }

  // Enhanced method for getting multiple lines of analysis
  async getMultipleLines(
    fen: string,
    numLines: number = 3,
    maxTimeMs: number = 3000,
  ): Promise<TopMove[]> {
    const result = await this.analyzePosition(fen, {
      multiPV: numLines,
      maxTimeMs,
    });

    return result.topMoves || [];
  }

  // Get engine information including neural network status
  async getEngineInfo(): Promise<{
    name: string;
    author: string;
    evalFile?: string;
    evalFileSmall?: string;
    nnue?: boolean;
  }> {
    if (!this.isReady()) {
      throw new Error("Engine not initialized");
    }

    return new Promise((resolve, reject) => {
      let engineInfo: any = {};

      const cleanup = () => {
        this.messageHandlers.delete("id");
        this.messageHandlers.delete("error");
      };

      this.messageHandlers.set("id", (payload: string) => {
        const info = payload;

        // Parse engine id information
        const nameMatch = info.match(/name (.+)/);
        const authorMatch = info.match(/author (.+)/);

        if (nameMatch) engineInfo.name = nameMatch[1];
        if (authorMatch) engineInfo.author = authorMatch[1];
      });

      this.messageHandlers.set("error", (msg: string) => {
        cleanup();
        reject(new Error(`Engine info error: ${msg}`));
      });

      // Send id command
      this.worker!.postMessage({ type: "id" });

      // Wait a bit for response
      setTimeout(() => {
        cleanup();
        resolve({
          name: engineInfo.name || "Unknown",
          author: engineInfo.author || "Unknown",
          nnue: engineInfo.name?.toLowerCase().includes("stockfish"),
        });
      }, 2000);
    });
  }

  // ✅ NEW: Get queue status for debugging
  getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingRequest,
    };
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.ready = false;
    }
  }
}

export const stockfishEngine = new StockfishEngine();
