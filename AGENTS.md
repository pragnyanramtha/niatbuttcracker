# AGENTS.md — niatbuttcracker

Node.js CLI (TypeScript, tsup-bundled) that automates CCBP/NXT course completion using Cerebras AI.

## Execution paths

| Command | Description |
|---------|-------------|
| `npm run dev` | Interactive: Playwright browser login → semester/course/mode prompts → runs |
| `npm run exec -- --semester "Semester 2" --token ...` | Non-interactive: CLI flags only, no browser prompt |
| `npm run build` | `tsup` bundles `src/index.ts` → `dist/index.js`, copies `curriculum.json` into dist |

Non-interactive flags: `--token`, `--api-key`, `--semester`, `--course-ids`, `--course-titles`, `--subjects`, `--mode` (learning_sets/practice/question_sets/all), `--topic-limit`.

Debug: `DEBUG=1 npm run dev` — shows Axios request/response bodies, SQL prompts, AI raw responses.

## Auth

- **Browser-based** via Playwright. Launches Chrome/Edge (non-headless), intercepts `authorization` header from `nkb-backend-ccbp-prod-apis.ccbp.in` requests.
- Session (cookies) saved to: `%LOCALAPPDATA%\niatbuttcracker\ccbp-session.json` (Win) or `~/.cache/niatbuttcracker/ccbp-session.json` (Unix).
- Token is **never** saved to disk — captured fresh each interactive run.
- On HTTP 401, runner clears session and restarts the login flow.

## AI Provider

- OpenAI-compatible API at `https://opencode.ai/zen/v1` (model: `big-pickle`).
- **Free tier — no API key required.** If none provided, uses a default placeholder.
- Key source (optional): `config.json` (cache dir) → `OPENAI_API_KEY` env var → `--api-key` flag.
- Model rotation: tries models in order on failure — `north-mini-code-free` → `big-pickle` → `mimo-v2.5-free` → `nemotron-3-ultra-free` → `deepseek-v4-flash-free` → `laguna-s-2.1-free`.
- `src/solver.ts` uses the `openai` SDK.

## CCBP API

- Base: `https://nkb-backend-ccbp-prod-apis.ccbp.in`
- **All POST bodies are double-encoded JSON** (`buildPayload()` in `src/api.ts`):
  ```
  { data: JSON.stringify(JSON.stringify(inner)), clientKeyDetailsId: 1 }
  ```
- Headers include `x-app-version: 1128`, `x-browser-session-id: crypto.randomUUID()`.

## Entrypoints

| File | Role |
|------|------|
| `src/index.ts` | Interactive entry — loads curriculum, runs prompts, retries on 401 |
| `src/agent-exec.ts` | Non-interactive entry — CLI flags, same runner |
| `src/runner.ts` | Course/topic/unit orchestration |
| `src/api.ts` | Typed CCBP API wrapper |
| `src/solver.ts` | All AI calls |
| `src/solver-interface.ts` | Re-exports from solver.ts (clean imports for runner) |

## Unit processing order

Per topic (sequential topics, concurrent units within each group):

1. **LEARNING_SET** — concurrency 8. No AI. Just calls `completeLearningSet()`.
2. **PRACTICE** — concurrency 3. Creates exam attempt → fetches MCQs → `solveAll()` via AI → submits → ends attempt.
3. **QUESTION_SET** — concurrency 2. Probes SQL endpoint first; falls back to coding.

## Practice retry

- Threshold: ≥75% score. Max 3 attempts.
- Each retry = fresh exam attempt + solve + submit + end.
- Fallback: if AI can't solve, picks first option.

## SQL question sets

- `fetchDbSchema(dbUrl)` downloads the SQLite DB, introspects tables/columns via `sql.js`.
- Solves in batches of 10 via AI (JSON output: `{"<question_id>": "SELECT ..."}`).
- Submits one at a time. On INCORRECT, feeds server error back to AI via `refineSqlAnswer()` — up to 5 AI retries.
- Network errors (5xx): auto-retry up to 3 times with exponential backoff (1s, 2s, 4s).
- Post-check: re-fetches status, resubmits any still not correct using cached SQL.

## Coding question sets

- Language preference: PYTHON > NODE_JS > CPP > JAVA > first available.
- **Must call `startCodingQuestion()` before submitting** — server rejects without it.
- Solution cleanup: strips `<think>...</think>` blocks and markdown fences.
- On AI failure: falls back to default template.
- Post-check: re-fetches summary, resubmits still-incorrect with one extra AI attempt.

## Curriculum

- `curriculum.json` is local (bundled, not fetched from CCBP). Drives semester/course prompts.
- Lookup order: `dist/curriculum.json` → `../curriculum.json` (relative to entrypoint).

## Config & cache

- Cache dir: `%LOCALAPPDATA%\niatbuttcracker` (Win) / `~/.cache/niatbuttcracker` (Unix)
- `config.json` — stores optional API key
- `ccbp-session.json` — Playwright browser storage state

## Scripts (standalone, not used by main app)

`scripts/*.js` — legacy alternative workflow using `/tmp/ccbp-work/` and `/tmp/ccbp-token.txt`. Not part of the `src/` TypeScript app. Ignore unless specifically referenced.

## Known quirks

- No test framework in dependencies — no test runner to invoke.
- `.agent/` directory is Antigravity Kit (unrelated to CCBP app).
- `dp` and `sem2.json` are local data files.
