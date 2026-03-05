import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSituationsMarkdown } from "../src/domain/situationsMarkdown.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const markdownPath = resolve(projectRoot, "src/domain/situations.md");
const generatedPath = resolve(projectRoot, "src/domain/situations.generated.js");

const markdown = readFileSync(markdownPath, "utf8");
const situations = parseSituationsMarkdown(markdown);

const generated = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Edit src/domain/situations.md and run: npm run sync:situations

export const SITUATIONS = ${JSON.stringify(situations, null, 2)};
`;

writeFileSync(generatedPath, generated, "utf8");
console.log(`Synced ${situations.length} situations from markdown.`);
