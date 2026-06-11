import { createClient, buildPayload, saveJson, loadJson } from "./ccbp-lib.js";

const TOKEN = process.env.CCBP_TOKEN;
if (!TOKEN) { console.error("CCBP_TOKEN env var required"); process.exit(1); }

const client = createClient(TOKEN);
const allUnits = loadJson("topic-units.json");

const allPracticeQuestions = [];

for (const course of allUnits) {
  for (const t of course.topics) {
    for (const unit of t.units) {
      if (unit.unit_type !== "PRACTICE") continue;
      if (unit.completion_percentage >= 100) continue;
      if (unit.is_unit_locked) continue;

      const name = unit.practice_unit_details?.name || unit.unit_id;
      process.stdout.write(`\n  Practice: ${name}\n`);

      // Create exam attempt
      let examAttemptId;
      try {
        const { data } = await client.post(
          "/api/nkb_exam/user/exam/exam_attempt/",
          buildPayload({ exam_id: unit.unit_id })
        );
        examAttemptId = data.exam_attempt_id;
        console.log(`    Attempt created: ${examAttemptId}`);
      } catch (err) {
        console.log(`    FAILED to create attempt: ${err.response?.status || err.message}`);
        continue;
      }

      // Fetch questions
      try {
        const { data } = await client.post(
          "/api/nkb_primitive_coding/user/exam_attempt/primitive_coding/questions/?offset=0&length=999",
          buildPayload({ exam_attempt_id: examAttemptId })
        );
        console.log(`    ${data.questions.length} questions fetched`);

        allPracticeQuestions.push({
          course_title: course.course_title,
          topic_name: t.topic?.topic_name,
          unit_name: name,
          unit_id: unit.unit_id,
          exam_attempt_id: examAttemptId,
          questions: data.questions,
          questions_stats: data.questions_stats,
        });
      } catch (err) {
        console.log(`    FAILED to fetch questions: ${err.response?.status || err.message}`);
      }
    }
  }
}

saveJson("practice-questions.json", allPracticeQuestions);
console.log(`\n  Saved ${allPracticeQuestions.length} practice sets to /tmp/ccbp-work/practice-questions.json\n`);
