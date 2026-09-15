import OpenAI from "openai";
import axios from "axios";
import { debug } from "./logger.js";
import type {
  Question,
  QuestionOption,
  SqlQuestion,
  CodingQuestionDetail,
  CodingLanguage,
} from "./types.js";

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

const API_BASE_URL = "https://opencode.ai/zen/v1";

const MODELS = [
  "big-pickle",
  "deepseek-v4-flash-free",
  "mimo-v2.5-free",
  "laguna-s-2.1-free",
  "nemotron-3-ultra-free",
  "north-mini-code-free",
];

let openaiClient: OpenAI | null = null;

export function initAI(apiKey?: string): void {
  openaiClient = new OpenAI({
    apiKey: apiKey || "placeholder",
    baseURL: API_BASE_URL,
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      headers.delete("authorization");
      return fetch(url, { ...init, headers });
    },
  });
}

async function createChatCompletion(
  model: string,
  request: {
    messages: ChatMessage[];
    maxCompletionTokens: number;
    temperature?: number;
    topP?: number;
  },
): Promise<string> {
  if (!openaiClient) {
    throw new Error("AI not initialised. Call initAI() first.");
  }

  const TIMEOUT_MS = 45000;

  // AbortController actually cancels the underlying request on timeout;
  // a bare Promise.race would leave it running and risk an unhandled rejection.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await openaiClient.chat.completions.create(
      {
        model,
        messages: request.messages,
        max_completion_tokens: request.maxCompletionTokens,
        temperature: request.temperature ?? 0,
        top_p: request.topP ?? 1,
        stream: false,
      },
      { signal: controller.signal },
    );
    return completion.choices?.[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`Request timed out after ${TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function withModelRotation<T>(
  label: string,
  operation: (model: string) => Promise<T>,
): Promise<T> {
  const attempted = new Set<string>();
  let lastError: unknown;

  for (const model of MODELS) {
    if (attempted.has(model)) continue;
    attempted.add(model);

    const start = Date.now();
    try {
      const result = await operation(model);
      debug(`[solver] ${label} OK model="${model}" ${Date.now() - start}ms`);
      return result;
    } catch (err) {
      const elapsed = Date.now() - start;
      console.warn(
        `[solver] ${label} model "${model}" FAILED after ${elapsed}ms — trying next...`,
      );
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`All models failed for ${label}.`);
}

function stripHtml(text: string): string {
  return text
    .replace(/<img[^>]*>/gi, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

// ── MCQ Prompt Builder ────────────────────────────────────────────────────────

function buildPrompt(question: Question): {
  prompt: string;
  letterToId: Map<string, string>;
} {
  const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const letterToId = new Map<string, string>();
  const parts: string[] = [];

  const questionText = stripHtml(question.question.content);

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
    const text = stripHtml(opt.content);
    parts.push(`  ${letter}) ${text}`);
    letterToId.set(letter, opt.option_id);
  }

  parts.push(
    "",
    "Instructions:",
    "1. Read the question and ALL options carefully.",
    "2. For each option, briefly state whether it is correct or incorrect and why.",
    "3. If this is a code question, trace through the code step by step.",
    "4. After evaluating all options, state your final answer.",
    "5. End your response with EXACTLY this line (nothing else after it):",
    "   Answer: <letter>",
  );

  return { prompt: parts.join("\n"), letterToId };
}

function pickBestOptionId(
  responseText: string,
  options: QuestionOption[],
  letterToId: Map<string, string>,
): string {
  // Strip thinking tags if present
  const cleaned = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Priority 1: "Answer: X" at the end (most reliable — our prompt asks for this)
  const lastLineMatch = cleaned.match(/answer[:\s]+([A-H])\s*$/im);
  if (lastLineMatch) {
    const letter = lastLineMatch[1]!.toUpperCase();
    const id = letterToId.get(letter);
    if (id) return id;
  }

  // Priority 2: "Answer: X" anywhere in the text
  const anywhereMatch = cleaned.match(/answer[:\s]+([A-H])\b/i);
  if (anywhereMatch) {
    const letter = anywhereMatch[1]!.toUpperCase();
    const id = letterToId.get(letter);
    if (id) return id;
  }

  // Priority 3: "the answer is X" / "the correct answer is X" / "correct option is X"
  const phraseMatch = cleaned.match(
    /(?:the\s+)?(?:correct\s+)?answer\s+is\s+([A-H])\b/i,
  );
  if (phraseMatch) {
    const letter = phraseMatch[1]!.toUpperCase();
    const id = letterToId.get(letter);
    if (id) return id;
  }

  // Priority 4: look at the last 5 non-empty lines for a bare letter
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
    const inlineMatch = line.match(
      /\b(?:answer(?:\s+is)?|option|choose|select)[:\s]+([A-H])\b/i,
    );
    if (inlineMatch) {
      const letter = inlineMatch[1]!.toUpperCase();
      const id = letterToId.get(letter);
      if (id) return id;
    }
  }

  // Priority 5: UUID in response matching an option_id
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

  // Fallback: first option
  return options[0]!.option_id;
}

// ── Single Question Solver ────────────────────────────────────────────────────

export async function solveQuestion(question: Question): Promise<string> {
  const { prompt, letterToId } = buildPrompt(question);

  const raw = await withModelRotation("MCQ", (model) =>
    createChatCompletion(model, {
      messages: [
        {
          role: "system",
          content:
            "You are an expert academic tutor. You will be given a multiple-choice question with options labeled A, B, C, D, etc.\n\n" +
            "RULES:\n" +
            "- Carefully analyze EACH option before choosing.\n" +
            "- For code/tracing questions, trace through the code line by line with concrete values.\n" +
            "- For theory questions, use your domain knowledge to eliminate wrong answers.\n" +
            "- Do NOT guess. If unsure, reason through each option by elimination.\n" +
            "- Your LAST line must be exactly: Answer: X (where X is the letter A-D).\n" +
            "- Nothing may appear after the Answer: line.",
        },
        { role: "user", content: prompt },
      ],
      maxCompletionTokens: 1024,
      temperature: 0,
    }),
  );

  debug(`[MCQ] AI raw response:\n${raw}`);
  return pickBestOptionId(raw, question.options, letterToId);
}

// ── Batch Solver ──────────────────────────────────────────────────────────────

export async function solveAll(
  questions: Question[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const answers = new Map<string, string>();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;

    if (
      q.question_type !== "MULTIPLE_CHOICE" &&
      q.question_type !== "CODE_ANALYSIS_MULTIPLE_CHOICE"
    ) {
      answers.set(q.question_id, q.options[0]?.option_id ?? "");
      onProgress?.(i + 1, questions.length);
      continue;
    }

    try {
      const optionId = await solveQuestion(q);
      answers.set(q.question_id, optionId);
    } catch {
      answers.set(q.question_id, q.options[0]?.option_id ?? "");
    }

    onProgress?.(i + 1, questions.length);
  }

  return answers;
}

// ── SQL Solver ────────────────────────────────────────────────────────────────

export async function fetchDbSchema(dbUrl: string): Promise<string> {
  if (!dbUrl) return "";
  try {
    const res = await axios.get<ArrayBuffer>(dbUrl, { responseType: "arraybuffer", timeout: 10000 });
    const buf = Buffer.from(res.data);

    const initSqlJs = (await import("sql.js")).default;
    const SQL = await initSqlJs();
    const db = new SQL.Database(buf);

    const tables: string[] = db
      .exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .flatMap((r) => r.values.map((v) => String(v[0])));

    if (tables.length === 0) return "";

    const schemaParts: string[] = [];
    for (const table of tables) {
      const cols = db
        .exec(`PRAGMA table_info(${table})`)
        .flatMap((r) => r.values.map((v) => `${v[1]} ${v[2]}`));
      schemaParts.push(`TABLE ${table} (${cols.join(", ")})`);
    }

    db.close();
    return schemaParts.join("\n");
  } catch (err) {
    debug("[fetchDbSchema] Failed to fetch/parse DB:", err instanceof Error ? err.message : err);
    return "";
  }
}

function buildSqlPrompt(questions: SqlQuestion[], dbContext: string, realSchema: string): string {
  const description = stripHtml(dbContext).replace(/\r\n/g, "\n");

  const parts: string[] = [
    "You are an expert SQL developer. Given the database schema below, write correct SQL queries for each question.",
    "",
  ];

  if (realSchema) {
    parts.push("ACTUAL DATABASE SCHEMA (use EXACTLY these table/column names):");
    parts.push(realSchema);
  } else if (description) {
    parts.push("Database context:");
    parts.push(description);
  } else {
    parts.push("(No schema provided — infer table/column names from starter SQL and question text)");
  }

  parts.push("", "Questions:");

  for (const q of questions) {
    const text = stripHtml(q.question.content);
    const starter = stripHtml(q.default_code?.code_content ?? "");
    parts.push(`\n[${q.question_id}]\n${text}`);
    if (starter && starter !== "SELECT" && starter.length > 2) {
      parts.push(`Starter SQL (shows column/table names):\n${starter}`);
    }
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
  realSchema: string,
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const answers = new Map<string, string>();
  debug(`[SQL Solver] Schema: ${realSchema ? realSchema.slice(0, 200) : "(none)"}`);

  const BATCH = 10;
  let done = 0;

  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const prompt = buildSqlPrompt(batch, dbContext, realSchema);

    debug(`[SQL Solver] Prompt for batch ${Math.floor(i / BATCH) + 1}:\n${prompt}`);

    let parsed: Record<string, string> = {};
    let parseFailed = false;

    try {
      const raw = await withModelRotation("SQL", (model) =>
        createChatCompletion(model, {
          messages: [
            {
              role: "system",
              content:
                "You are an expert SQL developer. Respond only with the requested JSON object. No markdown, no commentary.",
            },
            { role: "user", content: prompt },
          ],
          maxCompletionTokens: 2048,
          temperature: 0,
        }),
      );

      debug(`[SQL Solver] Raw AI response:\n${raw}`);
      const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      const cleaned = noThink
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned) as Record<string, string>;
      debug(`[SQL Solver] Parsed ${Object.keys(parsed).length} answers`);
    } catch {
      parseFailed = true;
    }

    if (Object.keys(parsed).length === 0 && parseFailed) {
      for (const q of batch) {
        const starter = stripHtml(q.default_code?.code_content ?? "");
        const fallbackPrompt = `Write a single SQL query for the following task. Respond with ONLY the SQL, no explanation.\n\n${realSchema ? `Schema:\n${realSchema}` : `Database:\n${dbContext}`}\n${starter ? `Starter SQL:\n${starter}\n` : ""}\nTask: ${stripHtml(q.question.content)}`;
        try {
          const sql = await withModelRotation("SQL fallback", (model) =>
            createChatCompletion(model, {
              messages: [{ role: "user", content: fallbackPrompt }],
              maxCompletionTokens: 512,
              temperature: 0,
            }),
          );
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

export async function refineSqlAnswer(
  question: SqlQuestion,
  failedSql: string,
  errorMessage: string,
  realSchema: string,
  dbContext: string,
): Promise<string> {
  const schema = realSchema || stripHtml(dbContext);
  const questionText = stripHtml(question.question.content);

  const prompt = [
    "Your previous SQL query returned the WRONG result. Fix it.",
    "",
    schema ? `Database schema:\n${schema}` : "",
    "",
    `Question:\n${questionText}`,
    "",
    `Your WRONG SQL:\n${failedSql}`,
    "",
    `Error / mismatch from the database:\n${errorMessage}`,
    "",
    "Write the CORRECTED SQL. Respond with ONLY the SQL, no explanation, no markdown.",
  ].filter(Boolean).join("\n");

  debug(`[SQL Refine] Retry prompt:\n${prompt}`);

  try {
    const raw = await withModelRotation("SQL refine", (model) =>
      createChatCompletion(model, {
        messages: [
          { role: "system", content: "You are an expert SQL developer. Fix the incorrect SQL query using the error feedback. Respond with ONLY the corrected SQL." },
          { role: "user", content: prompt },
        ],
        maxCompletionTokens: 512,
        temperature: 0,
      }),
    );
    const fixed = raw.replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();
    debug(`[SQL Refine] Fixed SQL:\n${fixed}`);
    return fixed;
  } catch {
    return failedSql;
  }
}

// ── Coding Solver ─────────────────────────────────────────────────────────────

export function pickLanguage(applicable: CodingLanguage[]): CodingLanguage {
  const preference: CodingLanguage[] = ["PYTHON", "NODE_JS", "CPP", "JAVA"];
  for (const lang of preference) {
    if (applicable.includes(lang)) return lang;
  }
  return applicable[0] ?? "PYTHON";
}

export function decodeCodeContent(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    return raw;
  } catch {
    return raw;
  }
}

export function encodeCodeContent(code: string): string {
  return JSON.stringify(code);
}

function buildCodingPrompt(
  q: CodingQuestionDetail,
  lang: CodingLanguage,
  template: string,
): string {
  const questionText = stripHtml(q.question.content);

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

  const outputRule = lang === "CPP"
    ? [
        "CRITICAL RULES FOR C++:",
        "- You MUST fill in the function body inside the existing class.",
        "- Do NOT add int main() or any code outside the class.",
        "- Do NOT change the class name, function signature, or parameters.",
        "- Return the complete file exactly as given: #include lines + class with filled function body.",
        "- The judge calls your function directly — a main() will cause compile errors.",
      ].join("\n")
    : "Respond with ONLY the complete runnable code. No explanation, no markdown fences.";

  return [
    `You are an expert ${langLabel[lang] ?? lang} developer. Solve the following coding problem.`,
    "",
    `Problem:\n${questionText}`,
    "",
    testCasesText ? `Test Cases:\n${testCasesText}` : "",
    "",
    `Language: ${langLabel[lang] ?? lang}`,
    "",
    `TEMPLATE TO COMPLETE (keep all existing structure, only fill the function body):\n\`\`\`${lang === "CPP" ? "cpp" : ""}\n${template}\n\`\`\``,
    "",
    outputRule,
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
  const defaultTemplate = decodeCodeContent(q.code.code_content);
  const savedTemplate = q.latest_saved_code
    ? decodeCodeContent(q.latest_saved_code.code_content)
    : null;
  const template = (savedTemplate && savedTemplate.length > defaultTemplate.length + 20)
    ? savedTemplate
    : defaultTemplate;

  const prompt = buildCodingPrompt(q, lang, template);
  debug(`[Coding] Prompt for "${q.question.short_text}":\n${prompt}`);

  const systemMessage = lang === "CPP"
    ? "You are an expert C++ competitive programmer. Your output MUST be ONLY the complete file as given: #include lines + the class with the filled function body. ABSOLUTELY NO int main(). No explanation."
    : "You are an expert programmer. Write complete, correct, runnable code. Respond with ONLY the code, no markdown, no commentary.";

  const raw = await withModelRotation("coding question", (model) =>
    createChatCompletion(model, {
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      maxCompletionTokens: 2048,
      temperature: 0,
    }),
  );

  const cleaned = (raw || template)
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  debug(`[Coding] Response:\n${cleaned.slice(0, 300)}...`);
  return cleaned;
}