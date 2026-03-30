#!/usr/bin/env node
import {
  debug
} from "./chunk-AARSOUVZ.js";

// src/puter-solver.ts
import puter from "@heyputer/puter.js";
var puterInitialized = false;
async function initPuter() {
  if (puterInitialized) return;
  try {
    await puter.ai.chat([{ role: "user", content: "OK" }], {
      model: PUTER_MODELS[0],
      max_tokens: 8,
      temperature: 0
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Puter initialization failed in Node mode: ${msg}. Switch provider to Groq or retry later.`
    );
  }
  puterInitialized = true;
  debug("[Puter] Initialized (Node mode, no popup auth)");
}
function extractText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((part) => extractText(part)).join("\n").trim();
  }
  if (value && typeof value === "object") {
    const obj = value;
    const text = obj.text;
    if (typeof text === "string") return text;
    const content = obj.content;
    if (content !== void 0) return extractText(content);
    const message = obj.message;
    if (message !== void 0) return extractText(message);
  }
  return "";
}
function getChatText(response) {
  const direct = extractText(response);
  if (direct) return direct;
  if (response && typeof response === "object") {
    const obj = response;
    const choices = obj.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0];
      const choiceText = extractText(first.message ?? first);
      if (choiceText) return choiceText;
    }
  }
  return String(response ?? "");
}
function buildMessages(systemPrompt, userPrompt) {
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];
}
var PUTER_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash-lite-preview"
];
var currentModelIndex = 0;
function getNextModel() {
  const model = PUTER_MODELS[currentModelIndex % PUTER_MODELS.length];
  currentModelIndex++;
  return model;
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
  if (!puterInitialized) {
    throw new Error("Puter not initialized. Call initPuter() first.");
  }
  const { prompt, letterToId } = buildPrompt(question);
  let lastError;
  for (let attempt = 0; attempt < PUTER_MODELS.length; attempt++) {
    const model = getNextModel();
    try {
      debug(`[Puter] Trying model: ${model}`);
      const response = await puter.ai.chat(buildMessages(
        "You are an expert tutor and problem-solver with deep knowledge across computer science, mathematics, science, languages, and general academia. When given a multiple-choice question, reason through it carefully before answering. Always end your response with 'Answer: X' where X is the letter of the correct option.",
        prompt
      ), {
        model
      });
      const responseText = getChatText(response);
      debug(`[Puter] Response from ${model}: ${responseText.slice(0, 200)}...`);
      return pickBestOptionId(responseText, question.options, letterToId);
    } catch (err) {
      console.warn(`[puter-solver] Model "${model}" failed \u2014 trying next\u2026`);
      lastError = err;
      debug(`[Puter] Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All Puter models failed for MCQ.");
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
  if (!puterInitialized) {
    throw new Error("Puter not initialized. Call initPuter() first.");
  }
  const answers = /* @__PURE__ */ new Map();
  debug(`[SQL Solver Puter] Schema: ${realSchema ? realSchema.slice(0, 200) : "(none)"}`);
  const BATCH = 10;
  let done = 0;
  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const prompt = buildSqlPrompt(batch, dbContext, realSchema);
    let parsed = {};
    let lastError;
    for (let attempt = 0; attempt < PUTER_MODELS.length; attempt++) {
      const model = getNextModel();
      try {
        const response = await puter.ai.chat(buildMessages(
          "You are an expert SQL developer. Respond only with the requested JSON object. No markdown, no commentary.",
          prompt
        ), {
          model
        });
        const responseText = getChatText(response);
        debug(`[SQL Solver Puter] Raw response (${model}):
${responseText}`);
        const noThink = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        const cleaned = noThink.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
        parsed = JSON.parse(cleaned);
        debug(`[SQL Solver Puter] Parsed ${Object.keys(parsed).length} answers`);
        break;
      } catch (err) {
        console.warn(`[puter-solver] SQL model "${model}" failed \u2014 trying next\u2026`);
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
          const model = getNextModel();
          const response = await puter.ai.chat([{ role: "user", content: fallbackPrompt }], { model });
          const sql = getChatText(response).trim();
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
  if (!puterInitialized) {
    throw new Error("Puter not initialized. Call initPuter() first.");
  }
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
  debug(`[SQL Refine Puter] Retry prompt:
${prompt}`);
  for (let attempt = 0; attempt < PUTER_MODELS.length; attempt++) {
    const model = getNextModel();
    try {
      const response = await puter.ai.chat(buildMessages(
        "You are an expert SQL developer. Fix the incorrect SQL query using the error feedback. Respond with ONLY the corrected SQL.",
        prompt
      ), {
        model
      });
      const fixed = getChatText(response).replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();
      debug(`[SQL Refine Puter] Fixed SQL (${model}):
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
  if (!puterInitialized) {
    throw new Error("Puter not initialized. Call initPuter() first.");
  }
  const defaultTemplate = decodeCodeContent(q.code.code_content);
  const savedTemplate = q.latest_saved_code ? decodeCodeContent(q.latest_saved_code.code_content) : null;
  const template = savedTemplate && savedTemplate.length > defaultTemplate.length + 20 ? savedTemplate : defaultTemplate;
  const prompt = buildCodingPrompt(q, lang, template);
  debug(`[Coding Puter] Prompt for "${q.question.short_text}":
${prompt}`);
  const systemMessage = lang === "CPP" ? "You are an expert C++ competitive programmer. Your output MUST be ONLY the complete file as given: #include lines + the class with the filled function body. ABSOLUTELY NO int main(). No explanation." : "You are an expert programmer. Write complete, correct, runnable code. Respond with ONLY the code, no markdown, no commentary.";
  let lastError;
  for (let attempt = 0; attempt < PUTER_MODELS.length; attempt++) {
    const model = getNextModel();
    try {
      const response = await puter.ai.chat(buildMessages(systemMessage, prompt), {
        model
      });
      const cleaned = getChatText(response).replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
      debug(`[Coding Puter] Response (${model}):
${cleaned.slice(0, 300)}...`);
      return cleaned;
    } catch (err) {
      console.warn(`[puter-solver] Coding model "${model}" failed \u2014 trying next\u2026`);
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All Puter models failed for coding question.");
}

export {
  initPuter,
  solveQuestion,
  solveAll,
  solveSqlQuestions,
  refineSqlAnswer,
  pickLanguage,
  decodeCodeContent,
  encodeCodeContent,
  solveCodingQuestion
};
