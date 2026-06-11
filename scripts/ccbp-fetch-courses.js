import { createClient, buildPayload, saveJson, ensureWorkDir } from "./ccbp-lib.js";

const TOKEN = process.env.CCBP_TOKEN;
if (!TOKEN) { console.error("CCBP_TOKEN env var required"); process.exit(1); }

const client = createClient(TOKEN);
ensureWorkDir();

// Load curriculum to get course IDs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const curriculumPath = join(__dirname, "..", "curriculum.json");
const curriculum = JSON.parse(readFileSync(curriculumPath, "utf-8"));

// Get semester selection
const semesterName = process.env.CCBP_SEMESTER || "Semester 2";

let selectedSem = null;
let selectedYear = null;
for (const year of curriculum.curriculum_details) {
  for (const sem of year.semester_details) {
    if (sem.semester_name.toLowerCase() === semesterName.toLowerCase()) {
      selectedSem = sem;
      selectedYear = year;
      break;
    }
  }
  if (selectedSem) break;
}

if (!selectedSem) {
  console.error(`Semester "${semesterName}" not found in curriculum`);
  process.exit(1);
}

console.log(`\nFetching: ${selectedYear.year} › ${selectedSem.semester_name}\n`);

// Build master course list
const courses = [];
for (const subject of selectedSem.semester_subjects) {
  for (const course of subject.semester_courses) {
    courses.push({
      course_id: course.course_id,
      course_title: course.course_title,
      subject_title: subject.subject_title,
      subject_code: subject.subject_code,
      no_of_topics: course.no_of_topics,
    });
  }
}

saveJson("courses.json", courses);
console.log(`  Found ${courses.length} course(s)\n`);

// Fetch course details from CCBP API
const results = [];
for (const c of courses) {
  process.stdout.write(`  Fetching: ${c.course_title}...`);
  try {
    const { data } = await client.post(
      "/api/nkb_resources/user/course_details/v4/",
      buildPayload({
        course_id: c.course_id,
        is_session_plan_details_required: true,
        is_certification_details_required: false,
      })
    );
    results.push(data);
    console.log(` ${data.topics.length} topics, ${data.completion_percentage.toFixed(1)}% done`);
  } catch (err) {
    const status = err.response?.status || err.message;
    console.log(` FAILED (${status})`);
  }
}

saveJson("course-details.json", results);

// Fetch units for each topic in each course
const allUnits = [];
for (const courseDetail of results) {
  const courseEntry = { course_id: courseDetail.course_id, course_title: courseDetail.course_title, topics: [] };
  for (const topic of courseDetail.topics) {
    process.stdout.write(`  Units: ${topic.topic_name}...`);
    try {
      const { data } = await client.post(
        "/api/nkb_resources/user/topic/units_details/v3/",
        buildPayload({ topic_id: topic.topic_id, course_id: courseDetail.course_id })
      );
      courseEntry.topics.push({ topic, units: data.units_details });
      console.log(` ${data.units_details.length} units`);
    } catch (err) {
      const status = err.response?.status || err.message;
      console.log(` FAILED (${status})`);
      courseEntry.topics.push({ topic, units: [] });
    }
  }
  allUnits.push(courseEntry);
}

saveJson("topic-units.json", allUnits);

// Print summary by unit type
let learningSets = 0;
let practiceSets = 0;
let questionSets = 0;
let quizzes = 0;
for (const course of allUnits) {
  for (const t of course.topics) {
    for (const u of t.units) {
      if (u.unit_type === "LEARNING_SET") learningSets++;
      else if (u.unit_type === "PRACTICE") practiceSets++;
      else if (u.unit_type === "QUESTION_SET") questionSets++;
      else if (u.unit_type === "QUIZ") quizzes++;
    }
  }
}

console.log(`\n  Summary: ${learningSets} learning sets, ${practiceSets} practice exams, ${questionSets} question sets, ${quizzes} quizzes`);
console.log(`  Data saved to /tmp/ccbp-work/\n`);
