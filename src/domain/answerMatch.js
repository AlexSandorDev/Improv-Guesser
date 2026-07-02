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
