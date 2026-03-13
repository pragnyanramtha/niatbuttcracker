import Groq from "groq-sdk";
import type {
  Question,
  QuestionOption,
  SqlQuestion,
  CodingQuestionDetail,
  CodingLanguage,
} from "./types.js";

let groqClient: Groq | null = null;

export function initGroq(apiKey: string): void {
  groqClient = new Groq({ apiKey });
}

// ── Model List ────────────────────────────────────────────────────────────────

const MODELS = [
  "openai/gpt-oss-120b",
  "moonshotai/kimi-k2-instruct-0905",
  "moonshotai/kimi-k2-instruct",
  "llama-3.3-70b-versatile",
];

// ── Per-model rate-limit cooldown ─────────────────────────────────────────────
// Maps model id → the ms timestamp at which it was rate-limited.
// A model stays in cooldown for RATE_LIMIT_COOLDOWN_MS after a 429.

const RATE_LIMIT_COOLDOWN_MS = 60_000;
const modelRateLimitedAt = new Map<string, number>();

function markRateLimited(model: string): void {
  modelRateLimitedAt.set(model, Date.now());
  const readyAt = new Date(
    Date.now() + RATE_LIMIT_COOLDOWN_MS,
  ).toLocaleTimeString();
  console.warn(`[solver] "${model}" rate-limited — skipping until ${readyAt}`);
}

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === "object") {
    const status = (err as { status?: number }).status;
    if (status === 429) return true;
    const msg = (err as { message?: string }).message ?? "";
    if (/rate.?limit|429|too many requests/i.test(msg)) return true;
  }
  return false;
}

/**
 * Returns the models to try for a single request:
 *   1. Non-rate-limited models first, in their original MODELS order.
 *   2. If ALL models are currently rate-limited, fall back to all of them
 *      sorted by soonest cooldown expiry — so we always have something to
 *      try and never crash with "no models available".
 *
 * Expired cooldowns are cleaned up automatically.
 */
function getModelOrder(): string[] {
  const now = Date.now();
  const fresh: string[] = [];
  const limited: Array<{ model: string; readyAt: number }> = [];

  for (const model of MODELS) {
    const at = modelRateLimitedAt.get(model);
    if (at === undefined || now - at >= RATE_LIMIT_COOLDOWN_MS) {
      if (at !== undefined) modelRateLimitedAt.delete(model); // expired — clean up
      fresh.push(model);
    } else {
      limited.push({ model, readyAt: at + RATE_LIMIT_COOLDOWN_MS });
    }
  }

  if (fresh.length > 0) return fresh;

  // All rate-limited — cycle through sorted by soonest recovery
  console.warn(`[solver] All models are rate-limited. Cycling through anyway…`);
  limited.sort((a, b) => a.readyAt - b.readyAt);
  return limited.map((l) => l.model);
}

// ── MCQ Prompt Builder ────────────────────────────────────────────────────────

/**
 * Build a prompt that uses A/B/C/D labels (LLMs are trained on this format)
 * and explicitly asks the model to reason before committing to an answer.
 * Returns both the prompt string and the letter→option_id mapping.
 */
