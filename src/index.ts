import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import chalk from "chalk";
import { runPrompts } from "./cli.js";
import { createClient } from "./api.js";
import { initGroq } from "./solver.js";
import { initPuter } from "./puter-solver.js";
import { setAIProvider } from "./solver-interface.js";
import { run } from "./runner.js";
import { clearSession } from "./browser-auth.js";
import type { Curriculum } from "./types.js";

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
    } catch {
      // try next
    }
  }

  throw new Error(
    "curriculum.json not found. Make sure it exists in the package root.",
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

  // Retry loop — on 401, clear browser session and re-prompt
  while (true) {
    let config;
    try {
      config = await runPrompts(curriculum);
    } catch (err: unknown) {
      // User hit Ctrl-C during prompts
      if (
        (err as NodeJS.ErrnoException).code === "ERR_USE_AFTER_CLOSE" ||
        String(err).includes("force closed")
      ) {
        console.log(chalk.yellow("\n\n  Aborted.\n"));
        process.exit(0);
      }
      throw err;
    }

    // Initialize the selected AI provider
    setAIProvider(config.aiProvider);

    if (config.aiProvider === "groq") {
      if (!config.groqKey) {
        console.error(chalk.red("\n  ✖ Groq API key is required when using Groq provider.\n"));
        process.exit(1);
      }
      initGroq(config.groqKey);
      console.log(chalk.gray("Initialized Groq AI provider.\n"));
    } else {
      await initPuter();
      console.log(chalk.gray("Initialized Puter.js AI provider.\n"));
    }

    const client = createClient(config.token);

    try {
      await run(client, config);
      break; // done
    } catch (err: unknown) {
      const status = (err as any)?.response?.status;
      if (status === 401) {
        console.error(chalk.red("\n  ✖ 401 Unauthorized — session expired."));
        console.log(chalk.yellow("  Clearing session. Please login again.\n"));
        clearSession();
        continue; // back to prompt
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\n  ✖ Unexpected error: ${msg}\n`));
      process.exit(1);
    }
  }
}

main();
