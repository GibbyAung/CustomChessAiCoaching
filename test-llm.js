// Test the LLM integration
import { llmCoaching } from "../src/lib/llm-integration";

async function testLLMCoaching() {
  const testFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const testMove = "e2e4";

  try {
    console.log("🧪 Testing LLM coaching integration...");

    const result = await llmCoaching.analyzeWithLLM(testFen, testMove);

    console.log("✅ LLM Integration Test Results:");
    console.log("Title:", result.llm.title);
    console.log("Message:", result.llm.message);
    console.log("Move Quality:", result.llm.moveQuality);
    console.log("Detailed Explanation:", result.llm.detailedExplanation);
    console.log("Alternative Moves:", result.llm.alternativeMoves);
    console.log("Learning Points:", result.llm.learningPoints);

    // Show the coaching
    llmCoaching.getCoach().showCoaching(result.llm);
  } catch (error) {
    console.error("❌ LLM Integration Test Failed:", error);

    if (error.message.includes("GITHUB_TOKEN")) {
      console.log("💡 Make sure to set GITHUB_TOKEN in your .env file");
    } else if (error.message.includes("openai")) {
      console.log("💡 Make sure to run: npm install openai");
    }
  }
}

// Run the test
testLLMCoaching();
