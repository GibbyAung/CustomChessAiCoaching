// Position Complexity Analysis
// Based on ChessKit patterns adapted for enhanced coaching

export interface ComplexityFactors {
  materialComplexity: number; // 0-100, based on material imbalance
  tacticalComplexity: number; // 0-100, based on tactical possibilities  
  positionalComplexity: number; // 0-100, based on piece placement
  endgameComplexity: number; // 0-100, based on endgame patterns
  overallComplexity: number; // 0-100, weighted average
  phase: 'opening' | 'middlegame' | 'endgame';
  recommendations: string[];
}

export class PositionAnalyzer {
  
  // Analyze position complexity from FEN
  static analyzeComplexity(fen: string): ComplexityFactors {
    const board = this.parseFEN(fen);
    const factors = this.calculateFactors(board);
    const phase = this.getGamePhase(board);
    
    return {
      ...factors,
      phase,
      overallComplexity: this.calculateOverallComplexity(factors),
      recommendations: this.generateRecommendations(factors)
    };
  }

  // Parse FEN into board representation
  private static parseFEN(fen: string): any {
    const parts = fen.split(' ');
    const boardPart = parts[0];
    
    // Convert board to piece array
    const rows = boardPart.split('/');
    const board: string[][] = [];
    
    for (let row = 0; row < 8; row++) {
      const rowPieces: string[] = [];
      let col = 0;
      
      for (const char of rows[row]) {
        if (char >= '1' && char <= '8') {
          // Empty squares
          const emptySquares = parseInt(char);
          for (let i = 0; i < emptySquares; i++) {
            rowPieces.push('');
            col++;
          }
        } else {
          // Piece
          rowPieces.push(char);
          col++;
        }
      }
      
      board.push(rowPieces);
    }
    
    return {
      board,
      turn: parts[1] as 'w' | 'b',
      castling: parts[2],
      enPassant: parts[3],
      halfmove: parseInt(parts[4]) || 0,
      fullmove: parseInt(parts[5]) || 1
    };
  }

  // Calculate individual complexity factors
  private static calculateFactors(board: any): Omit<ComplexityFactors, 'overallComplexity' | 'recommendations' | 'phase'> {
    const materialComplexity = this.calculateMaterialComplexity(board.board);
    const tacticalComplexity = this.calculateTacticalComplexity(board.board);
    const positionalComplexity = this.calculatePositionalComplexity(board.board, board.turn);
    const endgameComplexity = this.calculateEndgameComplexity(board.board);
    
    return {
      materialComplexity,
      tacticalComplexity,
      positionalComplexity,
      endgameComplexity
    };
  }

  // Material complexity based on imbalance
  private static calculateMaterialComplexity(board: string[][]): number {
    const pieceValues = { 
      'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0,
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
    };
    
    let whiteMaterial = 0;
    let blackMaterial = 0;
    
    for (const row of board) {
      for (const piece of row) {
        if (!piece) continue;
        
        const isWhite = piece === piece.toUpperCase();
        const value = pieceValues[piece as keyof typeof pieceValues];
        
        if (isWhite) {
          whiteMaterial += value;
        } else {
          blackMaterial += value;
        }
      }
    }
    
    const materialDifference = Math.abs(whiteMaterial - blackMaterial);
    const totalMaterial = whiteMaterial + blackMaterial;
    
    // Complexity increases with material imbalance and total material
    const imbalanceFactor = Math.min(materialDifference / 30, 1) * 30;
    const materialFactor = Math.min(totalMaterial / 78, 1) * 40; // Max material is 78
    
    return Math.round(imbalanceFactor + materialFactor);
  }

