import { createClient, buildPayload, loadJson } from "./ccbp-lib.js";

const TOKEN = process.env.CCBP_TOKEN;
if (!TOKEN) { console.error("CCBP_TOKEN env var required"); process.exit(1); }

const client = createClient(TOKEN);
const allUnits = loadJson("topic-units.json");

let completed = 0;
let skipped = 0;
let failed = 0;

for (const course of allUnits) {
  for (const t of course.topics) {
    for (const unit of t.units) {
      if (unit.unit_type !== "LEARNING_SET") continue;
      if (unit.completion_status === "COMPLETED") {
        skipped++;
        continue;
      }
      const name = unit.learning_resource_set_unit_details?.name || unit.unit_id;
      process.stdout.write(`  ${name}...`);
      try {
        await client.post(
          "/api/nkb_learning_resource/learning_resources/set/complete/",
          buildPayload({ learning_resource_set_id: unit.unit_id })
        );
        console.log(" COMPLETE");
        completed++;
      } catch (err) {
        const status = err.response?.status || err.message;
        console.log(` FAILED (${status})`);
        failed++;
      }
    }
  }
}

console.log(`\n  Done: ${completed} completed, ${skipped} already done, ${failed} failed\n`);
