// Simple test for MultiPV functionality
const { stockfishEngine } = require("./src/lib/stockfish-engine");

async function testMultiPV() {
  try {
    console.log("🧪 Testing MultiPV functionality...");

    // Initialize the engine
    await stockfishEngine.initialize();
    console.log("✅ Engine initialized");

    // Test position - starting position
    const testFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    // Test with MultiPV=5
    const result = await stockfishEngine.analyzePosition(testFen, {
      maxTimeMs: 5000,
      multiPV: 5,
    });

    console.log("📊 Analysis Results:");
    console.log(`Best Move: ${result.bestMove}`);
    console.log(`Evaluation: ${result.evaluation} cp`);
    console.log(`Depth: ${result.depth}`);
    console.log(`Time: ${result.timeMs}ms`);

    if (result.topMoves && result.topMoves.length > 0) {
      console.log("\n🎯 Top Moves (MultiPV):");
      result.topMoves.forEach((move, index) => {
        console.log(`${index + 1}. ${move.move} (${move.eval}cp)`);
      });
      console.log("✅ MultiPV is working!");
    } else {
      console.log("❌ No topMoves found - MultiPV may not be working");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    stockfishEngine.destroy();
  }
}

testMultiPV();
