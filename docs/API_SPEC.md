# API_SPEC.md

## Overview

This document defines the API endpoints for Project Chimera. All AI endpoints use the open-source GitHub model API (no paid OpenAI APIs).

## Endpoints

### Chess Engine

- `POST /api/engine/move` — Make a move
- `POST /api/engine/analyze` — Analyze a position
- `GET /api/engine/best-move` — Get best move suggestion
- `POST /api/engine/validate` — Validate move legality

### AI Coach

- `POST /api/coach/explain` — Explain a move (calls open-source LLM via GitHub model API)
- `GET /api/coach/hint` — Get move hint
- `POST /api/coach/assess` — Assess position
- `GET /api/coach/suggest` — Suggest improvement

### Game Management

- `POST /api/games/create` — Start new game
- `GET /api/games/[id]` — Get game details
- `POST /api/games/[id]/moves` — Add move to game
- `GET /api/games/[id]/analyze` — Get game analysis

## Notes

- All endpoints are designed for stateless, scalable operation
- No user authentication required for V1
- All AI endpoints are routed through the open-source/free LLM API
