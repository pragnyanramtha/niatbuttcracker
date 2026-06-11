import { createClient, buildPayload, saveJson, loadJson } from "./ccbp-lib.js";

const TOKEN = process.env.CCBP_TOKEN;
if (!TOKEN) { console.error("CCBP_TOKEN env var required"); process.exit(1); }

const client = createClient(TOKEN);
const allUnits = loadJson("topic-units.json");

const codingSets = [];

for (const course of allUnits) {
  for (const t of course.topics) {
    for (const unit of t.units) {
      if (unit.unit_type !== "QUESTION_SET") continue;
      if (unit.completion_percentage >= 100) continue;
      if (unit.is_unit_locked) continue;

      const name = unit.question_set_unit_details?.name || unit.learning_resource_set_unit_details?.name || unit.unit_id;
      process.stdout.write(`\n  Coding probe: ${name}...`);

      // Try SQL first - if it succeeds, this is SQL not coding
      try {
        const sqlCheck = await client.post(
          "/api/nkb_coding_practice/questions/sql/v1/?offset=0&length=999",
          buildPayload({ question_set_id: unit.unit_id })
        );
        if (sqlCheck.data.questions?.length > 0) {
          console.log(" is SQL, skipping");
          continue;
        }
      } catch {}

      // Try coding endpoint
      try {
        const { data: summary } = await client.post(
          "/api/nkb_coding_practice/user/coding/questions/summary/?offset=0&length=999",
          buildPayload({ question_set_id: unit.unit_id })
        );

        if (!summary || summary.length === 0) {
          console.log(" no coding questions");
          continue;
        }

        const unanswered = summary.filter(
          q => q.question_status !== "CORRECT" && q.question_status !== "COMPLETED"
        );
        console.log(` ${summary.length} total, ${unanswered.length} unanswered`);

        if (unanswered.length === 0) continue;

        // Fetch full details
        const { data: details } = await client.post(
          "/api/nkb_coding_practice/user/coding/questions/",
          buildPayload({ question_ids: unanswered.map(q => q.question_id) })
        );

        const entry = {
          course_title: course.course_title,
          topic_name: t.topic?.topic_name,
          unit_name: name,
          unit_id: unit.unit_id,
          questions: details.questions.map(q => ({
            question_id: q.question_id,
            question_type: q.question_type,
            short_text: q.question.short_text,
            content: q.question.content,
            difficulty: q.question.difficulty,
            language: q.code.language,
            template: q.code.code_content,
            latest_saved_code: q.latest_saved_code?.code_content || null,
            test_cases: q.test_cases.map(tc => ({
              input: tc.input,
              output: tc.output,
            })),
          })),
        };
        codingSets.push(entry);

      } catch (err) {
        console.log(` FAILED: ${err.response?.status || err.message}`);
      }
    }
  }
}

saveJson("coding-questions.json", codingSets);
console.log(`\n  Saved ${codingSets.length} coding set(s) to /tmp/ccbp-work/coding-questions.json\n`);
