'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useChess } from '@/contexts/ChessContext';
import { GameMode } from '@/types/game-modes';
import { Square } from 'chess.js';

interface ModernAIOpponentProps {
  isEnabled: boolean;
  gameMode: GameMode;
  difficulty: 'easy' | 'medium' | 'hard';
  autoPlay: boolean;
}

export function ModernAIOpponent({ 
  isEnabled, 
  gameMode, 
  difficulty, 
  autoPlay 
}: ModernAIOpponentProps) {
  const { gameState, makeMove } = useChess();
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<string | null>(null);
  
  // ✅ Use ref to prevent duplicate processing and stale closures
  const isProcessingRef = useRef(false);
  const lastProcessedFenRef = useRef<string>('');

  const getDifficultySettings = useCallback(() => {
    switch (difficulty) {
      case 'easy': 
        return { maxDepth: 8, maxTimeMs: 500, skillLevel: 5 };
      case 'medium': 
        return { maxDepth: 12, maxTimeMs: 1000, skillLevel: 12 };
      case 'hard': 
        return { maxDepth: 16, maxTimeMs: 2000, skillLevel: 20 };
      default: 
        return { maxDepth: 12, maxTimeMs: 1000, skillLevel: 12 };
    }
  }, [difficulty]);

  // ✅ CRITICAL FIX: Proper AI move with initialization check
  const makeAIMove = useCallback(async () => {
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      console.log('🤖 [AI] Already processing, skipping...');
      return;
    }

    // Check if it's AI's turn (black to move)
    if (gameState.turn !== 'b' || gameState.isGameOver) {
      console.log('🤖 [AI] Not AI turn or game over');
      return;
    }

    // Check if already processed this position
    if (lastProcessedFenRef.current === gameState.fen) {
      console.log('🤖 [AI] Already processed this FEN');
      return;
    }

    console.log('🤖 [AI] Starting move calculation for:', gameState.fen);
    
    isProcessingRef.current = true;
    lastProcessedFenRef.current = gameState.fen;
    setIsThinking(true);

    try {
      const settings = getDifficultySettings();
      
      // ✅ Dynamic import for code splitting
      const { stockfishEngine } = await import('@/lib/stockfish-engine');

      // ✅ CRITICAL: Ensure engine is initialized
      if (!stockfishEngine.isReady()) {
        console.log('🤖 [AI] Engine not ready, initializing...');
        await stockfishEngine.initialize();
      }

      // ✅ Set skill level based on difficulty
      await stockfishEngine.setSkillLevel(settings.skillLevel);

      // ✅ Analyze position
      console.log('🤖 [AI] Analyzing at depth:', settings.maxDepth);
      const analysis = await stockfishEngine.analyzePosition(gameState.fen, {
        maxDepth: settings.maxDepth,
        maxTimeMs: settings.maxTimeMs,
        multiPV: 1,
      });

      if (!analysis.bestMove) {
        console.error('🤖 [AI] No best move found!');
        return;
      }

      console.log('🤖 [AI] Best move found:', analysis.bestMove);

      // ✅ Parse UCI move: "e2e4" or "e7e8q" (with promotion)
      const from = analysis.bestMove.slice(0, 2) as Square;
      const to = analysis.bestMove.slice(2, 4) as Square;
      const promotion = analysis.bestMove.length > 4 
        ? analysis.bestMove.slice(4, 5) 
        : undefined;

      // ✅ Execute the move
      const success = makeMove(from, to, promotion);

      if (success) {
        setLastMove(analysis.bestMove);
        console.log('✅ [AI] Move executed:', analysis.bestMove);
      } else {
        console.error('❌ [AI] Move failed:', from, to, promotion);
        // Reset processing on failure
        lastProcessedFenRef.current = '';
      }

    } catch (error) {
      console.error('❌ [AI] Error:', error);
      // Reset on error
      lastProcessedFenRef.current = '';
    } finally {
      setIsThinking(false);
      isProcessingRef.current = false;
    }
  }, [gameState.fen, gameState.turn, gameState.isGameOver, getDifficultySettings, makeMove]);

  // ✅ CRITICAL FIX: Trigger AI move on turn change
  useEffect(() => {
    // Only trigger in AI opponent modes
    if (!isEnabled || (gameMode !== 'ai_opponent' && gameMode !== 'ai_coaching')) {
      return;
    }

    // Check if it's AI's turn
    if (gameState.turn === 'b' && !gameState.isGameOver && !isThinking) {
      console.log('🎯 [AI] Turn changed, scheduling AI move...');
      
      // Small delay for smoother UX
      const timer = setTimeout(() => {
        makeAIMove();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.fen, gameState.isGameOver, isEnabled, gameMode, isThinking, makeAIMove]);

  // ✅ Reset processing ref on game reset
  useEffect(() => {
    if (gameState.fen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
      lastProcessedFenRef.current = '';
      isProcessingRef.current = false;
    }
  }, [gameState.fen]);

  if (!isEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isThinking && (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI thinking...
          </span>
        </div>
      )}
      {lastMove && !isThinking && (
        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
          AI played: {lastMove}
        </span>
      )}
    </div>
  );
}