/**
 * Browser-based automatic auth token capture.
 * Uses the system's default browser (Edge/Chrome) — no browser download required.
 * Persists browser session (cookies) so you only login once.
 */

import chalk from "chalk";
import { existsSync, unlinkSync } from "fs";
import { chromium } from "playwright";
import { getSessionPath } from "./config.js";

export interface BrowserAuthOptions {
  /** Login page URL */
  loginUrl?: string;
  /** API base URL to intercept */
  apiBase?: string;
  /** Timeout in ms (default: 5 minutes) */
  timeout?: number;
  /** Force fresh login (ignore saved session) */
  forceLogin?: boolean;
}

export interface BrowserAuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Find the best available browser.
 * Priority: msedge → chrome → default chromium
 */
async function getAvailableBrowserChannel(): Promise<string | null> {
  // Try browsers in order: Edge (always on Windows), Chrome, then default
  const channels = ["msedge", "chrome"];

  for (const channel of channels) {
    try {
      const browser = await chromium.launch({
        headless: true,
        channel,
      });
      await browser.close();
      return channel;
    } catch {
      // This channel not available, try next
    }
  }

  // Fallback: try default chromium
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return "default";
  } catch {
    // No browser available
  }

  return null;
}

/**
 * Check if we have a saved browser session.
 */
export function hasSavedSession(): boolean {
  return existsSync(getSessionPath());
}

/**
 * Clear the saved browser session (forces re-login on next run).
 */
export function clearSession(): void {
  const sessionPath = getSessionPath();
  if (existsSync(sessionPath)) {
    unlinkSync(sessionPath);
  }
}

/**
 * Opens system browser, waits for user login, captures Bearer token from API requests.
 * Persists cookies so subsequent runs don't require re-login.
 */
export async function captureTokenFromBrowser(
  options: BrowserAuthOptions = {}
): Promise<BrowserAuthResult> {
  const {
    loginUrl = "https://learning.ccbp.in/",
    apiBase = "https://nkb-backend-ccbp-prod-apis.ccbp.in",
    timeout = 300_000, // 5 minutes
    forceLogin = false,
  } = options;

  const sessionPath = getSessionPath();
  let browser = null;
  let capturedToken: string | null = null;

  try {
    // Find available browser
    const channel = await getAvailableBrowserChannel();
    if (!channel) {
      return {
        success: false,
        error: "No browser found. Install Chrome or Edge.",
      };
    }

    const browserName = channel === "default" ? "chromium" : channel;
    console.log(chalk.gray(`  Using ${browserName}...`));

    // Check for saved session
    const hasSession = !forceLogin && hasSavedSession();
    if (hasSession) {
      console.log(chalk.gray("  Restoring saved session..."));
    }

    // Launch browser (use channel only if not default)
    const launchOptions: { headless: boolean; channel?: string; args: string[] } = {
      headless: false,
      args: ["--start-maximized"],
    };
    if (channel !== "default") {
      launchOptions.channel = channel;
    }

    browser = await chromium.launch(launchOptions);

    // Create context with saved state if available
    const context = await browser.newContext({
      viewport: null,
      storageState: hasSession ? sessionPath : undefined,
    });

    const page = await context.newPage();

    // Intercept requests to capture token
    page.on("request", (request) => {
      if (capturedToken) return;

      const url = request.url();
      if (!url.startsWith(apiBase)) return;

      const authHeader = request.headers()["authorization"];
      if (authHeader?.startsWith("Bearer ")) {
        capturedToken = authHeader.replace("Bearer ", "").trim();
      }
    });

    // Navigate to login page (or dashboard if already logged in)
    await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

    // Poll for token capture
    const startTime = Date.now();
    while (!capturedToken && Date.now() - startTime < timeout) {
      if (!browser.isConnected()) {
        return {
          success: false,
          error: "Browser was closed before login completed",
        };
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!capturedToken) {
      return { success: false, error: "Timeout waiting for login (5 minutes)" };
    }

    // Save browser state for future runs
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
