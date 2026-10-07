import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const forbiddenExtensions = new Set([
  ".csv", ".tsv", ".xlsx", ".xls", ".ods",
  ".docx", ".doc", ".odt", ".rtf", ".pdf",
]);

const ignoredDirs = new Set([
  ".git", "node_modules", "dist", "coverage", ".vite",
]);

const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (forbiddenExtensions.has(ext)) {
      violations.push(path.relative(root, full));
    }
  }
}

walk(root);

if (violations.length) {
  console.error("PRIVACY CHECK FAILED");
  console.error("Raw office/export documents must not be committed to this repository:");
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log("Privacy check passed: no forbidden raw document/export files found.");
