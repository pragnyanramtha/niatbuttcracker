import { input, password, checkbox, select } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import { captureTokenFromBrowser } from "./browser-auth.js";
import type {
  Curriculum,
  CurriculumSemester,
  CurriculumCourse,
  SelectedCourse,
  RunConfig,
  CompletionMode,
} from "./types.js";
import { loadConfig, saveConfig } from "./config.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function banner(): void {
  console.log(
    chalk.bold.cyan(`

███╗░░██╗██╗░█████╗░████████╗  ██████╗░██╗░░░██╗████████╗████████╗
████╗░██║██║██╔══██╗╚══██╔══╝  ██╔══██╗██║░░░██║╚══██╔══╝╚══██╔══╝
██╔██╗██║██║███████║░░░██║░░░  ██████╦╝██║░░░██║░░░██║░░░░░░██║░░░
██║╚████║██║██╔══██║░░░██║░░░  ██╔══██╗██║░░░██║░░░██║░░░░░░██║░░░
██║░╚███║██║██║░░██║░░░██║░░░  ██████╦╝╚██████╔╝░░░██║░░░░░░██║░░░
╚═╝░░╚══╝╚═╝╚═╝░░╚═╝░░░╚═╝░░░  ╚═════╝░░╚═════╝░░░░╚═╝░░░░░░╚═╝░░░

░█████╗░██████╗░░█████╗░░█████╗░██╗░░██╗███████╗██████╗░
██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║░██╔╝██╔════╝██╔══██╗
██║░░╚═╝██████╔╝███████║██║░░╚═╝█████═╝░█████╗░░██████╔╝
██║░░██╗██╔══██╗██╔══██║██║░░██╗██╔═██╗░██╔══╝░░██╔══██╗
╚█████╔╝██║░░██║██║░░██║╚█████╔╝██║░╚██╗███████╗██║░░██║
░╚════╝░╚═╝░░╚═╝╚═╝░░╚═╝░╚════╝░╚═╝░░╚═╝╚══════╝╚═╝░░╚═╝`)
  );
  console.log(chalk.gray("  NIAT BUTT CRACKER — use Space to select, A for all\n"));
}

// ── Authentication (automatic browser capture) ────────────────────────────────

