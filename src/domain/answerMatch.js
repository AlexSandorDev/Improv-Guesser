export const WORD_MATCH_THRESHOLD = 0.7;

export function normalizeAnswerText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

// Restricted edit distance (Levenshtein plus adjacent-transposition as a single edit,
// a.k.a. Optimal String Alignment). Plain Levenshtein counts a swapped pair of adjacent
// letters — the most common typo pattern ("stromy" for "stormy", "form" for "from") — as
// 2 edits, which drags short words below WORD_MATCH_THRESHOLD and wrongly rejects the typo.
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
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        distances[i][j] = Math.min(distances[i][j], distances[i - 2][j - 2] + 1);
      }
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
