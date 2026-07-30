import { chromium } from "playwright";
import axios from "axios";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = "https://nkb-backend-ccbp-prod-apis.ccbp.in";
const CURRICULUM_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "curriculum.json");
const SESSION_PATH = join(
  process.env.LOCALAPPDATA || ".",
  "niatbuttcracker",
  "ccbp-session.json"
);

function buildPayload(inner) {
  return { data: JSON.stringify(JSON.stringify(inner)), clientKeyDetailsId: 1 };
}

function createClient(token) {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: "https://learning.ccbp.in",
      referer: "https://learning.ccbp.in/",
      "x-app-version": "1128",
      "x-browser-session-id": crypto.randomUUID(),
    },
  });
}

async function captureToken() {
  const channels = ["chrome", "msedge"];
  let browser;
  for (const channel of channels) {
    try {
      browser = await chromium.launch({ headless: false, channel, args: ["--start-maximized"] });
      break;
    } catch {}
  }
  if (!browser) {
    browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
  }

  const contextOpts = {};
  if (existsSync(SESSION_PATH)) {
    console.log("Restoring saved session...");
    contextOpts.storageState = SESSION_PATH;
  }

  const context = await browser.newContext({ viewport: null, ...contextOpts });
  const page = await context.newPage();
  let capturedToken = null;

  page.on("request", (req) => {
    if (capturedToken) return;
    const url = req.url();
    if (!url.startsWith(API_BASE)) return;
    const auth = req.headers()["authorization"];
    if (auth?.startsWith("Bearer ")) {
      capturedToken = auth.replace("Bearer ", "").trim();
    }
  });

  console.log("Opening https://learning.ccbp.in/ — please log in if prompted...");
  await page.goto("https://learning.ccbp.in/", { waitUntil: "domcontentloaded" });

  const start = Date.now();
  const timeout = 300_000;
  while (!capturedToken && Date.now() - start < timeout) {
    if (!browser.isConnected()) {
      console.error("Browser closed before login.");
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!capturedToken) {
    console.error("Timed out waiting for login.");
    process.exit(1);
  }

  await context.storageState({ path: SESSION_PATH });
  console.log("Token captured and session saved.\n");
  await browser.close();
  return capturedToken;
}

async function fetchCourseDetails(client, courseId) {
  try {
    const { data } = await client.post(
      "/api/nkb_resources/user/course_details/v4/",
      buildPayload({
        course_id: courseId,
        is_session_plan_details_required: false,
        is_certification_details_required: false,
      })
    );
    return data;
  } catch {
    return null;
  }
}

async function main() {
  const curriculum = JSON.parse(readFileSync(CURRICULUM_PATH, "utf-8"));
  const token = await captureToken();
  const client = createClient(token);

  let changed = false;

  for (const year of curriculum.curriculum_details) {
    for (const sem of year.semester_details) {
      for (const subject of sem.semester_subjects) {
        for (const course of subject.semester_courses) {
          const oldId = course.course_id;
          console.log(`Checking: ${subject.subject_title} / ${course.course_title} (${oldId})...`);
          const details = await fetchCourseDetails(client, oldId);
          if (details && details.course_id && details.course_id !== oldId) {
            console.log(`  → ID changed: ${oldId} → ${details.course_id}`);
            course.course_id = details.course_id;
            changed = true;
          } else if (details) {
            console.log(`  → ID verified OK`);
          } else {
            console.log(`  → Could not fetch (ID may be invalid)`);
          }
        }
      }
    }
  }

  if (changed) {
    writeFileSync(CURRICULUM_PATH, JSON.stringify(curriculum, null, 4) + "\n", "utf-8");
    console.log("\nCurriculum updated with corrected IDs.");
  } else {
    console.log("\nAll IDs already match CCBP.");
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
