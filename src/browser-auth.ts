/**
 * Browser-based automatic auth token capture.
 * Uses Chrome (preferred) or Edge — no browser download required.
 * Persists browser session (cookies) so you only login once.
 */

import chalk from "chalk";
import { existsSync, unlinkSync } from "fs";
import { chromium, type Browser, type BrowserContext } from "playwright";
import { join } from "path";
import { getSessionPath, getGroqSessionPath } from "./config.js";

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
 * Get Chrome user data directory for persistent context.
 * This allows using the user's existing Chrome sessions.
 */
function getChromeUserDataDir(): string | null {
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const chromeDir = join(localAppData, "Google", "Chrome", "User Data");
      if (existsSync(chromeDir)) {
        return chromeDir;
      }
    }
  } else if (process.platform === "darwin") {
    const home = process.env.HOME;
    if (home) {
      const chromeDir = join(home, "Library", "Application Support", "Google", "Chrome");
      if (existsSync(chromeDir)) {
        return chromeDir;
      }
    }
  } else {
    // Linux
    const home = process.env.HOME;
    if (home) {
      const chromeDir = join(home, ".config", "google-chrome");
      if (existsSync(chromeDir)) {
        return chromeDir;
      }
    }
  }
  return null;
}

/**
 * Find the best available browser.
 * Priority: chrome → msedge → default chromium
 */
async function getAvailableBrowserChannel(): Promise<string | null> {
  // Try Chrome FIRST (user preference), then Edge
  const channels = ["chrome", "msedge"];

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

/**
 * Opens Groq console in Chrome with user's profile (for existing Google login).
 * Watches for API key in page content.
 */
export async function captureGroqKeyFromBrowser(): Promise<BrowserAuthResult> {
  const sessionPath = getGroqSessionPath();
  let context: BrowserContext | null = null;
  let browser: Browser | null = null;
  let capturedKey: string | null = null;

  try {
    // Try to use Chrome with user's actual profile (for existing Google sessions)
    const chromeUserData = getChromeUserDataDir();
    const channel = await getAvailableBrowserChannel();

    if (!channel) {
      return {
        success: false,
        error: "No browser found. Install Chrome or Edge.",
      };
    }

    const browserName = channel === "default" ? "chromium" : channel;
    console.log(chalk.gray(`  Using ${browserName}...`));

    // If Chrome is available and we have user data, try persistent context
    if (channel === "chrome" && chromeUserData) {
      console.log(chalk.gray("  Using your Chrome profile (existing logins)..."));

      try {
        // Launch with user's Chrome profile for existing sessions
        context = await chromium.launchPersistentContext(chromeUserData, {
          headless: false,
          channel: "chrome",
          args: ["--start-maximized", "--profile-directory=Default"],
        });
      } catch (err) {
        // Profile might be locked (Chrome already running), fall back to regular launch
        console.log(chalk.gray("  Chrome profile busy, using separate session..."));
        context = null;
      }
    }

    // Fall back to regular browser if persistent context failed
    if (!context) {
      const hasSession = existsSync(sessionPath);
      if (hasSession) {
        console.log(chalk.gray("  Restoring Groq session..."));
      }

      const launchOptions: { headless: boolean; channel?: string; args: string[] } = {
        headless: false,
        args: ["--start-maximized"],
      };
      if (channel !== "default") {
        launchOptions.channel = channel;
      }

      browser = await chromium.launch(launchOptions);
      context = await browser.newContext({
        viewport: null,
        storageState: hasSession ? sessionPath : undefined,
      });
    }

    const page = context.pages()[0] || await context.newPage();

    // Navigate to Groq API keys page
    await page.goto("https://console.groq.com/keys", { waitUntil: "domcontentloaded" });

    console.log(chalk.gray("  Waiting for API key..."));
    console.log(chalk.gray("  (Create a new key or copy an existing one)\n"));

    // Poll for API key - check page content for gsk_ pattern
    const startTime = Date.now();
    const timeout = 300_000; // 5 minutes

    while (!capturedKey && Date.now() - startTime < timeout) {
      if (!context.browser()?.isConnected()) {
        return {
          success: false,
          error: "Browser was closed before getting API key",
        };
      }

      // Check for API key in page content (newly created keys are shown in modals/dialogs)
      try {
        // Look for gsk_ pattern in any visible text on the page
        const pageContent = await page.evaluate(() => {
          type EvalElement = { textContent?: string | null; value?: string };
          type EvalDocument = {
            querySelectorAll: (selectors: string) => ArrayLike<EvalElement>;
          };

          const doc = (globalThis as { document?: EvalDocument }).document;
          if (!doc) return null;

          // Check all input fields, code elements, and text content
          const inputs = Array.from(doc.querySelectorAll('input, code, pre, [class*="key"], [class*="token"]'));
          for (const el of inputs) {
            const text = el.value || el.textContent || "";
            const match = text.match(/gsk_[a-zA-Z0-9]{20,}/);
            if (match) return match[0];
          }
          return null;
        });

        if (pageContent && pageContent.startsWith("gsk_")) {
          capturedKey = pageContent;
          break;
        }

        // Also watch for the key in modals
        const responses = await page.evaluate(() => {
          type EvalElement = { textContent?: string | null };
          type EvalDocument = {
            querySelector: (selectors: string) => EvalElement | null;
          };

          const doc = (globalThis as { document?: EvalDocument }).document;
          if (!doc) return null;

          const modal = doc.querySelector('[role="dialog"], [class*="modal"], [class*="Modal"]');
          if (modal) {
            const text = modal.textContent || "";
            const match = text.match(/gsk_[a-zA-Z0-9]{20,}/);
            if (match) return match[0];
          }
          return null;
        });

        if (responses && responses.startsWith("gsk_")) {
          capturedKey = responses;
          break;
        }
      } catch {
        // Page might be navigating, ignore errors
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    if (!capturedKey) {
      return { success: false, error: "Timeout waiting for API key (5 minutes)" };
    }

    // Save session for future (only for non-persistent contexts)
    try {
      await context.storageState({ path: sessionPath });
      console.log(chalk.gray("  Groq session saved."));
    } catch {
      // Persistent context doesn't need saving
    }

    return { success: true, token: capturedKey };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  } finally {
    if (context) {
      try {
        await context.close();
      } catch {
        // Ignore close errors
      }
    }

    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}
