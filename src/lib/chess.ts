import { Chess, Move, Square } from "chess.js";
import { GameState } from "@/types/chess-engine";
import type { EngineAnalysis } from "@/lib/engine/interface";

export class ChessGame {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  getGameState(): GameState & { lastMove?: string } {
    const history = this.chess.history({ verbose: true });
    const lastMove = history.length > 0 ? history[history.length - 1] : undefined;
    const lastMoveStr = lastMove ? `${lastMove.from}${lastMove.to}${lastMove.promotion || ''}` : undefined;
    
    console.log("♟️ [ChessGame] getGameState:", {
      fen: this.chess.fen(),
      historyLength: history.length,
      lastMove: lastMoveStr,
      lastMoveVerbose: lastMove
    });
    
    return {
      fen: this.chess.fen(),
      isGameOver: this.chess.isGameOver(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
      isDraw: this.chess.isDraw(),
      turn: this.chess.turn(),
      moveHistory: this.chess.history({ verbose: true }),
      lastMove: lastMoveStr,
    };
  }

  makeMove(from: Square, to: Square, promotion?: string): boolean {
    try {
      // Get all legal verbose moves for the source square
      const legal = this.chess.moves({ square: from, verbose: true }) as Array<
        Move & { promotion?: string; san: string; piece: string }
      >;
      if (!legal || legal.length === 0) return false;

      // Find the matching destination
      const candidates = legal.filter((m) => m.to === to);
      if (candidates.length === 0) return false;

      // If any candidate requires promotion, ensure a valid promotion letter
      const requiresPromotion = candidates.some((m) => (m as any).promotion);
      let promo: "q" | "r" | "b" | "n" | undefined = undefined;

      if (requiresPromotion) {
        const p = (promotion || "q").toLowerCase();
        if (p === "q" || p === "r" || p === "b" || p === "n") {
          promo = p;
        } else {
          promo = "q"; // default safe promotion
        }
      }

      const result = this.chess.move({ from, to, promotion: promo });
      return result !== null;
    } catch (error) {
      console.error("Invalid move:", error, { from, to, promotion });
      return false;
    }
  }

  getLegalMoves(square?: Square): Square[][] {
    if (square) {
      return this.chess
        .moves({ square, verbose: true })
        .map((move) => [move.from, move.to]);
    }
    return this.chess
      .moves({ verbose: true })
      .map((move) => [move.from, move.to]);
  }

  isValidMove(from: Square, to: Square): boolean {
    const moves = this.chess.moves({ square: from, verbose: true });
    return moves.some((move) => move.to === to);
  }

  reset(): void {
    this.chess.reset();
  }

  undo(): boolean {
    const move = this.chess.undo();
    return move !== null;
  }

  getFen(): string {
    return this.chess.fen();
  }

  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  getTurn(): "w" | "b" {
    return this.chess.turn();
  }

  getMoveHistory(): Move[] {
    return this.chess.history({ verbose: true });
  }

  flipBoard(): void {
    // This is a placeholder - the actual board flipping will be handled in the UI
    // The chess.js library doesn't have a built-in flip method, so we'll handle this
    // in the ChessBoard component by tracking the board orientation
  }
}
