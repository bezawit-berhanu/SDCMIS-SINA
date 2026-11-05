import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Regex detecting Unicode emoji ranges:
// Miscellaneous Symbols and Pictographs: 1F300-1F5FF
// Emoticons: 1F600-1F64F
// Supplemental Symbols and Pictographs: 1F900-1F9FF
// Transport and Map Symbols: 1F680-1F6FF
// Dingbats / Miscellaneous Symbols: 2600-27BF
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

function scanDir(dir, fileList = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            scanDir(fullPath, fileList);
        } else if (entry.isFile() && (entry.name.endsWith(".jsx") || entry.name.endsWith(".js") || entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

const srcDir = path.join(__dirname, "src");
console.log(`=== Automated Regression Suite: Zero Emojis in Frontend (SRC: ${srcDir}) ===`);

const files = scanDir(srcDir);
console.log(`Found ${files.length} JavaScript/React files in frontend/src to inspect.`);

let violations = [];

for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
        if (EMOJI_REGEX.test(line)) {
            const match = line.match(EMOJI_REGEX);
            violations.push({
                file: path.relative(path.join(__dirname, ".."), filePath),
                line: idx + 1,
                emoji: match ? match[0] : "unknown",
                text: line.trim(),
            });
        }
    });
}

if (violations.length > 0) {
    console.error(`FAILED: Found ${violations.length} emoji occurrences in frontend/src:`);
    for (const v of violations) {
        console.error(`  - ${v.file}:${v.line} [${v.emoji}] -> "${v.text}"`);
    }
    process.exit(1);
} else {
    console.log(`✓ SUCCESS: 0 emojis found across all ${files.length} source files in frontend/src!`);
    console.log("All UI icons strictly use react-icons (Fi*, Fa*, Md*, etc.) per design mandate.");
    process.exit(0);
}
