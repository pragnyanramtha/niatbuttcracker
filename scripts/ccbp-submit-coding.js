import { createClient, buildPayload, loadJson } from "./ccbp-lib.js";

const TOKEN = process.env.CCBP_TOKEN;
if (!TOKEN) { console.error("CCBP_TOKEN env var required"); process.exit(1); }

const client = createClient(TOKEN);
const codingSets = loadJson("coding-questions.json");
const codingAnswers = loadJson("coding-answers.json");
const answers = codingAnswers.answers || {};

for (const set of codingSets) {
  console.log(`\n  Coding Set: ${set.unit_name} (${set.course_title})`);

  for (const q of set.questions) {
    const code = answers[q.question_id];
    if (!code) {
      console.log(`    ${q.short_text || q.question_id.slice(0, 8)}: No answer, using template`);
    }

    const codeContent = code || q.template;

    // Start question on server
    process.stdout.write(`    ${q.short_text || q.question_id.slice(0, 8)}: starting...`);
    try {
      await client.post(
        "/api/nkb_coding_practice/coding/question/start/",
        buildPayload({ question_id: q.question_id, should_mark_attempted: true })
      );
      console.log(" started");
    } catch (err) {
      console.log(` start fail (${err.response?.status}), trying submit anyway`);
    }

    // Submit
    process.stdout.write(`    submitting...`);
    try {
      const { data } = await client.post(
        "/api/nkb_coding_practice/question/coding/submit/",
        buildPayload({
          responses: [{
            question_id: q.question_id,
            time_spent: 30,
            coding_answer: {
              code_content: JSON.stringify(codeContent),
              language: q.language,
            },
          }],
        })
      );

      const r = data.submission_result[0];
      if (r?.evaluation_result === "CORRECT") {
        console.log(` CORRECT (score: ${r.user_response_score})`);
      } else {
        console.log(` ${r?.evaluation_result || "UNKNOWN"} (${r?.passed_test_cases_count || 0}/${r?.total_test_cases_count || "?"} tests)`);
      }
    } catch (err) {
      console.log(` FAILED: ${err.response?.status || err.message}`);
    }
  }
}

console.log("\n  All coding sets processed\n");
