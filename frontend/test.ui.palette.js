import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=== UI Design & Theme Palette Verification Suite ===");
console.log("Target Palette: Creamish/white background (#faf8f5 / #ffffff), Normal Blue buttons (#2563eb), Standard typography");

const cssPath = path.join(__dirname, "src", "index.css");
assert.ok(fs.existsSync(cssPath), "index.css must exist");

const cssContent = fs.readFileSync(cssPath, "utf-8");

// 1. Verify Primary Normal Blue color variable
assert.match(
    cssContent,
    /--primary:\s*#2563eb/i,
    "Primary button color variable --primary must be normal blue (#2563eb)"
);
console.log("✓ Primary normal blue button color token verified: --primary: #2563eb");

// 2. Verify Creamish Page Background variable
assert.match(
    cssContent,
    /--bg-page:\s*#faf8f5/i,
    "Page background variable --bg-page must be creamish (#faf8f5)"
);
console.log("✓ Creamish page background token verified: --bg-page: #faf8f5");

// 3. Verify Clean White Surface variable
assert.match(
    cssContent,
    /--bg-surface:\s*#ffffff/i,
    "Surface background variable --bg-surface must be clean white (#ffffff)"
);
console.log("✓ Clean white surface token verified: --bg-surface: #ffffff");

// 4. Verify Standard Typography font-family
assert.match(
    cssContent,
    /--font-family:\s*Inter,/i,
    "Standard typography --font-family must begin with Inter or standard sans-serif system stack"
);
console.log("✓ Standard typography stack verified: Inter, -apple-system, sans-serif");

// 5. Verify Button primary class styling
assert.match(
    cssContent,
    /\.button--primary\s*\{[^}]*background-color:\s*var\(--primary\)/s,
    ".button--primary must use var(--primary) normal blue background"
);
console.log("✓ .button--primary class connects directly to normal blue --primary token");

console.log("ALL UI theme palette assertions passed successfully!");
process.exit(0);
