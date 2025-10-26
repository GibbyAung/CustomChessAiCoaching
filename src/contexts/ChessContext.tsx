"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { ChessGame, GameState } from "@/lib/chess";
import { Square } from "chess.js";

interface ChessContextType {
  gameState: GameState;
  makeMove: (from: Square, to: Square, promotion?: string) => boolean;
  resetGame: () => void;
  undoMove: () => void;
  flipBoard: () => void;
  getLegalMoves: (square?: Square) => Square[][];
  isValidMove: (from: Square, to: Square) => boolean;
}

const ChessContext = createContext<ChessContextType | undefined>(undefined);

type ChessAction =
  | { type: "MAKE_MOVE"; from: Square; to: Square; promotion?: string }
  | { type: "RESET_GAME" }
  | { type: "UNDO_MOVE" };

interface ChessState {
  game: ChessGame;
  gameState: GameState;
}

const chessReducer = (state: ChessState, action: ChessAction): ChessState => {
  switch (action.type) {
    case "MAKE_MOVE":
      return {
        ...state,
        gameState: state.game.getGameState(),
      };

    case "RESET_GAME":
      state.game.reset();
      return {
        ...state,
        gameState: state.game.getGameState(),
      };

    case "UNDO_MOVE":
      const undoSuccess = state.game.undo();
      if (undoSuccess) {
        return {
          ...state,
          gameState: state.game.getGameState(),
        };
      }
      return state;

    default:
      return state;
  }
};

export const ChessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(chessReducer, {
    game: new ChessGame(),
    gameState: new ChessGame().getGameState(),
  });

  const makeMove = (from: Square, to: Square, promotion?: string): boolean => {
    const moveSuccess = state.game.makeMove(from, to, promotion);
    if (moveSuccess) {
      dispatch({ type: "MAKE_MOVE", from, to, promotion });
    }
    return moveSuccess;
  };

  const resetGame = () => {
    dispatch({ type: "RESET_GAME" });
  };

  const undoMove = () => {
    dispatch({ type: "UNDO_MOVE" });
  };

  const flipBoard = () => {
    state.game.flipBoard();
  };

  const getLegalMoves = (square?: Square): Square[][] => {
    return state.game.getLegalMoves(square);
  };

  const isValidMove = (from: Square, to: Square): boolean => {
    return state.game.isValidMove(from, to);
  };

  const value: ChessContextType = {
    gameState: state.gameState,
    makeMove,
    resetGame,
    undoMove,
    flipBoard,
    getLegalMoves,
    isValidMove,
  };

  return (
    <ChessContext.Provider value={value}>{children}</ChessContext.Provider>
  );
};

export const useChess = (): ChessContextType => {
  const context = useContext(ChessContext);
  if (context === undefined) {
    throw new Error("useChess must be used within a ChessProvider");
  }
  return context;
};
