#!/usr/bin/env node

// src/index.ts
import { readFile as readFile2 } from "fs/promises";
import { fileURLToPath } from "url";
import { join as join2, dirname } from "path";
import chalk5 from "chalk";

// src/cli.ts
import { input, password, checkbox, select } from "@inquirer/prompts";
import chalk2 from "chalk";
import ora from "ora";

// src/browser-auth.ts
import chalk from "chalk";
import { existsSync as existsSync2, unlinkSync } from "fs";
import { chromium } from "playwright";

// src/config.ts
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
function getCacheDir() {
  if (process.platform === "win32") {
    return join(process.env.LOCALAPPDATA || process.env.APPDATA || ".", "niatbuttcracker");
  }
  return join(process.env.HOME || ".", ".cache", "niatbuttcracker");
}
var CACHE_DIR = getCacheDir();
var CONFIG_PATH = join(CACHE_DIR, "config.json");
var SESSION_PATH = join(CACHE_DIR, "ccbp-session.json");
async function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true });
  }
}
async function loadConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function saveConfig(cfg) {
  await ensureCacheDir();
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}
function getSessionPath() {
  return SESSION_PATH;
}

// src/browser-auth.ts
async function getAvailableBrowserChannel() {
  const channels = ["chrome", "msedge"];
  for (const channel of channels) {
    try {
      const browser = await chromium.launch({
        headless: true,
        channel
      });
      await browser.close();
      return channel;
    } catch {
    }
  }
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return "default";
  } catch {
  }
  return null;
}
function hasSavedSession() {
  return existsSync2(getSessionPath());
}
function clearSession() {
  const sessionPath = getSessionPath();
  if (existsSync2(sessionPath)) {
    unlinkSync(sessionPath);
  }
}
async function captureTokenFromBrowser(options = {}) {
  const {
    loginUrl = "https://learning.ccbp.in/",
    apiBase = "https://nkb-backend-ccbp-prod-apis.ccbp.in",
    timeout = 3e5,
    // 5 minutes
    forceLogin = false
  } = options;
  const sessionPath = getSessionPath();
  let browser = null;
  let capturedToken = null;
  try {
    const channel = await getAvailableBrowserChannel();
    if (!channel) {
      return {
        success: false,
        error: "No browser found. Install Chrome or Edge."
      };
    }
    const browserName = channel === "default" ? "chromium" : channel;
    console.log(chalk.gray(`  Using ${browserName}...`));
    const hasSession = !forceLogin && hasSavedSession();
    if (hasSession) {
      console.log(chalk.gray("  Restoring saved session..."));
    }
    const launchOptions = {
      headless: false,
      args: ["--start-maximized"]
    };
    if (channel !== "default") {
      launchOptions.channel = channel;
    }
    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      viewport: null,
      storageState: hasSession ? sessionPath : void 0
    });
    const page = await context.newPage();
    page.on("request", (request) => {
      if (capturedToken) return;
      const url = request.url();
      if (!url.startsWith(apiBase)) return;
      const authHeader = request.headers()["authorization"];
      if (authHeader?.startsWith("Bearer ")) {
        capturedToken = authHeader.replace("Bearer ", "").trim();
      }
    });
    await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
    const startTime = Date.now();
    while (!capturedToken && Date.now() - startTime < timeout) {
      if (!browser.isConnected()) {
        return {
          success: false,
          error: "Browser was closed before login completed"
        };
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!capturedToken) {
      return { success: false, error: "Timeout waiting for login (5 minutes)" };
    }
    await context.storageState({ path: sessionPath });
    console.log(chalk.gray("  Session saved."));
    return { success: true, token: capturedToken };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  } finally {
    if (browser?.isConnected()) {
      await browser.close();
    }
  }
}

