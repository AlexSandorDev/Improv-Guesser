# Gameplay Revamp: Bigger UI, Multi-Page Flow, Guessing with Lives & History

**Date:** 2026-07-02
**Status:** Approved, ready for implementation planning

## Overview

Improv Guesser is a pass-the-phone party game (React + Vite, single page today). This
revamp makes the interface phone-friendly and bigger, converts styling to Bootstrap
(already an installed but unused dependency), splits gameplay across dedicated pages via
`react-router-dom`, and adds real guessing mechanics: a free-text answer field checked
with fuzzy matching, 6 lives per round, guesser rotation on new rounds, and a visible
answer history.

## Non-Goals

- No backend, no network multiplayer, no persistence across a page reload/refresh
  (game state lives in memory only, same as today).
- No changes to how situations are authored beyond adding one optional field
  (`acceptedAnswers`) — the user will edit `situations.md` content separately.
- No accessibility audit, no i18n, no analytics.
- No component-level test framework introduction (project has no jsdom/RTL/vitest
  installed). UI is verified manually via Playwright screenshots per page instead.

## Architecture: Routing

Add `react-router-dom` (latest v6.x, declarative `<Routes>` API — no data-router loaders
needed for an app this size). Use `<BrowserRouter>`; both `vite dev` and `vite preview`
already serve the SPA fallback needed for this to work locally.

Routes:

| Path | Page | Purpose |
|---|---|---|
| `/` | `SetupPage` | Enter player names, start game |
| `/reveal` | `RevealPage` | Pass-the-phone private role reveal (first round AND every new round) |
| `/guess` | `GuessPage` | **Main gameplay page.** Lives, history, answer input |
| `/roles` | `RolesPage` | All player roles, opened from `/guess`, back link returns to `/guess` |

A top-level `GameLayout` route component owns all game state (see "Game State" below)
and renders `<Outlet context={gameState} />`. Child pages read shared state via
`useOutletContext()` — no separate Context provider needed.

**Route guards:** `/reveal`, `/guess`, and `/roles` each check `round == null` on render
and `<Navigate to="/" replace />` if so (covers stale back-button navigation with no
active round).

## File Structure

New/changed files:

```
src/
  pages/
    SetupPage.jsx       (current "setup" phase JSX, extracted)
    RevealPage.jsx       (current "reveal" phase JSX, extracted)
    GuessPage.jsx         (new: lives + history + answer form + round-end state)
    RolesPage.jsx          (current "live" phase's role list, extracted)
  components/
    LivesTracker.jsx        (renders N life indicators, big enough to read at a glance)
    AnswerHistoryList.jsx     (renders the round-by-round history list)
  domain/
    answerMatch.js             (new: fuzzy matching helpers, pure functions)
    situationModel.js            (extended: guesser rotation + acceptedAnswers)
    situationsMarkdown.js          (extended: parse/validate acceptedAnswers)
  App.jsx                          (becomes the router + GameLayout only)
```

`App.jsx` shrinks to router setup; all phase-specific markup moves into `src/pages/`.

## Data Model Changes

### `situations.md` schema (optional new field)

Situations may add `acceptedAnswers: string[]` — a list of alternate phrasings/synonyms
for the solution, templated the same way as `solutionPrompt` (same `{token}` syntax,
same `promptOptions` values). Example:

```json
{
  "id": "animal-shelter",
  "solutionPrompt": "{focusPlayer} adopts a dog from the animal shelter.",
  "acceptedAnswers": ["animal shelter", "adopting a dog"],
  ...
}
```

If `acceptedAnswers` is omitted, matching falls back to `[solutionPrompt]` only — existing
`situations.md` content keeps working unchanged.

**`situationsMarkdown.js` changes:**
- `validateSituation`: if `situation.acceptedAnswers` is present, validate with the
  existing `assertStringArray` helper (non-empty array of non-empty strings). Absent is
  valid (field is optional).
- `normalizeSituation`: copy `acceptedAnswers` through (spread array) when present;
  omit the key entirely when absent (matches how `promptOptions` is handled today).

### `situationModel.js` changes

- `createRound(players, selectedSituationId, random, situations, forcedGuesserIndex)`:
  new optional 5th parameter. When it's a number, use `players[forcedGuesserIndex]` as
  the guesser instead of picking randomly. `undefined`/omitted preserves today's random
  behavior — existing call sites and tests are unaffected.
- The returned round object gains two fields:
  - `guesserIndex`: the numeric index used (random or forced), so the caller can compute
    the next round's forced index.
  - `matchAnswers`: the fully-templated match set — `fillPrompt(solutionPrompt, values)`
    plus every templated `acceptedAnswers` entry, deduplicated. This is the internal set
    checked against guesses; `round.solution` (already existing field) remains the single
    canonical string shown to players once a round ends.
- New exported pure helper: `getNextGuesserIndex(currentIndex, playerCount)` →
  `(currentIndex + 1) % playerCount`.

## Game State (owned by `GameLayout`)

```
players            — fixed roster for the session, set at Start Game
guesserIndex        — current round's guesser index into `players`
roundNumber          — 1 at Start Game, +1 each New Round
round                 — current round object from createRound (null before Start Game)
lives                  — remaining lives for the current round (resets to 6 each round)
history                 — array of { roundNumber, guesser, answer, correct }, accumulates
                           for the whole session, cleared on Back to Setup
revealedLiveRoles        — per-player reveal toggle state for RolesPage (unchanged behavior)
```

