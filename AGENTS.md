# AGENTS.md — niatbuttcracker CCBP Course Auto-Completion

This file documents the automated workflow for completing CCBP courses via the CCBP API. A fresh agent can pick this up and continue.

## Context

- `niatbuttcracker` is a Node.js CLI that logs into `learning.ccbp.in`, captures a Bearer token, then processes learning sets, practice exams, SQL, and coding question sets.
- The original app uses Cerebras API for AI-solving. We bypass that and solve everything ourselves (or with agent knowledge).
- All CCBP API payloads are **double-encoded JSON** (see `scripts/ccbp-lib.js`).

## Prerequisites

- Node.js installed
- CCBP account credentials (user logs in manually via browser)
- The project directory at `/home/pik/dev/niatbuttcracker`

## One-Time Setup

### 1. Capture CCBP Token (Browser Login)

```bash
CCBP_CREDS="username@email.com:password" node scripts/capture-token.js
```

This launches a Playwright browser (non-headless). The user logs in manually. Once the Bearer token is captured from outgoing API requests, it's saved to `/tmp/ccbp-token.txt`.

Alternative: if a token is already captured, just verify it's still valid:
```bash
cat /tmp/ccbp-token.txt
```

### 2. Fetch Course/Topic/Unit Structure

```bash
CCBP_TOKEN="$(cat /tmp/ccbp-token.txt)" node scripts/ccbp-fetch-courses.js
```

Saves to `/tmp/ccbp-work/courses.json`, `course-details.json`, `topic-units.json`.

## Pipeline Order

For each semester, process units in this order:

```
1. LEARNING_SET → complete (no AI, just API call)
2. PRACTICE → fetch MCQs, solve, submit (agent answers)
3. QUESTION_SET (SQL or Coding) → fetch, solve, submit
```

### Step 1: Complete Learning Sets

```bash
CCBP_TOKEN="$(cat /tmp/ccbp-token.txt)" node scripts/ccbp-complete-learning.js
```

Marks all `LEARNING_SET` units as complete. 0 AI needed — just calls `completeLearningSet` API.

### Step 2: Practice Exams (MCQs)

**Fetch:**
```bash
CCBP_TOKEN="$(cat /tmp/ccbp-token.txt)" node scripts/ccbp-fetch-practice.js
```
Creates exam attempts and saves questions to `/tmp/ccbp-work/practice-questions.json`.

**Answer Format:**

Answer file at `/tmp/ccbp-work/practice-answers.json`:
```json
{
  "answers": {
    "<question_id>": "<option_id>",
    ...
  }
}
```

**How to Answer:**

1. View all questions grouped by course:
   ```bash
   node /tmp/ccbp-work/dump-course.mjs "Course Name"
   ```

2. Each question has format:
   ```
   <question_id>|Q<number>|<question text>
   <question_id>|O<option_number>|<option_id>|<option text>
   ```

3. For each question, pick the correct option's `option_id` and add to `practice-answers.json`.

4. Use a Node.js one-liner to batch-add answers:
   ```bash
   node -e "
   const fs = require('fs');
   const a = JSON.parse(fs.readFileSync('/tmp/ccbp-work/practice-answers.json','utf-8'));
   Object.assign(a.answers, { '<question_id>': '<option_id>' });
   fs.writeFileSync('/tmp/ccbp-work/practice-answers.json', JSON.stringify(a, null, 2));
   "
   ```

**Submit:**
```bash
CCBP_TOKEN="$(cat /tmp/ccbp-token.txt)" node scripts/ccbp-submit-practice.js
```

The submit script:
- Submits all answers via CCBP API
- Checks score (try for ≥75%)
- Retries up to 3 times if score is below threshold
- Ends each exam attempt

### Step 3: SQL Question Sets

**Fetch:**
```bash
CCBP_TOKEN="$(cat /tmp/ccbp-token.txt)" node scripts/ccbp-fetch-sql.js
```

Saves to `/tmp/ccbp-work/sql-questions.json`.

**SQL Solving:**

1. Each SQL question has: question text, DB schema (tables + columns), `db_url` (SQLite database)
2. Answer file at `/tmp/ccbp-work/sql-answers.json`:
   ```json
   {
     "answers": {
       "<question_id>": "SELECT ...",
       ...
     }
   }
   ```
3. **Submit:**
   ```bash
   CCBP_TOKEN="$(cat /tmp/ccbp-token.txt)" node scripts/ccbp-submit-sql.js
   ```

### Step 4: Coding Question Sets

**Fetch:**
```bash
CCBP_TOKEN="$(cat /tmp/ccbp-token.txt)" node scripts/ccbp-fetch-coding.js
```

**Coding Solving:**

1. Questions shown with: problem statement, examples, starter template, applicable languages
2. Pick language preference: PYTHON > NODE_JS > CPP > JAVA
3. Answer file at `/tmp/ccbp-work/coding-answers.json`:
   ```json
   {
     "answers": {
       "<question_id>": "def solution():\n    ...",
       ...
     }
   }
   ```
4. **Submit:**
   ```bash
   CCBP_TOKEN="$(cat /tmp/ccbp-token.txt)" node scripts/ccbp-submit-coding.js
   ```

### Run Everything (Orchestrator)

```bash
CCBP_TOKEN="$(cat /tmp/ccbp-token.txt)" node scripts/ccbp-run.js
```

This runs the full pipeline: learning → practice → sql → coding.

## Data Files

All in `/tmp/ccbp-work/`:
| File | Contents |
|------|----------|
| `courses.json` | Course list |
| `course-details.json` | Detailed course info |
| `topic-units.json` | Units per topic |
| `practice-questions.json` | Fetched MCQs |
| `practice-answers.json` | MCQ answers (key=question_id, value=option_id) |
| `sql-questions.json` | Fetched SQL questions |
| `sql-answers.json` | SQL query answers |
| `coding-questions.json` | Fetched coding problems |
| `coding-answers.json` | Coding solution answers |
| `dump-course.mjs` | Helper to dump questions for a specific course |

## Token & Config

- Token stored at: `/tmp/ccbp-token.txt`
- Config file: `~/.cache/niatbuttcracker/config.json` (for Cerebras key — not needed anymore)

## Important Notes

- All POST bodies use double-encoded JSON wrapper via `buildPayload()` in `scripts/ccbp-lib.js`
- Practice retries: max 3 attempts, aim for ≥75% score
- Learning sets: no AI needed, just mark complete
- Token expires eventually — re-run `capture-token.js` when 401 errors occur
- The submit script processes ALL practice sets even if no answers given (falls back to first option). To skip unanswered sets, modify the script.
