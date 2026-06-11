import { createClient, buildPayload, loadJson } from "./ccbp-lib.js";

const TOKEN = process.env.CCBP_TOKEN;
if (!TOKEN) { console.error("CCBP_TOKEN env var required"); process.exit(1); }

const client = createClient(TOKEN);
const allPractice = loadJson("practice-questions.json");
const answersData = loadJson("practice-answers.json");
const answers = answersData.answers;

const PRACTICE_RETRY_THRESHOLD = 75;
const MAX_ATTEMPTS = 3;

for (const set of allPractice) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Use the stored exam_attempt_id for first attempt, create new ones for retries
    let examAttemptId = set.exam_attempt_id;

    if (attempt > 1) {
      console.log(`\n  Retry ${attempt}/${MAX_ATTEMPTS} for: ${set.unit_name}`);
      try {
        const { data } = await client.post(
          "/api/nkb_exam/user/exam/exam_attempt/",
          buildPayload({ exam_id: set.unit_id })
        );
        examAttemptId = data.exam_attempt_id;
        console.log(`    New attempt: ${examAttemptId}`);

        const { data: qData } = await client.post(
          "/api/nkb_primitive_coding/user/exam_attempt/primitive_coding/questions/?offset=0&length=999",
          buildPayload({ exam_attempt_id: examAttemptId })
        );
        set.questions = qData.questions;
      } catch (err) {
        console.log(`    FAILED retry: ${err.response?.status || err.message}`);
        break;
      }
    }

    console.log(`\n  Submitting: ${set.unit_name} (attempt ${attempt})`);

    const responses = set.questions
      .map((q, i) => ({
        question_id: q.question_id,
        question_number: q.question_number,
        time_spent: 10 + i * 3,
        multiple_choice_answer_id: answers[q.question_id] || q.options[0]?.option_id || "",
      }));

    const totalTime = responses.reduce((a, r) => a + r.time_spent, 0) + 30;

    try {
      const { data } = await client.post(
        "/api/nkb_primitive_coding/user/exam_attempt/primitive_coding/submit/",
        buildPayload({
          exam_attempt_id: examAttemptId,
          total_time_spent: totalTime,
          responses,
        })
      );
      const { correct_answer_count, total_questions_count } = data.questions_stats;
      const pct = total_questions_count > 0 ? (correct_answer_count / total_questions_count) * 100 : 0;
      console.log(`    Score: ${correct_answer_count}/${total_questions_count} (${pct.toFixed(0)}%)  total: ${data.current_total_score}`);

      // End attempt
      await client.post(
        "/api/nkb_exam/user/exam_attempt/end/",
        buildPayload({
          exam_attempt_id: examAttemptId,
          end_reason_enum: "ENDED_BY_USER_BY_NAVIGATING_BACK",
        })
      ).catch(() => {});

      if (pct >= PRACTICE_RETRY_THRESHOLD) break;
      if (attempt < MAX_ATTEMPTS) console.log(`    Below ${PRACTICE_RETRY_THRESHOLD}%, retrying...`);
    } catch (err) {
      console.log(`    FAILED: ${err.response?.status || err.message}`);
      // End attempt on failure too
      await client.post(
        "/api/nkb_exam/user/exam_attempt/end/",
        buildPayload({
          exam_attempt_id: examAttemptId,
          end_reason_enum: "ENDED_BY_USER_BY_NAVIGATING_BACK",
        })
      ).catch(() => {});
      break;
    }
  }
}

console.log("\n  All practice sets processed\n");
