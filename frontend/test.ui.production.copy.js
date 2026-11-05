import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=== Production Copy & Real System UI Verification Suite ===");

const scanDirs = [
    path.join(__dirname, "src", "pages"),
    path.join(__dirname, "src", "components"),
];

function getSourceFiles(dirs) {
    let files = [];
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files = files.concat(getSourceFiles([fullPath]));
            } else if (entry.isFile() && (entry.name.endsWith(".jsx") || entry.name.endsWith(".js"))) {
                files.push(fullPath);
            }
        }
    }
    return files;
}

const files = getSourceFiles(scanDirs);
console.log(`Inspecting ${files.length} UI page and component files for dummy texts and raw requirement codes...`);

// Disallowed patterns in user-facing JSX templates:
// 1. Spatial/GIS dummy text: "spatial dataset", "spatial layers", "spatial management"
// 2. Raw requirement code pills in visible JSX text: /\((SCR-\d+|BR-\d+|FR-[A-Z]+-\d+)\)/
const SPATIAL_DUMMY_REGEX = /spatial\s+(dataset|layer|management)/i;
const RAW_REQUIREMENT_CODE_REGEX = />[^<]*\((SCR-\d+|BR-\d+|FR-[A-Z]+-\d+)\)[^<]*</;

let violations = [];

for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
        // Skip comment lines
        const trimmed = line.trim();
        if (trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*")) {
            return;
        }

        if (SPATIAL_DUMMY_REGEX.test(line)) {
            violations.push({
                file: path.relative(path.join(__dirname, ".."), filePath),
                line: idx + 1,
                reason: "Spatial/GIS dummy text detected in clinical UI",
                snippet: trimmed,
            });
        }

        if (RAW_REQUIREMENT_CODE_REGEX.test(line)) {
            violations.push({
                file: path.relative(path.join(__dirname, ".."), filePath),
                line: idx + 1,
                reason: "Raw requirement code pill in user-facing JSX",
                snippet: trimmed,
            });
        }
    });
}

if (violations.length > 0) {
    console.error(`FAILED: Found ${violations.length} production copy violations:`);
    for (const v of violations) {
        console.error(`  - ${v.file}:${v.line} [${v.reason}] -> "${v.snippet}"`);
    }
    process.exit(1);
} else {
    console.log(`✓ SUCCESS: 0 dummy texts or raw requirement codes found across all ${files.length} UI templates!`);
    console.log("All UI screens reflect clean, real dental clinical practice copy.");
    process.exit(0);
}
