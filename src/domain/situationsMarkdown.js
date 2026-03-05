const JSON_BLOCK_REGEX = /```json\s*([\s\S]*?)```/g;

function assertNonEmptyString(value, fieldName, context) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${context}: "${fieldName}" must be a non-empty string.`);
  }
}

function assertStringArray(value, fieldName, context) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`${context}: "${fieldName}" must be an array of non-empty strings.`);
  }
}

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

function validateRole(role, roleIndex, context) {
  const roleContext = `${context}, role #${roleIndex + 1}`;

  if (typeof role !== "object" || role == null || Array.isArray(role)) {
    throw new Error(`${roleContext}: role must be an object.`);
  }

  assertNonEmptyString(role.name, "name", roleContext);
  if (typeof role.mandatory !== "boolean") {
    throw new Error(`${roleContext}: "mandatory" must be true/false.`);
  }
  assertNonEmptyString(role.prompt, "prompt", roleContext);
}

function normalizeRole(role) {
  return {
    name: role.name,
    mandatory: role.mandatory,
    prompt: role.prompt,
  };
}

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

  return normalized;
}

function validateSituation(situation, situationIndex) {
  const context = `Situation #${situationIndex + 1}`;

  if (typeof situation !== "object" || situation == null || Array.isArray(situation)) {
    throw new Error(`${context}: situation must be an object.`);
  }

  assertNonEmptyString(situation.id, "id", context);
  assertNonEmptyString(situation.name, "name", context);
  assertNonEmptyString(situation.guesserPrompt, "guesserPrompt", context);
  assertNonEmptyString(situation.solutionPrompt, "solutionPrompt", context);
  assertStringArray(situation.clueChecklist, "clueChecklist", context);

  if (!Array.isArray(situation.roles) || situation.roles.length === 0) {
    throw new Error(`${context}: "roles" must be a non-empty array.`);
  }

  situation.roles.forEach((role, roleIndex) => validateRole(role, roleIndex, context));
  validatePromptOptions(situation.promptOptions, context);
}

export function parseSituationsMarkdown(markdown) {
  if (typeof markdown !== "string") {
    throw new Error("Situations markdown content must be a string.");
  }

  const situations = [];
  let blockMatch;

  while ((blockMatch = JSON_BLOCK_REGEX.exec(markdown)) !== null) {
    const blockText = blockMatch[1].trim();
    if (!blockText) {
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(blockText);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid JSON in situations markdown: ${message}`);
    }

    situations.push(parsed);
  }

  if (situations.length === 0) {
    throw new Error("No situation JSON blocks found. Add at least one ```json ... ``` block.");
  }

  situations.forEach((situation, index) => validateSituation(situation, index));

  const seenIds = new Set();
  situations.forEach((situation) => {
    if (seenIds.has(situation.id)) {
      throw new Error(`Duplicate situation id "${situation.id}".`);
    }
    seenIds.add(situation.id);
  });

  return situations.map((situation) => normalizeSituation(situation));
}
