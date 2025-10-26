import {
  GameSession,
  GameMode,
  PlayerColor,
  AIConfig,
  GameStatus,
} from "@/types/game-modes";

export class GameSessionManager {
  private currentSession: GameSession | null = null;
  private listeners: Set<(session: GameSession | null) => void> = new Set();

  // Create a new game session
  createSession(
    mode: GameMode,
    userColor: PlayerColor,
    aiConfig: AIConfig
  ): GameSession {
    const session: GameSession = {
      id: this.generateSessionId(),
      mode,
      status: "setup",
      userColor,
      aiColor: userColor === "white" ? "black" : "white",
      aiConfig,
      startTime: Date.now(),
      moveCount: 0,
      isBoardFlipped: userColor === "black",
      canChangeMode: false, // Lock mode changes during game
    };

    this.currentSession = session;
    this.notifyListeners();
    return session;
  }

  // Get current session
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  // Start the game (move from setup to playing)
  startGame(): void {
    if (this.currentSession && this.currentSession.status === "setup") {
      this.currentSession.status = "playing";
      this.currentSession.canChangeMode = false;
      this.notifyListeners();
    }
  }

  // Pause the game
  pauseGame(): void {
    if (this.currentSession && this.currentSession.status === "playing") {
      this.currentSession.status = "paused";
      this.notifyListeners();
    }
  }

  // Resume the game
  resumeGame(): void {
    if (this.currentSession && this.currentSession.status === "paused") {
      this.currentSession.status = "playing";
      this.notifyListeners();
    }
  }

  // Complete the game
  completeGame(): void {
    if (this.currentSession) {
      this.currentSession.status = "completed";
      this.currentSession.endTime = Date.now();
      this.currentSession.canChangeMode = true; // Allow mode changes after game
      this.notifyListeners();
    }
  }

  // Abandon the game
  abandonGame(): void {
    if (this.currentSession) {
      this.currentSession.status = "abandoned";
      this.currentSession.endTime = Date.now();
      this.currentSession.canChangeMode = true; // Allow mode changes after game
      this.notifyListeners();
    }
  }

  // Record a move
  recordMove(): void {
    if (this.currentSession && this.currentSession.status === "playing") {
      this.currentSession.moveCount++;
      this.notifyListeners();
    }
  }

  // Check if it's the AI's turn
  isAITurn(currentTurn: "w" | "b"): boolean {
    if (!this.currentSession || this.currentSession.status !== "playing") {
      return false;
    }

    const currentColor = currentTurn === "w" ? "white" : "black";
    return currentColor === this.currentSession.aiColor;
  }

  // Check if the user can make a move
  canUserMove(currentTurn: "w" | "b"): boolean {
    if (!this.currentSession || this.currentSession.status !== "playing") {
      return false;
    }

    const currentColor = currentTurn === "w" ? "white" : "black";
    return currentColor === this.currentSession.userColor;
  }

  // Check if mode can be changed
  canChangeMode(): boolean {
    return this.currentSession?.canChangeMode ?? true;
  }

  // Get AI configuration for current session
  getAIConfig(): AIConfig | null {
    return this.currentSession?.aiConfig ?? null;
  }

  // Update AI configuration during gameplay
  updateAIConfig(newConfig: AIConfig): void {
    if (this.currentSession) {
      this.currentSession.aiConfig = newConfig;
      this.notifyListeners();
    }
  }

  // Check if board should be flipped
  shouldFlipBoard(): boolean {
    return this.currentSession?.isBoardFlipped ?? false;
  }

  // Get user color for current session
  getUserColor(): PlayerColor | null {
    return this.currentSession?.userColor ?? null;
  }

  // Get AI color for current session
  getAIColor(): PlayerColor | null {
    return this.currentSession?.aiColor ?? null;
  }

  // Check if game is active (playing or paused)
  isGameActive(): boolean {
    return (
      this.currentSession?.status === "playing" ||
      this.currentSession?.status === "paused"
    );
  }

  // Check if game is in setup mode
  isInSetup(): boolean {
    return this.currentSession?.status === "setup";
  }

  // Reset session (for new game)
  resetSession(): void {
    this.currentSession = null;
    this.notifyListeners();
  }

  // Subscribe to session changes
  subscribe(listener: (session: GameSession | null) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners of session changes
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentSession));
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get game duration in milliseconds
  getGameDuration(): number {
    if (!this.currentSession) return 0;

    const endTime = this.currentSession.endTime ?? Date.now();
    return endTime - this.currentSession.startTime;
  }

  // Get formatted game duration
  getFormattedGameDuration(): string {
    const duration = this.getGameDuration();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

// Export singleton instance
export const gameSessionManager = new GameSessionManager();
