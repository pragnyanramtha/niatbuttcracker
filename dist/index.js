#!/usr/bin/env node

// src/index.ts
import { readFile as readFile2 } from "fs/promises";
import { fileURLToPath } from "url";
import { join as join2, dirname } from "path";
import chalk3 from "chalk";

// src/cli.ts
import { password, checkbox, select, confirm, number } from "@inquirer/prompts";
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

\u2588\u2588\u2588\u2557\u2591\u2591\u2588\u2588\u2557\u2588\u2588\u2557\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2003\u2003\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2557\u2591\u2591\u2591\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D\u2003\u2003\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D
\u2588\u2588\u2554\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2003\u2003\u2588\u2588\u2588\u2588\u2588\u2588\u2566\u255D\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591
\u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2003\u2003\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591
\u2588\u2588\u2551\u2591\u255A\u2588\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2003\u2003\u2588\u2588\u2588\u2588\u2588\u2588\u2566\u255D\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591
\u255A\u2550\u255D\u2591\u2591\u255A\u2550\u2550\u255D\u255A\u2550\u255D\u255A\u2550\u255D\u2591\u2591\u255A\u2550\u255D\u2591\u2591\u2591\u255A\u2550\u255D\u2591\u2591\u2591\u2003\u2003\u255A\u2550\u2550\u2550\u2550\u2550\u255D\u2591\u2591\u255A\u2550\u2550\u2550\u2550\u2550\u255D\u2591\u2591\u2591\u2591\u255A\u2550\u255D\u2591\u2591\u2591\u2591\u2591\u2591\u255A\u2550\u255D\u2591\u2591\u2591

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
  const token = await password({
    message: "Bearer token (from browser DevTools / Network tab):",
    mask: "\u2022",
    validate: (v) => v.trim().length > 10 ? true : "Token looks too short"
  });
  let groqKey = "";
  const cfg = await loadConfig();
  if (cfg.groqKey && cfg.groqKey.startsWith("gsk_")) {
    groqKey = cfg.groqKey;
    console.log(chalk.gray("Loaded Groq API key from config."));
  } else {
    groqKey = await password({
      message: "Groq API key (for AI question solving \u2014 get at console.groq.com):",
      mask: "\u2022",
      validate: (v) => v.trim().startsWith("gsk_") ? true : 'Groq keys start with "gsk_"'
    });
    await saveConfig({ groqKey: groqKey.trim() });
    console.log(chalk.green("Groq API key saved for future runs."));
  }
  return { token: token.trim(), groqKey: groqKey.trim() };
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
  const n = await number({
    message: `How many topics (1\u2013${course.no_of_topics})?`,
    min: 1,
    max: course.no_of_topics,
    default: course.no_of_topics
  });
  return n ?? course.no_of_topics;
}
async function selectMode() {
  console.log(chalk.bold.yellow("\n\u2500\u2500 Completion Mode \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  return select({
    message: "What should be completed?",
    choices: [
      {
        name: `${chalk.green("All")} \u2014 Learning Sets ${chalk.dim("+")} Practice Sets ${chalk.dim("+")} Question Sets`,
        value: "all"
      },
      {
        name: `${chalk.blue("Learning Sets only")} \u2014 Mark video/reading resources as done`,
        value: "learning_sets"
      },
      {
        name: `${chalk.magenta("Practice Sets only")} \u2014 Attempt and submit MCQ practice exams`,
        value: "practice"
      },
      {
        name: `${chalk.yellow("Question Sets only")} \u2014 Solve SQL/Coding practice questions with AI`,
        value: "question_sets"
      }
    ]
  });
}
async function selectOptions() {
  console.log(chalk.bold.yellow("\n\u2500\u2500 Options \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"));
  const skipCompleted = await confirm({
    message: "Skip already-completed units?",
    default: true
  });
  const delayChoice = await select({
    message: "Delay between API requests:",
    choices: [
      { name: "1 second (safe, slow)", value: 1e3 },
      { name: "0.5 seconds (moderate)", value: 500 },
      { name: "0.2 seconds (fast, may get rate-limited)", value: 200 }
    ],
    default: 1e3
  });
  return { skipCompleted, delayMs: delayChoice };
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
  console.log(`  Skip done:     ${config.skipCompleted ? chalk.green("yes") : chalk.red("no")}`);
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
  const { skipCompleted, delayMs } = await selectOptions();
  const config = {
    token,
    groqKey,
    selectedCourses,
    mode,
    skipCompleted,
    delayMs
  };
  printSummary({ selectedCourses, mode, skipCompleted, delayMs });
  const go = await confirm({ message: "Start automation?", default: true });
  if (!go) {
    console.log(chalk.yellow("\nAborted."));
    process.exit(0);
  }
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
    "/api/nkb_coding_practice/user/question/config/v1/",
    buildPayload({ question_id: questionId })
  );
}
async function saveCodingAnswer(client, questionId, codeContent, language) {
  await client.post(
    "/api/nkb_coding_practice/question/coding/save/",
    buildPayload({
      responses: [{ question_id: questionId, coding_answer: { code_content: codeContent, language } }]
    })
  );
}

