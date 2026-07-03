# Scenario Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hidden `/admin/scenarios` page where new situations can be composed and
saved directly into `situations.md` via the File System Access API, after first trimming the
schema down to the fields that page needs to manage.

**Architecture:** Two parts. Part 1 (Tasks 1–3) removes the unused `clueChecklist` and
`promptOptions` fields from the schema, parser, domain logic, and content file. Part 2
(Tasks 4–9) adds pure browser-safe file-I/O helpers, exports reusable validation from the
existing parser, adds a domain helper for the "supports N–M players" calculation, then builds
the form component, the list/open/save page, and wires the route.

**Tech Stack:** React 18 + Vite, react-router-dom v6, Bootstrap 5 (CSS only), plain
`node --test` for domain-logic tests (no jsdom/RTL — this project has none and this plan
doesn't add one).

## Global Constraints

- No new npm dependencies — the File System Access API is a native browser API.
- Tests run via `node --test <file>` (there is no `npm test` script in this project; don't
  add one).
- No jsdom/React-Testing-Library — React components in this plan are verified manually via
  the dev server (Task 9), matching this project's existing convention.
- Follow existing Bootstrap class conventions exactly: `card`/`card-body`, `btn btn-lg
  btn-primary`/`btn-outline-secondary`/`btn-outline-danger`, `form-control
  form-control-lg`/`form-control` (no `-lg` on smaller/secondary fields), `alert
  alert-danger`/`alert-warning`, `list-group`/`list-group-item`, `d-grid gap-3`,
  `d-flex align-items-center justify-content-between`.
- `/admin/scenarios` must not be linked from the game's header/nav or any player-facing page.
- The File System Access API is Chromium-only (Chrome/Edge) — detect support and show a
  clear `alert-warning` rather than letting an unsupported browser throw at runtime.
- Every task ends with running the full current domain test suite (`node --test
  src/domain/*.test.js` once Task 5 adds a third test file; `node --test
  src/domain/situationModel.test.js src/domain/answerMatch.test.js` before that) to catch
  regressions.

---

### Task 1: Remove `clueChecklist`/`promptOptions` from the parser and validator

**Files:**
- Modify: `src/domain/situationsMarkdown.js`
- Modify: `src/domain/situationModel.test.js`

**Interfaces:**
- Produces: `parseSituationsMarkdown(markdown)` (unchanged signature) now accepts situations
  without `clueChecklist`, and no longer recognizes `promptOptions` on the input or output.

- [ ] **Step 1: Remove the two field checks from `validateSituation`**

In `src/domain/situationsMarkdown.js`, remove these two lines from `validateSituation` (they
currently sit right after the `solutionPrompt` check):

```js
  assertStringArray(situation.clueChecklist, "clueChecklist", context);
```

and, near the bottom of the function:

```js
  validatePromptOptions(situation.promptOptions, context);
```

- [ ] **Step 2: Delete the now-unused `validatePromptOptions` function**

Remove this whole function from `src/domain/situationsMarkdown.js`:

```js
function validatePromptOptions(promptOptions, context) {
  if (promptOptions == null) {
    return;
  }

  if (typeof promptOptions !== "object" || Array.isArray(promptOptions)) {
    throw new Error(`${context}: "promptOptions" must be an object when provided.`);
  }

  Object.entries(promptOptions).forEach(([key, choices]) => {
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new Error(`${context}: prompt option "${key}" must be a non-empty string array.`);
    }

    if (choices.some((choice) => typeof choice !== "string" || !choice.trim())) {
      throw new Error(`${context}: prompt option "${key}" contains an invalid value.`);
    }
  });
}
```

- [ ] **Step 3: Remove `clueChecklist`/`promptOptions` from `normalizeSituation`**

Change:

```js
function normalizeSituation(situation) {
  const normalized = {
    id: situation.id,
    name: situation.name,
    guesserPrompt: situation.guesserPrompt,
    solutionPrompt: situation.solutionPrompt,
    clueChecklist: [...situation.clueChecklist],
    roles: situation.roles.map((role) => normalizeRole(role)),
  };

  if (situation.promptOptions != null) {
    normalized.promptOptions = Object.fromEntries(
      Object.entries(situation.promptOptions).map(([key, values]) => [key, [...values]])
    );
  }

  if (situation.acceptedAnswers != null) {
    normalized.acceptedAnswers = [...situation.acceptedAnswers];
  }

  return normalized;
}
```

to:

```js
function normalizeSituation(situation) {
  const normalized = {
    id: situation.id,
    name: situation.name,
    guesserPrompt: situation.guesserPrompt,
    solutionPrompt: situation.solutionPrompt,
    roles: situation.roles.map((role) => normalizeRole(role)),
  };

  if (situation.acceptedAnswers != null) {
    normalized.acceptedAnswers = [...situation.acceptedAnswers];
  }

  return normalized;
}
```

- [ ] **Step 4: Strip `clueChecklist` from every test fixture**

In `src/domain/situationModel.test.js`, remove the `clueChecklist: ["clue one"],` line from
each of these four object literals: `threeMandatoryTwoOptional` (~line 25),
`fourMandatoryRoles` (~line 39), `tokenTemplateSituation` (~line 53), and
`situationWithAcceptedAnswers` (~line 173). Also remove the
`'  "clueChecklist": ["clue one"],'` line from the three inline markdown strings in the
`parseSituationsMarkdown` tests near the bottom of the file (the "accepts...", "omits...",
and "rejects a non-array acceptedAnswers" tests, ~lines 204, 224, 245).

- [ ] **Step 5: Run the existing test suite and confirm it still passes**

Run: `node --test src/domain/situationModel.test.js src/domain/answerMatch.test.js`
Expected: all tests pass (same 15 tests in `situationModel.test.js` as before, now without
any `clueChecklist` references).

- [ ] **Step 6: Commit**

```bash
git add src/domain/situationsMarkdown.js src/domain/situationModel.test.js
git commit -m "refactor: drop clueChecklist/promptOptions validation and normalization"
```

---

### Task 2: Remove `promptOptions` token substitution from round creation

**Files:**
- Modify: `src/domain/situationModel.js`

**Interfaces:**
- Produces: `buildPromptValues` (internal, unchanged signature) still returns
  `{ guesser, focusPlayer }` for every round; custom `promptOptions` keys are no longer
  added.

- [ ] **Step 1: Remove the `promptOptions` loop from `buildPromptValues`**

Change:

```js
function buildPromptValues(situation, performers, guesser, random = Math.random) {
  const focusPlayer =
    performers.length > 0
      ? performers[Math.floor(random() * performers.length)]
      : guesser;

  const values = { guesser, focusPlayer };

  Object.entries(situation.promptOptions ?? {}).forEach(([key, options]) => {
    if (Array.isArray(options) && options.length > 0) {
      values[key] = pickRandom(options, random);
    }
  });

  return values;
}
```

to:

```js
function buildPromptValues(situation, performers, guesser, random = Math.random) {
  const focusPlayer =
    performers.length > 0
      ? performers[Math.floor(random() * performers.length)]
      : guesser;

  return { guesser, focusPlayer };
}
```

`pickRandom` is still used elsewhere in this file (by `shuffle`... actually check: `shuffle`
doesn't call `pickRandom`, only `buildPromptValues` did). Since `pickRandom` is now unused,
delete it too:

```js
function pickRandom(items, random = Math.random) {
  return items[Math.floor(random() * items.length)];
}
```

- [ ] **Step 2: Run the existing test suite and confirm it still passes**

Run: `node --test src/domain/situationModel.test.js src/domain/answerMatch.test.js`
Expected: all tests pass unchanged — no existing fixture uses `promptOptions`, so this is a
pure dead-code removal.

- [ ] **Step 3: Commit**

```bash
git add src/domain/situationModel.js
git commit -m "refactor: remove unused promptOptions token substitution"
```

---

### Task 3: Strip `clueChecklist`/`promptOptions` from `situations.md` and regenerate

**Files:**
- Modify: `src/domain/situations.md`
- Modify: `src/domain/situations.generated.js` (regenerated by script, not hand-edited)

**Interfaces:**
- Produces: `SITUATIONS` (from `situations.generated.js`, re-exported by `situationModel.js`)
  — same 5 situations, now without `clueChecklist` on any of them.

- [ ] **Step 1: Update the instructional header**

In `src/domain/situations.md`, change:

```markdown
Rules:
- Keep each situation as valid JSON inside `json` code fences.
- Keep `id` unique.
- `promptOptions` is optional and lets you randomize tokens used in `solutionPrompt`.
```

to:

```markdown
Rules:
- Keep each situation as valid JSON inside `json` code fences.
- Keep `id` unique.
```

- [ ] **Step 2: Remove `clueChecklist` from all 5 JSON blocks**

Remove the `"clueChecklist": [...]` array (3 lines) from each of the 5 situations in
`src/domain/situations.md`: Animal Shelter, Vet Clinic, Pirate Treasure, Stormy Night At Sea
(the second, un-headed json block under "## Pirate Treasure"), and Sushi Restaurant. For
example, the Animal Shelter block's `clueChecklist` looks like this today and should be
deleted entirely (keeping the comma removed from the preceding line, `"solutionPrompt"`):

```json
  "clueChecklist": [
    "adopting a pet",
    "animal shelter setting",
    "child and parent choosing a dog"
  ],
```

None of the 5 situations currently use `promptOptions`, so no `promptOptions` keys need
removing from the content itself — only the header rule bullet from Step 1.

- [ ] **Step 3: Regenerate `situations.generated.js`**

Run: `npm run sync:situations`
Expected output: `Synced 5 situations from markdown.`

- [ ] **Step 4: Run the full test suite and confirm it still passes**

Run: `node --test src/domain/situationModel.test.js src/domain/answerMatch.test.js`
Expected: all tests pass, including "situation markdown is synced to generated situations"
(which does a `deepEqual` between the freshly-regenerated `SITUATIONS` export and a fresh
parse of `situations.md`).

- [ ] **Step 5: Commit**

```bash
git add src/domain/situations.md src/domain/situations.generated.js
git commit -m "content: remove clueChecklist/promptOptions from situations.md"
```

---

### Task 4: Export reusable validation from `situationsMarkdown.js`

**Files:**
- Modify: `src/domain/situationsMarkdown.js`
- Modify: `src/domain/situationModel.test.js`

**Interfaces:**
- Produces: `validateSituation(situation, context)` — now exported, and takes a plain
  `context` string (e.g. `"Situation #1"` or `"Scenario"`) instead of a numeric index.
- Produces: `normalizeSituation(situation)` — now exported (signature unchanged).
- Produces: `validateSituationDraft(situation, existingIds = [])` — new export; throws if
  `situation` fails `validateSituation`, or if `situation.id` is already present in
  `existingIds`.
- Consumed by: Task 7 (`ScenarioForm.jsx` calls `validateSituationDraft` and
  `normalizeSituation` on submit).

- [ ] **Step 1: Change `validateSituation` to take a context string, and export it**

Change:

```js
function validateSituation(situation, situationIndex) {
  const context = `Situation #${situationIndex + 1}`;

  if (typeof situation !== "object" || situation == null || Array.isArray(situation)) {
```

to:

```js
export function validateSituation(situation, context) {
  if (typeof situation !== "object" || situation == null || Array.isArray(situation)) {
```

Then update the one call site inside `parseSituationsMarkdown`, from:

```js
  situations.forEach((situation, index) => validateSituation(situation, index));
```

to:

```js
  situations.forEach((situation, index) => validateSituation(situation, `Situation #${index + 1}`));
```

- [ ] **Step 2: Export `normalizeSituation`**

Change `function normalizeSituation(situation) {` to
`export function normalizeSituation(situation) {`. No other changes to its body.

- [ ] **Step 3: Add `validateSituationDraft`**

Add this new function at the bottom of `src/domain/situationsMarkdown.js`, after
`parseSituationsMarkdown`:

```js
export function validateSituationDraft(situation, existingIds = []) {
  validateSituation(situation, "Scenario");

  if (existingIds.includes(situation.id)) {
    throw new Error(
      `Scenario: "id" must be unique — "${situation.id}" is already used by another scenario.`
    );
  }
}
```

- [ ] **Step 4: Write the new tests**

Add to `src/domain/situationModel.test.js`. First, update its import from
`situationsMarkdown.js`:

```js
import {
  normalizeSituation,
  parseSituationsMarkdown,
  validateSituation,
  validateSituationDraft,
} from "./situationsMarkdown.js";
```

Then add these tests anywhere after the existing `parseSituationsMarkdown` tests:

```js
test("validateSituation throws using the provided context string", () => {
  assert.throws(
    () => validateSituation({ name: "Missing id" }, "Scenario"),
    /Scenario: "id" must be a non-empty string\./
  );
});

test("validateSituationDraft rejects an id already used by another scenario", () => {
  const draft = {
    id: "animal-shelter",
    name: "Duplicate",
    guesserPrompt: "test",
    solutionPrompt: "test",
    roles: [{ name: "Role", mandatory: true, prompt: "prompt" }],
  };

  assert.throws(() => validateSituationDraft(draft, ["animal-shelter"]), /"id" must be unique/);
});

test("validateSituationDraft accepts a well-formed draft with a unique id", () => {
  const draft = {
    id: "new-scenario",
    name: "New Scenario",
    guesserPrompt: "test",
    solutionPrompt: "test",
    roles: [{ name: "Role", mandatory: true, prompt: "prompt" }],
  };

  assert.doesNotThrow(() => validateSituationDraft(draft, ["animal-shelter"]));
});

test("normalizeSituation is exported and strips unknown fields", () => {
  const normalized = normalizeSituation({
    id: "x",
    name: "X",
    guesserPrompt: "q",
    solutionPrompt: "a",
    roles: [{ name: "Role", mandatory: true, prompt: "p" }],
    unexpectedField: "should be dropped",
  });

  assert.equal("unexpectedField" in normalized, false);
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test src/domain/situationModel.test.js src/domain/answerMatch.test.js`
Expected: PASS (19 tests total in `situationModel.test.js`).

- [ ] **Step 6: Commit**

```bash
git add src/domain/situationsMarkdown.js src/domain/situationModel.test.js
git commit -m "feat: export validateSituation/normalizeSituation and add validateSituationDraft"
```

---

### Task 5: Browser-safe file I/O helpers (`situationsFile.js`)

**Files:**
- Create: `src/domain/situationsFile.js`
- Test: `src/domain/situationsFile.test.js`

**Interfaces:**
- Produces: `slugify(name: string) -> string`
- Produces: `extractPreamble(markdownText: string) -> string`
- Produces: `serializeSituationsMarkdown(preamble: string, situations: object[]) -> string`
- Produces: `isFileSystemAccessSupported() -> boolean`
- Produces: `openSituationsFile() -> Promise<{ handle: FileSystemFileHandle, text: string }>`
  (not unit tested — requires a real browser File System Access API)
- Produces: `writeSituationsFile(handle: FileSystemFileHandle, text: string) -> Promise<void>`
  (not unit tested, same reason)
- Consumed by: Task 8 (`ScenarioEditorPage.jsx` uses all six exports); Task 7
  (`ScenarioForm.jsx` uses `slugify`).

- [ ] **Step 1: Write the failing tests**

Create `src/domain/situationsFile.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/domain/situationsFile.test.js`
Expected: FAIL — `situationsFile.js` doesn't exist yet (module not found).

- [ ] **Step 3: Write the implementation**

Create `src/domain/situationsFile.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/domain/situationsFile.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full domain test suite**

Run: `node --test src/domain/*.test.js`
Expected: all tests across all three domain test files pass.

- [ ] **Step 6: Commit**

```bash
git add src/domain/situationsFile.js src/domain/situationsFile.test.js
git commit -m "feat: add browser-safe situations.md file I/O helpers"
```

---

### Task 6: Add `getSupportedPlayerRange` to `situationModel.js`

**Files:**
- Modify: `src/domain/situationModel.js`
- Modify: `src/domain/situationModel.test.js`

**Interfaces:**
- Produces: `getSupportedPlayerRange(roles: {mandatory: boolean}[]) -> { min: number, max:
  number }`
- Consumed by: Task 7 (`ScenarioForm.jsx` shows "Supports {min}–{max} players").

- [ ] **Step 1: Write the failing tests**

Add to `src/domain/situationModel.test.js`. Update the import from `./situationModel.js` to
include `getSupportedPlayerRange`:

```js
import {
  createRound,
  getNextGuesserIndex,
  getNoCompatibleSituationError,
  getSupportedPlayerRange,
  hasUniquePlayerNames,
  SITUATIONS,
  supportsPlayerCount,
} from "./situationModel.js";
```

Then add:

```js
test("getSupportedPlayerRange derives min/max players from mandatory and total role counts", () => {
  const roles = [
    { name: "A", mandatory: true, prompt: "p" },
    { name: "B", mandatory: true, prompt: "p" },
    { name: "C", mandatory: false, prompt: "p" },
  ];

  assert.deepEqual(getSupportedPlayerRange(roles), { min: 3, max: 4 });
});

test("getSupportedPlayerRange handles all-mandatory role lists", () => {
  const roles = [
    { name: "A", mandatory: true, prompt: "p" },
    { name: "B", mandatory: true, prompt: "p" },
  ];

  assert.deepEqual(getSupportedPlayerRange(roles), { min: 3, max: 3 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/domain/situationModel.test.js`
Expected: FAIL — `getSupportedPlayerRange` is not exported yet.

- [ ] **Step 3: Write the implementation**

Add this exported function to `src/domain/situationModel.js`, near `supportsPlayerCount`:

```js
export function getSupportedPlayerRange(roles) {
  const mandatoryCount = roles.filter((role) => role.mandatory).length;
  return { min: mandatoryCount + 1, max: roles.length + 1 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/domain/situationModel.test.js`
Expected: PASS (21 tests total).

- [ ] **Step 5: Run the full domain test suite**

Run: `node --test src/domain/*.test.js`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/domain/situationModel.js src/domain/situationModel.test.js
git commit -m "feat: add getSupportedPlayerRange for the scenario editor's player-count hint"
```

---

### Task 7: `ScenarioForm` component

**Files:**
- Create: `src/components/ScenarioForm.jsx`

**Interfaces:**
- Consumes: `slugify` from `src/domain/situationsFile.js`; `normalizeSituation`,
  `validateSituationDraft` from `src/domain/situationsMarkdown.js`; `getSupportedPlayerRange`
  from `src/domain/situationModel.js`.
- Produces: default export `ScenarioForm({ initialSituation, existingIds, onSave, onCancel
  })` — a controlled form for adding or editing one situation.
  - `initialSituation`: an existing situation object, or `null` when adding.
  - `existingIds`: `string[]` of every other situation's `id` (excludes the one being
    edited), used for duplicate checking.
  - `onSave(situation)`: called with a normalized situation object once validation passes.
  - `onCancel()`: called when the Cancel button is clicked.
- Consumed by: Task 8 (`ScenarioEditorPage.jsx` renders this for both add and edit views).

There is no automated test for this component (no jsdom/RTL in this project — see Global
Constraints). It's verified manually in Task 9 alongside `ScenarioEditorPage`.

- [ ] **Step 1: Write the component**

Create `src/components/ScenarioForm.jsx`:

```jsx
import { useState } from "react";
import { getSupportedPlayerRange } from "../domain/situationModel";
import { normalizeSituation, validateSituationDraft } from "../domain/situationsMarkdown";
import { slugify } from "../domain/situationsFile";

function ScenarioForm({ initialSituation, existingIds, onSave, onCancel }) {
  const [name, setName] = useState(initialSituation?.name ?? "");
  const [id, setId] = useState(initialSituation?.id ?? "");
  const [idManuallyEdited, setIdManuallyEdited] = useState(Boolean(initialSituation));
  const [guesserPrompt, setGuesserPrompt] = useState(initialSituation?.guesserPrompt ?? "");
  const [solutionPrompt, setSolutionPrompt] = useState(initialSituation?.solutionPrompt ?? "");
  const [acceptedAnswers, setAcceptedAnswers] = useState(initialSituation?.acceptedAnswers ?? []);
  const [roles, setRoles] = useState(
    initialSituation?.roles ?? [{ name: "", prompt: "", mandatory: true }]
  );
  const [error, setError] = useState("");

  const { min: minPlayers, max: maxPlayers } = getSupportedPlayerRange(roles);

  function handleNameChange(event) {
    const nextName = event.target.value;
    setName(nextName);
    if (!initialSituation && !idManuallyEdited) {
      setId(slugify(nextName));
    }
  }

  function handleIdChange(event) {
    setId(event.target.value);
    setIdManuallyEdited(true);
  }

  function updateAcceptedAnswer(index, value) {
    setAcceptedAnswers((prev) => prev.map((answer, i) => (i === index ? value : answer)));
  }

  function addAcceptedAnswer() {
    setAcceptedAnswers((prev) => [...prev, ""]);
  }

  function removeAcceptedAnswer(index) {
    setAcceptedAnswers((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRole(index, field, value) {
    setRoles((prev) => prev.map((role, i) => (i === index ? { ...role, [field]: value } : role)));
  }

  function addRole() {
    setRoles((prev) => [...prev, { name: "", prompt: "", mandatory: true }]);
  }

  function removeRole(index) {
    setRoles((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedAcceptedAnswers = acceptedAnswers.map((answer) => answer.trim()).filter(Boolean);
    const draft = {
      id: id.trim(),
      name: name.trim(),
      guesserPrompt: guesserPrompt.trim(),
      solutionPrompt: solutionPrompt.trim(),
      roles: roles.map((role) => ({
        name: role.name.trim(),
        prompt: role.prompt.trim(),
        mandatory: role.mandatory,
      })),
    };
    if (trimmedAcceptedAnswers.length > 0) {
      draft.acceptedAnswers = trimmedAcceptedAnswers;
    }

    try {
      validateSituationDraft(draft, existingIds);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    setError("");
    onSave(normalizeSituation(draft));
  }

  return (
    <form onSubmit={handleSubmit} className="d-grid gap-3">
      <div className="card">
        <div className="card-body d-grid gap-3">
          <div>
            <label className="form-label fw-bold" htmlFor="scenario-name">
              Name
            </label>
            <input
              id="scenario-name"
              value={name}
              onChange={handleNameChange}
              className="form-control form-control-lg"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="form-label fw-bold" htmlFor="scenario-id">
              Id
            </label>
            <input
              id="scenario-id"
              value={id}
              onChange={handleIdChange}
              className="form-control"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="form-label fw-bold" htmlFor="scenario-question">
              Question
            </label>
            <p className="form-text mt-0">
              Shown to the guesser. Use <code>[Player]</code> or <code>_</code> for blanks, e.g.{" "}
              <code>[Player] _ a _ from the _ _.</code>
            </p>
            <textarea
              id="scenario-question"
              value={guesserPrompt}
              onChange={(event) => setGuesserPrompt(event.target.value)}
              className="form-control"
              rows={2}
            />
          </div>

          <div>
            <label className="form-label fw-bold" htmlFor="scenario-solution">
              Solution
            </label>
            <p className="form-text mt-0">
              The answer, revealed when the round ends. Supports <code>{"{focusPlayer}"}</code>{" "}
              and <code>{"{guesser}"}</code> tokens.
            </p>
            <textarea
              id="scenario-solution"
              value={solutionPrompt}
              onChange={(event) => setSolutionPrompt(event.target.value)}
              className="form-control"
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body d-grid gap-3">
          <div className="d-flex align-items-center justify-content-between">
            <p className="fs-5 fw-bold mb-0">Accepted Answers</p>
            <button type="button" onClick={addAcceptedAnswer} className="btn btn-outline-secondary">
              + Add Answer
            </button>
          </div>
          <p className="form-text mt-0">
            Alternate phrasings that also count as correct. Leave empty to only accept the
            Solution text.
          </p>

          {acceptedAnswers.map((answer, index) => (
            <div key={`accepted-answer-${index}`} className="d-flex gap-2">
              <input
                value={answer}
                onChange={(event) => updateAcceptedAnswer(index, event.target.value)}
                className="form-control"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => removeAcceptedAnswer(index)}
                className="btn btn-outline-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-body d-grid gap-3">
          <div className="d-flex align-items-center justify-content-between">
            <p className="fs-5 fw-bold mb-0">Roles</p>
            <button type="button" onClick={addRole} className="btn btn-outline-secondary">
              + Add Role
            </button>
          </div>

          {roles.map((role, index) => (
            <div key={`role-${index}`} className="card border-secondary-subtle">
              <div className="card-body d-grid gap-2">
                <div>
                  <label className="form-label fw-bold" htmlFor={`role-title-${index}`}>
                    Title
                  </label>
                  <input
                    id={`role-title-${index}`}
                    value={role.name}
                    onChange={(event) => updateRole(index, "name", event.target.value)}
                    className="form-control"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="form-label fw-bold" htmlFor={`role-description-${index}`}>
                    Description
                  </label>
                  <p className="form-text mt-0">
                    Instructions shown to this player. <code>{"{player}"}</code> and{" "}
                    <code>{"{focusPlayer}"}</code> tokens are available.
                  </p>
                  <textarea
                    id={`role-description-${index}`}
                    value={role.prompt}
                    onChange={(event) => updateRole(index, "prompt", event.target.value)}
                    className="form-control"
                    rows={2}
                  />
                </div>

                <div className="form-check">
                  <input
                    id={`role-optional-${index}`}
                    type="checkbox"
                    checked={!role.mandatory}
                    onChange={(event) => updateRole(index, "mandatory", !event.target.checked)}
                    className="form-check-input"
                  />
                  <label className="form-check-label" htmlFor={`role-optional-${index}`}>
                    Optional role (added only for bigger groups)
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => removeRole(index)}
                  disabled={roles.length <= 1}
                  className="btn btn-outline-danger"
                >
                  Remove Role
                </button>
              </div>
            </div>
          ))}

          <p className="text-body-secondary mb-0">
            Supports {minPlayers}–{maxPlayers} players
          </p>
        </div>
      </div>

      {error && <p className="alert alert-danger fs-5">{error}</p>}

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-lg btn-primary">
          Save Scenario
        </button>
        <button type="button" onClick={onCancel} className="btn btn-lg btn-outline-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ScenarioForm;
```

Note: the `–` in the "Supports N–M players" line is a literal en-dash character — type
it directly (–), not the escape sequence, since this is JSX text content, not a JS string
literal.

- [ ] **Step 2: Run the full domain test suite to confirm no regressions**

Run: `node --test src/domain/*.test.js`
Expected: all tests pass (this task adds no new domain logic, only a component that imports
existing exports).

- [ ] **Step 3: Commit**

```bash
git add src/components/ScenarioForm.jsx
git commit -m "feat: add ScenarioForm for adding/editing a situation"
```

---

### Task 8: `ScenarioEditorPage` component

**Files:**
- Create: `src/pages/ScenarioEditorPage.jsx`

**Interfaces:**
- Consumes: `ScenarioForm` (Task 7); `extractPreamble`, `isFileSystemAccessSupported`,
  `openSituationsFile`, `serializeSituationsMarkdown`, `writeSituationsFile` from
  `src/domain/situationsFile.js`; `parseSituationsMarkdown` from
  `src/domain/situationsMarkdown.js`.
- Produces: default export `ScenarioEditorPage()` — no props, self-contained page.
- Consumed by: Task 9 (`App.jsx` routes `/admin/scenarios` to this component).

No automated test for this component, same reasoning as Task 7 — verified manually in
Task 9.

- [ ] **Step 1: Write the component**

Create `src/pages/ScenarioEditorPage.jsx`:

```jsx
import { useState } from "react";
import ScenarioForm from "../components/ScenarioForm";
import {
  extractPreamble,
  isFileSystemAccessSupported,
  openSituationsFile,
  serializeSituationsMarkdown,
  writeSituationsFile,
} from "../domain/situationsFile";
import { parseSituationsMarkdown } from "../domain/situationsMarkdown";

const VIEW_LIST = "list";
const VIEW_ADD = "add";
const VIEW_EDIT = "edit";

function ScenarioEditorPage() {
  const [fileHandle, setFileHandle] = useState(null);
  const [preamble, setPreamble] = useState("");
  const [situations, setSituations] = useState([]);
  const [view, setView] = useState(VIEW_LIST);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const supported = isFileSystemAccessSupported();

  async function handleOpen() {
    try {
      const { handle, text } = await openSituationsFile();
      const parsed = parseSituationsMarkdown(text);
      setFileHandle(handle);
      setPreamble(extractPreamble(text));
      setSituations(parsed);
      setError("");
    } catch (openError) {
      if (openError && openError.name === "AbortError") {
        return;
      }
      setError(openError.message);
    }
  }

  async function persist(nextSituations) {
    const markdown = serializeSituationsMarkdown(preamble, nextSituations);
    await writeSituationsFile(fileHandle, markdown);
    setSituations(nextSituations);
  }

  async function handleSave(situation) {
    try {
      const index = situations.findIndex((existing) => existing.id === editingId);
      const nextSituations =
        index === -1
          ? [...situations, situation]
          : situations.map((existing, i) => (i === index ? situation : existing));
      await persist(nextSituations);
      setView(VIEW_LIST);
      setEditingId(null);
      setError("");
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function handleDelete(id) {
    const target = situations.find((situation) => situation.id === id);
    if (!target || !window.confirm(`Delete "${target.name}"?`)) {
      return;
    }
    try {
      await persist(situations.filter((situation) => situation.id !== id));
      setError("");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function handleCancel() {
    setView(VIEW_LIST);
    setEditingId(null);
  }

  if (!supported) {
    return (
      <section className="d-grid gap-3 py-3">
        <p className="alert alert-warning fs-5">
          This page needs a Chromium-based browser (Chrome or Edge) for File System access.
        </p>
      </section>
    );
  }

  if (!fileHandle) {
    return (
      <section className="d-grid gap-3 py-3">
        <p className="fs-4 fw-bold mb-0">Scenario Editor</p>
        <button type="button" onClick={handleOpen} className="btn btn-lg btn-primary">
          Open situations.md
        </button>
        {error && <p className="alert alert-danger fs-5">{error}</p>}
      </section>
    );
  }

  if (view === VIEW_ADD || view === VIEW_EDIT) {
    const editingSituation = view === VIEW_EDIT ? situations.find((s) => s.id === editingId) : null;
    const existingIds = situations.map((s) => s.id).filter((sid) => sid !== editingId);

    return (
      <section className="d-grid gap-3 py-3">
        <p className="fs-4 fw-bold mb-0">{view === VIEW_ADD ? "Add Scenario" : "Edit Scenario"}</p>
        {error && <p className="alert alert-danger fs-5">{error}</p>}
        <ScenarioForm
          initialSituation={editingSituation}
          existingIds={existingIds}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </section>
    );
  }

  return (
    <section className="d-grid gap-3 py-3">
      <div className="d-flex align-items-center justify-content-between">
        <p className="fs-4 fw-bold mb-0">Scenario Editor</p>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setView(VIEW_ADD);
          }}
          className="btn btn-lg btn-primary"
        >
          + Add Scenario
        </button>
      </div>

      {error && <p className="alert alert-danger fs-5">{error}</p>}

      <div className="list-group">
        {situations.map((situation) => (
          <div
            key={situation.id}
            className="list-group-item d-flex align-items-center justify-content-between"
          >
            <div>
              <p className="mb-0 fw-bold">{situation.name}</p>
              <p className="mb-0 text-body-secondary small">{situation.id}</p>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(situation.id);
                  setView(VIEW_EDIT);
                }}
                className="btn btn-outline-secondary"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(situation.id)}
                className="btn btn-outline-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ScenarioEditorPage;
```

- [ ] **Step 2: Run the full domain test suite to confirm no regressions**

Run: `node --test src/domain/*.test.js`
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ScenarioEditorPage.jsx
git commit -m "feat: add ScenarioEditorPage with open/list/add/edit/delete flow"
```

---

### Task 9: Wire the route, document it, and verify end-to-end

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `ScenarioEditorPage` (Task 8).

- [ ] **Step 1: Add the route**

In `src/App.jsx`, add the import alongside the other page imports (alphabetically, between
`RolesPage` and `SetupPage`):

```jsx
import ScenarioEditorPage from "./pages/ScenarioEditorPage";
```

Then add a new top-level route as a sibling of the `GameLayout` route (not nested inside
it — this page has no relationship to in-progress game state), inside the existing
`<Routes>`:

```jsx
          <Routes>
            <Route element={<GameLayout />}>
              <Route path="/" element={<SetupPage />} />
              <Route path="/reveal" element={<RevealPage />} />
              <Route path="/guess" element={<GuessPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="/admin/scenarios" element={<ScenarioEditorPage />} />
          </Routes>
```

Do not add any link to this route from the header or any page — it stays reachable only by
navigating to `/admin/scenarios` directly.

- [ ] **Step 2: Document the page in the README**

In `README.md`, add this section right after the existing "## Edit situations" section:

```markdown
## Scenario editor (author-only)

A hidden page at `/admin/scenarios` lets you add, edit, and delete situations without
hand-editing JSON. It needs a Chromium browser (Chrome or Edge) and prompts you to pick
`src/domain/situations.md` once; saving writes straight back to that file. After saving, run
`npm run sync:situations` (or restart `npm run dev`) to see the change reflected in the game.
```

- [ ] **Step 3: Run the full domain test suite**

Run: `node --test src/domain/*.test.js`
Expected: all tests pass.

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: build succeeds with no errors (confirms the new route/components don't break
bundling).

- [ ] **Step 5: Manually verify the golden path**

Run: `npm run dev`, then in a Chromium browser:
1. Navigate to `/admin/scenarios`. Confirm the "Open situations.md" button appears.
2. Click it and pick `src/domain/situations.md`. Confirm the 5 existing scenarios list.
3. Click **+ Add Scenario**. Fill in Name "Test Scenario" (confirm Id auto-fills to
   `test-scenario`), a Question, a Solution, one Accepted Answer, and two roles — one left
   as mandatory, one checked "Optional role". Confirm the "Supports N–M players" line
   updates as roles are added/toggled. Click **Save Scenario**.
4. Confirm the list now shows "Test Scenario" and that `src/domain/situations.md` on disk
   has a new `## Test Scenario` section with the expected JSON.
5. Click **Edit** on "Test Scenario", change the Question text, save, and confirm the file
   on disk reflects the change and no other entries were altered.
6. Click **Delete** on "Test Scenario", confirm the dialog, and confirm it's removed from
   both the list and the file, leaving the original 5 scenarios untouched.
7. Run `npm run sync:situations` again and confirm it still succeeds against the
   now-restored 5-scenario file.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx README.md
git commit -m "feat: wire up /admin/scenarios route and document the scenario editor"
```
