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
} from "./api.js";
import { solveAll } from "./solver.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Logging helpers ───────────────────────────────────────────────────────────

function log(level: "info" | "ok" | "warn" | "skip" | "err", msg: string): void {
  const prefix: Record<typeof level, string> = {
    info: chalk.blue("  ℹ"),
    ok: chalk.green("  ✔"),
    warn: chalk.yellow("  ⚠"),
    skip: chalk.gray("  ─"),
    err: chalk.red("  ✖"),
  };
  console.log(`${prefix[level]} ${msg}`);
}

// ── Learning Set completion ───────────────────────────────────────────────────

async function handleLearningSet(
  client: AxiosInstance,
  unit: Unit,
  skipCompleted: boolean,
  delayMs: number
): Promise<void> {
  const name =
    unit.learning_resource_set_unit_details?.name ?? unit.unit_id;

  if (skipCompleted && unit.completion_status === "COMPLETED") {
    log("skip", `Learning Set: ${chalk.dim(name)} ${chalk.gray("(already done)")}`);
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
  delayMs: number
): Promise<void> {
  const name = unit.practice_unit_details?.name ?? unit.unit_id;

  if (skipCompleted && unit.completion_percentage >= 100) {
    log("skip", `Practice: ${chalk.dim(name)} ${chalk.gray("(already done)")}`);
    return;
  }

  if (unit.is_unit_locked) {
    log("warn", `Practice: ${chalk.dim(name)} ${chalk.yellow("(locked — skipping)")}`);
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
  const solveSpinner = ora(`  Solving ${questions.length} question(s) with AI…`).start();
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
    submitResult = await submitAnswers(client, examAttemptId, responses, totalTime);
    const { correct_answer_count, total_questions_count } = submitResult.questions_stats;
    const score = submitResult.current_total_score;
    const pct = ((correct_answer_count / total_questions_count) * 100).toFixed(0);
    submitSpinner.succeed(
      `  Submitted — ${chalk.green(`${correct_answer_count}/${total_questions_count}`)} correct (${pct}%)  score: ${score}`
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

// ── Topic runner ──────────────────────────────────────────────────────────────

async function processTopic(
  client: AxiosInstance,
  topic: Topic,
  courseId: string,
  config: RunConfig
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
      chalk.gray(` [${(topic.completion_percentage ?? 0).toFixed(0)}% done]`)
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
      (config.mode === "learning_sets" || config.mode === "both");

    const doPractice =
      unit.unit_type === "PRACTICE" &&
      (config.mode === "practice" || config.mode === "both");

    if (doLearning) {
      await handleLearningSet(client, unit, config.skipCompleted, config.delayMs);
    } else if (doPractice) {
      await handlePracticeSet(client, unit, config.skipCompleted, config.delayMs);
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
  topicLimit: number | "all"
): Promise<void> {
  console.log(chalk.bold.bgCyan.black(`\n  COURSE: ${courseTitle}  `));

  const courseSpinner = ora("Loading course structure…").start();
  let courseDetails;
  try {
    courseDetails = await getCourseDetails(client, courseId);
    courseSpinner.succeed(
      `${courseDetails.topics.length} topics loaded  (${courseDetails.completion_percentage.toFixed(1)}% complete)`
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

export async function run(client: AxiosInstance, config: RunConfig): Promise<void> {
  console.log(chalk.bold.cyan("\n════════════════════════════════════════════"));
  console.log(chalk.bold.cyan("  Starting automation…"));
  console.log(chalk.bold.cyan("════════════════════════════════════════════\n"));

  for (const course of config.selectedCourses) {
    await processCourse(
      client,
      config,
      course.course_id,
      course.course_title,
      course.topicLimit
    );
  }

  console.log(chalk.bold.green("\n════════════════════════════════════════════"));
  console.log(chalk.bold.green("  All done!"));
  console.log(chalk.bold.green("════════════════════════════════════════════\n"));
}
