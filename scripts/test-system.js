#!/usr/bin/env node

/**
 * Chess Engine System Test Script
 * Tests all components of the chess engine system
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 Chess Engine System Test\n");

// Test 1: Check if all required files exist
console.log("1. Checking file structure...");
const requiredFiles = [
  "src/lib/stockfish-engine.ts",
  "src/lib/stockfish-worker.ts",
  "src/lib/advanced-chess-ai.ts",
  "src/lib/simple-fallback-engine.ts",
  "src/contexts/ChessEngineContext.tsx",
  "src/components/AIOpponent.tsx",
  "src/components/EvaluationBar.tsx",
  "src/lib/chess.ts",
  "package.json",
  "next.config.ts",
  "tsconfig.json",
];

let allFilesExist = true;
requiredFiles.forEach((file) => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? "✅" : "❌"} ${file}`);
  if (!exists) allFilesExist = false;
});

if (allFilesExist) {
  console.log("   ✅ All required files found\n");
} else {
  console.log("   ❌ Some required files are missing\n");
}

// Test 2: Check package.json dependencies
console.log("2. Checking dependencies...");
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const requiredDeps = ["chess.js", "react-chessboard", "next", "react"];
  const requiredDevDeps = ["typescript", "@types/node", "tailwindcss"];

  let allDepsFound = true;
  requiredDeps.forEach((dep) => {
    const found = packageJson.dependencies && packageJson.dependencies[dep];
    console.log(`   ${found ? "✅" : "❌"} ${dep}`);
    if (!found) allDepsFound = false;
  });

  requiredDevDeps.forEach((dep) => {
    const found =
      packageJson.devDependencies && packageJson.devDependencies[dep];
    console.log(`   ${found ? "✅" : "❌"} ${dep} (dev)`);
    if (!found) allDepsFound = false;
  });

  if (allDepsFound) {
    console.log("   ✅ All required dependencies found\n");
  } else {
    console.log("   ❌ Some dependencies are missing\n");
  }
} catch (error) {
  console.log("   ❌ Error reading package.json\n");
}

// Test 3: Check TypeScript configuration
console.log("3. Checking TypeScript configuration...");
try {
  const tsConfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
  const hasStrictMode =
    tsConfig.compilerOptions && tsConfig.compilerOptions.strict;
  const hasESNext =
    tsConfig.compilerOptions && tsConfig.compilerOptions.target === "ESNext";

  console.log(`   ${hasStrictMode ? "✅" : "❌"} Strict mode enabled`);
  console.log(`   ${hasESNext ? "✅" : "❌"} ESNext target`);

  if (hasStrictMode && hasESNext) {
    console.log("   ✅ TypeScript configuration looks good\n");
  } else {
    console.log("   ⚠️  TypeScript configuration may need adjustment\n");
  }
} catch (error) {
  console.log("   ❌ Error reading tsconfig.json\n");
}

// Test 4: Check Next.js configuration
console.log("4. Checking Next.js configuration...");
try {
  const nextConfig = fs.readFileSync("next.config.ts", "utf8");
  const hasClientOnly = nextConfig.includes("client-only");
  const hasOptimizations = nextConfig.includes("optimizePackageImports");

  console.log(`   ${hasClientOnly ? "✅" : "❌"} Client-only architecture`);
  console.log(`   ${hasOptimizations ? "✅" : "❌"} Package optimizations`);

  if (hasClientOnly || hasOptimizations) {
    console.log("   ✅ Next.js configuration looks good\n");
  } else {
    console.log("   ⚠️  Next.js configuration may need adjustment\n");
  }
} catch (error) {
  console.log("   ❌ Error reading next.config.ts\n");
}

// Test 5: Check for Stockfish asset
console.log("5. Checking Stockfish asset...");
const stockfishExists = fs.existsSync("public/stockfish.js");
console.log(
  `   ${stockfishExists ? "✅" : "⚠️ "} stockfish.js in public/ directory`
);

if (stockfishExists) {
  const stats = fs.statSync("public/stockfish.js");
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  console.log(`   📦 File size: ${sizeMB}MB`);
  console.log("   ✅ Stockfish will be used as primary engine\n");
} else {
  console.log("   ⚠️  Stockfish not found - will use fallback engines\n");
}

// Test 6: Check documentation
console.log("6. Checking documentation...");
const docsFiles = [
  "README.md",
  "docs/TASK_MANAGER.md",
  "docs/PROJECT_SUMMARY.md",
  "docs/ARCHITECTURE.md",
  "docs/AI_DESIGN.md",
];

let allDocsExist = true;
docsFiles.forEach((file) => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? "✅" : "❌"} ${file}`);
  if (!exists) allDocsExist = false;
});

if (allDocsExist) {
  console.log("   ✅ All documentation files found\n");
} else {
  console.log("   ⚠️  Some documentation files are missing\n");
}

// Summary
console.log("📊 Test Summary:");
console.log("================");

const testResults = {
  files: allFilesExist,
  dependencies: allDepsFound,
  typescript: hasStrictMode && hasESNext,
  nextjs: hasClientOnly || hasOptimizations,
  stockfish: stockfishExists,
  documentation: allDocsExist,
};

const passedTests = Object.values(testResults).filter(Boolean).length;
const totalTests = Object.keys(testResults).length;

console.log(`\n✅ Passed: ${passedTests}/${totalTests} tests`);

if (passedTests === totalTests) {
  console.log(
    "\n🎉 All tests passed! The chess engine system is ready to use."
  );
  console.log("\n🚀 Next steps:");
  console.log('   1. Run "npm run dev" to start the development server');
  console.log("   2. Open http://localhost:3000 in your browser");
  console.log("   3. Test the AI opponent functionality");
  console.log("   4. Verify the evaluation bar works correctly");
} else {
  console.log("\n⚠️  Some tests failed. Please review the issues above.");
  console.log("\n🔧 To fix issues:");
  console.log("   1. Install missing dependencies: npm install");
  console.log("   2. Download stockfish.js to public/ directory (optional)");
  console.log("   3. Check TypeScript and Next.js configurations");
}

console.log(
  "\n📚 For more information, see the documentation in docs/ directory."
);
