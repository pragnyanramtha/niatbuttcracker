/**
 * Sandbox eval: tests MCQ generation accuracy and timing across all models.
 *
 * Usage:
 *   node scripts/eval-mcq.mjs
 *   DEBUG=1 node scripts/eval-mcq.mjs   # show AI raw responses
 */

import OpenAI from "openai";

const API_BASE = "https://opencode.ai/zen/v1";
const MODELS = [
  "big-pickle",
  "nemotron-3-ultra-free",
  "mimo-v2.5-free",
  "deepseek-v4-flash-free",
  "laguna-s-2.1-free",
  "north-mini-code-free",
];

/** Curated MCQs with known correct answers */
const QUESTIONS = [
  {
    id: "q01",
    subject: "Python",
    question: {
      content: "<p>What is the output of the following code?</p><pre><code>x = [1, 2, 3]\ny = x\nx.append(4)\nprint(y)</code></pre>",
    },
    options: [
      { id: "a", content: "[1, 2, 3]" },
      { id: "b", content: "[1, 2, 3, 4]" },
      { id: "c", content: "[4, 1, 2, 3]" },
      { id: "d", content: "Error" },
    ],
    correct: "b",
  },
  {
    id: "q02",
    subject: "Python",
    question: {
      content: "<p>Which of the following is NOT a valid Python data type?</p>",
    },
    options: [
      { id: "a", content: "List" },
      { id: "b", content: "Dictionary" },
      { id: "c", content: "Array" },
      { id: "d", content: "Tuple" },
    ],
    correct: "c",
  },
  {
    id: "q03",
    subject: "JavaScript",
    question: {
      content: "<p>What does <code>typeof null</code> return in JavaScript?</p>",
    },
    options: [
      { id: "a", content: "\"null\"" },
      { id: "b", content: "\"object\"" },
      { id: "c", content: "\"undefined\"" },
      { id: "d", content: "\"number\"" },
    ],
    correct: "b",
  },
  {
    id: "q04",
    subject: "HTML/CSS",
    question: {
      content: "<p>Which CSS property is used to change the text color of an element?</p>",
    },
    options: [
      { id: "a", content: "font-color" },
      { id: "b", content: "text-color" },
      { id: "c", content: "color" },
      { id: "d", content: "foreground" },
    ],
    correct: "c",
  },
  {
    id: "q05",
    subject: "SQL",
    question: {
      content: "<p>Which SQL clause is used to filter records after aggregation?</p>",
    },
    options: [
      { id: "a", content: "WHERE" },
      { id: "b", content: "HAVING" },
      { id: "c", content: "FILTER" },
      { id: "d", content: "GROUP BY" },
    ],
    correct: "b",
  },
  {
    id: "q06",
    subject: "Python",
    question: {
      content: "<p>What will <code>print(2 ** 3 ** 2)</code> output?</p>",
    },
    options: [
      { id: "a", content: "64" },
      { id: "b", content: "512" },
      { id: "c", content: "12" },
      { id: "d", content: "36" },
    ],
    correct: "b",
  },
  {
    id: "q07",
    subject: "DSA",
    question: {
      content: "<p>What is the time complexity of binary search on a sorted array of n elements?</p>",
    },
    options: [
      { id: "a", content: "O(n)" },
      { id: "b", content: "O(log n)" },
      { id: "c", content: "O(n log n)" },
      { id: "d", content: "O(1)" },
    ],
    correct: "b",
  },
  {
    id: "q08",
    subject: "JavaScript",
    question: {
      content: "<p>What does the <code>===</code> operator check in JavaScript?</p>",
    },
    options: [
      { id: "a", content: "Value only" },
      { id: "b", content: "Value and type" },
      { id: "c", content: "Reference only" },
      { id: "d", content: "Type only" },
    ],
    correct: "b",
  },
  {
    id: "q09",
    subject: "Python",
    question: {
      content: "<p>What is the result of <code>list({1: 'a', 2: 'b'}.keys())</code>?</p>",
    },
    options: [
      { id: "a", content: "['a', 'b']" },
      { id: "b", content: "[1, 2]" },
      { id: "c", contentError: "Error" },
      { id: "d", content: "[(1, 'a'), (2, 'b')]" },
      { id: "c", content: "\"[1, 2]\"" },
    ],
    correct: "b",
  },
  {
    id: "q10",
    subject: "SQL",
    question: {
      content: "<p>Which SQL statement is used to add a new row to a table?</p>",
    },
    options: [
      { id: "a", content: "ADD" },
      { id: "b", content: "INSERT INTO" },
      { id: "c", content: "UPDATE" },
      { id: "d", content: "CREATE" },
    ],
    correct: "b",
  },
  {
    id: "q11",
    subject: "Python",
    question: {
      content: "<p>What does <code>len(\"hello\".split('l'))</code> return?</p>",
    },
    options: [
      { id: "a", content: "2" },
      { id: "b", content: "3" },
      { id: "c", content: "4" },
      { id: "d", content: "5" },
    ],
    correct: "b",
  },
  {
    id: "q12",
    subject: "Web",
    question: {
      content: "<p>Which HTTP method is used to submit form data in HTML?</p>",
    },
    options: [
      { id: "a", content: "GET" },
      { id: "b", content: "POST" },
      { id: "c", content: "PUT" },
      { id: "d", content: "DELETE" },
    ],
    correct: "b",
  },
  {
    id: "q13",
    subject: "Python",
    question: {
      content: "<p>What is the output of <code>print(3 * 'ab')</code>?</p>",
    },
    options: [
      { id: "a", content: "ababab" },
      { id: "b", content: "3ab" },
      { id: "c", content: "ab3" },
      { id: "d", content: "Error" },
    ],
    correct: "a",
  },
  {
    id: "q14",
    subject: "DSA",
    question: {
      content: "<p>Which data structure follows FIFO (First In, First Out) principle?</p>",
    },
    options: [
      { id: "a", content: "Stack" },
      { id: "b", content: "Queue" },
      { id: "c", content: "Tree" },
      { id: "d", content: "Graph" },
    ],
    correct: "b",
  },
  {
    id: "q15",
    subject: "JavaScript",
    question: {
      content: "<p>What will <code>console.log(Boolean([]))</code> print?</p>",
    },
    options: [
      { id: "a", content: "true" },
      { id: "b", content: "false" },
      { id: "c", content: "undefined" },
      { id: "d", content: "Error" },
    ],
    correct: "a",
  },
  {
    id: "q16",
    subject: "HTML/CSS",
    question: {
      content: "<p>Which HTML tag is used to create a hyperlink?</p>",
    },
    options: [
      { id: "a", content: "&lt;link&gt;" },
      { id: "b", content: "&lt;a&gt;" },
      { id: "c", content: "&lt;href&gt;" },
      { id: "d", content: "&lt;url&gt;" },
    ],
    correct: "b",
  },
  {
    id: "q17",
    subject: "Python",
    question: {
      content: "<p>What does <code>set([1, 2, 2, 3, 3, 3])</code> return?</p>",
    },
    options: [
      { id: "a", content: "[1, 2, 3]" },
      { id: "b", content: "{1, 2, 3}" },
      { id: "c", content: "(1, 2, 3)" },
      { id: "d", content: "{1: 2, 3: 3}" },
    ],
    correct: "b",
  },
  {
    id: "q18",
    subject: "SQL",
    question: {
      content: "<p>Which SQL function returns the number of rows in a result set?</p>",
    },
    options: [
      { id: "a", content: "COUNT()" },
      { id: "b", content: "SUM()" },
      { id: "c", content: "TOTAL()" },
      { id: "d", content: "LENGTH()" },
    ],
    correct: "a",
  },
  {
    id: "q19",
    subject: "JavaScript",
    question: {
      content: "<p>What is the output? <code>console.log(0.1 + 0.2 === 0.3)</code></p>",
    },
    options: [
      { id: "a", content: "true" },
      { id: "b", content: "false" },
      { id: "c", content: "undefined" },
      { id: "d", content: "NaN" },
    ],
    correct: "b",
  },
  {
    id: "q20",
    subject: "Python",
    question: {
      content: "<p>What is the output of <code>print(type(range(5)))</code>?</p>",
    },
    options: [
      { id: "a", content: "&lt;class 'list'&gt;" },
      { id: "b", content: "&lt;class 'range'&gt;" },
      { id: "c", content: "&lt;class 'generator'&gt;" },
      { id: "d", content: "&lt;class 'tuple'&gt;" },
    ],
    correct: "b",
  },
];

