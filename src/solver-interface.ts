/**
 * Unified solver interface that dynamically routes to either Groq or Puter solver
 * based on the AI provider selected by the user.
 */

import type {
  Question,
  SqlQuestion,
  CodingQuestionDetail,
  CodingLanguage,
  AIProvider,
} from "./types.js";

// Store the current provider
let currentProvider: AIProvider = "groq";

export function setAIProvider(provider: AIProvider): void {
  currentProvider = provider;
}

// ── MCQ Solving ───────────────────────────────────────────────────────────────

export async function solveQuestion(question: Question): Promise<string> {
  if (currentProvider === "puter") {
    const { solveQuestion } = await import("./puter-solver.js");
    return solveQuestion(question);
  } else {
    const { solveQuestion } = await import("./solver.js");
    return solveQuestion(question);
  }
}

export async function solveAll(
  questions: Question[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  if (currentProvider === "puter") {
    const { solveAll } = await import("./puter-solver.js");
    return solveAll(questions, onProgress);
  } else {
    const { solveAll } = await import("./solver.js");
    return solveAll(questions, onProgress);
  }
}

// ── SQL Solving ───────────────────────────────────────────────────────────────

export async function solveSqlQuestions(
  questions: SqlQuestion[],
  dbContext: string,
  realSchema: string,
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  if (currentProvider === "puter") {
    const { solveSqlQuestions } = await import("./puter-solver.js");
    return solveSqlQuestions(questions, dbContext, realSchema, onProgress);
  } else {
    const { solveSqlQuestions } = await import("./solver.js");
    return solveSqlQuestions(questions, dbContext, realSchema, onProgress);
  }
}

export async function refineSqlAnswer(
  question: SqlQuestion,
  failedSql: string,
  errorMessage: string,
  realSchema: string,
  dbContext: string,
): Promise<string> {
  if (currentProvider === "puter") {
    const { refineSqlAnswer } = await import("./puter-solver.js");
    return refineSqlAnswer(question, failedSql, errorMessage, realSchema, dbContext);
  } else {
    const { refineSqlAnswer } = await import("./solver.js");
    return refineSqlAnswer(question, failedSql, errorMessage, realSchema, dbContext);
  }
}

export async function fetchDbSchema(dbUrl: string): Promise<string> {
  // fetchDbSchema is always from solver.js (shared utility)
  const { fetchDbSchema } = await import("./solver.js");
  return fetchDbSchema(dbUrl);
}

// ── Coding Solving ────────────────────────────────────────────────────────────

export async function solveCodingQuestion(
  q: CodingQuestionDetail,
  lang: CodingLanguage,
): Promise<string> {
  if (currentProvider === "puter") {
    const { solveCodingQuestion } = await import("./puter-solver.js");
    return solveCodingQuestion(q, lang);
  } else {
    const { solveCodingQuestion } = await import("./solver.js");
    return solveCodingQuestion(q, lang);
  }
}

// ── Coding Helpers (provider-agnostic) ───────────────────────────────────────

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
