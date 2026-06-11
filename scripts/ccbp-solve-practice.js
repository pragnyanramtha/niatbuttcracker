import { createClient, buildPayload, loadJson, saveJson, stripHtml } from "./ccbp-lib.js";

const TOKEN = process.env.CCBP_TOKEN;
if (!TOKEN) { console.error("CCBP_TOKEN env var required"); process.exit(1); }

const client = createClient(TOKEN);
const allPractice = loadJson("practice-questions.json");
const answersFile = "/tmp/ccbp-work/practice-answers.json";

// Load existing answers if any
let existingAnswers;
try { existingAnswers = loadJson("practice-answers.json"); }
catch { existingAnswers = { answers: {} }; }

const answers = existingAnswers.answers;

// Print all questions for me (Claude) to answer
console.log("\n════════════════════════════════════════════");
console.log("  PRACTICE QUESTIONS - Review and answer");
console.log("════════════════════════════════════════════\n");

for (const set of allPractice) {
  console.log(`Course: ${set.course_title}`);
  console.log(`Topic: ${set.topic_name}`);
  console.log(`Unit: ${set.unit_name}`);
  console.log(`Exam Attempt ID: ${set.exam_attempt_id}`);
  console.log("");

  for (const q of set.questions) {
    const qText = stripHtml(q.question.content);
    console.log(`[Q${q.question_number}] ${q.question_type}`);
    console.log(`  ${qText}`);
    if (q.code_analysis?.code_details) {
      console.log(`  Code:\n${q.code_analysis.code_details.code}`);
    }
    for (const opt of q.options) {
      const optText = stripHtml(opt.content);
      console.log(`  ${opt.order}) ${optText}  [${opt.option_id}]`);
    }
    console.log("");
  }
  console.log("────────────────────────────────────────────\n");
}

console.log("To answer, create /tmp/ccbp-work/practice-answers.json with:");
console.log(`{
  "answers": {
    "<question_id>": "<option_id>",
    ...
  }
}`);
console.log("\nThen run: node scripts/ccbp-submit-practice.js\n");
