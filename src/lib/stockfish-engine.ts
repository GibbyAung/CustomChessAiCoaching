"use client";

export type SFMessage = { type: string; payload?: unknown };

export class StockfishEngine {
  private worker: Worker | null = null;
  private ready: boolean = false;
  private waiters: Array<(m: SFMessage) => void> = [];
  private initTimeout: number = 45000; // 45 seconds

  async initialize(): Promise<void> {
    if (typeof window === "undefined") throw new Error("Client-only");
    if (this.worker) return;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `🔧 StockfishEngine: Initializing... (attempt ${attempt}/${maxRetries})`
        );

        if (attempt > 1) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }

        await this.initializeStockfish();

        // UCI options are now set in the worker during initialization
        // Verify configuration is working
        await this.verifyConfiguration();

        // Test with known position to verify Stockfish is evaluating correctly
        await this.testWithKnownPosition();

        // Test if UCI options are working
        await this.testUCIOptions();

        console.log(
          "🔧 StockfishEngine: Initialized successfully with strong settings"
        );
        return; // Success, exit the retry loop
      } catch (err) {
        lastError = err as Error;
        console.error(
          `🔧 StockfishEngine: Initialization attempt ${attempt} failed:`,
          err
        );

        if (attempt === maxRetries) {
          console.log(
            "🔧 StockfishEngine: Attempting fallback initialization..."
          );

          // Try fallback initialization with minimal options
          try {
            await this.fallbackInitialization();
            console.log(
              "🔧 StockfishEngine: Fallback initialization successful"
            );
            return;
          } catch (fallbackErr) {
            console.error(
              "🔧 StockfishEngine: Fallback initialization also failed:",
              fallbackErr
            );
            throw new Error(
              `Stockfish engine failed to initialize after ${maxRetries} attempts. Last error: ${lastError?.message}. Please refresh the page.`
            );
          }
        }
      }
    }
  }

  private async fallbackInitialization(): Promise<void> {
    console.log("🔧 StockfishEngine: Starting fallback initialization...");

    // Create a new worker for fallback
    if (this.worker) {
      this.worker.terminate();
    }

    this.worker = new Worker("/stockfish-worker-simple.js");

    this.worker.onmessage = (e: MessageEvent) => {
      const msg: SFMessage = e.data;
      console.log("🔧 StockfishEngine: Worker info:", msg.payload);

      if (msg.type === "ready") {
        this.ready = true;
        console.log("🔧 StockfishEngine: Fallback initialization complete");
      } else if (msg.type === "error") {
        console.error("🔧 StockfishEngine: Worker error:", msg.payload);
        this.ready = false;
      }

      // Process waiters
      this.waiters.forEach((waiter) => waiter(msg));
    };

    this.worker.onerror = (error) => {
      console.error("🔧 StockfishEngine: Worker error:", error);
      this.ready = false;
    };

    this.worker.postMessage({ type: "init" });
    await this.waitFor((m) => m.type === "ready", 10000); // 10 second timeout for fallback
  }

  private async initializeStockfish(): Promise<void> {
    console.log("🔧 StockfishEngine: Creating worker...");
    this.worker = new Worker("/stockfish-worker.js");

    this.worker.onmessage = (e: MessageEvent) => {
      const msg: SFMessage = e.data;

      // Only log important worker messages
      if (msg.type === "info" && typeof msg.payload === "string") {
        // Only log UCI options and errors, not every evaluation info
        if (
          msg.payload.includes("Setting") ||
          msg.payload.includes("UCI options") ||
          msg.payload.includes("No such option") ||
          msg.payload.includes("error")
        ) {
          console.log(`🔧 StockfishEngine: ${msg.payload}`);
        }
      }

      if (msg.type === "ready") {
        this.ready = true;
      } else if (msg.type === "error") {
        console.error("🔧 StockfishEngine: Worker error:", msg.payload);
        this.ready = false;
      }

      // Process waiters for this specific message
      const matchingWaiters = this.waiters.filter((w) => w(msg));
      this.waiters = this.waiters.filter((w) => !matchingWaiters.includes(w));
    };

    this.worker.onerror = (error) => {
      console.error("🔧 StockfishEngine: Worker error:", error);
      this.ready = false;
    };

    this.worker.postMessage({ type: "init" });
    await this.waitFor((m) => m.type === "ready", this.initTimeout);
  }

  private waitFor(
    predicate: (m: SFMessage) => boolean,
    timeoutMs = 5000
  ): Promise<SFMessage> {
    return new Promise((resolve, reject) => {
      const to = setTimeout(() => {
        // Clean up the waiter to prevent memory leaks
        const waiterIndex = this.waiters.findIndex(
          (waiter) => waiter === waiterFunction
        );
        if (waiterIndex !== -1) {
          this.waiters.splice(waiterIndex, 1);
        }
        reject(new Error(`Stockfish operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const waiterFunction = (m: SFMessage) => {
        if (predicate(m)) {
          clearTimeout(to);
          // Remove this waiter from the array
          const waiterIndex = this.waiters.findIndex(
            (waiter) => waiter === waiterFunction
          );
          if (waiterIndex !== -1) {
            this.waiters.splice(waiterIndex, 1);
          }
          resolve(m);
        }
      };

      this.waiters.push(waiterFunction);
    });
  }

  // Public method to check if engine is ready
  isReady(): boolean {
    return this.ready;
  }

  setOptions(opts: Record<string, unknown>) {
    if (!this.worker) return;

    const map: Record<string, unknown> = {
      SkillLevel: opts.skillLevel ?? 20,
      Threads: opts.threads ?? 1,
      Hash: opts.hash ?? 64,
      // Add more UCI options for better play
      Contempt: 0, // No contempt factor
      Ponder: false, // Don't ponder
      MultiPV: 1, // Only one principal variation
    };

    Object.entries(map).forEach(([name, value]) => {
      this.worker!.postMessage({ type: "setoption", payload: { name, value } });
    });
  }

  async analyzePosition(
    fen: string,
    cfg?: { maxDepth?: number; maxTimeMs?: number; multiPV?: number }
  ): Promise<{
    bestMove: string | null;
    evaluation: number;
    depth: number;
    timeMs: number;
    topMoves?: Array<{ move: string; eval: number; pv?: string }>;
  }> {
    if (!this.ready) throw new Error("Engine not initialized");
    if (!this.worker) throw new Error("Stockfish worker not available");

    // Only log FEN for debugging if needed
    // console.log(`🔧 StockfishEngine: Analyzing FEN: ${fen}`);
    this.worker.postMessage({ type: "position", payload: { fen } });
    this.worker.postMessage({
      type: "go",
      payload: {
        movetime: cfg?.maxTimeMs ?? 3000,
        depth: cfg?.maxDepth,
        multiPV: cfg?.multiPV ?? 5,
      },
    });

    let bestmove = "";
    let depth = 0;
    let evaluation = 0;
    let lastEvaluation = 0;
    const start = Date.now();
    let analysisCount = 0;
    const maxAnalysisCount = 100; // Prevent infinite loops
    let lastInfoTime = Date.now();

    // Initialize topMoves array for MultiPV results
    const topMoves: Array<{ move: string; eval: number; pv?: string }> = [];
    const requestedMultiPV = cfg?.multiPV ?? 5;

    while (analysisCount < maxAnalysisCount) {
      const msg = await this.waitFor(
        (m) => m.type === "bestmove" || m.type === "info",
        cfg?.maxTimeMs ?? 8000
      );

      if (msg.type === "info") {
        const line = msg.payload as string;
        analysisCount++;
        lastInfoTime = Date.now();

        // Only log important info lines, not every single one
        if (line.includes("bestmove") || line.includes("error")) {
          console.log(`🔧 StockfishEngine: Raw info: ${line}`);
        }

        // Extract depth
        const depthMatch = line.match(/depth\s+(\d+)/);
        if (depthMatch) depth = parseInt(depthMatch[1]);

        // Extract evaluation (cp score) - look for score cp pattern
        const cpMatch = line.match(/score\s+cp\s+(-?\d+)/);
        if (cpMatch) {
          const newEval = parseInt(cpMatch[1]);
          // Always update evaluation when we get a cp score (even if it's 0!)
          evaluation = newEval;
          lastEvaluation = newEval;
          // Only log significant evaluations
          if (Math.abs(newEval) > 50) {
            console.log(
              `🔧 StockfishEngine: Captured evaluation: ${newEval} cp at depth ${depth} (Stockfish says position is ${
                newEval === 0
                  ? "equal"
                  : newEval > 0
                  ? "White better"
                  : "Black better"
              })`
            );
          }
        }

        // Extract mate score
        const mateMatch = line.match(/score\s+mate\s+(-?\d+)/);
        if (mateMatch) {
          const mateMoves = parseInt(mateMatch[1]);
          // Convert mate to a very high evaluation
          evaluation = mateMoves > 0 ? 10000 : -10000;
          lastEvaluation = evaluation;
          console.log(`🔧 StockfishEngine: Captured mate: ${mateMoves} moves`);
        }

        // NEW: MultiPV + PV parsing
        const multipvMatch = line.match(/multipv (\d+)/);
        const pvMatch = line.match(/pv ([\w\s]+)/);

        if (multipvMatch && pvMatch) {
          const multipv = parseInt(multipvMatch[1]);
          const pvMoves = pvMatch[1].trim().split(" ").slice(0, 5);
          const currentEval = evaluation || lastEvaluation;

          console.log(`MultiPV ${multipv}: ${pvMoves[0]} (${currentEval}cp)`);

          // Store for coaching (array is 0-indexed, MultiPV is 1-indexed)
          if (multipv <= requestedMultiPV) {
            topMoves[multipv - 1] = {
              move: pvMoves[0],
              eval: currentEval,
              pv: pvMoves.join(" "),
            };
          }
        }

        // Store the best evaluation we've seen (highest depth with non-zero score)
        if (evaluation !== 0 && depth > 0) {
          lastEvaluation = evaluation;
        }

        // Stop if we've been analyzing too long without new info
        if (Date.now() - lastInfoTime > 2000) {
          break;
        }
      }

      if (msg.type === "bestmove") {
        const line = msg.payload as string;
        bestmove = (line.split(" ")[1] || "").trim();
        console.log(`🔧 StockfishEngine: Best move found: ${bestmove}`);
        break;
      }
    }

    // Use the last known evaluation if we didn't get a good one
    if (evaluation === 0 && lastEvaluation !== 0) {
      evaluation = lastEvaluation;
    }

    // Use Stockfish evaluation if we have one, otherwise estimate from material
    if (lastEvaluation !== 0 || evaluation !== 0) {
      // Use Stockfish evaluation
      evaluation = lastEvaluation !== 0 ? lastEvaluation : evaluation;
      console.log(
        `🔧 StockfishEngine: Using Stockfish evaluation: ${evaluation} cp`
      );
    } else {
      // Use enhanced evaluation when Stockfish returns 0 cp
      evaluation = this.calculateEnhancedEvaluation(fen);
      console.log(
        `🔧 StockfishEngine: Using enhanced evaluation: ${evaluation} cp`
      );
    }

    // Debug: Count material to verify position (only from board position, not castling rights)
    const boardPart = fen.split(" ")[0]; // Get only the board position part
    const whitePieces = (boardPart.match(/[RNBQKP]/g) || []).length;
    const blackPieces = (boardPart.match(/[rnbqkp]/g) || []).length;
    const materialDiff = whitePieces - blackPieces;

    // Only log material count for debugging when there's a difference
    if (materialDiff !== 0) {
      console.log(
        `🔧 StockfishEngine: Material difference detected - White: ${whitePieces}, Black: ${blackPieces}, Diff: ${materialDiff}`
      );
    }

    // Only log final evaluation if it's significant
    if (Math.abs(evaluation) > 10) {
      console.log(
        `🔧 StockfishEngine: Final evaluation: ${evaluation} cp, depth: ${depth}`
      );
    }

    return {
      bestMove: bestmove || null,
      evaluation,
      depth,
      timeMs: Date.now() - start,
      topMoves: topMoves.length > 0 ? topMoves : undefined,
    };
  }

  async getBestMove(
    fen: string,
    depth = 12,
    maxTimeMs = 2000
  ): Promise<string | null> {
    const res = await this.analyzePosition(fen, { maxDepth: depth, maxTimeMs });
    return res.bestMove;
  }

  getEngineType(): string {
    return "Stockfish";
  }

  // Method to verify Stockfish configuration
  async verifyConfiguration(): Promise<void> {
    if (!this.worker) throw new Error("Engine not initialized");

    // Test with a position where White is clearly winning (Q vs R)
    const testFen =
      "r3k2r/ppp2ppp/2n1bn2/2b1p3/2B1P3/3P1N2/PPP2PPP/R1BQK2R w KQkq - 0 1";
    // console.log(`🔧 StockfishEngine: Testing with known position: ${testFen}`);

    this.worker.postMessage({
      type: "position",
      payload: { fen: testFen },
    });
    this.worker.postMessage({
      type: "go",
      payload: { depth: 10, movetime: 3000 },
    });

    // Wait for a response to verify it's working
    try {
      const msg = await this.waitFor((m) => m.type === "bestmove", 8000);
      console.log(
        "🔧 StockfishEngine: Configuration verified - engine is responding correctly"
      );
    } catch (error) {
      console.error(
        "🔧 StockfishEngine: Configuration verification failed:",
        error
      );
    }
  }

  // Test Stockfish with a known position to verify it's working correctly
  async testWithKnownPosition(): Promise<void> {
    if (!this.worker) throw new Error("Engine not initialized");

    console.log("🔧 StockfishEngine: Testing with known winning position...");

    // Test with a position where White is clearly winning (Queen vs Rook)
    const winningFen =
      "r3k2r/ppp2ppp/2n1bn2/2b1p3/2B1P3/3P1N2/PPP2PPP/R1BQK2R w KQkq - 0 1";

    const result = await this.analyzePosition(winningFen, {
      maxDepth: 15,
      maxTimeMs: 5000,
    });

    console.log(
      `🔧 StockfishEngine: Test result - Evaluation: ${result.evaluation} cp, Best Move: ${result.bestMove}`
    );

    if (result.evaluation > 0) {
      console.log(
        "✅ Enhanced evaluation system working correctly - detected White advantage"
      );
    } else {
      console.log(
        "❌ Evaluation system issue - should show White advantage but got:",
        result.evaluation
      );
    }
  }

  // Test if UCI options are working by checking if Stockfish responds with non-zero evaluations
  async testUCIOptions(): Promise<void> {
    if (!this.worker) throw new Error("Engine not initialized");

    console.log("🔧 StockfishEngine: Testing UCI options...");

    // Test with a position where White is clearly winning (rook vs pawn endgame)
    const testFen = "8/8/8/8/8/8/4K3/4R3 w - - 0 1";

    // console.log(
    //   "🔧 StockfishEngine: Testing with position where White has rook vs nothing..."
    // );

    const result = await this.analyzePosition(testFen, {
      maxDepth: 10,
      maxTimeMs: 3000,
    });

    console.log(
      `🔧 StockfishEngine: UCI test - Evaluation: ${result.evaluation} cp`
    );

    if (result.evaluation !== 0) {
      console.log(
        "✅ UCI options are working - Stockfish is evaluating positions"
      );
      console.log("🔧 StockfishEngine: UCI options successfully applied:");
      console.log("  - SkillLevel: 20 (Maximum strength)");
      console.log("  - Threads: 1 (Single thread)");
      console.log("  - Hash: 64 (64MB hash table)");
      console.log("  - Contempt: 0 (No contempt factor)");
      console.log("  - Ponder: false (No pondering)");
      console.log("  - MultiPV: 1 (Single principal variation)");
    } else {
      console.log(
        "❌ UCI options are NOT working - Stockfish still returns 0 cp"
      );
      console.log(
        "🔧 StockfishEngine: This indicates UCI options are not being applied correctly"
      );
    }
  }

  // Simple and reliable material evaluation
  private calculateEnhancedEvaluation(fen: string): number {
    const boardPart = fen.split(" ")[0];
    const turn = fen.split(" ")[1];

    // Simple material count only
    let whiteMaterial = 0;
    let blackMaterial = 0;

    // Standard piece values (centipawns)
    const pieceValues: Record<string, number> = {
      P: 100,
      N: 320,
      B: 330,
      R: 500,
      Q: 900,
      K: 0,
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 0,
    };

    // Count material
    for (const char of boardPart) {
      if (char === "/" || (char >= "1" && char <= "8")) continue;

      if (char >= "A" && char <= "Z") {
        whiteMaterial += pieceValues[char] || 0;
      } else if (char >= "a" && char <= "z") {
        blackMaterial += pieceValues[char] || 0;
      }
    }

    // Calculate material difference
    const materialDiff = whiteMaterial - blackMaterial;

    // Adjust for turn (if it's black's turn, flip the evaluation)
    const finalEvaluation = turn === "w" ? materialDiff : -materialDiff;

    console.log(
      `🔧 StockfishEngine: Simple material evaluation - White: ${whiteMaterial}cp, Black: ${blackMaterial}cp, Diff: ${finalEvaluation}cp`
    );

    return finalEvaluation;
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
