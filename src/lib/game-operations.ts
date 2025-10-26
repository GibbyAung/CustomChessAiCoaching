import { gameSessionManager } from "./game-session-manager";
import { GameMode, PlayerColor, AIConfig } from "@/types/game-modes";

export interface GameOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class GameOperations {
  /**
   * Start a new game with proper session management
   */
  static async startNewGame(
    resetChessGame: () => void,
    showToast?: (title: string, message: string) => void
  ): Promise<GameOperationResult> {
    try {
      // Reset the game session to allow mode changes
      gameSessionManager.resetSession();

      // Reset the chess game to initial position
      resetChessGame();

      // Show success message
      showToast?.(
        "New Game Started",
        "The game has been reset to the initial position."
      );

      return { success: true, message: "New game started successfully" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start new game";
      showToast?.("Error", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Abandon the current game with proper cleanup
   */
  static async abandonGame(
    resetChessGame: () => void,
    showToast?: (title: string, message: string) => void
  ): Promise<GameOperationResult> {
    try {
      // Abandon the current game session
      gameSessionManager.abandonGame();

      // Reset the chess game to initial position
      resetChessGame();

      // Show success message
      showToast?.(
        "Game Abandoned",
        "You have abandoned the game. A new game can be started."
      );

      return { success: true, message: "Game abandoned successfully" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to abandon game";
      showToast?.("Error", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Start a new game session with specific mode and configuration
   */
  static async startGameSession(
    mode: GameMode,
    userColor: PlayerColor,
    aiConfig: AIConfig,
    onModeChange: (mode: GameMode) => void
  ): Promise<GameOperationResult> {
    try {
      // Create new session
      gameSessionManager.createSession(mode, userColor, aiConfig);

      // Start the game
      gameSessionManager.startGame();

      // Change to the selected mode
      onModeChange(mode);

      return { success: true, message: "Game session started successfully" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start game session";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Pause the current game
   */
  static async pauseGame(): Promise<GameOperationResult> {
    try {
      gameSessionManager.pauseGame();
      return { success: true, message: "Game paused" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to pause game";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Resume the current game
   */
  static async resumeGame(): Promise<GameOperationResult> {
    try {
      gameSessionManager.resumeGame();
      return { success: true, message: "Game resumed" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to resume game";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Complete the current game
   */
  static async completeGame(): Promise<GameOperationResult> {
    try {
      gameSessionManager.completeGame();
      return { success: true, message: "Game completed" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete game";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if game operations are available
   */
  static canPerformOperation(
    operation: "newGame" | "abandon" | "pause" | "resume"
  ): boolean {
    const session = gameSessionManager.getCurrentSession();

    switch (operation) {
      case "newGame":
        return true; // Always available
      case "abandon":
        return session?.status === "playing" || session?.status === "paused";
      case "pause":
        return session?.status === "playing";
      case "resume":
        return session?.status === "paused";
      default:
        return false;
    }
  }

  /**
   * Get current game status for UI
   */
  static getGameStatus() {
    const session = gameSessionManager.getCurrentSession();
    return {
      hasActiveSession: session !== null,
      canChangeMode: gameSessionManager.canChangeMode(),
      status: session?.status || null,
      mode: session?.mode || null,
    };
  }
}