Flow:
1. **Setup → Start Game:** validate players (unchanged rules), `createRound(players,
   "random")` (no forced index → random guesser), set `roundNumber = 1`, `lives = 6`,
   clear `history`, navigate to `/reveal`.
2. **Reveal → last performer done:** navigate to `/guess`.
3. **Guess page layout, top to bottom:** lives tracker → `AnswerHistoryList` (only
   rendered once `history` is non-empty) → answer form (input + Guess button). Submitting
   an answer runs the fuzzy match (below) against `round.matchAnswers`.
   - Correct: push a history entry `{ roundNumber, guesser: round.guesser, answer: guessText,
     correct: true }`, clear the input, show the solution + round-end controls
     (`New Round`, `Back to Setup`).
   - Wrong, lives remain after decrementing: decrement `lives`, show a brief "not quite,
     try again" message, clear the input, stay in guessing state.
   - Wrong, `lives` reaches 0: push a history entry `{ roundNumber, guesser: round.guesser,
     answer: guessText, correct: false }`, show the solution + round-end controls
     (same as the correct case).
4. **New Round (from `/guess` round-end state):** `nextIndex = getNextGuesserIndex(round.guesserIndex,
   players.length)`, `createRound(players, "random", Math.random, SITUATIONS, nextIndex)`,
   `roundNumber += 1`, `lives = 6`, clear the answer input, navigate to `/reveal`. `history`
   is NOT cleared.
5. **Back to Setup (from `/guess`):** reset all game state (players list stays in the input
   fields as today; `round`, `history`, `lives`, `roundNumber` reset), navigate to `/`.
6. **Roles page:** reachable from `/guess` any time a round is active (guessing or
   round-end state); never mutates lives/history; "Back to Game" link returns to `/guess`.

## Answer Matching (`src/domain/answerMatch.js`)

Pure functions, no dependencies, easy to read and re-tune:

```js
export const FUZZY_MATCH_THRESHOLD = 0.8;

export function normalizeAnswerText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

export function levenshteinDistance(a, b) { /* standard DP edit distance */ }

export function similarityRatio(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

function wordsOverlapFully(targetWords, guessWordSet) {
  return targetWords.length > 0 && targetWords.every((word) => guessWordSet.has(word));
}

export function isAnswerCorrect(guess, acceptedAnswers, threshold = FUZZY_MATCH_THRESHOLD) {
  const normalizedGuess = normalizeAnswerText(guess);
  if (!normalizedGuess) return false;
  const guessWordSet = new Set(normalizedGuess.split(" ").filter(Boolean));

  return acceptedAnswers.some((accepted) => {
    const normalizedTarget = normalizeAnswerText(accepted);
    if (!normalizedTarget) return false;
    if (similarityRatio(normalizedGuess, normalizedTarget) >= threshold) return true;
    return wordsOverlapFully(normalizedTarget.split(" ").filter(Boolean), guessWordSet);
  });
}
```

`GuessPage` calls `isAnswerCorrect(inputValue, round.matchAnswers)` on submit.

## UI / Bootstrap Conversion

- Import `bootstrap/dist/css/bootstrap.min.css` in `main.jsx` (CSS only — no interactive
  Bootstrap JS components are used, since reveal/hide toggles stay plain React state as
  today).
- Replace custom classes with Bootstrap equivalents:
  - `.btn`/`.btn.primary`/`.ghost`/`.danger` → `btn btn-lg btn-primary` / `btn btn-lg
    btn-outline-secondary` / `btn btn-lg btn-danger`
  - `.players-block`, `.panel` → `card` + `card-body`
  - `.stack` → `d-grid gap-3`
  - `input`/`select` → `form-control form-control-lg`
  - Error text → `alert alert-danger`
  - Role badge → `badge text-bg-primary`
  - Lives tracker → simple large-text indicators (e.g. filled/empty circle characters)
    sized via a utility class; no Bootstrap component fits well here, so this stays
    hand-rolled but trivial.
  - History list → `list-group` + `list-group-item` with a `badge` for correct/wrong
- Keep a slim `src/styles.css` for: the Google Fonts import, `body` background gradient,
  and a couple of CSS-variable accent overrides (e.g. remapping `--bs-primary` to the
  existing orange accent) layered after the Bootstrap import.
- Root font-size bump (e.g. `html { font-size: 18px; }`) so Bootstrap's rem-based sizing
  scales up everywhere at once — the single easy-to-edit lever for "make it bigger."

## Testing

`node --test` (matching the existing style, no new framework):
- `src/domain/answerMatch.test.js`: normalization, exact match, misspelling within/outside
  threshold, synonym/word-overlap match, case/punctuation insensitivity, empty-guess
  rejection.
- `src/domain/situationModel.test.js` (extended): `getNextGuesserIndex` wraps correctly;
  `createRound` with a `forcedGuesserIndex` picks the exact expected guesser;
  `matchAnswers` includes both the templated `solutionPrompt` and templated
  `acceptedAnswers`, deduplicated.
- `src/domain/situationsMarkdown.test.js`-equivalent coverage (existing file) extended for
  `acceptedAnswers` validation (rejects non-string-array, accepts omitted).

## Verification

Per user request: after implementation, run the dev server and use `/playwright-cli` to
screenshot all four pages (`/`, `/reveal`, `/guess` in both guessing and round-end state,
`/roles`) at a phone-sized viewport, plus exercise the golden path (start game → reveal →
wrong guess → lives decrement → correct guess → new round → rotation) and confirm history
accumulates correctly.
