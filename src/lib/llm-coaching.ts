// src/lib/llm-coaching.ts
"use client";

import { toastManager, ToastPriority, ToastType } from "./toast-manager";
import { MoveQuality } from "./coaching-feedback";

export interface LLMCoachingConfig {
  apiKey: string;
  model: string; // e.g., "gpt-4-turbo", "claude-3-sonnet"
  personality: "friendly" | "professional" | "motivational" | "technical";
  detailLevel: "concise" | "detailed" | "comprehensive";
  focusAreas: string[]; // e.g., ["tactics", "strategy", "endgames"]
}

export interface LLMAnalysisRequest {
  fen: string;
  lastMove: string;
  evaluation: number;
  gamePhase: "opening" | "middlegame" | "endgame";
  playerSkill: "beginner" | "intermediate" | "advanced";
  timeControl: "bullet" | "blitz" | "rapid" | "classical";
}

export interface LLMCoachingResponse {
  moveQuality: MoveQuality;
  title: string;
  message: string;
  detailedExplanation: string;
  alternativeMoves: Array<{
    move: string;
    explanation: string;
    priority: "primary" | "secondary";
  }>;
  learningPoints: string[];
  nextSteps: string[];
  priority: ToastPriority;
}

export class LLMChessCoach {
  private config: LLMCoachingConfig;
  private requestCache = new Map<
    string,
    { response: LLMCoachingResponse; timestamp: number }
  >();
  private readonly CACHE_DURATION = 60000; // 1 minute cache for LLM responses
  private readonly ANALYSIS_COOLDOWN = 2000; // 2 seconds between analyses
  private lastAnalysisTime = 0;

  constructor(config: LLMCoachingConfig) {
    this.config = config;
  }

  async analyzePosition(
    request: LLMAnalysisRequest,
  ): Promise<LLMCoachingResponse> {
    // Rate limiting - prevent rapid duplicate analyses
    const now = Date.now();
    if (now - this.lastAnalysisTime < this.ANALYSIS_COOLDOWN) {
      console.log("⏸️ Analysis blocked by cooldown");
      throw new Error("Analysis cooldown active");
    }
    this.lastAnalysisTime = now;

    const cacheKey = this.generateCacheKey(request);
    const cached = this.requestCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log("🎯 Using cached LLM response");
      return cached.response;
    }