function buildPrompt(question: Question): {
  prompt: string;
  letterToId: Map<string, string>;
} {
  const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const letterToId = new Map<string, string>();
  const parts: string[] = [];

  const questionText = question.question.content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  parts.push(`Question:\n${questionText}`);

  if (question.code_analysis?.code_details) {
    const { code, language } = question.code_analysis.code_details;
    parts.push(
      `\nCode (${language}):\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``,
    );
  }

  parts.push("\nOptions:");
  for (let i = 0; i < question.options.length; i++) {
    const opt = question.options[i]!;
    const letter = LETTERS[i] ?? String(i + 1);
    const text = opt.content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    parts.push(`  ${letter}) ${text}`);
    letterToId.set(letter, opt.option_id);
  }

  parts.push(
    "\nAnalyze the question carefully and think step by step.",
    "Then end your response with exactly this line:",
    "Answer: X",
    "where X is the single letter of the correct option (A, B, C, D, …).",
  );

  return { prompt: parts.join("\n"), letterToId };
}

/**
 * Parse the model's response to find the chosen option_id.
 * Priority:
 *   1. "Answer: X" line anywhere in the response (handles <think> blocks too)
 *   2. Standalone letter on the last non-empty line
 *   3. UUID scan (legacy fallback)
 *   4. First option (last-resort fallback)
 */
function pickBestOptionId(
  responseText: string,
  options: QuestionOption[],
  letterToId: Map<string, string>,
): string {
  // Strip <think>...</think> reasoning blocks emitted by some models
  const cleaned = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 1. Look for "Answer: X" (case-insensitive, anywhere)
  const answerLineMatch = cleaned.match(/answer[:\s]+([A-H])\b/i);
  if (answerLineMatch) {
    const letter = answerLineMatch[1]!.toUpperCase();
    const id = letterToId.get(letter);
    if (id) return id;
  }

  // 2. Check the last few non-empty lines for a bare letter
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const line = lines[i]!;
    const bareLetterMatch = line.match(/^([A-H])[).:\s]*$/i);
    if (bareLetterMatch) {
      const letter = bareLetterMatch[1]!.toUpperCase();
      const id = letterToId.get(letter);
      if (id) return id;
    }
    // "The answer is B" / "Option C" / "Choose D" patterns
    const inlineMatch = line.match(
      /\b(?:answer(?:\s+is)?|option|choose|select)[:\s]+([A-H])\b/i,
    );
    if (inlineMatch) {
      const letter = inlineMatch[1]!.toUpperCase();
      const id = letterToId.get(letter);
      if (id) return id;
    }
  }

  // 3. UUID scan (handles models that ignored the letter format)
  const uuidPattern =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const uuidMatches = responseText.match(uuidPattern) ?? [];
  const optionIdSet = new Set(options.map((o) => o.option_id.toLowerCase()));
  for (const match of uuidMatches) {
    if (optionIdSet.has(match.toLowerCase())) {
      return options.find(
        (o) => o.option_id.toLowerCase() === match.toLowerCase(),
      )!.option_id;
    }
  }

  // 4. Last resort
  return options[0]!.option_id;
}

// ── Single Question Solver ────────────────────────────────────────────────────

export async function solveQuestion(question: Question): Promise<string> {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");

  const { prompt, letterToId } = buildPrompt(question);
  let lastError: unknown;

  for (const model of getModelOrder()) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert tutor and problem-solver with deep knowledge across computer science, " +
              "mathematics, science, languages, and general academia. " +
              "When given a multiple-choice question, reason through it carefully before answering. " +
              "Always end your response with 'Answer: X' where X is the letter of the correct option.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0,
      });

      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      return pickBestOptionId(raw, question.options, letterToId);
    } catch (err) {
      if (isRateLimitError(err)) {
        markRateLimited(model);
      } else {
        console.warn(`[solver] Model "${model}" failed — trying next…`);
      }
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Groq models failed for MCQ.");
}

// ── Batch Solver ──────────────────────────────────────────────────────────────

export async function solveAll(
  questions: Question[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const answers = new Map<string, string>();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;

    // Only handle MCQ variants — skip types that require writing code
    if (
      q.question_type !== "MULTIPLE_CHOICE" &&
      q.question_type !== "CODE_ANALYSIS_MULTIPLE_CHOICE"
    ) {
      // Fallback: pick first option rather than leaving blank
      answers.set(q.question_id, q.options[0]?.option_id ?? "");
      onProgress?.(i + 1, questions.length);
      continue;
    }

    try {
      const optionId = await solveQuestion(q);
      answers.set(q.question_id, optionId);
    } catch {
      // On total failure, pick first option as safe fallback
      answers.set(q.question_id, q.options[0]?.option_id ?? "");
    }

    onProgress?.(i + 1, questions.length);

    // Small delay to avoid hitting rate limits
    if (i < questions.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return answers;
}

// ── SQL Solver ────────────────────────────────────────────────────────────────

function buildSqlPrompt(questions: SqlQuestion[], dbContext: string): string {
  const schema = dbContext
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

  const parts: string[] = [
    "You are an expert SQL developer. Given the database schema below, write correct SQL answers for each numbered question.",
    "",
    `Database context:\n${schema}`,
    "",
    "Questions:",
  ];

  for (const q of questions) {
    const text = q.question.content.replace(/<[^>]+>/g, "").trim();
    parts.push(`\n[${q.question_id}]\n${text}`);
  }

  parts.push(
    "\nRespond with ONLY a JSON object mapping each question_id to its SQL answer string, like:",
    '{"<id>": "SELECT ...", "<id2>": "DELETE ..."}',
    "No markdown, no explanations, just the JSON object.",
  );

  return parts.join("\n");
}

export async function solveSqlQuestions(
  questions: SqlQuestion[],
  dbContext: string,
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");

  const answers = new Map<string, string>();
  const BATCH = 10;
  let done = 0;

  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const prompt = buildSqlPrompt(batch, dbContext);

    let parsed: Record<string, string> = {};
    let lastError: unknown;

    for (const model of getModelOrder()) {
      try {
        const completion = await groqClient.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are an expert SQL developer. Respond only with the requested JSON object. No markdown, no commentary.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 2048,
          temperature: 0,
        });

        const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
        // Strip <think> blocks from reasoning models
        const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        // Strip markdown code fences if present
        const cleaned = noThink
          .replace(/^```[a-z]*\n?/i, "")
          .replace(/\n?```$/i, "")
          .trim();
        parsed = JSON.parse(cleaned);
        break;
      } catch (err) {
        if (isRateLimitError(err)) {
          markRateLimited(model);
        } else {
          console.warn(`[solver] SQL model "${model}" failed — trying next…`);
        }
        lastError = err;
      }
    }

    // If batch parse failed, fall back to solving each individually
    if (Object.keys(parsed).length === 0 && lastError) {
      for (const q of batch) {
        const fallbackPrompt =
          `Write a single SQL query for the following task. Respond with ONLY the SQL, no explanation.\n\n` +
          `Database schema:\n${dbContext}\n\nTask:\n${q.question.content.replace(/<[^>]+>/g, "")}`;
        try {
          const [lastModel] = getModelOrder().slice(-1);
          const completion = await groqClient.chat.completions.create({
            model: lastModel ?? MODELS[MODELS.length - 1]!,
            messages: [{ role: "user", content: fallbackPrompt }],
            max_tokens: 512,
            temperature: 0,
          });
          const sql =
            completion.choices[0]?.message?.content?.trim() ?? "SELECT 1;";
          parsed[q.question_id] = sql
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .replace(/^```sql\n?/i, "")
            .replace(/\n?```$/i, "")
            .trim();
        } catch {
          parsed[q.question_id] = "SELECT 1;";
        }
      }
    }

    for (const q of batch) {
      answers.set(q.question_id, parsed[q.question_id] ?? "SELECT 1;");
      done++;
      onProgress?.(done, questions.length);
    }

    if (i + BATCH < questions.length) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  return answers;
}

// ── Coding Solver ─────────────────────────────────────────────────────────────

/** Pick the best language from the available ones (prefer Python, then Node.js, then C++, then Java) */
export function pickLanguage(applicable: CodingLanguage[]): CodingLanguage {
  const preference: CodingLanguage[] = ["PYTHON", "NODE_JS", "CPP", "JAVA"];
  for (const lang of preference) {
    if (applicable.includes(lang)) return lang;
  }
  return applicable[0] ?? "PYTHON";
}

/** Extract the raw code string from the API's double-encoded code_content */
export function decodeCodeContent(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    return raw;
  } catch {
    return raw;
  }
}

/** Re-encode code for submission: code_content must be JSON.stringify(code) */
export function encodeCodeContent(code: string): string {
  return JSON.stringify(code);
}

function buildCodingPrompt(
  q: CodingQuestionDetail,
  lang: CodingLanguage,
  template: string,
): string {
  const questionText = q.question.content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  const testCasesText = q.test_cases
    .map((tc, i) => {
      const inp = decodeCodeContent(tc.input);
      const out = decodeCodeContent(tc.output);
      return `Example ${i + 1}:\n  Input:  ${inp}\n  Output: ${out}`;
    })
    .join("\n");

  const langLabel: Record<string, string> = {
    CPP: "C++",
    JAVA: "Java",
    PYTHON: "Python 3",
    NODE_JS: "Node.js (JavaScript)",
  };

  return [
    `You are an expert ${langLabel[lang] ?? lang} developer. Solve the following coding problem.`,
    "",
    `Problem:\n${questionText}`,
    "",
    testCasesText ? `Test Cases:\n${testCasesText}` : "",
    "",
    `Language: ${langLabel[lang] ?? lang}`,
    "",
    `Starter template (complete or replace as needed):\n\`\`\`\n${template}\n\`\`\``,
    "",
    "Requirements:",
    "- Write complete, runnable code that passes all test cases.",
    "- Read input exactly as shown in the examples.",
    "- Do NOT include any explanation, comments beyond what is needed, or markdown fences.",
    "- Respond with ONLY the complete runnable code.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function solveCodingQuestion(
  q: CodingQuestionDetail,
  lang: CodingLanguage,
): Promise<string> {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");

  const template = decodeCodeContent(q.code.code_content);
  const prompt = buildCodingPrompt(q, lang, template);
  let lastError: unknown;

  for (const model of getModelOrder()) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert competitive programmer. Write complete, correct, runnable code. " +
              "Respond with ONLY the code — no markdown fences, no commentary.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0,
      });

      const raw = completion.choices[0]?.message?.content?.trim() ?? template;
      // Strip <think> blocks and markdown fences
      return raw
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();
    } catch (err) {
      if (isRateLimitError(err)) {
        markRateLimited(model);
      } else {
        console.warn(`[solver] Coding model "${model}" failed — trying next…`);
      }
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Groq models failed for coding question.");
}