// src/cli.ts
function banner() {
  console.log(
    chalk2.bold.cyan(`

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
  console.log(chalk2.gray("  NIAT BUTT CRACKER \u2014 use Space to select, A for all\n"));
}
async function captureAuthToken() {
  console.log(chalk2.bold.yellow("\u2500\u2500 Authentication \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  console.log(chalk2.gray("  Opening browser for login..."));
  console.log(chalk2.gray("  (If already logged in, this will be instant)\n"));
  const spinner = ora("Capturing auth token...").start();
  const result = await captureTokenFromBrowser();
  if (result.success && result.token) {
    spinner.succeed("Logged in successfully!");
    return result.token;
  } else {
    spinner.fail(`Login failed: ${result.error}`);
    throw new Error(result.error || "Failed to capture auth token");
  }
}
async function getCerebrasKey() {
  const cfg = await loadConfig();
  const envKey = process.env.CEREBRAS_API_KEY?.trim();
  if (cfg.cerebrasKey?.trim()) {
    const cerebrasKey2 = cfg.cerebrasKey.trim();
    await saveConfig({ cerebrasKey: cerebrasKey2 });
    console.log(chalk2.gray("Loaded Cerebras API key from config.\n"));
    return cerebrasKey2;
  }
  if (envKey) {
    console.log(chalk2.gray("Loaded Cerebras API key from CEREBRAS_API_KEY.\n"));
    return envKey;
  }
  console.log(chalk2.bold.yellow("\u2500\u2500 Cerebras API Key Setup \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  console.log(chalk2.gray("  You'll need to get an API key from Cerebras Cloud.\n"));
  console.log(chalk2.bold("  Steps to get your API key:"));
  console.log(chalk2.gray("    1. Ctrl+Click this link to open in your browser:"));
  console.log(chalk2.cyan("       https://cloud.cerebras.ai/\n"));
  console.log(chalk2.gray("    2. Sign in or create a Cerebras account"));
  console.log(chalk2.gray("    3. Click 'Create API Key'"));
  console.log(chalk2.gray("    4. Copy the API key"));
  console.log(chalk2.gray("    5. Paste it below\n"));
  const cerebrasKey = (await password({
    message: "Paste your Cerebras API key:",
    mask: "\u2022",
    validate: (v) => v.trim().length > 0 ? true : "Cerebras API key is required"
  })).trim();
  await saveConfig({ cerebrasKey });
  console.log(chalk2.green("Cerebras API key saved.\n"));
  return cerebrasKey;
}
async function selectSemester(curriculum) {
  console.log(chalk2.bold.yellow("\u2500\u2500 Semester Selection \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
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
  console.log(chalk2.bold.yellow("\n\u2500\u2500 Course Selection \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  console.log(chalk2.gray("Space = toggle  \u2022  A = select all  \u2022  Enter = confirm\n"));
  const choices = semester.semester_subjects.flatMap(
    (subject) => subject.semester_courses.map((course) => ({
      name: `${chalk2.dim(`[${subject.subject_code}]`)} ${course.course_title} ${chalk2.dim(`(${course.no_of_topics} topics)`)}`,
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
    message: `${chalk2.cyan(course.course_title)} \u2014 how many topics to process?`,
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
  console.log(chalk2.bold.yellow("\n\u2500\u2500 What to complete \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  console.log(chalk2.gray("Space = toggle  \u2022  A = select all  \u2022  Enter = confirm\n"));
  const choices = [
    {
      name: `${chalk2.blue("Learning Sets")} \u2014 Mark video/reading resources as done`,
      value: "learning_sets",
      checked: false
    },
    {
      name: `${chalk2.magenta("Practice Sets")} \u2014 Attempt and submit MCQ practice exams`,
      value: "practice",
      checked: false
    },
    {
      name: `${chalk2.yellow("Question Sets")} \u2014 Solve SQL/Coding questions with AI`,
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
  console.log(chalk2.bold.yellow("\n\u2500\u2500 Run Summary \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  for (const course of config.selectedCourses) {
    const limit = course.topicLimit === "all" ? "all topics" : `${course.topicLimit} topics`;
    console.log(`  ${chalk2.cyan("\u2022")} ${course.course_title} ${chalk2.dim(`(${limit})`)}`);
  }
  const modeLabel = {
    all: "Learning Sets + Practice Sets + Question Sets",
    learning_sets: "Learning Sets only",
    practice: "Practice Sets only",
    question_sets: "Question Sets only"
  };
  console.log(`
  Mode:          ${chalk2.green(modeLabel[config.mode])}`);
  console.log(`  Request delay: ${config.delayMs}ms
`);
}
async function runPrompts(curriculum) {
  banner();
  const token = await captureAuthToken();
  const cerebrasKey = await getCerebrasKey();
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
    cerebrasKey,
    selectedCourses,
    mode,
    skipCompleted,
    delayMs
  };
  printSummary({ selectedCourses, mode, skipCompleted, delayMs });
  await input({ message: chalk2.green("Press Enter to start automation\u2026"), default: "" });
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
import Cerebras from "@cerebras/cerebras_cloud_sdk";
import axios2 from "axios";

// src/logger.ts
import chalk3 from "chalk";
var IS_DEBUG = process.env.DEBUG === "1";
function debug(label, ...args) {
  if (!IS_DEBUG) return;
  console.log(chalk3.gray(`  [DBG] ${label}`), ...args);
}
function debugAxiosError(context, err) {
  if (!IS_DEBUG) return;
  const ax = err;
  if (!ax.isAxiosError) {
    debug(context, err);
    return;
  }
  const res = ax.response;
  console.log(chalk3.bgRed.white(`
  [DBG] ${context} \u2014 HTTP ${res?.status ?? "?"}`));
  if (res?.headers) {
    console.log(chalk3.gray("  Request URL:"), chalk3.dim(ax.config?.url ?? ""));
    console.log(chalk3.gray("  Request body:"), chalk3.dim(
      typeof ax.config?.data === "string" ? ax.config.data.slice(0, 500) : JSON.stringify(ax.config?.data)
    ));
  }
  console.log(chalk3.gray("  Response body:"));
  try {
    console.log(chalk3.yellow(JSON.stringify(res?.data, null, 2)));
  } catch {
    console.log(chalk3.yellow(String(res?.data)));
  }
  console.log();
}

// src/solver.ts
var cerebrasClient = null;
function initCerebras(apiKey) {
  cerebrasClient = new Cerebras({ apiKey });
}
var PRIMARY_MODELS = [
  "gpt-oss-120b",
  "qwen-3-235b-a22b-instruct-2507"
];
var FALLBACK_MODEL = "llama3.1-8b";
var MODELS = [...PRIMARY_MODELS, FALLBACK_MODEL];
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
function isModelRateLimited(model, now = Date.now()) {
  const at = modelRateLimitedAt.get(model);
  if (at === void 0) return false;
  if (now - at >= RATE_LIMIT_COOLDOWN_MS) {
    modelRateLimitedAt.delete(model);
    return false;
  }
  return true;
}
function getReadyAt(model) {
  return (modelRateLimitedAt.get(model) ?? 0) + RATE_LIMIT_COOLDOWN_MS;
}
function getNextModelForAttempt(attempted) {
  const now = Date.now();
  for (const model of PRIMARY_MODELS) {
    if (!attempted.has(model) && !isModelRateLimited(model, now)) {
      return model;
    }
  }
  const primaryRateLimited = PRIMARY_MODELS.every(
    (model) => isModelRateLimited(model, now)
  );
  if (primaryRateLimited && !attempted.has(FALLBACK_MODEL)) {
    console.warn(
      `[solver] Primary Cerebras models are rate-limited. Falling back to "${FALLBACK_MODEL}".`
    );
    return FALLBACK_MODEL;
  }
  const allModelsRateLimited = MODELS.every(
    (model) => isModelRateLimited(model, now)
  );
  const limited = allModelsRateLimited ? MODELS.filter((model) => !attempted.has(model) && isModelRateLimited(model, now)).sort((a, b) => getReadyAt(a) - getReadyAt(b)) : [];
  if (limited.length > 0) {
    console.warn("[solver] All Cerebras models are rate-limited. Cycling through anyway...");
    return limited[0];
  }
  return null;
}
function requireCerebrasClient() {
  if (!cerebrasClient) {
    throw new Error("Cerebras not initialised. Call initCerebras() first.");
  }
  return cerebrasClient;
}
async function createChatCompletion(model, request) {
  const completion = await requireCerebrasClient().chat.completions.create({
    model,
    messages: request.messages,
    max_completion_tokens: request.maxCompletionTokens,
    temperature: request.temperature ?? 0,
    top_p: request.topP ?? 1,
    stream: false
  });
  const response = completion;
  return response.choices?.[0]?.message?.content?.trim() ?? "";
}
async function withCerebrasModelRotation(label, operation) {
  const attempted = /* @__PURE__ */ new Set();
  let lastError;
  while (true) {
    const model = getNextModelForAttempt(attempted);
    if (!model) break;
    attempted.add(model);
    try {
      return await operation(model);
    } catch (err) {
      if (isRateLimitError(err)) {
        markRateLimited(model);
      } else {
        console.warn(`[solver] ${label} model "${model}" failed - trying next...`);
      }
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`All Cerebras models failed for ${label}.`);
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
  const { prompt, letterToId } = buildPrompt(question);
  const raw = await withCerebrasModelRotation(
    "MCQ",
    (model) => createChatCompletion(model, {
      messages: [
        {
          role: "system",
          content: "You are an expert tutor and problem-solver with deep knowledge across computer science, mathematics, science, languages, and general academia. When given a multiple-choice question, reason through it carefully before answering. Always end your response with 'Answer: X' where X is the letter of the correct option."
        },
        { role: "user", content: prompt }
      ],
      maxCompletionTokens: 1024,
      temperature: 0
    })
  );
  return pickBestOptionId(raw, question.options, letterToId);
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
    let parseFailed = false;
    try {
      parsed = await withCerebrasModelRotation("SQL", async (model) => {
        const raw = await createChatCompletion(model, {
          messages: [
            {
              role: "system",
              content: "You are an expert SQL developer. Respond only with the requested JSON object. No markdown, no commentary."
            },
            { role: "user", content: prompt }
          ],
          maxCompletionTokens: 2048,
          temperature: 0
        });
        debug(`[SQL Solver] Raw AI response (${model}):
${raw}`);
        const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        const cleaned = noThink.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
        const parsedBatch = JSON.parse(cleaned);
        debug(`[SQL Solver] Parsed ${Object.keys(parsedBatch).length} answers`);
        return parsedBatch;
      });
    } catch {
      parseFailed = true;
    }
    if (Object.keys(parsed).length === 0 && parseFailed) {
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
          const sql = await withCerebrasModelRotation(
            "SQL fallback",
            (model) => createChatCompletion(model, {
              messages: [{ role: "user", content: fallbackPrompt }],
              maxCompletionTokens: 512,
              temperature: 0
            })
          );
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
  try {
    const raw = await withCerebrasModelRotation(
      "SQL refine",
      (model) => createChatCompletion(model, {
        messages: [
          { role: "system", content: "You are an expert SQL developer. Fix the incorrect SQL query using the error feedback. Respond with ONLY the corrected SQL." },
          { role: "user", content: prompt }
        ],
        maxCompletionTokens: 512,
        temperature: 0
      })
    );
    const fixed = raw.replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();
    debug(`[SQL Refine] Fixed SQL:
${fixed}`);
    return fixed;
  } catch {
    return failedSql;
  }
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
  const defaultTemplate = decodeCodeContent(q.code.code_content);
  const savedTemplate = q.latest_saved_code ? decodeCodeContent(q.latest_saved_code.code_content) : null;
  const template = savedTemplate && savedTemplate.length > defaultTemplate.length + 20 ? savedTemplate : defaultTemplate;
  const prompt = buildCodingPrompt(q, lang, template);
  debug(`[Coding] Prompt for "${q.question.short_text}":
${prompt}`);
  const systemMessage = lang === "CPP" ? "You are an expert C++ competitive programmer. Your output MUST be ONLY the complete file as given: #include lines + the class with the filled function body. ABSOLUTELY NO int main(). No explanation." : "You are an expert programmer. Write complete, correct, runnable code. Respond with ONLY the code, no markdown, no commentary.";
  const raw = await withCerebrasModelRotation(
    "coding question",
    (model) => createChatCompletion(model, {
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      maxCompletionTokens: 2048,
      temperature: 0
    })
  );
  const cleaned = (raw || template).replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
  debug(`[Coding] Response:
${cleaned.slice(0, 300)}...`);
  return cleaned;
}

// src/runner.ts
import chalk4 from "chalk";
import ora2 from "ora";

// src/types.ts
var UNIT_TYPE = {
  LEARNING_SET: "LEARNING_SET",
  PRACTICE: "PRACTICE",
  QUIZ: "QUIZ",
  ASSESSMENT: "ASSESSMENT",
  QUESTION_SET: "QUESTION_SET",
  PROJECT: "PROJECT"
};
var QUESTION_STATUS = {
  CORRECT: "CORRECT",
  COMPLETED: "COMPLETED"
};

// src/concurrency.ts
var ConcurrencyLimiter = class {
  maxConcurrent;
  activeCount = 0;
  queue = [];
  constructor(maxConcurrent) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
  }
  /**
   * Execute a function with concurrency control.
   * Waits if max concurrent limit is reached.
   */
  async run(fn) {
    while (this.activeCount >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve));
    }
    this.activeCount++;
    try {
      return await fn();
    } finally {
      this.activeCount--;
      const resolver = this.queue.shift();
      if (resolver) resolver();
    }
  }
  /**
   * Execute an array of async functions with concurrency control.
   * Returns results in the same order as input.
   * Uses Promise.allSettled to continue even if some tasks fail.
   */
  async runAll(fns) {
    return Promise.allSettled(fns.map((fn) => this.run(fn)));
  }
};

// src/runner.ts
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
var PRACTICE_RETRY_THRESHOLD_PERCENT = 75;
var MAX_PRACTICE_SCORE_ATTEMPTS = 3;
function log(level, msg) {
  const prefix = {
    info: chalk4.blue("  \u2139"),
    ok: chalk4.green("  \u2714 "),
    warn: chalk4.yellow("  \u26A0"),
    skip: chalk4.gray("  \u2500"),
    err: chalk4.red("  \u2716 ")
  };
  console.log(`${prefix[level]} ${msg}`);
}
function isQuestionAnswered(questionStatus) {
  return questionStatus === QUESTION_STATUS.CORRECT || questionStatus === QUESTION_STATUS.COMPLETED;
}
async function handleLearningSet(client, unit, skipCompleted, delayMs) {
  const name = unit.learning_resource_set_unit_details?.name ?? unit.unit_id;
  if (skipCompleted && unit.completion_status === "COMPLETED") {
    log(
      "skip",
      `Learning Set: ${chalk4.dim(name)} ${chalk4.gray("(already done)")}`
    );
    return;
  }
  const spinner = ora2({ text: `Learning Set: ${name}`, color: "cyan" }).start();
  try {
    await completeLearningSet(client, unit.unit_id);
    spinner.succeed(chalk4.green(`Learning Set: ${name}`));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    spinner.fail(chalk4.red(`Learning Set: ${name} \u2014 ${msg}`));
    debugAxiosError("completeLearningSet", err);
  }
  await sleep(delayMs);
}
async function handlePracticeSet(client, unit, skipCompleted, delayMs) {
  const name = unit.practice_unit_details?.name ?? unit.unit_id;
  if (skipCompleted && unit.completion_percentage >= 100) {
    log("skip", `Practice: ${chalk4.dim(name)} ${chalk4.gray("(already done)")}`);
    return;
  }
  if (unit.is_unit_locked) {
    log(
      "warn",
      `Practice: ${chalk4.dim(name)} ${chalk4.yellow("(locked \u2014 skipping)")}`
    );
    return;
  }
  console.log(chalk4.bold(`
  \u25B8 Practice: ${chalk4.cyan(name)}`));
  for (let attemptNumber = 1; attemptNumber <= MAX_PRACTICE_SCORE_ATTEMPTS; attemptNumber++) {
    const retryLabel = attemptNumber > 1 ? chalk4.dim(` (score retry ${attemptNumber}/${MAX_PRACTICE_SCORE_ATTEMPTS})`) : "";
    let examAttemptId;
    const attemptSpinner = ora2(`  Creating exam attempt${retryLabel}\u2026`).start();
    try {
      const attempt = await createExamAttempt(client, unit.unit_id);
      examAttemptId = attempt.exam_attempt_id;
      attemptSpinner.succeed(`  Exam attempt: ${chalk4.dim(examAttemptId)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      attemptSpinner.fail(`  Failed to create attempt: ${msg}`);
      return;
    }
    await sleep(delayMs);
    const qSpinner = ora2("  Fetching questions\u2026").start();
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
    const solveSpinner = ora2(
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
    const submitSpinner = ora2("  Submitting answers\u2026").start();
    const responses = questions.filter((q) => answers.has(q.question_id) && answers.get(q.question_id)).map((q, i) => ({
      question_id: q.question_id,
      question_number: q.question_number,
      time_spent: 10 + i * 3,
      // Simulate realistic time spent
      multiple_choice_answer_id: answers.get(q.question_id)
    }));
    let scorePercent = null;
    try {
      const totalTime = responses.reduce((a, r) => a + r.time_spent, 0) + 30;
      const submitResult = await submitAnswers(
        client,
        examAttemptId,
        responses,
        totalTime
      );
      const { correct_answer_count, total_questions_count } = submitResult.questions_stats;
      const score = submitResult.current_total_score;
      scorePercent = total_questions_count > 0 ? correct_answer_count / total_questions_count * 100 : 0;
      submitSpinner.succeed(
        `  Submitted \u2014 ${chalk4.green(`${correct_answer_count}/${total_questions_count}`)} correct (${scorePercent.toFixed(0)}%)  score: ${score}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      submitSpinner.fail(`  Submit failed: ${msg}`);
      debugAxiosError("submitAnswers (practice)", err);
    }
    await sleep(delayMs);
    const endSpinner = ora2("  Ending attempt\u2026").start();
    try {
      await endExamAttempt(client, examAttemptId);
      endSpinner.succeed("  Attempt ended");
    } catch {
      endSpinner.warn("  Could not cleanly end attempt (non-fatal)");
    }
    await sleep(delayMs);
    if (scorePercent === null) return;
    if (scorePercent < PRACTICE_RETRY_THRESHOLD_PERCENT && attemptNumber < MAX_PRACTICE_SCORE_ATTEMPTS) {
      log(
        "warn",
        `Practice score ${scorePercent.toFixed(0)}% is below ${PRACTICE_RETRY_THRESHOLD_PERCENT}% \u2014 retrying exam`
      );
      await sleep(Math.max(delayMs, 1e3));
      continue;
    }
    if (scorePercent < PRACTICE_RETRY_THRESHOLD_PERCENT) {
      log(
        "warn",
        `Practice score stayed below ${PRACTICE_RETRY_THRESHOLD_PERCENT}% after ${MAX_PRACTICE_SCORE_ATTEMPTS} attempt(s)`
      );
    }
    return;
  }
}
async function handleQuestionSet(client, unit, skipCompleted, delayMs) {
  const name = unit.question_set_unit_details?.name ?? unit.learning_resource_set_unit_details?.name ?? unit.unit_id;
  if (skipCompleted && unit.completion_percentage >= 100) {
    log("skip", `Question Set: ${chalk4.dim(name)} ${chalk4.gray("(already done)")}`);
    return;
  }
  if (unit.is_unit_locked) {
    log("warn", `Question Set: ${chalk4.dim(name)} ${chalk4.yellow("(locked \u2014 skipping)")}`);
    return;
  }
  console.log(chalk4.bold(`
  \u25B8 Question Set: ${chalk4.cyan(name)}`));
  let isSql = false;
  let sqlQuestions = null;
  const probeSpinner = ora2("  Detecting question set type\u2026").start();
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
      (q) => !isQuestionAnswered(q.question_status)
    );
    if (unanswered2.length === 0) {
      log("skip", "  All SQL questions already correct");
      return;
    }
    const dbContext = sqlQuestions.learning_resource_details?.content ?? "";
    const dbUrl = sqlQuestions.db_url ?? "";
    const schemaSpinner = ora2("  Fetching DB schema\u2026").start();
    const realSchema = await fetchDbSchema(dbUrl);
    if (realSchema) {
      schemaSpinner.succeed(`  DB schema loaded \u2014 ${realSchema.split("\n").length} table(s)`);
    } else {
      schemaSpinner.warn("  Could not fetch DB schema (will use description context)");
    }
    const solveSpinner = ora2(`  Solving ${unanswered2.length} SQL question(s) with AI\u2026`).start();
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
        const submitSpinner = ora2(`  [${i + 1}/${unanswered2.length}] Submitting${tag}: ${label}\u2026`).start();
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
            const tag2 = isRetry ? chalk4.dim(` (fixed on retry ${attempt})`) : "";
            submitSpinner.succeed(`  [${i + 1}/${unanswered2.length}] ${chalk4.green("CORRECT")} \u2014 ${label}${tag2}`);
            break;
          }
          const sub = r?.coding_submission_response;
          errorDetail = sub?.reason_for_error ?? (sub?.reason_for_failures?.length ? sub.reason_for_failures.join("\n") : null) ?? `${sub?.passed_test_cases_count ?? 0}/${sub?.total_test_cases_count ?? "?"} tests passed`;
          if (attempt < MAX_AI_RETRIES) {
            submitSpinner.warn(`  [${i + 1}/${unanswered2.length}] ${chalk4.yellow("INCORRECT")} \u2014 ${label} \u2014 asking AI to fix\u2026`);
            debug(`[SQL Q${q.question_number}] Error:
${errorDetail}`);
            currentSql = await refineSqlAnswer(q, currentSql, errorDetail, realSchema, dbContext);
            await sleep(Math.max(delayMs, 400));
          } else {
            submitSpinner.warn(`  [${i + 1}/${unanswered2.length}] ${chalk4.yellow(evalResult ?? "UNKNOWN")} \u2014 ${label} (gave up after ${MAX_AI_RETRIES} retries)`);
            log("warn", `      Reason: ${chalk4.red(errorDetail)}`);
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
    const checkSpinner = ora2("  Verifying submission status\u2026").start();
    try {
      const refreshed = await getSqlQuestions(client, unit.unit_id);
      const missed = refreshed.questions.filter(
        (q) => !isQuestionAnswered(q.question_status)
      );
      if (missed.length === 0) {
        checkSpinner.succeed(`  All SQL questions confirmed CORRECT`);
      } else {
        checkSpinner.warn(`  ${missed.length} question(s) still not CORRECT \u2014 resubmitting\u2026`);
        for (const mq of missed) {
          const cachedSql = sqlAnswers.get(mq.question_id);
          if (!cachedSql) continue;
          const mlabel = mq.question.short_text?.trim() || `Q${mq.question_number}`;
          const rs = ora2(`  Resubmitting: ${mlabel}\u2026`).start();
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
  const summarySpinner = ora2("  Fetching coding question list\u2026").start();
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
  const unanswered = summary.filter((q) => !isQuestionAnswered(q.question_status));
  if (unanswered.length === 0) {
    log("skip", "  All coding questions already correct");
    return;
  }
  const detailSpinner = ora2(`  Loading ${unanswered.length} question detail(s)\u2026`).start();
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
    const solveSpinner = ora2(
      `  [${i + 1}/${questions.length}] Solving "${q.question.short_text ?? q.question_id}" (${lang})\u2026`
    ).start();
    let code;
    try {
      code = await solveCodingQuestion(q, lang);
      solveSpinner.succeed(
        `  [${i + 1}/${questions.length}] ${chalk4.green(q.question.short_text ?? q.question_id)} (${lang})`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      solveSpinner.warn(`  [${i + 1}/${questions.length}] ${q.question.short_text ?? q.question_id} \u2014 AI failed: ${msg}, using template`);
      code = decodeCodeContentLocal(q.code.code_content);
    }
    const encodedCode = encodeCodeContent(code);
    const startSpinner = ora2(`  Starting question on server\u2026`).start();
    try {
      await startCodingQuestion(client, q.question_id);
      startSpinner.succeed(`  Question started`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      startSpinner.warn(`  Start failed (${msg}) \u2014 attempting submit anyway`);
      debugAxiosError("startCodingQuestion", err);
    }
    await sleep(Math.max(delayMs / 2, 200));
    const submitSpinner = ora2(`  Submitting answer\u2026`).start();
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
          `  Submitted \u2014 ${chalk4.green("CORRECT")}  score: ${r.user_response_score}`
        );
      } else {
        submitSpinner.warn(
          `  Submitted \u2014 ${chalk4.yellow(r?.evaluation_result ?? "UNKNOWN")}  (${r?.passed_test_cases_count ?? 0}/${r?.total_test_cases_count ?? "?"} tests passed)`
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
  const codingCheckSpinner = ora2("  Verifying coding submission status\u2026").start();
  try {
    const refreshedSummary = await getCodingQuestionsSummary(client, unit.unit_id);
    const stillWrong = refreshedSummary.filter(
      (q) => !isQuestionAnswered(q.question_status)
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
        const rs = ora2(`  Resubmitting: ${mlabel}\u2026`).start();
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
function groupUnitsByType(units, mode) {
  const grouped = { learning: [], practice: [], question: [] };
  for (const unit of units) {
    if (unit.unit_type === UNIT_TYPE.LEARNING_SET && (mode === "learning_sets" || mode === "all")) {
      grouped.learning.push(unit);
    } else if (unit.unit_type === UNIT_TYPE.PRACTICE && (mode === "practice" || mode === "all")) {
      grouped.practice.push(unit);
    } else if (unit.unit_type === UNIT_TYPE.QUESTION_SET && (mode === "question_sets" || mode === "all")) {
      grouped.question.push(unit);
    }
  }
  return grouped;
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
    chalk4.bold.yellow(`
  \u25CF Topic ${topic.order}: ${topic.topic_name}`) + chalk4.gray(` [${(topic.completion_percentage ?? 0).toFixed(0)}% done]`)
  );
  let units;
  const unitSpinner = ora2("  Loading units\u2026").start();
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
  const { learning: learningUnits, practice: practiceUnits, question: questionUnits } = groupUnitsByType(units, config.mode);
  if (learningUnits.length > 0) {
    const limiter = new ConcurrencyLimiter(8);
    await limiter.runAll(
      learningUnits.map(
        (unit) => () => handleLearningSet(client, unit, config.skipCompleted, config.delayMs)
      )
    );
  }
  if (practiceUnits.length > 0) {
    const limiter = new ConcurrencyLimiter(3);
    await limiter.runAll(
      practiceUnits.map(
        (unit) => () => handlePracticeSet(client, unit, config.skipCompleted, config.delayMs)
      )
    );
  }
  if (questionUnits.length > 0) {
    const limiter = new ConcurrencyLimiter(2);
    await limiter.runAll(
      questionUnits.map(
        (unit) => () => handleQuestionSet(client, unit, config.skipCompleted, config.delayMs)
      )
    );
  }
}
async function processCourse(client, config, courseId, courseTitle, topicLimit) {
  console.log(chalk4.bold.bgCyan.black(`
  COURSE: ${courseTitle}  `));
  const courseSpinner = ora2("Loading course structure\u2026").start();
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
    chalk4.bold.cyan("\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550")
  );
  console.log(chalk4.bold.cyan("  Starting automation\u2026"));
  console.log(
    chalk4.bold.cyan("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n")
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
    chalk4.bold.green("\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550")
  );
  console.log(chalk4.bold.green("  All done!"));
  console.log(
    chalk4.bold.green("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n")
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
    console.error(chalk5.red(`
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
        console.log(chalk5.yellow("\n\n  Aborted.\n"));
        process.exit(0);
      }
      throw err;
    }
    initCerebras(config.cerebrasKey);
    console.log(chalk5.gray("Initialized Cerebras AI provider.\n"));
    const client = createClient(config.token);
    try {
      await run(client, config);
      break;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        console.error(chalk5.red("\n  \u2716 401 Unauthorized \u2014 session expired."));
        console.log(chalk5.yellow("  Clearing session. Please login again.\n"));
        clearSession();
        continue;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk5.red(`
  \u2716 Unexpected error: ${msg}
`));
      process.exit(1);
    }
  }
}
main();
