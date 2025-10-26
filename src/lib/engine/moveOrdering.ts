import { Chess } from "chess.js";
import { PIECE_VALUES } from "./constants";

export function moveKey(move: any): string {
  return `${move.from}${move.to}${move.promotion || ""}`;
}

export const killerMoves: Record<number, string[]> = {};
export const moveHistory = new Map<string, number>();

export function simpleSEE(chess: Chess, move: any): number {
  const absVal = (pieceCode: string): number => {
    const lower = pieceCode.toLowerCase();
    const val = (PIECE_VALUES as any)[lower] ?? 0;
    return Math.abs(val);
  };
  const captured = move.captured ? absVal(move.captured) : 0;
  const moving = absVal(move.piece);
  return captured - moving;
}

export function orderMoves(
  moves: any[],
  chess: Chess,
  depth?: number,
  ttBest?: string
): any[] {
  const killers = depth !== undefined ? killerMoves[depth] || [] : [];

  return moves.sort((a, b) => {
    const aKey = moveKey(a);
    const bKey = moveKey(b);

    if (ttBest) {
      if (aKey === ttBest && bKey !== ttBest) return -1;
      if (bKey === ttBest && aKey !== ttBest) return 1;
    }

    const aCapture = a.captured
      ? PIECE_VALUES[a.captured.toUpperCase() as keyof typeof PIECE_VALUES] || 0
      : 0;
    const bCapture = b.captured
      ? PIECE_VALUES[b.captured.toUpperCase() as keyof typeof PIECE_VALUES] || 0
      : 0;
    if (aCapture !== bCapture) return bCapture - aCapture;

    const aIsKiller = killers.includes(aKey) && !a.captured;
    const bIsKiller = killers.includes(bKey) && !b.captured;
    if (aIsKiller !== bIsKiller) return aIsKiller ? -1 : 1;

    if (a.san.includes("+") && !b.san.includes("+")) return -1;
    if (!a.san.includes("+") && b.san.includes("+")) return 1;

    const aHist = moveHistory.get(aKey) || 0;
    const bHist = moveHistory.get(bKey) || 0;
    if (aHist !== bHist) return bHist - aHist;

    if (a.piece === "p" && b.piece !== "p") return -1;
    if (a.piece !== "p" && b.piece === "p") return 1;
    return 0;
  });
}
