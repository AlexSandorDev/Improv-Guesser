import { SITUATIONS } from "./situations.generated.js";

export { SITUATIONS };

export const MIN_PLAYERS = 2;

export function getPerformerCount(playerCount) {
  return Math.max(0, playerCount - 1);
}

export function supportsPlayerCount(situation, playerCount) {
  const performerCount = getPerformerCount(playerCount);
  const mandatoryCount = situation.roles.filter((role) => role.mandatory).length;
  return performerCount >= mandatoryCount && performerCount <= situation.roles.length;
}

export function getCompatibleSituations(situations, playerCount) {
  return situations.filter((situation) => supportsPlayerCount(situation, playerCount));
}

export function getNoCompatibleSituationError(playerCount) {
  const performerCount = getPerformerCount(playerCount);
  return `No compatible situation for ${playerCount} players (${performerCount} performers).`;
}

export function normalizePlayerNames(playerInputs) {
  return playerInputs.map((name) => name.trim()).filter(Boolean);
}

export function hasUniquePlayerNames(playerNames) {
  const normalizedNames = playerNames.map((name) => name.trim().toLowerCase()).filter(Boolean);
  return new Set(normalizedNames).size === normalizedNames.length;
}

export function getNextGuesserIndex(currentIndex, playerCount) {
  return (currentIndex + 1) % playerCount;
}

function fillPrompt(template, values) {
  return template.replace(/\{([^}]+)\}/g, (_, key) => values[key] ?? "");
}

function buildPromptValues(situation, performers, guesser, selectedRoles, random = Math.random) {
  const focusPlayer =
    performers.length > 0
      ? performers[Math.floor(random() * performers.length)]
      : guesser;

  const values = { guesser, focusPlayer };

  selectedRoles.forEach((role, index) => {
    values[role.name] = performers[index];
  });

  return values;
}

function shuffle(items, random = Math.random) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
  const promptValues = buildPromptValues(situation, performers, guesser, selectedRoles, random);

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