// Normalize the questions to match the solver's expected format
function toSolverFormat(eq) {
  // Fix q09 which has a duplicate 'c' key — re-derive options
  const rawOps = [
    { option_id: "a", content: "['a', 'b']" },
    { option_id: "b", content: "[1, 2]" },
    { option_id: "c", content: "Error" },
    { option_id: "d", content: "[(1, 'a'), (2, 'b')]" },
  ];

  return {
    question_id: eq.id,
    question_type: "MULTIPLE_CHOICE",
    question_number: parseInt(eq.id.slice(1), 10),
    question: { content: eq.question.content },
    options: eq.id === "q09" ? rawOps : eq.options.map((o, i) => ({
      option_id: o.id,
      option_number: i + 1,
      content: o.content,
    })),
    code_analysis: null,
    is_answer_allowed: true,
  };
}

function stripHtml(text) {
  return text
    .replace(/<img[^>]*>/gi, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function buildPrompt(question) {
  const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const letterToId = new Map();
  const parts = [];

  const questionText = stripHtml(question.question.content);
  parts.push(`Question:\n${questionText}`);

  if (question.code_analysis?.code_details) {
    const { code, language } = question.code_analysis.code_details;
    parts.push(`\nCode (${language}):\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``);
  }

  parts.push("\nOptions:");
  for (let i = 0; i < question.options.length; i++) {
    const opt = question.options[i];
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

function pickAnswer(responseText, letterToId) {
  const cleaned = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Priority 1: "Answer: X" at end
  const lastLineMatch = cleaned.match(/answer[:\s]+([A-H])\s*$/im);
  if (lastLineMatch) {
    const letter = lastLineMatch[1].toUpperCase();
    const id = letterToId.get(letter);
    if (id) return id;
  }

  // Priority 2: "Answer: X" anywhere
  const anywhereMatch = cleaned.match(/answer[:\s]+([A-H])\b/i);
  if (anywhereMatch) {
    const letter = anywhereMatch[1].toUpperCase();
    const id = letterToId.get(letter);
    if (id) return id;
  }

  // Priority 3: "the answer is X"
  const phraseMatch = cleaned.match(/(?:the\s+)?(?:correct\s+)?answer\s+is\s+([A-H])\b/i);
  if (phraseMatch) {
    const letter = phraseMatch[1].toUpperCase();
    const id = letterToId.get(letter);
    if (id) return id;
  }

  // Priority 4: last 5 lines
  const lines = cleaned.split("\n").map(l => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const line = lines[i];
    const bareLetterMatch = line.match(/^([A-H])[).:\s]*$/i);
    if (bareLetterMatch) {
      const letter = bareLetterMatch[1].toUpperCase();
      const id = letterToId.get(letter);
      if (id) return id;
    }
    const inlineMatch = line.match(/\b(?:answer(?:\s+is)?|option|choose|select)[:\s]+([A-H])\b/i);
    if (inlineMatch) {
      const letter = inlineMatch[1].toUpperCase();
      const id = letterToId.get(letter);
      if (id) return id;
    }
  }

  return null;
}

async function testModel(model, questions) {
  const client = new OpenAI({
    apiKey: "placeholder",
    baseURL: API_BASE,
    timeout: 30000,
    maxRetries: 0,
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      headers.delete("authorization");
      return fetch(url, { ...init, headers });
    },
  });

  const results = [];
  let totalTime = 0;
  const TIMEOUT_MS = 25000;

  for (const eq of questions) {
    const solverQ = toSolverFormat(eq);
    const { prompt, letterToId } = buildPrompt(solverQ);
    const systemMsg =
      "You are an expert academic tutor. You will be given a multiple-choice question with options labeled A, B, C, D, etc.\n\n" +
      "RULES:\n" +
      "- Carefully analyze EACH option before choosing.\n" +
      "- For code/tracing questions, trace through the code line by line with concrete values.\n" +
      "- For theory questions, use your domain knowledge to eliminate wrong answers.\n" +
      "- Do NOT guess. If unsure, reason through each option by elimination.\n" +
      "- Your LAST line must be exactly: Answer: X (where X is the letter A-D).\n" +
      "- Nothing may appear after the Answer: line.";

    const start = Date.now();
    let raw = "";
    let error = null;
    try {
      const completion = await Promise.race([
        client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: prompt },
          ],
          max_completion_tokens: 1024,
          temperature: 0,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`TIMEOUT after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
        ),
      ]);
      raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
    } catch (err) {
      error = err.message || String(err);
    }
    const elapsed = Date.now() - start;
    totalTime += elapsed;

    const selectedId = error ? null : pickAnswer(raw, letterToId);
    const correctId = eq.options.find(o => o.id === eq.correct)?.id;
    // Actually we need: what option_id maps to the correct letter?
    const correctLetterMap = new Map();
    const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
    for (let i = 0; i < eq.options.length; i++) {
      correctLetterMap.set(LETTERS[i], eq.options[i].id);
    }
    const selectedLetter = [...letterToId.entries()].find(([, id]) => id === selectedId)?.[0] || null;

    results.push({
      id: eq.id,
      subject: eq.subject,
      correct: eq.correct,
      selectedLetter,
      selectedId,
      correctId,
      passed: selectedId === correctId,
      timeMs: elapsed,
      raw: process.env.DEBUG ? raw.slice(0, 400) : undefined,
      error,
    });
  }

  const passed = results.filter(r => r.passed).length;
  const avgTime = totalTime / results.length;

  return { model, results, passed, total: results.length, avgTime };
}

