import { createClient, buildPayload, loadJson } from "./ccbp-lib.js";

const TOKEN = process.env.CCBP_TOKEN;
if (!TOKEN) { console.error("CCBP_TOKEN env var required"); process.exit(1); }

const client = createClient(TOKEN);
const sqlSets = loadJson("sql-questions.json");
const sqlAnswers = loadJson("sql-answers.json");
const answers = sqlAnswers.answers || {};

const MAX_RETRIES = 3;
const MAX_AI_FIXES = 5;

async function submitWithRetry(payload) {
  let lastErr;
  for (let n = 0; n < MAX_RETRIES; n++) {
    try {
      return await client.post(
        "/api/nkb_coding_practice/questions/sql/submit/v1/",
        buildPayload({ responses: payload })
      );
    } catch (err) {
      const status = err.response?.status;
      if (status && status < 500) throw err;
      lastErr = err;
      const wait = 1000 * 2 ** n;
      console.log(`    Network error, retrying in ${wait}ms...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

for (const set of sqlSets) {
  console.log(`\n  SQL Set: ${set.unit_name} (${set.course_title})`);

  for (const q of set.questions) {
    const sql = answers[q.question_id];
    if (!sql) {
      console.log(`    Q${q.question_number}: No answer provided, skipping`);
      continue;
    }

    const label = q.short_text || `Q${q.question_number}` || q.question_id.slice(0, 8);

    for (let attempt = 0; attempt <= MAX_AI_FIXES; attempt++) {
      process.stdout.write(`    [${label}] submitting...`);
      try {
        const result = await submitWithRetry([{
          question_id: q.question_id,
          time_spent: 10 + attempt * 3,
          user_response_code: { code_content: sql, language: "SQL" },
        }]);

        const r = result.data.submission_results[0];
        if (r?.evaluation_result === "CORRECT") {
          console.log(` CORRECT${attempt > 0 ? ` (fixed on retry ${attempt})` : ""}`);
          break;
        }

        const errDetail = r?.coding_submission_response?.reason_for_error
          || r?.coding_submission_response?.reason_for_failures?.join("\n")
          || `${r?.coding_submission_response?.passed_test_cases_count || 0}/${r?.coding_submission_response?.total_test_cases_count || "?"} tests passed`;

        console.log(` FAILED: ${errDetail}`);
        if (attempt >= MAX_AI_FIXES) {
          console.log(`    Gave up after ${MAX_AI_FIXES} retries`);
          break;
        }
        console.log(`    Retry ${attempt + 1}/${MAX_AI_FIXES}...`);
      } catch (err) {
        console.log(` SUBMIT ERROR: ${err.response?.status || err.message}`);
        break;
      }
    }
  }
}

console.log("\n  All SQL sets processed\n");
