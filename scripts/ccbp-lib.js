import axios from "axios";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const API_BASE = "https://nkb-backend-ccbp-prod-apis.ccbp.in";
const WORK_DIR = "/tmp/ccbp-work";

export { API_BASE, WORK_DIR };

export function ensureWorkDir() {
  mkdirSync(WORK_DIR, { recursive: true });
}

export function buildPayload(inner) {
  return { data: JSON.stringify(JSON.stringify(inner)), clientKeyDetailsId: 1 };
}

export function createClient(token) {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: "https://learning.ccbp.in",
      referer: "https://learning.ccbp.in/",
      "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      "x-app-version": "1128",
      "x-browser-session-id": crypto.randomUUID(),
    },
  });
}

export function saveJson(filename, data) {
  const path = join(WORK_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`  Saved ${path}`);
  return path;
}

export function loadJson(filename) {
  const path = join(WORK_DIR, filename);
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function stripHtml(text) {
  return (text || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
}
