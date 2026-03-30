import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

// Use proper cache directory: %LOCALAPPDATA%\niatbuttcracker on Windows, ~/.cache/niatbuttcracker on Unix
function getCacheDir(): string {
  if (process.platform === "win32") {
    return join(process.env.LOCALAPPDATA || process.env.APPDATA || ".", "niatbuttcracker");
  }
  return join(process.env.HOME || ".", ".cache", "niatbuttcracker");
}

const CACHE_DIR = getCacheDir();
const CONFIG_PATH = join(CACHE_DIR, "config.json");
const SESSION_PATH = join(CACHE_DIR, "ccbp-session.json");
const GROQ_SESSION_PATH = join(CACHE_DIR, "groq-session.json");

export interface UserConfig {
  groqKey?: string;
  // Note: token removed - we now use browser session for auth
}

async function ensureCacheDir(): Promise<void> {
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true });
  }
}

export async function loadConfig(): Promise<UserConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveConfig(cfg: UserConfig): Promise<void> {
  await ensureCacheDir();
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function getSessionPath(): string {
  return SESSION_PATH;
}

export function getCacheDirectory(): string {
  return CACHE_DIR;
}
