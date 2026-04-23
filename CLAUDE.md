# CLAUDE.md

This file explains how `niatbuttcracker` works from process start to final submission. Use it as the source-of-truth map for the CLI, the CCBP API calls, the Cerebras solver path, and the runtime architecture.

## What The App Is

`niatbuttcracker` is a Node.js CLI that automates selected CCBP/NXT course work. It logs into `learning.ccbp.in` through a real browser session, captures the user's Bearer token from outgoing CCBP API requests, asks the user which semester/courses/topics/modes to run, then processes learning sets, practice exams, SQL question sets, and coding question sets.

All AI-generated answers now come from Cerebras through `@cerebras/cerebras_cloud_sdk`. There is no Puter or Groq provider path.

## Runtime Entry Point

The binary points to `dist/index.js`, which is built from `src/index.ts`.

At startup:

1. `src/index.ts` loads `curriculum.json`.
2. It enters a retry loop so expired CCBP sessions can be cleared and recaptured.
3. It calls `runPrompts(curriculum)` from `src/cli.ts`.
4. It initializes Cerebras with `initCerebras(config.cerebrasKey)`.
5. It builds an Axios client using the captured CCBP token.
6. It calls `run(client, config)` from `src/runner.ts`.
7. If any top-level API call fails with HTTP `401`, it clears the saved browser session and restarts the prompt/login flow.

## Source Layout

```text
src/
  index.ts             CLI entrypoint, curriculum loading, 401 retry loop
  cli.ts               Browser login, Cerebras key setup, semester/course/mode prompts
  browser-auth.ts      Playwright browser launch and Bearer token capture
  config.ts            Local cache paths and persisted Cerebras key/browser session paths
  api.ts               Typed CCBP API wrapper and payload encoding
  runner.ts            Course/topic/unit orchestration and submit flows
  solver-interface.ts  Re-exports Cerebras solver functions for runner imports
  solver.ts            Cerebras model rotation, MCQ solving, SQL solving, coding solving
  concurrency.ts       Small semaphore used for unit-level concurrency
  logger.ts            DEBUG=1 logging helpers
  types.ts             API response/request interfaces and config types
```

## Local Files And Cache

The app uses a per-user cache directory:

```text
Windows: %LOCALAPPDATA%/niatbuttcracker
Unix:    ~/.cache/niatbuttcracker
```

Inside that directory:

```text
config.json       Stores { "cerebrasKey": "..." }
ccbp-session.json Stores Playwright browser storage state/cookies
```

The CCBP Bearer token itself is not saved in config. It is captured fresh from browser network requests each run, using the saved browser session when available.

## Full Startup Flow

### 1. Load Curriculum

`src/index.ts` tries:

```text
dist/curriculum.json
../curriculum.json
```

If neither exists, the app exits with `curriculum.json not found`.

The curriculum file is not fetched from CCBP. It is bundled with the package and contains years, semesters, subjects, courses, course IDs, titles, topic counts, and ordering metadata.

### 2. Capture CCBP Auth Token

`src/cli.ts` calls `captureTokenFromBrowser()` from `src/browser-auth.ts`.

The browser auth flow:

1. Looks for an installed browser channel in this order:
   `chrome`, `msedge`, default Playwright Chromium.
2. Launches the browser non-headless.
3. Restores `ccbp-session.json` if it exists.
4. Opens `https://learning.ccbp.in/`.
5. Listens to every browser request.
6. When a request URL starts with `https://nkb-backend-ccbp-prod-apis.ccbp.in`, it reads the `authorization` header.
7. If the header starts with `Bearer `, the token is captured.
8. The browser storage state is saved back to `ccbp-session.json`.
9. The browser closes and the token is returned to the CLI.

Default timeout is 5 minutes.

### 3. Load Or Ask For Cerebras Key

`src/cli.ts` calls `getCerebrasKey()`.

Order of precedence:

1. `config.json` saved `cerebrasKey`
2. `CEREBRAS_API_KEY` environment variable
3. Interactive password prompt

If the user enters a key interactively, it is saved to `config.json`.

### 4. Ask What To Run

The CLI prompts from local `curriculum.json`, not from the backend:

1. Select semester.
2. Select one or more courses.
3. For each course, select all topics or a specific topic count.
4. Select completion mode:
   `learning_sets`, `practice`, `question_sets`, or `all`.
5. Show a summary.
6. Wait for Enter.

The runtime config has:

```ts
{
  token: string;
  cerebrasKey: string;
  selectedCourses: Array<{ course_id; course_title; topicLimit }>;
  mode: "learning_sets" | "practice" | "question_sets" | "all";
  skipCompleted: true;
  delayMs: 100;
}
```

### 5. Initialize Clients

`src/index.ts` calls:

