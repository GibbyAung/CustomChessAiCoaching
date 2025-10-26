# AI_DESIGN.md

## Overview

Project Chimera uses a **hybrid AI approach**: a custom-built chess AI handles all the chess intelligence (move analysis, tactics, strategy), while the open-source LLM only converts structured data into natural language explanations.

## Custom Chess AI Components

### 1. Move Analysis Engine

```typescript
interface MoveAnalysis {
  move: string;
  type: "tactical" | "positional" | "developmental" | "defensive";
  evaluation: number; // centipawns
  confidence: number; // 0-1
  tacticalMotifs: string[]; // ['pin', 'fork', 'discovered_attack']
  strategicThemes: string[]; // ['center_control', 'king_safety', 'pawn_structure']
  threats: string[]; // immediate threats created
  defenses: string[]; // defensive benefits
}
```

### 2. Tactics Detection System

- **Pattern Recognition**: Detects pins, forks, skewers, discovered attacks
- **Threat Analysis**: Identifies immediate and potential threats
- **Calculation Engine**: Evaluates tactical sequences 3-5 moves deep
- **Blunder Detection**: Identifies moves that lose significant advantage

### 3. Strategic Evaluation

- **Position Assessment**: Evaluates pawn structure, piece activity, king safety
- **Plan Generation**: Suggests short-term and long-term strategic goals
- **Weakness Identification**: Finds opponent's weaknesses and your own
- **Opening Principles**: Guides development and center control

### 4. Difficulty Adaptation

```typescript
interface DifficultyLevel {
  name: string;
  maxDepth: number; // search depth
  mistakeThreshold: number; // centipawns
  explanationComplexity: "simple" | "intermediate" | "advanced";
  focusAreas: string[]; // what to emphasize
}
```

## LLM Integration (Language Polish Only)

### Structured Data → Natural Language

Your custom AI generates structured data, then the LLM converts it:

```typescript
// Your AI generates this:
const chessAnalysis = {
  move: "Nf3",
  type: "developmental",
  evaluation: 45,
  tacticalMotifs: ["center_control"],
  strategicThemes: ["development", "king_safety"],
  threats: ["attacks_e5_pawn"],
  difficulty: "beginner",
};

// LLM receives this prompt:
const prompt = `
Convert this chess analysis into a beginner-friendly explanation:
Move: ${chessAnalysis.move}
Type: ${chessAnalysis.type}
Themes: ${chessAnalysis.strategicThemes.join(", ")}
Threats: ${chessAnalysis.threats.join(", ")}

Write a 1-2 sentence explanation suitable for a beginner.
`;

// LLM returns: "This move develops your knight to a good square, attacking the center and preparing to castle for king safety."
```

### LLM Usage Patterns

1. **Move Explanations**: Convert analysis → natural language
2. **Hint Generation**: Convert tactical/strategic data → encouraging hints
3. **Post-Game Analysis**: Convert game statistics → learning insights
4. **Encouragement**: Convert performance data → motivational feedback

## Implementation Strategy

### Phase 1: Core Chess AI (Weeks 1-4)

- Build move analysis engine
- Implement tactics detection
- Create strategic evaluation system
- Test with pre-written explanations

### Phase 2: LLM Integration (Weeks 5-6)

- Design structured data format
- Create LLM prompts for each use case
- Implement fallback to pre-written text
- A/B test AI vs human explanations

### Phase 3: Advanced Features (Weeks 7-8)

- Difficulty adaptation
- Personalized coaching
- Learning path generation
- Performance tracking

## Benefits of This Approach

### Complete Control

- **Chess Intelligence**: Your AI makes all chess decisions
- **Quality Assurance**: No reliance on LLM for chess accuracy
- **Customization**: Tailored to your specific coaching philosophy
- **Performance**: Fast, deterministic responses

### Cost Efficiency

- **Minimal LLM Usage**: Only for language generation, not chess logic
- **Caching**: Cache common explanations to reduce API calls
- **Fallbacks**: Pre-written explanations for reliability
- **Scalability**: Your AI scales without API costs

### Quality Assurance

- **Accuracy**: Your chess AI is deterministic and testable
- **Consistency**: Same analysis always produces same results
- **Transparency**: Users can see the underlying chess logic
- **Improvement**: Easy to enhance specific aspects of analysis

## Technical Implementation

### Chess AI Architecture

```typescript
class ChessCoach {
  private engine: ChessEngine;
  private tacticsDetector: TacticsDetector;
  private strategicEvaluator: StrategicEvaluator;
  private llmClient: LLMClient;

  async analyzeMove(
    fen: string,
    move: string,
    difficulty: string
  ): Promise<MoveExplanation> {
    // 1. Your AI does the chess analysis
    const analysis = await this.engine.analyzeMove(fen, move);
    const tactics = await this.tacticsDetector.findTactics(fen, move);
    const strategy = await this.strategicEvaluator.evaluate(fen, move);

    // 2. Combine into structured data
    const structuredData = this.combineAnalysis(
      analysis,
      tactics,
      strategy,
      difficulty
    );

    // 3. LLM polishes the language
    const explanation = await this.llmClient.generateExplanation(
      structuredData
    );

    return explanation;
  }
}
```

### LLM Prompt Engineering

```typescript
const EXPLANATION_PROMPTS = {
  beginner:
    "Explain this chess move in simple terms for someone learning chess:",
  intermediate: "Explain this chess move with some strategic context:",
  advanced: "Provide a detailed analysis of this chess move:",
};

const HINT_PROMPTS = {
  tactical: "Give a subtle hint about a tactical opportunity:",
  positional: "Suggest a positional improvement:",
  defensive: "Point out a defensive consideration:",
};
```

## See also

- [ARCHITECTURE.md](ARCHITECTURE.md) for system integration
- [API_SPEC.md](API_SPEC.md) for endpoint details
