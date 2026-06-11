import { createClient, buildPayload, saveJson, loadJson } from "./ccbp-lib.js";
import axios from "axios";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TOKEN = process.env.CCBP_TOKEN;
if (!TOKEN) { console.error("CCBP_TOKEN env var required"); process.exit(1); }

const client = createClient(TOKEN);
const allUnits = loadJson("topic-units.json");

const sqlSets = [];

for (const course of allUnits) {
  for (const t of course.topics) {
    for (const unit of t.units) {
      if (unit.unit_type !== "QUESTION_SET") continue;
      if (unit.completion_percentage >= 100) continue;
      if (unit.is_unit_locked) continue;

      const name = unit.question_set_unit_details?.name || unit.learning_resource_set_unit_details?.name || unit.unit_id;
      process.stdout.write(`\n  SQL probe: ${name}...`);

      try {
        const { data } = await client.post(
          "/api/nkb_coding_practice/questions/sql/v1/?offset=0&length=999",
          buildPayload({ question_set_id: unit.unit_id })
        );

        if (!data.questions || data.questions.length === 0) {
          console.log(" not SQL");
          continue;
        }

        console.log(` ${data.questions.length} SQL questions`);

        // Filter unanswered
        const unanswered = data.questions.filter(
          q => q.question_status !== "CORRECT" && q.question_status !== "COMPLETED"
        );
        console.log(`    ${unanswered.length} unanswered`);

        // Save DB schema context
        const dbContext = data.learning_resource_details?.content || "";

        // Download DB if available
        let dbSchema = "(not available)";
        if (data.db_url) {
          process.stdout.write(`    Downloading DB...`);
          try {
            const dbRes = await axios.get(data.db_url, { responseType: "arraybuffer", timeout: 10000 });
            const dbPath = join("/tmp/ccbp-work", `db-${unit.unit_id.slice(0, 8)}.sqlite`);
            writeFileSync(dbPath, Buffer.from(dbRes.data));
            console.log(` saved ${dbPath}`);

            // Try to introspect schema
            try {
              const initSqlJs = (await import("sql.js")).default;
              const SQL = await initSqlJs();
              const db = new SQL.Database(new Uint8Array(dbRes.data));
              const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
                .flatMap(r => r.values.map(v => String(v[0])));
              const schemaParts = [];
              for (const table of tables) {
                const cols = db.exec(`PRAGMA table_info(${table})`)
                  .flatMap(r => r.values.map(v => `${v[1]} ${v[2]}`));
                schemaParts.push(`TABLE ${table} (${cols.join(", ")})`);
              }
              db.close();
              dbSchema = schemaParts.join("\n");
              console.log(`    Schema: ${tables.length} tables`);
            } catch (e) {
              console.log(`    Schema introspection failed: ${e.message}`);
            }
          } catch (e) {
            console.log(` download failed: ${e.message}`);
          }
        }

        const entry = {
          course_title: course.course_title,
          topic_name: t.topic?.topic_name,
          unit_name: name,
          unit_id: unit.unit_id,
          db_context: dbContext,
          db_schema: dbSchema,
          questions: unanswered.map(q => ({
            question_id: q.question_id,
            question_number: q.question_number,
            content: q.question.content,
            short_text: q.question.short_text,
            starter_code: q.default_code?.code_content || "",
            question_status: q.question_status,
          })),
        };
        sqlSets.push(entry);

      } catch (err) {
        // Not a SQL set - that's fine
        console.log(" not SQL");
      }
    }
  }
}

saveJson("sql-questions.json", sqlSets);
console.log(`\n  Saved ${sqlSets.length} SQL set(s) to /tmp/ccbp-work/sql-questions.json\n`);