```ts
initCerebras(config.cerebrasKey);
const client = createClient(config.token);
await run(client, config);
```

`createClient()` configures Axios with:

```text
baseURL: https://nkb-backend-ccbp-prod-apis.ccbp.in
authorization: Bearer <captured-token>
origin: https://learning.ccbp.in
referer: https://learning.ccbp.in/
x-app-version: 1128
x-browser-session-id: crypto.randomUUID()
```

## CCBP Payload Format

Every CCBP POST body is wrapped by `buildPayload()` in `src/api.ts`.

Input object:

```json
{ "course_id": "abc" }
```

Sent body:

```json
{
  "data": "\"{\\\"course_id\\\":\\\"abc\\\"}\"",
  "clientKeyDetailsId": 1
}
```

In code:

```ts
{
  data: JSON.stringify(JSON.stringify(inner)),
  clientKeyDetailsId: 1
}
```

This double-encoded envelope is required by the CCBP backend.

## API Endpoint Map

All CCBP requests use:

```text
https://nkb-backend-ccbp-prod-apis.ccbp.in
```

### Course And Topic

`getCourseDetails(client, courseId)`

```text
POST /api/nkb_resources/user/course_details/v4/
payload:
{
  course_id,
  is_session_plan_details_required: true,
  is_certification_details_required: false
}
```

Returns course title, completion status, completion percentage, and topic list.

`getTopicUnits(client, topicId, courseId)`

```text
POST /api/nkb_resources/user/topic/units_details/v3/
payload:
{
  topic_id,
  course_id
}
```

Returns units inside a topic, including learning sets, practice sets, question sets, quiz/assessment metadata, lock status, and completion percentage.

### Learning Sets

`completeLearningSet(client, learningSetId)`

```text
POST /api/nkb_learning_resource/learning_resources/set/complete/
payload:
{
  learning_resource_set_id
}
```

Marks a learning resource set complete.

### Practice Exams / MCQ

`createExamAttempt(client, examId)`

```text
POST /api/nkb_exam/user/exam/exam_attempt/
payload:
{
  exam_id
}
```

Returns `exam_attempt_id`.

`getExamQuestions(client, examAttemptId)`

```text
POST /api/nkb_primitive_coding/user/exam_attempt/primitive_coding/questions/?offset=0&length=999
payload:
{
  exam_attempt_id
}
```

Returns MCQ questions and stats.

`submitAnswers(client, examAttemptId, responses, totalTimeSpent)`

```text
POST /api/nkb_primitive_coding/user/exam_attempt/primitive_coding/submit/
payload:
{
  exam_attempt_id,
  total_time_spent,
  responses: [
    {
      question_id,
      question_number,
      time_spent,
      multiple_choice_answer_id
    }
  ]
}
```

Returns per-question evaluation, question stats, and `current_total_score`.

`endExamAttempt(client, examAttemptId)`

```text
POST /api/nkb_exam/user/exam_attempt/end/
payload:
{
  exam_attempt_id,
  end_reason_enum: "ENDED_BY_USER_BY_NAVIGATING_BACK"
}
```

Ends the attempt after submit or on failure cleanup.

### SQL Question Sets

`getSqlQuestions(client, questionSetId)`

```text
POST /api/nkb_coding_practice/questions/sql/v1/?offset=0&length=999
payload:
{
  question_set_id
}
```

Returns SQL questions, question statuses, learning resource context, and `db_url`.

`submitSqlAnswers(client, responses)`

```text
POST /api/nkb_coding_practice/questions/sql/submit/v1/
payload:
{
  responses: [
    {
      question_id,
      time_spent,
      user_response_code: {
        code_content,
        language: "SQL"
      }
    }
  ]
}
```

Returns SQL evaluation results and failure details.

The SQL solver also downloads the SQLite database directly from `db_url` with `axios.get(dbUrl, { responseType: "arraybuffer" })`. That URL is not a CCBP API endpoint in `api.ts`; it comes from the SQL questions response.

### Coding Question Sets

`getCodingQuestionsSummary(client, questionSetId)`

```text
POST /api/nkb_coding_practice/user/coding/questions/summary/?offset=0&length=999
payload:
{
  question_set_id
}
```

Returns question IDs, status, difficulty, applicable languages, and max score.

`getCodingQuestions(client, questionIds)`

```text
POST /api/nkb_coding_practice/user/coding/questions/
payload:
{
  question_ids
}
```

Returns full problem statements, templates, latest saved code, and sample tests.

`startCodingQuestion(client, questionId)`

```text
POST /api/nkb_coding_practice/coding/question/start/
payload:
{
  question_id,
  should_mark_attempted: true
}
```

Starts the question on the server. The runner calls this before submit because the backend can reject submissions if the user-question record does not exist.