async function captureAuthToken(): Promise<string> {
  console.log(chalk.bold.yellow("── Authentication ──────────────────────────────\n"));
  console.log(chalk.gray("  Opening browser for login..."));
  console.log(chalk.gray("  (If already logged in, this will be instant)\n"));

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

// ── Groq API key ──────────────────────────────────────────────────────────────

async function getGroqKey(): Promise<string> {
  const cfg = await loadConfig();

  if (cfg.groqKey && cfg.groqKey.startsWith("gsk_")) {
    console.log(chalk.gray("Loaded Groq API key from config.\n"));
    return cfg.groqKey;
  }

  console.log(chalk.bold.yellow("── Groq API Key ────────────────────────────────\n"));

  const groqKey = (await password({
    message: "Groq API key (get at console.groq.com):",
    mask: "•",
    validate: (v) => (v.trim().startsWith("gsk_") ? true : 'Groq keys start with "gsk_"'),
  })).trim();

  await saveConfig({ ...cfg, groqKey });
  console.log(chalk.green("Groq API key saved.\n"));

  return groqKey;
}

// ── Semester / course selection ───────────────────────────────────────────────

async function selectSemester(curriculum: Curriculum): Promise<CurriculumSemester> {
  console.log(chalk.bold.yellow("── Semester Selection ───────────────────────────\n"));

  const choices = curriculum.curriculum_details.flatMap((year) =>
    year.semester_details.map((sem) => ({
      name: `Year ${year.year} › ${sem.semester_name}`,
      value: sem,
    }))
  );

  return select<CurriculumSemester>({
    message: "Select a semester:",
    choices,
  });
}

async function selectCourses(semester: CurriculumSemester): Promise<CurriculumCourse[]> {
  console.log(chalk.bold.yellow("\n── Course Selection ─────────────────────────────\n"));
  console.log(chalk.gray("Space = toggle  •  A = select all  •  Enter = confirm\n"));

  const choices = semester.semester_subjects.flatMap((subject) =>
    subject.semester_courses.map((course) => ({
      name: `${chalk.dim(`[${subject.subject_code}]`)} ${course.course_title} ${chalk.dim(`(${course.no_of_topics} topics)`)}`,
      value: course,
      checked: false,
    }))
  );

  const selected = await checkbox<CurriculumCourse>({
    message: "Choose course(s) to automate:",
    choices,
    validate: (v) => (v.length > 0 ? true : "Select at least one course"),
  });

  return selected;
}

async function selectTopicLimit(course: CurriculumCourse): Promise<number | "all"> {
  const choice = await select<"all" | "some">({
    message: `${chalk.cyan(course.course_title)} — how many topics to process?`,
    choices: [
      { name: `All ${course.no_of_topics} topics`, value: "all" },
      { name: "Enter a specific number", value: "some" },
    ],
  });

  if (choice === "all") return "all";

  const raw = await input({
    message: `How many topics (1–${course.no_of_topics})?`,
    default: String(course.no_of_topics),
    validate: (v) => {
      const n = parseInt(v, 10);
      return (n >= 1 && n <= course.no_of_topics) ? true : `Enter a number between 1 and ${course.no_of_topics}`;
    },
  });

  return parseInt(raw, 10);
}

// ── Mode selection (multi-pick, shows component labels) ───────────────────────

async function selectMode(): Promise<CompletionMode> {
  console.log(chalk.bold.yellow("\n── What to complete ─────────────────────────────\n"));
  console.log(chalk.gray("Space = toggle  •  A = select all  •  Enter = confirm\n"));

  const choices = [
    {
      name: `${chalk.blue("Learning Sets")} — Mark video/reading resources as done`,
      value: "learning_sets" as const,
      checked: false,
    },
    {
      name: `${chalk.magenta("Practice Sets")} — Attempt and submit MCQ practice exams`,
      value: "practice" as const,
      checked: false,
    },
    {
      name: `${chalk.yellow("Question Sets")} — Solve SQL/Coding questions with AI`,
      value: "question_sets" as const,
      checked: false,
    },
  ];

  const selected = await checkbox<"learning_sets" | "practice" | "question_sets">({
    message: "What should be completed?",
    choices,
    validate: (v) => (v.length > 0 ? true : "Select at least one option"),
  });

  // Map multi-select back to CompletionMode
  const hasLearning = selected.includes("learning_sets");
  const hasPractice = selected.includes("practice");
  const hasQuestions = selected.includes("question_sets");

  if (hasLearning && hasPractice && hasQuestions) return "all";
  if (hasLearning && !hasPractice && !hasQuestions) return "learning_sets";
  if (!hasLearning && hasPractice && !hasQuestions) return "practice";
  if (!hasLearning && !hasPractice && hasQuestions) return "question_sets";

  // Mixed subset — use "all" and let runner filter naturally
  return "all";
}

// ── Summary & confirm ─────────────────────────────────────────────────────────

function printSummary(config: Omit<RunConfig, "token" | "groqKey">): void {
  console.log(chalk.bold.yellow("\n── Run Summary ──────────────────────────────────\n"));

  for (const course of config.selectedCourses) {
    const limit = course.topicLimit === "all" ? "all topics" : `${course.topicLimit} topics`;
    console.log(`  ${chalk.cyan("•")} ${course.course_title} ${chalk.dim(`(${limit})`)}`);
  }

  const modeLabel: Record<CompletionMode, string> = {
    all: "Learning Sets + Practice Sets + Question Sets",
    learning_sets: "Learning Sets only",
    practice: "Practice Sets only",
    question_sets: "Question Sets only",
  };

  console.log(`\n  Mode:          ${chalk.green(modeLabel[config.mode])}`);
  console.log(`  Request delay: ${config.delayMs}ms\n`);
}

// ── Master prompt flow ────────────────────────────────────────────────────────

export async function runPrompts(curriculum: Curriculum): Promise<RunConfig> {
  banner();

  // Auto-capture auth token from browser (no prompts)
  const token = await captureAuthToken();

  // Get Groq API key (prompts only if not saved)
  const groqKey = await getGroqKey();

  const semester = await selectSemester(curriculum);
  const courses = await selectCourses(semester);

  const selectedCourses: SelectedCourse[] = [];
  for (const course of courses) {
    const topicLimit = await selectTopicLimit(course);
    selectedCourses.push({
      course_id: course.course_id,
      course_title: course.course_title,
      topicLimit,
    });
  }

  const mode = await selectMode();

  // Hardcoded: always skip completed, use 100ms delay
  const skipCompleted = true;
  const delayMs = 100;

  const config: RunConfig = {
    token,
    groqKey,
    selectedCourses,
    mode,
    skipCompleted,
    delayMs,
  };

  printSummary({ selectedCourses, mode, skipCompleted, delayMs });

  // Single Enter to start — no y/n confirm
  await input({ message: chalk.green("Press Enter to start automation…"), default: "" });

  return config;
}
