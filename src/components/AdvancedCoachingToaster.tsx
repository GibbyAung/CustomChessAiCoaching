"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Brain,
  Eye,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap,
  Shield,
  Palette,
  Microscope,
  TrendingUp,
  Users,
  Settings,
  Star,
  Award,
  BookOpen,
} from "lucide-react";
import {
  advancedAICoaching,
  AdvancedCoachingAnalysis,
  CoachingPersonality,
} from "@/lib/advanced-ai-coaching";

interface AdvancedCoachingToasterProps {
  fen: string;
  lastMove?: string;
  isEnabled?: boolean;
  isHumanMove?: boolean;
  gameMode?: string;
  onClose?: () => void;
}

interface AdvancedCoachingMessage {
  id: string;
  type:
    | "tactical"
    | "positional"
    | "strategic"
    | "learning"
    | "personality"
    | "achievement";
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  timestamp: number;
  priority: "low" | "medium" | "high" | "critical";
  personality?: CoachingPersonality;
  analysis?: AdvancedCoachingAnalysis;
  interactive?: boolean;
}

export function AdvancedCoachingToaster({
  fen,
  lastMove,
  isEnabled = true,
  isHumanMove = true,
  gameMode = "practice",
  onClose,
}: AdvancedCoachingToasterProps) {
  const [messages, setMessages] = useState<AdvancedCoachingMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showToaster, setShowToaster] = useState(true);
  const [currentPersonality, setCurrentPersonality] = useState(
    advancedAICoaching.getCurrentPersonality()
  );
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false);
  const [playerProfile, setPlayerProfile] = useState(
    advancedAICoaching.getPlayerProfile()
  );
  const [lastAnalysisFen, setLastAnalysisFen] = useState<string>("");

  // Auto-dismiss low priority messages after 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => {
        const now = Date.now();
        return prev.filter((msg) => {
          if (msg.priority === "low" && now - msg.timestamp > 8000) {
            return false; // Remove low priority messages after 8 seconds
          }
          if (msg.priority === "medium" && now - msg.timestamp > 12000) {
            return false; // Remove medium priority messages after 12 seconds
          }
          return true; // Keep high and critical priority messages
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      isEnabled &&
      fen &&
      fen !== "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    ) {
      // Prevent duplicate analysis by checking if we're already analyzing
      if (isAnalyzing) return;

      // Only analyze if it's a human move or if we're in practice mode
      if (!isHumanMove && gameMode !== "practice") return;

      const timeoutId = setTimeout(() => {
        analyzePosition();
      }, 1000); // Increased delay to prevent rapid analysis

      return () => clearTimeout(timeoutId);
    }
  }, [fen, isEnabled, isAnalyzing, isHumanMove, gameMode]);

  // Reset analysis state when game mode changes
  useEffect(() => {
    setLastAnalysisFen("");
    setMessages([]);
  }, [gameMode]);

  const analyzePosition = async () => {
    if (!isEnabled || !fen || isAnalyzing) return;

    // In practice mode, analyze all moves. In other modes, only analyze human moves
    if (gameMode !== "practice" && !isHumanMove) return;

    // Prevent analyzing the same position multiple times
    if (fen === lastAnalysisFen) return;

    setIsAnalyzing(true);
    setLastAnalysisFen(fen);

    try {
      const analysis = await advancedAICoaching.analyzePosition(fen, lastMove);
      const personality = advancedAICoaching.getCurrentPersonality();

      // Generate multiple coaching messages based on advanced analysis
      const newMessages: AdvancedCoachingMessage[] = [];

      // 1. Move Quality Assessment
      if (analysis.moveQuality) {
        newMessages.push({
          id: `move-quality-${Date.now()}`,
          type: "tactical",
          title: "Move Assessment",
          content: getMoveQualityMessage(analysis.moveQuality, personality),
          icon: getMoveQualityIcon(analysis.moveQuality),
          color: getMoveQualityColor(analysis.moveQuality),
          bgColor: getMoveQualityBgColor(analysis.moveQuality),
          borderColor: getMoveQualityBorderColor(analysis.moveQuality),
          timestamp: Date.now(),
          priority: getMoveQualityPriority(analysis.moveQuality),
          personality,
          analysis,
        });
      }

      // 2. Tactical Insights
      if (
        analysis.tacticalInsights &&
        (analysis.tacticalInsights.tactics.length > 0 ||
          analysis.tacticalInsights.opportunities.length > 0)
      ) {
        newMessages.push({
          id: `tactical-${Date.now()}`,
          type: "tactical",
          title: "Tactical Insights",
          content: generateTacticalMessage(
            analysis.tacticalInsights,
            personality
          ),
          icon: <Zap className="w-4 h-4" />,
          color: "text-yellow-300",
          bgColor: "bg-yellow-900/20",
          borderColor: "border-yellow-500/30",
          timestamp: Date.now(),
          priority: "high",
          personality,
          analysis,
        });
      }

      // 3. Positional Insights
      if (analysis.positionalInsights) {
        newMessages.push({
          id: `positional-${Date.now()}`,
          type: "positional",
          title: "Positional Analysis",
          content: generatePositionalMessage(
            analysis.positionalInsights,
            personality
          ),
          icon: <Brain className="w-4 h-4" />,
          color: "text-blue-300",
          bgColor: "bg-blue-900/20",
          borderColor: "border-blue-500/30",
          timestamp: Date.now(),
          priority: "medium",
          personality,
          analysis,
        });
      }

      // 4. Strategic Plan
      if (
        analysis.strategicPlan &&
        analysis.strategicPlan.shortTerm.length > 0
      ) {
        newMessages.push({
          id: `strategic-${Date.now()}`,
          type: "strategic",
          title: "Strategic Plan",
          content: generateStrategicMessage(
            analysis.strategicPlan,
            personality
          ),
          icon: <Target className="w-4 h-4" />,
          color: "text-purple-300",
          bgColor: "bg-purple-900/20",
          borderColor: "border-purple-500/30",
          timestamp: Date.now(),
          priority: "medium",
          personality,
          analysis,
        });
      }

      // 5. Learning Points
      if (analysis.learningPoints && analysis.learningPoints.length > 0) {
        newMessages.push({
          id: `learning-${Date.now()}`,
          type: "learning",
          title: "Learning Points",
          content: generateLearningMessage(
            analysis.learningPoints,
            personality
          ),
          icon: <BookOpen className="w-4 h-4" />,
          color: "text-green-300",
          bgColor: "bg-green-900/20",
          borderColor: "border-green-500/30",
          timestamp: Date.now(),
          priority: "low",
          personality,
          analysis,
        });
      }

      // 6. Personalized Advice
      if (analysis.personalizedAdvice) {
        newMessages.push({
          id: `advice-${Date.now()}`,
          type: "personality",
          title: `${personality.name} Says`,
          content: analysis.personalizedAdvice,
          icon: getPersonalityIcon(personality),
          color: getPersonalityColor(personality),
          bgColor: getPersonalityBgColor(personality),
          borderColor: getPersonalityBorderColor(personality),
          timestamp: Date.now(),
          priority: "high",
          personality,
          analysis,
        });
      }

      // 7. Next Move Suggestions
      if (
        analysis.nextMoveSuggestions &&
        analysis.nextMoveSuggestions.length > 0
      ) {
        newMessages.push({
          id: `suggestions-${Date.now()}`,
          type: "strategic",
          title: "Next Move Ideas",
          content: generateSuggestionsMessage(
            analysis.nextMoveSuggestions,
            personality
          ),
          icon: <Lightbulb className="w-4 h-4" />,
          color: "text-orange-300",
          bgColor: "bg-orange-900/20",
          borderColor: "border-orange-500/30",
          timestamp: Date.now(),
          priority: "medium",
          personality,
          analysis,
          interactive: true,
        });
      }

      // Add new messages with smart filtering and deduplication
      setMessages((prev) => {
        const now = Date.now();
        // Filter out messages that are less than 5 seconds old to prevent rapid replacement
        const filteredPrev = prev.filter((msg) => now - msg.timestamp > 5000);

        // Deduplicate messages by type and content
        const deduplicatedNew = newMessages.filter((newMsg) => {
          return !filteredPrev.some(
            (existingMsg) =>
              existingMsg.type === newMsg.type &&
              existingMsg.content === newMsg.content &&
              now - existingMsg.timestamp < 10000 // Within 10 seconds
          );
        });

        const combined = [...deduplicatedNew, ...filteredPrev];
        return combined
          .sort(
            (a, b) =>
              getPriorityOrder(b.priority) - getPriorityOrder(a.priority)
          )
          .slice(0, 3); // Reduced to 3 to prevent overcrowding
      });

      // Update player profile
      setPlayerProfile(advancedAICoaching.getPlayerProfile());
    } catch (error) {
      console.error("Advanced coaching analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const clearAllMessages = () => {
    setMessages([]);
  };

  const switchPersonality = (personalityId: string) => {
    const newPersonality = advancedAICoaching.switchPersonality(personalityId);
    setCurrentPersonality(newPersonality);
    setShowPersonalitySelector(false);
  };

  const getPriorityOrder = (priority: string) => {
    switch (priority) {
      case "critical":
        return 4;
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  };

  if (!isEnabled || !showToaster) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: index * 0.1,
            }}
            className={`
              relative backdrop-blur-xl bg-white/10 border rounded-2xl p-4 shadow-2xl
              ${message.bgColor} ${message.borderColor} border
              hover:bg-white/15 transition-all duration-300
              group cursor-pointer
            `}
            onClick={() => removeMessage(message.id)}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeMessage(message.id);
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-4 h-4 text-white/60 hover:text-white" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-lg ${message.bgColor} ${message.borderColor} border`}
              >
                {message.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${message.color}`}>
                  {message.title}
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      message.priority === "critical"
                        ? "bg-red-400"
                        : message.priority === "high"
                        ? "bg-orange-400"
                        : message.priority === "medium"
                        ? "bg-yellow-400"
                        : "bg-green-400"
                    }`}
                  />
                  <span className="text-xs text-white/60">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {message.personality && (
                    <span className="text-xs text-white/50">
                      {message.personality.emoji} {message.personality.name}
                    </span>
                  )}
                  {message.priority === "critical" && (
                    <span className="text-xs text-red-400 font-medium">
                      URGENT
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="text-white/90 text-sm leading-relaxed">
              {message.content}
            </p>

            {/* Interactive elements */}
            {message.interactive && message.analysis && (
              <div className="mt-3 space-y-2">
                {message.analysis.alternativeMoves
                  .slice(0, 2)
                  .map((alt, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 rounded-lg p-2 text-xs"
                    >
                      <div className="font-medium text-white/80">
                        {alt.move}
                      </div>
                      <div className="text-white/60">{alt.explanation}</div>
                    </div>
                  ))}
              </div>
            )}

            {/* Glow effect */}
            <div
              className={`absolute inset-0 rounded-2xl ${message.bgColor} opacity-20 blur-xl -z-10`}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Analysis indicator */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-3 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white/80 text-sm">
              {currentPersonality.emoji} {currentPersonality.name} is analyzing
              position...
            </span>
          </div>
        </motion.div>
      )}

      {/* Personality Selector */}
      {showPersonalitySelector && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl relative z-60"
        >
          <h3 className="text-white font-semibold mb-3">Choose Your Coach</h3>
          <div className="grid grid-cols-2 gap-2">
            {advancedAICoaching.getPersonalities().map((personality) => (
              <button
                key={personality.id}
                onClick={() => switchPersonality(personality.id)}
                className={`p-2 rounded-lg text-xs transition-all ${
                  currentPersonality.id === personality.id
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                <div className="font-medium">
                  {personality.emoji} {personality.name}
                </div>
                <div className="text-white/50">{personality.style}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Control Panel */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => setShowPersonalitySelector(!showPersonalitySelector)}
          className="w-12 h-12 backdrop-blur-xl bg-white/10 border border-white/20 rounded-full shadow-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Change Coach"
        >
          <Users className="w-6 h-6 text-white" />
        </motion.button>

        {messages.length > 0 && (
          <motion.button
            onClick={clearAllMessages}
            className="w-12 h-12 backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-full shadow-2xl flex items-center justify-center hover:bg-red-500/30 transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Clear All Messages"
          >
            <X className="w-6 h-6 text-red-300" />
          </motion.button>
        )}

        <motion.button
          onClick={() => setShowToaster(!showToaster)}
          className="w-12 h-12 backdrop-blur-xl bg-white/10 border border-white/20 rounded-full shadow-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={showToaster ? "Hide Coaching" : "Show Coaching"}
        >
          <Brain className="w-6 h-6 text-white" />
        </motion.button>
      </div>
    </div>
  );
}

// Helper functions for message generation
function getMoveQualityMessage(
  quality: string,
  personality: CoachingPersonality
): string {
  const messages = {
    brilliant: `${personality.emoji} Brilliant move! ${personality.catchphrases[0]}`,
    excellent: `${personality.emoji} Excellent move! You're playing like a master!`,
    good: `${personality.emoji} Good move! Keep up the solid play.`,
    inaccurate: `${personality.emoji} Not the best move, but not terrible. Consider alternatives.`,
    mistake: `${personality.emoji} That's a mistake. Let's learn from this!`,
    blunder: `${personality.emoji} That's a blunder! Don't worry, we all make them.`,
  };
  return messages[quality as keyof typeof messages] || "Move analyzed.";
}

function getMoveQualityIcon(quality: string): React.ReactNode {
  switch (quality) {
    case "brilliant":
      return <Award className="w-4 h-4" />;
    case "excellent":
      return <Star className="w-4 h-4" />;
    case "good":
      return <Target className="w-4 h-4" />;
    case "inaccurate":
      return <AlertTriangle className="w-4 h-4" />;
    case "mistake":
      return <AlertTriangle className="w-4 h-4" />;
    case "blunder":
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Target className="w-4 h-4" />;
  }
}

function getMoveQualityColor(quality: string): string {
  switch (quality) {
    case "brilliant":
      return "text-yellow-300";
    case "excellent":
      return "text-green-300";
    case "good":
      return "text-blue-300";
    case "inaccurate":
      return "text-orange-300";
    case "mistake":
      return "text-red-300";
    case "blunder":
      return "text-red-400";
    default:
      return "text-white-300";
  }
}

function getMoveQualityBgColor(quality: string): string {
  switch (quality) {
    case "brilliant":
      return "bg-yellow-900/20";
    case "excellent":
      return "bg-green-900/20";
    case "good":
      return "bg-blue-900/20";
    case "inaccurate":
      return "bg-orange-900/20";
    case "mistake":
      return "bg-red-900/20";
    case "blunder":
      return "bg-red-900/30";
    default:
      return "bg-white-900/20";
  }
}

function getMoveQualityBorderColor(quality: string): string {
  switch (quality) {
    case "brilliant":
      return "border-yellow-500/30";
    case "excellent":
      return "border-green-500/30";
    case "good":
      return "border-blue-500/30";
    case "inaccurate":
      return "border-orange-500/30";
    case "mistake":
      return "border-red-500/30";
    case "blunder":
      return "border-red-500/40";
    default:
      return "border-white-500/30";
  }
}

function getMoveQualityPriority(
  quality: string
): "low" | "medium" | "high" | "critical" {
  switch (quality) {
    case "brilliant":
      return "high";
    case "excellent":
      return "medium";
    case "good":
      return "low";
    case "inaccurate":
      return "medium";
    case "mistake":
      return "high";
    case "blunder":
      return "critical";
    default:
      return "medium";
  }
}

function generateTacticalMessage(
  insights: any,
  personality: CoachingPersonality
): string {
  const tactics = insights.tactics.slice(0, 2);
  const opportunities = insights.opportunities.slice(0, 2);

  let message = `${personality.emoji} `;
  if (tactics.length > 0) {
    message += `Tactical patterns: ${tactics.join(", ")}. `;
  }
  if (opportunities.length > 0) {
    message += `Opportunities: ${opportunities.join(", ")}.`;
  }

  return message || `${personality.emoji} Look for tactical opportunities!`;
}

function generatePositionalMessage(
  insights: any,
  personality: CoachingPersonality
): string {
  const aspects = [
    insights.pawnStructure,
    insights.pieceActivity,
    insights.kingSafety,
  ].filter(Boolean);

  return `${personality.emoji} Positional factors: ${aspects.join("; ")}.`;
}

function generateStrategicMessage(
  plan: any,
  personality: CoachingPersonality
): string {
  const shortTerm = plan.shortTerm.slice(0, 2);
  return `${personality.emoji} Short-term plan: ${shortTerm.join(", ")}.`;
}

function generateLearningMessage(
  points: string[],
  personality: CoachingPersonality
): string {
  const topPoints = points.slice(0, 2);
  return `${personality.emoji} Key learning: ${topPoints.join("; ")}.`;
}

function generateSuggestionsMessage(
  suggestions: string[],
  personality: CoachingPersonality
): string {
  const topSuggestions = suggestions.slice(0, 2);
  return `${personality.emoji} Suggestions: ${topSuggestions.join("; ")}.`;
}

function getPersonalityIcon(personality: CoachingPersonality): React.ReactNode {
  switch (personality.style) {
    case "tactical":
      return <Zap className="w-4 h-4" />;
    case "positional":
      return <Brain className="w-4 h-4" />;
    case "aggressive":
      return <Zap className="w-4 h-4" />;
    case "defensive":
      return <Shield className="w-4 h-4" />;
    case "creative":
      return <Palette className="w-4 h-4" />;
    case "analytical":
      return <Microscope className="w-4 h-4" />;
    default:
      return <Brain className="w-4 h-4" />;
  }
}

function getPersonalityColor(personality: CoachingPersonality): string {
  switch (personality.style) {
    case "tactical":
      return "text-yellow-300";
    case "positional":
      return "text-blue-300";
    case "aggressive":
      return "text-red-300";
    case "defensive":
      return "text-green-300";
    case "creative":
      return "text-purple-300";
    case "analytical":
      return "text-cyan-300";
    default:
      return "text-white-300";
  }
}

function getPersonalityBgColor(personality: CoachingPersonality): string {
  switch (personality.style) {
    case "tactical":
      return "bg-yellow-900/20";
    case "positional":
      return "bg-blue-900/20";
    case "aggressive":
      return "bg-red-900/20";
    case "defensive":
      return "bg-green-900/20";
    case "creative":
      return "bg-purple-900/20";
    case "analytical":
      return "bg-cyan-900/20";
    default:
      return "bg-white-900/20";
  }
}

function getPersonalityBorderColor(personality: CoachingPersonality): string {
  switch (personality.style) {
    case "tactical":
      return "border-yellow-500/30";
    case "positional":
      return "border-blue-500/30";
    case "aggressive":
      return "border-red-500/30";
    case "defensive":
      return "border-green-500/30";
    case "creative":
      return "border-purple-500/30";
    case "analytical":
      return "border-cyan-500/30";
    default:
      return "border-white-500/30";
  }
}