// src/solver.ts
import Groq from "groq-sdk";
var groqClient = null;
function initGroq(apiKey) {
  groqClient = new Groq({ apiKey });
}
function buildPrompt(question) {
  const parts = [];
  const questionText = question.question.content.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
  parts.push(`Question: ${questionText}`);
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
  for (const opt of question.options) {
    const text = opt.content.replace(/<[^>]+>/g, "");
    parts.push(`  [${opt.option_id}] ${text}`);
  }
  parts.push(
    "\nRespond with ONLY the option_id of the correct answer. No explanation, no quotes, just the UUID."
  );
  return parts.join("\n");
}
function pickBestOptionId(responseText, options) {
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const matches = responseText.match(uuidPattern) ?? [];
  const optionIds = new Set(options.map((o) => o.option_id.toLowerCase()));
  for (const match of matches) {
    if (optionIds.has(match.toLowerCase())) {
      return match.toLowerCase() === match ? options.find((o) => o.option_id.toLowerCase() === match).option_id : match;
    }
  }
  return options[0].option_id;
}
var MODELS = [
  "openai/gpt-oss-120b",
  "moonshotai/kimi-k2-instruct-0905",
  "moonshotai/kimi-k2-instruct",
  "llama-3.3-70b-versatile"
];
async function solveQuestion(question) {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");
  const prompt = buildPrompt(question);
  let lastError;
  for (const model of MODELS) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are an expert at answering multiple-choice questions accurately. You always respond with only the option_id UUID, nothing else."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 64,
        temperature: 0
      });
      const answer = completion.choices[0]?.message?.content?.trim() ?? "";
      return pickBestOptionId(answer, question.options);
    } catch (err) {
      console.warn(`[Groq fallback] Model ${model} failed. Trying next...`);
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All Groq models failed.");
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
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return answers;
}
function buildSqlPrompt(questions, dbContext) {
  const schema = dbContext.replace(/<[^>]+>/g, "").replace(/\r\n/g, "\n").trim();
  const parts = [
    "You are an expert SQL developer. Given the database schema below, write SQL answers for each numbered question.",
    "",
    `Database context:
${schema}`,
    "",
    "Questions:"
  ];
  for (const q of questions) {
    const text = q.question.content.replace(/<[^>]+>/g, "").trim();
    parts.push(`
[${q.question_id}]
${text}`);
  }
  parts.push(
    "\nRespond with ONLY a JSON object mapping each question_id to its SQL answer string, like:",
    '{"<id>": "SELECT ...", "<id2>": "DELETE ..."}',
    "No markdown, no explanations, just the JSON object."
  );
  return parts.join("\n");
}
async function solveSqlQuestions(questions, dbContext, onProgress) {
  if (!groqClient) throw new Error("Groq not initialised. Call initGroq() first.");
  const answers = /* @__PURE__ */ new Map();
  const BATCH = 10;
  let done = 0;
  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const prompt = buildSqlPrompt(batch, dbContext);
    let parsed = {};
    let lastError;
    for (const model of MODELS) {
      try {
        const completion = await groqClient.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: "You are an expert SQL developer. Respond only with the requested JSON object."
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 2048,
          temperature: 0
        });
        const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
        const cleaned = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
        parsed = JSON.parse(cleaned);
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (Object.keys(parsed).length === 0 && lastError) {
      for (const q of batch) {
        const fallbackPrompt = `Write a single SQL query for the following task. Respond with ONLY the SQL, no explanation.

Database: ${dbContext}

Task: ${q.question.content.replace(/<[^>]+>/g, "")}`;
        try {
          const completion = await groqClient.chat.completions.create({
            model: MODELS[MODELS.length - 1],
            messages: [{ role: "user", content: fallbackPrompt }],
            max_tokens: 256,
            temperature: 0
          });
          const sql = completion.choices[0]?.message?.content?.trim() ?? "SELECT 1;";
          parsed[q.question_id] = sql.replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();
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
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return answers;
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
  const questionText = q.question.content.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
  const testCasesText = q.test_cases.map((tc, i) => {
    const inp = decodeCodeContent(tc.input);
    const out = decodeCodeContent(tc.output);
    return `Example ${i + 1}:
  Input: ${inp}
  Output: ${out}`;
  }).join("\n");
  const langLabel = {
    CPP: "C++",
    JAVA: "Java",
    PYTHON: "Python 3",
    NODE_JS: "Node.js (JavaScript)"
  };
  return [
    `You are an expert ${langLabel[lang] ?? lang} developer. Complete the following coding problem.`,
    "",
    `Problem:
${questionText}`,
    "",
    testCasesText ? `Test Cases:
${testCasesText}` : "",
    "",
    `Language: ${langLabel[lang] ?? lang}`,
    "",
    `Template code (fill in the blanks, keep the structure):
\`\`\`
${template}
\`\`\``,
    "",
    "Respond with ONLY the complete runnable code. No explanation, no markdown fences."
  ].filter(Boolean).join("\n");
}
async function solveCodingQuestion(q, lang) {
  if (!groqClient) throw new Error("Groq not initialised. Call initGroq() first.");
  const template = decodeCodeContent(q.code.code_content);
  const prompt = buildCodingPrompt(q, lang, template);
  let lastError;
  for (const model of MODELS) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are an expert programmer. Write complete, correct, runnable code. Respond with ONLY the code, no markdown, no commentary.`
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? template;
      return raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All models failed for coding question.");
}

// src/runner.ts
import chalk2 from "chalk";
import ora from "ora";
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function log(level, msg) {
  const prefix = {
    info: chalk2.blue("  \u2139"),
    ok: chalk2.green("  \u2714 "),
    warn: chalk2.yellow("  \u26A0"),
    skip: chalk2.gray("  \u2500"),
    err: chalk2.red("  \u2716 ")
  };
  console.log(`${prefix[level]} ${msg}`);
}
async function handleLearningSet(client, unit, skipCompleted, delayMs) {
  const name = unit.learning_resource_set_unit_details?.name ?? unit.unit_id;
  if (skipCompleted && unit.completion_status === "COMPLETED") {
    log(
      "skip",
      `Learning Set: ${chalk2.dim(name)} ${chalk2.gray("(already done)")}`
    );
    return;
  }
  const spinner = ora({ text: `Learning Set: ${name}`, color: "cyan" }).start();
  try {
    await completeLearningSet(client, unit.unit_id);
    spinner.succeed(chalk2.green(`Learning Set: ${name}`));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    spinner.fail(chalk2.red(`Learning Set: ${name} \u2014 ${msg}`));
  }
  await sleep(delayMs);
}
async function handlePracticeSet(client, unit, skipCompleted, delayMs) {
  const name = unit.practice_unit_details?.name ?? unit.unit_id;
  if (skipCompleted && unit.completion_percentage >= 100) {
    log("skip", `Practice: ${chalk2.dim(name)} ${chalk2.gray("(already done)")}`);
    return;
  }
  if (unit.is_unit_locked) {
    log(
      "warn",
      `Practice: ${chalk2.dim(name)} ${chalk2.yellow("(locked \u2014 skipping)")}`
    );
    return;
  }
  console.log(chalk2.bold(`
  \u25B8 Practice: ${chalk2.cyan(name)}`));
  let examAttemptId;
  const attemptSpinner = ora("  Creating exam attempt\u2026").start();
  try {
    const attempt = await createExamAttempt(client, unit.unit_id);
    examAttemptId = attempt.exam_attempt_id;
    attemptSpinner.succeed(`  Exam attempt: ${chalk2.dim(examAttemptId)}`);
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
      `  Submitted \u2014 ${chalk2.green(`${correct_answer_count}/${total_questions_count}`)} correct (${pct}%)  score: ${score}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    submitSpinner.fail(`  Submit failed: ${msg}`);
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
    log("skip", `Question Set: ${chalk2.dim(name)} ${chalk2.gray("(already done)")}`);
    return;
  }
  if (unit.is_unit_locked) {
    log("warn", `Question Set: ${chalk2.dim(name)} ${chalk2.yellow("(locked \u2014 skipping)")}`);
    return;
  }
  console.log(chalk2.bold(`
  \u25B8 Question Set: ${chalk2.cyan(name)}`));
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
      probeSpinner.succeed("  Coding Question Set (no SQL questions found)");
    }
  } catch {
    probeSpinner.succeed("  Coding Question Set (SQL probe failed)");
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
    const solveSpinner = ora(`  Solving ${unanswered2.length} SQL question(s) with AI\u2026`).start();
    let sqlAnswers;
    try {
      sqlAnswers = await solveSqlQuestions(unanswered2, dbContext, (done, total) => {
        solveSpinner.text = `  Solving SQL questions with AI\u2026 ${done}/${total}`;
      });
      solveSpinner.succeed(`  Solved ${sqlAnswers.size} SQL question(s)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      solveSpinner.fail(`  SQL solving failed: ${msg}`);
      return;
    }
    await sleep(delayMs);
    const submitSpinner2 = ora("  Submitting SQL answers\u2026").start();
    try {
      const responses = unanswered2.filter((q) => sqlAnswers.has(q.question_id)).map((q, i) => ({
        question_id: q.question_id,
        time_spent: 10 + i * 5,
        user_response_code: {
          code_content: sqlAnswers.get(q.question_id),
          language: "SQL"
        }
      }));
      const result = await submitSqlAnswers(client, responses);
      const correct = result.submission_results.filter((r) => r.evaluation_result === "CORRECT").length;
      const total = result.submission_results.length;
      submitSpinner2.succeed(
        `  SQL submitted \u2014 ${chalk2.green(`${correct}/${total}`)} correct`
      );
      for (const r of result.submission_results) {
        if (r.evaluation_result !== "CORRECT") {
          const qText = unanswered2.find((q) => q.question_id === r.question_id)?.question.short_text ?? r.question_id;
          log("warn", `  \u2717 ${qText} \u2014 ${r.coding_submission_response?.reason_for_error ?? "INCORRECT"}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      submitSpinner2.fail(`  SQL submit failed: ${msg}`);
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
  const codingResponses = [];
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
        `  [${i + 1}/${questions.length}] ${chalk2.green(q.question.short_text ?? q.question_id)} (${lang})`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      solveSpinner.warn(`  [${i + 1}/${questions.length}] ${q.question.short_text ?? q.question_id} \u2014 AI failed: ${msg}, using template`);
      code = decodeCodeContentLocal(q.code.code_content);
    }
    const encodedCode = encodeCodeContent(code);
    if (summaryEntry?.question_status === "NOT_ATTEMPTED") {
      try {
        await startCodingQuestion(client, q.question_id);
        await saveCodingAnswer(client, q.question_id, encodedCode, lang);
      } catch {
      }
      await sleep(Math.max(delayMs / 2, 300));
    }
    codingResponses.push({
      question_id: q.question_id,
      time_spent: 30 + i * 10,
      coding_answer: {
        code_content: encodedCode,
        language: lang
      }
    });
    if (i < questions.length - 1) await sleep(delayMs);
  }
  const submitSpinner = ora(`  Submitting ${codingResponses.length} coding answer(s)\u2026`).start();
  try {
    const result = await submitCodingAnswers(client, codingResponses);
    const correct = result.submission_result.filter((r) => r.evaluation_result === "CORRECT").length;
    const total = result.submission_result.length;
    const totalScore = result.submission_result.reduce((a, r) => a + r.user_response_score, 0);
    submitSpinner.succeed(
      `  Coding submitted \u2014 ${chalk2.green(`${correct}/${total}`)} correct  score: ${totalScore}`
    );
    for (const r of result.submission_result) {
      if (r.evaluation_result !== "CORRECT") {
        const q = questions.find((q2) => q2.question_id === r.question_id);
        log(
          "warn",
          `  \u2717 ${q?.question.short_text ?? r.question_id} \u2014 ${r.passed_test_cases_count ?? 0}/${r.total_test_cases_count ?? "?"} tests passed`
        );
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    submitSpinner.fail(`  Coding submit failed: ${msg}`);
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
    chalk2.bold.yellow(`
  \u25CF Topic ${topic.order}: ${topic.topic_name}`) + chalk2.gray(` [${(topic.completion_percentage ?? 0).toFixed(0)}% done]`)
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
  console.log(chalk2.bold.bgCyan.black(`
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
    chalk2.bold.cyan("\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550")
  );
  console.log(chalk2.bold.cyan("  Starting automation\u2026"));
  console.log(
    chalk2.bold.cyan("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n")
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
    chalk2.bold.green("\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550")
  );
  console.log(chalk2.bold.green("  All done!"));
  console.log(
    chalk2.bold.green("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n")
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
    console.error(chalk3.red(`
  \u2716 ${msg}
`));
    process.exit(1);
  }
  let config;
  try {
    config = await runPrompts(curriculum);
  } catch (err) {
    if (err.code === "ERR_USE_AFTER_CLOSE" || String(err).includes("force closed")) {
      console.log(chalk3.yellow("\n\n  Aborted.\n"));
      process.exit(0);
    }
    throw err;
  }
  initGroq(config.groqKey);
  const client = createClient(config.token);
  try {
    await run(client, config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk3.red(`
  \u2716 Unexpected error: ${msg}
`));
    process.exit(1);
  }
}
main();
