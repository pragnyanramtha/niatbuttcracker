import { input, password, checkbox, select, confirm, number } from "@inquirer/prompts";
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

███╗░░██╗██╗░█████╗░████████╗  ██████╗░██╗░░░██╗████████╗████████╗
████╗░██║██║██╔══██╗╚══██╔══╝  ██╔══██╗██║░░░██║╚══██╔══╝╚══██╔══╝
██╔██╗██║██║███████║░░░██║░░░  ██████╦╝██║░░░██║░░░██║░░░░░░██║░░░
██║╚████║██║██╔══██║░░░██║░░░  ██╔══██╗██║░░░██║░░░██║░░░░░░██║░░░
██║░╚███║██║██║░░██║░░░██║░░░  ██████╦╝╚██████╔╝░░░██║░░░░░░██║░░░
╚═╝░░╚══╝╚═╝╚═╝░░╚═╝░░░╚═╝░░░  ╚═════╝░░╚═════╝░░░░╚═╝░░░░░░╚═╝░░░

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

  const token = await password({
    message: "Bearer token (from browser DevTools / Network tab):",
    mask: "•",
    validate: (v) => (v.trim().length > 10 ? true : "Token looks too short"),
  });

  // Try to load Groq key from config
  let groqKey = "";
  const cfg = await loadConfig();
  if (cfg.groqKey && cfg.groqKey.startsWith("gsk_")) {
    groqKey = cfg.groqKey;
    console.log(chalk.gray("Loaded Groq API key from config."));
  } else {
    groqKey = await password({
      message: "Groq API key (for AI question solving — get at console.groq.com):",
      mask: "•",
      validate: (v) => (v.trim().startsWith("gsk_") ? true : 'Groq keys start with "gsk_"'),
    });
    await saveConfig({ groqKey: groqKey.trim() });
    console.log(chalk.green("Groq API key saved for future runs."));
  }

  return { token: token.trim(), groqKey: groqKey.trim() };
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

  const n = await number({
    message: `How many topics (1–${course.no_of_topics})?`,
    min: 1,
    max: course.no_of_topics,
    default: course.no_of_topics,
  });

  return n ?? course.no_of_topics;
}

async function selectMode(): Promise<CompletionMode> {
  console.log(chalk.bold.yellow("\n── Completion Mode ──────────────────────────────\n"));

  return select<CompletionMode>({
    message: "What should be completed?",
    choices: [
      {
        name: `${chalk.green("Both")} — Learning Sets ${chalk.dim("+")} Practice Sets ${chalk.dim("+")} Question Sets`,
        value: "both",
      },
      {
        name: `${chalk.blue("Learning Sets only")} — Mark video/reading resources as done`,
        value: "learning_sets",
      },
      {
        name: `${chalk.magenta("Practice Sets only")} — Attempt and submit MCQ practice exams`,
        value: "practice",
      },
      {
        name: `${chalk.yellow("Question Sets only")} — Solve SQL/Coding practice questions with AI`,
        value: "question_sets",
      },
    ],
  });
}

async function selectOptions(): Promise<{ skipCompleted: boolean; delayMs: number }> {
  console.log(chalk.bold.yellow("\n── Options ──────────────────────────────────────\n"));

  const skipCompleted = await confirm({
    message: "Skip already-completed units?",
    default: true,
  });

  const delayChoice = await select<number>({
    message: "Delay between API requests:",
    choices: [
      { name: "1 second (safe, slow)", value: 1000 },
      { name: "0.5 seconds (moderate)", value: 500 },
      { name: "0.2 seconds (fast, may get rate-limited)", value: 200 },
    ],
    default: 1000,
  });

  return { skipCompleted, delayMs: delayChoice };
}

// ── Summary & confirm ─────────────────────────────────────────────────────────

function printSummary(config: Omit<RunConfig, "token" | "groqKey">): void {
  console.log(chalk.bold.yellow("\n── Run Summary ──────────────────────────────────\n"));

  for (const course of config.selectedCourses) {
    const limit = course.topicLimit === "all" ? "all topics" : `${course.topicLimit} topics`;
    console.log(`  ${chalk.cyan("•")} ${course.course_title} ${chalk.dim(`(${limit})`)}`);
  }

  const modeLabel: Record<CompletionMode, string> = {
    both: "Learning Sets + Practice Sets + Question Sets",
    learning_sets: "Learning Sets only",
    practice: "Practice Sets only",
    question_sets: "Question Sets only",
  };

  console.log(`\n  Mode:          ${chalk.green(modeLabel[config.mode])}`);
  console.log(`  Skip done:     ${config.skipCompleted ? chalk.green("yes") : chalk.red("no")}`);
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
  const { skipCompleted, delayMs } = await selectOptions();

  const config: RunConfig = {
    token,
    groqKey,
    selectedCourses,
    mode,
    skipCompleted,
    delayMs,
  };

  printSummary({ selectedCourses, mode, skipCompleted, delayMs });

  const go = await confirm({ message: "Start automation?", default: true });
  if (!go) {
    console.log(chalk.yellow("\nAborted."));
    process.exit(0);
  }

  return config;
}
