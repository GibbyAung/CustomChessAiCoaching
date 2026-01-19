// src/lib/pattern-matcher.ts
"use client";

export interface TacticalPattern {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  suggestion: string;
  alternativeMoves: string[];
}

export interface PatternMatch {
  pattern: TacticalPattern;
  confidence: number;
  position: string;
}

export class ChessPatternMatcher {
  private patterns: TacticalPattern[] = [
    // Fork patterns
    {
      id: "knight_fork",
      name: "Knight Fork",
      description: "Knight attacks two valuable pieces simultaneously",
      severity: "high",
      suggestion: "Look for knight forks that attack king and queen or rooks",
      alternativeMoves: ["Nf3", "Ne5", "Nc6"],
    },
    {
      id: "pawn_fork",
      name: "Pawn Fork",
      description: "Pawn attacks two pieces simultaneously",
      severity: "medium",
      suggestion: "Consider pawn forks to create tactical advantages",
      alternativeMoves: ["e4", "d4", "c4"],
    },
    // Pin patterns
    {
      id: "absolute_pin",
      name: "Absolute Pin",
      description: "Piece pinned against king, cannot move",
      severity: "critical",
      suggestion: "Exploit pinned pieces - they can't defend",
      alternativeMoves: ["attack pinned piece", "ignore pin", "break pin"],
    },
    {
      id: "relative_pin",
      name: "Relative Pin",
      description: "Piece pinned against more valuable piece",
      severity: "high",
      suggestion: "Pressure pinned pieces and attack the pinned piece",
      alternativeMoves: ["increase pressure", "attack pinning piece"],
    },
    // Skewer patterns
    {
      id: "skewer",
      name: "Skewer Attack",
      description:
        "Attack forcing valuable piece to move, exposing piece behind",
      severity: "high",
      suggestion: "Look for skewer opportunities along files and diagonals",
      alternativeMoves: ["align pieces", "create skewer threat"],
    },
    // Discovery patterns
    {
      id: "discovered_attack",
      name: "Discovered Attack",
      description: "Moving piece reveals attack from another piece",
      severity: "critical",
      suggestion: "Create discovered attacks to king or queen",
      alternativeMoves: ["uncover piece", "create discovery"],
    },
    // Removal patterns
    {
      id: "removal_of_guard",
      name: "Removal of Guard",
      description: "Capture defender to enable attack on more valuable piece",
      severity: "high",
      suggestion: "Remove key defenders before attacking",
      alternativeMoves: ["capture defender", "deflect defender"],
    },
    // Trapping patterns
    {
      id: "piece_trapped",
      name: "Piece Trapped",
      description: "Piece has no legal moves and can be captured",
      severity: "medium",
      suggestion: "Identify and trap vulnerable pieces",
      alternativeMoves: ["limit escapes", "prepare capture"],
    },
  ];

  analyzePosition(fen: string, lastMove?: string): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // Basic pattern detection based on FEN analysis
    // This is a simplified implementation - in production, you'd use a proper chess library

    // Detect forks
    const forkMatch = this.detectForkPattern(fen, lastMove);
    if (forkMatch) matches.push(forkMatch);

    // Detect pins
    const pinMatch = this.detectPinPattern(fen, lastMove);
    if (pinMatch) matches.push(pinMatch);

    // Detect skewers
    const skewerMatch = this.detectSkewerPattern(fen, lastMove);
    if (skewerMatch) matches.push(skewerMatch);

    // Sort by severity and confidence
    return matches.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff =
        severityOrder[b.pattern.severity] - severityOrder[a.pattern.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });
  }

  private detectForkPattern(
    fen: string,
    lastMove?: string,
  ): PatternMatch | null {
    // Simplified fork detection - DISABLED to prevent false positives
    // The current implementation gives too many false alarms
    // TODO: Implement proper chess analysis for real fork detection
    return null;
  }

  private detectPinPattern(
    fen: string,
    lastMove?: string,
  ): PatternMatch | null {
    // Simplified pin detection - DISABLED to prevent false positives
    // The current implementation gives too many false alarms
    // TODO: Implement proper chess analysis for real pin detection
    return null;
  }

  private detectSkewerPattern(
    fen: string,
    lastMove?: string,
  ): PatternMatch | null {
    // Simplified skewer detection - DISABLED to prevent false positives
    // The current implementation gives too many false alarms
    // TODO: Implement proper chess analysis for real skewer detection
    return null;
  }

  private hasAlignmentPattern(fen: string): boolean {
    // Check for piece alignments that could indicate pins/skewers
    const pieces = fen.split(" ")[0];

    // Look for queen, rook, bishop, king alignments
    const queens = (pieces.match(/q/g) || []).length;
    const rooks = (pieces.match(/r/g) || []).length;
    const bishops = (pieces.match(/b/g) || []).length;
    const kings = (pieces.match(/k/g) || []).length;

    return queens > 0 && rooks > 0 && bishops > 0 && kings > 0;
  }

  getInstantFeedback(matches: PatternMatch[]): string {
    if (matches.length === 0) {
      return "Position looks balanced - continue developing pieces";
    }

    const topMatch = matches[0];
    return `${topMatch.pattern.name} detected! ${topMatch.pattern.suggestion}`;
  }

  getPatternSeverity(
    matches: PatternMatch[],
  ): "low" | "medium" | "high" | "critical" {
    if (matches.length === 0) return "low";

    const topSeverity = matches[0].pattern.severity;
    return topSeverity;
  }
}
