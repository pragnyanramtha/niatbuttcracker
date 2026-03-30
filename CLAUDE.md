# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**niatbuttcracker** is a CLI tool that automates CCBP/NXT learning platform completions using AI-powered Q&A solving. It allows users to complete learning sets, practice exams, and coding/SQL question sets automatically using the Groq API for intelligent question solving.

## Development Commands

```bash
# Build the project (compile TypeScript → dist/)
npm run build

# Run in development mode (with DEBUG=1 for verbose logging)
npm run dev

# Publish to npm (runs build before publishing)
npm run prepublishOnly
```

**Note:** The tool is published as a CLI binary via the `bin` field in package.json. After installation, users run `niatbuttcracker` directly.

## Project Structure

```
src/
├── index.ts          # Entry point; loads curriculum.json, manages token retry loop
├── cli.ts            # Interactive prompts for semester/course/mode selection
├── api.ts            # CCBP API wrapper (handles double-encoded JSON envelopes)
├── runner.ts         # Orchestrates course → topic → unit iteration and processing
├── solver.ts         # Groq-powered AI solver with model rotation & rate-limiting
├── types.ts          # All TypeScript interfaces for API responses/requests
├── config.ts         # Config persistence (~/.niat-auto-config.json)
└── logger.ts         # Debug logging utilities
```

## High-Level Architecture

The tool operates in these phases:

### 1. **Credential & Selection (cli.ts)**
   - Loads saved token and Groq API key; prompts for new ones if missing
   - User selects semester → course(s) → topic count limit
   - User selects completion mode: "learning_sets" | "practice" | "question_sets" | "all"
   - Displays summary; user confirms to start

### 2. **API Client Setup (api.ts)**
   - Creates Axios instance with CCBP API base URL and headers
   - **Key quirk:** CCBP wraps all request bodies in a double-encoded JSON envelope: `{ data: JSON.stringify(JSON.stringify(inner)), clientKeyDetailsId: 1 }`
   - Exports functions for each API endpoint (course details, topics, exams, questions, submissions, etc.)

### 3. **Execution Loop (runner.ts)**
   - Iterates through selected courses
   - For each topic:
     - Fetches topic units (learning sets, practice exams, question sets, assessments)
     - Filters by topic limit
     - Processes each unit according to completion mode
   - Applies 100ms delay between requests to avoid rate limiting

### 4. **Unit Handling by Type**

   **Learning Sets** (marked as COMPLETED instantly):
   - Check if already completed (if `skipCompleted` enabled)
   - Call completeLearningSet API

   **Practice Sets** (MCQ exams with AI solving):
   - Skip if locked or already 100% complete
   - Create exam attempt → fetch questions
   - Use Groq to solve all questions at once
   - Submit all responses with timing data
   - End attempt

   **Question Sets** (SQL/Coding with test case validation):
   - Fetch question summaries → get detailed questions
   - For **Coding**: Use Groq to generate code, save it, execute with test cases, submit
   - For **SQL**: Similar flow but includes database schema fetching & SQL-specific endpoints

### 5. **AI Solving (solver.ts)**

   **Model Rotation & Rate-Limiting:**
   - Maintains a pool of 4 Groq-compatible models
   - Tracks per-model rate-limit cooldowns (60s after a 429 error)
   - Always tries non-rate-limited models first
   - If all models are rate-limited, cycles through them sorted by soonest recovery
   - Never crashes due to lack of available models

   **MCQ Solving:**
   - Builds a prompt with A/B/C/D letter labels for LLM training compatibility
   - Instructs model to reason before answering
   - Extracts the chosen letter from response → maps back to option_id

   **Coding/SQL Solving:**
   - Generates solution code/SQL using Groq
   - Submits via appropriate endpoint
   - Polls for async evaluation results (for C++/Java/Python)
   - Or immediately gets synchronous results (for Node.js)

## Key Files & Responsibilities

| File | Purpose |
|------|---------|
| **index.ts** | Main entry; coordinates CLI → API → runner flow; handles 401 token expiry retry loop |
| **cli.ts** | Interactive prompts; uses @inquirer/prompts for checkboxes/selects; persists credentials |
| **api.ts** | Thin wrapper over CCBP endpoints; handles payload encoding; returns typed responses |
| **runner.ts** | Unit iteration; chooses handler (learning/practice/question) based on unit_type & mode |
| **solver.ts** | Groq API client; model rotation; prompt building; rate-limit handling |
| **types.ts** | ~10 coherent groups of interfaces matching CCBP API shape |
| **config.ts** | Reads/writes ~/.niat-auto-config.json (token + groqKey) |
| **logger.ts** | debug() helper for verbose output (if DEBUG=1) |

## Curriculum Data

- **curriculum.json** is bundled with the package and loaded at startup
- Lists all semesters, subjects, and courses with metadata (course IDs, titles, topic counts, etc.)
- Used to populate CLI selection prompts
- Must exist or the tool exits with an error

## Configuration & Credentials

- Bearer token and Groq API key are saved to `~/.niat-auto-config.json` after first prompt
- On 401 (unauthorized), the token is cleared and the user is re-prompted
- Groq key validation checks for "gsk_" prefix
- Token reuse is masked in prompts (first 6 + last 4 chars visible)

## Debugging

Set `DEBUG=1` environment variable to enable verbose logging:
```bash
DEBUG=1 npm run dev
```

This logs:
- API request/response details
- Groq solver reasoning
- Unit processing steps
- Model rate-limit state

## Dependencies

- **@inquirer/prompts** — Interactive CLI prompts
- **axios** — HTTP client for CCBP API
- **chalk** — Terminal colors
- **groq-sdk** — Groq API client
- **ora** — Spinner animations
- **sql.js** — In-memory SQL execution (for SQL question handling)

## Build Output

- TypeScript compiled to `/dist` (ES2022, ESNext modules)
- Source maps included (`.d.ts` declarations)
- Binary entry at `src/index.ts` → `dist/index.js`
- Bundled as CLI via `bin.niatbuttcracker` in package.json

## Important Patterns & Conventions

1. **Payload Encoding:** All CCBP requests use `buildPayload()` helper for double-JSON encoding
2. **Unit Type Filtering:** Runners check `unit.unit_type` to determine handler (not all unit types are handled yet)
3. **Completion Modes:** "all" is a catch-all; specific modes skip irrelevant units in the runner
4. **Error Handling:** API errors logged but don't crash the runner; next unit is processed
5. **Rate Limiting:** Hard-coded 100ms delay after each unit; Groq rate-limits handled by model rotation
