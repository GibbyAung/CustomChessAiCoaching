// Human-like coaching messages and feedback
export const HumanCoachingMessages = {
  brilliant: [
    "🎉 Brilliant! That move was absolutely fantastic!",
    "🌟 Wow! That was a stroke of genius!",
    "⭐ Incredible tactical vision! You're playing like a grandmaster!",
    "🎯 Perfect! That move completely changes the game!",
    "🔥 That's a sparkling idea — you found the key moment!"
  ],

  excellent: [
    "💎 Excellent! Very strong and well-calculated.",
    "🎯 Great move! You're seeing the position clearly.",
    "👍 Well played! That puts pressure on your opponent.",
    "💡 Smart choice! You're thinking several moves ahead.",
    "🧭 Smooth and purposeful — that plan makes sense here."
  ],

  good: [
    "👍 Good move! Solid and practical.",
    "✨ Nice! You're developing your pieces well.",
    "🎯 Good thinking! You're keeping your options open.",
    "👍 Solid play! You're building a good position.",
    "🧱 Steady improvement — you're coordinating your pieces."
  ],

  inaccuracy: [
    "🤔 Hmm, there might be a better move here...",
    "⚠️ This move might leave you in a slightly worse position.",
    "💭 Consider if there's a stronger option available.",
    "🤔 Think about whether this is the most accurate continuation.",
    "🧩 The idea is okay, but the move order could be sharper."
  ],

  mistake: [
    "⚠️ This move could put you in a tough spot.",
    "😟 Be careful! This might give your opponent an advantage.",
    "💭 Let's think about this - is there a safer choice?",
    "⚠️ This might be letting your opponent back into the game.",
    "🛡️ This loosens your position — watch for counterplay."
  ],

  blunder: [
    "💥 Oh no! That was a big mistake!",
    "😱 Careful! That move loses material!",
    "⚠️ Emergency! Your opponent can take advantage here!",
    "💥 That's a serious mistake that needs fixing!",
    "🚨 Tactical alert — something important was left hanging."
  ],

  // Phase-specific encouragement
  opening: [
    "♟️ Good opening play! Keep developing your pieces.",
    "🎯 You're getting your pieces out well!",
    "💡 Great start! You're following opening principles.",
    "🏗️ Nice structure — stay focused on development and king safety."
  ],

  middlegame: [
    "⚔️ Active play in the middlegame! You're fighting well.",
    "🎯 Good tactical awareness! Keep looking for opportunities.",
    "💡 You're maneuvering well in the middlegame.",
    "🧠 You're balancing tactics and strategy nicely here."
  ],

  endgame: [
    "👑 Careful play in the endgame! Precision matters now.",
    "🎯 Good endgame technique! Keep pushing your advantages.",
    "💡 You're handling the endgame well!",
    "🏁 Endgame focus — activate the king and simplify wisely."
  ],

  // Complexity-based feedback
  complex: [
    "🧠 Great job navigating this complex position!",
    "🎯 Excellent analysis in this complicated situation!",
    "💡 You're thinking deeply about this position - well done!",
    "🧭 Complex spot, but you're keeping your ideas connected."
  ],

  simple: [
    "🎯 Clean and efficient! Great in a straightforward position.",
    "💡 Good practical play when things are clear.",
    "👍 Solid fundamentals in this position.",
    "🧼 Crisp and tidy — no unnecessary risks."
  ],

  // Encouraging general feedback
  encouragement: [
    "🎮 Keep playing! You're learning and improving!",
    "📈 Every game makes you stronger!",
    "💪 Chess is a marathon, not a sprint!",
    "🎯 You're getting better with every move!",
    "🧘 Stay calm — one move doesn't define the game."
  ]
};

// Helper function to get a random message from an array
function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

function getEvalInsight(evalDelta: number): string {
  if (Math.abs(evalDelta) < 20) return "";
  const pawns = (Math.abs(evalDelta) / 100).toFixed(1);
  if (evalDelta > 0) {
    return `✅ That improved your position by about ${pawns} pawns.`;
  }
  return `⚠️ That dropped the evaluation by about ${pawns} pawns.`;
}

function getNextStep(phase: string, classification: string): string {
  if (classification === "blunder" || classification === "mistake") {
    return "Look for checks, captures, and threats before committing.";
  }

  switch (phase) {
    case "opening":
      return "Prioritize development and king safety — get your pieces out.";
    case "middlegame":
      return "Improve your worst piece and keep an eye on tactical shots.";
    case "endgame":
      return "Activate your king and simplify into winning pawns.";
    default:
      return "";
  }
}

function getMoveAssessment(
  moveLabel: string,
  classification: string
): string {
  if (!moveLabel) {
    return "";
  }

  switch (classification) {
    case "brilliant":
      return `Move ${moveLabel} was inspired.`;
    case "excellent":
      return `Move ${moveLabel} was excellent.`;
    case "good":
      return `Move ${moveLabel} was a good choice.`;
    case "inaccuracy":
      return `Move ${moveLabel} was a bit inaccurate.`;
    case "mistake":
      return `Move ${moveLabel} was a mistake.`;
    case "blunder":
      return `Move ${moveLabel} was a blunder.`;
    case "neutral":
      return `Move ${moveLabel} was okay, but there were stronger options.`;
    default:
      return `Move ${moveLabel} was played.`;
  }
}

// Generate human-like coaching feedback
export function generateHumanCoaching(
  classification: string,
  complexity: number,
  phase: string,
  evalDelta: number,
  moveLabel: string
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
  const moveAssessment = getMoveAssessment(moveLabel, classification);

  const fullMessage = [moveAssessment, message, phaseMessage, complexityMessage]
    .filter(m => m.length > 0)
    .join(" ");

  const evaluationInsight = getEvalInsight(evalDelta);
  const nextStep = getNextStep(phase, classification);

  const enhancedMessage = [fullMessage, evaluationInsight, nextStep]
    .filter((item) => item.length > 0)
    .join(" ");

  // Add encouragement for learning moments
  let encouragement = "";
  if (classification === "blunder" || classification === "mistake") {
    encouragement = getRandomMessage(HumanCoachingMessages.encouragement);
  }

  return {
    message: enhancedMessage,
    encouragement,
    priority
  };
}
