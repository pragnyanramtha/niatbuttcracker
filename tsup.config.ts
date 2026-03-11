import { defineConfig } from "tsup";
import { copyFileSync } from "node:fs";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  onSuccess: async () => {
    // Copy curriculum.json into dist so the built binary can find it
    copyFileSync("curriculum.json", "dist/curriculum.json");
    console.log("Copied curriculum.json → dist/curriculum.json");
  },
});
