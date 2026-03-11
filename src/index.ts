import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import chalk from "chalk";
import { runPrompts } from "./cli.js";
import { createClient } from "./api.js";
import { initGroq } from "./solver.js";
import { run } from "./runner.js";
import type { Curriculum } from "./types.js";

async function loadCurriculum(): Promise<Curriculum> {
  // Works both from src/ during dev (tsx) and from dist/ after build (tsup)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Try paths: alongside the built file, then up to project root
  const candidates = [
    join(__dirname, "curriculum.json"),
    join(__dirname, "..", "curriculum.json"),
  ];

  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf-8");
      return JSON.parse(raw) as Curriculum;
    } catch {
      // try next
    }
  }

  throw new Error(
    "curriculum.json not found. Make sure it exists in the package root."
  );
}

async function main(): Promise<void> {
  let curriculum: Curriculum;
  try {
    curriculum = await loadCurriculum();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n  ✖ ${msg}\n`));
    process.exit(1);
  }

  let config;
  try {
    config = await runPrompts(curriculum);
  } catch (err: unknown) {
    // User hit Ctrl-C during prompts
    if ((err as NodeJS.ErrnoException).code === "ERR_USE_AFTER_CLOSE" || String(err).includes("force closed")) {
      console.log(chalk.yellow("\n\n  Aborted.\n"));
      process.exit(0);
    }
    throw err;
  }

  initGroq(config.groqKey);
  const client = createClient(config.token);

  try {
    await run(client, config);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n  ✖ Unexpected error: ${msg}\n`));
    process.exit(1);
  }
}

main();
