export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractPreamble(markdownText) {
  const headingIndex = markdownText.search(/^##\s/m);
  const fenceIndex = markdownText.indexOf("```json");
  const candidates = [headingIndex, fenceIndex].filter((index) => index !== -1);

  if (candidates.length === 0) {
    return `${markdownText.trimEnd()}\n`;
  }

  const cutIndex = Math.min(...candidates);
  return `${markdownText.slice(0, cutIndex).trimEnd()}\n`;
}

export function serializeSituationsMarkdown(preamble, situations) {
  const blocks = situations
    .map(
      (situation) => `## ${situation.name}\n\n\`\`\`json\n${JSON.stringify(situation, null, 2)}\n\`\`\`\n`
    )
    .join("\n");

  return `${preamble}\n${blocks}`;
}

export function isFileSystemAccessSupported() {
  return typeof window !== "undefined" && typeof window.showOpenFilePicker === "function";
}

export async function openSituationsFile() {
  const [handle] = await window.showOpenFilePicker({
    types: [{ description: "Markdown", accept: { "text/markdown": [".md"] } }],
  });
  const file = await handle.getFile();
  const text = await file.text();
  return { handle, text };
}

export async function writeSituationsFile(handle, text) {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}
