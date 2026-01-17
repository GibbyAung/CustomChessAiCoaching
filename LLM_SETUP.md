# GitHub Models LLM Integration Setup

## 1. Install Required Package

```bash
npm install openai
```

## 2. Set Up Environment Variables

Create or update your `.env` file:

```env
# GitHub Models API Token
GITHUB_TOKEN=ghp_your_github_personal_access_token_here

# Or for Next.js
NEXT_PUBLIC_GITHUB_TOKEN=ghp_your_github_personal_access_token_here
```

## 3. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Give it a name like "Chess App LLM"
4. Select scopes: No special scopes needed for GitHub Models
5. Generate and copy the token
6. Add it to your `.env` file

## 4. Usage Example

```typescript
import { llmCoaching } from "@/lib/llm-integration";

// In your move handler
const handleMove = async (move: string) => {
  // ... existing move logic

  try {
    const analysis = await llmCoaching.analyzeWithLLM(game.fen(), move);

    // Show LLM coaching
    llmCoaching.coach.showCoaching(analysis.llm);

    console.log("LLM Analysis:", analysis.llm.detailedExplanation);
    console.log("Alternative moves:", analysis.llm.alternativeMoves);
  } catch (error) {
    console.error("LLM coaching unavailable:", error);
    // Fallback to regular coaching
  }
};
```

## 5. Available Models

GitHub Models currently offers:

- `openai/gpt-4o-mini` (Free, fast)
- `openai/gpt-4o` (Paid, more capable)
- `meta/llama-3.1-405b-instruct` (Free, powerful)

## 6. Customization

```typescript
import { LLMChessCoach } from "@/lib/llm-coaching";

const customCoach = new LLMChessCoach({
  apiKey: "github-token", // Not used, reads from env
  model: "openai/gpt-4o-mini",
  personality: "friendly", // "professional" | "motivational" | "technical"
  detailLevel: "detailed", // "concise" | "comprehensive"
  focusAreas: ["tactics", "endgames", "strategy"],
});
```

## 7. Benefits

- **Free**: GitHub Models are free to use
- **Smart**: Context-aware chess coaching
- **Personalized**: Adapts to player skill and preferences
- **Rich content**: Alternative moves, learning points, practice focus
- **Fallback**: Graceful degradation if API fails

## 8. Troubleshooting

If you get "GITHUB_TOKEN not found":

- Check your `.env` file exists
- Verify token is correctly set
- Restart your development server

If you get module errors:

- Run `npm install openai`
- Check your Node.js version (18+ recommended)

## 9. Production Deployment

For production, ensure:

- `GITHUB_TOKEN` is set in your hosting environment
- Rate limits are considered (GitHub Models has generous limits)
- Error handling is robust (already included)
