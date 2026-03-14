import chalk from "chalk";
import type { AxiosError } from "axios";

export const IS_DEBUG = process.env.DEBUG === "1";

/**
 * Log a debug message — only printed when DEBUG=1 (npm run dev).
 */
export function debug(label: string, ...args: unknown[]): void {
  if (!IS_DEBUG) return;
  console.log(chalk.gray(`  [DBG] ${label}`), ...args);
}

/**
 * Log a full Axios error response — only printed when DEBUG=1.
 * Shows status, headers, and the raw response body.
 */
export function debugAxiosError(context: string, err: unknown): void {
  if (!IS_DEBUG) return;
  const ax = err as AxiosError;
  if (!ax.isAxiosError) {
    debug(context, err);
    return;
  }

  const res = ax.response;
  console.log(chalk.bgRed.white(`\n  [DBG] ${context} — HTTP ${res?.status ?? "?"}`));
  if (res?.headers) {
    console.log(chalk.gray("  Request URL:"), chalk.dim(ax.config?.url ?? ""));
    console.log(chalk.gray("  Request body:"), chalk.dim(
      typeof ax.config?.data === "string"
        ? ax.config.data.slice(0, 500)   // truncate giant payloads
        : JSON.stringify(ax.config?.data)
    ));
  }
  console.log(chalk.gray("  Response body:"));
  try {
    console.log(chalk.yellow(JSON.stringify(res?.data, null, 2)));
  } catch {
    console.log(chalk.yellow(String(res?.data)));
  }
  console.log();
}
