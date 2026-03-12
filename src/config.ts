import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CONFIG_PATH = join(process.env.APPDATA || process.env.HOME || ".", ".niat-auto-config.json");

export interface UserConfig {
  groqKey?: string;
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
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
