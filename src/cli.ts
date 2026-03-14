import { input, password, checkbox, select } from "@inquirer/prompts";
import chalk from "chalk";
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

// ── Credential prompts ────────────────────────────────────────────────────────

async function promptCredentials(): Promise<{ token: string; groqKey: string }> {
  console.log(chalk.bold.yellow("── Credentials ─────────────────────────────────\n"));

  const cfg = await loadConfig();

  // ── Token: reuse saved or ask for new ─────────────────────────────────────
  let token = "";
  if (cfg.token && cfg.token.length > 10) {
    const masked = cfg.token.slice(0, 6) + "••••••••••••••••" + cfg.token.slice(-4);
    const reuse = await select<"reuse" | "new">({
      message: `Saved bearer token (${masked}):`,
      choices: [
        { name: "Use saved token", value: "reuse" },
        { name: "Enter a new token", value: "new" },
      ],
    });
    if (reuse === "reuse") {
      token = cfg.token;
      console.log(chalk.gray("Using saved token."));
    }
  }

  if (!token) {
    token = (await password({
      message: "Bearer token (from browser DevTools / Network tab):",
      mask: "•",
      validate: (v) => (v.trim().length > 10 ? true : "Token looks too short"),
    })).trim();
    await saveConfig({ ...cfg, token });
    console.log(chalk.gray("Token saved for next run."));
  }

  // ── Groq key: reuse saved or ask for new ──────────────────────────────────
  let groqKey = "";
  if (cfg.groqKey && cfg.groqKey.startsWith("gsk_")) {
    groqKey = cfg.groqKey;
    console.log(chalk.gray("Loaded Groq API key from config."));
  } else {
    groqKey = (await password({
      message: "Groq API key (for AI question solving — get at console.groq.com):",
      mask: "•",
      validate: (v) => (v.trim().startsWith("gsk_") ? true : 'Groq keys start with "gsk_"'),
    })).trim();
    await saveConfig({ ...cfg, groqKey });
    console.log(chalk.green("Groq API key saved for future runs."));
  }

  return { token, groqKey };
}

// ── Semester / course selection ───────────────────────────────────────────────

async function selectSemester(curriculum: Curriculum): Promise<CurriculumSemester> {
  console.log(chalk.bold.yellow("\n── Semester Selection ───────────────────────────\n"));

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
  // (runner already skips based on mode, so extra selections are harmless)
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

  const { token, groqKey } = await promptCredentials();
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
