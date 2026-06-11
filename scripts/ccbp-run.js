import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = __dirname;
const WORK = "/tmp/ccbp-work";

function run(cmd, label) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${"=".repeat(60)}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, CCBP_TOKEN: process.env.CCBP_TOKEN } });
}

const mode = process.argv[2] || "all";
const validModes = ["all", "fetch", "learn", "practice", "sql", "coding", "gen-answers"];

if (!validModes.includes(mode)) {
  console.log(`Usage: node scripts/ccbp-run.js <mode>
Modes:
  all         - Fetch + auto-learn + print questions for review
  fetch       - Fetch courses, topics, units from CCBP
  learn       - Auto-complete all learning sets
  practice    - Print MCQ questions for me to answer
  sql         - Print SQL questions for me to answer
  coding      - Print coding problems for me to solve
  gen-answers - Generate empty answer stubs
`);
  process.exit(1);
}

if (!process.env.CCBP_TOKEN) {
  console.error("CCBP_TOKEN env var required");
  process.exit(1);
}

if (mode === "all" || mode === "fetch") {
  run(`node ${SCRIPTS}/ccbp-fetch-courses.js`, "STEP 1: Fetch courses, topics, units");
}

if (mode === "all" || mode === "learn") {
  if (!existsSync(`${WORK}/topic-units.json`)) {
    console.error("No topic-units.json. Run 'fetch' first.");
    process.exit(1);
  }
  run(`node ${SCRIPTS}/ccbp-complete-learning.js`, "STEP 2: Complete learning sets");
}

if (mode === "all" || mode === "practice") {
  if (!existsSync(`${WORK}/topic-units.json`)) {
    console.error("No topic-units.json. Run 'fetch' first.");
    process.exit(1);
  }
  run(`node ${SCRIPTS}/ccbp-fetch-practice.js`, "STEP 3: Fetch practice exam questions");
  run(`node ${SCRIPTS}/ccbp-solve-practice.js`, "STEP 4: Review practice questions");
  console.log("\n  → After answering, run: node scripts/ccbp-submit-practice.js");
}

if (mode === "all" || mode === "sql") {
  if (!existsSync(`${WORK}/topic-units.json`)) {
    console.error("No topic-units.json. Run 'fetch' first.");
    process.exit(1);
  }
  run(`node ${SCRIPTS}/ccbp-fetch-sql.js`, "STEP 5: Fetch SQL questions");
  console.log("\n  → Edit /tmp/ccbp-work/sql-answers.json then run: node scripts/ccbp-submit-sql.js");
}

if (mode === "all" || mode === "coding") {
  if (!existsSync(`${WORK}/topic-units.json`)) {
    console.error("No topic-units.json. Run 'fetch' first.");
    process.exit(1);
  }
  run(`node ${SCRIPTS}/ccbp-fetch-coding.js`, "STEP 6: Fetch coding questions");
  console.log("\n  → Edit /tmp/ccbp-work/coding-answers.json then run: node scripts/ccbp-submit-coding.js");
}

if (mode === "gen-answers") {
  // Generate empty answer stubs for all question types
  if (existsSync(`${WORK}/practice-questions.json`)) {
    const data = JSON.parse(readFileSync(`${WORK}/practice-questions.json`, "utf-8"));
    const answers = {};
    for (const set of data) {
      for (const q of set.questions) {
        answers[q.question_id] = q.options[0]?.option_id || "";
      }
    }
    writeFileSync(`${WORK}/practice-answers.json`, JSON.stringify({ answers }, null, 2));
    console.log(`Generated ${WORK}/practice-answers.json with ${Object.keys(answers).length} stub(s)`);
  }
  if (existsSync(`${WORK}/sql-questions.json`)) {
    const data = JSON.parse(readFileSync(`${WORK}/sql-questions.json`, "utf-8"));
    const answers = {};
    for (const set of data) {
      for (const q of set.questions) {
        answers[q.question_id] = "";
      }
    }
    writeFileSync(`${WORK}/sql-answers.json`, JSON.stringify({ answers }, null, 2));
    console.log(`Generated ${WORK}/sql-answers.json with ${Object.keys(answers).length} stub(s)`);
  }
  if (existsSync(`${WORK}/coding-questions.json`)) {
    const data = JSON.parse(readFileSync(`${WORK}/coding-questions.json`, "utf-8"));
    const answers = {};
    for (const set of data) {
      for (const q of set.questions) {
        answers[q.question_id] = "";
      }
    }
    writeFileSync(`${WORK}/coding-answers.json`, JSON.stringify({ answers }, null, 2));
    console.log(`Generated ${WORK}/coding-answers.json with ${Object.keys(answers).length} stub(s)`);
  }
}
