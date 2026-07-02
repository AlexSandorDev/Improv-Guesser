# Gameplay Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Improv Guesser to a bigger, Bootstrap-styled, multi-page (react-router) phone UI with guesser rotation, 6-life rounds, fuzzy free-text answer checking with synonym support, and visible answer history.

**Architecture:** A `GameLayout` route component owns all game state and exposes it to four page routes (`/`, `/reveal`, `/guess`, `/roles`) via `useOutletContext()`. Domain logic (guesser rotation, answer templating, fuzzy matching) lives in pure, unit-tested functions in `src/domain/`; pages are thin and call into that logic through the shared context.

**Tech Stack:** React 18.3.1, Vite 5.4.10, react-router-dom (new), Bootstrap 5.3.8 (already a dependency, currently unused), `node --test` for domain unit tests.

**Spec:** `docs/superpowers/specs/2026-07-02-gameplay-revamp-design.md`

## Global Constraints

- ESM only (`"type": "module"` in package.json) — no CommonJS, no TypeScript.
- react-router-dom: install latest, use ONLY the declarative API (`BrowserRouter`, `Routes`,
  `Route`, `Outlet`, `useOutletContext`, `useNavigate`, `Navigate`, `Link`). Do not use
  `createBrowserRouter`, loaders, or actions — this app doesn't need data-router/framework mode.
- No new test framework. Domain logic tests use `node --test`, matching the existing style in
  `src/domain/situationModel.test.js`. UI is verified manually (dev server + Playwright
  screenshots), not with component tests — this project has no jsdom/RTL/vitest installed.
- Bootstrap 5.3.8 is CSS-only in this app — no `bootstrap.bundle.js`, no Popper-dependent
  components (modals, dropdowns, tooltips). All show/hide UI stays plain React state.
- `MIN_PLAYERS` stays 4 (unchanged).
- Lives per round: 6 (`INITIAL_LIVES = 6`).
- Word-level fuzzy match threshold: 0.7 (`WORD_MATCH_THRESHOLD`), verified in the spec against
  8 real cases — do not change without re-verifying (see spec's "Design note").
- Root font-size bump to `18px` so Bootstrap's rem-based sizing scales up everywhere (the
  "make it bigger for a phone" lever).

---

## Task 1: Add react-router-dom dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (via `npm install`)

**Interfaces:**
- Produces: `react-router-dom` package available for import in all later tasks.

- [ ] **Step 1: Install the package**

Run: `npm install react-router-dom`

- [ ] **Step 2: Verify it was added to package.json**

Run: `node -e "console.log(require('./package.json').dependencies['react-router-dom'])"`
Expected: prints a version string (e.g. `^7.18.1`), not empty/undefined.

- [ ] **Step 3: Verify the existing app still builds**

Run: `npm run build`
Expected: exits 0, no errors (app doesn't use the new package yet, so this just confirms
the install didn't break anything).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-router-dom for multi-page gameplay flow"
```

---

## Task 2: Fuzzy answer matching (`src/domain/answerMatch.js`)

**Files:**
- Create: `src/domain/answerMatch.js`
- Create: `src/domain/answerMatch.test.js`
- Modify: `AGENTS.md` (verify command needs to pick up the new test file)

**Interfaces:**
- Produces: `WORD_MATCH_THRESHOLD` (number), `normalizeAnswerText(text: string): string`,
  `levenshteinDistance(a: string, b: string): number`, `similarityRatio(a: string, b: string): number`,
  `isAnswerCorrect(guess: string, acceptedAnswers: string[], threshold?: number): boolean`.
  `isAnswerCorrect` is consumed by Task 5's `GameLayout`.

- [ ] **Step 1: Update AGENTS.md to glob domain test files**

In `AGENTS.md`, replace:
```markdown
## Verify
- `node --test src/domain/situationModel.test.js`
- `npm run build`
```
with:
```markdown
## Verify
- `node --test src/domain/*.test.js`
- `npm run build`
```

- [ ] **Step 2: Write the failing tests**

Create `src/domain/answerMatch.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  isAnswerCorrect,
  levenshteinDistance,
  normalizeAnswerText,
  similarityRatio,
} from "./answerMatch.js";

test("normalizeAnswerText lowercases, trims, strips punctuation, collapses whitespace", () => {
  assert.equal(normalizeAnswerText("  Who's PLAYER 1?!  "), "whos player 1");
});

test("levenshteinDistance counts edits between two strings", () => {
  assert.equal(levenshteinDistance("kitten", "sitting"), 3);
  assert.equal(levenshteinDistance("player 1", "player 1"), 0);
});

test("similarityRatio returns 1 for identical strings and 0 for fully different strings", () => {
  assert.equal(similarityRatio("player 1", "player 1"), 1);
  assert.equal(similarityRatio("abc", "xyz"), 0);
});

