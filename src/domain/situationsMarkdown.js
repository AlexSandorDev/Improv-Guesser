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

export function normalizeSituation(situation) {
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

export function validateSituation(situation, context) {
  if (typeof situation !== "object" || situation == null || Array.isArray(situation)) {
    throw new Error(`${context}: situation must be an object.`);
  }

  assertNonEmptyString(situation.id, "id", context);
  assertNonEmptyString(situation.name, "name", context);
  assertNonEmptyString(situation.guesserPrompt, "guesserPrompt", context);
  assertNonEmptyString(situation.solutionPrompt, "solutionPrompt", context);

  if (situation.acceptedAnswers != null) {
    assertStringArray(situation.acceptedAnswers, "acceptedAnswers", context);
  }

  if (!Array.isArray(situation.roles) || situation.roles.length === 0) {
    throw new Error(`${context}: "roles" must be a non-empty array.`);
  }

  situation.roles.forEach((role, roleIndex) => validateRole(role, roleIndex, context));
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

  situations.forEach((situation, index) => validateSituation(situation, `Situation #${index + 1}`));

  const seenIds = new Set();
  situations.forEach((situation) => {
    if (seenIds.has(situation.id)) {
      throw new Error(`Duplicate situation id "${situation.id}".`);
    }
    seenIds.add(situation.id);
  });

  return situations.map((situation) => normalizeSituation(situation));
}

export function validateSituationDraft(situation, existingIds = []) {
  validateSituation(situation, "Scenario");

  if (existingIds.includes(situation.id)) {
    throw new Error(
      `Scenario: "id" must be unique — "${situation.id}" is already used by another scenario.`
    );
  }
}
