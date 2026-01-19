// PGN (Portable Game Notation) utilities
// Based on ChessKit patterns adapted for TypeScript

export interface PGNGame {
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  white?: string;
  black?: string;
  result?: string;
  moves: string[];
  fen?: string; // Starting position FEN
}

export interface PGNHeader {
  key: string;
  value: string;
}

export class PGNManager {
  // Parse PGN string into array of games
  static parsePGN(pgnText: string): PGNGame[] {
    const games: PGNGame[] = [];
    const gameTexts = pgnText.split(/\n\s*\n/).filter(text => text.trim());
    
    for (const gameText of gameTexts) {
      const game = this.parseSingleGame(gameText);
      if (game) {
        games.push(game);
      }
    }
    
    return games;
  }

  // Parse a single PGN game
  private static parseSingleGame(gameText: string): PGNGame | null {
    const lines = gameText.split('\n');
    const headers: PGNHeader[] = [];
    const moveLines: string[] = [];
    let inMoveSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed) continue;
      
      // Header lines
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const headerMatch = trimmed.match(/^\[(\w+)\s+"([^"]*)"\]$/);
        if (headerMatch) {
          headers.push({
            key: headerMatch[1],
            value: headerMatch[2]
          });
        }
        continue;
      }
      
      // Moves start after headers
      inMoveSection = true;
      
      // Skip result and comments
      if (trimmed.startsWith('1-0') || trimmed.startsWith('0-1') || 
          trimmed.startsWith('1/2-1/2') || trimmed.startsWith('{')) {
        continue;
      }
      
      if (inMoveSection) {
        moveLines.push(trimmed);
      }
    }
    
    // Convert headers to object
    const game: PGNGame = {
      moves: []
    };
    
    for (const header of headers) {
      switch (header.key.toLowerCase()) {
        case 'event':
          game.event = header.value;
          break;
        case 'site':
          game.site = header.value;
          break;
        case 'date':
          game.date = header.value;
          break;
        case 'round':
          game.round = header.value;
          break;
        case 'white':
          game.white = header.value;
          break;
        case 'black':
          game.black = header.value;
          break;
        case 'result':
          game.result = header.value;
          break;
        case 'fen':
          game.fen = header.value;
          break;
      }
    }
    
    // Parse moves
    const moveText = moveLines.join(' ');
    game.moves = this.parseMoveText(moveText);
    
    return game.moves.length > 0 ? game : null;
  }

  // Parse move text into individual moves
  private static parseMoveText(moveText: string): string[] {
    // Remove move numbers and annotations
    const cleanText = moveText
      .replace(/\d+\./g, '') // Remove move numbers
      .replace(/\{[^}]*\}/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (!cleanText) return [];
    
    // Split moves (handles both space-separated and line break separated)
    return cleanText.split(/\s+/).filter(move => move.length > 0);
  }

  // Export games to PGN format
  static exportToPGN(games: PGNGame[]): string {
    const pgnGames: string[] = [];
    
    for (const game of games) {
      pgnGames.push(this.exportSingleGame(game));
    }
    
    return pgnGames.join('\n\n');
  }

  // Export a single game to PGN
  private static exportSingleGame(game: PGNGame): string {
    const headers: string[] = [];
    
    // Standard headers
    if (game.event) headers.push(`[Event "${game.event}"]`);
    else headers.push('[Event "?"]');
    
    if (game.site) headers.push(`[Site "${game.site}"]`);
    else headers.push('[Site "?"]');
    
    if (game.date) headers.push(`[Date "${game.date}"]`);
    else headers.push(`[Date "${new Date().toISOString().split('T')[0]}"]`);
    
    if (game.round) headers.push(`[Round "${game.round}"]`);
    else headers.push('[Round "?"]');
    
    if (game.white) headers.push(`[White "${game.white}"]`);
    else headers.push('[White "?"]');
    
    if (game.black) headers.push(`[Black "${game.black}"]`);
    else headers.push('[Black "?"]');
    
    if (game.result) headers.push(`[Result "${game.result}"]`);
    else headers.push('[Result "*"]');
    
    if (game.fen) headers.push(`[FEN "${game.fen}"]`);
    
    // Build PGN
    let pgn = headers.join('\n') + '\n\n';
    
    // Add moves in formatted lines
    const moves = game.moves || [];
    for (let i = 0; i < moves.length; i++) {
      const moveNum = Math.floor(i / 2) + 1;
      const isWhiteMove = i % 2 === 0;
      
      if (isWhiteMove) {
        pgn += `${moveNum}.`;
      }
      
      pgn += ` ${moves[i]}`;
      
      // Line break every 6 moves for readability
      if ((i + 1) % 6 === 0) {
        pgn += '\n';
      }
    }
    
    if (game.result) {
      pgn += ` ${game.result}`;
    }
    
    return pgn;
  }

  // Convert current game state to PGN
  static gameToPGN(
    moves: string[],
    white: string = "White",
    black: string = "Black",
    result: string = "*",
    startingFen?: string
  ): string {
    const game: PGNGame = {
      event: "Analysis Game",
      site: "Custom Chess Engine",
      white,
      black,
      result,
      moves,
      fen: startingFen
    };
    
    return this.exportSingleGame(game);
  }

  // Import PGN from file
  static async importFromFile(file: File): Promise<PGNGame[]> {
    const text = await file.text();
    return this.parsePGN(text);
  }

  // Export PGN to file download
  static exportToFile(games: PGNGame[], filename: string = "games.pgn"): void {
    const pgn = this.exportToPGN(games);
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Get PGN from clipboard
  static async importFromClipboard(): Promise<PGNGame[]> {
    try {
      const text = await navigator.clipboard.readText();
      return this.parsePGN(text);
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      return [];
    }
  }

  // Copy PGN to clipboard
  static copyToClipboard(games: PGNGame[]): Promise<void> {
    const pgn = this.exportToPGN(games);
    return navigator.clipboard.writeText(pgn);
  }
}