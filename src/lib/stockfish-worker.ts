// Stockfish Web Worker - loads /stockfish.js from public and wraps UCI

// In worker scope; TS may not know DedicatedWorkerGlobalScope here, so keep any casts

let engine: Worker | null = null;
let ready = false;
let awaiting: Array<(msg: string) => void> = [];

function post(type: string, payload?: any) {
  (self as any).postMessage({ type, payload });
}

function onEngineMessage(e: MessageEvent) {
  const text = typeof e.data === "string" ? e.data : e.data?.data ?? "";
  if (!text) return;
  // Relay info lines and bestmove
  if (text.startsWith("info ")) {
    post("info", text);
  }
  if (text.startsWith("bestmove ")) {
    post("bestmove", text);
  }
  // Resolve any waiters
  awaiting.forEach((cb) => cb(text));
  awaiting = [];
}

function waitFor(pattern: RegExp, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${pattern}`));
    }, timeoutMs);
    awaiting.push((msg) => {
      if (pattern.test(msg)) {
        clearTimeout(to);
        resolve(msg);
      }
    });
  });
}

async function init() {
  try {
    (self as any).importScripts("/stockfish.js?cb=" + Math.random());
    engine = (self as any).Stockfish
      ? (self as any).Stockfish()
      : (self as any);
    engine!.onmessage = onEngineMessage;
    // Handshake
    engine!.postMessage("uci");
    await waitFor(/uciok/);
    engine!.postMessage("isready");
    await waitFor(/readyok/);
    ready = true;
    post("ready");
  } catch (err) {
    post("error", { message: (err as Error).message });
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data || {};
  try {
    if (type === "init") {
      if (ready) return post("ready");
      return await init();
    }
    if (!engine) throw new Error("Engine not initialized");

    if (type === "setoption") {
      const { name, value } = payload;
      engine!.postMessage(`setoption name ${name} value ${value}`);
      return;
    }
    if (type === "position") {
      const { fen, moves } = payload;
      const pos =
        moves && moves.length
          ? `position fen ${fen} moves ${moves.join(" ")}`
          : `position fen ${fen}`;
      engine!.postMessage(pos);
      return;
    }
    if (type === "go") {
      const { movetime, depth } = payload || {};
      if (movetime) engine!.postMessage(`go movetime ${movetime}`);
      else if (depth) engine!.postMessage(`go depth ${depth}`);
      else engine!.postMessage(`go movetime 1000`);
      return;
    }
    if (type === "stop") {
      engine!.postMessage("stop");
      return;
    }
  } catch (err) {
    post("error", { message: (err as Error).message });
  }
};
