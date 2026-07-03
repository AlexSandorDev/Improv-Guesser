import { readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseSituationsMarkdown } from "../../src/domain/situationsMarkdown.js";
import { extractPreamble, serializeSituationsMarkdown } from "../../src/domain/situationsFile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../..");

const markdownPath = resolve(projectRoot, "src/domain/situations.md");
const generatedPath = resolve(projectRoot, "src/domain/situations.generated.js");
const indexHtmlPath = resolve(__dirname, "index.html");

const PORT = 5544;

function readRequestBody(req) {
  return new Promise((resolvePromise, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolvePromise(data));
    req.on("error", reject);
  });
}

function syncGenerated(situations) {
  const generated = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Edit src/domain/situations.md and run: npm run sync:situations

export const SITUATIONS = ${JSON.stringify(situations, null, 2)};
`;
  writeFileSync(generatedPath, generated, "utf8");
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function handleGetSituations(res) {
  const markdown = readFileSync(markdownPath, "utf8");
  const situations = parseSituationsMarkdown(markdown);
  sendJson(res, 200, { situations });
}

async function handleSaveSituations(req, res) {
  const body = await readRequestBody(req);

  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    sendJson(res, 400, { error: "Request body must be valid JSON." });
    return;
  }

  if (!Array.isArray(parsedBody.situations)) {
    sendJson(res, 400, { error: '"situations" must be an array.' });
    return;
  }

  const currentMarkdown = readFileSync(markdownPath, "utf8");
  const preamble = extractPreamble(currentMarkdown);
  const candidateMarkdown = serializeSituationsMarkdown(preamble, parsedBody.situations);

  let normalizedSituations;
  try {
    normalizedSituations = parseSituationsMarkdown(candidateMarkdown);
  } catch (validationError) {
    sendJson(res, 400, { error: validationError.message });
    return;
  }

  writeFileSync(markdownPath, candidateMarkdown, "utf8");
  syncGenerated(normalizedSituations);

  sendJson(res, 200, { situations: normalizedSituations });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      const html = readFileSync(indexHtmlPath, "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    if (req.method === "GET" && req.url === "/api/situations") {
      await handleGetSituations(res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/situations") {
      await handleSaveSituations(req, res);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Scenario editor running at http://localhost:${PORT}`);
});
