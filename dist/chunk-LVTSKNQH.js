#!/usr/bin/env node

// src/config.ts
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
function getCacheDir() {
  if (process.platform === "win32") {
    return join(process.env.LOCALAPPDATA || process.env.APPDATA || ".", "niatbuttcracker");
  }
  return join(process.env.HOME || ".", ".cache", "niatbuttcracker");
}
var CACHE_DIR = getCacheDir();
var CONFIG_PATH = join(CACHE_DIR, "config.json");
var SESSION_PATH = join(CACHE_DIR, "ccbp-session.json");
async function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true });
  }
}
async function loadConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function saveConfig(cfg) {
  await ensureCacheDir();
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}
function getConfigPath() {
  return CONFIG_PATH;
}
function getSessionPath() {
  return SESSION_PATH;
}
function getCacheDirectory() {
  return CACHE_DIR;
}

export {
  loadConfig,
  saveConfig,
  getConfigPath,
  getSessionPath,
  getCacheDirectory
};
