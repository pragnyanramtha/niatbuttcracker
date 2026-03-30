#!/usr/bin/env node

// src/solver.ts
import Groq from "groq-sdk";
import axios from "axios";

// src/logger.ts
import chalk from "chalk";
var IS_DEBUG = process.env.DEBUG === "1";
function debug(label, ...args) {
  if (!IS_DEBUG) return;
  console.log(chalk.gray(`  [DBG] ${label}`), ...args);
}
function debugAxiosError(context, err) {
  if (!IS_DEBUG) return;
  const ax = err;
  if (!ax.isAxiosError) {
    debug(context, err);
    return;
  }
  const res = ax.response;
  console.log(chalk.bgRed.white(`
  [DBG] ${context} \u2014 HTTP ${res?.status ?? "?"}`));
  if (res?.headers) {
    console.log(chalk.gray("  Request URL:"), chalk.dim(ax.config?.url ?? ""));
    console.log(chalk.gray("  Request body:"), chalk.dim(
      typeof ax.config?.data === "string" ? ax.config.data.slice(0, 500) : JSON.stringify(ax.config?.data)
    ));
  }
  console.log(chalk.gray("  Response body:"));
  try {
    console.log(chalk.yellow(JSON.stringify(res?.data, null, 2)));
  } catch {
    console.log(chalk.yellow(String(res?.data)));
  }
  console.log();
}

