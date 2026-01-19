// Human-like coaching messages and feedback
export const HumanCoachingMessages = {
  brilliant: [
    "🎉 Brilliant! That move was absolutely fantastic!",
    "🌟 Wow! That was a stroke of genius!",
    "⭐ Incredible tactical vision! You're playing like a grandmaster!",
    "🎯 Perfect! That move completely changes the game!"
  ],

  excellent: [
    "💎 Excellent! Very strong and well-calculated.",
    "🎯 Great move! You're seeing the position clearly.",
    "👍 Well played! That puts pressure on your opponent.",
    "💡 Smart choice! You're thinking several moves ahead."
  ],

  good: [
    "👍 Good move! Solid and practical.",
    "✨ Nice! You're developing your pieces well.",
    "🎯 Good thinking! You're keeping your options open.",
    "👍 Solid play! You're building a good position."
  ],

  inaccuracy: [
    "🤔 Hmm, there might be a better move here...",
    "⚠️ This move might leave you in a slightly worse position.",
    "💭 Consider if there's a stronger option available.",
    "🤔 Think about whether this is the most accurate continuation."
  ],

  mistake: [
    "⚠️ This move could put you in a tough spot.",
    "😟 Be careful! This might give your opponent an advantage.",
    "💭 Let's think about this - is there a safer choice?",
    "⚠️ This might be letting your opponent back into the game."
  ],

  blunder: [
    "💥 Oh no! That was a big mistake!",
    "😱 Careful! That move loses material!",
    "⚠️ Emergency! Your opponent can take advantage here!",
    "💥 That's a serious mistake that needs fixing!"
  ],

  // Phase-specific encouragement
  opening: [
    "♟️ Good opening play! Keep developing your pieces.",
    "🎯 You're getting your pieces out well!",
    "💡 Great start! You're following opening principles."
  ],

  middlegame: [
    "⚔️ Active play in the middlegame! You're fighting well.",
    "🎯 Good tactical awareness! Keep looking for opportunities.",
    "💡 You're maneuvering well in the middlegame."
  ],

  endgame: [
    "👑 Careful play in the endgame! Precision matters now.",
    "🎯 Good endgame technique! Keep pushing your advantages.",
    "💡 You're handling the endgame well!"
  ],

  // Complexity-based feedback
  complex: [
    "🧠 Great job navigating this complex position!",
    "🎯 Excellent analysis in this complicated situation!",
    "💡 You're thinking deeply about this position - well done!"
  ],

  simple: [
    "🎯 Clean and efficient! Great in a straightforward position.",
    "💡 Good practical play when things are clear.",
    "👍 Solid fundamentals in this position."
  ],

  // Encouraging general feedback
  encouragement: [
    "🎮 Keep playing! You're learning and improving!",
    "📈 Every game makes you stronger!",
    "💪 Chess is a marathon, not a sprint!",
    "🎯 You're getting better with every move!"
  ]
};

// Helper function to get a random message from an array
function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Generate human-like coaching feedback
export function generateHumanCoaching(
  classification: string,
  complexity: number,
  phase: string,
  evalDelta: number
): {
  message: string;
  encouragement: string;
  priority: "low" | "medium" | "high" | "critical";
} {
  let message = "";
  let priority: "low" | "medium" | "high" | "critical" = "medium";

  // Base message based on classification
  switch (classification) {
    case "blunder":
      message = getRandomMessage(HumanCoachingMessages.blunder);
      priority = "critical";
      break;
    case "mistake":
      message = getRandomMessage(HumanCoachingMessages.mistake);
      priority = "high";
      break;
    case "inaccuracy":
      message = getRandomMessage(HumanCoachingMessages.inaccuracy);
      priority = "medium";
      break;
    case "good":
      message = getRandomMessage(HumanCoachingMessages.good);
      priority = "low";
      break;
    case "excellent":
      message = getRandomMessage(HumanCoachingMessages.excellent);
      priority = "low";
      break;
    case "brilliant":
      message = getRandomMessage(HumanCoachingMessages.brilliant);
      priority = "low";
      break;
  }

  // Add phase-specific context
  let phaseMessage = "";
  switch (phase) {
    case "opening":
      phaseMessage = getRandomMessage(HumanCoachingMessages.opening);
      break;
    case "middlegame":
      phaseMessage = getRandomMessage(HumanCoachingMessages.middlegame);
      break;
    case "endgame":
      phaseMessage = getRandomMessage(HumanCoachingMessages.endgame);
      break;
  }

  // Add complexity context for challenging positions
  let complexityMessage = "";
  if (complexity > 70) {
    complexityMessage = getRandomMessage(HumanCoachingMessages.complex);
  } else if (complexity < 40) {
    complexityMessage = getRandomMessage(HumanCoachingMessages.simple);
  }

  // Combine messages
  const fullMessage = [message, phaseMessage, complexityMessage]
    .filter(m => m.length > 0)
    .join(" ");

  // Add encouragement for learning moments
  let encouragement = "";
  if (classification === "blunder" || classification === "mistake") {
    encouragement = getRandomMessage(HumanCoachingMessages.encouragement);
  }

  return {
    message: fullMessage,
    encouragement,
    priority
  };
}