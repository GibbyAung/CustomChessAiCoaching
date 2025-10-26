// Simplified Stockfish Worker - Minimal UCI Setup

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
    log("Simple init start");

    // Load Stockfish WASM module
    const module = await import("/engine/sf171-79.js");
    stockfish = await module.default();

    log("Stockfish module loaded");

    // Set up basic event handlers
    stockfish.listen = (data) => {
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
      }
    };

    stockfish.onError = (data) => {
      log(`Stockfish error: ${data}`);
      post("error", { message: data });
    };

    // Initialize Stockfish with minimal UCI handshake
    log("Sending UCI command...");
    stockfish.uci("uci");

    const uciPromise = waitForMessage("uciok");
    const uciTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("UCI timeout")), 10000)
    );
    await Promise.race([uciPromise, uciTimeout]);

    // Set only essential UCI options
    log("Setting essential UCI options...");
    stockfish.uci("setoption name Skill Level value 20");
    stockfish.uci("setoption name UCI_LimitStrength value false");
    stockfish.uci("setoption name Threads value 1");
    stockfish.uci("setoption name Hash value 64");

    // Send isready
    log("Sending isready...");
    stockfish.uci("isready");

    const readyPromise = waitForMessage("readyok");
    const readyTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Ready timeout")), 5000)
    );
    await Promise.race([readyPromise, readyTimeout]);

    ready = true;
    post("ready");
    log("Stockfish ready with minimal settings");
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

// Handle messages from main thread
self.onmessage = function (e) {
  const { type, payload } = e.data;

  switch (type) {
    case "init":
      init();
      break;

    case "analyze":
      if (!ready || !stockfish) {
        post("error", { message: "Engine not ready" });
        return;
      }

      const { fen, depth, time } = payload;
      log(`Setting position: ${fen}`);
      stockfish.uci(`position fen ${fen}`);
      stockfish.uci(`go depth ${depth} movetime ${time}`);
      break;

    case "stop":
      if (stockfish) {
        stockfish.uci("stop");
      }
      break;

    case "quit":
      if (stockfish) {
        stockfish.uci("quit");
      }
      ready = false;
      break;
  }
};
