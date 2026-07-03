# Scenario Editor: In-Browser Admin UI for Adding/Editing Situations

**Date:** 2026-07-03
**Status:** Approved, ready for implementation planning

## Overview

Improv Guesser scenarios ("situations") currently live in `src/domain/situations.md`, a
markdown file with embedded ` ```json ` blocks, hand-edited and then synced to
`situations.generated.js` via `npm run sync:situations`. This is slow and error-prone for
adding new scenarios: no validation until the sync script runs, and role/answer arrays are
easy to get wrong by hand.

This adds a hidden, authoring-only page (`/admin/scenarios`) with a form for composing and
saving scenarios: roles (title + description, with an "optional role" flag for larger
groups), the guesser's question, the solution + accepted answers, backed by the File System
Access API so "Save" writes `situations.md` directly — no copy/paste, no backend.

## Non-Goals

- No automatic re-run of `npm run sync:situations` after saving — you still run that (or
  restart `npm run dev`) to see changes reflected in the actual game, same as today's manual
  workflow.
- No support for non-Chromium browsers (Firefox/Safari lack the File System Access API) —
  acceptable since only the author uses this page.
- No persistence of the picked file handle across page reloads — you re-open the file each
  time you start an editing session.
- No preservation of hand-written comments or custom formatting between situation blocks in
  `situations.md` beyond the leading instructional preamble — saving regenerates each
  situation's `## Name` + JSON block from the parsed data.
- No player-facing link to this page anywhere in the game's nav or `App.jsx` header.
- No change to gameplay, routing for existing pages, or the fuzzy answer-matching logic.

## Part 1: Schema Simplification

Remove `clueChecklist` and `promptOptions` from the project. Neither is rendered anywhere in
the game UI today, and no entry in `situations.md` actually uses `promptOptions`.

**`src/domain/situationsMarkdown.js`:**
- `validateSituation`: delete the `assertStringArray(situation.clueChecklist, ...)` call and
  the `validatePromptOptions(situation.promptOptions, context)` call. Delete the now-unused
  `validatePromptOptions` function.
- `normalizeSituation`: delete the `clueChecklist: [...situation.clueChecklist]` line and the
  `promptOptions` copy-through block.

**`src/domain/situationModel.js`:**
- `buildPromptValues`: delete the `Object.entries(situation.promptOptions ?? {})` loop. The
  function still returns `{ guesser, focusPlayer }` — those tokens are always available and
  don't depend on `promptOptions`.

**`src/domain/situations.md`:**
- Strip the `clueChecklist` and (where present) `promptOptions` keys from all 5 existing JSON
  blocks (Animal Shelter, Vet Clinic, Pirate Treasure, Stormy Night At Sea, Sushi
  Restaurant). Update the top-of-file instructional comment to drop any mention of these
  fields.

**`src/domain/situationModel.test.js`:**
- Remove `clueChecklist: [...]` from every inline test fixture object. No `promptOptions`
  fixtures exist today, so nothing to remove there.

**`scripts/sync-situations.mjs`:** no changes needed — it just calls
`parseSituationsMarkdown` and serializes the result.

After this change the schema is: `id`, `name`, `guesserPrompt`, `solutionPrompt`, optional
`acceptedAnswers: string[]`, and `roles: [{ name, mandatory, prompt }]`.

## Part 2: Scenario Editor Page

### Route

Add to `src/App.jsx`, alongside the existing `<Routes>` but **outside** `GameLayout` (this
page has no relationship to in-progress game state):

```jsx
<Route path="/admin/scenarios" element={<ScenarioEditorPage />} />
```

Not linked from the header/nav — reachable only by navigating to the URL directly.

### File I/O (`src/domain/situationsFile.js`, new)

Browser-only helpers, no Node dependency:

```js
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

export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isFileSystemAccessSupported() {
  return typeof window.showOpenFilePicker === "function";
}
```

