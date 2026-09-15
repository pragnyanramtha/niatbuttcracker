/**
 * Browser-based automatic auth token capture.
 * Uses Chrome (preferred), Edge, or system Chromium — no browser download required.
 * Persists browser session (cookies) so you only login once.
 */

import chalk from "chalk";
import { execSync } from "child_process";
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
 * Priority: chrome → msedge → system chromium/chrome/edge executable → bundled chromium.
 */
async function getAvailableBrowserChannel(): Promise<{ channel?: string; executablePath?: string } | null> {
  // Try Playwright channels FIRST (Chrome, then Edge)
  const channels = ["chrome", "msedge"];

  for (const channel of channels) {
    try {
      const browser = await chromium.launch({
        headless: true,
        channel,
      });
      await browser.close();
      return { channel };
    } catch {
      // This channel not available, try next
    }
  }

  // Next, probe system-installed chromium/chrome/edge executables (e.g. apt/snap chromium on Linux)
  const systemNames = [
    "chromium",
    "chromium-browser",
    "google-chrome",
    "google-chrome-stable",
    "microsoft-edge",
    "microsoft-edge-stable",
    "brave-browser",
  ];

  for (const name of systemNames) {
    const executablePath = resolveExecutable(name);
    if (!executablePath) continue;

    try {
      const browser = await chromium.launch({
        headless: true,
        executablePath,
      });
      await browser.close();
      return { executablePath };
    } catch {
      // Found binary but Playwright couldn't launch it, try next
    }
  }

  // Fallback: try Playwright-bundled chromium (needs: npx playwright install chromium)
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return { channel: "default" };
  } catch {
    // No browser available
  }

  return null;
}

/**
 * Resolve a browser executable name to a full path via PATH lookup.
 */
function resolveExecutable(name: string): string | null {
  const cmd = process.platform === "win32" ? `where ${name}` : `command -v ${name}`;
  try {
    const out = execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return out.split("\n")[0] || null;
  } catch {
    return null;
  }
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
    const found = await getAvailableBrowserChannel();
    if (!found) {
      return {
        success: false,
        error: "No browser found. Install Chrome, Edge, or Chromium.",
      };
    }

    const { channel, executablePath } = found;
    const browserName = channel === "default" ? "chromium" : executablePath ? executablePath.split("/").pop() : channel;
    console.log(chalk.gray(`  Using ${browserName}...`));

    // Check for saved session
    const hasSession = !forceLogin && hasSavedSession();
    if (hasSession) {
      console.log(chalk.gray("  Restoring saved session..."));
    }

    // Launch browser (channel only when a Playwright channel was found)
    const launchOptions: { headless: boolean; channel?: string; executablePath?: string; args: string[] } = {
      headless: false,
      args: ["--start-maximized"],
    };
    if (channel && channel !== "default") {
      launchOptions.channel = channel;
    }
    if (executablePath) {
      launchOptions.executablePath = executablePath;
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