async function main() {
  const skipModels = (process.argv[2] || "").split(",").filter(Boolean);
  const filterModels = skipModels.length > 0
    ? MODELS.filter(m => !skipModels.includes(m))
    : MODELS;

  console.log("=".repeat(78));
  console.log("  MCQ ACCURACY EVAL — Curated Questions");
  console.log("=".repeat(78));
  console.log(`\n${QUESTIONS.length} questions across ${new Set(QUESTIONS.map(q => q.subject)).size} subjects`);
  if (skipModels.length) console.log(`  Skipping: ${skipModels.join(", ")}`);
  console.log(`  Models: ${filterModels.join(", ")}\n`);

  const allResults = [];

  for (const model of filterModels) {
    console.log(`\n${"─".repeat(78)}`);
    console.log(`  Model: ${model}`);
    console.log(`${"─".repeat(78)}`);

    try {
      const report = await testModel(model, QUESTIONS);
      allResults.push(report);

      for (const r of report.results) {
        const icon = r.passed ? "✔" : r.error ? "✖" : "✗";
        const timeStr = `${r.timeMs}ms`.padStart(7);
        const subjectStr = r.subject.padEnd(12);
        const mark = r.passed ? "" : r.error ? ` ERROR: ${r.error.slice(0, 60)}` : ` → picked ${r.selectedLetter}, expected ${r.correct}`;
        console.log(`  ${icon} ${timeStr}  ${subjectStr} ${r.id}${mark}`);
      }

      const pct = ((report.passed / report.total) * 100).toFixed(0);
      console.log(`\n  ${report.passed}/${report.total} correct (${pct}%)  |  avg ${report.avgTime.toFixed(0)}ms per question`);
    } catch (err) {
      console.error(`  Model ${model} failed: ${err.message}`);
    }
  }

  console.log(`\n${"=".repeat(78)}`);
  console.log("  SUMMARY");
  console.log(`${"=".repeat(78)}`);

  // Sort by accuracy descending
  allResults.sort((a, b) => b.passed / b.total - a.passed / a.total);

  console.log("");
  for (const r of allResults) {
    const pct = ((r.passed / r.total) * 100).toFixed(0);
    console.log(`  ${pct.padStart(3)}%  ${r.model.padEnd(30)}  ${r.passed}/${r.total}  avg ${r.avgTime.toFixed(0)}ms`);
  }
  console.log("");

  // Overall
  const totalPassed = allResults.reduce((s, r) => s + r.passed, 0);
  const totalQs = allResults.reduce((s, r) => s + r.total, 0);
  const overallPct = ((totalPassed / totalQs) * 100).toFixed(1);
  const overallAvg = allResults.reduce((s, r) => s + r.avgTime, 0) / allResults.length;
  console.log(`  OVERALL: ${totalPassed}/${totalQs} (${overallPct}%)  |  avg ${overallAvg.toFixed(0)}ms across ${allResults.length} models`);
  console.log("");
}

main().catch(console.error);
