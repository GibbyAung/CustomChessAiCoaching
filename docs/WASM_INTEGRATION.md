# WASM Integration Guide

## Overview

This document describes the WebAssembly (WASM) integration of the C++ chess engine with the Next.js frontend.

## Architecture

### Components

1. **C++ Chess Engine** (`engine/`)

   - Core chess logic written in C++
   - Compiled to WebAssembly using Emscripten
   - Provides move generation, evaluation, and search algorithms

2. **TypeScript WASM Wrapper** (`src/lib/chess-engine.ts`)

   - Type-safe interface to the C++ engine
   - Handles memory management and error handling
   - Provides async/await API for engine operations

3. **React Context** (`src/contexts/ChessEngineContext.tsx`)

   - Manages engine state and lifecycle
   - Provides hooks for React components
   - Handles engine initialization and cleanup

4. **AI Opponent Component** (`src/components/AIOpponent.tsx`)
   - User interface for AI opponent functionality
   - Configurable difficulty levels
   - Real-time analysis display

## Setup

### Prerequisites

1. **Emscripten SDK**

   ```bash
   # Install Emscripten
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. **CMake** (3.16 or higher)

   ```bash
   # Ubuntu/Debian
   sudo apt install cmake

   # macOS
   brew install cmake

   # Windows
   # Download from https://cmake.org/download/
   ```

### Building the Engine

1. **Build WASM Module**

   ```bash
   npm run build:engine
   ```

2. **Development with Engine**

   ```bash
   npm run dev:with-engine
   ```

3. **Production Build**
   ```bash
   npm run build:all
   ```

## Usage

### Basic Engine Usage

```typescript
import { chessEngine } from "@/lib/chess-engine";

// Initialize engine
await chessEngine.initialize();

// Set position
chessEngine.setPosition(
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
);

// Analyze position
const analysis = await chessEngine.analyzePosition({
  maxDepth: 4,
  maxTimeMs: 2000,
});

// Get best move
const bestMove = chessEngine.getBestMove(4);
```

### React Integration

```typescript
import { useChessEngine } from "@/contexts/ChessEngineContext";

function MyComponent() {
  const { engineState, analyzePosition, isEngineReady } = useChessEngine();

  const handleAnalysis = async () => {
    if (isEngineReady) {
      const analysis = await analyzePosition(fen);
      console.log("Best move:", analysis.bestMove);
    }
  };

  return <div>{engineState.isLoaded ? "Engine Ready" : "Loading..."}</div>;
}
```

### AI Opponent

```typescript
import { AIOpponent } from "@/components/AIOpponent";

function GamePage() {
  return (
    <AIOpponent
      isEnabled={true}
      difficulty="medium"
      autoPlay={false}
      onMove={(move) => console.log("AI played:", move)}
    />
  );
}
```

## API Reference

### ChessEngineWASM Class

#### Methods

- `initialize(): Promise<void>` - Initialize the WASM engine
- `setPosition(fen: string): boolean` - Set the current position
- `getPosition(): string` - Get the current position as FEN
- `analyzePosition(config?: EngineConfig): Promise<EngineAnalysis>` - Analyze current position
- `getBestMove(depth?: number): EngineMove | null` - Get best move
- `evaluatePosition(): number` - Evaluate current position
- `isValidMove(from: string, to: string): boolean` - Validate move
- `getGameState()` - Get game state information
- `destroy(): void` - Clean up resources

#### Configuration

```typescript
interface EngineConfig {
  maxDepth: number; // Search depth (1-10)
  maxTimeMs: number; // Time limit in milliseconds
  enableLogging: boolean; // Enable debug logging
}
```

### Engine Analysis Result

```typescript
interface EngineAnalysis {
  bestMove: EngineMove | null;
  evaluation: number; // Position evaluation (centipawns)
  depth: number; // Search depth reached
  nodesSearched: number; // Nodes searched
  timeMs: number; // Time taken
  pv?: EngineMove[]; // Principal variation
}
```

## Performance Considerations

### Memory Management

- The engine uses 16MB initial memory with growth capability
- Memory is automatically managed by Emscripten
- Large searches may require more memory

### Search Optimization

- Use appropriate depth limits (2-6 for real-time play)
- Set reasonable time limits (1-5 seconds)
- Consider difficulty levels for different use cases

### Error Handling

```typescript
try {
  const analysis = await chessEngine.analyzePosition();
} catch (error) {
  if (error.message === EngineError.NOT_LOADED) {
    // Handle engine not loaded
  } else if (error.message === EngineError.TIMEOUT) {
    // Handle analysis timeout
  }
}
```

## Best Practices

### 1. Engine Lifecycle

- Initialize engine once at application startup
- Clean up resources on application shutdown
- Handle initialization errors gracefully

### 2. State Management

- Use React context for engine state
- Avoid multiple engine instances
- Cache analysis results when appropriate

### 3. User Experience

- Show loading states during analysis
- Provide progress indicators for long searches
- Handle timeouts gracefully

### 4. Error Handling

- Always wrap engine calls in try-catch
- Provide meaningful error messages
- Implement fallback behavior

## Troubleshooting

### Common Issues

1. **Engine not loading**

   - Check if WASM files are in public directory
   - Verify Emscripten installation
   - Check browser console for errors

2. **Analysis timeouts**

   - Reduce search depth
   - Increase time limits
   - Check for infinite loops in engine

3. **Memory issues**
   - Increase initial memory allocation
   - Enable memory growth
   - Monitor memory usage

### Debug Mode

Enable debug logging:

```typescript
chessEngine.updateConfig({ enableLogging: true });
```

### Performance Profiling

Use browser dev tools to profile:

- WASM memory usage
- Analysis time
- JavaScript-WASM communication overhead

## Future Enhancements

1. **Parallel Search**

   - Web Workers for parallel analysis
   - Shared memory for better performance

2. **Opening Book**

   - Pre-computed opening moves
   - Position database integration

3. **Advanced Features**
   - Position analysis mode
   - Move suggestion system
   - Tactics training

## Security Considerations

1. **WASM Security**

   - WASM runs in sandboxed environment
   - No direct file system access
   - Memory isolation from JavaScript

2. **Input Validation**
   - Validate FEN strings
   - Sanitize move inputs
   - Handle malformed data gracefully

## Contributing

When modifying the C++ engine:

1. Update CMakeLists.txt for new functions
2. Add TypeScript declarations
3. Update documentation
4. Test with various positions
5. Verify performance impact