// src/solver.ts
var groqClient = null;
function initGroq(apiKey) {
  groqClient = new Groq({ apiKey });
}
var MODELS = [
  "openai/gpt-oss-120b",
  "moonshotai/kimi-k2-instruct",
  "llama-3.3-70b-versatile"
];
var RATE_LIMIT_COOLDOWN_MS = 6e4;
var modelRateLimitedAt = /* @__PURE__ */ new Map();
function markRateLimited(model) {
  modelRateLimitedAt.set(model, Date.now());
  const readyAt = new Date(
    Date.now() + RATE_LIMIT_COOLDOWN_MS
  ).toLocaleTimeString();
  console.warn(`[solver] "${model}" rate-limited \u2014 skipping until ${readyAt}`);
}
function isRateLimitError(err) {
  if (err && typeof err === "object") {
    const status = err.status;
    if (status === 429) return true;
    const msg = err.message ?? "";
    if (/rate.?limit|429|too many requests/i.test(msg)) return true;
  }
  return false;
}
function getModelOrder() {
  const now = Date.now();
  const fresh = [];
  const limited = [];
  for (const model of MODELS) {
    const at = modelRateLimitedAt.get(model);
    if (at === void 0 || now - at >= RATE_LIMIT_COOLDOWN_MS) {
      if (at !== void 0) modelRateLimitedAt.delete(model);
      fresh.push(model);
    } else {
      limited.push({ model, readyAt: at + RATE_LIMIT_COOLDOWN_MS });
    }
  }
  if (fresh.length > 0) return fresh;
  console.warn(`[solver] All models are rate-limited. Cycling through anyway\u2026`);
  limited.sort((a, b) => a.readyAt - b.readyAt);
  return limited.map((l) => l.model);
}
function buildPrompt(question) {
  const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const letterToId = /* @__PURE__ */ new Map();
  const parts = [];
  const questionText = question.question.content.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
  parts.push(`Question:
${questionText}`);
  if (question.code_analysis?.code_details) {
    const { code, language } = question.code_analysis.code_details;
    parts.push(
      `
Code (${language}):
\`\`\`${language.toLowerCase()}
${code}
\`\`\``
    );
  }
  parts.push("\nOptions:");
  for (let i = 0; i < question.options.length; i++) {
    const opt = question.options[i];
    const letter = LETTERS[i] ?? String(i + 1);
    const text = opt.content.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
    parts.push(`  ${letter}) ${text}`);
    letterToId.set(letter, opt.option_id);
  }
  parts.push(
    "\nAnalyze the question carefully and think step by step.",
    "Then end your response with exactly this line:",
    "Answer: X",
    "where X is the single letter of the correct option (A, B, C, D, \u2026)."
  );
  return { prompt: parts.join("\n"), letterToId };
}
function pickBestOptionId(responseText, options, letterToId) {
  const cleaned = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const answerLineMatch = cleaned.match(/answer[:\s]+([A-H])\b/i);
  if (answerLineMatch) {
    const letter = answerLineMatch[1].toUpperCase();
    const id = letterToId.get(letter);
    if (id) return id;
  }
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const line = lines[i];
    const bareLetterMatch = line.match(/^([A-H])[).:\s]*$/i);
    if (bareLetterMatch) {
      const letter = bareLetterMatch[1].toUpperCase();
      const id = letterToId.get(letter);
      if (id) return id;
    }
    const inlineMatch = line.match(
      /\b(?:answer(?:\s+is)?|option|choose|select)[:\s]+([A-H])\b/i
    );
    if (inlineMatch) {
      const letter = inlineMatch[1].toUpperCase();
      const id = letterToId.get(letter);
      if (id) return id;
    }
  }
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const uuidMatches = responseText.match(uuidPattern) ?? [];
  const optionIdSet = new Set(options.map((o) => o.option_id.toLowerCase()));
  for (const match of uuidMatches) {
    if (optionIdSet.has(match.toLowerCase())) {
      return options.find(
        (o) => o.option_id.toLowerCase() === match.toLowerCase()
      ).option_id;
    }
  }
  return options[0].option_id;
}
async function solveQuestion(question) {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");
  const { prompt, letterToId } = buildPrompt(question);
  let lastError;
  for (const model of getModelOrder()) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are an expert tutor and problem-solver with deep knowledge across computer science, mathematics, science, languages, and general academia. When given a multiple-choice question, reason through it carefully before answering. Always end your response with 'Answer: X' where X is the letter of the correct option."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      return pickBestOptionId(raw, question.options, letterToId);
    } catch (err) {
      if (isRateLimitError(err)) {
        markRateLimited(model);
      } else {
        console.warn(`[solver] Model "${model}" failed \u2014 trying next\u2026`);
      }
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All Groq models failed for MCQ.");
}
async function solveAll(questions, onProgress) {
  const answers = /* @__PURE__ */ new Map();
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.question_type !== "MULTIPLE_CHOICE" && q.question_type !== "CODE_ANALYSIS_MULTIPLE_CHOICE") {
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
async function fetchDbSchema(dbUrl) {
  if (!dbUrl) return "";
  try {
    const res = await axios.get(dbUrl, { responseType: "arraybuffer", timeout: 1e4 });
    const buf = Buffer.from(res.data);
    const initSqlJs = (await import("sql.js")).default;
    const SQL = await initSqlJs();
    const db = new SQL.Database(buf);
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").flatMap((r) => r.values.map((v) => String(v[0])));
    if (tables.length === 0) return "";
    const schemaParts = [];
    for (const table of tables) {
      const cols = db.exec(`PRAGMA table_info(${table})`).flatMap((r) => r.values.map((v) => `${v[1]} ${v[2]}`));
      schemaParts.push(`TABLE ${table} (${cols.join(", ")})`);
    }
    db.close();
    return schemaParts.join("\n");
  } catch (err) {
    debug("[fetchDbSchema] Failed to fetch/parse DB:", err instanceof Error ? err.message : err);
    return "";
  }
}
function buildSqlPrompt(questions, dbContext, realSchema) {
  const description = dbContext.replace(/<[^>]+>/g, "").replace(/\r\n/g, "\n").trim();
  const parts = [
    "You are an expert SQL developer. Given the database schema below, write correct SQL queries for each question.",
    ""
  ];
  if (realSchema) {
    parts.push("ACTUAL DATABASE SCHEMA (use EXACTLY these table/column names):");
    parts.push(realSchema);
  } else if (description) {
    parts.push("Database context:");
    parts.push(description);
  } else {
    parts.push("(No schema provided \u2014 infer table/column names from starter SQL and question text)");
  }
  parts.push("", "Questions:");
  for (const q of questions) {
    const text = q.question.content.replace(/<[^>]+>/g, "").trim();
    const starter = q.default_code?.code_content?.replace(/<[^>]+>/g, "").trim();
    parts.push(`
[${q.question_id}]
${text}`);
    if (starter && starter !== "SELECT" && starter.length > 2) {
      parts.push(`Starter SQL (shows column/table names):
${starter}`);
    }
  }
  parts.push(
    "\nRespond with ONLY a JSON object mapping each question_id to its SQL answer string, like:",
    '{"<id>": "SELECT ...", "<id2>": "DELETE ..."}',
    "No markdown, no explanations, just the JSON object."
  );
  return parts.join("\n");
}
async function solveSqlQuestions(questions, dbContext, realSchema, onProgress) {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");
  const answers = /* @__PURE__ */ new Map();
  debug(`[SQL Solver] Schema: ${realSchema ? realSchema.slice(0, 200) : "(none \u2014 using description context)"}`);
  const BATCH = 10;
  let done = 0;
  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const prompt = buildSqlPrompt(batch, dbContext, realSchema);
    debug(`[SQL Solver] Prompt for batch ${Math.floor(i / BATCH) + 1}:
${prompt}`);
    let parsed = {};
    let lastError;
    for (const model of getModelOrder()) {
      try {
        const completion = await groqClient.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: "You are an expert SQL developer. Respond only with the requested JSON object. No markdown, no commentary."
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 2048,
          temperature: 0
        });
        const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
        debug(`[SQL Solver] Raw AI response (${model}):
${raw}`);
        const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        const cleaned = noThink.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
        parsed = JSON.parse(cleaned);
        debug(`[SQL Solver] Parsed ${Object.keys(parsed).length} answers`);
        break;
      } catch (err) {
        if (isRateLimitError(err)) {
          markRateLimited(model);
        } else {
          console.warn(`[solver] SQL model "${model}" failed \u2014 trying next\u2026`);
        }
        lastError = err;
      }
    }
    if (Object.keys(parsed).length === 0 && lastError) {
      for (const q of batch) {
        const starter = q.default_code?.code_content?.replace(/<[^>]+>/g, "").trim() ?? "";
        const fallbackPrompt = `Write a single SQL query for the following task. Respond with ONLY the SQL, no explanation.

${realSchema ? `Schema:
${realSchema}` : `Database:
${dbContext}`}
${starter ? `Starter SQL:
${starter}
` : ""}
Task: ${q.question.content.replace(/<[^>]+>/g, "")}`;
        try {
          const [lastModel] = getModelOrder().slice(-1);
          const completion = await groqClient.chat.completions.create({
            model: lastModel ?? MODELS[MODELS.length - 1],
            messages: [{ role: "user", content: fallbackPrompt }],
            max_tokens: 512,
            temperature: 0
          });
          const sql = completion.choices[0]?.message?.content?.trim() ?? "SELECT 1;";
          parsed[q.question_id] = sql.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();
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
async function refineSqlAnswer(question, failedSql, errorMessage, realSchema, dbContext) {
  if (!groqClient) throw new Error("Groq not initialised. Call initGroq() first.");
  const schema = realSchema || dbContext.replace(/<[^>]+>/g, "").trim();
  const questionText = question.question.content.replace(/<[^>]+>/g, "").trim();
  const prompt = [
    "Your previous SQL query returned the WRONG result. Fix it.",
    "",
    schema ? `Database schema:
${schema}` : "",
    "",
    `Question:
${questionText}`,
    "",
    `Your WRONG SQL:
${failedSql}`,
    "",
    `Error / mismatch from the database:
${errorMessage}`,
    "",
    "Write the CORRECTED SQL. Respond with ONLY the SQL, no explanation, no markdown."
  ].filter(Boolean).join("\n");
  debug(`[SQL Refine] Retry prompt:
${prompt}`);
  for (const model of MODELS) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "You are an expert SQL developer. Fix the incorrect SQL query using the error feedback. Respond with ONLY the corrected SQL." },
          { role: "user", content: prompt }
        ],
        max_tokens: 512,
        temperature: 0
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? failedSql;
      const fixed = raw.replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();
      debug(`[SQL Refine] Fixed SQL (${model}):
${fixed}`);
      return fixed;
    } catch {
    }
  }
  return failedSql;
}
function pickLanguage(applicable) {
  const preference = ["PYTHON", "NODE_JS", "CPP", "JAVA"];
  for (const lang of preference) {
    if (applicable.includes(lang)) return lang;
  }
  return applicable[0] ?? "PYTHON";
}
function decodeCodeContent(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    return raw;
  } catch {
    return raw;
  }
}
function encodeCodeContent(code) {
  return JSON.stringify(code);
}
function buildCodingPrompt(q, lang, template) {
  const questionText = q.question.content.replace(/<br\s*\/?>\n?/gi, "\n").replace(/<[^>]+>/g, "").trim();
  const testCasesText = q.test_cases.map((tc, i) => {
    const inp = decodeCodeContent(tc.input);
    const out = decodeCodeContent(tc.output);
    return `Example ${i + 1}:
  Input:  ${inp}
  Output: ${out}`;
  }).join("\n");
  const langLabel = {
    CPP: "C++",
    JAVA: "Java",
    PYTHON: "Python 3",
    NODE_JS: "Node.js (JavaScript)"
  };
  const outputRule = lang === "CPP" ? [
    "CRITICAL RULES FOR C++:",
    "- You MUST fill in the function body inside the existing class.",
    "- Do NOT add int main() or any code outside the class.",
    "- Do NOT change the class name, function signature, or parameters.",
    "- Return the complete file exactly as given: #include lines + class with filled function body.",
    "- The judge calls your function directly \u2014 a main() will cause compile errors."
  ].join("\n") : "Respond with ONLY the complete runnable code. No explanation, no markdown fences.";
  return [
    `You are an expert ${langLabel[lang] ?? lang} developer. Solve the following coding problem.`,
    "",
    `Problem:
${questionText}`,
    "",
    testCasesText ? `Test Cases:
${testCasesText}` : "",
    "",
    `Language: ${langLabel[lang] ?? lang}`,
    "",
    `TEMPLATE TO COMPLETE (keep all existing structure, only fill the function body):
\`\`\`${lang === "CPP" ? "cpp" : ""}
${template}
\`\`\``,
    "",
    outputRule,
    "",
    "Requirements:",
    "- Write complete, runnable code that passes all test cases.",
    "- Read input exactly as shown in the examples.",
    "- Do NOT include any explanation, comments beyond what is needed, or markdown fences.",
    "- Respond with ONLY the complete runnable code."
  ].filter(Boolean).join("\n");
}
async function solveCodingQuestion(q, lang) {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");
  const defaultTemplate = decodeCodeContent(q.code.code_content);
  const savedTemplate = q.latest_saved_code ? decodeCodeContent(q.latest_saved_code.code_content) : null;
  const template = savedTemplate && savedTemplate.length > defaultTemplate.length + 20 ? savedTemplate : defaultTemplate;
  const prompt = buildCodingPrompt(q, lang, template);
  debug(`[Coding] Prompt for "${q.question.short_text}":
${prompt}`);
  const systemMessage = lang === "CPP" ? "You are an expert C++ competitive programmer. Your output MUST be ONLY the complete file as given: #include lines + the class with the filled function body. ABSOLUTELY NO int main(). No explanation." : "You are an expert programmer. Write complete, correct, runnable code. Respond with ONLY the code, no markdown, no commentary.";
  let lastError;
  for (const model of getModelOrder()) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? template;
      const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
      debug(`[Coding] Response (${model}):
${cleaned.slice(0, 300)}...`);
      return cleaned;
    } catch (err) {
      if (isRateLimitError(err)) {
        markRateLimited(model);
      } else {
        console.warn(`[solver] Coding model "${model}" failed \u2014 trying next\u2026`);
      }
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All Groq models failed for coding question.");
}

export {
  debug,
  debugAxiosError,
  initGroq,
  solveQuestion,
  solveAll,
  fetchDbSchema,
  solveSqlQuestions,
  refineSqlAnswer,
  pickLanguage,
  decodeCodeContent,
  encodeCodeContent,
  solveCodingQuestion
};