**Preamble + serialization.** When a file is opened, split its text at the first `## `
heading (or first ` ```json ` fence if no heading precedes it) — everything before that
point is the "preamble" (the file's top instructional comment) and is kept verbatim on
save. Serialization rebuilds the rest:

```js
export function serializeSituationsMarkdown(preamble, situations) {
  const blocks = situations
    .map((s) => `## ${s.name}\n\n\`\`\`json\n${JSON.stringify(s, null, 2)}\n\`\`\`\n`)
    .join("\n");
  return `${preamble}\n${blocks}`;
}
```

Parsing on open reuses the existing `parseSituationsMarkdown` from `situationsMarkdown.js`
(already pure JS, no Node APIs — safe to import in the browser bundle).

### `ScenarioEditorPage.jsx` (new)

State: `fileHandle`, `preamble`, `situations` (array), `editingSituation` (`null` | an
existing situation | a blank draft), `error`.

Layout, following existing Bootstrap conventions (`card`, `btn btn-lg`, `alert
alert-danger`):

1. **Before a file is opened:** a single "Open situations.md" button (disabled with an
   explanatory `alert-warning` if `isFileSystemAccessSupported()` is false).
2. **After opening:** a `list-group` of situations, each row showing `name` (and `id` as
   muted text) with **Edit** and **Delete** buttons, plus a **+ Add Scenario** button above
   the list. Delete asks `window.confirm("Delete \"{name}\"?")` before removing the entry
   from `situations`, re-serializing, and writing.
3. **Add/Edit:** renders `<ScenarioForm>` in place of the list, passed the situation being
   edited (or `null` for add) and `existingIds` (all ids except the one being edited, for
   duplicate checking). On submit, the page merges the result into `situations` (append for
   add, splice-replace by matching `id` for edit), serializes, writes via
   `writeSituationsFile`, and returns to the list view. On cancel, returns to the list view
   without changes.

### `ScenarioForm.jsx` (new)

Props: `initialSituation` (or `null`), `existingIds`, `onSave(situation)`, `onCancel()`.

Fields:
- **Name** (`form-control form-control-lg`). On change, if adding (no `initialSituation`)
  and the id hasn't been hand-edited yet, auto-fills `id` via `slugify(name)`.
- **Id** (`form-control`, smaller/secondary styling) — editable in both add and edit mode.
- **Question** (`guesserPrompt`, `textarea form-control`) — helper text: "Shown to the
  guesser. Use `[Player]` or `_` for blanks, e.g. current entries like `[Player] _ a _ from
  the _ _.`"
- **Solution** (`solutionPrompt`, `textarea form-control`) — helper text: "The answer,
  revealed when the round ends. Supports `{focusPlayer}` and `{guesser}` tokens."
- **Accepted Answers** (optional, dynamic list of text inputs with **+ Add** / **Remove**
  per row, same list-editing pattern as the roles list below) — helper text: "Alternate
  phrasings that also count as correct. Leave empty to only accept the Solution text."
- **Roles** (dynamic list, minimum 1 row, **+ Add Role** button):
  - Title (`role.name`, `form-control`)
  - Description (`role.prompt`, `textarea form-control`) — helper text mentions
    `{player}`/`{focusPlayer}` tokens are available.
  - "Optional role" checkbox (inverse of `role.mandatory` — unchecked box = mandatory role,
    checked = optional/added-for-more-players role), matching the existing schema's
    `mandatory: boolean`.
  - **Remove** button per row (disabled if it's the only row).
  - Below the list, a computed, non-editable line: **"Supports N–M players"** where
    `N = mandatoryCount + 1` and `M = roles.length + 1` (mirrors
    `supportsPlayerCount`/`getPerformerCount` from `situationModel.js`, +1 for the guesser).
    This directly surfaces what adding optional roles buys you.

Validation on submit (reusing `validateSituation`'s rules rather than re-implementing them —
either by importing and calling it directly on the assembled object, or by extracting its
checks into a small shared function if a signature mismatch requires it):
- Name, id, question, solution all non-empty.
- At least one role; each role has a non-empty title and description.
- Id is unique among `existingIds`.
- Accepted answers, if any, are non-empty strings.

Errors render as a single `alert alert-danger` above the Save button, matching
`SetupPage.jsx`'s pattern.

## Error Handling

- `showOpenFilePicker()` rejecting (user cancels the dialog) is caught silently — no error
  shown, just stay on the "Open situations.md" button.
- Any other file-read/parse/write error (invalid JSON in the file, a write permission
  failure, etc.) surfaces via the same `alert alert-danger` pattern used elsewhere, with the
  underlying error message shown so it's actionable.
- Non-Chromium browsers: detected up front via `isFileSystemAccessSupported()`, shown as a
  standing warning rather than letting the user hit a runtime `TypeError`.

## Testing

`node --test`, matching existing project style:
- `src/domain/situationsMarkdown.test.js`-equivalent coverage (inline in
  `situationModel.test.js` today): confirm `clueChecklist`/`promptOptions` are no longer
  validated or required; existing accepted-answers tests continue passing unchanged.
- No test coverage for `situationsFile.js` or the React components — they depend on browser
  File System Access APIs not available under Node; this matches the project's existing
  approach of verifying UI manually (Playwright/dev-server) rather than component tests.

## Verification

After implementation: run the dev server, navigate directly to `/admin/scenarios`, open the
real `situations.md`, add a new test scenario with 2 mandatory + 1 optional role, save,
confirm the file on disk matches expectations, then edit that scenario's question, save
again, confirm the change persisted and no other entries were altered. Delete the test
scenario to leave the file clean. Separately confirm `npm run sync:situations` still
succeeds against the edited file and the 5 original scenarios are unaffected by the schema
simplification.
