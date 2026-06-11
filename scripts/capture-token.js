import { captureTokenFromBrowser } from "../src/browser-auth.js";
import { writeFileSync } from "node:fs";

const result = await captureTokenFromBrowser();

if (result.success && result.token) {
  writeFileSync("/tmp/ccbp-token.txt", result.token);
  console.log(`\nTOKEN=${result.token}\n`);
  console.log("Token saved to /tmp/ccbp-token.txt");
} else {
  console.error(`Failed: ${result.error}`);
  process.exit(1);
}