  // Tactical complexity based on available captures, checks, forks
  private static calculateTacticalComplexity(board: string[][]): number {
    let tacticalScore = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;
        
        const isWhite = piece === piece.toUpperCase();
        
        // Check for potential captures (opponent pieces nearby)
        const captures = this.countPotentialCaptures(board, row, col, isWhite);
        tacticalScore += captures * 5;
        
        // Check for checks (king proximity with attacking pieces)
        if (this.isAttackingKing(board, row, col, isWhite)) {
          tacticalScore += 8;
        }
        
        // Check for forks (pieces attacking multiple important targets)
        const forks = this.countForks(board, row, col, isWhite);
        tacticalScore += forks * 10;
        
        // Check for pins (piece pinned to king)
        if (this.isPinned(board, row, col, isWhite)) {
          tacticalScore += 6;
        }
      }
    }
    
    return Math.min(Math.round(tacticalScore), 100);
  }

  // Positional complexity based on piece placement
  private static calculatePositionalComplexity(board: string[][], turn: 'w' | 'b'): number {
    let positionalScore = 0;
    
    // Center control
    const centerControl = this.calculateCenterControl(board, turn);
    positionalScore += centerControl * 15;
    
    // Piece coordination
    const coordination = this.calculatePieceCoordination(board, turn);
    positionalScore += coordination * 20;
    
    // King safety
    const kingSafety = this.calculateKingSafety(board, turn);
    positionalScore += (100 - kingSafety) * 25; // Lower safety = higher complexity
    
    // Pawn structure
    const pawnStructure = this.calculatePawnStructureComplexity(board, turn);
    positionalScore += pawnStructure * 20;
    
    return Math.min(Math.round(positionalScore), 100);
  }

  // Endgame complexity
  private static calculateEndgameComplexity(board: string[][]): number {
    let pieceCount = 0;
    let hasMajorPieces = false;
    
    for (const row of board) {
      for (const piece of row) {
        if (!piece) continue;
        pieceCount++;
        if (['Q', 'q', 'R', 'r'].includes(piece)) {
          hasMajorPieces = true;
        }
      }
    }
    
    // Endgames are more complex with fewer pieces and no majors
    if (pieceCount <= 10 && !hasMajorPieces) {
      return 85; // High complexity for precise endgames
    } else if (pieceCount <= 15) {
      return 60; // Medium complexity
    } else {
      return 25; // Lower complexity for middlegames
    }
  }

  // Calculate overall complexity as weighted average
  private static calculateOverallComplexity(factors: Omit<ComplexityFactors, 'overallComplexity' | 'recommendations' | 'phase'>): number {
    // Weight factors based on chess theory importance
    const weights = {
      materialComplexity: 0.25,
      tacticalComplexity: 0.35,
      positionalComplexity: 0.30,
      endgameComplexity: 0.10
    };
    
    let totalScore = 0;
    for (const [factor, value] of Object.entries(factors)) {
      totalScore += value * weights[factor as keyof typeof weights];
    }
    
    return Math.min(Math.round(totalScore), 100);
  }

  // Determine game phase
  private static getGamePhase(board: any): 'opening' | 'middlegame' | 'endgame' {
    const pieceCount = this.countPieces(board.board);
    
    if (pieceCount > 28) return 'opening';
    if (pieceCount > 15) return 'middlegame';
    return 'endgame';
  }

  // Generate coaching recommendations based on complexity
  private static generateRecommendations(factors: Omit<ComplexityFactors, 'overallComplexity' | 'recommendations' | 'phase'>): string[] {
    const recommendations: string[] = [];
    
    if (factors.tacticalComplexity > 70) {
      recommendations.push("High tactical complexity - look for captures, forks, and pins");
    }
    
    if (factors.positionalComplexity > 70) {
      recommendations.push("Complex position - focus on piece coordination and center control");
    }
    
    if (factors.materialComplexity > 60) {
      recommendations.push("Material imbalance - consider simplification or exchange");
    }
    
    if (factors.endgameComplexity > 60) {
      recommendations.push("Endgame position - prioritize king activity and pawn promotion");
    }
    
    if (factors.materialComplexity < 30 && factors.tacticalComplexity < 40) {
      recommendations.push("Simple position - consider tactical shots to create complications");
    }
    
    return recommendations;
  }

  // Helper methods
  private static countPieces(board: string[][]): number {
    let count = 0;
    for (const row of board) {
      for (const piece of row) {
        if (piece) count++;
      }
    }
    return count;
  }

  private static isSameColor(piece: string, turn: 'w' | 'b'): boolean {
    const isWhitePiece = piece === piece.toUpperCase();
    return (turn === 'w' && isWhitePiece) || (turn === 'b' && !isWhitePiece);
  }

  private static isOpponent(piece: string, isWhite: boolean): boolean {
    const isWhitePiece = piece === piece.toUpperCase();
    return (isWhite && !isWhitePiece) || (!isWhite && isWhitePiece);
  }

  private static getPieceValue(piece: string): number {
    const values: { [key: string]: number } = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0,
      'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0
    };
    return values[piece] || 0;
  }

  private static getPieceMoves(piece: string, row: number, col: number, board: string[][]): [number, number][] {
    // This would need full chess move generation logic
    // For now, return empty array as placeholder
    return [];
  }

  private static countPotentialCaptures(board: string[][], row: number, col: number, isWhite: boolean): number {
    // Simplified capture counting
    const piece = board[row][col];
    const pieceType = piece.toLowerCase();
    const moves = this.getPieceMoves(pieceType, row, col, board);
    
    let captures = 0;
    for (const [toRow, toCol] of moves) {
      const targetPiece = board[toRow][toCol];
      if (targetPiece && this.isOpponent(targetPiece, isWhite)) {
        captures++;
      }
    }
    
    return captures;
  }

  private static isAttackingKing(board: string[][], row: number, col: number, isWhite: boolean): boolean {
    // Simplified king attack detection
    const moves = this.getPieceMoves(board[row][col].toLowerCase(), row, col, board);
    
    for (const [toRow, toCol] of moves) {
      const targetPiece = board[toRow][toCol];
      if (targetPiece && targetPiece.toLowerCase() === 'k' && 
          this.isOpponent(targetPiece, isWhite)) {
        return true;
      }
    }
    
    return false;
  }

  private static countForks(board: string[][], row: number, col: number, isWhite: boolean): number {
    // Simplified fork detection - knight and bishop fork patterns
    const piece = board[row][col].toLowerCase();
    const moves = this.getPieceMoves(piece, row, col, board);
    
    let forkCount = 0;
    
    // Check for knight forks
    if (piece === 'n' || piece === 'N') {
      let attackingPieces = 0;
      for (const [toRow, toCol] of moves) {
        const targetPiece = board[toRow][toCol];
        if (targetPiece && this.isOpponent(targetPiece, isWhite)) {
          const pieceValue = this.getPieceValue(targetPiece);
          if (pieceValue >= 3) { // Only count valuable targets
            attackingPieces++;
          }
        }
      }
      if (attackingPieces >= 2) forkCount++;
    }
    
    return forkCount;
  }

  private static isPinned(board: string[][], row: number, col: number, isWhite: boolean): boolean {
    // Simplified pin detection
    const piece = board[row][col];
    if (!piece || !['r', 'R', 'b', 'B', 'q', 'Q'].includes(piece)) return false;
    
    // This would need more sophisticated king alignment detection
    // For now, return false as placeholder
    return false;
  }

  private static calculateCenterControl(board: string[][], turn: 'w' | 'b'): number {
    const centerSquares = [[3,3], [3,4], [4,3], [4,4]]; // d4, e4, d5, e5
    let controlScore = 0;
    
    for (const [row, col] of centerSquares) {
      const piece = board[row][col];
      if (piece && this.isSameColor(piece, turn)) {
        controlScore++;
      }
    }
    
    return (controlScore / 4) * 100; // Percentage of center controlled
  }

  private static calculatePieceCoordination(board: string[][], turn: 'w' | 'b'): number {
    // Simplified coordination based on piece proximity
    let coordinationScore = 0;
    let pieces = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && this.isSameColor(piece, turn)) {
          pieces++;
          // Check for nearby friendly pieces
          const nearbyPieces = this.countNearbyPieces(board, row, col, turn);
          coordinationScore += nearbyPieces;
        }
      }
    }
    
    return pieces > 0 ? (coordinationScore / pieces) * 20 : 0;
  }

  private static calculateKingSafety(board: string[][], turn: 'w' | 'b'): number {
    // Find king position
    let kingPos = { row: -1, col: -1 };
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.toLowerCase() === 'k' && this.isSameColor(piece, turn)) {
          kingPos = { row, col };
          break;
        }
      }
      if (kingPos.row !== -1) break;
    }
    
    if (kingPos.row === -1) return 50; // Default safety
    
    // Count defenders around king
    let defenders = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = kingPos.row + dr;
        const nc = kingPos.col + dc;
        
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const piece = board[nr][nc];
          if (piece && this.isSameColor(piece, turn)) {
            defenders++;
          }
        }
      }
    }
    
    return Math.min(defenders * 20, 100);
  }

  private static calculatePawnStructureComplexity(board: string[][], turn: 'w' | 'b'): number {
    // Simplified pawn structure analysis
    let doubledPawns = 0;
    let isolatedPawns = 0;
    let passedPawns = 0;
    let totalPawns = 0;
    
    const pawnFile = new Array(8).fill(false);
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;
        
        const pieceType = piece.toLowerCase();
        if (pieceType !== 'p') continue;
        
        const isWhitePawn = piece === 'P';
        const isCorrectColor = (turn === 'w' && isWhitePawn) || (turn === 'b' && !isWhitePawn);
        
        if (!isCorrectColor) continue;
        
        totalPawns++;
        pawnFile[col] = true;
        
        // Check for doubled pawns
        for (let checkRow = 0; checkRow < 8; checkRow++) {
          if (checkRow !== row) {
            const checkPiece = board[checkRow][col];
            if (checkPiece && checkPiece.toLowerCase() === 'p' && 
                ((turn === 'w' && checkPiece === 'P') || (turn === 'b' && checkPiece === 'p'))) {
              doubledPawns++;
              break;
            }
          }
        }
        
        // Check for passed pawn
        let hasBlocker = false;
        const direction = isWhitePawn ? 1 : -1;
        for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
          for (let r = row + direction; r >= 0 && r < 8; r += direction) {
            const checkPiece = board[r][c];
            if (checkPiece && checkPiece.toLowerCase() === 'p') {
              hasBlocker = true;
              break;
            }
          }
        }
        
        if (!hasBlocker) passedPawns++;
      }
    }
    
    // Check for isolated pawns
    for (let col = 0; col < 8; col++) {
      if (pawnFile[col]) {
        const hasLeftSupport = col > 0 && pawnFile[col - 1];
        const hasRightSupport = col < 7 && pawnFile[col + 1];
        if (!hasLeftSupport && !hasRightSupport) {
          isolatedPawns++;
        }
      }
    }
    
    // Calculate complexity score (lower is better structure)
    const complexityScore = (doubledPawns * 10 + isolatedPawns * 15) / Math.max(totalPawns, 1);
    return Math.min(complexityScore, 100);
  }

  private static countNearbyPieces(board: string[][], row: number, col: number, turn: 'w' | 'b'): number {
    let nearby = 0;
    
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const piece = board[nr][nc];
          if (piece && this.isSameColor(piece, turn)) {
            nearby++;
          }
        }
      }
    }
    
    return nearby;
  }
}