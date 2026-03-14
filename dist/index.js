#!/usr/bin/env node

// src/index.ts
import { readFile as readFile2 } from "fs/promises";
import { fileURLToPath } from "url";
import { join as join2, dirname } from "path";
import chalk4 from "chalk";

// src/cli.ts
import { input, password, checkbox, select } from "@inquirer/prompts";
import chalk from "chalk";

// src/config.ts
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
var CONFIG_PATH = join(process.env.APPDATA || process.env.HOME || ".", ".niat-auto-config.json");
async function loadConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function saveConfig(cfg) {
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}

// src/cli.ts
function banner() {
  console.log(
    chalk.bold.cyan(`

\u2588\u2588\u2588\u2557\u2591\u2591\u2588\u2588\u2557\u2588\u2588\u2557\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2557\u2591\u2591\u2591\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D
\u2588\u2588\u2554\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591  \u2588\u2588\u2588\u2588\u2588\u2588\u2566\u255D\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591
\u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591
\u2588\u2588\u2551\u2591\u255A\u2588\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591  \u2588\u2588\u2588\u2588\u2588\u2588\u2566\u255D\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591
\u255A\u2550\u255D\u2591\u2591\u255A\u2550\u2550\u255D\u255A\u2550\u255D\u255A\u2550\u255D\u2591\u2591\u255A\u2550\u255D\u2591\u2591\u2591\u255A\u2550\u255D\u2591\u2591\u2591  \u255A\u2550\u2550\u2550\u2550\u2550\u255D\u2591\u2591\u255A\u2550\u2550\u2550\u2550\u2550\u255D\u2591\u2591\u2591\u2591\u255A\u2550\u255D\u2591\u2591\u2591\u2591\u2591\u2591\u255A\u2550\u255D\u2591\u2591\u2591

\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2557\u2591\u2591\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2591
\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2591\u2588\u2588\u2554\u255D\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557
\u2588\u2588\u2551\u2591\u2591\u255A\u2550\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551\u2591\u2591\u255A\u2550\u255D\u2588\u2588\u2588\u2588\u2588\u2550\u255D\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D
\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2588\u2588\u2557\u2591\u2588\u2588\u2554\u2550\u2550\u255D\u2591\u2591\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557
\u255A\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u2591\u255A\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551
\u2591\u255A\u2550\u2550\u2550\u2550\u255D\u2591\u255A\u2550\u255D\u2591\u2591\u255A\u2550\u255D\u255A\u2550\u255D\u2591\u2591\u255A\u2550\u255D\u2591\u255A\u2550\u2550\u2550\u2550\u255D\u2591\u255A\u2550\u255D\u2591\u2591\u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D\u2591\u2591\u255A\u2550\u255D`)
  );
  console.log(chalk.gray("  NIAT BUTT CRACKER \u2014 use Space to select, A for all\n"));
}
async function promptCredentials() {
  console.log(chalk.bold.yellow("\u2500\u2500 Credentials \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  const cfg = await loadConfig();
  let token = "";
  if (cfg.token && cfg.token.length > 10) {
    const masked = cfg.token.slice(0, 6) + "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" + cfg.token.slice(-4);
    const reuse = await select({
      message: `Saved bearer token (${masked}):`,
      choices: [
        { name: "Use saved token", value: "reuse" },
        { name: "Enter a new token", value: "new" }
      ]
    });
    if (reuse === "reuse") {
      token = cfg.token;
      console.log(chalk.gray("Using saved token."));
    }
  }
  if (!token) {
    token = (await password({
      message: "Bearer token (from browser DevTools / Network tab):",
      mask: "\u2022",
      validate: (v) => v.trim().length > 10 ? true : "Token looks too short"
    })).trim();
    await saveConfig({ ...cfg, token });
    console.log(chalk.gray("Token saved for next run."));
  }
  let groqKey = "";
  if (cfg.groqKey && cfg.groqKey.startsWith("gsk_")) {
    groqKey = cfg.groqKey;
    console.log(chalk.gray("Loaded Groq API key from config."));
  } else {
    groqKey = (await password({
      message: "Groq API key (for AI question solving \u2014 get at console.groq.com):",
      mask: "\u2022",
      validate: (v) => v.trim().startsWith("gsk_") ? true : 'Groq keys start with "gsk_"'
    })).trim();
    await saveConfig({ ...cfg, groqKey });
    console.log(chalk.green("Groq API key saved for future runs."));
  }
  return { token, groqKey };
}
async function selectSemester(curriculum) {
  console.log(chalk.bold.yellow("\n\u2500\u2500 Semester Selection \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  const choices = curriculum.curriculum_details.flatMap(
    (year) => year.semester_details.map((sem) => ({
      name: `Year ${year.year} \u203A ${sem.semester_name}`,
      value: sem
    }))
  );
  return select({
    message: "Select a semester:",
    choices
  });
}
async function selectCourses(semester) {
  console.log(chalk.bold.yellow("\n\u2500\u2500 Course Selection \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  console.log(chalk.gray("Space = toggle  \u2022  A = select all  \u2022  Enter = confirm\n"));
  const choices = semester.semester_subjects.flatMap(
    (subject) => subject.semester_courses.map((course) => ({
      name: `${chalk.dim(`[${subject.subject_code}]`)} ${course.course_title} ${chalk.dim(`(${course.no_of_topics} topics)`)}`,
      value: course,
      checked: false
    }))
  );
  const selected = await checkbox({
    message: "Choose course(s) to automate:",
    choices,
    validate: (v) => v.length > 0 ? true : "Select at least one course"
  });
  return selected;
}
async function selectTopicLimit(course) {
  const choice = await select({
    message: `${chalk.cyan(course.course_title)} \u2014 how many topics to process?`,
    choices: [
      { name: `All ${course.no_of_topics} topics`, value: "all" },
      { name: "Enter a specific number", value: "some" }
    ]
  });
  if (choice === "all") return "all";
  const raw = await input({
    message: `How many topics (1\u2013${course.no_of_topics})?`,
    default: String(course.no_of_topics),
    validate: (v) => {
      const n = parseInt(v, 10);
      return n >= 1 && n <= course.no_of_topics ? true : `Enter a number between 1 and ${course.no_of_topics}`;
    }
  });
  return parseInt(raw, 10);
}
async function selectMode() {
  console.log(chalk.bold.yellow("\n\u2500\u2500 What to complete \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  console.log(chalk.gray("Space = toggle  \u2022  A = select all  \u2022  Enter = confirm\n"));
  const choices = [
    {
      name: `${chalk.blue("Learning Sets")} \u2014 Mark video/reading resources as done`,
      value: "learning_sets",
      checked: false
    },
    {
      name: `${chalk.magenta("Practice Sets")} \u2014 Attempt and submit MCQ practice exams`,
      value: "practice",
      checked: false
    },
    {
      name: `${chalk.yellow("Question Sets")} \u2014 Solve SQL/Coding questions with AI`,
      value: "question_sets",
      checked: false
    }
  ];
  const selected = await checkbox({
    message: "What should be completed?",
    choices,
    validate: (v) => v.length > 0 ? true : "Select at least one option"
  });
  const hasLearning = selected.includes("learning_sets");
  const hasPractice = selected.includes("practice");
  const hasQuestions = selected.includes("question_sets");
  if (hasLearning && hasPractice && hasQuestions) return "all";
  if (hasLearning && !hasPractice && !hasQuestions) return "learning_sets";
  if (!hasLearning && hasPractice && !hasQuestions) return "practice";
  if (!hasLearning && !hasPractice && hasQuestions) return "question_sets";
  return "all";
}
function printSummary(config) {
  console.log(chalk.bold.yellow("\n\u2500\u2500 Run Summary \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  for (const course of config.selectedCourses) {
    const limit = course.topicLimit === "all" ? "all topics" : `${course.topicLimit} topics`;
    console.log(`  ${chalk.cyan("\u2022")} ${course.course_title} ${chalk.dim(`(${limit})`)}`);
  }
  const modeLabel = {
    all: "Learning Sets + Practice Sets + Question Sets",
    learning_sets: "Learning Sets only",
    practice: "Practice Sets only",
    question_sets: "Question Sets only"
  };
  console.log(`
  Mode:          ${chalk.green(modeLabel[config.mode])}`);
  console.log(`  Request delay: ${config.delayMs}ms
`);
}
async function runPrompts(curriculum) {
  banner();
  const { token, groqKey } = await promptCredentials();
  const semester = await selectSemester(curriculum);
  const courses = await selectCourses(semester);
  const selectedCourses = [];
  for (const course of courses) {
    const topicLimit = await selectTopicLimit(course);
    selectedCourses.push({
      course_id: course.course_id,
      course_title: course.course_title,
      topicLimit
    });
  }
  const mode = await selectMode();
  const skipCompleted = true;
  const delayMs = 100;
  const config = {
    token,
    groqKey,
    selectedCourses,
    mode,
    skipCompleted,
    delayMs
  };
  printSummary({ selectedCourses, mode, skipCompleted, delayMs });
  await input({ message: chalk.green("Press Enter to start automation\u2026"), default: "" });
  return config;
}

// src/api.ts
import axios from "axios";
var API_BASE = "https://nkb-backend-ccbp-prod-apis.ccbp.in";
function buildPayload(inner) {
  return { data: JSON.stringify(JSON.stringify(inner)), clientKeyDetailsId: 1 };
}
function createClient(token) {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: "https://learning.ccbp.in",
      referer: "https://learning.ccbp.in/",
      "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      "x-app-version": "1128",
      "x-browser-session-id": crypto.randomUUID()
    }
  });
}
async function getCourseDetails(client, courseId) {
  const { data } = await client.post(
    "/api/nkb_resources/user/course_details/v4/",
    buildPayload({
      course_id: courseId,
      is_session_plan_details_required: true,
      is_certification_details_required: false
    })
  );
  return data;
}
async function getTopicUnits(client, topicId, courseId) {
  const { data } = await client.post(
    "/api/nkb_resources/user/topic/units_details/v3/",
    buildPayload({ topic_id: topicId, course_id: courseId })
  );
  return data;
}
async function completeLearningSet(client, learningSetId) {
  await client.post(
    "/api/nkb_learning_resource/learning_resources/set/complete/",
    buildPayload({ learning_resource_set_id: learningSetId })
  );
}
async function createExamAttempt(client, examId) {
  const { data } = await client.post(
    "/api/nkb_exam/user/exam/exam_attempt/",
    buildPayload({ exam_id: examId })
  );
  return data;
}
async function getExamQuestions(client, examAttemptId) {
  const { data } = await client.post(
    "/api/nkb_primitive_coding/user/exam_attempt/primitive_coding/questions/?offset=0&length=999",
    buildPayload({ exam_attempt_id: examAttemptId })
  );
  return data;
}
async function submitAnswers(client, examAttemptId, responses, totalTimeSpent) {
  const { data } = await client.post(
    "/api/nkb_primitive_coding/user/exam_attempt/primitive_coding/submit/",
    buildPayload({ exam_attempt_id: examAttemptId, total_time_spent: totalTimeSpent, responses })
  );
  return data;
}
async function endExamAttempt(client, examAttemptId) {
  await client.post(
    "/api/nkb_exam/user/exam_attempt/end/",
    buildPayload({
      exam_attempt_id: examAttemptId,
      end_reason_enum: "ENDED_BY_USER_BY_NAVIGATING_BACK"
    })
  );
}
async function getCodingQuestionsSummary(client, questionSetId) {
  const { data } = await client.post(
    "/api/nkb_coding_practice/user/coding/questions/summary/?offset=0&length=999",
    buildPayload({ question_set_id: questionSetId })
  );
  return data;
}
async function getCodingQuestions(client, questionIds) {
  const { data } = await client.post(
    "/api/nkb_coding_practice/user/coding/questions/",
    buildPayload({ question_ids: questionIds })
  );
  return data;
}
async function submitCodingAnswers(client, responses) {
  const { data } = await client.post(
    "/api/nkb_coding_practice/question/coding/submit/",
    buildPayload({ responses })
  );
  return data;
}
async function getSqlQuestions(client, questionSetId) {
  const { data } = await client.post(
    "/api/nkb_coding_practice/questions/sql/v1/?offset=0&length=999",
    buildPayload({ question_set_id: questionSetId })
  );
  return data;
}
async function submitSqlAnswers(client, responses) {
  const { data } = await client.post(
    "/api/nkb_coding_practice/questions/sql/submit/v1/",
    buildPayload({ responses })
  );
  return data;
}
async function startCodingQuestion(client, questionId) {
  await client.post(
    "/api/nkb_coding_practice/coding/question/start/",
    buildPayload({ question_id: questionId, should_mark_attempted: true })
  );
}

// src/solver.ts
import Groq from "groq-sdk";
import axios2 from "axios";

// src/logger.ts
import chalk2 from "chalk";
var IS_DEBUG = process.env.DEBUG === "1";
function debug(label, ...args) {
  if (!IS_DEBUG) return;
  console.log(chalk2.gray(`  [DBG] ${label}`), ...args);
}
function debugAxiosError(context, err) {
  if (!IS_DEBUG) return;
  const ax = err;
  if (!ax.isAxiosError) {
    debug(context, err);
    return;
  }
  const res = ax.response;
  console.log(chalk2.bgRed.white(`
  [DBG] ${context} \u2014 HTTP ${res?.status ?? "?"}`));
  if (res?.headers) {
    console.log(chalk2.gray("  Request URL:"), chalk2.dim(ax.config?.url ?? ""));
    console.log(chalk2.gray("  Request body:"), chalk2.dim(
      typeof ax.config?.data === "string" ? ax.config.data.slice(0, 500) : JSON.stringify(ax.config?.data)
    ));
  }
  console.log(chalk2.gray("  Response body:"));
  try {
    console.log(chalk2.yellow(JSON.stringify(res?.data, null, 2)));
  } catch {
    console.log(chalk2.yellow(String(res?.data)));
  }
  console.log();
}

// src/solver.ts
var groqClient = null;
function initGroq(apiKey) {
  groqClient = new Groq({ apiKey });
}
var MODELS = [
  "openai/gpt-oss-120b",
  "moonshotai/kimi-k2-instruct-0905",
  "moonshotai/kimi-k2-instruct",
  "llama-3.3-70b-versatile"
];
var RATE_LIMIT_COOLDOWN_MS = 6e4;
var modelRateLimitedAt = /* @__PURE__ */ new Map();
function markRateLimited(model) {
  modelRateLimitedAt.set(model, Date.now());
  const readyAt = new Date(
    Date.now() + RATE_LIMIT_COOLDOWN_MS
  ).toLocaleTimeString();
  console.warn(`[solver] "${model}" rate-limited \u2014 skipping until ${readyAt}`);
}
function isRateLimitError(err) {
  if (err && typeof err === "object") {
    const status = err.status;
    if (status === 429) return true;
    const msg = err.message ?? "";
    if (/rate.?limit|429|too many requests/i.test(msg)) return true;
  }
  return false;
}
function getModelOrder() {
  const now = Date.now();
  const fresh = [];
  const limited = [];
  for (const model of MODELS) {
    const at = modelRateLimitedAt.get(model);
    if (at === void 0 || now - at >= RATE_LIMIT_COOLDOWN_MS) {
      if (at !== void 0) modelRateLimitedAt.delete(model);
      fresh.push(model);
    } else {
      limited.push({ model, readyAt: at + RATE_LIMIT_COOLDOWN_MS });
    }
  }
  if (fresh.length > 0) return fresh;
  console.warn(`[solver] All models are rate-limited. Cycling through anyway\u2026`);
  limited.sort((a, b) => a.readyAt - b.readyAt);
  return limited.map((l) => l.model);
}
function buildPrompt(question) {
  const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const letterToId = /* @__PURE__ */ new Map();
  const parts = [];
  const questionText = question.question.content.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
  parts.push(`Question:
${questionText}`);
  if (question.code_analysis?.code_details) {
    const { code, language } = question.code_analysis.code_details;
    parts.push(
      `
Code (${language}):
\`\`\`${language.toLowerCase()}
${code}
\`\`\``
    );
  }
  parts.push("\nOptions:");
  for (let i = 0; i < question.options.length; i++) {
    const opt = question.options[i];
    const letter = LETTERS[i] ?? String(i + 1);
    const text = opt.content.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
    parts.push(`  ${letter}) ${text}`);
    letterToId.set(letter, opt.option_id);
  }
  parts.push(
    "\nAnalyze the question carefully and think step by step.",
    "Then end your response with exactly this line:",
    "Answer: X",
    "where X is the single letter of the correct option (A, B, C, D, \u2026)."
  );
  return { prompt: parts.join("\n"), letterToId };
}
function pickBestOptionId(responseText, options, letterToId) {
  const cleaned = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const answerLineMatch = cleaned.match(/answer[:\s]+([A-H])\b/i);
  if (answerLineMatch) {
    const letter = answerLineMatch[1].toUpperCase();
    const id = letterToId.get(letter);
    if (id) return id;
  }
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const line = lines[i];
    const bareLetterMatch = line.match(/^([A-H])[).:\s]*$/i);
    if (bareLetterMatch) {
      const letter = bareLetterMatch[1].toUpperCase();
      const id = letterToId.get(letter);
      if (id) return id;
    }
    const inlineMatch = line.match(
      /\b(?:answer(?:\s+is)?|option|choose|select)[:\s]+([A-H])\b/i
    );
    if (inlineMatch) {
      const letter = inlineMatch[1].toUpperCase();
      const id = letterToId.get(letter);
      if (id) return id;
    }
  }
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const uuidMatches = responseText.match(uuidPattern) ?? [];
  const optionIdSet = new Set(options.map((o) => o.option_id.toLowerCase()));
  for (const match of uuidMatches) {
    if (optionIdSet.has(match.toLowerCase())) {
      return options.find(
        (o) => o.option_id.toLowerCase() === match.toLowerCase()
      ).option_id;
    }
  }
  return options[0].option_id;
}
async function solveQuestion(question) {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");
  const { prompt, letterToId } = buildPrompt(question);
  let lastError;
  for (const model of getModelOrder()) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are an expert tutor and problem-solver with deep knowledge across computer science, mathematics, science, languages, and general academia. When given a multiple-choice question, reason through it carefully before answering. Always end your response with 'Answer: X' where X is the letter of the correct option."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      return pickBestOptionId(raw, question.options, letterToId);
    } catch (err) {
      if (isRateLimitError(err)) {
        markRateLimited(model);
      } else {
        console.warn(`[solver] Model "${model}" failed \u2014 trying next\u2026`);
      }
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All Groq models failed for MCQ.");
}
async function solveAll(questions, onProgress) {
  const answers = /* @__PURE__ */ new Map();
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.question_type !== "MULTIPLE_CHOICE" && q.question_type !== "CODE_ANALYSIS_MULTIPLE_CHOICE") {
      answers.set(q.question_id, q.options[0]?.option_id ?? "");
      onProgress?.(i + 1, questions.length);
      continue;
    }
    try {
      const optionId = await solveQuestion(q);
      answers.set(q.question_id, optionId);
    } catch {
      answers.set(q.question_id, q.options[0]?.option_id ?? "");
    }
    onProgress?.(i + 1, questions.length);
    if (i < questions.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return answers;
}
async function fetchDbSchema(dbUrl) {
  if (!dbUrl) return "";
  try {
    const res = await axios2.get(dbUrl, { responseType: "arraybuffer", timeout: 1e4 });
    const buf = Buffer.from(res.data);
    const initSqlJs = (await import("sql.js")).default;
    const SQL = await initSqlJs();
    const db = new SQL.Database(buf);
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").flatMap((r) => r.values.map((v) => String(v[0])));
    if (tables.length === 0) return "";
    const schemaParts = [];
    for (const table of tables) {
      const cols = db.exec(`PRAGMA table_info(${table})`).flatMap((r) => r.values.map((v) => `${v[1]} ${v[2]}`));
      schemaParts.push(`TABLE ${table} (${cols.join(", ")})`);
    }
    db.close();
    return schemaParts.join("\n");
  } catch (err) {
    debug("[fetchDbSchema] Failed to fetch/parse DB:", err instanceof Error ? err.message : err);
    return "";
  }
}
function buildSqlPrompt(questions, dbContext, realSchema) {
  const description = dbContext.replace(/<[^>]+>/g, "").replace(/\r\n/g, "\n").trim();
  const parts = [
    "You are an expert SQL developer. Given the database schema below, write correct SQL queries for each question.",
    ""
  ];
  if (realSchema) {
    parts.push("ACTUAL DATABASE SCHEMA (use EXACTLY these table/column names):");
    parts.push(realSchema);
  } else if (description) {
    parts.push("Database context:");
    parts.push(description);
  } else {
    parts.push("(No schema provided \u2014 infer table/column names from starter SQL and question text)");
  }
  parts.push("", "Questions:");
  for (const q of questions) {
    const text = q.question.content.replace(/<[^>]+>/g, "").trim();
    const starter = q.default_code?.code_content?.replace(/<[^>]+>/g, "").trim();
    parts.push(`
[${q.question_id}]
${text}`);
    if (starter && starter !== "SELECT" && starter.length > 2) {
      parts.push(`Starter SQL (shows column/table names):
${starter}`);
    }
  }
  parts.push(
    "\nRespond with ONLY a JSON object mapping each question_id to its SQL answer string, like:",
    '{"<id>": "SELECT ...", "<id2>": "DELETE ..."}',
    "No markdown, no explanations, just the JSON object."
  );
  return parts.join("\n");
}
async function solveSqlQuestions(questions, dbContext, realSchema, onProgress) {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");
  const answers = /* @__PURE__ */ new Map();
  debug(`[SQL Solver] Schema: ${realSchema ? realSchema.slice(0, 200) : "(none \u2014 using description context)"}`);
  const BATCH = 10;
  let done = 0;
  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const prompt = buildSqlPrompt(batch, dbContext, realSchema);
    debug(`[SQL Solver] Prompt for batch ${Math.floor(i / BATCH) + 1}:
${prompt}`);
    let parsed = {};
    let lastError;
    for (const model of getModelOrder()) {
      try {
        const completion = await groqClient.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: "You are an expert SQL developer. Respond only with the requested JSON object. No markdown, no commentary."
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 2048,
          temperature: 0
        });
        const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
        debug(`[SQL Solver] Raw AI response (${model}):
${raw}`);
        const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        const cleaned = noThink.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
        parsed = JSON.parse(cleaned);
        debug(`[SQL Solver] Parsed ${Object.keys(parsed).length} answers`);
        break;
      } catch (err) {
        if (isRateLimitError(err)) {
          markRateLimited(model);
        } else {
          console.warn(`[solver] SQL model "${model}" failed \u2014 trying next\u2026`);
        }
        lastError = err;
      }
    }
    if (Object.keys(parsed).length === 0 && lastError) {
      for (const q of batch) {
        const starter = q.default_code?.code_content?.replace(/<[^>]+>/g, "").trim() ?? "";
        const fallbackPrompt = `Write a single SQL query for the following task. Respond with ONLY the SQL, no explanation.

${realSchema ? `Schema:
${realSchema}` : `Database:
${dbContext}`}
${starter ? `Starter SQL:
${starter}
` : ""}
Task: ${q.question.content.replace(/<[^>]+>/g, "")}`;
        try {
          const [lastModel] = getModelOrder().slice(-1);
          const completion = await groqClient.chat.completions.create({
            model: lastModel ?? MODELS[MODELS.length - 1],
            messages: [{ role: "user", content: fallbackPrompt }],
            max_tokens: 512,
            temperature: 0
          });
          const sql = completion.choices[0]?.message?.content?.trim() ?? "SELECT 1;";
          parsed[q.question_id] = sql.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();
        } catch {
          parsed[q.question_id] = "SELECT 1;";
        }
      }
    }
    for (const q of batch) {
      answers.set(q.question_id, parsed[q.question_id] ?? "SELECT 1;");
      done++;
      onProgress?.(done, questions.length);
    }
    if (i + BATCH < questions.length) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return answers;
}
async function refineSqlAnswer(question, failedSql, errorMessage, realSchema, dbContext) {
  if (!groqClient) throw new Error("Groq not initialised. Call initGroq() first.");
  const schema = realSchema || dbContext.replace(/<[^>]+>/g, "").trim();
  const questionText = question.question.content.replace(/<[^>]+>/g, "").trim();
  const prompt = [
    "Your previous SQL query returned the WRONG result. Fix it.",
    "",
    schema ? `Database schema:
${schema}` : "",
    "",
    `Question:
${questionText}`,
    "",
    `Your WRONG SQL:
${failedSql}`,
    "",
    `Error / mismatch from the database:
${errorMessage}`,
    "",
    "Write the CORRECTED SQL. Respond with ONLY the SQL, no explanation, no markdown."
  ].filter(Boolean).join("\n");
  debug(`[SQL Refine] Retry prompt:
${prompt}`);
  for (const model of MODELS) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "You are an expert SQL developer. Fix the incorrect SQL query using the error feedback. Respond with ONLY the corrected SQL." },
          { role: "user", content: prompt }
        ],
        max_tokens: 512,
        temperature: 0
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? failedSql;
      const fixed = raw.replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();
      debug(`[SQL Refine] Fixed SQL (${model}):
${fixed}`);
      return fixed;
    } catch {
    }
  }
  return failedSql;
}
function pickLanguage(applicable) {
  const preference = ["PYTHON", "NODE_JS", "CPP", "JAVA"];
  for (const lang of preference) {
    if (applicable.includes(lang)) return lang;
  }
  return applicable[0] ?? "PYTHON";
}
function decodeCodeContent(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    return raw;
  } catch {
    return raw;
  }
}
function encodeCodeContent(code) {
  return JSON.stringify(code);
}
function buildCodingPrompt(q, lang, template) {
  const questionText = q.question.content.replace(/<br\s*\/?>\n?/gi, "\n").replace(/<[^>]+>/g, "").trim();
  const testCasesText = q.test_cases.map((tc, i) => {
    const inp = decodeCodeContent(tc.input);
    const out = decodeCodeContent(tc.output);
    return `Example ${i + 1}:
  Input:  ${inp}
  Output: ${out}`;
  }).join("\n");
  const langLabel = {
    CPP: "C++",
    JAVA: "Java",
    PYTHON: "Python 3",
    NODE_JS: "Node.js (JavaScript)"
  };
  const outputRule = lang === "CPP" ? [
    "CRITICAL RULES FOR C++:",
    "- You MUST fill in the function body inside the existing class.",
    "- Do NOT add int main() or any code outside the class.",
    "- Do NOT change the class name, function signature, or parameters.",
    "- Return the complete file exactly as given: #include lines + class with filled function body.",
    "- The judge calls your function directly \u2014 a main() will cause compile errors."
  ].join("\n") : "Respond with ONLY the complete runnable code. No explanation, no markdown fences.";
  return [
    `You are an expert ${langLabel[lang] ?? lang} developer. Solve the following coding problem.`,
    "",
    `Problem:
${questionText}`,
    "",
    testCasesText ? `Test Cases:
${testCasesText}` : "",
    "",
    `Language: ${langLabel[lang] ?? lang}`,
    "",
    `TEMPLATE TO COMPLETE (keep all existing structure, only fill the function body):
\`\`\`${lang === "CPP" ? "cpp" : ""}
${template}
\`\`\``,
    "",
    outputRule,
    "",
    "Requirements:",
    "- Write complete, runnable code that passes all test cases.",
    "- Read input exactly as shown in the examples.",
    "- Do NOT include any explanation, comments beyond what is needed, or markdown fences.",
    "- Respond with ONLY the complete runnable code."
  ].filter(Boolean).join("\n");
}
async function solveCodingQuestion(q, lang) {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");
  const defaultTemplate = decodeCodeContent(q.code.code_content);
  const savedTemplate = q.latest_saved_code ? decodeCodeContent(q.latest_saved_code.code_content) : null;
  const template = savedTemplate && savedTemplate.length > defaultTemplate.length + 20 ? savedTemplate : defaultTemplate;
  const prompt = buildCodingPrompt(q, lang, template);
  debug(`[Coding] Prompt for "${q.question.short_text}":
${prompt}`);
  const systemMessage = lang === "CPP" ? "You are an expert C++ competitive programmer. Your output MUST be ONLY the complete file as given: #include lines + the class with the filled function body. ABSOLUTELY NO int main(). No explanation." : "You are an expert programmer. Write complete, correct, runnable code. Respond with ONLY the code, no markdown, no commentary.";
  let lastError;
  for (const model of getModelOrder()) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? template;
      const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
      debug(`[Coding] Response (${model}):
${cleaned.slice(0, 300)}...`);
      return cleaned;
    } catch (err) {
      if (isRateLimitError(err)) {
        markRateLimited(model);
      } else {
        console.warn(`[solver] Coding model "${model}" failed \u2014 trying next\u2026`);
      }
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All Groq models failed for coding question.");
}

