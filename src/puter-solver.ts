import { debug } from "./logger.js";
import type {
  Question,
  QuestionOption,
  SqlQuestion,
  CodingQuestionDetail,
  CodingLanguage,
} from "./types.js";

import puter from "@heyputer/puter.js";

let puterInitialized = false;

export async function initPuter(): Promise<void> {
  if (puterInitialized) return;

  // In Node.js CLI, Puter browser auth flow (window/screen popup) is unavailable.
  // The AI APIs still work for this project without invoking auth.signIn().
  try {
    await puter.ai.chat([{ role: "user", content: "OK" }], {
      model: PUTER_MODELS[0],
      max_tokens: 8,
      temperature: 0,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Puter initialization failed in Node mode: ${msg}. Switch provider to Groq or retry later.`,
    );
  }

  puterInitialized = true;
  debug("[Puter] Initialized (Node mode, no popup auth)");
}

function extractText(value: unknown): string {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value.map((part) => extractText(part)).join("\n").trim();
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;

    const text = obj.text;
    if (typeof text === "string") return text;

    const content = obj.content;
    if (content !== undefined) return extractText(content);

    const message = obj.message;
    if (message !== undefined) return extractText(message);
  }

  return "";
}

function getChatText(response: unknown): string {
  const direct = extractText(response);
  if (direct) return direct;

  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    const choices = obj.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0] as Record<string, unknown>;
      const choiceText = extractText(first.message ?? first);
      if (choiceText) return choiceText;
    }
  }

  return String(response ?? "");
}

function buildMessages(systemPrompt: string, userPrompt: string): Array<{ role: string; content: string }> {
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

// ── Model selection ───────────────────────────────────────────────────────────

const PUTER_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash-lite-preview",
];

let currentModelIndex = 0;

function getNextModel(): string {
  const model = PUTER_MODELS[currentModelIndex % PUTER_MODELS.length]!;
  currentModelIndex++;
  return model;
}

// ── MCQ Prompt Builder (same as Groq solver) ─────────────────────────────────

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

function pickBestOptionId(
  responseText: string,
  options: QuestionOption[],
  letterToId: Map<string, string>,
): string {
  const cleaned = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 1. Look for "Answer: X"
  const answerLineMatch = cleaned.match(/answer[:\s]+([A-H])\b/i);
  if (answerLineMatch) {
    const letter = answerLineMatch[1]!.toUpperCase();
    const id = letterToId.get(letter);
    if (id) return id;
  }

  // 2. Check last few lines for bare letter
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

  // 3. UUID scan
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

  return options[0]!.option_id;
}

// ── Single Question Solver ────────────────────────────────────────────────────

export async function solveQuestion(question: Question): Promise<string> {
  if (!puterInitialized) {
    throw new Error("Puter not initialized. Call initPuter() first.");
  }

  const { prompt, letterToId } = buildPrompt(question);
  let lastError: unknown;

  // Try both models
  for (let attempt = 0; attempt < PUTER_MODELS.length; attempt++) {
    const model = getNextModel();

    try {
      debug(`[Puter] Trying model: ${model}`);

      const response = await puter.ai.chat(buildMessages(
        "You are an expert tutor and problem-solver with deep knowledge across computer science, " +
          "mathematics, science, languages, and general academia. " +
          "When given a multiple-choice question, reason through it carefully before answering. " +
          "Always end your response with 'Answer: X' where X is the letter of the correct option.",
        prompt,
      ), {
        model,
      });

      const responseText = getChatText(response);
      debug(`[Puter] Response from ${model}: ${responseText.slice(0, 200)}...`);
      return pickBestOptionId(responseText, question.options, letterToId);
    } catch (err) {
      console.warn(`[puter-solver] Model "${model}" failed — trying next…`);
      lastError = err;
      debug(`[Puter] Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Puter models failed for MCQ.");
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

    if (i < questions.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return answers;
}

// ── SQL Solver ────────────────────────────────────────────────────────────────

function buildSqlPrompt(questions: SqlQuestion[], dbContext: string, realSchema: string): string {
  const description = dbContext
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

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
    const text = q.question.content.replace(/<[^>]+>/g, "").trim();
    const starter = q.default_code?.code_content?.replace(/<[^>]+>/g, "").trim();
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
  if (!puterInitialized) {
    throw new Error("Puter not initialized. Call initPuter() first.");
  }

  const answers = new Map<string, string>();
  debug(`[SQL Solver Puter] Schema: ${realSchema ? realSchema.slice(0, 200) : "(none)"}`);

  const BATCH = 10;
  let done = 0;

  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const prompt = buildSqlPrompt(batch, dbContext, realSchema);

    let parsed: Record<string, string> = {};
    let lastError: unknown;

    for (let attempt = 0; attempt < PUTER_MODELS.length; attempt++) {
      const model = getNextModel();

      try {
        const response = await puter.ai.chat(buildMessages(
          "You are an expert SQL developer. Respond only with the requested JSON object. No markdown, no commentary.",
          prompt,
        ), {
          model,
        });

        const responseText = getChatText(response);
        debug(`[SQL Solver Puter] Raw response (${model}):\n${responseText}`);
        const noThink = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        const cleaned = noThink
          .replace(/^```[a-z]*\n?/i, "")
          .replace(/\n?```$/i, "")
          .trim();
        parsed = JSON.parse(cleaned);
        debug(`[SQL Solver Puter] Parsed ${Object.keys(parsed).length} answers`);
        break;
      } catch (err) {
        console.warn(`[puter-solver] SQL model "${model}" failed — trying next…`);
        lastError = err;
      }
    }

    // Fallback: solve individually
    if (Object.keys(parsed).length === 0 && lastError) {
      for (const q of batch) {
        const starter = q.default_code?.code_content?.replace(/<[^>]+>/g, "").trim() ?? "";
        const fallbackPrompt = `Write a single SQL query for the following task. Respond with ONLY the SQL, no explanation.\n\n${realSchema ? `Schema:\n${realSchema}` : `Database:\n${dbContext}`}\n${starter ? `Starter SQL:\n${starter}\n` : ""}\nTask: ${q.question.content.replace(/<[^>]+>/g, "")}`;

        try {
          const model = getNextModel();
          const response = await puter.ai.chat([{ role: "user", content: fallbackPrompt }], { model });
          const sql = getChatText(response).trim();
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
  if (!puterInitialized) {
    throw new Error("Puter not initialized. Call initPuter() first.");
  }

  const schema = realSchema || dbContext.replace(/<[^>]+>/g, "").trim();
  const questionText = question.question.content.replace(/<[^>]+>/g, "").trim();

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

  debug(`[SQL Refine Puter] Retry prompt:\n${prompt}`);

  for (let attempt = 0; attempt < PUTER_MODELS.length; attempt++) {
    const model = getNextModel();

    try {
      const response = await puter.ai.chat(buildMessages(
        "You are an expert SQL developer. Fix the incorrect SQL query using the error feedback. Respond with ONLY the corrected SQL.",
        prompt,
      ), {
        model,
      });

      const fixed = getChatText(response).replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();
      debug(`[SQL Refine Puter] Fixed SQL (${model}):\n${fixed}`);
      return fixed;
    } catch {
      // try next model
    }
  }

  return failedSql;
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
  const questionText = q.question.content
    .replace(/<br\s*\/?>\n?/gi, "\n")
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

  const outputRule = lang === "CPP"
    ? [
        "CRITICAL RULES FOR C++:",
        "- You MUST fill in the function body inside the existing class.",
        "- Do NOT add int main() or any code outside the class.",
        "- Do NOT change the class name, function signature, or parameters.",
        "- Return the complete file exactly as given: #include lines + class with filled function body.",
        "- The judge calls your function directly — a main() will cause compile errors."
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
  if (!puterInitialized) {
    throw new Error("Puter not initialized. Call initPuter() first.");
  }

  const defaultTemplate = decodeCodeContent(q.code.code_content);
  const savedTemplate = q.latest_saved_code
    ? decodeCodeContent(q.latest_saved_code.code_content)
    : null;
  const template = (savedTemplate && savedTemplate.length > defaultTemplate.length + 20)
    ? savedTemplate
    : defaultTemplate;

  const prompt = buildCodingPrompt(q, lang, template);
  debug(`[Coding Puter] Prompt for "${q.question.short_text}":\n${prompt}`);

  const systemMessage = lang === "CPP"
    ? "You are an expert C++ competitive programmer. Your output MUST be ONLY the complete file as given: #include lines + the class with the filled function body. ABSOLUTELY NO int main(). No explanation."
    : "You are an expert programmer. Write complete, correct, runnable code. Respond with ONLY the code, no markdown, no commentary.";

  let lastError: unknown;

  for (let attempt = 0; attempt < PUTER_MODELS.length; attempt++) {
    const model = getNextModel();

    try {
      const response = await puter.ai.chat(buildMessages(systemMessage, prompt), {
        model,
      });

      const cleaned = getChatText(response)
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();

      debug(`[Coding Puter] Response (${model}):\n${cleaned.slice(0, 300)}...`);
      return cleaned;
    } catch (err) {
      console.warn(`[puter-solver] Coding model "${model}" failed — trying next…`);
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Puter models failed for coding question.");
}

// Re-export fetchDbSchema from groq solver (shared utility)
export { fetchDbSchema } from "./solver.js";
