import chalk from "chalk";
import { debugAxiosError, debug } from "./logger.js";
import ora from "ora";
import type { AxiosInstance, AxiosError } from "axios";
import type { RunConfig, Topic, Unit } from "./types.js";
import { UNIT_TYPE, QUESTION_STATUS } from "./types.js";
import { ConcurrencyLimiter } from "./concurrency.js";
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
import { solveAll, solveSqlQuestions, solveCodingQuestion, pickLanguage, encodeCodeContent, fetchDbSchema, refineSqlAnswer } from "./solver-interface.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PRACTICE_RETRY_THRESHOLD_PERCENT = 75;
const MAX_PRACTICE_SCORE_ATTEMPTS = 3;

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

// ── Question status helper ──────────────────────────────────────────────────

function isQuestionAnswered(questionStatus: string): boolean {
  return (
    questionStatus === QUESTION_STATUS.CORRECT ||
    questionStatus === QUESTION_STATUS.COMPLETED
  );
}

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
    debugAxiosError("completeLearningSet", err);
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

  for (let attemptNumber = 1; attemptNumber <= MAX_PRACTICE_SCORE_ATTEMPTS; attemptNumber++) {
    const retryLabel =
      attemptNumber > 1
        ? chalk.dim(` (score retry ${attemptNumber}/${MAX_PRACTICE_SCORE_ATTEMPTS})`)
        : "";

    // Step 1: Create exam attempt
    let examAttemptId: string;
    const attemptSpinner = ora(`  Creating exam attempt${retryLabel}…`).start();
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

    // Step 3: Solve with AI
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

    let scorePercent: number | null = null;
    try {
      const totalTime = responses.reduce((a, r) => a + r.time_spent, 0) + 30;
      const submitResult = await submitAnswers(
        client,
        examAttemptId,
        responses,
        totalTime,
      );
      const { correct_answer_count, total_questions_count } =
        submitResult.questions_stats;
      const score = submitResult.current_total_score;
      scorePercent =
        total_questions_count > 0
          ? (correct_answer_count / total_questions_count) * 100
          : 0;
      submitSpinner.succeed(
        `  Submitted — ${chalk.green(`${correct_answer_count}/${total_questions_count}`)} correct (${scorePercent.toFixed(0)}%)  score: ${score}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      submitSpinner.fail(`  Submit failed: ${msg}`);
      debugAxiosError("submitAnswers (practice)", err);
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

    if (scorePercent === null) return;

    if (
      scorePercent < PRACTICE_RETRY_THRESHOLD_PERCENT &&
      attemptNumber < MAX_PRACTICE_SCORE_ATTEMPTS
    ) {
      log(
        "warn",
        `Practice score ${scorePercent.toFixed(0)}% is below ${PRACTICE_RETRY_THRESHOLD_PERCENT}% — retrying exam`,
      );
      await sleep(Math.max(delayMs, 1000));
      continue;
    }

    if (scorePercent < PRACTICE_RETRY_THRESHOLD_PERCENT) {
      log(
        "warn",
        `Practice score stayed below ${PRACTICE_RETRY_THRESHOLD_PERCENT}% after ${MAX_PRACTICE_SCORE_ATTEMPTS} attempt(s)`,
      );
    }

    return;
  }
}

// ── Question Set flow ─────────────────────────────────────────────────────────

async function handleQuestionSet(
  client: AxiosInstance,
  unit: Unit,
  skipCompleted: boolean,
  delayMs: number,
): Promise<void> {
  const name =
    unit.question_set_unit_details?.name ??
    unit.learning_resource_set_unit_details?.name ??
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
      probeSpinner.succeed("  Coding Question Set");
    }
  } catch {
    // SQL endpoint returns 4xx for non-SQL sets — that's expected, not an error
    probeSpinner.succeed("  Coding Question Set");
  }

  await sleep(delayMs);

  // ── SQL path ─────────────────────────────────────────────────────────
  if (isSql && sqlQuestions) {
    const unanswered = sqlQuestions.questions.filter(
      (q) => !isQuestionAnswered(q.question_status),
    );

    if (unanswered.length === 0) {
      log("skip", "  All SQL questions already correct");
      return;
    }

    // Extract schema context from learning_resource_details content
    const dbContext =
      (sqlQuestions.learning_resource_details as any)?.content ?? "";
    const dbUrl = sqlQuestions.db_url ?? "";

    // Fetch real DB schema from the SQLite file — gives AI the actual table/column names
    const schemaSpinner = ora("  Fetching DB schema…").start();
    const realSchema = await fetchDbSchema(dbUrl);
    if (realSchema) {
      schemaSpinner.succeed(`  DB schema loaded — ${realSchema.split("\n").length} table(s)`);
    } else {
      schemaSpinner.warn("  Could not fetch DB schema (will use description context)");
    }

    const solveSpinner = ora(`  Solving ${unanswered.length} SQL question(s) with AI…`).start();
    let sqlAnswers: Map<string, string>;
    try {
      sqlAnswers = await solveSqlQuestions(unanswered, dbContext, realSchema, (done, total) => {
        solveSpinner.text = `  Solving SQL questions with AI… ${done}/${total}`;
      });
      solveSpinner.succeed(`  Solved ${sqlAnswers.size} SQL question(s)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      solveSpinner.fail(`  SQL solving failed: ${msg}`);
      return;
    }

    await sleep(delayMs);

    // Submit each SQL question with up to 5 AI-fix retries + 3 network retries on 5xx
    const MAX_AI_RETRIES = 5;
    const MAX_NET_RETRIES = 3;

    /** Retry wrapper: retries on 5xx / network errors with exponential backoff */
    async function submitWithRetry(
      payload: Parameters<typeof submitSqlAnswers>[1],
    ): Promise<Awaited<ReturnType<typeof submitSqlAnswers>>> {
      let lastErr: unknown;
      for (let n = 0; n < MAX_NET_RETRIES; n++) {
        try {
          return await submitSqlAnswers(client, payload);
        } catch (err: unknown) {
          const status = (err as AxiosError)?.response?.status;
          if (status && status < 500) throw err; // 4xx = our fault, don't retry
          lastErr = err;
          const wait = 1000 * 2 ** n; // 1s, 2s, 4s
          debug(`[SQL Submit] Network/5xx error (attempt ${n + 1}), retrying in ${wait}ms…`);
          await sleep(wait);
        }
      }
      throw lastErr;
    }

    for (let i = 0; i < unanswered.length; i++) {
      const q = unanswered[i]!;
      let currentSql = sqlAnswers.get(q.question_id);
      if (!currentSql) continue;

      const label = q.question.short_text?.trim() || `Q${q.question_number}` || q.question_id.slice(0, 8);

      for (let attempt = 0; attempt <= MAX_AI_RETRIES; attempt++) {
        const isRetry = attempt > 0;
        const tag = isRetry ? ` (retry ${attempt}/${MAX_AI_RETRIES})` : "";
        const submitSpinner = ora(`  [${i + 1}/${unanswered.length}] Submitting${tag}: ${label}…`).start();

        debug(`[SQL Q${q.question_number}] Attempt ${attempt + 1} SQL:\n${currentSql}`);

        let evalResult: string | undefined;
        let errorDetail: string | undefined;

        try {
          const result = await submitWithRetry([{
            question_id: q.question_id,
            time_spent: 10 + i * 5 + attempt * 3,
            user_response_code: { code_content: currentSql, language: "SQL" as const },
          }]);

          const r = result.submission_results[0];
          evalResult = r?.evaluation_result;

          if (evalResult === "CORRECT") {
            const tag2 = isRetry ? chalk.dim(` (fixed on retry ${attempt})`) : "";
            submitSpinner.succeed(`  [${i + 1}/${unanswered.length}] ${chalk.green("CORRECT")} — ${label}${tag2}`);
            break;
          }

          const sub = r?.coding_submission_response;
          errorDetail = sub?.reason_for_error
            ?? (sub?.reason_for_failures?.length ? sub.reason_for_failures.join("\n") : null)
            ?? `${sub?.passed_test_cases_count ?? 0}/${sub?.total_test_cases_count ?? "?"} tests passed`;

          if (attempt < MAX_AI_RETRIES) {
            submitSpinner.warn(`  [${i + 1}/${unanswered.length}] ${chalk.yellow("INCORRECT")} — ${label} — asking AI to fix…`);
            debug(`[SQL Q${q.question_number}] Error:\n${errorDetail}`);
            currentSql = await refineSqlAnswer(q, currentSql, errorDetail, realSchema, dbContext);
            await sleep(Math.max(delayMs, 400));
          } else {
            submitSpinner.warn(`  [${i + 1}/${unanswered.length}] ${chalk.yellow(evalResult ?? "UNKNOWN")} — ${label} (gave up after ${MAX_AI_RETRIES} retries)`);
            log("warn", `      Reason: ${chalk.red(errorDetail)}`);
            debug(`[SQL Q${q.question_number}] Full response:`, JSON.stringify(r, null, 2));
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          submitSpinner.fail(`  [${i + 1}/${unanswered.length}] Submit failed: ${msg}`);
          debugAxiosError("submitSqlAnswers", err);
          break;
        }
      }

      if (i < unanswered.length - 1) await sleep(delayMs);
    }

    // ── Post-completion check: re-fetch status and resubmit missed ones ──────────
    await sleep(delayMs);
    const checkSpinner = ora("  Verifying submission status…").start();
    try {
      const refreshed = await getSqlQuestions(client, unit.unit_id);
      const missed = refreshed.questions.filter(
        (q) => !isQuestionAnswered(q.question_status),
      );
      if (missed.length === 0) {
        checkSpinner.succeed(`  All SQL questions confirmed CORRECT`);
      } else {
        checkSpinner.warn(`  ${missed.length} question(s) still not CORRECT — resubmitting…`);
        for (const mq of missed) {
          const cachedSql = sqlAnswers.get(mq.question_id);
          if (!cachedSql) continue;
          const mlabel = mq.question.short_text?.trim() || `Q${mq.question_number}`;
          const rs = ora(`  Resubmitting: ${mlabel}…`).start();
          try {
            const reResult = await submitWithRetry([{
              question_id: mq.question_id,
              time_spent: 30,
              user_response_code: { code_content: cachedSql, language: "SQL" as const },
            }]);
            const rr = reResult.submission_results[0];
            if (rr?.evaluation_result === "CORRECT") {
              rs.succeed(`  Resubmit CORRECT — ${mlabel}`);
            } else {
              rs.warn(`  Resubmit ${rr?.evaluation_result ?? "UNKNOWN"} — ${mlabel}`);
            }
          } catch (err) {
            rs.fail(`  Resubmit failed — ${mlabel}`);
            debugAxiosError("resubmitSql", err);
          }
          await sleep(delayMs);
        }
      }
    } catch (err) {
      checkSpinner.warn("  Could not verify status (non-fatal)");
      debugAxiosError("getSqlQuestions (post-check)", err);
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
  const unanswered = summary.filter((q) => !isQuestionAnswered(q.question_status));
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

  // Solve and submit each question individually
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

    // Always start the question before submitting — server requires it
    // (returns USER_QUESTIONS_DOES_NOT_EXIST without this call)
    const startSpinner = ora(`  Starting question on server…`).start();
    try {
      await startCodingQuestion(client, q.question_id);
      startSpinner.succeed(`  Question started`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      startSpinner.warn(`  Start failed (${msg}) — attempting submit anyway`);
      debugAxiosError("startCodingQuestion", err);
    }

    await sleep(Math.max(delayMs / 2, 200));

    // Submit immediately after
    const submitSpinner = ora(`  Submitting answer…`).start();
    try {
      const result = await submitCodingAnswers(client, [{
        question_id: q.question_id,
        time_spent: 30 + i * 10,
        coding_answer: {
          code_content: encodedCode,
          language: lang,
        },
      }]);
      const r = result.submission_result[0];
      if (r?.evaluation_result === "CORRECT") {
        submitSpinner.succeed(
          `  Submitted — ${chalk.green("CORRECT")}  score: ${r.user_response_score}`,
        );
      } else {
        submitSpinner.warn(
          `  Submitted — ${chalk.yellow(r?.evaluation_result ?? "UNKNOWN")}  (${r?.passed_test_cases_count ?? 0}/${r?.total_test_cases_count ?? "?"} tests passed)`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      submitSpinner.fail(`  Submit failed: ${msg}`);
      debugAxiosError("submitCodingAnswers", err);
    }

    if (i < questions.length - 1) await sleep(delayMs);
  }

  // ── Post-completion check: re-fetch coding summary and resubmit missed ones ───
  await sleep(delayMs);
  const codingCheckSpinner = ora("  Verifying coding submission status…").start();
  try {
    const refreshedSummary = await getCodingQuestionsSummary(client, unit.unit_id);
    const stillWrong = refreshedSummary.filter(
      (q) => !isQuestionAnswered(q.question_status),
    );
    if (stillWrong.length === 0) {
      codingCheckSpinner.succeed(`  All coding questions confirmed CORRECT`);
    } else {
      codingCheckSpinner.warn(`  ${stillWrong.length} question(s) still not CORRECT — resubmitting…`);
      // Fetch details for the missed ones
      const missedIds = stillWrong.map((q) => q.question_id);
      let missedDetails: Awaited<ReturnType<typeof getCodingQuestions>>["questions"] = [];
      try {
        const res = await getCodingQuestions(client, missedIds);
        missedDetails = res.questions;
      } catch {
        codingCheckSpinner.warn(`  Could not load missed question details — skipping resubmit`);
      }
      for (const mq of missedDetails) {
        const summaryEntry = stillWrong.find((s) => s.question_id === mq.question_id);
        const lang = pickLanguage(summaryEntry?.applicable_languages ?? [mq.code.language]);
        const mlabel = mq.question.short_text ?? mq.question_id.slice(0, 8);
        const rs = ora(`  Resubmitting: ${mlabel}…`).start();
        try {
          let code: string;
          try { code = await solveCodingQuestion(mq, lang); }
          catch { code = decodeCodeContentLocal(mq.code.code_content); }
          await startCodingQuestion(client, mq.question_id);
          await sleep(200);
          const reResult = await submitCodingAnswers(client, [{
            question_id: mq.question_id,
            time_spent: 30,
            coding_answer: { code_content: encodeCodeContent(code), language: lang },
          }]);
          const rr = reResult.submission_result[0];
          if (rr?.evaluation_result === "CORRECT") {
            rs.succeed(`  Resubmit CORRECT — ${mlabel}`);
          } else {
            rs.warn(`  Resubmit ${rr?.evaluation_result ?? "UNKNOWN"} — ${mlabel}`);
          }
        } catch (err) {
          rs.fail(`  Resubmit failed — ${mlabel}`);
          debugAxiosError("resubmitCoding", err);
        }
        await sleep(delayMs);
      }
    }
  } catch (err) {
    codingCheckSpinner.warn("  Could not verify coding status (non-fatal)");
    debugAxiosError("getCodingQuestionsSummary (post-check)", err);
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

// ── Unit grouping helper (single-pass) ──────────────────────────────────────

interface GroupedUnits {
  learning: Unit[];
  practice: Unit[];
  question: Unit[];
}

/**
 * Group units by type in a single pass (O(n) instead of O(3n)).
 * Only includes units matching the current mode.
 */
function groupUnitsByType(units: Unit[], mode: string): GroupedUnits {
  const grouped: GroupedUnits = { learning: [], practice: [], question: [] };

  for (const unit of units) {
    // Learning sets
    if (
      unit.unit_type === UNIT_TYPE.LEARNING_SET &&
      (mode === "learning_sets" || mode === "all")
    ) {
      grouped.learning.push(unit);
    }
    // Practice sets
    else if (
      unit.unit_type === UNIT_TYPE.PRACTICE &&
      (mode === "practice" || mode === "all")
    ) {
      grouped.practice.push(unit);
    }
    // Question sets
    else if (
      unit.unit_type === UNIT_TYPE.QUESTION_SET &&
      (mode === "question_sets" || mode === "all")
    ) {
      grouped.question.push(unit);
    }
  }

  return grouped;
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

  // Group units by type in a single pass (O(n) instead of O(3n))
  const { learning: learningUnits, practice: practiceUnits, question: questionUnits } = groupUnitsByType(units, config.mode);

  // Process learning units with high concurrency (8 at a time)
  // Learning sets are quick and isolated, can be safely parallelized
  if (learningUnits.length > 0) {
    const limiter = new ConcurrencyLimiter(8);
    await limiter.runAll(
      learningUnits.map(
        (unit) => () =>
          handleLearningSet(client, unit, config.skipCompleted, config.delayMs),
      ),
    );
  }

  // Process practice units with moderate concurrency (3 at a time)
  // Practice exams need more time per unit; limit to prevent overwhelming the API
  if (practiceUnits.length > 0) {
    const limiter = new ConcurrencyLimiter(3);
    await limiter.runAll(
      practiceUnits.map(
        (unit) => () =>
          handlePracticeSet(client, unit, config.skipCompleted, config.delayMs),
      ),
    );
  }

  // Process question units with lower concurrency (2 at a time)
  // Coding/SQL questions are computationally expensive and require more API calls
  if (questionUnits.length > 0) {
    const limiter = new ConcurrencyLimiter(2);
    await limiter.runAll(
      questionUnits.map(
        (unit) => () =>
          handleQuestionSet(client, unit, config.skipCompleted, config.delayMs),
      ),
    );
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
