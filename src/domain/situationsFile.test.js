import assert from "node:assert/strict";
import test from "node:test";

import { extractPreamble, serializeSituationsMarkdown, slugify } from "./situationsFile.js";
import { parseSituationsMarkdown } from "./situationsMarkdown.js";

test("slugify lowercases, trims, and hyphenates non-alphanumeric runs", () => {
  assert.equal(slugify("Animal Shelter"), "animal-shelter");
  assert.equal(slugify("  Multiple   Spaces  "), "multiple-spaces");
  assert.equal(slugify("Vet Clinic!"), "vet-clinic");
});

test("extractPreamble returns text before the first heading", () => {
  const markdown = "# Situations\n\nSome rules.\n\n## Animal Shelter\n\n```json\n{}\n```\n";
  assert.equal(extractPreamble(markdown), "# Situations\n\nSome rules.\n");
});

test("extractPreamble falls back to the first json fence when there is no heading", () => {
  const markdown = "Some notes.\n\n```json\n{}\n```\n";
  assert.equal(extractPreamble(markdown), "Some notes.\n");
});

test("serializeSituationsMarkdown round-trips through parseSituationsMarkdown", () => {
  const situations = [
    {
      id: "a",
      name: "Scenario A",
      guesserPrompt: "question a",
      solutionPrompt: "answer a",
      roles: [{ name: "Role", mandatory: true, prompt: "prompt" }],
    },
    {
      id: "b",
      name: "Scenario B",
      guesserPrompt: "question b",
      solutionPrompt: "answer b",
      acceptedAnswers: ["alt answer"],
      roles: [{ name: "Role", mandatory: false, prompt: "prompt" }],
    },
  ];

  const markdown = serializeSituationsMarkdown("# Situations\n", situations);
  assert.deepEqual(parseSituationsMarkdown(markdown), situations);
});
