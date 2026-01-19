// ✅ Stockfish Worker with NNUE Loading Support
let stockfish = null;
let ready = false;
let messageQueue = [];
let isInitializing = false;

function post(type, payload) {
  self.postMessage({ type, payload });
}

function log(msg) {
  console.log(`[SF-Worker] ${msg}`);
  post("info", `[worker] ${msg}`);
}

async function loadNNUE() {
  try {
    log("📥 Loading NNUE neural networks...");

    // Load big NNUE
    const bigResponse = await fetch("/engine/nn-1c0000000000.nnue");
    if (!bigResponse.ok) throw new Error("Failed to fetch big NNUE");
    const bigBuffer = await bigResponse.arrayBuffer();
    const bigArray = new Uint8Array(bigBuffer);

    log(`Big NNUE loaded: ${(bigArray.length / 1024 / 1024).toFixed(2)} MB`);
    stockfish.setNnueBuffer(bigArray, 0);

    // Load small NNUE
    const smallResponse = await fetch("/engine/nn-37f18f62d772.nnue");
    if (!smallResponse.ok) throw new Error("Failed to fetch small NNUE");
    const smallBuffer = await smallResponse.arrayBuffer();
    const smallArray = new Uint8Array(smallBuffer);

    log(
      `Small NNUE loaded: ${(smallArray.length / 1024 / 1024).toFixed(2)} MB`,
    );
    stockfish.setNnueBuffer(smallArray, 1);

    log("✅ NNUE networks loaded successfully!");
    return true;
  } catch (err) {
    log(`⚠️ NNUE loading failed (will use fallback): ${err.message}`);
    return false;
  }
}

function waitForMessage(pattern, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = messageQueue.findIndex((item) => item.pattern === pattern);
      if (idx !== -1) messageQueue.splice(idx, 1);
      reject(new Error(`Timeout waiting for ${pattern}`));
    }, timeout);

    messageQueue.push({
      pattern,
      resolve: () => {
        clearTimeout(timer);
        const idx = messageQueue.findIndex((item) => item.pattern === pattern);
        if (idx !== -1) messageQueue.splice(idx, 1);
        resolve();
      },
    });
  });
}

function resolveMessage(pattern) {
  const idx = messageQueue.findIndex((item) => item.pattern === pattern);
  if (idx !== -1) {
    const item = messageQueue[idx];
    messageQueue.splice(idx, 1);
    item.resolve();
  }
}

async function init() {
  if (isInitializing) {
    log("Already initializing, waiting...");
    return;
  }

  if (ready) {
    log("Already ready!");
    post("ready");
    return;
  }

  isInitializing = true;

  try {
    log("🚀 Initializing Stockfish 17.1.79...");

    // Load sf171-79 module
    const moduleStart = Date.now();
    const module = await import("/engine/sf171-79.js");
    const Sf17179Web = module.default;

    log(`Module loaded in ${Date.now() - moduleStart}ms`);

    // Initialize Stockfish instance
    stockfish = await Sf17179Web();
    log("Stockfish instance created");

    // Load NNUE networks (optional but recommended)
    await loadNNUE();

    // Setup message handlers
    stockfish.listen = (data) => {
      if (data.includes("uciok")) {
        resolveMessage("uciok");
      } else if (data.includes("readyok")) {
        resolveMessage("readyok");
      } else if (data.includes("bestmove")) {
        post("bestmove", data);
      } else if (data.includes("info")) {
        post("info", data);
      } else if (data.includes("error")) {
        log(`❌ Stockfish error: ${data}`);
        post("error", { message: data });
      }
    };

    stockfish.onError = (msg) => {
      log(`❌ Stockfish error: ${msg}`);
      post("error", { message: msg });
    };

    // UCI handshake
    log("Sending UCI command...");
    stockfish.uci("uci");
    await waitForMessage("uciok", 20000);
    log("✅ UCI handshake complete");

    // Configure Stockfish
    log("⚙️ Configuring engine...");
    stockfish.uci("setoption name Threads value 1");
    stockfish.uci("setoption name Hash value 128");
    stockfish.uci("setoption name MultiPV value 1");
    stockfish.uci("setoption name UCI_ShowWDL value true");

    // Verify ready
    stockfish.uci("isready");
    await waitForMessage("readyok", 10000);
    
    ready = true;
    isInitializing = false;
    post("ready");
    log("✅ Stockfish ready for analysis!");
  } catch (err) {
    isInitializing = false;
    const errorMsg = `Failed to initialize: ${err.message}`;
    log(`❌ ${errorMsg}`);
    post("error", { message: errorMsg });
    throw err;
  }
}

// Main message handler
self.onmessage = async (e) => {
  const { type, payload } = e.data || {};

  try {
    if (type === "init") {
      return await init();
    }

    if (!ready) {
      throw new Error("Engine not ready. Call init first.");
    }

    if (!stockfish) {
      throw new Error("Stockfish not initialized");
    }

    if (type === "setoption") {
      const { name, value } = payload;
      stockfish.uci(`setoption name ${name} value ${value}`);
      return;
    }

    if (type === "position") {
      const { fen } = payload;
      stockfish.uci(`position fen ${fen}`);
      return;
    }

    if (type === "go") {
      const { movetime, depth, multiPV } = payload;
      
      // CRITICAL FIX: Only set MultiPV if actually different
      if (multiPV && multiPV > 1) {
        stockfish.uci('setoption name MultiPV value ' + multiPV);
        stockfish.uci('isready');
        await waitForMessage('readyok', 1000);
      } else if (multiPV === 1) {
        stockfish.uci('setoption name MultiPV value 1');
        stockfish.uci('isready');
        await waitForMessage('readyok', 1000);
      }
      
      // CRITICAL: Use ONLY movetime for timed searches
      if (movetime && movetime > 0) {
        stockfish.uci('go movetime ' + movetime);
        log('🚀 Starting timed search: ' + movetime + 'ms');
      } else if (depth && depth > 0) {
        stockfish.uci('go depth ' + depth);
        log('🔍 Starting depth search: ' + depth);
      } else {
        // Default fallback to prevent infinite search
        stockfish.uci('go depth 15');
        log('🔍 Starting default depth search: 15');
      }
      return;
    }

    if (type === "stop") {
      stockfish.uci("stop");
      return;
    }

    if (type === "quit") {
      stockfish.uci("quit");
      ready = false;
      stockfish = null;
      return;
    }
  } catch (err) {
    log(`❌ Error handling ${type}: ${err.message}`);
    post("error", { message: err.message });
  }
};

log("Worker loaded, waiting for init message...");