// src/runner.ts
import chalk3 from "chalk";
import ora from "ora";
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function log(level, msg) {
  const prefix = {
    info: chalk3.blue("  \u2139"),
    ok: chalk3.green("  \u2714 "),
    warn: chalk3.yellow("  \u26A0"),
    skip: chalk3.gray("  \u2500"),
    err: chalk3.red("  \u2716 ")
  };
  console.log(`${prefix[level]} ${msg}`);
}
async function handleLearningSet(client, unit, skipCompleted, delayMs) {
  const name = unit.learning_resource_set_unit_details?.name ?? unit.unit_id;
  if (skipCompleted && unit.completion_status === "COMPLETED") {
    log(
      "skip",
      `Learning Set: ${chalk3.dim(name)} ${chalk3.gray("(already done)")}`
    );
    return;
  }
  const spinner = ora({ text: `Learning Set: ${name}`, color: "cyan" }).start();
  try {
    await completeLearningSet(client, unit.unit_id);
    spinner.succeed(chalk3.green(`Learning Set: ${name}`));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    spinner.fail(chalk3.red(`Learning Set: ${name} \u2014 ${msg}`));
    debugAxiosError("completeLearningSet", err);
  }
  await sleep(delayMs);
}
async function handlePracticeSet(client, unit, skipCompleted, delayMs) {
  const name = unit.practice_unit_details?.name ?? unit.unit_id;
  if (skipCompleted && unit.completion_percentage >= 100) {
    log("skip", `Practice: ${chalk3.dim(name)} ${chalk3.gray("(already done)")}`);
    return;
  }
  if (unit.is_unit_locked) {
    log(
      "warn",
      `Practice: ${chalk3.dim(name)} ${chalk3.yellow("(locked \u2014 skipping)")}`
    );
    return;
  }
  console.log(chalk3.bold(`
  \u25B8 Practice: ${chalk3.cyan(name)}`));
  let examAttemptId;
  const attemptSpinner = ora("  Creating exam attempt\u2026").start();
  try {
    const attempt = await createExamAttempt(client, unit.unit_id);
    examAttemptId = attempt.exam_attempt_id;
    attemptSpinner.succeed(`  Exam attempt: ${chalk3.dim(examAttemptId)}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    attemptSpinner.fail(`  Failed to create attempt: ${msg}`);
    return;
  }
  await sleep(delayMs);
  const qSpinner = ora("  Fetching questions\u2026").start();
  let questions;
  try {
    const res = await getExamQuestions(client, examAttemptId);
    questions = res.questions;
    qSpinner.succeed(`  Got ${questions.length} question(s)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    qSpinner.fail(`  Failed to fetch questions: ${msg}`);
    await endExamAttempt(client, examAttemptId).catch(() => {
    });
    return;
  }
  await sleep(delayMs);
  const solveSpinner = ora(
    `  Solving ${questions.length} question(s) with AI\u2026`
  ).start();
  let answers;
  try {
    answers = await solveAll(questions, (done, total) => {
      solveSpinner.text = `  Solving questions with AI\u2026 ${done}/${total}`;
    });
    solveSpinner.succeed(`  Solved ${answers.size} question(s)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    solveSpinner.fail(`  AI solving failed: ${msg}`);
    await endExamAttempt(client, examAttemptId).catch(() => {
    });
    return;
  }
  const submitSpinner = ora("  Submitting answers\u2026").start();
  const responses = questions.filter((q) => answers.has(q.question_id) && answers.get(q.question_id)).map((q, i) => ({
    question_id: q.question_id,
    question_number: q.question_number,
    time_spent: 10 + i * 3,
    // Simulate realistic time spent
    multiple_choice_answer_id: answers.get(q.question_id)
  }));
  let submitResult;
  try {
    const totalTime = responses.reduce((a, r) => a + r.time_spent, 0) + 30;
    submitResult = await submitAnswers(
      client,
      examAttemptId,
      responses,
      totalTime
    );
    const { correct_answer_count, total_questions_count } = submitResult.questions_stats;
    const score = submitResult.current_total_score;
    const pct = (correct_answer_count / total_questions_count * 100).toFixed(
      0
    );
    submitSpinner.succeed(
      `  Submitted \u2014 ${chalk3.green(`${correct_answer_count}/${total_questions_count}`)} correct (${pct}%)  score: ${score}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    submitSpinner.fail(`  Submit failed: ${msg}`);
    debugAxiosError("submitAnswers (practice)", err);
  }
  await sleep(delayMs);
  const endSpinner = ora("  Ending attempt\u2026").start();
  try {
    await endExamAttempt(client, examAttemptId);
    endSpinner.succeed("  Attempt ended");
  } catch {
    endSpinner.warn("  Could not cleanly end attempt (non-fatal)");
  }
  await sleep(delayMs);
}
async function handleQuestionSet(client, unit, skipCompleted, delayMs) {
  const name = unit.question_set_unit_details?.name ?? unit.learning_resource_set_unit_details?.name ?? unit.unit_id;
  if (skipCompleted && unit.completion_percentage >= 100) {
    log("skip", `Question Set: ${chalk3.dim(name)} ${chalk3.gray("(already done)")}`);
    return;
  }
  if (unit.is_unit_locked) {
    log("warn", `Question Set: ${chalk3.dim(name)} ${chalk3.yellow("(locked \u2014 skipping)")}`);
    return;
  }
  console.log(chalk3.bold(`
  \u25B8 Question Set: ${chalk3.cyan(name)}`));
  let isSql = false;
  let sqlQuestions = null;
  const probeSpinner = ora("  Detecting question set type\u2026").start();
  try {
    const res = await getSqlQuestions(client, unit.unit_id);
    if (res.questions && res.questions.length > 0) {
      isSql = true;
      sqlQuestions = res;
      probeSpinner.succeed(`  SQL Question Set \u2014 ${res.questions.length} question(s)`);
    } else {
      probeSpinner.succeed("  Coding Question Set");
    }
  } catch {
    probeSpinner.succeed("  Coding Question Set");
  }
  await sleep(delayMs);
  if (isSql && sqlQuestions) {
    const unanswered2 = sqlQuestions.questions.filter(
      (q) => q.question_status !== "CORRECT" && q.question_status !== "COMPLETED"
    );
    if (unanswered2.length === 0) {
      log("skip", "  All SQL questions already correct");
      return;
    }
    const dbContext = sqlQuestions.learning_resource_details?.content ?? "";
    const dbUrl = sqlQuestions.db_url ?? "";
    const schemaSpinner = ora("  Fetching DB schema\u2026").start();
    const realSchema = await fetchDbSchema(dbUrl);
    if (realSchema) {
      schemaSpinner.succeed(`  DB schema loaded \u2014 ${realSchema.split("\n").length} table(s)`);
    } else {
      schemaSpinner.warn("  Could not fetch DB schema (will use description context)");
    }
    const solveSpinner = ora(`  Solving ${unanswered2.length} SQL question(s) with AI\u2026`).start();
    let sqlAnswers;
    try {
      sqlAnswers = await solveSqlQuestions(unanswered2, dbContext, realSchema, (done, total) => {
        solveSpinner.text = `  Solving SQL questions with AI\u2026 ${done}/${total}`;
      });
      solveSpinner.succeed(`  Solved ${sqlAnswers.size} SQL question(s)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      solveSpinner.fail(`  SQL solving failed: ${msg}`);
      return;
    }
    await sleep(delayMs);
    const MAX_AI_RETRIES = 5;
    const MAX_NET_RETRIES = 3;
    async function submitWithRetry(payload) {
      let lastErr;
      for (let n = 0; n < MAX_NET_RETRIES; n++) {
        try {
          return await submitSqlAnswers(client, payload);
        } catch (err) {
          const status = err?.response?.status;
          if (status && status < 500) throw err;
          lastErr = err;
          const wait = 1e3 * 2 ** n;
          debug(`[SQL Submit] Network/5xx error (attempt ${n + 1}), retrying in ${wait}ms\u2026`);
          await sleep(wait);
        }
      }
      throw lastErr;
    }
    for (let i = 0; i < unanswered2.length; i++) {
      const q = unanswered2[i];
      let currentSql = sqlAnswers.get(q.question_id);
      if (!currentSql) continue;
      const label = q.question.short_text?.trim() || `Q${q.question_number}` || q.question_id.slice(0, 8);
      for (let attempt = 0; attempt <= MAX_AI_RETRIES; attempt++) {
        const isRetry = attempt > 0;
        const tag = isRetry ? ` (retry ${attempt}/${MAX_AI_RETRIES})` : "";
        const submitSpinner = ora(`  [${i + 1}/${unanswered2.length}] Submitting${tag}: ${label}\u2026`).start();
        debug(`[SQL Q${q.question_number}] Attempt ${attempt + 1} SQL:
${currentSql}`);
        let evalResult;
        let errorDetail;
        try {
          const result = await submitWithRetry([{
            question_id: q.question_id,
            time_spent: 10 + i * 5 + attempt * 3,
            user_response_code: { code_content: currentSql, language: "SQL" }
          }]);
          const r = result.submission_results[0];
          evalResult = r?.evaluation_result;
          if (evalResult === "CORRECT") {
            const tag2 = isRetry ? chalk3.dim(` (fixed on retry ${attempt})`) : "";
            submitSpinner.succeed(`  [${i + 1}/${unanswered2.length}] ${chalk3.green("CORRECT")} \u2014 ${label}${tag2}`);
            break;
          }
          const sub = r?.coding_submission_response;
          errorDetail = sub?.reason_for_error ?? (sub?.reason_for_failures?.length ? sub.reason_for_failures.join("\n") : null) ?? `${sub?.passed_test_cases_count ?? 0}/${sub?.total_test_cases_count ?? "?"} tests passed`;
          if (attempt < MAX_AI_RETRIES) {
            submitSpinner.warn(`  [${i + 1}/${unanswered2.length}] ${chalk3.yellow("INCORRECT")} \u2014 ${label} \u2014 asking AI to fix\u2026`);
            debug(`[SQL Q${q.question_number}] Error:
${errorDetail}`);
            currentSql = await refineSqlAnswer(q, currentSql, errorDetail, realSchema, dbContext);
            await sleep(Math.max(delayMs, 400));
          } else {
            submitSpinner.warn(`  [${i + 1}/${unanswered2.length}] ${chalk3.yellow(evalResult ?? "UNKNOWN")} \u2014 ${label} (gave up after ${MAX_AI_RETRIES} retries)`);
            log("warn", `      Reason: ${chalk3.red(errorDetail)}`);
            debug(`[SQL Q${q.question_number}] Full response:`, JSON.stringify(r, null, 2));
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          submitSpinner.fail(`  [${i + 1}/${unanswered2.length}] Submit failed: ${msg}`);
          debugAxiosError("submitSqlAnswers", err);
          break;
        }
      }
      if (i < unanswered2.length - 1) await sleep(delayMs);
    }
    await sleep(delayMs);
    const checkSpinner = ora("  Verifying submission status\u2026").start();
    try {
      const refreshed = await getSqlQuestions(client, unit.unit_id);
      const missed = refreshed.questions.filter(
        (q) => q.question_status !== "CORRECT" && q.question_status !== "COMPLETED"
      );
      if (missed.length === 0) {
        checkSpinner.succeed(`  All SQL questions confirmed CORRECT`);
      } else {
        checkSpinner.warn(`  ${missed.length} question(s) still not CORRECT \u2014 resubmitting\u2026`);
        for (const mq of missed) {
          const cachedSql = sqlAnswers.get(mq.question_id);
          if (!cachedSql) continue;
          const mlabel = mq.question.short_text?.trim() || `Q${mq.question_number}`;
          const rs = ora(`  Resubmitting: ${mlabel}\u2026`).start();
          try {
            const reResult = await submitWithRetry([{
              question_id: mq.question_id,
              time_spent: 30,
              user_response_code: { code_content: cachedSql, language: "SQL" }
            }]);
            const rr = reResult.submission_results[0];
            if (rr?.evaluation_result === "CORRECT") {
              rs.succeed(`  Resubmit CORRECT \u2014 ${mlabel}`);
            } else {
              rs.warn(`  Resubmit ${rr?.evaluation_result ?? "UNKNOWN"} \u2014 ${mlabel}`);
            }
          } catch (err) {
            rs.fail(`  Resubmit failed \u2014 ${mlabel}`);
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
  const summarySpinner = ora("  Fetching coding question list\u2026").start();
  let summary;
  try {
    summary = await getCodingQuestionsSummary(client, unit.unit_id);
    summarySpinner.succeed(`  ${summary.length} coding question(s) found`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    summarySpinner.fail(`  Failed to fetch question list: ${msg}`);
    return;
  }
  await sleep(delayMs);
  const unanswered = summary.filter((q) => q.question_status !== "CORRECT" && q.question_status !== "COMPLETED");
  if (unanswered.length === 0) {
    log("skip", "  All coding questions already correct");
    return;
  }
  const detailSpinner = ora(`  Loading ${unanswered.length} question detail(s)\u2026`).start();
  let questions;
  try {
    const res = await getCodingQuestions(client, unanswered.map((q) => q.question_id));
    questions = res.questions;
    detailSpinner.succeed(`  Got ${questions.length} question detail(s)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    detailSpinner.fail(`  Failed to load question details: ${msg}`);
    return;
  }
  await sleep(delayMs);
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const summaryEntry = unanswered.find((s) => s.question_id === q.question_id);
    const lang = pickLanguage(summaryEntry?.applicable_languages ?? q.code ? [q.code.language] : ["PYTHON"]);
    const solveSpinner = ora(
      `  [${i + 1}/${questions.length}] Solving "${q.question.short_text ?? q.question_id}" (${lang})\u2026`
    ).start();
    let code;
    try {
      code = await solveCodingQuestion(q, lang);
      solveSpinner.succeed(
        `  [${i + 1}/${questions.length}] ${chalk3.green(q.question.short_text ?? q.question_id)} (${lang})`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      solveSpinner.warn(`  [${i + 1}/${questions.length}] ${q.question.short_text ?? q.question_id} \u2014 AI failed: ${msg}, using template`);
      code = decodeCodeContentLocal(q.code.code_content);
    }
    const encodedCode = encodeCodeContent(code);
    const startSpinner = ora(`  Starting question on server\u2026`).start();
    try {
      await startCodingQuestion(client, q.question_id);
      startSpinner.succeed(`  Question started`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      startSpinner.warn(`  Start failed (${msg}) \u2014 attempting submit anyway`);
      debugAxiosError("startCodingQuestion", err);
    }
    await sleep(Math.max(delayMs / 2, 200));
    const submitSpinner = ora(`  Submitting answer\u2026`).start();
    try {
      const result = await submitCodingAnswers(client, [{
        question_id: q.question_id,
        time_spent: 30 + i * 10,
        coding_answer: {
          code_content: encodedCode,
          language: lang
        }
      }]);
      const r = result.submission_result[0];
      if (r?.evaluation_result === "CORRECT") {
        submitSpinner.succeed(
          `  Submitted \u2014 ${chalk3.green("CORRECT")}  score: ${r.user_response_score}`
        );
      } else {
        submitSpinner.warn(
          `  Submitted \u2014 ${chalk3.yellow(r?.evaluation_result ?? "UNKNOWN")}  (${r?.passed_test_cases_count ?? 0}/${r?.total_test_cases_count ?? "?"} tests passed)`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      submitSpinner.fail(`  Submit failed: ${msg}`);
      debugAxiosError("submitCodingAnswers", err);
    }
    if (i < questions.length - 1) await sleep(delayMs);
  }
  await sleep(delayMs);
  const codingCheckSpinner = ora("  Verifying coding submission status\u2026").start();
  try {
    const refreshedSummary = await getCodingQuestionsSummary(client, unit.unit_id);
    const stillWrong = refreshedSummary.filter(
      (q) => q.question_status !== "CORRECT" && q.question_status !== "COMPLETED"
    );
    if (stillWrong.length === 0) {
      codingCheckSpinner.succeed(`  All coding questions confirmed CORRECT`);
    } else {
      codingCheckSpinner.warn(`  ${stillWrong.length} question(s) still not CORRECT \u2014 resubmitting\u2026`);
      const missedIds = stillWrong.map((q) => q.question_id);
      let missedDetails = [];
      try {
        const res = await getCodingQuestions(client, missedIds);
        missedDetails = res.questions;
      } catch {
        codingCheckSpinner.warn(`  Could not load missed question details \u2014 skipping resubmit`);
      }
      for (const mq of missedDetails) {
        const summaryEntry = stillWrong.find((s) => s.question_id === mq.question_id);
        const lang = pickLanguage(summaryEntry?.applicable_languages ?? [mq.code.language]);
        const mlabel = mq.question.short_text ?? mq.question_id.slice(0, 8);
        const rs = ora(`  Resubmitting: ${mlabel}\u2026`).start();
        try {
          let code;
          try {
            code = await solveCodingQuestion(mq, lang);
          } catch {
            code = decodeCodeContentLocal(mq.code.code_content);
          }
          await startCodingQuestion(client, mq.question_id);
          await sleep(200);
          const reResult = await submitCodingAnswers(client, [{
            question_id: mq.question_id,
            time_spent: 30,
            coding_answer: { code_content: encodeCodeContent(code), language: lang }
          }]);
          const rr = reResult.submission_result[0];
          if (rr?.evaluation_result === "CORRECT") {
            rs.succeed(`  Resubmit CORRECT \u2014 ${mlabel}`);
          } else {
            rs.warn(`  Resubmit ${rr?.evaluation_result ?? "UNKNOWN"} \u2014 ${mlabel}`);
          }
        } catch (err) {
          rs.fail(`  Resubmit failed \u2014 ${mlabel}`);
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
function decodeCodeContentLocal(raw) {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return raw;
  }
}
async function processTopic(client, topic, courseId, config) {
  if (topic.is_topic_locked) {
    log("warn", `Topic "${topic.topic_name}" is locked \u2014 skipping`);
    return;
  }
  if (config.skipCompleted && topic.completion_status === "COMPLETED") {
    log("skip", `Topic "${topic.topic_name}" (already completed)`);
    return;
  }
  console.log(
    chalk3.bold.yellow(`
  \u25CF Topic ${topic.order}: ${topic.topic_name}`) + chalk3.gray(` [${(topic.completion_percentage ?? 0).toFixed(0)}% done]`)
  );
  let units;
  const unitSpinner = ora("  Loading units\u2026").start();
  try {
    const res = await getTopicUnits(client, topic.topic_id, courseId);
    units = res.units_details;
    unitSpinner.succeed(`  ${units.length} unit(s) found`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    unitSpinner.fail(`  Could not load units: ${msg}`);
    return;
  }
  await sleep(config.delayMs);
  for (const unit of units) {
    const doLearning = unit.unit_type === "LEARNING_SET" && (config.mode === "learning_sets" || config.mode === "all");
    const doPractice = unit.unit_type === "PRACTICE" && (config.mode === "practice" || config.mode === "all");
    const doQuestionSet = unit.unit_type === "QUESTION_SET" && (config.mode === "question_sets" || config.mode === "all");
    if (doLearning) {
      await handleLearningSet(
        client,
        unit,
        config.skipCompleted,
        config.delayMs
      );
    } else if (doPractice) {
      await handlePracticeSet(
        client,
        unit,
        config.skipCompleted,
        config.delayMs
      );
    } else if (doQuestionSet) {
      await handleQuestionSet(
        client,
        unit,
        config.skipCompleted,
        config.delayMs
      );
    } else if (unit.unit_type !== "QUIZ" && unit.unit_type !== "ASSESSMENT" && unit.unit_type !== "QUESTION_SET" && unit.unit_type !== "PROJECT") {
    }
  }
}
async function processCourse(client, config, courseId, courseTitle, topicLimit) {
  console.log(chalk3.bold.bgCyan.black(`
  COURSE: ${courseTitle}  `));
  const courseSpinner = ora("Loading course structure\u2026").start();
  let courseDetails;
  try {
    courseDetails = await getCourseDetails(client, courseId);
    courseSpinner.succeed(
      `${courseDetails.topics.length} topics loaded  (${courseDetails.completion_percentage.toFixed(1)}% complete)`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    courseSpinner.fail(`Failed to load course: ${msg}`);
    return;
  }
  await sleep(config.delayMs);
  const topics = courseDetails.topics.slice().sort((a, b) => a.order - b.order).slice(0, topicLimit === "all" ? void 0 : topicLimit);
  log("info", `Processing ${topics.length} topic(s)\u2026`);
  for (const topic of topics) {
    await processTopic(client, topic, courseId, config);
  }
}
async function run(client, config) {
  console.log(
    chalk3.bold.cyan("\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550")
  );
  console.log(chalk3.bold.cyan("  Starting automation\u2026"));
  console.log(
    chalk3.bold.cyan("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n")
  );
  for (const course of config.selectedCourses) {
    await processCourse(
      client,
      config,
      course.course_id,
      course.course_title,
      course.topicLimit
    );
  }
  console.log(
    chalk3.bold.green("\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550")
  );
  console.log(chalk3.bold.green("  All done!"));
  console.log(
    chalk3.bold.green("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n")
  );
}

// src/index.ts
async function loadCurriculum() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const candidates = [
    join2(__dirname, "curriculum.json"),
    join2(__dirname, "..", "curriculum.json")
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile2(p, "utf-8");
      return JSON.parse(raw);
    } catch {
    }
  }
  throw new Error(
    "curriculum.json not found. Make sure it exists in the package root."
  );
}
async function main() {
  let curriculum;
  try {
    curriculum = await loadCurriculum();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk4.red(`
  \u2716 ${msg}
`));
    process.exit(1);
  }
  while (true) {
    let config;
    try {
      config = await runPrompts(curriculum);
    } catch (err) {
      if (err.code === "ERR_USE_AFTER_CLOSE" || String(err).includes("force closed")) {
        console.log(chalk4.yellow("\n\n  Aborted.\n"));
        process.exit(0);
      }
      throw err;
    }
    initGroq(config.groqKey);
    const client = createClient(config.token);
    try {
      await run(client, config);
      break;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        console.error(chalk4.red("\n  \u2716 401 Unauthorized \u2014 token has expired or is invalid."));
        console.log(chalk4.yellow("  Clearing saved token. Please enter a new one.\n"));
        const cfg = await loadConfig();
        await saveConfig({ ...cfg, token: void 0 });
        continue;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk4.red(`
  \u2716 Unexpected error: ${msg}
`));
      process.exit(1);
    }
  }
}
main();