    try {
      const prompt = this.generatePrompt(request);
      const response = await this.callLLM(prompt);
      const parsedResponse = this.parseResponse(response);

      // Cache response
      this.requestCache.set(cacheKey, {
        response: parsedResponse,
        timestamp: Date.now(),
      });

      return parsedResponse;
    } catch (error) {
      console.error("LLM analysis failed:", error);
      return this.getFallbackResponse(request);
    }
  }

  private generatePrompt(request: LLMAnalysisRequest): string {
    const personality = this.getPersonalityPrompt();
    const detail = this.getDetailPrompt();
    const focus = this.getFocusPrompt();

    return `
${personality}

You are an expert chess coach analyzing a position. Provide coaching feedback that is:
${detail}
${focus}

Position Analysis:
- FEN: ${request.fen}
- Last move: ${request.lastMove}
- Engine evaluation: ${request.evaluation} (positive = White advantage)
- Game phase: ${request.gamePhase}
- Player skill level: ${request.playerSkill}
- Time control: ${request.timeControl}

Respond with ONLY raw JSON (no code blocks, no markdown formatting):

{
  "moveQuality": "brilliant|excellent|good|inaccurate|mistake|blunder",
  "title": "Brief, engaging title (max 50 chars)",
  "message": "Main feedback message (max 80 chars)",
  "detailedExplanation": "Comprehensive explanation of position and move",
  "alternativeMoves": [
    {
      "move": "best alternative move in algebraic notation",
      "explanation": "why this move is better",
      "priority": "primary|secondary"
    }
  ],
  "learningPoints": ["specific chess concepts to learn"],
  "nextSteps": ["what to focus on in similar positions"],
  "priority": "low|medium|high|critical"
}

Focus on practical, actionable advice that will help player improve.
    `.trim();
  }

  private getPersonalityPrompt(): string {
    const personalities = {
      friendly: "Be encouraging and supportive, like a friendly mentor.",
      professional:
        "Be analytical and precise, like a professional chess coach.",
      motivational: "Be inspiring and focus on growth mindset.",
      technical: "Be detailed and focus on concrete chess principles.",
    };
    return personalities[this.config.personality];
  }

  private getDetailPrompt(): string {
    const details = {
      concise: "Brief and to the point.",
      detailed: "Thorough with clear explanations.",
      comprehensive: "Extensive with multiple examples and variations.",
    };
    return details[this.config.detailLevel];
  }

  private getFocusPrompt(): string {
    if (this.config.focusAreas.length === 0) return "";
    return `Focus particularly on: ${this.config.focusAreas.join(", ")}.`;
  }

  private async callLLM(prompt: string): Promise<string> {
    // Use GitHub Models API (free with GitHub token)
    return this.callGitHubModels(prompt);
  }

  private async callGitHubModels(prompt: string): Promise<string> {
    try {
      // Import OpenAI client for GitHub Models compatibility
      const { default: OpenAI } = await import("openai");

      // Get GitHub token from environment
      const token =
        process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;

      if (!token) {
        throw new Error("GITHUB_TOKEN not found in environment variables");
      }

      const client = new OpenAI({
        baseURL: "https://models.github.ai/inference",
        apiKey: token,
        dangerouslyAllowBrowser: true, // Allow browser usage for GitHub Models
      });

      const response = await client.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an expert chess coach providing precise, helpful analysis.",
          },
          { role: "user", content: prompt },
        ],
        model: "openai/gpt-4o-mini", // Free GitHub model
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
      });

      return response.choices[0]?.message?.content || "{}";
    } catch (error) {
      console.error("GitHub Models API error:", error);
      throw error;
    }
  }

  private parseResponse(response: string): LLMCoachingResponse {
    try {
      // Remove markdown code blocks and clean response
      let jsonStr = response;

      // Remove ```json``` blocks
      if (jsonStr.includes("```")) {
        jsonStr = jsonStr.replace(/```json\n?|\n?```/g, "").trim();
      }

      // Remove any remaining markdown formatting
      jsonStr = jsonStr.replace(/```/g, "").trim();

      console.log("🔍 Cleaned LLM response:", jsonStr);

      const parsed = JSON.parse(jsonStr);
      return {
        moveQuality: parsed.moveQuality || "good",
        title: parsed.title || "Chess Analysis",
        message: parsed.message || "Move analyzed",
        detailedExplanation: parsed.detailedExplanation || "Analysis complete",
        alternativeMoves: parsed.alternativeMoves || [],
        learningPoints: parsed.learningPoints || [],
        nextSteps: parsed.nextSteps || [],
        priority: parsed.priority || "medium",
      };
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      console.error("Raw response:", response);
      throw new Error("Invalid LLM response format");
    }
  }

  private getFallbackResponse(
    request: LLMAnalysisRequest,
  ): LLMCoachingResponse {
    // Fallback to rule-based coaching if LLM fails
    const absEval = Math.abs(request.evaluation);
    let moveQuality: MoveQuality = "good";
    let priority: ToastPriority = "medium";

    if (absEval > 500) {
      moveQuality = "blunder";
      priority = "critical";
    } else if (absEval > 200) {
      moveQuality = "mistake";
      priority = "high";
    } else if (absEval > 100) {
      moveQuality = "inaccurate";
      priority = "medium";
    } else if (absEval < 20) {
      moveQuality = "excellent";
      priority = "low";
    }

    return {
      moveQuality,
      title: "Analysis Complete",
      message: `Move evaluated as ${moveQuality}`,
      detailedExplanation: `Engine evaluation: ${request.evaluation}cp in ${request.gamePhase}`,
      alternativeMoves: [],
      learningPoints: ["Continue analyzing positions carefully"],
      nextSteps: ["Focus on tactical patterns"],
      priority,
    };
  }

  private generateCacheKey(request: LLMAnalysisRequest): string {
    return `${request.fen}-${request.lastMove}-${request.evaluation}`;
  }

  // Show LLM coaching as toast
  showCoaching(response: LLMCoachingResponse) {
    toastManager.addToast({
      type: "learning" as ToastType,
      priority: response.priority,
      title: response.title,
      message: response.message,
    });
  }

  // Get detailed coaching (for expanded view)
  getDetailedCoaching(response: LLMCoachingResponse): string {
    return `
**${response.title}**

${response.detailedExplanation}

**Alternative Moves:**
${response.alternativeMoves
  .map((move) => `• ${move.move}: ${move.explanation}`)
  .join("\n")}

**Learning Points:**
${response.learningPoints.map((point) => `• ${point}`).join("\n")}

**Next Steps:**
${response.nextSteps.map((step) => `• ${step}`).join("\n")}
    `.trim();
  }

  updateConfig(newConfig: Partial<LLMCoachingConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Example usage with GitHub Models
export const friendlyCoach = new LLMChessCoach({
  apiKey: "github-token", // Not used for GitHub Models, uses GITHUB_TOKEN env var
  model: "openai/gpt-4o-mini", // GitHub model
  personality: "friendly",
  detailLevel: "detailed",
  focusAreas: ["tactics", "strategy"],
});

export const professionalCoach = new LLMChessCoach({
  apiKey: "github-token", // Not used for GitHub Models, uses GITHUB_TOKEN env var
  model: "openai/gpt-4o-mini", // GitHub model
  personality: "professional",
  detailLevel: "comprehensive",
  focusAreas: ["endgames", "positional play"],
});
