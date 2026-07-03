import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createRound,
  getNextGuesserIndex,
  getNoCompatibleSituationError,
  hasUniquePlayerNames,
  SITUATIONS,
  supportsPlayerCount,
} from "./situationModel.js";
import {
  normalizeSituation,
  parseSituationsMarkdown,
  validateSituation,
  validateSituationDraft,
} from "./situationsMarkdown.js";

const baseRole = {
  prompt: "Role prompt",
};

const threeMandatoryTwoOptional = {
  id: "three-mandatory-two-optional",
  name: "Three Mandatory Two Optional",
  guesserPrompt: "{guesser}: test prompt",
  roles: [
    { ...baseRole, name: "Mandatory One", mandatory: true },
    { ...baseRole, name: "Mandatory Two", mandatory: true },
    { ...baseRole, name: "Mandatory Three", mandatory: true },
    { ...baseRole, name: "Optional One", mandatory: false },
    { ...baseRole, name: "Optional Two", mandatory: false },
  ],
};

const fourMandatoryRoles = {
  id: "four-mandatory",
  name: "Four Mandatory",
  guesserPrompt: "{guesser}: test prompt",
  roles: [
    { ...baseRole, name: "Mandatory One", mandatory: true },
    { ...baseRole, name: "Mandatory Two", mandatory: true },
    { ...baseRole, name: "Mandatory Three", mandatory: true },
    { ...baseRole, name: "Mandatory Four", mandatory: true },
  ],
};

const tokenTemplateSituation = {
  id: "token-template",
  name: "Token Template Situation",
  guesserPrompt: "{guesser} leads the scene",
  solutionPrompt: "{focusPlayer} solved it",
  roles: [
    {
      ...baseRole,
      name: "Role One",
      mandatory: true,
      prompt: "{player} takes cues from {guesser}",
    },
    {
      ...baseRole,
      name: "Role Two",
      mandatory: true,
      prompt: "{player} takes cues from {guesser}",
    },
    {
      ...baseRole,
      name: "Role Three",
      mandatory: true,
      prompt: "{player} takes cues from {guesser}",
    },
  ],
};

const domainDir = dirname(fileURLToPath(import.meta.url));

test("5 players are valid for 3 mandatory + 2 optional roles", () => {
  assert.equal(supportsPlayerCount(threeMandatoryTwoOptional, 5), true);
});

test("4 players are rejected for 4 mandatory performer roles", () => {
  assert.equal(supportsPlayerCount(fourMandatoryRoles, 4), false);
});

test("incompatible situations return deterministic error message", () => {
  const players = ["Alex", "Sam", "Jo", "Kai"];
  const expectedError = getNoCompatibleSituationError(players.length);

  assert.throws(
    () => createRound(players, "random", () => 0, [fourMandatoryRoles]),
    (error) => error instanceof Error && error.message === expectedError
  );
});

test("random selection only chooses compatible situations", () => {
  const players = ["Alex", "Sam", "Jo", "Kai"];

  const round = createRound(players, "random", () => 0, [
    fourMandatoryRoles,
    threeMandatoryTwoOptional,
  ]);

  assert.equal(round.situation.id, threeMandatoryTwoOptional.id);
});

test("player names must be case-insensitively unique", () => {
  assert.equal(hasUniquePlayerNames(["Alex", "alex", "Taylor", "Jordan"]), false);
  assert.equal(hasUniquePlayerNames(["Alex", "Sam", "Taylor", "Jordan"]), true);
});

test("createRound assigns exactly one guesser and role cards to all others", () => {
  const players = ["Alex", "Sam", "Jo", "Kai", "Rin", "Pat"];
  const round = createRound(players, "random", () => 0, [threeMandatoryTwoOptional]);

  const guesserCards = Object.values(round.cards).filter((card) => card.type === "guesser");
  assert.equal(guesserCards.length, 1);
  assert.equal(round.guesser, "Alex");

  const performerNames = players.filter((player) => player !== round.guesser);
  assert.equal(performerNames.length, 5);
  const performerCards = performerNames.map((player) => round.cards[player]);
  assert.equal(performerCards.every((card) => card.type === "role"), true);

  const assignedRoleTitles = performerCards.map((card) => card.title);
  assert.equal(new Set(assignedRoleTitles).size, performerCards.length);

  const mandatoryRoleNames = threeMandatoryTwoOptional.roles
    .filter((role) => role.mandatory)
    .map((role) => role.name);
  mandatoryRoleNames.forEach((mandatoryName) => {
    assert.equal(assignedRoleTitles.filter((title) => title === mandatoryName).length, 1);
  });
});

test("createRound fills guesser and role templates with token values", () => {
  const players = ["Alex", "Sam", "Jo", "Kai"];
  const round = createRound(players, tokenTemplateSituation.id, () => 0, [tokenTemplateSituation]);

  assert.equal(round.cards.Alex.prompt, "Alex leads the scene");
  assert.equal(round.solution, "Sam solved it");
  assert.equal(round.cards.Sam.prompt, "Sam takes cues from Alex");
  assert.equal(round.cards.Jo.prompt, "Jo takes cues from Alex");
  assert.equal(round.cards.Kai.prompt, "Kai takes cues from Alex");
});

test("situation markdown is synced to generated situations", () => {
  const markdown = readFileSync(join(domainDir, "situations.md"), "utf8");
  const parsedSituations = parseSituationsMarkdown(markdown);

  assert.deepEqual(SITUATIONS, parsedSituations);
});

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

test("parseSituationsMarkdown accepts a situation with acceptedAnswers", () => {
  const markdown = [
    "```json",
    "{",
    '  "id": "with-answers",',
    '  "name": "With Answers",',
    '  "guesserPrompt": "test prompt",',
    '  "solutionPrompt": "the answer",',
    '  "acceptedAnswers": ["the answer", "an answer"],',
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
    '  "roles": [',
    '    { "name": "Role One", "mandatory": true, "prompt": "role prompt" }',
    "  ]",
    "}",
    "```",
  ].join("\n");

  assert.throws(() => parseSituationsMarkdown(markdown), /acceptedAnswers/);
});

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