`submitCodingAnswers(client, responses)`

```text
POST /api/nkb_coding_practice/question/coding/submit/
payload:
{
  responses: [
    {
      question_id,
      time_spent,
      coding_answer: {
        code_content,
        language
      }
    }
  ]
}
```

Returns immediate evaluation results.

The API wrapper also has two currently unused helpers:

`submitCodingAnswersV2(client, responses)`

```text
POST /api/nkb_coding_practice/question/coding/submit/v2/
```

Returns async evaluation IDs.

`getCodingSubmissionStatus(client, submissionId)`

```text
POST /api/nkb_coding_practice/question/coding/submission/
payload:
{
  submission_id
}
```

Polls async submission status.

`saveCodingAnswer(client, questionId, codeContent, language)`

```text
POST /api/nkb_coding_practice/question/coding/save/
payload:
{
  responses: [
    {
      question_id,
      coding_answer: {
        code_content,
        language
      }
    }
  ]
}
```

This helper exists in `api.ts`, but the current runner does not call it.

## Course Execution Flow

`run(client, config)` in `src/runner.ts` loops through each selected course.

For each selected course:

1. Calls `getCourseDetails(course_id)`.
2. Sorts returned topics by `order`.
3. Applies the user's topic limit.
4. Processes each selected topic sequentially.

For each topic:

1. Skips if `is_topic_locked`.
2. Skips if `skipCompleted` is true and topic status is `COMPLETED`.
3. Calls `getTopicUnits(topic_id, course_id)`.
4. Groups returned units by type:
   `LEARNING_SET`, `PRACTICE`, `QUESTION_SET`.
5. Filters grouped units by selected mode.
6. Runs handlers with concurrency limits:
   learning sets at 8 at a time, practice sets at 3 at a time, question sets at 2 at a time.

The concurrency helper uses a small semaphore and `Promise.allSettled`, so one failed unit does not stop sibling units in the same group.

## Learning Set Flow

`handleLearningSet()`:

1. Resolve display name from `learning_resource_set_unit_details.name`.
2. If already `COMPLETED`, skip.
3. Call `completeLearningSet(unit.unit_id)`.
4. Log success or debug-log the Axios error.
5. Sleep for `delayMs`.

There is no AI involved in learning sets.

## Practice Exam Flow

`handlePracticeSet()`:

1. Resolve display name from `practice_unit_details.name`.
2. Skip if `completion_percentage >= 100`.
3. Skip if unit is locked.
4. Create an exam attempt with `createExamAttempt(unit.unit_id)`.
5. Fetch questions with `getExamQuestions(examAttemptId)`.
6. Solve all MCQ questions using `solveAll(questions)`.
7. Build response objects with simulated `time_spent`.
8. Submit all answers with `submitAnswers()`.
9. Compute percent from `correct_answer_count / total_questions_count`.
10. End the attempt with `endExamAttempt()`.

Practice retry behavior:

```text
threshold: 75%
max attempts: 3
```

If a submitted practice score is below 75%, the runner creates a fresh exam attempt and repeats the solve/submit/end cycle until the score reaches 75% or 3 attempts have been used.

MCQ fallback behavior:

If a question cannot be solved by Cerebras, `solveAll()` picks the first option rather than leaving the question blank.

## Question Set Detection

`handleQuestionSet()` first tries the SQL endpoint:

```text
getSqlQuestions(unit.unit_id)
```

If that succeeds and returns questions, it treats the unit as SQL. If it fails or returns no questions, it treats the unit as coding and uses the coding endpoints.

This is why SQL question sets are detected before coding question sets.

## SQL Question Set Flow

For SQL question sets:

1. Call `getSqlQuestions(question_set_id)`.
2. Filter questions whose `question_status` is not `CORRECT` or `COMPLETED`.
3. Extract HTML/text context from `learning_resource_details.content`.
4. Read `db_url` from the response.
5. Download the SQLite DB from `db_url`.
6. Use `sql.js` to inspect real tables and columns:
   `sqlite_master` for table names and `PRAGMA table_info(table)` for columns.
7. Ask Cerebras to solve unanswered SQL questions in batches of 10.
8. Submit each SQL answer one at a time.
9. If an answer is incorrect, send the failed SQL plus server error/failure details back to Cerebras with `refineSqlAnswer()`.
10. Retry each SQL question up to 5 AI-fix attempts.
11. Retry network/5xx submit errors up to 3 times with exponential backoff.
12. Re-fetch SQL questions after all submits and resubmit any still not correct using cached SQL answers.

SQL output expected from Cerebras:

```json
{
  "<question_id>": "SELECT ..."
}
```

If JSON parsing fails for a batch, the solver falls back to one-question-at-a-time SQL generation.

## Coding Question Set Flow

For coding question sets:

