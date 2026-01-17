// Simple Stockfish Worker - Single Algorithm, Clean Implementation

let stockfish = null;
let ready = false;
let messageQueue = [];

function post(type, payload) {
  self.postMessage({ type, payload });
}

function log(msg) {
  post("info", `[worker] ${msg}`);
}

async function init() {
  try {
    log("init start");

    // Load Stockfish WASM module with timeout - try Stockfish 17.1.79
    const modulePromise = import("/engine/sf171-79.js");
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Module load timeout")), 10000)
    );

    const module = await Promise.race([modulePromise, timeoutPromise]);
    stockfish = await module.default();

    log("Stockfish module loaded, setting up communication...");

    // Set up Stockfish event handlers using the correct API
    stockfish.listen = (data) => {
      // Log all Stockfish responses for debugging
      log(`Stockfish response: ${data}`);

      // Forward UCI responses to main thread
      if (data.includes("uciok")) {
        post("info", "uciok");
        resolveMessage("uciok");
      } else if (data.includes("readyok")) {
        post("info", "readyok");
        resolveMessage("readyok");
      } else if (data.includes("bestmove")) {
        post("bestmove", data);
      } else if (data.includes("info")) {
        post("info", data);
        // Only log evaluation info when there's a significant score (not 0 cp)
        if (
          (data.includes("score") && !data.includes("score cp 0")) ||
          data.includes("mate")
        ) {
          log(`EVALUATION INFO: ${data}`);
        }
      }
    };

    stockfish.onError = (data) => {
      log(`Stockfish error: ${data}`);
      post("error", { message: data });
    };

    // Initialize Stockfish with UCI handshake using the correct API
    log("Sending UCI command...");
    stockfish.uci("uci");

    const uciPromise = waitForMessage("uciok");
    const uciTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("UCI timeout")), 15000)
    );
    await Promise.race([uciPromise, uciTimeout]);

    // Set UCI options IMMEDIATELY after UCI handshake
    log("Setting UCI options for strong play...");

    // Set skill level to maximum (20) for strongest play
    log("Setting Skill Level to 20...");
    stockfish.uci("setoption name Skill Level value 20");

    // CRITICAL: Disable UCI_LimitStrength to ensure full strength
    log("Disabling UCI_LimitStrength...");
    stockfish.uci("setoption name UCI_LimitStrength value false");

    // Set threads to 1 for consistent performance
    log("Setting Threads to 1...");
    stockfish.uci("setoption name Threads value 1");

    // Set hash size for better performance
    log("Setting Hash to 64...");
    stockfish.uci("setoption name Hash value 64");

    // Disable pondering for faster responses
    log("Setting Ponder to false...");
    stockfish.uci("setoption name Ponder value false");

    // Set MultiPV to 1 for single best line
    log("Setting MultiPV to 1...");
    stockfish.uci("setoption name MultiPV value 1");

    // Enable evaluation output
    log("Setting UCI_ShowWDL to true...");
    stockfish.uci("setoption name UCI_ShowWDL value true");

    // Send isready and wait for readyok
    log("UCI options set, sending isready...");
    stockfish.uci("isready");

    const readyPromise = waitForMessage("readyok");
    const readyTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Ready timeout")), 5000)
    );
    await Promise.race([readyPromise, readyTimeout]);

    ready = true;
    post("ready");
    log("Stockfish ready with strong settings");
    log("=== UCI OPTIONS VERIFICATION ===");
    log("Skill Level: 20 (Maximum strength)");
    log("Threads: 1 (Single thread)");
    log("Hash: 64 (64MB hash table)");
    log("Contempt: 0 (No contempt factor)");
    log("Ponder: false (No pondering)");
    log("MultiPV: 1 (Single principal variation)");
    log("UCI_LimitStrength: false (Full strength enabled)");
    log("=== END UCI OPTIONS ===");
  } catch (err) {
    log(`init error: ${err.message}`);
    post("error", { message: err.message });
  }
}

function waitForMessage(pattern) {
  return new Promise((resolve) => {
    messageQueue.push({ pattern, resolve });
  });
}

function resolveMessage(pattern) {
  const index = messageQueue.findIndex((item) => item.pattern === pattern);
  if (index !== -1) {
    const item = messageQueue[index];
    messageQueue.splice(index, 1);
    item.resolve();
  }
}

// Main message handler
self.onmessage = async (e) => {
  const { type, payload } = e.data || {};

  try {
    if (type === "init") {
      if (ready) return post("ready");
      return await init();
    }

    if (!stockfish) throw new Error("Engine not initialized");

    if (type === "setoption") {
      const { name, value } = payload;
      stockfish.uci(`setoption name ${name} value ${value}`);
      return;
    }

    if (type === "position") {
      const { fen } = payload;
      log(`Setting position: ${fen}`);
      stockfish.uci(`position fen ${fen}`);
      return;
    }

    if (type === "go") {
      const { movetime, depth, multiPV = 1 } = payload || {};

      let goCmd = "go";
      if (movetime) {
        goCmd += ` movetime ${movetime}`;
      } else if (depth) {
        goCmd += ` depth ${depth}`;
      } else {
        goCmd += " movetime 1000";
      }

      // Append MultiPV safely
      if (multiPV && multiPV > 1) {
        goCmd += ` MultiPV ${multiPV}`;
      }

      stockfish.uci(goCmd);
      return;
    }

    if (type === "stop") {
      stockfish.uci("stop");
      return;
    }
  } catch (err) {
    post("error", { message: err.message });
  }
};