test("isAnswerCorrect accepts an exact match, case and punctuation insensitive", () => {
  assert.equal(isAnswerCorrect("Player 1!", ["player 1"]), true);
});

test("isAnswerCorrect accepts a single dropped-letter typo in one word", () => {
  assert.equal(isAnswerCorrect("playr 1", ["player 1"]), true);
});

test("isAnswerCorrect accepts a typo inside a longer phrase", () => {
  assert.equal(isAnswerCorrect("where are thay", ["where are they"]), true);
});

test("isAnswerCorrect accepts a rephrased guess with extra filler words", () => {
  assert.equal(isAnswerCorrect("I think it's player 1 for sure", ["player 1"]), true);
});

test("isAnswerCorrect checks every accepted answer, not just the first", () => {
  assert.equal(isAnswerCorrect("animal shelter", ["adopts a dog", "animal shelter"]), true);
});

test("isAnswerCorrect rejects an unrelated guess", () => {
  assert.equal(isAnswerCorrect("the wrong answer entirely", ["player 1"]), false);
});

test("isAnswerCorrect rejects an empty guess", () => {
  assert.equal(isAnswerCorrect("   ", ["player 1"]), false);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `node --test src/domain/answerMatch.test.js`
Expected: FAIL — `Cannot find module './answerMatch.js'` (file doesn't exist yet).

- [ ] **Step 4: Implement `answerMatch.js`**

Create `src/domain/answerMatch.js`:

```js
export const WORD_MATCH_THRESHOLD = 0.7;

export function normalizeAnswerText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

export function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const distances = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) {
    distances[i][0] = i;
  }
  for (let j = 0; j < cols; j += 1) {
    distances[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distances[i][j] = Math.min(
        distances[i - 1][j] + 1,
        distances[i][j - 1] + 1,
        distances[i - 1][j - 1] + cost
      );
    }
  }

  return distances[rows - 1][cols - 1];
}

export function similarityRatio(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) {
    return 1;
  }
  return 1 - levenshteinDistance(a, b) / maxLen;
}

function wordsFuzzyMatch(guessWords, targetWords, threshold) {
  return targetWords.every((targetWord) =>
    guessWords.some(
      (guessWord) => guessWord === targetWord || similarityRatio(guessWord, targetWord) >= threshold
    )
  );
}

export function isAnswerCorrect(guess, acceptedAnswers, threshold = WORD_MATCH_THRESHOLD) {
  const normalizedGuess = normalizeAnswerText(guess);
  if (!normalizedGuess) {
    return false;
  }
  const guessWords = normalizedGuess.split(" ").filter(Boolean);

  return acceptedAnswers.some((accepted) => {
    const normalizedTarget = normalizeAnswerText(accepted);
    if (!normalizedTarget) {
      return false;
    }
    const targetWords = normalizedTarget.split(" ").filter(Boolean);
    return wordsFuzzyMatch(guessWords, targetWords, threshold);
  });
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test src/domain/answerMatch.test.js`
Expected: PASS — all 10 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/domain/answerMatch.js src/domain/answerMatch.test.js AGENTS.md
git commit -m "feat: add word-level fuzzy answer matching"
```

---

## Task 3: Guesser rotation + multi-answer support in `situationModel.js`

**Files:**
- Modify: `src/domain/situationModel.js`
- Modify: `src/domain/situationModel.test.js`

**Interfaces:**
- Consumes: nothing new (extends existing exports).
- Produces: `getNextGuesserIndex(currentIndex: number, playerCount: number): number`.
  `createRound(players, selectedSituationId, random?, situations?, forcedGuesserIndex?: number)`
  — new optional 5th param; when a number, that index is used as the guesser instead of a
  random pick. Returned round object gains `guesserIndex: number` and
  `matchAnswers: string[]` (templated `solutionPrompt` + templated `acceptedAnswers`,
  deduplicated). Both consumed by Task 5's `GameLayout`.

- [ ] **Step 1: Write the failing tests**

Add to `src/domain/situationModel.test.js`. First, update the import line at the top of the
file from:

```js
import {
  createRound,
  getNoCompatibleSituationError,
  hasUniquePlayerNames,
  SITUATIONS,
  supportsPlayerCount,
} from "./situationModel.js";
```

to:

```js
import {
  createRound,
  getNextGuesserIndex,
  getNoCompatibleSituationError,
  hasUniquePlayerNames,
  SITUATIONS,
  supportsPlayerCount,
} from "./situationModel.js";
```

Then append these tests at the end of the file (after the last existing `test(...)` block):

```js
test("getNextGuesserIndex wraps around to 0 after the last player", () => {
  assert.equal(getNextGuesserIndex(0, 4), 1);
  assert.equal(getNextGuesserIndex(3, 4), 0);
});

test("createRound uses forcedGuesserIndex instead of picking randomly", () => {
  const players = ["Alex", "Sam", "Jo", "Kai"];
  const round = createRound(players, tokenTemplateSituation.id, () => 0.99, [tokenTemplateSituation], 2);

  assert.equal(round.guesser, "Jo");
  assert.equal(round.guesserIndex, 2);
});

const situationWithAcceptedAnswers = {
  id: "with-accepted-answers",
  name: "With Accepted Answers",
  guesserPrompt: "{guesser} leads the scene",
  solutionPrompt: "{focusPlayer} solved it",
  acceptedAnswers: ["{focusPlayer} solved it", "case closed"],
  clueChecklist: ["clue one"],
  roles: [
    { ...baseRole, name: "Role One", mandatory: true, prompt: "{player} plays along" },
    { ...baseRole, name: "Role Two", mandatory: true, prompt: "{player} plays along" },
    { ...baseRole, name: "Role Three", mandatory: true, prompt: "{player} plays along" },
  ],
};

test("createRound builds matchAnswers from solutionPrompt plus deduplicated acceptedAnswers", () => {
  const players = ["Alex", "Sam", "Jo", "Kai"];
  const round = createRound(players, situationWithAcceptedAnswers.id, () => 0, [situationWithAcceptedAnswers]);

  assert.deepEqual(round.matchAnswers, [round.solution, "case closed"]);
});

test("createRound falls back to solutionPrompt alone when acceptedAnswers is absent", () => {
  const players = ["Alex", "Sam", "Jo", "Kai"];
  const round = createRound(players, tokenTemplateSituation.id, () => 0, [tokenTemplateSituation]);

  assert.deepEqual(round.matchAnswers, [round.solution]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test src/domain/situationModel.test.js`
Expected: FAIL — `getNextGuesserIndex is not a function` / `round.guesserIndex` and
`round.matchAnswers` are `undefined`.

- [ ] **Step 3: Implement the changes in `situationModel.js`**

Add this new export anywhere after the existing `hasUniquePlayerNames` export:

```js
export function getNextGuesserIndex(currentIndex, playerCount) {
  return (currentIndex + 1) % playerCount;
}
```

Replace the `createRound` function signature and body:

```js
export function createRound(
  players,
  selectedSituationId,
  random = Math.random,
  situations = SITUATIONS,
  forcedGuesserIndex = null
) {
  const candidateSituations =
    selectedSituationId === "random"
      ? situations
      : situations.filter((situation) => situation.id === selectedSituationId);

  const possibleSituations = getCompatibleSituations(candidateSituations, players.length);

  if (possibleSituations.length === 0) {
    throw new Error(getNoCompatibleSituationError(players.length));
  }

  const situation = possibleSituations[Math.floor(random() * possibleSituations.length)];
  const guesserIndex =
    typeof forcedGuesserIndex === "number" ? forcedGuesserIndex : Math.floor(random() * players.length);
  const guesser = players[guesserIndex];
  const performers = players.filter((_, index) => index !== guesserIndex);

  const mandatoryRoles = situation.roles.filter((role) => role.mandatory);
  const optionalRoles = shuffle(
    situation.roles.filter((role) => !role.mandatory),
    random
  );
  const optionalNeeded = performers.length - mandatoryRoles.length;
  const selectedRoles = shuffle(
    [...mandatoryRoles, ...optionalRoles.slice(0, optionalNeeded)],
    random
  );
  const promptValues = buildPromptValues(situation, performers, guesser, random);

  const cards = {};

  cards[guesser] = {
    type: "guesser",
    title: "Guesser",
    prompt: fillPrompt(situation.guesserPrompt, promptValues),
    rules: "Watch everyone improvise and guess the hidden situation.",
  };

  performers.forEach((player, index) => {
    const role = selectedRoles[index];
    cards[player] = {
      type: "role",
      title: role.name,
      prompt: fillPrompt(role.prompt, { ...promptValues, player }),
      rules: role.mandatory ? "Mandatory role" : "Optional role",
    };
  });

  const solution = fillPrompt(situation.solutionPrompt ?? situation.name, promptValues);
  const acceptedTemplated = (situation.acceptedAnswers ?? []).map((template) =>
    fillPrompt(template, promptValues)
  );
  const matchAnswers = [...new Set([solution, ...acceptedTemplated])];

  return {
    situation,
    solution,
    players,
    guesser,
    guesserIndex,
    cards,
    matchAnswers,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test src/domain/situationModel.test.js`
Expected: PASS — all tests green (original tests plus the 4 new ones).

- [ ] **Step 5: Commit**

```bash
git add src/domain/situationModel.js src/domain/situationModel.test.js
git commit -m "feat: support forced guesser index and multi-answer matching in createRound"
```

---

## Task 4: `acceptedAnswers` schema support in `situationsMarkdown.js`

**Files:**
- Modify: `src/domain/situationsMarkdown.js`
- Modify: `src/domain/situationModel.test.js`

**Interfaces:**
- Consumes: existing `assertStringArray(value, fieldName, context)` helper (already in the file).
- Produces: `parseSituationsMarkdown` now accepts an optional `acceptedAnswers: string[]` field
  per situation JSON block, validated and passed through unchanged. Existing behavior for
  situations without this field is unchanged.

- [ ] **Step 1: Write the failing tests**

Append to `src/domain/situationModel.test.js` (this file already imports `parseSituationsMarkdown`):

```js
test("parseSituationsMarkdown accepts a situation with acceptedAnswers", () => {
  const markdown = [
    "```json",
    "{",
    '  "id": "with-answers",',
    '  "name": "With Answers",',
    '  "guesserPrompt": "test prompt",',
    '  "solutionPrompt": "the answer",',
    '  "acceptedAnswers": ["the answer", "an answer"],',
    '  "clueChecklist": ["clue one"],',
    '  "roles": [',
    '    { "name": "Role One", "mandatory": true, "prompt": "role prompt" }',
    "  ]",
    "}",
    "```",
  ].join("\n");

  const [situation] = parseSituationsMarkdown(markdown);
  assert.deepEqual(situation.acceptedAnswers, ["the answer", "an answer"]);
});

test("parseSituationsMarkdown omits acceptedAnswers when not provided", () => {
  const markdown = [
    "```json",
    "{",
    '  "id": "without-answers",',
    '  "name": "Without Answers",',
    '  "guesserPrompt": "test prompt",',
    '  "solutionPrompt": "the answer",',
    '  "clueChecklist": ["clue one"],',
    '  "roles": [',
    '    { "name": "Role One", "mandatory": true, "prompt": "role prompt" }',
    "  ]",
    "}",
    "```",
  ].join("\n");

  const [situation] = parseSituationsMarkdown(markdown);
  assert.equal("acceptedAnswers" in situation, false);
});

test("parseSituationsMarkdown rejects a non-array acceptedAnswers", () => {
  const markdown = [
    "```json",
    "{",
    '  "id": "bad-answers",',
    '  "name": "Bad Answers",',
    '  "guesserPrompt": "test prompt",',
    '  "solutionPrompt": "the answer",',
    '  "acceptedAnswers": "the answer",',
    '  "clueChecklist": ["clue one"],',
    '  "roles": [',
    '    { "name": "Role One", "mandatory": true, "prompt": "role prompt" }',
    "  ]",
    "}",
    "```",
  ].join("\n");

  assert.throws(() => parseSituationsMarkdown(markdown), /acceptedAnswers/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test src/domain/situationModel.test.js`
Expected: FAIL — the "accepts" test fails because `acceptedAnswers` is stripped by
`normalizeSituation` (undefined), and the "rejects" test fails because no validation error
is thrown for a non-array value.

- [ ] **Step 3: Implement the changes in `situationsMarkdown.js`**

In `validateSituation`, add this line right after the existing
`assertStringArray(situation.clueChecklist, "clueChecklist", context);` line:

```js
  if (situation.acceptedAnswers != null) {
    assertStringArray(situation.acceptedAnswers, "acceptedAnswers", context);
  }
```

In `normalizeSituation`, add this block right after the existing `promptOptions` block
(after the `if (situation.promptOptions != null) { ... }` block, before `return normalized;`):

```js
  if (situation.acceptedAnswers != null) {
    normalized.acceptedAnswers = [...situation.acceptedAnswers];
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test src/domain/situationModel.test.js`
Expected: PASS — all tests green, including the 3 new ones.

- [ ] **Step 5: Run the full domain test suite and the build**

Run: `node --test src/domain/*.test.js`
Expected: PASS — all tests across `answerMatch.test.js` and `situationModel.test.js`.

Run: `npm run build`
Expected: exits 0 (this also re-runs `sync:situations`, which re-parses the real
`situations.md` — confirms the new optional-field handling doesn't break existing content).

- [ ] **Step 6: Commit**

```bash
git add src/domain/situationsMarkdown.js src/domain/situationModel.test.js
git commit -m "feat: support optional acceptedAnswers field in situations.md schema"
```

---

## Task 5: Bootstrap, routing, and the four gameplay pages

This is one cohesive task: the router, shared game state, and all four pages only make
sense together (they share one state contract), so they're reviewed and verified as a
single deliverable rather than split into pieces that can't be meaningfully checked in
isolation (no component-test framework exists in this project — see Global Constraints).

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles.css`
- Create: `src/components/LivesTracker.jsx`
- Create: `src/components/AnswerHistoryList.jsx`
- Create: `src/pages/SetupPage.jsx`
- Create: `src/pages/RevealPage.jsx`
- Create: `src/pages/RolesPage.jsx`
- Create: `src/pages/GuessPage.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `createRound`, `getNextGuesserIndex`, `SITUATIONS`, `MIN_PLAYERS`,
  `normalizePlayerNames`, `hasUniquePlayerNames` from `src/domain/situationModel.js`
  (Task 3); `isAnswerCorrect` from `src/domain/answerMatch.js` (Task 2).
- Produces (the `useOutletContext()` shape every page reads — this is the contract):
  ```
  {
    players: string[],
    round: Round | null,     // { situation, solution, players, guesser, guesserIndex, cards, matchAnswers }
    roundNumber: number,
    lives: number,
    roundOver: boolean,
    history: Array<{ roundNumber: number, guesser: string, answer: string, correct: boolean }>,
    revealedLiveRoles: Record<string, boolean>,
    startGame: (players: string[]) => string | null,   // returns an error message, or null on success
    submitGuess: (guessText: string) => boolean,         // returns true if the guess was correct
    startNewRound: () => void,
    backToSetup: () => void,
    toggleLiveRole: (player: string) => void,
  }
  ```
  None of these functions navigate — every page calls `useNavigate()` itself after calling
  a context function, per the routes table below.

Routes: `/` → `SetupPage`, `/reveal` → `RevealPage`, `/guess` → `GuessPage`, `/roles` → `RolesPage`.

- [ ] **Step 1: Wire up Bootstrap CSS**

Modify `src/main.jsx` — add the Bootstrap import before the existing `styles.css` import
so `styles.css` can override Bootstrap variables:

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 2: Slim down `styles.css`**

Replace the entire contents of `src/styles.css` with:

```css
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Space+Grotesk:wght@500;700&display=swap");

:root {
  --bs-primary: #e85d04;
  --bs-primary-rgb: 232, 93, 4;
}

html {
  font-size: 18px;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "Outfit", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at 12% 12%, #ffd9c2 0%, transparent 25%),
    radial-gradient(circle at 80% 20%, #c7eef6 0%, transparent 26%),
    linear-gradient(130deg, #fff7e6, #dff7ff);
}

#root {
  min-height: 100vh;
}

.page-shell {
  min-height: 100vh;
  padding-bottom: 2rem;
}

.game-header h1 {
  font-family: "Space Grotesk", "Trebuchet MS", sans-serif;
  letter-spacing: -0.02em;
}
```

- [ ] **Step 3: Create `LivesTracker.jsx`**

Create `src/components/LivesTracker.jsx`:

```jsx
function LivesTracker({ lives, maxLives = 6 }) {
  return (
    <div className="d-flex gap-2 fs-2" role="status" aria-label={`${lives} of ${maxLives} lives remaining`}>
      {Array.from({ length: maxLives }, (_, index) => (
        <span key={index}>{index < lives ? "❤️" : "🤍"}</span>
      ))}
    </div>
  );
}

export default LivesTracker;
```

- [ ] **Step 4: Create `AnswerHistoryList.jsx`**

Create `src/components/AnswerHistoryList.jsx`:

```jsx
function AnswerHistoryList({ history }) {
  if (history.length === 0) {
    return null;
  }

  return (
    <ul className="list-group mb-3">
      {history.map((entry, index) => (
        <li
          key={`${entry.roundNumber}-${index}`}
          className="list-group-item d-flex justify-content-between align-items-center gap-3"
        >
          <span>
            <strong>Round {entry.roundNumber}</strong> — {entry.guesser}: &quot;{entry.answer}&quot;
          </span>
          <span className={`badge ${entry.correct ? "text-bg-success" : "text-bg-danger"}`}>
            {entry.correct ? "Correct" : "Wrong"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default AnswerHistoryList;
```

- [ ] **Step 5: Create `SetupPage.jsx`**

Create `src/pages/SetupPage.jsx`:

```jsx
import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { hasUniquePlayerNames, MIN_PLAYERS, normalizePlayerNames } from "../domain/situationModel";

function SetupPage() {
  const { startGame } = useOutletContext();
  const navigate = useNavigate();
  const [playerInputs, setPlayerInputs] = useState(["", "", "", ""]);
  const [error, setError] = useState("");

  const normalizedPlayers = useMemo(() => normalizePlayerNames(playerInputs), [playerInputs]);
  const normalizedPlayerCount = normalizedPlayers.length;

  function updatePlayerName(index, name) {
    setPlayerInputs((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
    setError("");
  }

  function addPlayerField() {
    setPlayerInputs((prev) => [...prev, ""]);
    setError("");
  }

  function removePlayerField(index) {
    setPlayerInputs((prev) => {
      if (prev.length <= MIN_PLAYERS) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
    setError("");
  }

  function handleStartGame() {
    if (normalizedPlayers.length < MIN_PLAYERS) {
      setError(`Minimum ${MIN_PLAYERS} players required.`);
      return;
    }

    if (!hasUniquePlayerNames(normalizedPlayers)) {
      setError("Player names must be unique (case-insensitive).");
      return;
    }

    const startError = startGame(normalizedPlayers);
    if (startError) {
      setError(startError);
      return;
    }

    navigate("/reveal");
  }

  return (
    <section className="d-grid gap-3 py-3">
      <p className="fs-5 text-body-secondary">
        Add player names, then pass one phone around to reveal each private role.
      </p>

      <div className="card">
        <div className="card-body d-grid gap-3">
          <div className="d-flex align-items-center justify-content-between">
            <p className="fs-4 fw-bold mb-0">Players</p>
            <button type="button" onClick={addPlayerField} className="btn btn-lg btn-outline-secondary">
              + Add Player
            </button>
          </div>

          {playerInputs.map((name, index) => (
            <div key={`player-${index}`} className="d-flex gap-2">
              <input
                value={name}
                onChange={(event) => updatePlayerName(index, event.target.value)}
                placeholder={`Player ${index + 1}`}
                autoComplete="off"
                className="form-control form-control-lg"
              />
              <button
                type="button"
                onClick={() => removePlayerField(index)}
                disabled={playerInputs.length <= MIN_PLAYERS}
                className="btn btn-lg btn-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="alert alert-danger fs-5">{error}</p>}

      <button
        type="button"
        onClick={handleStartGame}
        className="btn btn-lg btn-primary"
        disabled={normalizedPlayerCount < MIN_PLAYERS}
      >
        Start Game
      </button>
    </section>
  );
}

export default SetupPage;
```

- [ ] **Step 6: Create `RevealPage.jsx`**

Create `src/pages/RevealPage.jsx`:

```jsx
import { useMemo, useState } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";

function RevealPage() {
  const { round, backToSetup } = useOutletContext();
  const navigate = useNavigate();
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnStage, setTurnStage] = useState("pass");

  const revealOrder = useMemo(() => {
    if (!round) {
      return [];
    }
    return [...round.players.filter((player) => player !== round.guesser), round.guesser];
  }, [round]);

  if (!round) {
    return <Navigate to="/" replace />;
  }

  const currentPlayer = revealOrder[turnIndex] ?? "";
  const currentCard = round.cards[currentPlayer];

  function moveToNextPlayer() {
    if (turnIndex + 1 >= revealOrder.length) {
      navigate("/guess");
      return;
    }
    setTurnIndex((prev) => prev + 1);
    setTurnStage("pass");
  }

  function cancelRound() {
    backToSetup();
    navigate("/");
  }

  return (
    <section className="d-grid gap-3 py-3">
      {turnStage === "pass" && (
        <div className="card">
          <div className="card-body text-center d-grid gap-3">
            <h2>Hand the phone to {currentPlayer}</h2>
            <button type="button" className="btn btn-lg btn-primary" onClick={() => setTurnStage("revealed")}>
              Reveal Role
            </button>
          </div>
        </div>
      )}

      {turnStage === "revealed" && currentCard && (
        <div className="card border-warning-subtle bg-warning-subtle">
          <div className="card-body text-center d-grid gap-3">
            <p className="fw-bold text-uppercase small mb-0">{currentCard.rules}</p>
            <h2>{currentCard.title}</h2>
            <p className="fs-5 mb-0">{currentCard.prompt}</p>
            <button type="button" className="btn btn-lg btn-primary" onClick={moveToNextPlayer}>
              Hide Role and Continue
            </button>
          </div>
        </div>
      )}

      <button type="button" className="btn btn-lg btn-outline-secondary" onClick={cancelRound}>
        Cancel Round
      </button>
    </section>
  );
}

export default RevealPage;
```

- [ ] **Step 7: Create `RolesPage.jsx`**

Create `src/pages/RolesPage.jsx`:

```jsx
import { Link, Navigate, useOutletContext } from "react-router-dom";

function RolesPage() {
  const { round, revealedLiveRoles, toggleLiveRole } = useOutletContext();

  if (!round) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="d-grid gap-3 py-3">
      <p className="fs-4 fw-bold mb-0">All Player Roles</p>

      <div className="d-grid gap-3">
        {round.players.map((player) => {
          const card = round.cards[player];
          const isRevealed = Boolean(revealedLiveRoles[player]);

          return (
            <div key={`live-role-${player}`} className="card">
              <div className="card-body d-grid gap-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <p className="fs-5 fw-bold mb-0">{player}</p>
                    {player === round.guesser && <span className="badge text-bg-primary">Guesser</span>}
                  </div>
                  <button
                    type="button"
                    className="btn btn-lg btn-outline-secondary"
                    onClick={() => toggleLiveRole(player)}
                  >
                    {isRevealed ? "Hide Role" : "Reveal Role"}
                  </button>
                </div>

                {isRevealed && (
                  <div className="d-grid gap-2">
                    <p className="fw-bold text-uppercase small mb-0">{card.rules}</p>
                    <h3 className="mb-0">{card.title}</h3>
                    <p className="fs-5 mb-0">{card.prompt}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Link to="/guess" className="btn btn-lg btn-primary">
        Back to Game
      </Link>
    </section>
  );
}

export default RolesPage;
```

- [ ] **Step 8: Create `GuessPage.jsx`**

Create `src/pages/GuessPage.jsx`:

```jsx
import { useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext } from "react-router-dom";
import LivesTracker from "../components/LivesTracker";
import AnswerHistoryList from "../components/AnswerHistoryList";

function GuessPage() {
  const { round, roundNumber, lives, roundOver, history, submitGuess, startNewRound, backToSetup } =
    useOutletContext();
  const navigate = useNavigate();
  const [guessInput, setGuessInput] = useState("");
  const [feedback, setFeedback] = useState(null);

  if (!round) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = guessInput.trim();
    if (!trimmed) {
      return;
    }

    const correct = submitGuess(trimmed);
    setFeedback(correct ? "correct" : "wrong");
    setGuessInput("");
  }

  function handleNewRound() {
    startNewRound();
    setFeedback(null);
    navigate("/reveal");
  }

  function handleBackToSetup() {
    backToSetup();
    navigate("/");
  }

  return (
    <section className="d-grid gap-3 py-3">
      <div className="d-flex align-items-center justify-content-between">
        <p className="fs-5 fw-bold mb-0">Round {roundNumber}</p>
        <LivesTracker lives={lives} />
      </div>

      <AnswerHistoryList history={history} />

      {!roundOver && (
        <form onSubmit={handleSubmit} className="d-grid gap-3">
          {feedback === "wrong" && <p className="alert alert-danger fs-5 mb-0">Not quite — try again.</p>}
          <input
            value={guessInput}
            onChange={(event) => setGuessInput(event.target.value)}
            placeholder="What's the situation?"
            autoComplete="off"
            autoFocus
            className="form-control form-control-lg"
          />
          <button type="submit" className="btn btn-lg btn-primary">
            Guess
          </button>
        </form>
      )}

      {roundOver && (
        <div className="card border-success-subtle bg-success-subtle">
          <div className="card-body text-center d-grid gap-3">
            <p className="fs-5 fw-bold mb-0">{feedback === "correct" ? "Correct!" : "Out of lives!"}</p>
            <p className="text-body-secondary mb-0">Answer</p>
            <h3 className="mb-0">{round.solution}</h3>
          </div>
        </div>
      )}

      <Link to="/roles" className="btn btn-lg btn-outline-secondary">
        View Player Roles
      </Link>

      {roundOver && (
        <button type="button" className="btn btn-lg btn-primary" onClick={handleNewRound}>
          New Round
        </button>
      )}

      <button type="button" className="btn btn-lg btn-outline-danger" onClick={handleBackToSetup}>
        Back to Setup
      </button>
    </section>
  );
}

export default GuessPage;
```

- [ ] **Step 9: Rewrite `App.jsx` as the router + `GameLayout`**

Replace the entire contents of `src/App.jsx`:

```jsx
import { useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { isAnswerCorrect } from "./domain/answerMatch";
import { createRound, getNextGuesserIndex, SITUATIONS } from "./domain/situationModel";
import GuessPage from "./pages/GuessPage";
import RevealPage from "./pages/RevealPage";
import RolesPage from "./pages/RolesPage";
import SetupPage from "./pages/SetupPage";

const INITIAL_LIVES = 6;

function GameLayout() {
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(null);
  const [roundNumber, setRoundNumber] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [roundOver, setRoundOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [revealedLiveRoles, setRevealedLiveRoles] = useState({});

  function startGame(nextPlayers) {
    try {
      const generatedRound = createRound(nextPlayers, "random");
      setPlayers(nextPlayers);
      setRound(generatedRound);
      setRoundNumber(1);
      setLives(INITIAL_LIVES);
      setRoundOver(false);
      setHistory([]);
      setRevealedLiveRoles({});
      return null;
    } catch (roundError) {
      return roundError.message;
    }
  }

  function submitGuess(guessText) {
    const correct = isAnswerCorrect(guessText, round.matchAnswers);

    if (correct) {
      setHistory((prev) => [...prev, { roundNumber, guesser: round.guesser, answer: guessText, correct: true }]);
      setRoundOver(true);
      return true;
    }

    const remainingLives = lives - 1;
    if (remainingLives <= 0) {
      setLives(0);
      setHistory((prev) => [...prev, { roundNumber, guesser: round.guesser, answer: guessText, correct: false }]);
      setRoundOver(true);
      return false;
    }

    setLives(remainingLives);
    return false;
  }

  function startNewRound() {
    const nextIndex = getNextGuesserIndex(round.guesserIndex, players.length);
    const nextRound = createRound(players, "random", Math.random, SITUATIONS, nextIndex);
    setRound(nextRound);
    setRoundNumber((prev) => prev + 1);
    setLives(INITIAL_LIVES);
    setRoundOver(false);
    setRevealedLiveRoles({});
  }

  function backToSetup() {
    setPlayers([]);
    setRound(null);
    setRoundNumber(0);
    setLives(INITIAL_LIVES);
    setRoundOver(false);
    setHistory([]);
    setRevealedLiveRoles({});
  }

  function toggleLiveRole(player) {
    setRevealedLiveRoles((prev) => ({ ...prev, [player]: !prev[player] }));
  }

  return (
    <Outlet
      context={{
        players,
        round,
        roundNumber,
        lives,
        roundOver,
        history,
        revealedLiveRoles,
        startGame,
        submitGuess,
        startNewRound,
        backToSetup,
        toggleLiveRole,
      }}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <main className="page-shell">
        <header className="game-header text-center py-3">
          <h1>Improv Guesser</h1>
        </header>
        <div className="container">
          <Routes>
            <Route element={<GameLayout />}>
              <Route path="/" element={<SetupPage />} />
              <Route path="/reveal" element={<RevealPage />} />
              <Route path="/guess" element={<GuessPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 10: Verify the build succeeds**

Run: `npm run build`
Expected: exits 0, no errors (this confirms every new import resolves and there are no
JSX/syntax errors across all the new files).

- [ ] **Step 11: Smoke-check the dev server**

Run: `npm run dev` (in the background — leave it running for Task 6 too)
Open the printed local URL. Expected: the Setup page renders (title "Improv Guesser",
"Players" card with 4 name inputs, "+ Add Player" and "Start Game" buttons), styled with
Bootstrap (rounded cards, large buttons). No errors in the browser console.

- [ ] **Step 12: Commit**

```bash
git add src/main.jsx src/styles.css src/components src/pages src/App.jsx
git commit -m "feat: Bootstrap UI, multi-page routing, and guesser-rotated rounds with lives"
```

---

## Task 6: Manual verification with Playwright

Per the user's request, use the `/playwright-cli` skill (not automated component tests,
per Global Constraints) to visually verify every page and the full golden path, at a
phone-sized viewport (390×844).

- [ ] **Step 1: Confirm the dev server is running**

Run: `npm run dev` if it isn't already running from Task 5 (note the local URL, typically
`http://localhost:5173`).

- [ ] **Step 2: Screenshot the Setup page**

Using `/playwright-cli`: set viewport to 390×844, navigate to `/`, screenshot. Confirm: 4
large player-name inputs, large "+ Add Player" / "Start Game" buttons, Bootstrap styling
visible (rounded cards, spacing), no leftover custom `.btn.primary`-style classes causing
unstyled elements.

- [ ] **Step 3: Exercise Setup → Reveal → Guess and screenshot each**

Fill in 4 player names (e.g. Alex, Sam, Jo, Kai), click "Start Game". Confirm navigation to
`/reveal`. Screenshot the "Hand the phone to {player}" card, click "Reveal Role", screenshot
the revealed role card. Click "Hide Role and Continue" repeatedly until the last performer;
confirm the final click navigates to `/guess`. Screenshot `/guess` in its guessing state:
round number, 6 full life icons, no history yet, large answer input + "Guess" button.

- [ ] **Step 4: Exercise a wrong guess, then a correct (misspelled) guess**

On `/guess`, submit an obviously wrong guess (e.g. "spaceship launch"). Confirm: a "Not
quite — try again" alert appears, one life icon becomes empty (5 of 6 remain), input clears.
Read the actual situation's `solutionPrompt`/`acceptedAnswers` from `src/domain/situations.md`
for the situation shown on this run (visible via the `/roles` page — see Step 5) and submit a
deliberately misspelled version of it. Confirm: the round-end card appears ("Correct!"),
showing the solution text, and a "New Round" button appears. Screenshot this state.

- [ ] **Step 5: Screenshot the Roles page**

From `/guess`, click "View Player Roles". Confirm navigation to `/roles`. Screenshot the
page: one card per player, "Reveal Role"/"Hide Role" toggles, the guesser badge on the
correct player. Click one "Reveal Role" button and screenshot the expanded role. Click
"Back to Game" and confirm it returns to `/guess`.

- [ ] **Step 6: New Round and confirm guesser rotation + history**

From the `/guess` round-end state, note the current `round.guesser` (visible via the
"Guesser" badge on `/roles`, checked in Step 5). Click "New Round". Confirm navigation to
`/reveal` for the new round. Click through the reveal sequence to `/guess` again. Screenshot
`/guess`: confirm the history list now shows one entry for Round 1 (with the previous
guesser's name and their final answer), lives are back to 6 full icons, and Round number
reads 2. Visit `/roles` again and confirm the "Guesser" badge is now on the next player in
the original player order (rotation, not the same player).

- [ ] **Step 7: Back to Setup**

From `/guess`, click "Back to Setup". Confirm navigation to `/` and that the Setup page
shows empty inputs again (fresh state).

- [ ] **Step 8: Report results**

Summarize pass/fail for each screenshot and interaction above. If anything doesn't match
the expected behavior, fix the relevant file from Task 5 and re-run the affected steps —
do not proceed to closing out the plan until all 8 steps pass.
