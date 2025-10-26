# ARCHITECTURE.md

## System Overview

Project Chimera is a modern, open-source chess learning platform built with a modular architecture for scalability and maintainability.

## High-Level Architecture

- **Frontend:** Next.js 15 (React 19, TypeScript, Tailwind CSS)
- **Chess Engine:** Custom C++ engine compiled to WebAssembly (WASM)
- **Custom Chess AI:** Handles move analysis, tactics detection, strategic evaluation
- **AI Coach:** Open-source LLM (via GitHub model API) for natural language generation only
- **State Management:** Zustand (client), Prisma (if persistence needed)
- **Deployment:** Vercel (frontend), self-hosted or free-tier cloud for backend/AI

## Component Diagram

```
[User]
  |
  v
[Next.js Frontend] <--> [WASM Chess Engine]
  |
  v
[Custom Chess AI] --> [LLM (Language Polish Only)]
```

## Key Principles

- **Custom Chess Intelligence:** All chess analysis, tactics, and strategy handled by your own AI
- **LLM for Language Only:** Open-source LLM converts structured data to natural language
- **Complete Control:** No reliance on external APIs for chess logic
- **Performance:** Fast, deterministic chess analysis with minimal LLM usage
- **Scalability:** Your AI scales without API costs

## See also

- [AI_DESIGN.md](AI_DESIGN.md) for AI/LLM integration details
- [API_SPEC.md](API_SPEC.md) for API contracts
