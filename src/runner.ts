import chalk from "chalk";
import ora from "ora";
import type { AxiosInstance } from "axios";
import type { RunConfig, Topic, Unit } from "./types.js";
import {
  getCourseDetails,
  getTopicUnits,
  completeLearningSet,
  createExamAttempt,
  getExamQuestions,
  submitAnswers,
  endExamAttempt,
  getSqlQuestions,
  submitSqlAnswers,
  getCodingQuestionsSummary,
  getCodingQuestions,
  submitCodingAnswers,
  startCodingQuestion,
  saveCodingAnswer,
} from "./api.js";
import { solveAll, solveSqlQuestions, solveCodingQuestion, pickLanguage, encodeCodeContent } from "./solver.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Logging helpers ───────────────────────────────────────────────────────────

function log(
  level: "info" | "ok" | "warn" | "skip" | "err",
  msg: string,
): void {
  const prefix: Record<typeof level, string> = {
    info: chalk.blue("  ℹ"),
    ok: chalk.green("  ✔ "),
    warn: chalk.yellow("  ⚠"),
    skip: chalk.gray("  ─"),
    err: chalk.red("  ✖ "),
  };
  console.log(`${prefix[level]} ${msg}`);
}

// ── Learning Set completion ───────────────────────────────────────────────────

async function handleLearningSet(
  client: AxiosInstance,
  unit: Unit,
  skipCompleted: boolean,
  delayMs: number,
): Promise<void> {
  const name = unit.learning_resource_set_unit_details?.name ?? unit.unit_id;

  if (skipCompleted && unit.completion_status === "COMPLETED") {
    log(
      "skip",
      `Learning Set: ${chalk.dim(name)} ${chalk.gray("(already done)")}`,
    );
    return;
  }

  const spinner = ora({ text: `Learning Set: ${name}`, color: "cyan" }).start();

  try {
    await completeLearningSet(client, unit.unit_id);
    spinner.succeed(chalk.green(`Learning Set: ${name}`));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    spinner.fail(chalk.red(`Learning Set: ${name} — ${msg}`));
  }

  await sleep(delayMs);
}

// ── Practice Set flow ─────────────────────────────────────────────────────────

