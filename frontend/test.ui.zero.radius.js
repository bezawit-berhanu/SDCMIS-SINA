import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, "src");

console.log("=== Automated Regression Suite: Zero Border-Radius Across Frontend ===");

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(fullPath));
        } else if (file.endsWith(".jsx") || file.endsWith(".css")) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = getFiles(srcDir);
console.log(`Auditing ${files.length} UI source files in ${srcDir}...`);

let violationCount = 0;
const violations = [];

files.forEach((file) => {
    const relativePath = path.relative(__dirname, file);
    const content = fs.readFileSync(file, "utf8");

    // Look for inline borderRadius with non-zero values (e.g. "4px", "8px", "12px", "50%", "9999px")
    const regex = /borderRadius:\s*["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const val = match[1].trim();
        if (val !== "0" && val !== "0px" && !val.includes("0")) {
            violationCount++;
            violations.push(`${relativePath}: inline borderRadius '${val}'`);
        }
    }
});

if (violations.length > 0) {
    console.error("FAIL: Non-zero border radiuses detected:");
    violations.forEach((v) => console.error(" - " + v));
}

assert.strictEqual(violationCount, 0, `Expected 0 non-zero border-radiuses, found ${violationCount}`);
console.log(`✓ SUCCESS: 0 non-zero border radiuses found across all ${files.length} UI source files!`);
console.log("All UI elements strictly adhere to 0px rectangular geometry.");
