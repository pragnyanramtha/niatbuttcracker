import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import chalk from "chalk";
import { createClient } from "./api.js";
import { initCerebras } from "./solver.js";
import { run } from "./runner.js";
import type {
  Curriculum,
  SelectedCourse,
  CompletionMode,
  RunConfig,
} from "./types.js";

function parseArgs() {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();

  for (let i = 0; i < args.length; i++) {
    if (args[i]!.startsWith("--")) {
      const key = args[i]!.replace(/^--/, "");
      const val = args[i + 1];
      if (val && !val.startsWith("--")) {
        map.set(key, val);
        i++;
      } else {
        map.set(key, "true");
      }
    }
  }

  return map;
}

async function loadCurriculum(): Promise<Curriculum> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const candidates = [
    join(__dirname, "curriculum.json"),
    join(__dirname, "..", "curriculum.json"),
  ];

  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf-8");
      return JSON.parse(raw) as Curriculum;
    } catch {}
  }

  throw new Error("curriculum.json not found");
}

async function main() {
  const args = parseArgs();
  const token = args.get("token") || process.env.CCBP_TOKEN;
  const cerebrasKey = args.get("cerebras-key") || process.env.CEREBRAS_API_KEY;
  const semesterName = args.get("semester");
  const mode = (args.get("mode") || "all") as CompletionMode;
  const topicLimitRaw = args.get("topic-limit") ?? "all";
  const topicLimit: number | "all" =
    topicLimitRaw === "all" ? "all" : parseInt(topicLimitRaw, 10);

  if (!token) {
    console.error(chalk.red("--token <value> or CCBP_TOKEN env var required"));
    process.exit(1);
  }
  if (!cerebrasKey) {
    console.error(chalk.red("--cerebras-key <value> or CEREBRAS_API_KEY env var required"));
    process.exit(1);
  }

  const curriculum = await loadCurriculum();

  // Resolve courses from --semester, or --course-ids, or --subject
  const courseIdsRaw = args.get("course-ids");
  const courseTitlesRaw = args.get("course-titles");
  const subjectNamesRaw = args.get("subjects");

  let selectedCourses: SelectedCourse[] = [];

  if (semesterName) {
    // Find semester by name across all years
    for (const year of curriculum.curriculum_details) {
      for (const sem of year.semester_details) {
        if (sem.semester_name.toLowerCase() === semesterName.toLowerCase()) {
          for (const subject of sem.semester_subjects) {
            for (const course of subject.semester_courses) {
              selectedCourses.push({
                course_id: course.course_id,
                course_title: course.course_title,
                topicLimit,
              });
            }
          }
          break;
        }
      }
    }
    if (selectedCourses.length === 0) {
      console.error(chalk.yellow(`No courses found for semester "${semesterName}" (empty course lists?)`));
    }
  }

  if (courseIdsRaw) {
    const ids = courseIdsRaw.split(",").map(s => s.trim()).filter(Boolean);
    const titles = (courseTitlesRaw || "").split("|").map(s => s.trim());

    for (let i = 0; i < ids.length; i++) {
      selectedCourses.push({
        course_id: ids[i]!,
        course_title: titles[i] || ids[i]!,
        topicLimit,
      });
    }
  }

  if (subjectNamesRaw) {
    const names = subjectNamesRaw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    for (const year of curriculum.curriculum_details) {
      for (const sem of year.semester_details) {
        for (const subject of sem.semester_subjects) {
          if (names.some(n => subject.subject_title.toLowerCase().includes(n) || subject.subject_code.toLowerCase().includes(n))) {
            for (const course of subject.semester_courses) {
              if (!selectedCourses.find(c => c.course_id === course.course_id)) {
                selectedCourses.push({
                  course_id: course.course_id,
                  course_title: course.course_title,
                  topicLimit,
                });
              }
            }
          }
        }
      }
    }
  }

  if (selectedCourses.length === 0) {
    console.error(chalk.red("No courses selected. Use --semester, --course-ids, or --subjects"));
    console.error(chalk.gray("  --semester \"Semester 2\""));
    console.error(chalk.gray("  --course-ids id1,id2 --course-titles \"Title1|Title2\""));
    console.error(chalk.gray("  --subjects \"Web Application,DataBase\""));
    process.exit(1);
  }

  // Show summary
  console.log(chalk.bold.cyan("\n════════════════════════════════════════════"));
  console.log(chalk.bold.cyan("  Agent-Exec: Non-interactive mode"));
  console.log(chalk.bold.cyan("════════════════════════════════════════════\n"));

  for (const c of selectedCourses) {
    const limit = c.topicLimit === "all" ? "all topics" : `${c.topicLimit} topics`;
    console.log(`  ${chalk.cyan("•")} ${c.course_title} ${chalk.dim(`(${limit})`)}`);
  }
  console.log(`  Mode: ${chalk.green(mode)}`);

  initCerebras(cerebrasKey);
  console.log(chalk.gray("  Initialized Cerebras AI provider.\n"));

  const config: RunConfig = {
    token,
    cerebrasKey,
    selectedCourses,
    mode,
    skipCompleted: true,
    delayMs: 100,
  };

  const client = createClient(config.token);
  await run(client, config);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`\n  ✖ ${msg}\n`));
  process.exit(1);
});