async function handlePracticeSet(
  client: AxiosInstance,
  unit: Unit,
  skipCompleted: boolean,
  delayMs: number,
): Promise<void> {
  const name = unit.practice_unit_details?.name ?? unit.unit_id;

  if (skipCompleted && unit.completion_percentage >= 100) {
    log("skip", `Practice: ${chalk.dim(name)} ${chalk.gray("(already done)")}`);
    return;
  }

  if (unit.is_unit_locked) {
    log(
      "warn",
      `Practice: ${chalk.dim(name)} ${chalk.yellow("(locked — skipping)")}`,
    );
    return;
  }

  console.log(chalk.bold(`\n  ▸ Practice: ${chalk.cyan(name)}`));

  // Step 1: Create exam attempt
  let examAttemptId: string;
  const attemptSpinner = ora("  Creating exam attempt…").start();
  try {
    const attempt = await createExamAttempt(client, unit.unit_id);
    examAttemptId = attempt.exam_attempt_id;
    attemptSpinner.succeed(`  Exam attempt: ${chalk.dim(examAttemptId)}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    attemptSpinner.fail(`  Failed to create attempt: ${msg}`);
    return;
  }

  await sleep(delayMs);

  // Step 2: Fetch questions
  const qSpinner = ora("  Fetching questions…").start();
  let questions;
  try {
    const res = await getExamQuestions(client, examAttemptId);
    questions = res.questions;
    qSpinner.succeed(`  Got ${questions.length} question(s)`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    qSpinner.fail(`  Failed to fetch questions: ${msg}`);
    await endExamAttempt(client, examAttemptId).catch(() => {});
    return;
  }

  await sleep(delayMs);

  // Step 3: Solve with Groq
  const solveSpinner = ora(
    `  Solving ${questions.length} question(s) with AI…`,
  ).start();
  let answers: Map<string, string>;
  try {
    answers = await solveAll(questions, (done, total) => {
      solveSpinner.text = `  Solving questions with AI… ${done}/${total}`;
    });
    solveSpinner.succeed(`  Solved ${answers.size} question(s)`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    solveSpinner.fail(`  AI solving failed: ${msg}`);
    await endExamAttempt(client, examAttemptId).catch(() => {});
    return;
  }

  // Step 4: Submit all answers at once
  const submitSpinner = ora("  Submitting answers…").start();
  const responses = questions
    .filter((q) => answers.has(q.question_id) && answers.get(q.question_id))
    .map((q, i) => ({
      question_id: q.question_id,
      question_number: q.question_number,
      time_spent: 10 + i * 3, // Simulate realistic time spent
      multiple_choice_answer_id: answers.get(q.question_id)!,
    }));

  let submitResult;
  try {
    const totalTime = responses.reduce((a, r) => a + r.time_spent, 0) + 30;
    submitResult = await submitAnswers(
      client,
      examAttemptId,
      responses,
      totalTime,
    );
    const { correct_answer_count, total_questions_count } =
      submitResult.questions_stats;
    const score = submitResult.current_total_score;
    const pct = ((correct_answer_count / total_questions_count) * 100).toFixed(
      0,
    );
    submitSpinner.succeed(
      `  Submitted — ${chalk.green(`${correct_answer_count}/${total_questions_count}`)} correct (${pct}%)  score: ${score}`,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    submitSpinner.fail(`  Submit failed: ${msg}`);
  }

  await sleep(delayMs);

  // Step 5: End attempt
  const endSpinner = ora("  Ending attempt…").start();
  try {
    await endExamAttempt(client, examAttemptId);
    endSpinner.succeed("  Attempt ended");
  } catch {
    endSpinner.warn("  Could not cleanly end attempt (non-fatal)");
  }

  await sleep(delayMs);
}

// ── Question Set flow ─────────────────────────────────────────────────────────

async function handleQuestionSet(
  client: AxiosInstance,
  unit: Unit,
  skipCompleted: boolean,
  delayMs: number,
): Promise<void> {
  const name =
    (unit as any).question_set_unit_details?.name ??
    (unit as any).learning_resource_set_unit_details?.name ??
    unit.unit_id;

  if (skipCompleted && unit.completion_percentage >= 100) {
    log("skip", `Question Set: ${chalk.dim(name)} ${chalk.gray("(already done)")}`);
    return;
  }

  if (unit.is_unit_locked) {
    log("warn", `Question Set: ${chalk.dim(name)} ${chalk.yellow("(locked — skipping)")}`);
    return;
  }

  console.log(chalk.bold(`\n  ▸ Question Set: ${chalk.cyan(name)}`));

  // ── Try SQL path first ───────────────────────────────────────────────
  let isSql = false;
  let sqlQuestions: Awaited<ReturnType<typeof getSqlQuestions>> | null = null;

  const probeSpinner = ora("  Detecting question set type…").start();
  try {
    const res = await getSqlQuestions(client, unit.unit_id);
    if (res.questions && res.questions.length > 0) {
      isSql = true;
      sqlQuestions = res;
      probeSpinner.succeed(`  SQL Question Set — ${res.questions.length} question(s)`);
    } else {
      probeSpinner.succeed("  Coding Question Set (no SQL questions found)");
    }
  } catch {
    probeSpinner.succeed("  Coding Question Set (SQL probe failed)");
  }

  await sleep(delayMs);

  // ── SQL path ─────────────────────────────────────────────────────────
  if (isSql && sqlQuestions) {
    const unanswered = sqlQuestions.questions.filter(
      (q) => q.question_status !== "CORRECT" && q.question_status !== "COMPLETED",
    );

    if (unanswered.length === 0) {
      log("skip", "  All SQL questions already correct");
      return;
    }

    // Extract schema context from learning_resource_details content
    const dbContext =
      (sqlQuestions.learning_resource_details as any)?.content ?? "";

    const solveSpinner = ora(`  Solving ${unanswered.length} SQL question(s) with AI…`).start();
    let sqlAnswers: Map<string, string>;
    try {
      sqlAnswers = await solveSqlQuestions(unanswered, dbContext, (done, total) => {
        solveSpinner.text = `  Solving SQL questions with AI… ${done}/${total}`;
      });
      solveSpinner.succeed(`  Solved ${sqlAnswers.size} SQL question(s)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      solveSpinner.fail(`  SQL solving failed: ${msg}`);
      return;
    }

    await sleep(delayMs);

    const submitSpinner = ora("  Submitting SQL answers…").start();
    try {
      const responses = unanswered
        .filter((q) => sqlAnswers.has(q.question_id))
        .map((q, i) => ({
          question_id: q.question_id,
          time_spent: 10 + i * 5,
          user_response_code: {
            code_content: sqlAnswers.get(q.question_id)!,
            language: "SQL" as const,
          },
        }));

      const result = await submitSqlAnswers(client, responses);
      const correct = result.submission_results.filter((r) => r.evaluation_result === "CORRECT").length;
      const total = result.submission_results.length;
      submitSpinner.succeed(
        `  SQL submitted — ${chalk.green(`${correct}/${total}`)} correct`,
      );

      // Log any wrong answers for visibility
      for (const r of result.submission_results) {
        if (r.evaluation_result !== "CORRECT") {
          const qText = unanswered.find((q) => q.question_id === r.question_id)?.question.short_text ?? r.question_id;
          log("warn", `  ✗ ${qText} — ${r.coding_submission_response?.reason_for_error ?? "INCORRECT"}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      submitSpinner.fail(`  SQL submit failed: ${msg}`);
    }

    return;
  }

  // ── Coding path ──────────────────────────────────────────────────────
  const summarySpinner = ora("  Fetching coding question list…").start();
  let summary: Awaited<ReturnType<typeof getCodingQuestionsSummary>>;
  try {
    summary = await getCodingQuestionsSummary(client, unit.unit_id);
    summarySpinner.succeed(`  ${summary.length} coding question(s) found`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    summarySpinner.fail(`  Failed to fetch question list: ${msg}`);
    return;
  }

  await sleep(delayMs);

  // Filter already-correct questions
  const unanswered = summary.filter((q) => q.question_status !== "CORRECT" && q.question_status !== "COMPLETED");
  if (unanswered.length === 0) {
    log("skip", "  All coding questions already correct");
    return;
  }

  // Fetch full question details (with templates + test cases)
  const detailSpinner = ora(`  Loading ${unanswered.length} question detail(s)…`).start();
  let questions: Awaited<ReturnType<typeof getCodingQuestions>>["questions"];
  try {
    const res = await getCodingQuestions(client, unanswered.map((q) => q.question_id));
    questions = res.questions;
    detailSpinner.succeed(`  Got ${questions.length} question detail(s)`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    detailSpinner.fail(`  Failed to load question details: ${msg}`);
    return;
  }

  await sleep(delayMs);

  // Solve each question individually (they may need different languages)
  const codingResponses: Array<{
    question_id: string;
    time_spent: number;
    coding_answer: { code_content: string; language: string };
  }> = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    const summaryEntry = unanswered.find((s) => s.question_id === q.question_id);
    const lang = pickLanguage(summaryEntry?.applicable_languages ?? q.code ? [q.code.language] : ["PYTHON"]);

    const solveSpinner = ora(
      `  [${i + 1}/${questions.length}] Solving "${q.question.short_text ?? q.question_id}" (${lang})…`,
    ).start();

    let code: string;
    try {
      code = await solveCodingQuestion(q, lang);
      solveSpinner.succeed(
        `  [${i + 1}/${questions.length}] ${chalk.green(q.question.short_text ?? q.question_id)} (${lang})`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      solveSpinner.warn(`  [${i + 1}/${questions.length}] ${q.question.short_text ?? q.question_id} — AI failed: ${msg}, using template`);
      code = decodeCodeContentLocal(q.code.code_content);
    }

    const encodedCode = encodeCodeContent(code);

    // If question is NOT_ATTEMPTED, call start + save first to transition state
    if (summaryEntry?.question_status === "NOT_ATTEMPTED") {
      try {
        await startCodingQuestion(client, q.question_id);
        await saveCodingAnswer(client, q.question_id, encodedCode, lang);
      } catch {
        // non-fatal — backend may still accept the submit
      }
      await sleep(Math.max(delayMs / 2, 300));
    }

    codingResponses.push({
      question_id: q.question_id,
      time_spent: 30 + i * 10,
      coding_answer: {
        code_content: encodedCode,
        language: lang,
      },
    });

    if (i < questions.length - 1) await sleep(delayMs);
  }

  // Submit all at once
  const submitSpinner = ora(`  Submitting ${codingResponses.length} coding answer(s)…`).start();
  try {
    const result = await submitCodingAnswers(client, codingResponses);
    const correct = result.submission_result.filter((r) => r.evaluation_result === "CORRECT").length;
    const total = result.submission_result.length;
    const totalScore = result.submission_result.reduce((a, r) => a + r.user_response_score, 0);
    submitSpinner.succeed(
      `  Coding submitted — ${chalk.green(`${correct}/${total}`)} correct  score: ${totalScore}`,
    );

    for (const r of result.submission_result) {
      if (r.evaluation_result !== "CORRECT") {
        const q = questions.find((q) => q.question_id === r.question_id);
        log(
          "warn",
          `  ✗ ${q?.question.short_text ?? r.question_id} — ${r.passed_test_cases_count ?? 0}/${r.total_test_cases_count ?? "?"} tests passed`,
        );
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    submitSpinner.fail(`  Coding submit failed: ${msg}`);
  }
}

// tiny local helper to avoid importing from solver just for decode
function decodeCodeContentLocal(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return raw;
  }
}

// ── Topic runner ──────────────────────────────────────────────────────────────

async function processTopic(
  client: AxiosInstance,
  topic: Topic,
  courseId: string,
  config: RunConfig,
): Promise<void> {
  if (topic.is_topic_locked) {
    log("warn", `Topic "${topic.topic_name}" is locked — skipping`);
    return;
  }

  if (config.skipCompleted && topic.completion_status === "COMPLETED") {
    log("skip", `Topic "${topic.topic_name}" (already completed)`);
    return;
  }

  console.log(
    chalk.bold.yellow(`\n  ● Topic ${topic.order}: ${topic.topic_name}`) +
      chalk.gray(` [${(topic.completion_percentage ?? 0).toFixed(0)}% done]`),
  );

  let units;
  const unitSpinner = ora("  Loading units…").start();
  try {
    const res = await getTopicUnits(client, topic.topic_id, courseId);
    units = res.units_details;
    unitSpinner.succeed(`  ${units.length} unit(s) found`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    unitSpinner.fail(`  Could not load units: ${msg}`);
    return;
  }

  await sleep(config.delayMs);

  for (const unit of units) {
    const doLearning =
      unit.unit_type === "LEARNING_SET" &&
      (config.mode === "learning_sets" || config.mode === "all");

    const doPractice =
      unit.unit_type === "PRACTICE" &&
      (config.mode === "practice" || config.mode === "all");

    const doQuestionSet =
      unit.unit_type === "QUESTION_SET" &&
      (config.mode === "question_sets" || config.mode === "all");

    if (doLearning) {
      await handleLearningSet(
        client,
        unit,
        config.skipCompleted,
        config.delayMs,
      );
    } else if (doPractice) {
      await handlePracticeSet(
        client,
        unit,
        config.skipCompleted,
        config.delayMs,
      );
    } else if (doQuestionSet) {
      await handleQuestionSet(
        client,
        unit,
        config.skipCompleted,
        config.delayMs,
      );
    } else if (
      unit.unit_type !== "QUIZ" &&
      unit.unit_type !== "ASSESSMENT" &&
      unit.unit_type !== "QUESTION_SET" &&
      unit.unit_type !== "PROJECT"
    ) {
      // Unknown unit type - just log it
    }
  }
}

// ── Course runner ─────────────────────────────────────────────────────────────

async function processCourse(
  client: AxiosInstance,
  config: RunConfig,
  courseId: string,
  courseTitle: string,
  topicLimit: number | "all",
): Promise<void> {
  console.log(chalk.bold.bgCyan.black(`\n  COURSE: ${courseTitle}  `));

  const courseSpinner = ora("Loading course structure…").start();
  let courseDetails;
  try {
    courseDetails = await getCourseDetails(client, courseId);
    courseSpinner.succeed(
      `${courseDetails.topics.length} topics loaded  (${courseDetails.completion_percentage.toFixed(1)}% complete)`,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    courseSpinner.fail(`Failed to load course: ${msg}`);
    return;
  }

  await sleep(config.delayMs);

  const topics = courseDetails.topics
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, topicLimit === "all" ? undefined : topicLimit);

  log("info", `Processing ${topics.length} topic(s)…`);

  for (const topic of topics) {
    await processTopic(client, topic, courseId, config);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function run(
  client: AxiosInstance,
  config: RunConfig,
): Promise<void> {
  console.log(
    chalk.bold.cyan("\n════════════════════════════════════════════"),
  );
  console.log(chalk.bold.cyan("  Starting automation…"));
  console.log(
    chalk.bold.cyan("════════════════════════════════════════════\n"),
  );

  for (const course of config.selectedCourses) {
    await processCourse(
      client,
      config,
      course.course_id,
      course.course_title,
      course.topicLimit,
    );
  }

  console.log(
    chalk.bold.green("\n════════════════════════════════════════════"),
  );
  console.log(chalk.bold.green("  All done!"));
  console.log(
    chalk.bold.green("════════════════════════════════════════════\n"),
  );
}