1. Call `getCodingQuestionsSummary(question_set_id)`.
2. Filter questions whose status is not `CORRECT` or `COMPLETED`.
3. Call `getCodingQuestions(question_ids)` for full statements/templates/tests.
4. Pick a language with this preference:
   `PYTHON`, `NODE_JS`, `CPP`, `JAVA`, then first available.
5. Build a prompt from the problem statement, examples, chosen language, and starter template.
6. Ask Cerebras for complete code.
7. JSON-stringify the code for the CCBP `code_content` format.
8. Call `startCodingQuestion(question_id)`.
9. Submit with `submitCodingAnswers()`.
10. After all questions, re-fetch the coding summary.
11. For any still not correct, fetch details again, regenerate code, start the question, and resubmit once.

Coding answer cleanup:

The solver strips `<think>...</think>` blocks and markdown code fences before submission.

If Cerebras fails for a coding problem, the runner falls back to submitting the default template rather than crashing the whole unit.

## Cerebras Solver Architecture

`src/solver.ts` owns all AI calls.

Initialization:

```ts
initCerebras(apiKey)
```

This creates a singleton Cerebras client.

Chat completions use:

```ts
cerebras.chat.completions.create({
  model,
  messages,
  max_completion_tokens,
  temperature,
  top_p,
  stream: false
})
```

Model order:

```text
1. gpt-oss-120b
2. qwen-3-235b-a22b-instruct-2507
3. llama3.1-8b
```

Rate-limit behavior:

1. A 429/rate-limit error marks that model on cooldown for 60 seconds.
2. Non-rate-limited primary models are tried first.
3. If both primary models are rate-limited, the fallback model `llama3.1-8b` is used.
4. If all models are rate-limited, the solver cycles through them by earliest cooldown expiry so the operation still has a model to try.

MCQ solving:

1. Strip HTML from the question and option text.
2. Assign options letters `A` through `H`.
3. Ask Cerebras to reason and end with `Answer: X`.
4. Parse the answer in this order:
   `Answer: X`, bare final letter, inline answer phrase, UUID fallback, first option fallback.
5. Return the matching CCBP `option_id`.

SQL solving:

1. Build a schema-aware prompt.
2. Prefer real DB schema from SQLite introspection.
3. Ask for JSON mapping `question_id` to SQL.
4. Strip reasoning and markdown fences.
5. Parse JSON.
6. Fall back to individual SQL generation if batch parsing fails.

Coding solving:

1. Decode CCBP's JSON-stringified code template.
2. Prefer latest saved code if it is meaningfully longer than the default template.
3. Build a prompt with problem text, examples, language, and template.
4. Add C++-specific rules when language is `CPP` so Cerebras does not add `main()`.
5. Strip reasoning and markdown fences from the model output.
6. Return plain code.

## Error Handling Model

Top-level:

- `index.ts` catches HTTP `401`, clears browser session, and restarts login.
- Other top-level unexpected errors are printed and exit the process.

Unit-level:

- Most unit handlers catch their own API errors, log a spinner warning/failure, debug-log details when `DEBUG=1`, and continue with later units.
- `ConcurrencyLimiter.runAll()` uses `Promise.allSettled`, so sibling units continue even if one handler fails.

AI-level:

- Cerebras model failures rotate to the next model.
- Rate limits trigger a 60-second per-model cooldown.
- MCQ total failure chooses first option.
- SQL refinement failure returns the previous SQL.
- Coding solve failure submits the default template.

## Debugging

Run:

```bash
DEBUG=1 npm run dev
```

Debug output includes:

- Axios request URL/body and response body for API errors
- SQL prompts and raw Cerebras responses
- SQL refinement prompts
- Coding prompts and response previews
- DB schema fetch failures
- Network retry timing

## Build And Publish

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

`tsup` bundles `src/index.ts` into `dist/index.js`, adds the Node shebang, and copies `curriculum.json` into `dist/curriculum.json`.

Publish:

```bash
npm run prepublishOnly
```

The package binary is:

```json
{
  "bin": {
    "niatbuttcracker": "./dist/index.js"
  }
}
```

## Important Implementation Notes

- The app is Cerebras-only.
- CCBP request bodies must be double-encoded.
- Browser login is required because the token is captured from real CCBP requests.
- `curriculum.json` is local and drives semester/course prompts.
- Course/topic/unit details are fetched from CCBP after selection.
- `skipCompleted` is hardcoded to `true`.
- `delayMs` is hardcoded to `100`.
- Topic processing is sequential per course.
- Unit processing inside a topic is concurrent by group.
- Learning sets do not use AI.
- Practice sets use MCQ solving and can retry low scores.
- SQL sets use DB schema introspection and answer refinement.
- Coding sets start the question before submit and verify after submitting.
